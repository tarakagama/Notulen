<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateActionItemStatusRequest;
use App\Models\ActionItem;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ActionItemController extends Controller
{
    /**
     * Daftar action item lintas rapat untuk halaman "Action Items" overview.
     * Hanya action item dari notulen yang boleh dilihat user (visibility).
     */
    public function index(Request $request)
    {
        $query = ActionItem::with([
            'pic:id,full_name,email,division,division_id,position_title',
            'meeting:id,meeting_title',
        ])->whereHas('meeting', fn ($q) => $q->visibleTo($request->user()));

        if ($status = $request->query('status')) {
            $query->effectiveStatus((array) $status);
        }

        if ($search = $request->query('search')) {
            $query->where('description', 'like', "%{$search}%");
        }

        if ($picId = $request->query('pic_id')) {
            $query->where('pic_id', $picId);
        }
        if ($divisionId = $request->query('division_id')) {
            $query->whereHas('pic', fn ($q) => $q->where('division_id', $divisionId));
        }

        return $query->orderBy('deadline')
            ->paginate($request->query('per_page', 15));
    }

    /**
     * FR-3.4: "Tugas Saya" — seluruh action item milik user yang login,
     * lintas rapat. Tugas yang ditunjuk ke seorang PIC selalu terlihat oleh
     * PIC itu sendiri; field meeting dibatasi (id, judul, tanggal).
     */
    public function myTasks(Request $request)
    {
        $query = ActionItem::forPic($request->user()->id)
            ->with('meeting:id,meeting_title,meeting_date');

        if ($status = $request->query('status')) {
            $query->effectiveStatus((array) $status);
        }

        return $query->orderBy('deadline')
            ->paginate($request->query('per_page', 15));
    }

    /**
     * FR-3.5: PIC update status + catatan penyelesaian.
     * Otorisasi (pic_id = current_user atau admin) dicek di
     * UpdateActionItemStatusRequest lewat ActionItemPolicy.
     *
     * Setiap perubahan dicatat di action_item_logs. Menandai selesai berarti
     * "menunggu verifikasi" oleh notulis/approver rapat; item yang sudah
     * diverifikasi dikunci (hanya SuperAdmin yang bisa mengubahnya lagi).
     */
    public function updateStatus(UpdateActionItemStatusRequest $request, ActionItem $actionItem)
    {
        $user = $request->user();

        abort_if(
            $actionItem->verified_at && ! $user->isSuperAdmin(),
            422,
            'Action item ini sudah diverifikasi dan tidak bisa diubah lagi.'
        );

        $data = $request->validated();
        $from = $actionItem->status;
        $to = $data['status'];
        $completing = $to === 'Completed';

        $data['completed_at'] = $completing ? now() : null;
        // Setiap perubahan status mengulang proses verifikasi dari awal.
        $data['verified_by'] = null;
        $data['verified_at'] = null;
        $data['verification_note'] = null;

        $actionItem->update($data);

        $action = $completing ? 'Completed' : ($from === 'Completed' ? 'Reopened' : 'Started');

        $actionItem->recordLog(
            $action,
            $user,
            $from,
            $to,
            $completing ? ($data['completion_note'] ?? null) : null,
            $completing ? $actionItem->daysFromDeadline() : null
        );

        if ($completing) {
            $this->notifyVerifiers($actionItem, $user);
        }

        return $actionItem->fresh();
    }

    /**
     * Action item berstatus Completed yang menunggu diverifikasi user ini
     * (notulis atau approver rapatnya; SuperAdmin melihat semuanya).
     */
    public function toVerify(Request $request)
    {
        $user = $request->user();

        $query = ActionItem::with([
            'pic:id,full_name',
            'meeting:id,meeting_title,meeting_date',
        ])
            ->where('status', 'Completed')
            ->whereNull('verified_at');

        if (! $user->isSuperAdmin()) {
            $query->where('pic_id', '!=', $user->id)
                ->whereHas('meeting', fn ($q) => $q
                    ->where('notulis_id', $user->id)
                    ->orWhere('approver_id', $user->id));
        }

        return $query->orderBy('completed_at')
            ->paginate($request->query('per_page', 50));
    }

    /**
     * Verifikasi penyelesaian: approved=true mengunci item sebagai selesai;
     * approved=false (alasan wajib) mengembalikannya ke "In Progress".
     */
    public function verify(Request $request, ActionItem $actionItem)
    {
        $user = $request->user();

        abort_unless(
            $this->canVerify($user, $actionItem),
            403,
            'Hanya notulis, approver rapat, atau Super Admin (bukan PIC-nya sendiri) yang boleh memverifikasi.'
        );

        abort_unless(
            $actionItem->status === 'Completed' && ! $actionItem->verified_at,
            422,
            'Action item ini tidak sedang menunggu verifikasi.'
        );

        $validated = $request->validate([
            'approved' => ['required', 'boolean'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $approved = $request->boolean('approved');
        $note = filled($validated['note'] ?? null) ? trim($validated['note']) : null;

        if (! $approved && $note === null) {
            throw ValidationException::withMessages([
                'note' => ['Alasan penolakan wajib diisi.'],
            ]);
        }

        if ($approved) {
            $actionItem->update([
                'verified_by' => $user->id,
                'verified_at' => now(),
                'verification_note' => $note,
            ]);

            $actionItem->recordLog('Verified', $user, 'Completed', 'Completed', $note);
        } else {
            $actionItem->update([
                'status' => 'In Progress',
                'completed_at' => null,
                'verified_by' => null,
                'verified_at' => null,
                'verification_note' => $note,
            ]);

            $actionItem->recordLog('VerificationRejected', $user, 'Completed', 'In Progress', $note);
        }

        if ($actionItem->pic_id !== $user->id) {
            AppNotification::send(
                $actionItem->pic,
                $approved ? 'action_item.verified' : 'action_item.rejected',
                $approved ? 'Penyelesaian disetujui' : 'Penyelesaian dikembalikan',
                $actionItem->description.($note ? ": {$note}" : ''),
                '/action-items'
            );
        }

        return $actionItem->fresh();
    }

    /**
     * Riwayat perubahan satu action item: PIC-nya, notulis/approver rapat, atau SuperAdmin.
     */
    public function logs(Request $request, ActionItem $actionItem)
    {
        $user = $request->user();

        abort_unless(
            $actionItem->pic_id === $user->id || $this->canVerify($user, $actionItem),
            403
        );

        return $actionItem->logs()
            ->with('user:id,full_name')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();
    }

    public function destroy(ActionItem $actionItem)
    {
        $this->authorize('delete', $actionItem); // FR-4.3: admin only

        $actionItem->delete();

        return response()->noContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /**
     * Notulis atau approver rapat (selain PIC-nya sendiri), atau SuperAdmin.
     */
    private function canVerify(User $user, ActionItem $item): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($item->pic_id === $user->id) {
            return false;
        }

        $meeting = $item->meeting;

        return $meeting
            && ($meeting->notulis_id === $user->id || $meeting->approver_id === $user->id);
    }

    private function notifyVerifiers(ActionItem $item, User $actor): void
    {
        $meeting = $item->meeting;

        if (! $meeting) {
            return;
        }

        $recipients = collect([$meeting->notulis, $meeting->approver])
            ->filter()
            ->unique('id')
            ->reject(fn ($u) => $u->id === $actor->id);

        AppNotification::send(
            $recipients,
            'action_item.pending_verification',
            'Action item menunggu verifikasi',
            "{$actor->full_name} menandai selesai: {$item->description}",
            '/action-items'
        );
    }
}