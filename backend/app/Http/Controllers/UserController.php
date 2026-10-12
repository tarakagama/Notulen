<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;

class UserController extends Controller
{
    private const ROLES = ['SuperAdmin', 'AdminDivisi', 'User', 'Viewer'];

    // Role yang boleh dikelola Admin Divisi di divisinya (FR-ORG-02).
    private const DIVISION_MANAGEABLE_ROLES = ['User', 'Viewer'];

    /**
     * Daftar user ringkas buat dropdown (pilih PIC, attendee internal, dst)
     * ATAU buat halaman User Management. Semua user login boleh membaca;
     * aksi Create/Update/Delete dibatasi di bawah.
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
     * SuperAdmin: bebas. Admin Divisi: hanya user/viewer di divisinya sendiri.
     */
    public function store(Request $request)
    {
        $actor = $request->user();
        $this->authorizeManage($actor);

        $data = $request->validate($this->rules($request, $actor));

        $data['global_role'] = $this->resolveRole($data, null);
        unset($data['is_admin']);

        if (! $actor->isSuperAdmin()) {
            $this->assertDivisionManageableRole($data['global_role']);
            // Admin Divisi hanya membuat user di divisinya sendiri, tanpa hak pengelola ruangan.
            $data['division_id'] = $actor->division_id;
            $data['can_manage_rooms'] = false;
        }

        $user = User::create($data);

        return response()->json($user, 201);
    }

    /**
     * SuperAdmin: bebas. Admin Divisi: hanya user/viewer di divisinya sendiri,
     * tanpa mengubah divisi, role di luar User/Viewer, atau hak pengelola ruangan.
     */
    public function update(Request $request, User $user)
    {
        $actor = $request->user();
        $this->authorizeManage($actor, $user);

        $data = $request->validate($this->rules($request, $actor, $user));

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $role = $this->resolveRole($data, $user);
        unset($data['is_admin'], $data['global_role']);

        if ($role !== null) {
            $data['global_role'] = $role;
        }

        if (! $actor->isSuperAdmin()) {
            if ($role !== null) {
                $this->assertDivisionManageableRole($role);
            }
            // Divisi dan hak pengelola ruangan hanya boleh diubah SuperAdmin.
            unset($data['division_id'], $data['can_manage_rooms']);
        }

        $user->update($data);

        return $user->fresh();
    }

    /**
     * SuperAdmin only. Admin Divisi cukup menonaktifkan user lewat update.
     */
    public function destroy(Request $request, User $user)
    {
        abort_unless(
            $request->user()->isSuperAdmin(),
            403,
            'Hanya Super Admin yang boleh menghapus user. Admin Divisi bisa menonaktifkan user.'
        );

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        try {
            $user->delete();
        } catch (QueryException $e) {
            // 23000 = pelanggaran foreign key (user masih dipakai di tabel lain)
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => 'User ini masih tercatat sebagai PIC action item, notulis, approver, atau peserta rapat, sehingga tidak bisa dihapus. Nonaktifkan akunnya saja.',
                ], 422);
            }
            throw $e;
        }

        return response()->noContent();
    }

    private function rules(Request $request, User $actor, ?User $user = null): array
    {
        // Role akhir yang akan berlaku (termasuk toggle is_admin dari UI lama).
        $role = $request->input('global_role')
            ?? ($request->boolean('is_admin') ? 'SuperAdmin' : ($user?->global_role ?? 'User'));

        if (! $actor->isSuperAdmin() || $role === 'SuperAdmin') {
            // Admin Divisi: divisi dikunci ke divisinya sendiri oleh controller (input diabaikan).
            // SuperAdmin boleh tanpa divisi.
            $divisionRule = ['nullable', 'exists:divisions,id'];
        } else {
            // Role lain wajib punya divisi. Saat update, 'sometimes' berarti kalau dikirim
            // tidak boleh kosong, kalau tidak dikirim data lama dibiarkan.
            $divisionRule = [$user ? 'sometimes' : 'required', 'exists:divisions,id'];
        }

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
            'division' => ['nullable', 'string', 'max:100'], // teks lama v1
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

    /**
     * Boleh mengelola user: SuperAdmin, atau Admin Divisi (yang punya divisi) terhadap
     * user/viewer di divisinya sendiri.
     */
    private function authorizeManage(User $actor, ?User $target = null): void
    {
        if ($actor->isSuperAdmin()) {
            return;
        }

        abort_unless(
            $actor->global_role === 'AdminDivisi' && $actor->division_id !== null,
            403,
            'Hanya Super Admin atau Admin Divisi yang boleh mengelola user.'
        );

        if ($target !== null) {
            abort_unless(
                $target->division_id === $actor->division_id
                    && in_array($target->global_role, self::DIVISION_MANAGEABLE_ROLES, true),
                403,
                'Admin Divisi hanya bisa mengelola user dan viewer di divisinya sendiri.'
            );
        }
    }

    private function assertDivisionManageableRole(string $role): void
    {
        abort_unless(
            in_array($role, self::DIVISION_MANAGEABLE_ROLES, true),
            403,
            'Admin Divisi hanya bisa membuat atau mengubah user dengan role User atau Viewer.'
        );
    }
}