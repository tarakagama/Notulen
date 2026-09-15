<?php

namespace App\Http\Controllers;

use App\Http\Requests\RejectMeetingRequest;
use App\Http\Requests\StoreMeetingRequest;
use App\Http\Requests\UpdateMeetingRequest;
use App\Models\ActionItem;
use App\Models\DiscussionNote;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeetingController extends Controller
{
    /**
     * FR-5.1-5.4: daftar notulensi dengan search, filter, pagination.
     */
    public function index(Request $request)
    {
        $query = Meeting::query()->with(['notulis', 'approver']);

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
            'attendees.user',
            'discussionNotes.childNotesRecursive',
            'actionItems.pic',
            'attachments',
        ]);
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
                    'discussion_mode', 'discussion_manual_content',
                ]),
                'notulis_id' => $request->user()->id,
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
        DB::transaction(function () use ($request, $meeting) {
            $meeting->update($request->safe()->only([
                'meeting_title', 'meeting_type', 'meeting_date',
                'start_time', 'end_time', 'location', 'agenda',
                'background', 'conclusion', 'approver_id',
                'discussion_mode', 'discussion_manual_content',
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

        $meeting->update([
            'status' => 'Approved',
            'approved_at' => now(),
            'revision_note' => null,
        ]);

        // TODO: kirim notifikasi email ke setiap PIC di $meeting->actionItems
        // (lihat NFR "Autentikasi" & rencana notifikasi email di PRD 5.3).

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
                'meeting_id' => $meeting->id,
                ...$attendee,
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
                'meeting_id' => $meeting->id,
                'source' => $item['source'] ?? 'Manual',
                ...collect($item)->except('source')->all(),
            ]);
        }
    }
}