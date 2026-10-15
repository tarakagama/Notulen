<?php

namespace App\Http\Controllers;

use App\Http\Requests\RejectMeetingRequest;
use App\Http\Requests\StoreMeetingRequest;
use App\Http\Requests\UpdateMeetingRequest;
use App\Models\ActionItem;
use App\Models\DiscussionNote;
use App\Models\AuditLog;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeetingController extends Controller
{
    /**
     * FR-5.1-5.4: daftar notulensi dengan search, filter, pagination.
     */
    public function index(Request $request)
    {
        $query = Meeting::query()
        ->visibleTo($request->user())
        ->with(['notulis', 'approver']);

        if ($search = $request->query('search')) {
            $query->where('meeting_title', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            // Dukung filter satu status ('Approved') atau beberapa sekaligus
            // (status[]=Approved&status[]=Rejected) — dipakai oleh tab "Riwayat".
            $query->whereIn('status', (array) $status);
        }

        if ($notulisId = $request->query('notulis_id')) {
            $query->where('notulis_id', $notulisId);
        }

        if ($meetingType = $request->query('meeting_type')) {
            $query->where('meeting_type', $meetingType);
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('meeting_date', '>=', $from);
        }

        if ($to = $request->query('date_to')) {
            $query->whereDate('meeting_date', '<=', $to);
        }

        return $query->orderByDesc('meeting_date')
            ->paginate($request->query('per_page', 15));
    }

    public function show(Meeting $meeting)
    {
        $this->authorize('view', $meeting);

        return $meeting->load([
            'notulis',
            'approver',
            'attendees',
            'discussionNotes.childNotesRecursive',
            'actionItems.pic',
            'attachments',
        ]);
    }

    // Kolom yang dicatat sebagai jejak audit saat notulen diubah setelah unlock (NFR-AUD-01).
    private const TRACKED_FIELDS = [
        'meeting_title', 'meeting_type', 'meeting_date', 'start_time', 'end_time',
        'location', 'agenda', 'background', 'conclusion', 'approver_id',
        'discussion_mode', 'discussion_manual_content', 'visibility',
    ];

    private function snapshot(Meeting $meeting): array
    {
        return $meeting->only(self::TRACKED_FIELDS) + [
            'jumlah_action_item' => $meeting->actionItems()->count(),
            'jumlah_peserta' => $meeting->attendees()->count(),
            'jumlah_catatan_pembahasan' => $meeting->allDiscussionNotes()->count(),
        ];
    }

  /**
     * FR-APP-03 — Notulis mengajukan permintaan Unlock pada notulen Approved.
     */
    public function requestUnlock(Request $request, Meeting $meeting)
    {
        $this->authorize('requestUnlock', $meeting);

        $validated = $request->validate([
            'unlock_reason' => ['required', 'string', 'max:1000'],
        ]);

        $old = $meeting->only(['status', 'unlock_request_status', 'unlock_reason']);

        $meeting->update([
            'unlock_request_status' => 'Requested',
            'unlock_reason' => $validated['unlock_reason'],
            'unlock_response_note' => null,
        ]);

        AuditLog::record(
            'REQUEST_UNLOCK',
            Meeting::class,
            $meeting->id,
            $old,
            $meeting->only(['status', 'unlock_request_status', 'unlock_reason'])
        );

        // TODO: kirim notifikasi in-app ke approver (FR-APP-03)
        // Beri tahu approver; kalau belum ditunjuk, ke SuperAdmin.
        $approvers = $meeting->approver_id
            ? collect([$meeting->approver])
            : User::where('is_active', true)->where('global_role', 'SuperAdmin')->get();

        AppNotification::send(
            $approvers,
            'meeting.unlock_requested',
            'Permohonan unlock notulen',
            "{$meeting->meeting_title}: {$validated['unlock_reason']}",
            '/notulen/'.$meeting->id
        );

        return $meeting->fresh();
    }

    /**
     * FR-APP-03 — Approver menyetujui permintaan Unlock.
     * Status notulen kembali ke Draft, tercatat di audit_logs.
     */
    public function approveUnlock(Request $request, Meeting $meeting)
    {
        $this->authorize('approveUnlock', $meeting);

        $old = $meeting->only(['status', 'unlock_request_status']);

        $meeting->update([
            'status' => 'Draft',
            'unlock_request_status' => 'Approved',
            'unlock_response_note' => null,
        ]);

        AuditLog::record(
            'APPROVE_UNLOCK',
            Meeting::class,
            $meeting->id,
            $old,
            $meeting->only(['status', 'unlock_request_status'])
        );

        if ($meeting->notulis_id !== $request->user()->id) {
            AppNotification::send(
                $meeting->notulis,
                'meeting.unlocked',
                'Notulen dibuka kembali',
                $meeting->meeting_title,
                '/notulen/'.$meeting->id
            );
        }

        return $meeting->fresh();
    }

        /**
     * Approver (atau SuperAdmin) menolak permohonan unlock. Notulen tetap Approved dan terkunci;
     * notulis boleh mengajukan lagi. Alasan penolakan wajib dan tampil di notulen.
     */
    public function rejectUnlock(Request $request, Meeting $meeting)
    {
        $this->authorize('rejectUnlock', $meeting);

        $validated = $request->validate([
            'response_note' => ['required', 'string', 'max:1000'],
        ]);

        $old = $meeting->only(['status', 'unlock_request_status', 'unlock_reason']);

        $meeting->update([
            'unlock_request_status' => 'Rejected',
            'unlock_response_note' => $validated['response_note'],
        ]);

        AuditLog::record(
            'REJECT_UNLOCK',
            Meeting::class,
            $meeting->id,
            $old,
            $meeting->only(['status', 'unlock_request_status', 'unlock_response_note'])
        );

        if ($meeting->notulis_id !== $request->user()->id) {
            AppNotification::send(
                $meeting->notulis,
                'meeting.unlock_rejected',
                'Permohonan unlock ditolak',
                "{$meeting->meeting_title}: {$validated['response_note']}",
                '/notulen/'.$meeting->id
            );
        }

        return $meeting->fresh();
    }

    /**
     * Riwayat aksi sensitif pada notulen ini (unlock, perubahan setelah unlock, approval ulang).
     * Hanya untuk notulis, approver, dan SuperAdmin.
     */
    public function history(Meeting $meeting)
    {
        $this->authorize('viewHistory', $meeting);

        return AuditLog::where('entity_type', Meeting::class)
            ->where('entity_id', $meeting->id)
            ->with('user:id,full_name')
            ->orderByDesc('id')
            ->get()
            ->map(function ($log) {
                $old = $log->old_values ?? [];
                $new = $log->new_values ?? [];

                // Daftar kolom yang berubah hanya relevan untuk perubahan isi setelah unlock.
                $changed = $log->action === 'UPDATE_AFTER_UNLOCK'
                    ? collect(array_keys($new))
                        ->filter(fn ($key) => ($old[$key] ?? null) != ($new[$key] ?? null))
                        ->values()
                        ->all()
                    : [];

                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user' => $log->user?->full_name,
                    'created_at' => $log->created_at,
                    'detail' => match ($log->action) {
                        'REQUEST_UNLOCK' => $new['unlock_reason'] ?? null,
                        'REJECT_UNLOCK' => $new['unlock_response_note'] ?? null,
                        default => null,
                    },
                    'changed_fields' => $changed,
                ];
            });
    }

    /**
     * FR-APP-04 — SuperAdmin override tanpa menunggu Approver.
     * Selalu tercatat penuh di audit_logs.
     */
    public function forceUnlock(Request $request, Meeting $meeting)
    {
        $this->authorize('forceUnlock', Meeting::class);

        abort_unless(
            $meeting->status === 'Approved',
            422,
            'Hanya notulen berstatus Approved yang bisa di-unlock.'
        );

        $old = $meeting->only(['status', 'unlock_request_status']);

        $meeting->update([
            'status' => 'Draft',
            'unlock_request_status' => 'Approved',
            'unlock_response_note' => null,
        ]);

        AuditLog::record(
            'FORCE_UNLOCK',
            Meeting::class,
            $meeting->id,
            $old,
            $meeting->only(['status', 'unlock_request_status'])
        );

        if ($meeting->notulis_id !== $request->user()->id) {
            AppNotification::send(
                $meeting->notulis,
                'meeting.unlocked',
                'Notulen dibuka kembali',
                $meeting->meeting_title,
                '/notulen/'.$meeting->id
            );
        }

        return $meeting->fresh();
    }

    /**
     * FR-1.1-1.7: buat notulen baru, sekaligus attendees/notes/action items
     * kalau dikirim bersamaan. Selalu mulai dari status Draft.
     */
    public function store(StoreMeetingRequest $request)
    {
        $meeting = DB::transaction(function () use ($request) {
            $meeting = Meeting::create([
                ...$request->safe()->only([
                    'meeting_title', 'meeting_type', 'meeting_date',
                    'start_time', 'end_time', 'location', 'agenda',
                    'background', 'conclusion', 'approver_id',
                    'discussion_mode', 'discussion_manual_content', 'visibility',
                ]),
                'notulis_id' => $request->user()->id,
                'division_id' => $request->user()->division_id,
                'status' => 'Draft',
            ]);

            $this->syncAttendees($meeting, $request->input('attendees', []));

            // Kalau mode manual, Discussion_Notes tidak dipakai sama sekali —
            // isi Pembahasan tersimpan di kolom discussion_manual_content.
            if (($request->input('discussion_mode') ?? 'outline') !== 'manual') {
                $this->syncDiscussionNotes($meeting, $request->input('discussion_notes', []));
            }

            $this->syncActionItems($meeting, $request->input('action_items', []));

            return $meeting;
        });

        return $meeting->load(['attendees', 'discussionNotes', 'actionItems']);
    }

    /**
     * FR-1.8: hanya notulis pemilik, hanya saat Draft/Rejected
     * (dicek di UpdateMeetingRequest::authorize via MeetingPolicy).
     */
    public function update(UpdateMeetingRequest $request, Meeting $meeting)
    {
    // Notulen yang dibuka lewat unlock: setiap perubahan isinya dicatat (NFR-AUD-01).
        $reopened = $meeting->unlock_request_status === 'Approved';
        $before = $reopened ? $this->snapshot($meeting) : [];
        DB::transaction(function () use ($request, $meeting) {
            $meeting->update($request->safe()->only([
                'meeting_title', 'meeting_type', 'meeting_date',
                'start_time', 'end_time', 'location', 'agenda',
                'background', 'conclusion', 'approver_id',
                'discussion_mode', 'discussion_manual_content', 'visibility',
            ]));

            if ($request->has('attendees')) {
                $meeting->attendees()->delete();
                $this->syncAttendees($meeting, $request->input('attendees', []));
            }

            $isManual = ($request->input('discussion_mode') ?? 'outline') === 'manual';

            if ($isManual) {
                // Pindah/tetap di mode manual: Discussion_Notes lama (kalau
                // ada, dari waktu masih outline) dibersihkan biar konsisten.
                $meeting->allDiscussionNotes()->delete();
            } elseif ($request->has('discussion_notes')) {
                $meeting->allDiscussionNotes()->delete();
                $this->syncDiscussionNotes($meeting, $request->input('discussion_notes', []));
            }

            if ($request->has('action_items')) {
                $meeting->actionItems()->delete();
                $this->syncActionItems($meeting, $request->input('action_items', []));
            }
        });

            if ($reopened) {
            $after = $this->snapshot($meeting->fresh());

            if (json_encode($before) !== json_encode($after)) {
                AuditLog::record('UPDATE_AFTER_UNLOCK', Meeting::class, $meeting->id, $before, $after);
            }
        }

        return $meeting->fresh(['attendees', 'discussionNotes', 'actionItems']);
    }

    public function destroy(Meeting $meeting)
    {
        $this->authorize('delete', $meeting); // FR-4.3: admin only

        $meeting->delete();

        return response()->noContent();
    }

    /**
     * FR-1.7: Draft -> Waiting Approval.
     */
    public function submit(Meeting $meeting)
    {
        $this->authorize('submit', $meeting);

        $meeting->update(['status' => 'Waiting Approval']);

        return $meeting;
    }

    /**
     * FR-2.1: daftar notulen Waiting Approval milik approver ini.
     */
    public function pendingApprovals(Request $request)
    {
        return Meeting::where('approver_id', $request->user()->id)
            ->where('status', 'Waiting Approval')
            ->with('notulis')
            ->orderByDesc('created_at')
            ->paginate($request->query('per_page', 15));
    }

    /**
     * FR-2.2: approve -> notifikasi ke seluruh PIC action item terkait.
     */
    public function approve(Meeting $meeting)
    {
        $this->authorize('approve', $meeting);

        // Notulen yang sebelumnya dibuka lewat unlock dan sekarang disetujui ulang dicatat di audit log.
        $wasReopened = $meeting->unlock_request_status === 'Approved';

        $meeting->update([
            'status' => 'Approved',
            'approved_at' => now(),
            'revision_note' => null,
            'unlock_request_status' => 'None',
            'unlock_reason' => null,
            'unlock_response_note' => null,
        ]);

        if ($wasReopened) {
            AuditLog::record(
                'REAPPROVE_MEETING',
                Meeting::class,
                $meeting->id,
                ['status' => 'Waiting Approval'],
                ['status' => 'Approved']
            );
        }

        if ($meeting->notulis_id !== auth()->id()) {
            AppNotification::send(
                $meeting->notulis,
                'meeting.approved',
                'Notulen disetujui',
                $meeting->meeting_title,
                '/notulen/'.$meeting->id
            );
        }

        return $meeting;
    }

    /**
     * FR-2.3: reject + catatan revisi, notulen kembali bisa diedit.
     */
    public function reject(RejectMeetingRequest $request, Meeting $meeting)
    {
        $meeting->update([
            'status' => 'Rejected',
            'revision_note' => $request->validated('revision_note'),
        ]);

        return $meeting;
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private function syncAttendees(Meeting $meeting, array $attendees): void
    {
        foreach ($attendees as $attendee) {
            MeetingAttendee::create([
                ...\Illuminate\Support\Arr::only($attendee, ['name', 'division', 'is_present']),
                'meeting_id' => $meeting->id,
            ]);
        }
    }

    /**
     * FR-1.3: simpan Pembahasan nested. Input berupa flat array dengan
     * 'temp_id' (id sementara dari frontend) supaya parent_note_id bisa
     * di-remap ke id asli hasil insert.
     */
    private function syncDiscussionNotes(Meeting $meeting, array $notes): void
    {
        $idMap = []; // temp_id (frontend) => note_id (db)

        // Insert berurutan: root dulu (parent_note_id null / belum di-map),
        // baru child, supaya id parent sudah pasti ada sebelum dipakai.
        $remaining = $notes;
        $maxPasses = count($notes) + 1;

        while (! empty($remaining) && $maxPasses-- > 0) {
            $stillRemaining = [];

            foreach ($remaining as $note) {
                $tempParent = $note['parent_note_id'] ?? null;

                if ($tempParent !== null && ! array_key_exists($tempParent, $idMap)) {
                    $stillRemaining[] = $note;
                    continue;
                }

                $created = DiscussionNote::create([
                    'meeting_id' => $meeting->id,
                    'parent_note_id' => $tempParent !== null ? $idMap[$tempParent] : null,
                    'order_in_level' => $note['order_in_level'],
                    'content' => $note['content'],
                    'speaker_group' => $note['speaker_group'] ?? null,
                    'category' => $note['category'] ?? null,
                ]);

                if (isset($note['temp_id'])) {
                    $idMap[$note['temp_id']] = $created->id;
                }
            }

            $remaining = $stillRemaining;
        }
    }

    private function syncActionItems(Meeting $meeting, array $actionItems): void
    {
        // FR-1.6: array boleh kosong, tidak ada yang wajib diinsert.
        foreach ($actionItems as $item) {
            ActionItem::create([
                ...\Illuminate\Support\Arr::only($item, ['description', 'pic_id', 'deadline', 'priority']),
                'source' => $item['source'] ?? 'Manual',
                'meeting_id' => $meeting->id,
            ]);
        }
    }
}