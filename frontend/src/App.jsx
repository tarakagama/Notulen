import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RequireRole from './routes/RequireRole';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotulenList from './pages/NotulenList';
import ActionItems from './pages/ActionItems';
import ActionItemsOverview from './pages/ActionItemsOverview';
import Users from './pages/Users';
import Divisions from './pages/Divisions';
import Booking from './pages/Booking';
import BookingQueue from './pages/BookingQueue';
import RoomsManage from './pages/RoomsManage';
import Settings from './pages/Settings';
import NotulenDetail from './pages/NotulenDetail';
import NotulenEditor from './pages/NotulenEditor';
import CetakDaftarHadir from './pages/CetakDaftarHadir';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout title="Dashboard"><Dashboard /></DashboardLayout>} />
            {/* Notulen: PIC ruangan murni tidak punya akses */}
            <Route element={<RequireRole check={(a) => !a.isRoomPic} />}>
              <Route path="/notulen" element={<DashboardLayout title="Notulen"><NotulenList /></DashboardLayout>} />
              <Route path="/notulen/baru" element={<DashboardLayout title="Buat Notulen"><NotulenEditor /></DashboardLayout>} />
              <Route path="/notulen/:id" element={<DashboardLayout title="Detail Notulen"><NotulenDetail /></DashboardLayout>} />
              <Route path="/notulen/:id/edit" element={<DashboardLayout title="Edit Notulen"><NotulenEditor /></DashboardLayout>} />
            </Route>
            <Route path="/cetak-daftar-hadir" element={<DashboardLayout title="Cetak Daftar Hadir"><CetakDaftarHadir /></DashboardLayout>} />
            <Route path="/booking" element={<DashboardLayout title="Booking Ruangan"><Booking /></DashboardLayout>} />
            <Route path="/action-items" element={<DashboardLayout title="Action Items"><ActionItems /></DashboardLayout>} />
            <Route path="/action-items/semua" element={<DashboardLayout title="Action Items"><ActionItemsOverview /></DashboardLayout>} />
            <Route path="/settings/:tab" element={<DashboardLayout title="Pengaturan"><Settings /></DashboardLayout>} />
            <Route path="/settings" element={<Navigate to="/settings/profil" replace />} />

            {/* Hanya pengelola ruangan (dan Super Admin) */}
            <Route element={<RequireRole check={(a) => a.canManageRooms} />}>
              <Route path="/booking/antrean" element={<DashboardLayout title="Antrean Booking"><BookingQueue /></DashboardLayout>} />
              <Route path="/ruangan" element={<DashboardLayout title="Kelola Ruangan"><RoomsManage /></DashboardLayout>} />
            </Route>

            {/* Super Admin dan Admin Divisi (Admin Divisi hanya mengelola divisinya) */}
            <Route element={<RequireRole check={(a) => a.canManageUsers} />}>
              <Route path="/users" element={<DashboardLayout title="User Management"><Users /></DashboardLayout>} />
            </Route>

            {/* Hanya Super Admin */}
            <Route element={<RequireRole check={(a) => a.isSuperAdmin} />}>
              <Route path="/divisi" element={<DashboardLayout title="Divisi"><Divisions /></DashboardLayout>} />
              <Route path="/ruangan" element={<DashboardLayout title="Kelola Ruangan"><RoomsManage /></DashboardLayout>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}