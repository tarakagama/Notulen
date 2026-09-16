import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { listMeetings } from '../api/meetings';

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Menunggu Approval': 'bg-blue-50 text-blue-700',
  Disetujui: 'bg-green-50 text-green-700',
  Ditolak: 'bg-red-50 text-red-700',
};

function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function NotulenList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listMeetings()
      .then((data) => setMeetings(data.data || data))
      .catch(() => setError('Gagal memuat daftar notulen.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul rapat..."
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded px-4 py-2.5 hover:bg-gray-50">
            <Filter size={16} strokeWidth={1.75} />
            Filter Status
          </button>
          <Link
            to="/notulen/baru"
            className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
          >
            <Plus size={16} strokeWidth={1.75} />
            Buat Notulen
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : error ? (
          <p className="text-sm text-red-600 p-5">{error}</p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Belum ada notulen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Judul Rapat</th>
                <th className="px-5 py-3.5 font-medium">Tanggal</th>
                <th className="px-5 py-3.5 font-medium">Notulis</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{item.meeting_title}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(item.meeting_date)}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.notulis?.full_name || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[item.status] || 'bg-gray-50 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/notulen/${item.id}`} className="text-blue-600 hover:underline text-sm">
                      Lihat
                    </Link>
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