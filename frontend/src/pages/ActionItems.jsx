import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, RotateCcw } from 'lucide-react';
import { listMyTasks, updateActionItemStatus } from '../api/actionItems';

const PRIORITY_STYLE = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-gray-50 text-gray-600',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    listMyTasks()
      .then((res) => setItems(res.data || res))
      .catch(() => setError('Gagal memuat daftar action items.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (item, status, completion_note = null) => {
    setBusyId(item.id);
    setError('');
    try {
      await updateActionItemStatus(item.id, { status, completion_note });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = (item) => {
    const note = window.prompt('Catatan penyelesaian (opsional):', '');
    if (note === null) return; // user klik Cancel
    changeStatus(item, 'Completed', note.trim() || null);
  };

  const active = items.filter((i) => i.status !== 'Completed');
  const done = items.filter((i) => i.status === 'Completed');

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      {/* Aktif */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tugas Aktif</h2>
          <span className="text-xs text-gray-400">{active.length} tugas</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Tidak ada tugas aktif. 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Action Item</th>
                <th className="px-5 py-3 font-medium">Sumber Rapat</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Prioritas</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {active.map((item) => {
                const overdue = item.deadline && new Date(item.deadline) < new Date();
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-5 py-3.5 text-gray-500">{item.meeting?.meeting_title || '-'}</td>
                    <td className={`px-5 py-3.5 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {formatDate(item.deadline)}{overdue && ' (terlambat)'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_STYLE[item.priority] || ''}`}>{item.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {item.status === 'In Progress' ? <Clock size={12} /> : <Circle size={12} />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {item.status === 'Open' && (
                        <button
                          onClick={() => changeStatus(item, 'In Progress')}
                          disabled={busyId === item.id}
                          className="text-xs text-blue-600 hover:underline mr-3 disabled:opacity-50"
                        >
                          Mulai
                        </button>
                      )}
                      <button
                        onClick={() => handleComplete(item)}
                        disabled={busyId === item.id}
                        className="text-xs text-white bg-green-600 rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                      >
                        Tandai Selesai
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Selesai */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tugas Selesai</h2>
          <span className="text-xs text-gray-400">{done.length} tugas</span>
        </div>

        {done.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Belum ada tugas yang selesai.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Action Item</th>
                <th className="px-5 py-3 font-medium">Sumber Rapat</th>
                <th className="px-5 py-3 font-medium">Selesai Pada</th>
                <th className="px-5 py-3 font-medium">Catatan</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {done.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-5 py-3.5 text-gray-500 line-through">{item.description}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.meeting?.meeting_title || '-'}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <span className="inline-flex items-center gap-1.5 text-green-700">
                      <CheckCircle2 size={13} />
                      {formatDate(item.completed_at)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{item.completion_note || '-'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => changeStatus(item, 'Open')}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      Buka kembali
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}