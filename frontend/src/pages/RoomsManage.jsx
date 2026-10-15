import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, Power } from 'lucide-react';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import { listManageableRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms';
import { extractError } from '../lib/errors';

const FACILITY_SUGGESTIONS = ['Proyektor', 'TV', 'Whiteboard', 'Video Conference', 'Sound System', 'AC'];

const selectClass =
  'px-3 py-2.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500';

// PUT /rooms/{id} butuh semua field wajib, jadi aktif/nonaktif pun mengirim payload lengkap.
function buildPayload(room, overrides = {}) {
  return {
    room_name: room.room_name,
    building: room.building,
    floor: room.floor,
    capacity: room.capacity,
    facilities: room.facilities || [],
    is_active: room.is_active,
    ...overrides,
  };
}

export default function RoomsManage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = mode tambah

  const load = () => {
    setLoading(true);
    listManageableRooms()
      .then(setRooms)
      .catch((err) => setError(extractError(err, 'Gagal memuat daftar ruangan.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const buildings = useMemo(() => [...new Set(rooms.map((r) => r.building))].sort(), [rooms]);

  const filtered = rooms.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      (r.room_name || '').toLowerCase().includes(q) || (r.building || '').toLowerCase().includes(q);
    const matchStatus =
      !statusFilter || (statusFilter === 'active' ? r.is_active : !r.is_active);
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (room) => { setEditing(room); setModalOpen(true); };

  const handleToggleActive = async (room) => {
    setError('');
    if (room.is_active && room.upcoming_bookings_count > 0) {
      const ok = window.confirm(
        `Ruangan "${room.room_name}" punya ${room.upcoming_bookings_count} booking mendatang yang tetap berlaku. ` +
        'Menonaktifkan hanya menyembunyikannya dari pilihan booking baru. Lanjutkan?'
      );
      if (!ok) return;
    }
    try {
      await updateRoom(room.id, buildPayload(room, { is_active: !room.is_active }));
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal mengubah status ruangan.'));
    }
  };

  const handleDelete = async (room) => {
    setError('');
    if (!window.confirm(`Hapus ruangan "${room.room_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteRoom(room.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal menghapus ruangan.'));
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
              placeholder="Cari nama ruangan atau gedung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
        >
          <Plus size={16} strokeWidth={1.75} />
          Tambah Ruangan
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Ruangan nonaktif tidak muncul di pilihan booking baru. Booking yang sudah ada tetap berlaku.
        Ruangan yang pernah dipakai booking tidak bisa dihapus, cukup dinonaktifkan.
      </p>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">
            {rooms.length === 0 ? 'Belum ada ruangan. Tambahkan ruangan pertama.' : 'Tidak ada ruangan yang cocok.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Ruangan</th>
                <th className="px-5 py-3.5 font-medium">Kapasitas</th>
                <th className="px-5 py-3.5 font-medium">Fasilitas</th>
                <th className="px-5 py-3.5 font-medium">Booking mendatang</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((room) => (
                <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="font-medium">{room.room_name}</span>
                    <span className="block text-xs text-gray-400">{room.building} · Lt. {room.floor}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{room.capacity} orang</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {(room.facilities || []).length === 0 ? (
                        <span className="text-xs text-gray-300">-</span>
                      ) : (
                        room.facilities.map((f) => (
                          <span key={f} className="text-xs bg-gray-50 text-gray-600 rounded px-2 py-0.5">{f}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{room.upcoming_bookings_count ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded text-xs ${room.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {room.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button onClick={() => openEdit(room)} className="text-gray-400 hover:text-gray-700" title="Edit">
                        <Pencil size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(room)}
                        className={room.is_active ? 'text-gray-400 hover:text-amber-600' : 'text-gray-400 hover:text-green-600'}
                        title={room.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        <Power size={16} strokeWidth={1.75} />
                      </button>
                      <button onClick={() => handleDelete(room)} className="text-gray-400 hover:text-red-600" title="Hapus">
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <RoomModal
          room={editing}
          buildings={buildings}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function RoomModal({ room, buildings, onClose, onSaved }) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    room_name: room?.room_name || '',
    building: room?.building || '',
    floor: room?.floor || '',
    capacity: room?.capacity ?? '',
    facilities: room?.facilities || [],
    is_active: room ? room.is_active : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
        room_name: form.room_name.trim(),
        building: form.building.trim(),
        floor: String(form.floor).trim(),
        capacity: Number(form.capacity),
        facilities: form.facilities,
        is_active: form.is_active,
      };
      if (isEdit) {
        await updateRoom(room.id, payload);
      } else {
        await createRoom(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractError(err, 'Gagal menyimpan ruangan.'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <Modal title={isEdit ? 'Edit Ruangan' : 'Tambah Ruangan'} onClose={onClose}>
      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Ruangan</label>
          <input type="text" value={form.room_name} onChange={handleChange('room_name')} required maxLength={100} className={inputClass} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Gedung</label>
            <input
              type="text"
              value={form.building}
              onChange={handleChange('building')}
              required
              maxLength={100}
              list="building-options"
              className={inputClass}
            />
            <datalist id="building-options">
              {buildings.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Lantai</label>
            <input type="text" value={form.floor} onChange={handleChange('floor')} required maxLength={20} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Kapasitas (orang)</label>
          <input type="number" min={1} max={10000} value={form.capacity} onChange={handleChange('capacity')} required className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Fasilitas</label>
          <TagInput
            value={form.facilities}
            onChange={(facilities) => setForm({ ...form, facilities })}
            suggestions={FACILITY_SUGGESTIONS}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={handleChange('is_active')}
            className="w-4 h-4 mt-0.5 accent-[#0f2557]"
          />
          <span>
            Aktif
            <span className="block text-xs text-gray-400">Ruangan aktif muncul di pilihan booking.</span>
          </span>
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
    </Modal>
  );
}