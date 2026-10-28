<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable implements FilamentUser, HasName
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'division_id',
        'division', // kolom teks lama v1, masih dipakai Users.jsx & updateProfile
        'global_role',
        'full_name',
        'email',
        'password',
        'position_title',
        'is_active',
        'can_manage_rooms',
    ];

    protected $appends = ['is_admin'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'can_manage_rooms' => 'boolean',
        ];
    }

    protected function isAdmin(): Attribute
    {
        return Attribute::get(fn () => array_key_exists('global_role', $this->attributes)
            ? $this->global_role === 'SuperAdmin'
            : null);
    }

    // ── Integrasi Filament (panel admin) ──────────────────────────────

    public function getFilamentName(): string
    {
        return $this->full_name;
    }

    /**
     * SuperAdmin, AdminDivisi, dan pengelola ruangan boleh masuk panel admin.
     * Menu yang terlihat dibatasi oleh policy masing-masing resource
     * (user = SuperAdmin saja, ruangan = pengelola ruangan).
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return in_array($this->global_role, ['SuperAdmin', 'AdminDivisi'], true)
            || $this->canManageRooms();
    }

    // ── Helper role (dipakai Policy & controller) ─────────────────────

    /**
     * Boleh mengelola ruangan & booking (approve/reject/batalkan).
     * SuperAdmin otomatis boleh; selain itu lewat flag can_manage_rooms.
     * Izin ini TIDAK memberi akses ke data notulen.
     */
    public function canManageRooms(): bool
    {
        return $this->isSuperAdmin() || (bool) $this->can_manage_rooms;
    }

    /**
     * PIC ruangan murni: hanya mengelola ruangan, tidak boleh melihat/membuat notulen.
     * SuperAdmin dan AdminDivisi yang kebetulan punya flag can_manage_rooms tidak termasuk.
     */
    public function isRoomPicOnly(): bool
    {
        return (bool) $this->can_manage_rooms
            && ! $this->isSuperAdmin()
            && ! $this->isAdminDivisi();
    }

    public function isSuperAdmin(): bool
    {
        return $this->global_role === 'SuperAdmin';
    }

    public function isAdminDivisi(): bool
    {
        return $this->global_role === 'AdminDivisi';
    }

    public function isViewer(): bool
    {
        return $this->global_role === 'Viewer';
    }

    // ── Relasi struktur organisasi ────────────────────────────────────

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    // ── Peran kontekstual per-rapat (bukan role tetap) ────────────────

    public function meetingsAsNotulis()
    {
        return $this->hasMany(Meeting::class, 'notulis_id');
    }

    public function meetingsAsApprover()
    {
        return $this->hasMany(Meeting::class, 'approver_id');
    }

    public function actionItemsAsPic()
    {
        return $this->hasMany(ActionItem::class, 'pic_id');
    }

    /**
     * Baris meeting_attendees di mana user ini tercatat sebagai peserta
     * internal (user_id terisi) — baik lewat undangan booking otomatis
     * maupun ditambahkan manual oleh Notulis.
     */
    public function attendeeRecords()
    {
        return $this->hasMany(MeetingAttendee::class);
    }
}