import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotulenList from './pages/NotulenList';
import ActionItems from './pages/ActionItems';
import Users from './pages/Users';
import Settings from './pages/Settings';
import NotulenDetail from './pages/NotulenDetail';
import NotulenEditor from './pages/NotulenEditor';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout title="Dashboard"><Dashboard /></DashboardLayout>} />
            <Route path="/notulen" element={<DashboardLayout title="Notulen"><NotulenList /></DashboardLayout>} />
            <Route path="/notulen/baru" element={<DashboardLayout title="Buat Notulen"><NotulenEditor /></DashboardLayout>} />
            <Route path="/notulen/:id" element={<DashboardLayout title="Detail Notulen"><NotulenDetail /></DashboardLayout>} />
            <Route path="/notulen/:id/edit" element={<DashboardLayout title="Edit Notulen"><NotulenEditor /></DashboardLayout>} />
            <Route path="/action-items" element={<DashboardLayout title="Action Items"><ActionItems /></DashboardLayout>} />
            <Route path="/users" element={<DashboardLayout title="User Management"><Users /></DashboardLayout>} />
            <Route path="/settings/:tab" element={<DashboardLayout title="Pengaturan"><Settings /></DashboardLayout>} />
            <Route path="/settings" element={<Navigate to="/settings/profil" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}