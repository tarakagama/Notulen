import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

const POLL_MS = 60000;

// created_at notifikasi adalah waktu sebenarnya (UTC), jadi aman dipakai dengan new Date().
// (Beda dengan jam booking/rapat yang disimpan apa adanya.)
function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);

  const load = useCallback(() => {
    if (!user) return;
    listNotifications({ per_page: 10 })
      .then((res) => {
        setItems(res.data || []);
        setUnread(res.unread_count ?? 0);
      })
      .catch(() => {});
  }, [user]);

  // Muat saat pertama, lalu cek berkala.
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Tutup panel saat klik di luar.
  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleItemClick = async (n) => {
    setOpen(false);
    if (!n.read_at) {
      try {
        const res = await markNotificationRead(n.id);
        setUnread(res.unread_count ?? Math.max(0, unread - 1));
        setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i)));
      } catch {
        // gagal menandai dibaca tidak boleh menghalangi navigasi
      }
    }
    if (n.data?.link) navigate(n.data.link);
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
    } catch {
      // abaikan; akan tersinkron di pemuatan berikutnya
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        title="Notifikasi"
      >
        <Bell size={22} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notifikasi</h3>
            {unread > 0 && (
              <button onClick={handleReadAll} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <CheckCheck size={14} />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-8 text-center">Belum ada notifikasi.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3 ${n.read_at ? '' : 'bg-blue-50/40'}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-blue-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read_at ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {n.data?.title}
                    </span>
                    {n.data?.body && (
                      <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{n.data.body}</span>
                    )}
                    <span className="block text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}