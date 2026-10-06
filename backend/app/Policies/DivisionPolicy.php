<?php

namespace App\Policies;

use App\Models\User;

class DivisionPolicy
{
    /**
     * FR-ORG-01 — hanya SuperAdmin yang kelola master divisi.
     */
    public function manage(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}