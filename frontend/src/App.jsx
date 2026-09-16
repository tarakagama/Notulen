import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/Dashboardlayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotulenList from './pages/NotulenList';
import ActionItems from './pages/ActionItems';
import Users from './pages/Users';
import Settings from './pages/Settings';
import NotulenDetail from './pages/NotulenDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout title="Dashboard"><Dashboard /></DashboardLayout>} />
        <Route path="/notulen" element={<DashboardLayout title="Notulen"><NotulenList /></DashboardLayout>} />
        <Route path="/notulen/:id" element={<DashboardLayout title="Detail Notulen"><NotulenDetail /></DashboardLayout>} />
        <Route path="/action-items" element={<DashboardLayout title="Action Items"><ActionItems /></DashboardLayout>} />
        <Route path="/users" element={<DashboardLayout title="User Management"><Users /></DashboardLayout>} />
        <Route path="/settings/:tab" element={<DashboardLayout title="Pengaturan"><Settings /></DashboardLayout>} />
        <Route path="/settings" element={<Navigate to="/settings/profil" replace />} />
      </Routes>
    </BrowserRouter>
  );
}