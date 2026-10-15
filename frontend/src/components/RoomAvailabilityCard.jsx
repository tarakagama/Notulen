import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DoorOpen } from 'lucide-react';
import { getRoomsToday } from '../api/rooms';

const REFRESH_MS = 5 * 60 * 1000;
const INITIAL_VISIBLE = 8;

const STATUS_STYLE = {
  available: 'bg-green-50 text-green-700',
  in_use: 'bg-red-50 text-red-700',
  closed: 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL = { available: 'Tersedia', in_use: 'Terpakai', closed: 'Tutup' };
const STATUS_ORDER = { available: 0, in_use: 1, closed: 2 };

function describe(room, closeTime) {
  if (room.status === 'in_use') return `Terpakai sampai ${room.busy_until}`;
  if (room.status === 'closed') return 'Di luar jam operasional';
  return room.next_start ? `Kosong sampai ${room.next_start}` : `Kosong sampai ${closeTime}`;
}

// Ringkasan ruangan hari ini di Dashboard: siapa yang kosong sekarang dan sampai jam berapa.
export default function RoomAvailabilityCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = () =>
      getRoomsToday()
        .then((res) => { setData(res); setError(''); })
        .catch(() => setError('Gagal memuat ketersediaan ruangan.'));

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  if (error) {
    return <div className="bg-white border border-gray-200 rounded p-4 text-sm text-red-600">{error}</div>;
  }
  if (!data) {
    return <div className="bg-white border border-gray-200 rounded p-4 text-sm text-gray-400">Memuat ruangan...</div>;
  }

  const rooms = [...data.rooms].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const visible = showAll ? rooms : rooms.slice(0, INITIAL_VISIBLE);

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <DoorOpen size={16} strokeWidth={1.75} />
            Ruangan Hari Ini
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.is_open
              ? `${availableCount} dari ${rooms.length} ruangan tersedia sekarang`
              : `Di luar jam operasional (${data.open_time}–${data.close_time})`}
            {' · '}Jam operasional {data.open_time}–{data.close_time}
          </p>
        </div>
        <Link to="/booking" className="text-xs text-blue-600 hover:underline">Booking ruangan</Link>
      </div>

      {rooms.length === 0 ? (
        <p className="text-sm text-gray-400 p-4">Belum ada ruangan aktif.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 p-4">
            {visible.map((room) => (
              <Link
                key={room.id}
                to="/booking"
                className="border border-gray-200 rounded p-3 hover:border-blue-300 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{room.room_name}</p>
                  <span className={`px-2 py-0.5 rounded text-[11px] shrink-0 ${STATUS_STYLE[room.status]}`}>
                    {STATUS_LABEL[room.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{room.building} · Lt. {room.floor} · {room.capacity} orang</p>
                <p className="text-xs text-gray-500 mt-1.5">{describe(room, data.close_time)}</p>
              </Link>
            ))}
          </div>
          {rooms.length > INITIAL_VISIBLE && (
            <div className="px-4 pb-3 -mt-1">
              <button onClick={() => setShowAll(!showAll)} className="text-xs text-blue-600 hover:underline">
                {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${rooms.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}