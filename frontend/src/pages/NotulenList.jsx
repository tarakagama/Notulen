import { Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockNotulen = [
  { id: 1, judul: 'Rapat Koordinasi Divisi IT', tanggal: '12 Sep 2026', notulis: 'Taraka', status: 'Draft' },
  { id: 2, judul: 'Rapat Evaluasi Proyek Q3', tanggal: '10 Sep 2026', notulis: 'Dili', status: 'Menunggu Approval' },
  { id: 3, judul: 'Rapat Pendampingan Operasi ICO', tanggal: '08 Sep 2026', notulis: 'Radit', status: 'Disetujui' },
  { id: 4, judul: 'Rapat Onboarding Karyawan Baru', tanggal: '05 Sep 2026', notulis: 'Hadi', status: 'Disetujui' },
  { id: 5, judul: 'Rapat Review SOP Keamanan', tanggal: '01 Sep 2026', notulis: 'Riki', status: 'Draft' },
];

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Menunggu Approval': 'bg-blue-50 text-blue-700',
  Disetujui: 'bg-green-50 text-green-700',
  Ditolak: 'bg-red-50 text-red-700',
};

export default function NotulenList() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul rapat..."
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded px-4 py-2.5 hover:bg-gray-50">
            <Filter size={16} strokeWidth={1.75} />
            Filter Status
          </button>
          <button className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]">
            <Plus size={16} strokeWidth={1.75} />
            Buat Notulen
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3.5 font-medium">Judul Rapat</th>
              <th className="px-5 py-3.5 font-medium">Tanggal</th>
              <th className="px-5 py-3.5 font-medium">Notulis</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mockNotulen.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 text-gray-800 font-medium">{item.judul}</td>
                <td className="px-5 py-3.5 text-gray-500">{item.tanggal}</td>
                <td className="px-5 py-3.5 text-gray-500">{item.notulis}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link to={`/notulen/${item.id}`} className="text-blue-600 hover:underline text-sm">
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer pagination (dummy) */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Menampilkan 5 dari 48 notulen</span>
          <div className="flex gap-2">
            <button className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-50">
              Sebelumnya
            </button>
            <button className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-50">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}