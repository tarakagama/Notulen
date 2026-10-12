<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;

class AttendeeController extends Controller
{
    public function store(Request $request, Meeting $meeting)
    {
        $this->authorize('update', $meeting);

        $validated = $request->validate([
            // Peserta internal: cukup kirim user_id. Nama & divisi diambil dari data user.
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            // Tamu eksternal: nama wajib kalau tidak ada user_id.
            'name' => ['required_without:user_id', 'nullable', 'string', 'max:150'],
            'division' => ['nullable', 'string', 'max:150'],
            'is_present' => ['nullable', 'boolean'],
        ]);

        if (! empty($validated['user_id'])) {
            $user = User::findOrFail($validated['user_id']);

            if ($meeting->attendees()->where('user_id', $user->id)->exists()) {
                return response()->json(['message' => 'Peserta ini sudah ada di daftar hadir.'], 422);
            }

            // Nama & divisi dari data user, bukan dari input klien (mencegah pemalsuan).
            $validated['name'] = $user->full_name;
            $validated['division'] = $user->division_id
                ? Division::whereKey($user->division_id)->value('division_name')
                : $user->division;
            $validated['role_in_meeting'] = 'Participant';
        }

        $attendee = $meeting->attendees()->create($validated);

        // Peserta internal yang ditambahkan orang lain diberi tahu.
        if (isset($user) && $user->id !== $request->user()->id) {
            AppNotification::send(
                $user,
                'meeting.attendee_added',
                'Kamu ditambahkan sebagai peserta rapat',
                $meeting->meeting_title,
                '/notulen/'.$meeting->id
            );
        }

        return response()->json($attendee, 201);
    }

    public function destroy(Meeting $meeting, MeetingAttendee $attendee)
    {
        $this->authorize('update', $meeting);
        abort_unless($attendee->meeting_id === $meeting->id, 404);
        $attendee->delete();

        return response()->noContent();
    }
}