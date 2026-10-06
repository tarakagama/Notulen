<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    const UPDATED_AT = null; // append-only — tidak pernah di-update

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper dipakai controller lain buat nyatet aksi sensitif (NFR-AUD-01).
     * Log bersifat append-only — sengaja TIDAK ada method update/delete di
     * model ini maupun controller manapun (sesuai TSD 2.9).
     */
    public static function record(string $action, string $entityType, int $entityId, array $old = [], array $new = []): self
    {
        return self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $old,
            'new_values' => $new,
        ]);
    }
}