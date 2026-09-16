<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * NFR "Autentikasi": setiap aksi memerlukan login.
     * Login pakai email+password, balikin Sanctum personal access token.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini sudah dinonaktifkan.'],
            ]);
        }

        // Hapus token lama biar nggak numpuk tiap kali login (opsional tapi rapi)
        $user->tokens()->delete();

        $token = $user->createToken('momhub-web')->plainTextToken;

        return response()->json([
            'user' => $user->only(['id', 'full_name', 'email', 'is_admin', 'division', 'position_title']),
            'token' => $token,
        ]);
    }

    /**
     * Logout: cabut token yang sedang dipakai request ini saja.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    /**
     * Dipanggil frontend saat pertama load, buat cek "siapa saya"
     * dan validasi token masih aktif.
     */
    public function me(Request $request)
    {
        return $request->user()->only(['id', 'full_name', 'email', 'is_admin', 'division', 'position_title']);
    }

    /**
     * Update profil sendiri (nama, divisi, jabatan) — bukan lewat admin panel.
     */
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'division' => ['nullable', 'string', 'max:100'],
            'position_title' => ['nullable', 'string', 'max:100'],
        ]);

        $request->user()->update($data);

        return $request->user()->fresh()->only(['id', 'full_name', 'email', 'is_admin', 'division', 'position_title']);
    }

    /**
     * Ganti password sendiri, wajib konfirmasi password lama dulu.
     */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        $request->user()->update(['password' => $data['new_password']]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }
}