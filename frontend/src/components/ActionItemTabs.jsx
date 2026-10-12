import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { label: 'Tugas Saya', path: '/action-items' },
  { label: 'Semua Action Item', path: '/action-items/semua' },
];

// Tab navigasi antara "Tugas Saya" dan "Semua Action Item" (dipakai di kedua halaman).
export default function ActionItemTabs() {
  const { pathname } = useLocation();

  return (
    <div className="flex gap-1 border-b border-gray-200">
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 ${
              active ? 'border-[#0f2557] text-[#0f2557] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}