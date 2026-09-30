import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listMeetings } from '../api/meetings';
import { meetingStatusLabel } from '../lib/statuslabels';

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DOT_COLOR = {
  Draft: 'bg-yellow-500',
  'Waiting Approval': 'bg-blue-500',
  Approved: 'bg-green-600',
  Rejected: 'bg-red-500',
};

const pad = (n) => String(n).padStart(2, '0');
const PAGE_SIZE = 5;
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m = 0-11

export default function MeetingCalendar() {
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayKey);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); }, [selected]);

  // Ambil notulen untuk bulan yang lagi ditampilkan
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const lastDay = new Date(year, month + 1, 0).getDate();
    listMeetings({
      date_from: toKey(year, month, 1),
      date_to: toKey(year, month, lastDay),
      per_page: 100,
    })
      .then((res) => !cancelled && setMeetings(res.data || []))
      .catch(() => !cancelled && setMeetings([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [year, month]);

  // Kelompokkan per tanggal. Pakai slice(0, 10) dari string ISO, BUKAN new Date(),
  // biar tanggalnya gak geser sehari gara-gara zona waktu.
  const byDate = useMemo(() => {
    const map = {};
    meetings.forEach((m) => {
      const key = (m.meeting_date || '').slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [meetings]);

  const goToMonth = (y, m) => {
    setYear(y);
    setMonth(m);
    // Pilih hari ini kalau balik ke bulan berjalan, selain itu tanggal 1
    const isCurrent = y === today.getFullYear() && m === today.getMonth();
    setSelected(isCurrent ? todayKey : toKey(y, m, 1));
  };

  const prevMonth = () => (month === 0 ? goToMonth(year - 1, 11) : goToMonth(year, month - 1));
  const nextMonth = () => (month === 11 ? goToMonth(year + 1, 0) : goToMonth(year, month + 1));

  // Minggu dimulai hari Senin
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const [sy, sm, sd] = selected.split('-').map(Number);
  const selectedLabel = new Date(sy, sm - 1, sd).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const selectedMeetings = byDate[selected] || [];
  const totalPages = Math.max(1, Math.ceil(selectedMeetings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = selectedMeetings.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
        <div className="text-base font-semibold text-gray-900">Kalender Rapat</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToMonth(today.getFullYear(), today.getMonth())}
            className="text-xs text-gray-600 border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50"
          >
            Hari ini
          </button>
          <button onClick={prevMonth} aria-label="Bulan sebelumnya" className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-medium text-gray-800 w-36 text-center">
            {MONTH_NAMES[month]} {year}
          </div>
          <button onClick={nextMonth} aria-label="Bulan berikutnya" className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {/* Grid kalender */}
        <div className="col-span-2 p-4 border-r border-gray-100">
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-xs font-medium text-gray-400 text-center py-1.5">{d}</div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-60' : ''}`}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;

              const key = toKey(year, month, day);
              const list = byDate[key] || [];
              const isToday = key === todayKey;
              const isSelected = key === selected;

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`h-16 rounded border flex flex-col items-center pt-1.5 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full ${
                      isToday ? 'bg-[#0f2557] text-white font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>

                  {list.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {list.slice(0, 3).map((m) => (
                        <span key={m.id} className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[m.status] || 'bg-gray-400'}`} />
                      ))}
                      {list.length > 3 && (
                        <span className="text-[10px] text-gray-500 ml-0.5">+{list.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-gray-500">
            {Object.keys(DOT_COLOR).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${DOT_COLOR[s]}`} />
                {meetingStatusLabel(s)}
              </span>
            ))}
          </div>
        </div>

        {/* Daftar rapat di tanggal terpilih */}
        <div className="p-4 flex flex-col">
          <div className="text-sm font-semibold text-gray-800 mb-3">{selectedLabel}</div>

          {selectedMeetings.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada rapat di tanggal ini.</p>
          ) : (
            <>
              <div className="space-y-2">
                {pageItems.map((m) => (
                  <Link
                    key={m.id}
                    to={`/notulen/${m.id}`}
                    className="block border border-gray-200 rounded px-3 py-2.5 hover:border-blue-400 hover:bg-blue-50/40"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT_COLOR[m.status] || 'bg-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{m.meeting_title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.start_time?.slice(0, 5)}–{m.end_time?.slice(0, 5)}
                          {m.location ? ` · ${m.location}` : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, selectedMeetings.length)} dari {selectedMeetings.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Halaman sebelumnya"
                      className="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-gray-600 w-10 text-center">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Halaman berikutnya"
                      className="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}