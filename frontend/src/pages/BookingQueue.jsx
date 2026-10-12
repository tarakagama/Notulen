import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { listBookings, approveBooking, rejectBooking, cancelBooking } from '../api/rooms';
import { extractError } from '../lib/errors';
import { formatRange } from '../lib/datetime';
import { BOOKING_STATUS_TO_LABEL } from '../lib/statuslabels';

export default function BookingQueue() {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // paginator
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // booking yang sedang ditolak

  const load = useCallback(() => {
    setLoading(true);
    listBookings({ status: statusFilter || undefined, page, per_page: 10 })
      .then(setData)
      .catch(() => setError('Gagal memuat antrean booking.'))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (b) => {
    setError('');
    setBusyId(b.id);
    try {
      await approveBooking(b.id);
      load();
    } catch (err) {
      // 422: sudah bukan Pending, atau slotnya bentrok dengan booking lain
      setError(extractError(err, 'Gagal menyetujui booking.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (b) => {
    if (!window.confirm(`Batalkan booking "${b.title}"? Notulen milik pemohon tetap dipertahankan.`)) return;
    setError('');
    setBusyId(b.id);
    try {
      await cancelBooking(b.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal membatalkan booking.'));
    } finally {
      setBusyId(null);
    }
  };

  const bookings = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
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
        <p className="text-xs text-gray-400">Booking baru dari semua user masuk ke sini dengan status Menunggu.</p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">
            {statusFilter === 'Pending' ? 'Tidak ada booking yang menunggu persetujuan.' : 'Tidak ada booking.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3.5 font-medium">Pemohon</th>
                <th className="px-5 py-3.5 font-medium">Agenda</th>
                <th className="px-5 py-3.5 font-medium">Ruangan & Waktu</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                  <td className="px-5 py-3.5 text-gray-800">
                    {b.host?.full_name || '-'}
                    <span className="block text-xs text-gray-400">{b.host?.email}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    <span className="font-medium">{b.title}</span>
                    {b.purpose && <span className="block text-xs text-gray-400 mt-0.5 max-w-xs">{b.purpose}</span>}
                    {b.invitee_ids?.length > 0 && (
                      <span className="block text-xs text-gray-400 mt-0.5">{b.invitee_ids.length} peserta diundang</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {b.room?.room_name}
                    <span className="block text-xs text-gray-400">{b.room?.building} · Lt. {b.room?.floor}</span>
                    <span className="block text-xs text-gray-500 mt-0.5 whitespace-nowrap">{formatRange(b.start_time, b.end_time)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <BookingStatusBadge status={b.status} />
                    {b.status === 'Rejected' && b.review_note && (
                      <p className="text-xs text-red-600 mt-1.5 max-w-[14rem]">Alasan: {b.review_note}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {b.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(b)}
                            disabled={busyId === b.id}
                            className="text-xs text-white bg-green-600 rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-60"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => setRejecting(b)}
                            disabled={busyId === b.id}
                            className="text-xs border border-red-300 text-red-600 rounded px-3 py-1.5 hover:bg-red-50 disabled:opacity-60"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {b.status === 'Approved' && (
                        <button
                          onClick={() => handleCancel(b)}
                          disabled={busyId === b.id}
                          className="text-xs border border-gray-300 text-gray-600 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                        >
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

      {rejecting && (
        <RejectModal
          booking={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => { setRejecting(null); load(); }}
        />
      )}
    </div>
  );
}

function RejectModal({ booking, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await rejectBooking(booking.id, note.trim());
      onDone();
    } catch (err) {
      setError(extractError(err, 'Gagal menolak booking.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Tolak Booking" onClose={onClose}>
      <p className="text-xs text-gray-500 mb-3">
        {booking.title} · {booking.room?.room_name} · {formatRange(booking.start_time, booking.end_time)}
      </p>

      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Alasan penolakan (wajib)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            required
            maxLength={1000}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={saving || !note.trim()} className="text-sm text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-60">
            {saving ? 'Memproses...' : 'Tolak Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}