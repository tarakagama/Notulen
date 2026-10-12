import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MoreVertical, X } from 'lucide-react';
import { listUsers, createUser, updateUser, deleteUser } from '../api/users';
import { listDivisions } from '../api/divisions';
import { useAuth } from '../context/AuthContext';
import { ROLE_TO_LABEL, roleLabel } from '../lib/statuslabels';
import { extractError } from '../lib/errors';

const ROLE_OPTIONS = Object.keys(ROLE_TO_LABEL); // SuperAdmin, AdminDivisi, User, Viewer

const ROLE_STYLE = {
  SuperAdmin: 'bg-purple-50 text-purple-700',
  AdminDivisi: 'bg-blue-50 text-blue-700',
  User: 'bg-gray-50 text-gray-600',
  Viewer: 'bg-yellow-50 text-yellow-700',
};

// PUT /users/{id} selalu mewajibkan full_name & email, jadi setiap update
// (termasuk aktif/nonaktif) harus mengirim payload lengkap.
function buildPayload(u, overrides = {}) {
  const payload = {
    full_name: u.full_name,
    email: u.email,
    global_role: u.global_role,
    can_manage_rooms: !!u.can_manage_rooms,
    position_title: u.position_title || '',
    is_active: u.is_active,
    ...overrides,
  };
  // division_id null tidak boleh dikirim untuk non-SuperAdmin; kalau kosong, biarkan data lama.
  if (u.division_id) payload.division_id = u.division_id;
  return payload;
}

