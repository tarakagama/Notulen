import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, Circle, Clock } from 'lucide-react';
import api from '../api/client';

const statusConfig = {
  'Not Started': { style: 'bg-gray-50 text-gray-600', icon: Circle, label: 'Belum Mulai' },
  'In Progress': { style: 'bg-blue-50 text-blue-700', icon: Clock, label: 'Berjalan' },
  Completed: { style: 'bg-green-50 text-green-700', icon: CheckCircle2, label: 'Selesai' },
  Overdue: { style: 'bg-red-50 text-red-700', icon: Clock, label: 'Terlambat' },
};

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/my-tasks')
      .then((res) => setItems(res.data.data || res.data))
      .catch(() => setError('Gagal memuat daftar action items.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="bg-white border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-500 mb-1">{cfg.label}</p>
            <span className="text-2xl font-semibold text-gray-800">{counts[key] || 0}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-600 p-5">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Tidak ada action item untuk kamu saat ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Action Item</th>
                <th className="px-5 py-3.5 font-medium">Sumber Rapat</th>
                <th className="px-5 py-3.5 font-medium">Deadline</th>
                <th className="px-5 py-3.5 font-medium">Prioritas</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const cfg = statusConfig[item.status] || statusConfig['Not Started'];
                const Icon = cfg.icon;
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-5 py-3.5 text-gray-500">{item.meeting?.meeting_title || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{item.priority}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${cfg.style}`}>
                        <Icon size={12} strokeWidth={2} />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}