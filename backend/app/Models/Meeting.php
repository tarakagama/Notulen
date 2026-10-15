<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_booking_id',
        'division_id',
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
        'revision_note',
        'visibility',
        'unlock_request_status',
        'unlock_reason',
        'unlock_response_note',
        'source',
        'legacy_file_path',
        'legacy_text',
    ];

    protected function casts(): array
    {
        return [
            'meeting_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            // Terlibat langsung: selalu terlihat
            $q->where('notulis_id', $user->id)
                ->orWhere('approver_id', $user->id)
                ->orWhereHas('attendees', fn ($a) => $a->where('user_id', $user->id));

            // Approved + Public / Division (divisi sama)
            $q->orWhere(function (Builder $q2) use ($user) {
                $q2->where('status', 'Approved')
                    ->where(function (Builder $q3) use ($user) {
                        $q3->where('visibility', 'Public');

                        if ($user->division_id !== null) {
                            $q3->orWhere(fn ($q4) => $q4
                                ->where('visibility', 'Division')
                                ->where('division_id', $user->division_id));
                        }
                    });
            });

            // AdminDivisi: semua status di divisinya, kecuali Restricted
            if ($user->global_role === 'AdminDivisi' && $user->division_id !== null) {
                $q->orWhere(fn ($q5) => $q5
                    ->where('division_id', $user->division_id)
                    ->whereIn('visibility', ['Public', 'Division']));
            }
        });
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

    public function roomBooking()
    {
        return $this->belongsTo(RoomBooking::class);
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