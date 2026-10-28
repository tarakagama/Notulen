import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import BookingStatusBadge from '../components/BookingStatusBadge';
import InviteePicker from '../components/InviteePicker';
import RoomSchedule from '../components/RoomSchedule';
import { useAuth } from '../context/AuthContext';
import { getAvailability, createBooking, listBookings, cancelBooking, getBookingSettings } from '../api/rooms';
import { listUsers } from '../api/users';
import { extractError } from '../lib/errors';
import { formatRange, toApiDateTime, todayString } from '../lib/datetime';
import { BOOKING_STATUS_TO_LABEL } from '../lib/statuslabels';

const pad2 = (n) => String(n).padStart(2, '0');
const currentTime = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// Opsi jam per jam,buka sampai jam tutup (sesuai step input sebelumnya).
const timeOptions = (open, close, step = 60) => {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const out = [];
  for (let m = toMin(open); m <= toMin(close); m += step) {
    out.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
  }
  return out;
};

export default function Booking() {
  const { user } = useAuth();
  // Viewer hanya boleh melihat ketersediaan ruangan (read-only).
  const canBook = user?.global_role !== 'Viewer';
  const [tab, setTab] = useState('cari');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        <TabButton active={tab === 'cari'} onClick={() => setTab('cari')}>Cari Ruangan</TabButton>
        {canBook && (
          <TabButton active={tab === 'saya'} onClick={() => setTab('saya')}>Booking Saya</TabButton>
        )}
      </div>

      {tab === 'cari' ? (
        <FindRoom canBook={canBook} onViewMine={() => setTab('saya')} />
      ) : (
        <MyBookings />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm -mb-px border-b-2 ${
        active ? 'border-[#0f2557] text-[#0f2557] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// ── Tab 1: cari ruangan & booking ────────────────────────────────────────

function FindRoom({ canBook, onViewMine }) {
  const { user } = useAuth();
  const [date, setDate] = useState(todayString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [result, setResult] = useState(null);
  const [scheduleKey, setScheduleKey] = useState(0);
  const [nowTime, setNowTime] = useState(currentTime);
    useEffect(() => {
      const t = setInterval(() => setNowTime(currentTime()), 30000);
      return () => clearInterval(t);
    }, []);

  // Jam operasional diambil dari server (config/booking.php); nilai awal dipakai kalau gagal dimuat.
  const [hours, setHours] = useState({ open_time: '08:00', close_time: '1600' });

  const isToday = date === todayString();
  const pastDate = !!date && date < todayString(); // tanggal lampau: hanya untuk melihat riwayat jadwal
  const orderOk = !!startTime && !!endTime && endTime > startTime;
  const withinHours = !!startTime && !!endTime
    && startTime >= hours.open_time && endTime <= hours.close_time;
  const validRange = !!date && orderOk && withinHours && !pastDate;
  const dayClosed = isToday && nowTime >= hours.close_time;          // hari ini sudah lewat jam tutup
  // Jam mulai baru dianggap lewat kalau jamnya sudah berganti: pukul 10.20 masih bisa mulai 10.00.
  const currentHour = `${nowTime.slice(0, 2)}:00`;
  const startPassed = isToday && !dayClosed && !!startTime && startTime < currentHour;
  const closedNow = pastDate || dayClosed || startPassed;
  const rangeError = pastDate
    ? 'Tanggal ini sudah lewat. Jadwal hanya bisa dilihat sebagai riwayat.'
    : !orderOk
      ? 'Jam selesai harus setelah jam mulai.'
      : !withinHours
        ? `Booking hanya bisa antara pukul ${hours.open_time} dan ${hours.close_time}.`
        : dayClosed
          ? `Booking hari ini sudah ditutup (jam operasional berakhir pukul ${hours.close_time}). Pilih tanggal lain.`
          : startPassed
            ? 'Jam mulai sudah lewat. Pilih jam yang belum berlalu.'
            : '';

  const loadAvailability = useCallback(() => {
    if (!validRange) {
      setRooms([]);
      return;
    }
    setLoading(true);
    setError('');
    getAvailability({
      start_time: toApiDateTime(date, startTime),
      end_time: toApiDateTime(date, endTime),
    })
      .then(setRooms)
      .catch((err) => setError(extractError(err, 'Gagal memuat ketersediaan ruangan.')))
      .finally(() => setLoading(false));
  }, [date, startTime, endTime, validRange]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  useEffect(() => {
    getBookingSettings().then(setHours).catch(() => {});
  }, []);

  useEffect(() => {
    listUsers().then((data) => setUsers(data.data || data)).catch(() => {});
  }, []);

  // Pemesan otomatis jadi notulis. PIC ruangan murni tidak bisa membuka notulen, jadi tidak ditawarkan.
  const otherUsers = users.filter(
    (u) => u.id !== user?.id
      && !(u.can_manage_rooms && !['SuperAdmin', 'AdminDivisi'].includes(u.global_role))
  );
  
  const allTimes = timeOptions(hours.open_time, hours.close_time);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Jam mulai</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
          >
            {allTimes.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Jam selesai</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
          >
            {allTimes.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {rangeError ? (
          <p className="text-xs text-red-600 pb-2">{rangeError}</p>
        ) : (
          <p className="text-xs text-gray-400 pb-2">Jam booking {hours.open_time}–{hours.close_time}</p>
        )}
      </div>

      {result && (
        <ResultBanner booking={result} onViewMine={onViewMine} onClose={() => setResult(null)} />
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <RoomSchedule
        date={date}
        reloadKey={scheduleKey}
        openTime={hours.open_time}
        closeTime={hours.close_time}
                onPick={dayClosed || pastDate ? undefined : (room, start, end) => { setStartTime(start); setEndTime(end); }}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Memuat ketersediaan ruangan...</p>
      ) : validRange && rooms.length === 0 && !error ? (
        <p className="text-sm text-gray-400">Belum ada ruangan aktif.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white border border-gray-200 rounded p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{room.room_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} strokeWidth={1.75} />
                    {room.building} · Lt. {room.floor}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs shrink-0 ${
                    closedNow
                      ? 'bg-gray-100 text-gray-500'
                      : room.is_available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {closedNow ? 'Tutup' : room.is_available ? 'Tersedia' : 'Terpakai'}
                </span>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <UsersIcon size={12} strokeWidth={1.75} />
                Kapasitas {room.capacity} orang
              </p>

              {room.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {room.facilities.map((f) => (
                    <span key={f} className="text-xs bg-gray-50 text-gray-600 rounded px-2 py-0.5">{f}</span>
                  ))}
                </div>
              )}

              {canBook && (
                <button
                  onClick={() => setSelectedRoom(room)}
                  disabled={closedNow || !room.is_available}
                  className="mt-auto self-start text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Booking ruangan ini
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          date={date}
          startTime={startTime}
          endTime={endTime}
          users={otherUsers}
          onClose={() => setSelectedRoom(null)}
          onConflict={() => { setScheduleKey((k) => k + 1); loadAvailability(); }}
          onBooked={(booking) => {
            setSelectedRoom(null);
            setResult(booking);
            setScheduleKey((k) => k + 1);
            loadAvailability();
          }}
        />
      )}
    </div>
  );
}

function ResultBanner({ booking, onViewMine, onClose }) {
  const approved = booking.status === 'Approved';

  return (
    <div className={`border rounded px-4 py-3 text-sm ${approved ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">
            {approved ? 'Booking disetujui.' : 'Booking diajukan, menunggu persetujuan pengelola ruangan.'}
          </p>
          <p className="text-xs opacity-80">
            {booking.room?.room_name} · {formatRange(booking.start_time, booking.end_time)}
          </p>
          {approved && booking.meeting?.id ? (
            <p className="text-xs">
              Draf notulen sudah dibuat.{' '}
              <Link to={`/notulen/${booking.meeting.id}`} className="underline font-medium">
                Buka notulen
              </Link>
              . Tunjuk approver saat melengkapi notulen.
            </p>
          ) : (
            <p className="text-xs">
              Draf notulen dibuat otomatis setelah booking disetujui.{' '}
              <button onClick={onViewMine} className="underline font-medium">Lihat Booking Saya</button>
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-xs opacity-60 hover:opacity-100">Tutup</button>
      </div>
    </div>
  );
}

function BookingModal({ room, date, startTime, endTime, users, onClose, onConflict, onBooked }) {
  const [form, setForm] = useState({ title: '', purpose: '', approver_id: '', invitees: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        room_id: room.id,
        title: form.title.trim(),
        start_time: toApiDateTime(date, startTime),
        end_time: toApiDateTime(date, endTime),
        attendee_user_ids: form.invitees,
      };
      if (form.purpose.trim()) payload.purpose = form.purpose.trim();
      if (form.approver_id) payload.approver_id = Number(form.approver_id);

      const booking = await createBooking(payload);
      onBooked(booking);
    } catch (err) {
      setError(extractError(err, 'Gagal membuat booking.'));
      // Bentrok (422 pada room_id): segarkan ketersediaan supaya kartu ruangan ikut berubah.
      if (err.response?.status === 422 && err.response?.data?.errors?.room_id) onConflict();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Booking ${room.room_name}`} onClose={onClose}>
      <p className="text-xs text-gray-500 mb-3">{formatRange(`${date} ${startTime}`, `${date} ${endTime}`)}</p>

      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Judul / agenda rapat</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={255}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Keperluan (opsional)</label>
          <textarea
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Approver notulen (opsional)</label>
          <select
            value={form.approver_id}
            onChange={(e) => setForm({ ...form, approver_id: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Tentukan nanti di notulen</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Undang peserta (opsional)</label>
          <InviteePicker
            users={users}
            selectedIds={form.invitees}
            onChange={(ids) => setForm({ ...form, invitees: ids })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={saving} className="text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60">
            {saving ? 'Memproses...' : 'Ajukan Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Tab 2: booking saya ──────────────────────────────────────────────────

function MyBookings() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // paginator
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forceTarget, setForceTarget] = useState(null); // { booking, message }

  const load = useCallback(() => {
    setLoading(true);
    listBookings({ status: statusFilter || undefined, page, per_page: 10 })
      .then(setData)
      .catch(() => setError('Gagal memuat daftar booking.'))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (booking, force = false) => {
    setError('');
    try {
      await cancelBooking(booking.id, { force });
      setForceTarget(null);
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        // Draf notulen sudah berisi data: minta konfirmasi sebelum menghapusnya.
        setForceTarget({ booking, message: err.response.data?.message });
      } else {
        setForceTarget(null);
        setError(extractError(err, 'Gagal membatalkan booking.'));
      }
    }
  };

  const confirmCancel = (booking) => {
    if (window.confirm(`Batalkan booking "${booking.title}"?`)) handleCancel(booking);
  };

  const bookings = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Semua status</option>
          {Object.entries(BOOKING_STATUS_TO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Belum ada booking.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Agenda</th>
                <th className="px-5 py-3.5 font-medium">Ruangan</th>
                <th className="px-5 py-3.5 font-medium">Waktu</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{b.title}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {b.room?.room_name}
                    <span className="block text-xs text-gray-400">{b.room?.building} · Lt. {b.room?.floor}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatRange(b.start_time, b.end_time)}</td>
                  <td className="px-5 py-3.5">
                    <BookingStatusBadge status={b.status} />
                    {b.status === 'Rejected' && b.review_note && (
                      <p className="text-xs text-red-600 mt-1.5 max-w-[14rem]">Alasan: {b.review_note}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3 text-xs">
                      {b.meeting?.id && (
                        <Link to={`/notulen/${b.meeting.id}`} className="text-blue-600 hover:underline">
                          Buka notulen
                        </Link>
                      )}
                      {['Pending', 'Approved'].includes(b.status) && (
                        <button onClick={() => confirmCancel(b)} className="text-red-600 hover:underline">
                          Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination meta={data} onPage={setPage} />
      </div>

      {forceTarget && (
        <Modal title="Hapus draf notulen?" onClose={() => setForceTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            {forceTarget.message || 'Draf notulen sudah berisi data.'}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Membatalkan booking "{forceTarget.booking.title}" akan menghapus draf notulennya beserta isinya.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setForceTarget(null)} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
              Kembali
            </button>
            <button
              onClick={() => handleCancel(forceTarget.booking, true)}
              className="text-sm text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700"
            >
              Batalkan & hapus draf
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}