<?php

namespace App\Policies;

use App\Models\ActionItem;
use App\Models\User;

class ActionItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ActionItem $actionItem): bool
    {
        return true;
    }

    /**
     * Action item dibuat lewat Meeting Editor oleh Notulis (FR-1.5),
     * jadi create sebenarnya di-gate lewat MeetingPolicy::update
     * pada meeting induknya. Di sini izinkan siapa saja yang login;
     * pengecekan konteks meeting dilakukan di controller/form request.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * FR-3.5: Update status & completion_note hanya jika
     * pic_id = current_user, atau admin.
     *
     * Catatan: ini untuk update status oleh PIC. Kalau Notulis mau
     * edit deskripsi/deadline/priority action item (bukan status),
     * itu digate lewat MeetingPolicy::update pada meeting induknya,
     * bukan lewat policy ini.
     */
    public function updateStatus(User $user, ActionItem $actionItem): bool
    {
        return $user->is_admin || $actionItem->pic_id === $user->id;
    }

    /**
     * FR-4.4: User biasa tidak bisa Delete.
     */
    public function delete(User $user, ActionItem $actionItem): bool
    {
        return $user->is_admin;
    }
}