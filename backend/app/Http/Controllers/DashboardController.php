<?php

namespace App\Http\Controllers;

use App\Models\ActionItem;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * FR-3.1, FR-3.3: rekap jumlah action item per status, bisa difilter
     * per divisi (lewat relasi PIC), PIC, dan rentang periode (deadline).
     * Hanya menghitung action item dari notulen yang boleh dilihat user.
     * Overdue dihitung dari deadline, bukan dari kolom status.
     */
    public function summary(Request $request)
    {
        $today = ActionItem::today();

        $row = $this->baseQuery($request)
            ->selectRaw(
                "coalesce(sum(status = 'Completed'), 0) as completed,
                 coalesce(sum(status != 'Completed' and deadline < ?), 0) as overdue,
                 coalesce(sum(status = 'Open' and deadline >= ?), 0) as open_count,
                 coalesce(sum(status = 'In Progress' and deadline >= ?), 0) as in_progress",
                [$today, $today, $today]
            )
            ->first();

        $open = (int) $row->open_count;
        $inProgress = (int) $row->in_progress;
        $overdue = (int) $row->overdue;
        $completed = (int) $row->completed;

        return [
            'open' => $open,
            'in_progress' => $inProgress,
            'overdue' => $overdue,
            'completed' => $completed,
            'total' => $open + $inProgress + $overdue + $completed,
        ];
    }

    /**
     * Top-N action item paling overdue (deadline paling lama lewat duluan),
     * dipakai widget "perlu perhatian" di dashboard.
     */
    public function topOverdue(Request $request)
    {
        return $this->baseQuery($request)
            ->overdue()
            ->with([
                'pic:id,full_name',
                'meeting:id,meeting_title,meeting_date',
            ])
            ->orderBy('deadline') // paling lama lewat duluan
            ->limit((int) $request->query('limit', 5))
            ->get(['id', 'meeting_id', 'description', 'pic_id', 'deadline', 'priority', 'status']);
    }

    private function baseQuery(Request $request)
    {
        $query = ActionItem::query()
            ->whereHas('meeting', fn ($q) => $q->visibleTo($request->user()));

        // Filter divisi lewat PIC. 'division' = kolom teks lama (v1),
        // 'division_id' = divisi resmi (v2).
        if ($division = $request->query('division')) {
            $query->whereHas('pic', fn ($q) => $q->where('division', $division));
        }

        if ($divisionId = $request->query('division_id')) {
            $query->whereHas('pic', fn ($q) => $q->where('division_id', $divisionId));
        }

        if ($picId = $request->query('pic_id')) {
            $query->where('pic_id', $picId);
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('deadline', '>=', $from);
        }

        if ($to = $request->query('date_to')) {
            $query->whereDate('deadline', '<=', $to);
        }

        return $query;
    }
}