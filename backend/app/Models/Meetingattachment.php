<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAttachment extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'uploaded_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'meeting_id',
        'file_type',
        'file_path',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}