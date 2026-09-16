<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Daftar user ringkas buat dropdown (pilih PIC, attendee internal, dst)
     * ATAU buat halaman User Management (admin). Semua user login boleh
     * akses (FR-4.4: Read bebas) — aksi Create/Update/Delete tetap
     * dibatasi admin di bawah.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return $query->orderBy('full_name')
            ->get(['id', 'full_name', 'email', 'division', 'position_title', 'is_admin', 'is_active']);
    }

    /**
     * FR-4.3: Admin only — bikin user baru.
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'is_admin' => ['boolean'],
            'division' => ['nullable', 'string', 'max:100'],
            'position_title' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create($data);

        return response()->json($user, 201);
    }

    /**
     * FR-4.3: Admin only — update data user lain.
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'is_admin' => ['boolean'],
            'division' => ['nullable', 'string', 'max:100'],
            'position_title' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh();
    }

    /**
     * FR-4.3: Admin only — hapus user.
     */
    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->noContent();
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->is_admin, 403, 'Hanya admin yang boleh melakukan aksi ini.');
    }
}