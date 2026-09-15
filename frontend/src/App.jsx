import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/Dashboardlayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotulenList from './pages/NotulenList';
import ActionItems from './pages/ActionItems';
import Users from './pages/Users';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <DashboardLayout title="Dashboard" activePath="/">
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/notulen"
          element={
            <DashboardLayout title="Notulen" activePath="/notulen">
              <NotulenList />
            </DashboardLayout>
          }
        />
        <Route
          path="/action-items"
          element={
            <DashboardLayout title="Action Items" activePath="/action-items">
              <ActionItems />
            </DashboardLayout>
          }
        />
        <Route
          path="/users"
          element={
            <DashboardLayout title="User Management" activePath="/users">
              <Users />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout title="Pengaturan" activePath="/settings">
              <Settings />
            </DashboardLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}