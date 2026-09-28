<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'meeting_id',
        'name',
        'division',
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
}