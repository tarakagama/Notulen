<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'description',
        'pic_id',
        'deadline',
        'priority',
        'status',
        'completion_note',
        'source',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }

    // ── Scopes berguna untuk FR-3.x (dashboard & "Tugas Saya") ──────────

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'Completed')
            ->where('deadline', '<', now()->toDateString());
    }

    public function scopeForPic($query, int $userId)
    {
        return $query->where('pic_id', $userId);
    }
}