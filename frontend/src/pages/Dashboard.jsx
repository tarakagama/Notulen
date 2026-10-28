import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Hourglass, ListChecks, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchDashboardSummary, fetchTopOverdue } from '../api/dashboard';
import { listMeetings } from '../api/meetings';
import { meetingStatusLabel } from '../lib/statuslabels';
import MeetingCalendar from '../components/MeetingCalendar';
import RoomAvailabilityCard from '../components/RoomAvailabilityCard';

const STATUS_STYLE = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Waiting Approval': 'bg-blue-50 text-blue-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-700',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [recent, setRecent] = useState([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchDashboardSummary(),
      fetchTopOverdue(),
      listMeetings({ per_page: 5 }),
      listMeetings({ status: 'Waiting Approval', per_page: 1 }),
    ])
      .then(([sum, top, meetings, waiting]) => {
        setSummary(sum);
        setOverdue(Array.isArray(top) ? top : top.data || []);
        setRecent(meetings.data || []);
        setTotalMeetings(meetings.total ?? 0);
        setWaitingCount(waiting.total ?? 0);
      })
      .catch(() => setError('Gagal memuat data dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Memuat dashboard...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const total = summary?.total ?? 0;
  const completed = summary?.completed ?? 0;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const awaiting = summary?.awaiting_verification ?? 0;

  const stats = [
    { label: 'Total Notulen', hint: '', value: totalMeetings, icon: FileText },
    { label: 'Notulen Menunggu Persetujuan', hint: '', value: waitingCount, icon: Hourglass },
    { label: 'Action Item Berjalan', hint: '', value: active, icon: ListChecks },
    { label: 'Action Item Lewat Tenggat', hint: '', value: summary?.overdue ?? 0, icon: AlertTriangle },
    {
      label: 'Action Item Terverifikasi',
      hint: awaiting > 0 ? `${awaiting} masih menunggu verifikasi` : 'Selesai dan sudah diverifikasi',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Kartu statistik */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map(({ label, hint, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-gray-600">{label}</p>
              <Icon size={16} strokeWidth={1.75} className={`shrink-0 ${color}`} />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{value}</span>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">{hint}</p>
          </div>
        ))}
      </div>

      {/* Progres action item */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">Progres Action Item</h2>
          <span className="text-xs text-gray-500">
            {completed} dari {total} terverifikasi ({completionRate}%)
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded overflow-hidden">
          <div className="h-full bg-green-600" style={{ width: `${completionRate}%` }} />
        </div>
      </div>
      <RoomAvailabilityCard />
      <MeetingCalendar />
      <div className="grid grid-cols-3 gap-6">
        {/* Notulen terbaru */}
        <div className="col-span-2 bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Notulen Terbaru</h2>
            <Link to="/notulen" className="text-xs text-blue-600 hover:underline">Lihat Semua</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Belum ada notulen.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left text-xs">
                  <th className="px-4 py-2 font-medium">Judul Rapat</th>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">Notulis</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/notulen/${m.id}`} className="text-gray-800 hover:text-blue-600">
                        {m.meeting_title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{formatDate(m.meeting_date)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{m.notulis?.full_name || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_STYLE[m.status] || 'bg-gray-50 text-gray-600'}`}>
                        {meetingStatusLabel(m.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top overdue */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Paling Terlambat</h2>
            <Link to="/action-items" className="text-xs text-blue-600 hover:underline">Lihat Semua</Link>
          </div>
          {overdue.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">Tidak ada tugas yang terlambat.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {overdue.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <p className="text-sm text-gray-800">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.pic?.full_name || '-'} · deadline{' '}
                    <span className="text-red-600">{formatDate(item.deadline)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}