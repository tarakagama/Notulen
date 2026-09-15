<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser, HasName
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'password',
        'is_admin',
        'division',
        'position_title',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ── Integrasi Filament (panel admin, FR-4.x) ─────────────────────────

    /**
     * Filament butuh method ini buat nampilin nama user di panel,
     * karena kolom kita namanya full_name (bukan name).
     */
    public function getFilamentName(): string
    {
        return $this->full_name;
    }

    /**
     * FR-4.3: hanya Admin yang boleh akses panel /admin.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin;
    }

    // ── Peran kontekstual (bukan role tetap, lihat PRD 6.4) ──────────────

    /**
     * Rapat-rapat yang notulennya ditulis oleh user ini.
     */
    public function meetingsAsNotulis()
    {
        return $this->hasMany(Meeting::class, 'notulis_id');
    }

    /**
     * Rapat-rapat yang user ini jadi approver-nya.
     */
    public function meetingsAsApprover()
    {
        return $this->hasMany(Meeting::class, 'approver_id');
    }

    /**
     * Action item yang jadi tanggung jawab user ini (PIC).
     */
    public function actionItemsAsPic()
    {
        return $this->hasMany(ActionItem::class, 'pic_id');
    }

    /**
     * Rapat-rapat yang user ini hadiri (sebagai user internal).
     */
    public function meetingsAttended()
    {
        return $this->belongsToMany(Meeting::class, 'meeting_attendees')
            ->withPivot(['external_name', 'external_org', 'role_in_meeting', 'is_signed']);
    }
}