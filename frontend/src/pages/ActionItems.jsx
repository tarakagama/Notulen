import { Search, Filter, CheckCircle2, Circle, Clock } from 'lucide-react';

const mockActionItems = [
  { id: 1, item: 'Selesaikan modul dashboard executive', pic: 'Taraka', sumber: 'Rapat Koordinasi Divisi IT', deadline: '19 Sep 2026', status: 'Berjalan' },
  { id: 2, item: 'Review ulang SOP keamanan data', pic: 'Riki', sumber: 'Rapat Review SOP Keamanan', deadline: '15 Sep 2026', status: 'Terlambat' },
  { id: 3, item: 'Siapkan materi onboarding batch 2', pic: 'Hadi', sumber: 'Rapat Onboarding Karyawan Baru', deadline: '20 Sep 2026', status: 'Belum Mulai' },
  { id: 4, item: 'Follow up vendor terkait integrasi API', pic: 'Dili', sumber: 'Rapat Evaluasi Proyek Q3', deadline: '10 Sep 2026', status: 'Selesai' },
  { id: 5, item: 'Update dokumentasi teknis approval engine', pic: 'Radit', sumber: 'Rapat Pendampingan Operasi ICO', deadline: '22 Sep 2026', status: 'Berjalan' },
];

const statusConfig = {
  'Belum Mulai': { style: 'bg-gray-50 text-gray-600', icon: Circle },
  Berjalan: { style: 'bg-blue-50 text-blue-700', icon: Clock },
  Selesai: { style: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  Terlambat: { style: 'bg-red-50 text-red-700', icon: Clock },
};

export default function ActionItems() {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Belum Mulai', value: 1, color: 'text-gray-600' },
          { label: 'Berjalan', value: 2, color: 'text-blue-600' },
          { label: 'Selesai', value: 1, color: 'text-green-600' },
          { label: 'Terlambat', value: 1, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <span className={`text-2xl font-semibold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari action item..."
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 rounded px-4 py-2.5 hover:bg-gray-50">
          <Filter size={16} strokeWidth={1.75} />
          Filter Status
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3.5 font-medium">Action Item</th>
              <th className="px-5 py-3.5 font-medium">PIC</th>
              <th className="px-5 py-3.5 font-medium">Sumber Rapat</th>
              <th className="px-5 py-3.5 font-medium">Deadline</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockActionItems.map((item) => {
              const { style, icon: Icon } = statusConfig[item.status];
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{item.item}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.pic}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.sumber}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.deadline}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${style}`}>
                      <Icon size={12} strokeWidth={2} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}