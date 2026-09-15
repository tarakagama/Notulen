<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateActionItemStatusRequest;
use App\Models\ActionItem;
use Illuminate\Http\Request;

class ActionItemController extends Controller
{
    /**
     * FR-3.4: "Tugas Saya" — seluruh action item milik user yang login,
     * lintas rapat.
     */
    public function myTasks(Request $request)
    {
        $query = ActionItem::forPic($request->user()->id)
            ->with('meeting:id,meeting_title,meeting_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
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