<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomBooking extends Model
{
    protected $fillable = [
        'room_id', 'user_id', 'title', 'start_time', 'end_time', 'status', 'purpose',
        'meeting_approver_id', 'invitee_ids', 'review_note',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'invitee_ids' => 'array',
        ];
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function host()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function meeting()
    {
        return $this->hasOne(Meeting::class);
    }
}