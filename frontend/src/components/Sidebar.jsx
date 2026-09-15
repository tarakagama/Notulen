import { LayoutDashboard, FileText, CheckSquare, Users, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Notulen', path: '/notulen' },
  { icon: CheckSquare, label: 'Action Items', path: '/action-items' },
  { icon: Users, label: 'User Management', path: '/users' },
  { icon: Settings, label: 'Pengaturan', path: '/settings' },
];

export default function Sidebar({ activePath = '/' }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0f2557] flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/10">
        <span className="text-white font-semibold text-sm tracking-wide">MoMHub</span>
        <span className="ml-2 text-[10px] text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded">
          PLN EPI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === activePath;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-blue-400'
                  : 'text-blue-200/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <Icon size={17} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <button className="flex items-center gap-2 text-blue-200/60 hover:text-white text-xs w-full">
          <LogOut size={15} strokeWidth={1.75} />
          Keluar
        </button>
      </div>
    </aside>
  );
}