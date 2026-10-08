<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLES = ['SuperAdmin', 'AdminDivisi', 'User', 'Viewer'];

    /**
     * Daftar user ringkas buat dropdown (pilih PIC, attendee internal, dst)
     * ATAU buat halaman User Management (admin). Semua user login boleh
     * akses — aksi Create/Update/Delete tetap dibatasi SuperAdmin di bawah.
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
            ->get([
                'id', 'full_name', 'email', 'division', 'division_id',
                'position_title', 'global_role', 'can_manage_rooms', 'is_active',
            ]);
    }

    /**
     * SuperAdmin only — bikin user baru.
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate($this->rules($request));

        $data['global_role'] = $this->resolveRole($data, null);
        unset($data['is_admin']);

        $user = User::create($data);

        return response()->json($user, 201);
    }

    /**
     * SuperAdmin only — update data user lain.
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate($this->rules($request, $user));

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $role = $this->resolveRole($data, $user);
        unset($data['is_admin'], $data['global_role']);

        if ($role !== null) {
            $data['global_role'] = $role;
        }

        $user->update($data);

        return $user->fresh();
    }

    /**
     * SuperAdmin only — hapus user.
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

    private function rules(Request $request, ?User $user = null): array
    {
        // Role akhir yang akan berlaku (termasuk toggle is_admin dari UI lama).
        $role = $request->input('global_role')
            ?? ($request->boolean('is_admin') ? 'SuperAdmin' : ($user?->global_role ?? 'User'));

        // SuperAdmin boleh tanpa divisi; role lain wajib punya divisi.
        // Saat update, 'sometimes' berarti: kalau field-nya dikirim tidak boleh null,
        // kalau tidak dikirim data lama dibiarkan.
        $divisionRule = $role === 'SuperAdmin'
            ? ['nullable', 'exists:divisions,id']
            : [$user ? 'sometimes' : 'required', 'exists:divisions,id'];

        return [
            'full_name' => ['required', 'string', 'max:150'],
            'email' => [
                'required', 'email', 'max:150',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'global_role' => ['nullable', Rule::in(self::ROLES)],
            // Kompatibilitas Users.jsx lama yang masih mengirim toggle is_admin.
            'is_admin' => ['nullable', 'boolean'],
            'division_id' => $divisionRule,
            'division' => ['nullable', 'string', 'max:100'],
            'position_title' => ['nullable', 'string', 'max:100'],
            'can_manage_rooms' => ['sometimes', 'boolean'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Tentukan global_role akhir.
     * - global_role eksplisit selalu menang.
     * - is_admin (UI lama) hanya mengubah role jika benar-benar mengubah status
     *   admin, supaya AdminDivisi/Viewer tidak ikut turun jadi User saat
     *   form lama disimpan.
     * Mengembalikan null kalau role tidak perlu diubah (update).
     */
    private function resolveRole(array $data, ?User $existing): ?string
    {
        if (! empty($data['global_role'])) {
            return $data['global_role'];
        }

        if (array_key_exists('is_admin', $data) && $data['is_admin'] !== null) {
            $wantsAdmin = (bool) $data['is_admin'];

            if ($existing === null) {
                return $wantsAdmin ? 'SuperAdmin' : 'User';
            }

            if ($wantsAdmin && ! $existing->isSuperAdmin()) {
                return 'SuperAdmin';
            }

            if (! $wantsAdmin && $existing->isSuperAdmin()) {
                return 'User';
            }

            return null;
        }

        return $existing === null ? 'User' : null;
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'Hanya admin yang boleh melakukan aksi ini.');
    }
}