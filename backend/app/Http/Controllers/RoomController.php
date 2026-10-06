<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Division;
use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        return Room::where('is_active', true)
            ->orderBy('building')->orderBy('floor')->orderBy('room_name')
            ->get();
    }

    /**
     * FR-RM-02 — cek slot kosong real-time untuk satu ruangan atau semua ruangan.
     */
    public function availability(Request $request)
    {
        $validated = $request->validate([
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'room_id' => ['nullable', 'exists:rooms,id'],
        ]);

        $busyQuery = RoomBooking::whereIn('status', ['Approved', 'Pending'])
            ->where('start_time', '<', $validated['end_time'])
            ->where('end_time', '>', $validated['start_time']);

        if (! empty($validated['room_id'])) {
            $busyQuery->where('room_id', $validated['room_id']);
        }

        $busyRoomIds = $busyQuery->pluck('room_id')->unique();

        return Room::where('is_active', true)
            ->when(! empty($validated['room_id']), fn ($q) => $q->where('id', $validated['room_id']))
            ->get()
            ->map(fn ($room) => [
                ...$room->toArray(),
                'is_available' => ! $busyRoomIds->contains($room->id),
            ]);
    }

    /**
     * Daftar booking. Pengelola ruangan melihat semua (bisa filter ?status=Pending),
     * user lain hanya booking miliknya sendiri.
     */
    public function bookings(Request $request)
    {
        $query = RoomBooking::query()->with(['room', 'host', 'meeting:id,room_booking_id,status']);

        if (! $request->user()->canManageRooms()) {
            $query->where('user_id', $request->user()->id);
        }

        if ($status = $request->query('status')) {
            $query->whereIn('status', (array) $status);
        }

        return $query->orderByDesc('start_time')->paginate($request->query('per_page', 15));
    }

    /**
     * FR-RM-03, FR-RM-04 — buat booking dan cegah bentrok.
     * Booking user biasa masuk 'Pending' dan menunggu pengelola ruangan.
     * Booking pengelola ruangan sendiri langsung 'Approved'.
     * Draf notulen (FR-RM-05) baru dibuat saat booking Approved.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => ['required', Rule::exists('rooms', 'id')->where('is_active', true)],
            'title' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'purpose' => ['nullable', 'string'],
            'attendee_user_ids' => ['nullable', 'array'],
            'attendee_user_ids.*' => ['exists:users,id'],
            'approver_id' => ['nullable', 'exists:users,id'],
        ]);

        // FR-RM-04: tolak kalau bentrok dengan booking Approved/Pending lain di ruangan sama
        if ($this->hasClash($validated['room_id'], $validated['start_time'], $validated['end_time'])) {
            throw ValidationException::withMessages([
                'room_id' => ['Ruangan sudah dipakai pada rentang waktu tersebut.'],
            ]);
        }

        $autoApprove = $request->user()->canManageRooms();

        $booking = DB::transaction(function () use ($validated, $request, $autoApprove) {
            $booking = RoomBooking::create([
                'room_id' => $validated['room_id'],
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => $autoApprove ? 'Approved' : 'Pending',
                'purpose' => $validated['purpose'] ?? null,
                'meeting_approver_id' => $validated['approver_id'] ?? null,
                'invitee_ids' => $validated['attendee_user_ids'] ?? [],
            ]);

            if ($autoApprove) {
                $this->createDraftMeeting($booking);
            }

            return $booking;
        });

        return response()->json(
            $booking->fresh(['room', 'meeting.attendees']),
            201
        );
    }

    /**
     * Pengelola ruangan menyetujui booking Pending, lalu draf notulen dibuat otomatis.
     */
    public function approve(Request $request, RoomBooking $roomBooking)
    {
        abort_unless($request->user()->canManageRooms(), 403, 'Hanya pengelola ruangan yang boleh menyetujui booking.');
        abort_unless($roomBooking->status === 'Pending', 422, 'Hanya booking berstatus Pending yang bisa disetujui.');

        if ($this->hasClash(
            $roomBooking->room_id,
            $roomBooking->start_time,
            $roomBooking->end_time,
            $roomBooking->id
        )) {
            throw ValidationException::withMessages([
                'room_id' => ['Ruangan sudah dipakai pada rentang waktu tersebut.'],
            ]);
        }

        DB::transaction(function () use ($roomBooking) {
            $roomBooking->update(['status' => 'Approved', 'review_note' => null]);

            $this->createDraftMeeting($roomBooking);

            AuditLog::record(
                'APPROVE_BOOKING',
                RoomBooking::class,
                $roomBooking->id,
                ['status' => 'Pending'],
                ['status' => 'Approved']
            );
        });

        // TODO: notifikasi in-app ke host bahwa booking disetujui

        // Pengelola ruangan tidak perlu (dan tidak boleh) melihat isi notulen,
        // jadi relasi meeting hanya memuat id & status.
        return $roomBooking->fresh(['room', 'meeting:id,room_booking_id,status']);
    }

    /**
     * Pengelola ruangan menolak booking Pending (catatan wajib).
     */
    public function reject(Request $request, RoomBooking $roomBooking)
    {
        abort_unless($request->user()->canManageRooms(), 403, 'Hanya pengelola ruangan yang boleh menolak booking.');
        abort_unless($roomBooking->status === 'Pending', 422, 'Hanya booking berstatus Pending yang bisa ditolak.');

        $validated = $request->validate([
            'review_note' => ['required', 'string', 'max:1000'],
        ]);

        $roomBooking->update([
            'status' => 'Rejected',
            'review_note' => $validated['review_note'],
        ]);

        AuditLog::record(
            'REJECT_BOOKING',
            RoomBooking::class,
            $roomBooking->id,
            ['status' => 'Pending'],
            ['status' => 'Rejected', 'review_note' => $validated['review_note']]
        );

        // TODO: notifikasi in-app ke host bahwa booking ditolak

        return $roomBooking->fresh(['room']);
    }

    /**
     * Batalkan booking.
     * - Host / SuperAdmin: draf notulen terkait ikut dihapus selama masih Draft.
     *   Draf yang sudah berisi data butuh konfirmasi ?force=1. Notulen yang
     *   sudah diajukan/disetujui menahan pembatalan.
     * - Pengelola ruangan (bukan host): hanya booking yang dibatalkan. Notulen
     *   dibiarkan utuh dan hanya dilepas dari booking, karena pengelola ruangan
     *   tidak boleh mengubah data notulen.
     */
    public function destroy(Request $request, RoomBooking $roomBooking)
    {
        $user = $request->user();
        $isOwnerOrSuper = $roomBooking->user_id === $user->id || $user->isSuperAdmin();

        abort_unless($isOwnerOrSuper || $user->canManageRooms(), 403);

        abort_unless(
            in_array($roomBooking->status, ['Pending', 'Approved'], true),
            422,
            'Booking ini sudah dibatalkan atau ditolak.'
        );

        $meeting = $roomBooking->meeting;
        $deleteMeeting = $meeting && $isOwnerOrSuper;

        if ($deleteMeeting) {
            abort_unless(
                $meeting->status === 'Draft',
                422,
                'Notulen sudah diajukan atau disetujui. Booking tidak bisa dibatalkan; hapus notulennya terlebih dahulu (SuperAdmin).'
            );

            if ($this->meetingHasContent($meeting) && ! $request->boolean('force')) {
                return response()->json([
                    'message' => 'Draf notulen sudah berisi data. Kirim ulang dengan force=1 untuk membatalkan booking dan menghapus draf.',
                ], 409);
            }
        }

        DB::transaction(function () use ($roomBooking, $meeting, $deleteMeeting) {
            $oldStatus = $roomBooking->status;

            if ($deleteMeeting) {
                $meeting->delete(); // anak (peserta, pembahasan, action item) ikut terhapus via cascade
            } elseif ($meeting) {
                $meeting->update(['room_booking_id' => null]);
            }

            $roomBooking->update(['status' => 'Cancelled']);

            AuditLog::record(
                'CANCEL_BOOKING',
                RoomBooking::class,
                $roomBooking->id,
                ['status' => $oldStatus, 'meeting_deleted' => $deleteMeeting],
                ['status' => 'Cancelled']
            );
        });

        return response()->noContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private function hasClash($roomId, $start, $end, ?int $exceptBookingId = null): bool
    {
        return RoomBooking::where('room_id', $roomId)
            ->whereIn('status', ['Approved', 'Pending'])
            ->when($exceptBookingId, fn ($q) => $q->where('id', '!=', $exceptBookingId))
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->exists();
    }

    /**
     * FR-RM-05: draf notulen + peserta terundang dari booking yang Approved.
     */
    private function createDraftMeeting(RoomBooking $booking): Meeting
    {
        $room = Room::find($booking->room_id);
        $host = $booking->host()->first();

        $meeting = Meeting::create([
            'room_booking_id' => $booking->id,
            'division_id' => $host->division_id,
            'notulis_id' => $host->id,
            'approver_id' => $booking->meeting_approver_id,
            'meeting_title' => $booking->title,
            'meeting_date' => $booking->start_time->toDateString(),
            'start_time' => $booking->start_time->toTimeString(),
            'end_time' => $booking->end_time->toTimeString(),
            'location' => "{$room->room_name} ({$room->building} Lt. {$room->floor})",
            'discussion_mode' => 'manual',
            'status' => 'Draft',
            'visibility' => 'Division',
        ]);

        foreach ($booking->invitee_ids ?? [] as $userId) {
            $invitedUser = User::find($userId);

            if (! $invitedUser) {
                continue;
            }

            // Catatan: $invitedUser->division adalah kolom teks lama (v1),
            // bukan relasi. Nama divisi resmi diambil lewat division_id.
            $divisionName = $invitedUser->division_id
                ? Division::whereKey($invitedUser->division_id)->value('division_name')
                : null;

            $meeting->attendees()->create([
                'user_id' => $invitedUser->id,
                'name' => $invitedUser->full_name,
                'division' => $divisionName ?? $invitedUser->division,
                'role_in_meeting' => 'Participant',
                'is_present' => false,
            ]);

            // TODO: kirim notifikasi undangan rapat ke $invitedUser (lihat FR-ATT-01)
        }

        return $meeting;
    }

    private function meetingHasContent(Meeting $meeting): bool
    {
        return $meeting->actionItems()->exists()
            || $meeting->allDiscussionNotes()->exists()
            || $meeting->attachments()->exists()
            || filled($meeting->agenda)
            || filled($meeting->background)
            || filled($meeting->conclusion)
            || filled($meeting->discussion_manual_content);
    }
}