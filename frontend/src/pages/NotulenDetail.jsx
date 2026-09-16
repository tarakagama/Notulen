import { ArrowLeft, Calendar, MapPin, User, Edit } from 'lucide-react';

const mockDetail = {
  judul: 'Rapat Koordinasi Divisi IT',
  tanggal: '12 September 2026',
  waktuTempat: '09.00 - 11.00 WIB, Ruang Rapat Lantai 3',
  notulis: 'Taraka',
  status: 'Draft',
  latarBelakang:
    'Rapat ini diadakan untuk membahas progres pengembangan sistem MoMHub dan koordinasi antar divisi terkait kebutuhan integrasi data.',
  pembahasan:
    'Tim IT memaparkan progres development modul dashboard dan approval engine. Dibahas juga kendala teknis terkait koneksi database dan timeline MVP yang ditargetkan selesai dalam 4 minggu.',
  hasilPembahasan:
    'Disepakati bahwa modul dashboard akan diselesaikan minggu depan, dan approval engine akan mulai dikerjakan setelah modul editor notulen selesai. PIC masing-masing modul akan melaporkan progres setiap Jumat.',
};

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Menunggu Approval': 'bg-blue-50 text-blue-700',
  Disetujui: 'bg-green-50 text-green-700',
};

export default function NotulenDetail() {
  return (
    <div className="space-y-4">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Kembali ke daftar notulen
        </button>
        <button className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47]">
          <Edit size={15} strokeWidth={1.75} />
          Edit Notulen
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{mockDetail.judul}</h2>
          <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[mockDetail.status]}`}>
            {mockDetail.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            {mockDetail.tanggal}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            {mockDetail.waktuTempat}
          </div>
          <div className="flex items-center gap-2">
            <User size={15} className="text-gray-400" />
            Notulis: {mockDetail.notulis}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
        <Section title="Latar Belakang" content={mockDetail.latarBelakang} />
        <Section title="Pembahasan" content={mockDetail.pembahasan} />
        <Section title="Hasil Pembahasan / Tindak Lanjut / Kesepakatan" content={mockDetail.hasilPembahasan} />

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Daftar Hadir</h3>
          <p className="text-sm text-gray-400">Belum ada dokumen daftar hadir diunggah.</p>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Dokumentasi</h3>
          <p className="text-sm text-gray-400">Tidak ada dokumentasi untuk rapat ini.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
    </div>
  );
}