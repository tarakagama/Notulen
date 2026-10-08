<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateActionItemStatusRequest;
use App\Models\ActionItem;
use Illuminate\Http\Request;

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
     */
    public function updateStatus(UpdateActionItemStatusRequest $request, ActionItem $actionItem)
    {
        $data = $request->validated();

        if ($data['status'] === 'Completed') {
            $data['completed_at'] = now();
        } else {
            $data['completed_at'] = null;
        }

        $actionItem->update($data);

        return $actionItem;
    }

    public function destroy(ActionItem $actionItem)
    {
        $this->authorize('delete', $actionItem); // FR-4.3: admin only

        $actionItem->delete();

        return response()->noContent();
    }
}