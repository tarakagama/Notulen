import { useState, useEffect } from 'react';
import { getRoomSchedule } from '../api/rooms';
import { timeOf } from '../lib/datetime';

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Bar booking dipotong ke jendela jam operasional; booking lintas hari ikut terpotong.
function barStyle(booking, date, dayStart, dayEnd) {
  const totalMin = (dayEnd - dayStart) * 60;
  const startsToday = booking.start_time.slice(0, 10) === date;
  const endsToday = booking.end_time.slice(0, 10) === date;
  const s = startsToday ? toMinutes(timeOf(booking.start_time)) : 0;
  const e = endsToday ? toMinutes(timeOf(booking.end_time)) : 24 * 60;
  const from = Math.max(s, dayStart * 60) - dayStart * 60;
  const to = Math.min(e, dayEnd * 60) - dayStart * 60;
  if (to <= from) return null;
  return { left: `${(from / totalMin) * 100}%`, width: `${((to - from) / totalMin) * 100}%` };
}

/**
 * Grid ruangan × jam. Putih = kosong, biru = Approved, kuning = Pending.
 * Klik jam kosong -> onPick(room, 'HH:00', 'HH+1:00').
 * reloadKey: ubah nilainya untuk memuat ulang (mis. setelah booking berhasil).
 */
export default function RoomSchedule({ date, reloadKey = 0, openTime = '08:00', closeTime = '18:00', onPick }) {
  const DAY_START = Math.floor(toMinutes(openTime) / 60);
  const DAY_END = Math.ceil(toMinutes(closeTime) / 60);
  const HOURS = Array.from({ length: Math.max(DAY_END - DAY_START, 1) }, (_, i) => DAY_START + i);

  const [state, setState] = useState({ key: null, rooms: [], error: '' });
  const requestKey = `${date}|${reloadKey}`;

  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;
    getRoomSchedule(date)
      .then((rooms) => { if (!cancelled) setState({ key: requestKey, rooms, error: '' }); })
      .catch(() => { if (!cancelled) setState({ key: requestKey, rooms: [], error: 'Gagal memuat jadwal ruangan.' }); });
    return () => { cancelled = true; };
  }, [date, requestKey]);

  const loading = state.key !== requestKey;

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Jadwal Ruangan</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-sm bg-white border border-gray-300" /> Kosong</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> Terpakai</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-sm bg-yellow-400" /> Menunggu persetujuan</span>
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 p-4">{state.error}</p>
      ) : loading && state.rooms.length === 0 ? (
        <p className="text-sm text-gray-400 p-4">Memuat jadwal...</p>
      ) : (
        <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <div className="min-w-[760px]">
            <div className="flex border-b border-gray-100 text-[11px] text-gray-500">
              <div className="w-44 shrink-0 px-4 py-2">Ruangan</div>
              <div className="flex-1 flex">
                {HOURS.map((h) => (
                  <div key={h} className="flex-1 py-2 pl-1 border-l border-gray-100">{pad(h)}.00</div>
                ))}
              </div>
            </div>

            {state.rooms.map((room) => (
              <div key={room.id} className="flex border-b border-gray-50 last:border-b-0">
                <div className="w-44 shrink-0 px-4 py-2">
                  <p className="text-xs font-medium text-gray-800 truncate">{room.room_name}</p>
                  <p className="text-[11px] text-gray-400">Lt. {room.floor} · {room.capacity} org</p>
                </div>
                <div className="flex-1 relative h-11">
                  <div className="absolute inset-0 flex">
                    {HOURS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        disabled={!onPick}
                        onClick={() => onPick?.(room, `${pad(h)}:00`, `${pad(h + 1)}:00`)}
                        aria-label={`${room.room_name} ${pad(h)}.00`}
                        className={`flex-1 border-l border-gray-100 ${onPick ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'}`}
                      />
                    ))}
                  </div>
                  {(room.bookings || []).map((b) => {
                    const style = barStyle(b, date, DAY_START, DAY_END);
                    if (!style) return null;
                    const pending = b.status === 'Pending';
                    return (
                      <div
                        key={b.id}
                        style={style}
                        title={`${timeOf(b.start_time)}–${timeOf(b.end_time)} · ${b.booked_by || '-'}${pending ? ' (menunggu persetujuan)' : ''}`}
                        className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center text-[11px] overflow-hidden whitespace-nowrap ${
                          pending ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {timeOf(b.start_time)}–{timeOf(b.end_time)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}