<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\MeetingAttendee;
use Illuminate\Http\Request;

class AttendeeController extends Controller
{
    public function store(Request $request, Meeting $meeting)
    {
        $this->authorize('update', $meeting);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'division' => ['nullable', 'string', 'max:150'],
            'is_present' => ['nullable', 'boolean'],
        ]);

        $attendee = $meeting->attendees()->create($validated);

        return response()->json($attendee, 201);
    }

    public function destroy(Meeting $meeting, MeetingAttendee $attendee)
    {
        $this->authorize('update', $meeting);
        $attendee->delete();
        return response()->noContent();
    }
}