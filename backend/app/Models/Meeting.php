<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_title',
        'meeting_type',
        'meeting_date',
        'start_time',
        'end_time',
        'location',
        'agenda',
        'background',
        'conclusion',
        'discussion_mode',
        'discussion_manual_content',
        'status',
        'notulis_id',
        'approver_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'meeting_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function notulis()
    {
        return $this->belongsTo(User::class, 'notulis_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    /**
     * Hanya root notes (top-level). Anak-anaknya diakses via
     * DiscussionNote::childNotes() secara rekursif dari sini.
     */
    public function discussionNotes()
    {
        return $this->hasMany(DiscussionNote::class)
            ->whereNull('parent_note_id')
            ->orderBy('order_in_level');
    }

    /**
     * Semua notes milik rapat ini (flat, semua level).
     */
    public function allDiscussionNotes()
    {
        return $this->hasMany(DiscussionNote::class);
    }

    public function actionItems()
    {
        return $this->hasMany(ActionItem::class);
    }

    public function attachments()
    {
        return $this->hasMany(MeetingAttachment::class);
    }
}