export default function Users() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  // Admin Divisi hanya mengelola user & viewer di divisinya sendiri (FR-ORG-02).
  const isDivisionAdmin = !isSuperAdmin && currentUser?.global_role === 'AdminDivisi';
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = mode tambah
  const [openMenuId, setOpenMenuId] = useState(null);

  const divisionName = useMemo(
    () => Object.fromEntries(divisions.map((d) => [d.id, d.division_name])),
    [divisions]
  );

  const loadUsers = () => {
    setLoading(true);
    // include_inactive: tanpa ini user nonaktif hilang dari daftar dan tidak bisa diaktifkan lagi.
    listUsers({ include_inactive: 1 })
      .then((data) => setUsers(data.data || data))
      .catch(() => setError('Gagal memuat daftar user.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    listDivisions().then(setDivisions).catch(() => setError('Gagal memuat daftar divisi.'));
  }, []);

  // Boleh dikelola: SuperAdmin untuk semua, Admin Divisi hanya User/Viewer di divisinya.
  const canManage = (u) =>
    isSuperAdmin ||
    (isDivisionAdmin &&
      u.division_id === currentUser?.division_id &&
      ['User', 'Viewer'].includes(u.global_role));

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole = !roleFilter || u.global_role === roleFilter;
    const matchDivision = !isDivisionAdmin || u.division_id === currentUser?.division_id;
    return matchSearch && matchRole && matchDivision;
  });

  const openAddModal = () => { setEditingUser(null); setModalOpen(true); };
  const openEditModal = (u) => { setEditingUser(u); setModalOpen(true); setOpenMenuId(null); };

  const handleToggleActive = async (u) => {
    setOpenMenuId(null);
    setError('');
    try {
      await updateUser(u.id, buildPayload(u, { is_active: !u.is_active }));
      loadUsers();
    } catch (err) {
      setError(extractError(err, 'Gagal mengubah status user.'));
    }
  };

  const handleDelete = async (u) => {
    setOpenMenuId(null);
    setError('');
    if (!window.confirm(`Hapus user "${u.full_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteUser(u.id);
      loadUsers();
    } catch (err) {
      setError(extractError(err, 'Gagal menghapus user.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Semua role</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
        >
          <Plus size={16} strokeWidth={1.75} />
          Tambah User
        </button>
      </div>

      {isDivisionAdmin && (
        <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded px-4 py-2.5">
          Kamu mengelola user di divisi <strong>{divisionName[currentUser?.division_id] || '-'}</strong>.
          Role yang bisa diatur: User dan Viewer.
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Tidak ada user ditemukan.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Nama</th>
                <th className="px-5 py-3.5 font-medium">Email</th>
                <th className="px-5 py-3.5 font-medium">Divisi</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSuper = u.global_role === 'SuperAdmin';
                const isSelf = u.id === currentUser?.id;
                const manageable = canManage(u);
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{u.full_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {u.division_id
                        ? (divisionName[u.division_id] || `#${u.division_id}`)
                        : isSuper
                          ? '-'
                          : <span className="text-amber-600 text-xs">Belum diatur</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-1 rounded text-xs ${ROLE_STYLE[u.global_role] || ROLE_STYLE.User}`}>
                          {roleLabel(u.global_role)}
                        </span>
                        {!isSuper && u.can_manage_rooms && (
                          <span className="px-2.5 py-1 rounded text-xs bg-teal-50 text-teal-700">
                            Pengelola Ruangan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded text-xs ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right relative">
                      {manageable && (
                        <button
                          onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <MoreVertical size={16} strokeWidth={1.75} />
                        </button>
                      )}

                      {manageable && openMenuId === u.id && (
                        <div className="absolute right-5 mt-1 w-40 bg-white border border-gray-200 rounded shadow-sm z-10 text-left">
                          <button
                            onClick={() => openEditModal(u)}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleActive(u)}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}
                          {!isSelf && isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <UserModal
          user={editingUser}
          divisions={divisions}
          currentUserId={currentUser?.id}
          restrictedDivisionId={isDivisionAdmin ? currentUser?.division_id : null}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({ user, divisions, currentUserId, restrictedDivisionId, onClose, onSaved }) {
  const isEdit = !!user;
  const isSelf = isEdit && user.id === currentUserId;
  const restricted = !!restrictedDivisionId; // Admin Divisi: divisi terkunci, role terbatas
  const roleOptions = restricted ? ['User', 'Viewer'] : ROLE_OPTIONS;

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    global_role: user?.global_role || 'User',
    division_id: restricted ? String(restrictedDivisionId) : (user?.division_id ? String(user.division_id) : ''),
    can_manage_rooms: !!user?.can_manage_rooms,
    position_title: user?.position_title || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isSuperRole = form.global_role === 'SuperAdmin';

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        global_role: form.global_role,
        position_title: form.position_title,
      };
      // Super Admin otomatis boleh mengelola ruangan, jadi flag tidak relevan.
      // Admin Divisi tidak boleh mengatur hak pengelola ruangan.
      if (!restricted) payload.can_manage_rooms = isSuperRole ? false : form.can_manage_rooms;
      if (form.division_id) payload.division_id = Number(form.division_id);
      if (form.password) payload.password = form.password; // jangan kirim password kosong

      if (isEdit) {
        payload.is_active = user.is_active;
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractError(err, 'Gagal menyimpan user. Cek kembali isian kamu.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">{isEdit ? 'Edit User' : 'Tambah User'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {error && (
          <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nama Lengkap" value={form.full_name} onChange={handleChange('full_name')} required />
          <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} required />
          <Field label="Jabatan" value={form.position_title} onChange={handleChange('position_title')} />
          <Field
            label={isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required={!isEdit}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={form.global_role}
              onChange={handleChange('global_role')}
              disabled={isSelf}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
            {isSelf && (
              <p className="text-xs text-gray-400 mt-1">Role akun sendiri tidak bisa diubah dari sini.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Divisi{!isSuperRole && <span className="text-red-500"> *</span>}
            </label>
            <select
              value={form.division_id}
              onChange={handleChange('division_id')}
              required={!isSuperRole}
              disabled={restricted}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">{isSuperRole ? 'Tanpa divisi' : 'Pilih divisi'}</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.division_name} ({d.code})</option>
              ))}
            </select>
            {divisions.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Belum ada divisi. Buat dulu di menu Divisi.</p>
            )}
          </div>

          {!isSuperRole && !restricted && (
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.can_manage_rooms}
                onChange={handleChange('can_manage_rooms')}
                className="w-4 h-4 mt-0.5 accent-[#0f2557]"
              />
              <span>
                Pengelola ruangan (PIC GA)
                <span className="block text-xs text-gray-400">
                  Boleh menyetujui booking ruangan. Tidak memberi akses ke notulen.
                </span>
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={saving} className="text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}