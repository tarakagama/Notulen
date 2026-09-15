<?php

namespace App\Http\Controllers;

use App\Models\ActionItem;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * FR-3.1, FR-3.3: rekap jumlah action item per status, bisa difilter
     * per divisi (lewat relasi PIC), PIC, dan rentang periode (deadline).
     */
    public function summary(Request $request)
    {
        $query = ActionItem::query();

        if ($division = $request->query('division')) {
            $query->whereHas('pic', fn ($q) => $q->where('division', $division));
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

        $counts = (clone $query)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'open' => $counts->get('Open', 0),
            'in_progress' => $counts->get('In Progress', 0),
            'overdue' => $counts->get('Overdue', 0),
            'completed' => $counts->get('Completed', 0),
            'total' => $counts->sum(),
        ];
    }

    /**
     * Top-N action item paling overdue (deadline paling lama lewat duluan),
     * dipakai widget "perlu perhatian" di dashboard.
     */
    public function topOverdue(Request $request)
    {
        $query = ActionItem::where('status', 'Overdue')->with(['pic', 'meeting']);

        if ($division = $request->query('division')) {
            $query->whereHas('pic', fn ($q) => $q->where('division', $division));
        }

        if ($picId = $request->query('pic_id')) {
            $query->where('pic_id', $picId);
        }

        return $query->orderBy('deadline') // paling lama lewat duluan
            ->limit($request->query('limit', 5))
            ->get(['id', 'meeting_id', 'description', 'pic_id', 'deadline', 'priority']);
    }
}