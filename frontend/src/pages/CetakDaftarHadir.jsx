import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CetakDaftarHadir() {
  const [form, setForm] = useState({
    acara: '',
    tanggal: '',
    tempat: '',
    jumlah_baris: 20,
  });

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleDownload = () => {
    const doc = new jsPDF();

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('DAFTAR HADIR', 105, 15, { align: 'center' });
    doc.setFont(undefined, 'normal');

    const tanggalFormatted = form.tanggal
      ? new Date(form.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    doc.setFontSize(10);
    doc.text('Acara', 20, 26);
    doc.text(`: ${form.acara || '-'}`, 50, 26);
    doc.text('Hari / Tanggal', 20, 32);
    doc.text(`: ${tanggalFormatted}`, 50, 32);
    doc.text('Tempat', 20, 38);
    doc.text(`: ${form.tempat || '-'}`, 50, 38);

    const jumlah = Number(form.jumlah_baris) || 20;
    const emptyRows = Array.from({ length: jumlah }, (_, i) => [i + 1, '', '', '']);

    autoTable(doc, {
      startY: 44,
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

    doc.save(`Daftar-Hadir-${form.acara || 'Rapat'}.pdf`);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Printer size={18} className="text-[#0f2557]" />
          <h2 className="text-sm font-semibold text-gray-800">Cetak Template Daftar Hadir</h2>
        </div>
        <p className="text-xs text-gray-400">
          Isi info rapat di bawah, lalu unduh sebagai PDF kosong untuk dicetak dan diisi tanda tangan basah saat rapat offline.
        </p>

        <Field label="Acara" value={form.acara} onChange={handleChange('acara')} placeholder="Rapat Koordinasi Divisi IT" />
        <Field label="Hari / Tanggal" type="date" value={form.tanggal} onChange={handleChange('tanggal')} />
        <Field label="Tempat" value={form.tempat} onChange={handleChange('tempat')} placeholder="Ruang Rapat Lantai 3" />
        <Field label="Jumlah Baris" type="number" value={form.jumlah_baris} onChange={handleChange('jumlah_baris')} />

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
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}