<?php

namespace App\Policies;

use App\Models\User;

/**
 * Dipakai panel Filament. Kelola user (termasuk mengubah role) hanya
 * untuk SuperAdmin, supaya pengelola ruangan atau AdminDivisi yang bisa
 * masuk panel tidak bisa menaikkan hak aksesnya sendiri.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        return $user->isSuperAdmin() && $user->id !== $model->id;
    }

    public function deleteAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}