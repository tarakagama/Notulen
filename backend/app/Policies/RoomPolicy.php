<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    /**
     * FR-RM-01 — pengelola ruangan (PIC GA) dan SuperAdmin boleh kelola
     * master ruangan. Dipakai juga oleh panel Filament.
     */
    public function manage(User $user): bool
    {
        return $user->canManageRooms();
    }

    public function viewAny(User $user): bool
    {
        return $user->canManageRooms();
    }

    public function view(User $user, Room $room): bool
    {
        return $user->canManageRooms();
    }

    public function create(User $user): bool
    {
        return $user->canManageRooms();
    }

    public function update(User $user, Room $room): bool
    {
        return $user->canManageRooms();
    }

    /**
     * Ruangan tidak dihapus karena sudah punya riwayat booking.
     * Cukup dinonaktifkan lewat is_active.
     */
    public function delete(User $user, Room $room): bool
    {
        return false;   
    }

    public function deleteAny(User $user): bool
    {
        return false;
    }
}   