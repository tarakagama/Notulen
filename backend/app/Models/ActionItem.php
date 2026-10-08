<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActionItem extends Model
{
    use HasFactory;

    /**
     * Zona waktu bisnis untuk menentukan "hari ini" pada deadline (kolom DATE).
     * Sengaja tidak mengubah app.timezone global supaya timestamp lama tidak bergeser.
     */
    public const TIMEZONE = 'Asia/Jakarta';

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

    /**
     * status di database hanya Open / In Progress / Completed.
     * "Overdue" tidak disimpan, tapi dihitung dari deadline (effective_status).
     */
    protected $appends = ['effective_status'];

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

    public static function today(): string
    {
        return now(self::TIMEZONE)->toDateString();
    }

    protected function effectiveStatus(): Attribute
    {
        return Attribute::get(function () {
            if ($this->status === 'Completed') {
                return 'Completed';
            }

            if ($this->deadline && $this->deadline->toDateString() < self::today()) {
                return 'Overdue';
            }

            return $this->status;
        });
    }

    // ── Scopes untuk dashboard & "Tugas Saya" ───────────────────────────

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'Completed')
            ->whereDate('deadline', '<', self::today());
    }

    /**
     * Filter berdasarkan status efektif (Open, In Progress, Overdue, Completed).
     * Open / In Progress hanya yang deadline-nya belum lewat.
     */
    public function scopeEffectiveStatus($query, array $statuses)
    {
        $today = self::today();

        return $query->where(function ($q) use ($statuses, $today) {
            $any = false;

            foreach ($statuses as $s) {
                if ($s === 'Overdue') {
                    $q->orWhere(fn ($x) => $x->where('status', '!=', 'Completed')->whereDate('deadline', '<', $today));
                } elseif ($s === 'Completed') {
                    $q->orWhere('status', 'Completed');
                } elseif (in_array($s, ['Open', 'In Progress'], true)) {
                    $q->orWhere(fn ($x) => $x->where('status', $s)->whereDate('deadline', '>=', $today));
                } else {
                    continue;
                }

                $any = true;
            }

            if (! $any) {
                $q->whereRaw('1 = 0');
            }
        });
    }

    public function scopeForPic($query, int $userId)
    {
        return $query->where('pic_id', $userId);
    }
}