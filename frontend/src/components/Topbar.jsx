import { Bell } from 'lucide-react';
import logoPlnEpi from '../assets/logo-plnepi.png';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';

export default function Topbar({ title = 'Dashboard' }) {
  const { user } = useAuth();

  const initial = user?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <img src={logoPlnEpi} alt="PLN EPI" className="h-12 w-auto" />
        <div className="h-7 w-px bg-gray-300" />
        <div className="text-xl font-semibold text-gray-900">{title}</div>
      </div>

      <div className="flex items-center gap-5">
        <GlobalSearch />
        <button className="relative p-2 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100">
          <Bell size={22} strokeWidth={1.75} />
        </button>
        <div
          className="w-10 h-10 rounded-full bg-[#0f2557] text-white text-base flex items-center justify-center font-semibold"
          title={user?.full_name}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}