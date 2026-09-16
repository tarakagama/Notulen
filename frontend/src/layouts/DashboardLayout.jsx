import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Sidebar />
      <div className="ml-60">
        <Topbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}