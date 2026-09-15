<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\User;

class MeetingPolicy
{
    /**
     * Semua user login boleh lihat & bikin notulen baru (FR-4.4).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Meeting $meeting): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    /**
     * FR-1.8: Notulis hanya boleh edit notulen miliknya sendiri,
     * dan hanya selama status Draft.
     *
     * FR-2.3: Pengecualian — kalau status Rejected, Notulis juga
     * boleh edit ulang (meski bukan status Draft murni).
     *
     * Admin selalu boleh (FR-4.3).
     */
    public function update(User $user, Meeting $meeting): bool
    {
        if ($user->is_admin) {
            return true;
        }

        if ($meeting->notulis_id !== $user->id) {
            return false;
        }

        return in_array($meeting->status, ['Draft', 'Rejected'], true);
    }

    /**
     * FR-4.4: User biasa tidak bisa Delete sama sekali.
     * FR-4.3: hanya Admin.
     */
    public function delete(User $user, Meeting $meeting): bool
    {
        return $user->is_admin;
    }

    /**
     * FR-2.1, FR-2.2, FR-2.3: hanya approver yang ditunjuk di
     * meeting ini yang boleh approve/reject. Admin juga boleh
     * sebagai fallback administratif.
     */
    public function approve(User $user, Meeting $meeting): bool
    {
        if ($user->is_admin) {
            return true;
        }

        return $meeting->approver_id === $user->id
            && $meeting->status === 'Waiting Approval';
    }

    public function reject(User $user, Meeting $meeting): bool
    {
        return $this->approve($user, $meeting);
    }

    /**
     * FR-2.4: export PDF hanya untuk notulen yang sudah Approved.
     * Semua user boleh export (bukan cuma notulis/approver).
     */
    public function export(User $user, Meeting $meeting): bool
    {
        return $meeting->status === 'Approved';
    }

    /**
     * FR-1.7: submit draft untuk approval — sama seperti update,
     * hanya notulis pemilik & masih Draft.
     */
    public function submit(User $user, Meeting $meeting): bool
    {
        if ($user->is_admin) {
            return true;
        }

        return $meeting->notulis_id === $user->id
            && $meeting->status === 'Draft';
    }
}