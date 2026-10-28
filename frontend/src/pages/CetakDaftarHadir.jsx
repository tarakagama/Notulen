import { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { listBookings } from '../api/rooms';
import { dateOf, timeOf, formatDate } from '../lib/datetime';

const SPARE_ROWS = 5;
const MAX_ROWS = 100;

// invitee_ids bisa berupa array atau string JSON, tergantung cast di model
function countInvitees(booking) {
  let ids = booking.invitee_ids;
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids); } catch { ids = []; }
  }
  return Array.isArray(ids) ? ids.length : 0;
}

function suggestRows(booking) {
  const invited = countInvitees(booking);
  const rows = invited > 0 ? invited + 1 + SPARE_ROWS : (booking.room?.capacity || 20);
  return Math.min(Math.max(rows, 1), MAX_ROWS);
}

export default function CetakDaftarHadir() {
  const [form, setForm] = useState({
    acara: '',
    tanggal: '',
    tempat: '',
    jumlah_baris: 20,
  });
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listBookings({ status: 'Approved', per_page: 100 })
      .then((res) => setBookings(res.data || res))
      .catch(() => setLoadError('Daftar booking gagal dimuat. Kamu masih bisa mengisi manual.'));
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePickBooking = (e) => {
    const id = e.target.value;
    setBookingId(id);
    const booking = bookings.find((b) => String(b.id) === id);
    if (!booking) return;

    const room = booking.room;
    setForm({
      acara: booking.title || '',
      tanggal: dateOf(booking.start_time),
      tempat: room ? `${room.room_name} (${room.building} Lt. ${room.floor})` : '',
      jumlah_baris: suggestRows(booking),
    });
  };

  const handleDownload = () => {
    const doc = new jsPDF();

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('DAFTAR HADIR', 105, 15, { align: 'center' });
    doc.setFont(undefined, 'normal');

    // Tanggal dibuat dari bagian-bagiannya (bukan new Date('YYYY-MM-DD')) supaya tidak bergeser zona waktu
    let tanggalFormatted = '-';
    if (form.tanggal) {
      const [y, m, d] = form.tanggal.split('-').map(Number);
      tanggalFormatted = new Date(y, m - 1, d).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    }

    doc.setFontSize(10);
    let y = 26;
    [
      ['Acara', form.acara || '-'],
      ['Hari / Tanggal', tanggalFormatted],
      ['Tempat', form.tempat || '-'],
    ].forEach(([label, value]) => {
      // Teks panjang (judul rapat dari booking) dibungkus, bukan meluber keluar halaman
      const wrapped = doc.splitTextToSize(`: ${value}`, 140);
      doc.text(label, 20, y);
      doc.text(wrapped, 50, y);
      y += 6 * wrapped.length;
    });

    const jumlah = Math.min(Math.max(Number(form.jumlah_baris) || 20, 1), MAX_ROWS);
    const emptyRows = Array.from({ length: jumlah }, (_, i) => [i + 1, '', '', '']);

    autoTable(doc, {
      startY: y,
      head: [['No', 'Nama', 'Divisi/Instansi', 'Tanda Tangan']],
      body: emptyRows,
      styles: { fontSize: 9, cellPadding: 3, minCellHeight: 9, lineColor: [0, 0, 0], lineWidth: 0.2 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 },
        3: { cellWidth: 43 },
      },
      theme: 'grid',
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text('Mengetahui,', 140, finalY);
    doc.line(140, finalY + 20, 190, finalY + 20);

    const safeName = (form.acara || 'Rapat').replace(/[\\/:*?"<>|]/g, '-');
    doc.save(`Daftar-Hadir-${safeName}.pdf`);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Printer size={18} className="text-[#0f2557]" />
          <h2 className="text-sm font-semibold text-gray-800">Cetak Template Daftar Hadir</h2>
        </div>
        <p className="text-xs text-gray-400">
          Pilih booking rapat agar data terisi otomatis, atau isi manual. Unduh sebagai PDF kosong untuk dicetak dan diisi tanda tangan basah saat rapat offline.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Ambil dari booking (opsional)</label>
          <select
            value={bookingId}
            onChange={handlePickBooking}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Isi manual</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {formatDate(b.start_time)} {timeOf(b.start_time)} · {b.title} · {b.room?.room_name}
              </option>
            ))}
          </select>
          {loadError && <p className="text-xs text-red-600 mt-1">{loadError}</p>}
          {!loadError && bookings.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Belum ada booking yang disetujui.</p>
          )}
        </div>

        <Field label="Acara" value={form.acara} onChange={handleChange('acara')} placeholder="Rapat Koordinasi Divisi IT" />
        <Field label="Hari / Tanggal" type="date" value={form.tanggal} onChange={handleChange('tanggal')} />
        <Field label="Tempat" value={form.tempat} onChange={handleChange('tempat')} placeholder="Ruang Rapat Lantai 3" />
        <div>
          <Field label="Jumlah Baris" type="number" value={form.jumlah_baris} onChange={handleChange('jumlah_baris')} />
          <p className="text-xs text-gray-400 mt-1">
            Dari booking: jumlah undangan + 1 (pemesan) + {SPARE_ROWS} baris cadangan. Bisa kamu ubah.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]"
        >
          <Download size={15} strokeWidth={1.75} />
          Unduh PDF
        </button>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={type === 'number' ? 1 : undefined}
        max={type === 'number' ? MAX_ROWS : undefined}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}