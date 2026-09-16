import { Search, Plus, MoreVertical } from 'lucide-react';

const mockUsers = [
  { id: 1, nama: 'Taraka', email: 'taraka@plnepi.co.id', role: 'Admin', status: 'Aktif' },
  { id: 2, nama: 'Dili', email: 'dili@plnepi.co.id', role: 'User', status: 'Aktif' },
  { id: 3, nama: 'Hadi', email: 'hadi@plnepi.co.id', role: 'User', status: 'Aktif' },
  { id: 4, nama: 'Radit', email: 'radit@plnepi.co.id', role: 'User', status: 'Nonaktif' },
  { id: 5, nama: 'Riki', email: 'riki@plnepi.co.id', role: 'User', status: 'Aktif' },
];

const roleStyle = {
  Admin: 'bg-purple-50 text-purple-700',
  User: 'bg-gray-50 text-gray-600',
};

const statusStyle = {
  Aktif: 'bg-green-50 text-green-700',
  Nonaktif: 'bg-red-50 text-red-700',
};

export default function Users() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari user..."
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded w-72 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2.5 hover:bg-[#0c1e47]">
          <Plus size={16} strokeWidth={1.75} />
          Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3.5 font-medium">Nama</th>
              <th className="px-5 py-3.5 font-medium">Email</th>
              <th className="px-5 py-3.5 font-medium">Role</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3.5 text-gray-800 font-medium">{u.nama}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded text-xs ${roleStyle[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[u.status]}`}>{u.status}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-gray-400 hover:text-gray-700">
                    <MoreVertical size={16} strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}