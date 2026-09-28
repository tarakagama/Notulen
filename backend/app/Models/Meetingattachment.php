<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function url(): Attribute
    {
        return Attribute::get(fn () => \Illuminate\Support\Facades\Storage::disk('public')->url($this->file_path));
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}