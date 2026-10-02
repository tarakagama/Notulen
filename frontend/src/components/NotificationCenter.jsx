import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Hourglass, AlertTriangle, FileWarning } from 'lucide-react';
import { listPendingApprovals } from '../api/meetings';
import { listMyTasks } from '../api/actionItems';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'momhub_dismissed_notifications';
const POLL_MS = 60000;

function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
  catch { return new Set(); }
}
function saveDismissed(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);

  const load = useCallback(() => {
    if (!user) return;

    Promise.allSettled([
      listPendingApprovals({ per_page: 10 }),
      listMyTasks({ status: 'Overdue', per_page: 10 }),
    ]).then(([approvals, overdue]) => {
      const list = [];

      if (approvals.status === 'fulfilled') {
        (approvals.value.data || []).forEach((m) => {
          list.push({
            key: `approval-${m.id}`,
            type: 'approval',
            icon: Hourglass,
            color: 'text-blue-600 bg-blue-50',
            title: 'Menunggu persetujuan kamu',
            desc: m.meeting_title,
            link: `/notulen/${m.id}`,
          });
        });
      }

      if (overdue.status === 'fulfilled') {
        (overdue.value.data || []).forEach((t) => {
          list.push({
            key: `overdue-${t.id}`,
            type: 'overdue',
            icon: AlertTriangle,
            color: 'text-red-600 bg-red-50',
            title: 'Action item terlambat',
            desc: t.description,
            link: '/action-items',
          });
        });
      }

      // Notulen milik user sendiri yang ditolak (revision_note ada isinya)
      import('../api/meetings').then(({ listMeetings }) => {
        listMeetings({ status: 'Rejected', notulis_id: user.id, per_page: 10 })
          .then((res) => {
            (res.data || []).forEach((m) => {
              if (!m.revision_note) return;
              list.push({
                key: `rejected-${m.id}`,
                type: 'rejected',
                icon: FileWarning,
                color: 'text-orange-600 bg-orange-50',
                title: 'Notulen ditolak, perlu revisi',
                desc: m.meeting_title,
                note: m.revision_note,
                link: `/notulen/${m.id}`,
              });
            });
            setItems(list);
          })
          .catch(() => setItems(list));
      });
    });
  }, [user]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const dismiss = (key) => {
    const next = new Set(dismissed);
    next.add(key);
    setDismissed(next);
    saveDismissed(next);
  };

  const visible = items.filter((i) => !dismissed.has(i.key)).slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 w-80">
      {visible.map((n) => {
        const Icon = n.icon;
        return (
          <div key={n.key} className="bg-white border border-gray-200 rounded shadow-md p-3.5">
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 shrink-0 rounded flex items-center justify-center ${n.color}`}>
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{n.desc}</p>
                {n.note && (
                  <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 mt-1.5 line-clamp-2">
                    "{n.note}"
                  </p>
                )}
                <Link
                  to={n.link}
                  onClick={() => dismiss(n.key)}
                  className="text-xs text-blue-600 hover:underline mt-1.5 inline-block"
                >
                  Lihat
                </Link>
              </div>
              <button onClick={() => dismiss(n.key)} className="text-gray-300 hover:text-gray-600 shrink-0">
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}