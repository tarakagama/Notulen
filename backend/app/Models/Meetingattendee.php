<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'meeting_id',
        'user_id',
        'external_name',
        'external_org',
        'role_in_meeting',
        'is_signed',
    ];

    protected function casts(): array
    {
        return [
            'is_signed' => 'boolean',
        ];
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Null kalau attendee eksternal (bukan user internal).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}