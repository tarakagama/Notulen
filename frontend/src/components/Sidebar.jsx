import { useState } from 'react';
import {
  LayoutDashboard, FileText, CheckSquare, Users, Settings,
  LogOut, ChevronDown, User, Lock, Bell,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Notulen', path: '/notulen' },
  { icon: CheckSquare, label: 'Action Items', path: '/action-items' },
  { icon: Users, label: 'User Management', path: '/users' },
  {
    icon: Settings,
    label: 'Pengaturan',
    path: '/settings',
    children: [
      { icon: User, label: 'Profil', path: '/settings/profil' },
      { icon: Lock, label: 'Keamanan', path: '/settings/keamanan' },
      { icon: Bell, label: 'Notifikasi', path: '/settings/notifikasi' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(
    location.pathname.startsWith('/settings') ? 'Pengaturan' : null
  );

  const visibleNavItems = navItems.filter((item) => item.path !== '/users' || isAdmin);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0f2557] flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/10">
        <span className="text-white font-semibold text-sm tracking-wide">MoMHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isParentActive = location.pathname.startsWith(item.path);
          const isOpen = expanded === item.label;

          if (!hasChildren) {
            const isActive = location.pathname === item.path;
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
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => setExpanded(isOpen ? null : item.label)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isParentActive
                    ? 'bg-white/10 text-white border-l-2 border-blue-400'
                    : 'text-blue-200/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="bg-black/10">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-3 pl-10 pr-5 py-2 text-xs transition-colors ${
                          isChildActive
                            ? 'text-white font-medium'
                            : 'text-blue-200/60 hover:text-white'
                        }`}
                      >
                        <ChildIcon size={14} strokeWidth={1.75} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-blue-200/60 hover:text-white text-xs w-full"
        >
          <LogOut size={15} strokeWidth={1.75} />
          Keluar
        </button>
      </div>
    </aside>
  );
}