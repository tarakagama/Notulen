import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import ActionItemTabs from '../components/ActionItemTabs';
import ActionItemStatusBadge from '../components/ActionItemStatusBadge';
import Pagination from '../components/Pagination';
import { listActionItems } from '../api/actionItems';
import { listUsers } from '../api/users';
import { listDivisions } from '../api/divisions';
import { ACTION_ITEM_STATUS_TO_LABEL } from '../lib/statuslabels';
import { extractError } from '../lib/errors';
import { formatDate } from '../lib/datetime';

const PRIORITY_STYLE = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-gray-50 text-gray-600',
};

const selectClass =
  'px-3 py-2.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500';

export default function ActionItemsOverview() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [picId, setPicId] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null); // paginator
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    listUsers().then((res) => setUsers(res.data || res)).catch(() => {});
    listDivisions().then(setDivisions).catch(() => {});
  }, []);

  // Pencarian ditunda sebentar supaya tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    listActionItems({
      page,
      per_page: 15,
      search: search || undefined,
      status: status || undefined,
      division_id: divisionId || undefined,
      pic_id: picId || undefined,
    })
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(extractError(err, 'Gagal memuat action item.')))
      .finally(() => setLoading(false));
  }, [page, search, status, divisionId, picId]);

  useEffect(() => { load(); }, [load]);

  const divisionName = Object.fromEntries(divisions.map((d) => [d.id, d.division_name]));
  const items = data?.data || [];

  const onFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ActionItemTabs />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari deskripsi tugas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select value={status} onChange={onFilter(setStatus)} className={selectClass}>
          <option value="">Semua status</option>
          {Object.entries(ACTION_ITEM_STATUS_TO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={divisionId} onChange={onFilter(setDivisionId)} className={selectClass}>
          <option value="">Semua divisi PIC</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.division_name}</option>
          ))}
        </select>

        <select value={picId} onChange={onFilter(setPicId)} className={selectClass}>
          <option value="">Semua PIC</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Semua Action Item</h2>
          <span className="text-xs text-gray-400">{data?.total ?? 0} tugas</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Tidak ada action item yang cocok dengan filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Tugas</th>
                <th className="px-5 py-3.5 font-medium">Rapat</th>
                <th className="px-5 py-3.5 font-medium">PIC</th>
                <th className="px-5 py-3.5 font-medium">Deadline</th>
                <th className="px-5 py-3.5 font-medium">Prioritas</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const overdue = item.effective_status === 'Overdue';
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-5 py-3.5">
                      {item.meeting ? (
                        <Link to={`/notulen/${item.meeting.id}`} className="text-blue-600 hover:underline">
                          {item.meeting.meeting_title}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {item.pic?.full_name || '-'}
                      <span className="block text-xs text-gray-400">
                        {divisionName[item.pic?.division_id] || item.pic?.division || ''}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {formatDate(item.deadline)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_STYLE[item.priority] || ''}`}>{item.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ActionItemStatusBadge status={item.effective_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination meta={data} onPage={setPage} />
      </div>
    </div>
  );
}