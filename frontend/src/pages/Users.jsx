import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X } from 'lucide-react';
import { listUsers, createUser, updateUser, deleteUser } from '../api/users';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = mode tambah
  const [openMenuId, setOpenMenuId] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    listUsers()
      .then((data) => setUsers(data.data || data))
      .catch(() => setError('Gagal memuat daftar user.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => { setEditingUser(null); setModalOpen(true); };
  const openEditModal = (u) => { setEditingUser(u); setModalOpen(true); setOpenMenuId(null); };

  const handleToggleActive = async (u) => {
    setOpenMenuId(null);
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      loadUsers();
    } catch {
      setError('Gagal mengubah status user.');
    }
  };

  const handleDelete = async (u) => {
    setOpenMenuId(null);
    if (!window.confirm(`Hapus user "${u.full_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteUser(u.id);
      loadUsers();
    } catch {
      setError('Gagal menghapus user.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
        >
          <Plus size={16} strokeWidth={1.75} />
          Tambah User
        </button>
      </div>

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
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{u.full_name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.division || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded text-xs ${u.is_admin ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded text-xs ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <MoreVertical size={16} strokeWidth={1.75} />
                    </button>

                    {openMenuId === u.id && (
                      <div className="absolute right-5 mt-1 w-40 bg-white border border-gray-200 rounded shadow-sm z-10 text-left">
                        <button
                          onClick={() => openEditModal(u)}
                          className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        {u.id !== currentUser?.id && (
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    division: user?.division || '',
    position_title: user?.position_title || '',
    is_admin: user?.is_admin || false,
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    const value = field === 'is_admin' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { ...form };
        if (!payload.password) delete payload.password; // jangan kirim password kosong
        await updateUser(user.id, payload);
      } else {
        await createUser(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan user. Cek kembali isian kamu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded w-full max-w-md p-5">
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
          <Field label="Divisi" value={form.division} onChange={handleChange('division')} />
          <Field label="Jabatan" value={form.position_title} onChange={handleChange('position_title')} />
          <Field
            label={isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required={!isEdit}
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_admin} onChange={handleChange('is_admin')} className="w-4 h-4 accent-[#0f2557]" />
            Jadikan Admin
          </label>

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