import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout({ children, title, activePath }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Sidebar activePath={activePath} />
      <div className="ml-60">
        <Topbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}