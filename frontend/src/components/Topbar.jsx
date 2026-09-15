import { Search, Bell } from 'lucide-react';

export default function Topbar({ title = 'Dashboard' }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-sm font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari notulen..."
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded w-56 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-[#0f2557] text-white text-xs flex items-center justify-center font-medium">
          A
        </div>
      </div>
    </header>
  );
}