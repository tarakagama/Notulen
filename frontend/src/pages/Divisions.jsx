import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { listDivisions, createDivision, updateDivision, deleteDivision } from '../api/divisions';
import { listUsers } from '../api/users';
import { extractError } from '../lib/errors';

export default function Divisions() {
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = mode tambah

  const load = () => {
    setLoading(true);
    Promise.all([listDivisions(), listUsers({ include_inactive: 1 })])
      .then(([divisionData, userData]) => {
        setDivisions(divisionData);
        setUsers(userData.data || userData);
      })
      .catch(() => setError('Gagal memuat data divisi.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Jumlah user per divisi (menjelaskan kenapa sebuah divisi tidak bisa dihapus).
  const userCount = useMemo(() => {
    const counts = {};
    users.forEach((u) => {
      if (u.division_id) counts[u.division_id] = (counts[u.division_id] || 0) + 1;
    });
    return counts;
  }, [users]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setModalOpen(true); };

  const handleDelete = async (d) => {
    if (!window.confirm(`Hapus divisi "${d.division_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError('');
    try {
      await deleteDivision(d.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal menghapus divisi.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Divisi dipakai untuk visibility notulen dan pengelompokan user. Setiap user (selain Super Admin) wajib punya divisi.
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
        >
          <Plus size={16} strokeWidth={1.75} />
          Tambah Divisi
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : divisions.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Belum ada divisi. Tambahkan divisi pertama.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Kode</th>
                <th className="px-5 py-3.5 font-medium">Nama Divisi</th>
                <th className="px-5 py-3.5 font-medium">Jumlah User</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((d) => {
                const count = userCount[d.id] || 0;
                return (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{d.code}</td>
                    <td className="px-5 py-3.5 text-gray-700">{d.division_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{count}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-gray-400 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={count > 0}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                          title={count > 0 ? 'Masih punya user, tidak bisa dihapus' : 'Hapus'}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <DivisionModal
          division={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function DivisionModal({ division, onClose, onSaved }) {
  const isEdit = !!division;
  const [form, setForm] = useState({
    division_name: division?.division_name || '',
    code: division?.code || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { division_name: form.division_name.trim(), code: form.code.trim() };
      if (isEdit) {
        await updateDivision(division.id, payload);
      } else {
        await createDivision(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractError(err, 'Gagal menyimpan divisi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Divisi' : 'Tambah Divisi'} onClose={onClose}>
      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Divisi</label>
          <input
            type="text"
            value={form.division_name}
            onChange={handleChange('division_name')}
            required
            maxLength={150}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Kode (unik)</label>
          <input
            type="text"
            value={form.code}
            onChange={handleChange('code')}
            required
            maxLength={20}
            placeholder="Contoh: ITD"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={saving} className="text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}