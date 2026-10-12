import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const cached = localStorage.getItem('auth_user');

    if (!token) {
      setLoading(false);
      return;
    }

    if (cached) setUser(JSON.parse(cached));

    authApi
      .fetchMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user: loggedInUser, token } = await authApi.login(email, password);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    }
  }

  function updateLocalUser(patch) {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('auth_user', JSON.stringify(next));
      return next;
    });
  }

    // Hak akses turunan (dasar keputusan menu & tombol; backend tetap yang menjaga).
    const isSuperAdmin = user?.global_role === 'SuperAdmin';
    // /me hanya mengirim flag mentah can_manage_rooms. SuperAdmin tetap boleh
    // mengelola ruangan walau flag-nya false, jadi dihitung di sini.
    const canManageRooms = isSuperAdmin || !!user?.can_manage_rooms;

    const isDivisionAdmin = user?.global_role === 'AdminDivisi';
    // Super Admin dan Admin Divisi boleh membuka User Management (Admin Divisi hanya divisinya).
    const canManageUsers = isSuperAdmin || isDivisionAdmin;
    // Viewer read-only: backend menolak semua aksi tulis, UI menyembunyikan tombolnya.
    const isViewer = user?.global_role === 'Viewer';

    const value = {
      user,
      loading,
      login,
      logout,
      updateLocalUser,
      isSuperAdmin,
      canManageRooms,
      isDivisionAdmin,
      canManageUsers,
      isViewer,
      isAdmin: isSuperAdmin, // alias lama, jangan dipakai di kode baru
    };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}