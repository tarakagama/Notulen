<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscussionNote extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'meeting_id',
        'parent_note_id',
        'order_in_level',
        'content',
        'speaker_group',
        'category',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function parentNote()
    {
        return $this->belongsTo(DiscussionNote::class, 'parent_note_id');
    }

    /**
     * Anak langsung (satu level di bawah), terurut sesuai order_in_level.
     * Nomor tampilan (1/a/1)/1.) dihitung di frontend berdasar depth,
     * BUKAN disimpan di DB (lihat project brief bagian 6).
     */
    public function childNotes()
    {
        return $this->hasMany(DiscussionNote::class, 'parent_note_id')
            ->orderBy('order_in_level');
    }

    /**
     * Rekursif: seluruh keturunan (anak, cucu, dst) dalam satu query,
     * berguna untuk load pohon lengkap sekaligus tanpa N+1.
     */
    public function childNotesRecursive()
    {
        return $this->childNotes()->with('childNotesRecursive');
    }
}