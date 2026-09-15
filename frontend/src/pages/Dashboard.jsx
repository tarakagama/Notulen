const stats = [
  { label: 'Total Notulen', value: '48', delta: '+12%' },
  { label: 'Action Items Aktif', value: '23', delta: '+5' },
  { label: 'Menunggu Approval', value: '7', delta: '-2' },
  { label: 'Selesai Bulan Ini', value: '31', delta: '+18%' },
];

export default function Dashboard() {
  return (
    <>
      {/* Stat cards — full width grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold text-gray-900">{s.value}</span>
              <span className="text-xs text-green-600">{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table — full width */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Notulen Terbaru</h2>
          <button className="text-xs text-blue-600 hover:underline">Lihat Semua</button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-4 py-2 font-medium">Judul Rapat</th>
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Notulis</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800">Rapat Koordinasi Divisi IT #{i}</td>
                <td className="px-4 py-2.5 text-gray-500">12 Sep 2026</td>
                <td className="px-4 py-2.5 text-gray-500">Taraka</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[11px]">Draft</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}