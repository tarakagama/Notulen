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
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($meeting->notulis_id === $user->id || $meeting->approver_id === $user->id) {
            return true;
        }

        if ($meeting->attendees()->where('user_id', $user->id)->exists()) {
            return true;
        }

        if ($meeting->visibility === 'Restricted') {
            return false;
        }

        $sameDivision = $user->division_id !== null
            && $meeting->division_id === $user->division_id;

        if ($user->global_role === 'AdminDivisi' && $sameDivision) {
            return true;
        }

        if ($meeting->status !== 'Approved') {
            return false;
        }

        return $meeting->visibility === 'Public'
            || ($meeting->visibility === 'Division' && $sameDivision);
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
    * FSD: export hanya jika Approved DAN user boleh melihat notulennya.
    */
    public function export(User $user, Meeting $meeting): bool
    {
        return $meeting->status === 'Approved' && $this->view($user, $meeting);
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

    /**
     * Hanya Notulis pemilik, hanya saat Approved, dan belum ada
     * permohonan yang sedang menunggu.
     */
    public function requestUnlock(User $user, Meeting $meeting): bool
    {
        return $meeting->status === 'Approved'
            && $meeting->notulis_id === $user->id
            && $meeting->unlock_request_status !== 'Requested';
    }

    /**
     * Approver yang ditunjuk (atau SuperAdmin), hanya jika ada permohonan
     * 'Requested' pada notulen Approved.
     */
    public function approveUnlock(User $user, Meeting $meeting): bool
    {
        if ($meeting->status !== 'Approved' || $meeting->unlock_request_status !== 'Requested') {
            return false;
        }

        return $user->isSuperAdmin() || $meeting->approver_id === $user->id;
    }

    /**
     * Emergency path: hanya SuperAdmin. Dipanggil dengan
     * authorize('forceUnlock', Meeting::class), jadi tanpa instance.
     */
    public function forceUnlock(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}