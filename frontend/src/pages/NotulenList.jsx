import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { listMeetings } from '../api/meetings';
import { meetingStatusLabel, visibilityLabel, MEETING_STATUS_TO_LABEL } from '../lib/statuslabels';
import { formatDate } from '../lib/datetime';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const visibilityStyle = {
  Public: 'bg-green-50 text-green-700',
  Division: 'bg-blue-50 text-blue-700',
  Restricted: 'bg-red-50 text-red-700',
};

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Waiting Approval': 'bg-blue-50 text-blue-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-700',
};

export default function NotulenList() {
  const { isViewer } = useAuth();
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Tunda pencarian 350 ms supaya tidak memanggil API di setiap ketikan
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${page}|${search}|${status}`;

  useEffect(() => {
    let cancelled = false;
    const params = { page };
    if (search) params.search = search;
    if (status) params.status = status;

    listMeetings(params)
      .then((res) => { if (!cancelled) setResult({ key: requestKey, data: res, error: '' }); })
      .catch(() => { if (!cancelled) setResult((prev) => ({ ...prev, key: requestKey, error: 'Gagal memuat daftar notulen.' })); });

    return () => { cancelled = true; };
  }, [requestKey, page, search, status]);

  const { data, error } = result;
  const loading = result.key !== requestKey;
  const meetings = data?.data || [];
  const hasFilter = Boolean(search || status);
  const resetFilter = () => { setSearchInput(''); setSearch(''); setStatus(''); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul rapat..."
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              aria-label="Filter status"
              className="appearance-none text-sm text-gray-700 border border-gray-300 rounded pl-9 pr-8 py-2.5 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              {Object.entries(MEETING_STATUS_TO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <button onClick={resetFilter} className="text-sm text-gray-500 hover:text-gray-800 underline">Reset</button>
          )}
          {!isViewer && (
            <Link
              to="/notulen/baru"
              className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
            >
              <Plus size={16} strokeWidth={1.75} />
              Buat Notulen
            </Link>
          )}
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
                  <td className="px-5 py-3.5 text-gray-800 font-medium">
                      {item.meeting_title}
                      {item.visibility && (
                        <span className={`ml-2 align-middle px-2 py-0.5 rounded text-[10px] font-normal ${visibilityStyle[item.visibility] || 'bg-gray-50 text-gray-600'}`}>
                          {visibilityLabel(item.visibility)}
                        </span>
                      )}
                    </td>
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