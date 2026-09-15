<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use Barryvdh\DomPDF\Facade\Pdf;

class MeetingExportController extends Controller
{
    /**
     * FR-2.4: export notulen yang sudah Approved jadi PDF format resmi.
     */
    public function export(Meeting $meeting)
    {
        $this->authorize('export', $meeting);

        $meeting->load([
            'notulis',
            'approver',
            'attendees.user',
            'discussionNotes.childNotesRecursive',
            'actionItems.pic',
        ]);

        $pdf = Pdf::loadView('pdf.meeting-pdf', ['meeting' => $meeting])
            ->setPaper('a4', 'portrait');

        $filename = 'Notulen-' . str($meeting->meeting_title)->slug() . '-' . $meeting->id . '.pdf';

        return $pdf->download($filename);
    }
}