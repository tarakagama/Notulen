<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'room_name', 'building', 'floor', 'capacity', 'facilities', 'is_active',
        'pic_name', 'pic_user_id',
    ];

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    protected function casts(): array
    {
        return [
            'facilities' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function bookings()
    {
        return $this->hasMany(RoomBooking::class);
    }
}