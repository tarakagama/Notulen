import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ check }) {
  const auth = useAuth();

  if (auth.loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Memuat...</div>;
  }

  return check(auth) ? <Outlet /> : <Navigate to="/" replace />;
}