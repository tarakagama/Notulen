<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    public $timestamps = false;

    // Kehadiran cukup dicatat lewat satu field: is_present
    // (attendance_status dari FSD sengaja tidak dipakai).
    protected $fillable = [
        'meeting_id',
        'user_id',
        'name',
        'division',
        'role_in_meeting',
        'is_present',
    ];

    protected function casts(): array
    {
        return ['is_present' => 'boolean'];
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}