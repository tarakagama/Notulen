<?php

namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    /**
     * Daftar user ringkas buat dropdown (pilih PIC, attendee internal, dst).
     * Semua user yang login boleh akses ini (FR-4.4: Read bebas).
     */
    public function index()
    {
        return User::where('is_active', true)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'email', 'division', 'position_title']);
    }
}