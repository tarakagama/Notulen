import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { getMeetingHistory } from '../api/meetings';
import { formatDate, timeOf } from '../lib/datetime';

const ACTION_LABEL = {
  REQUEST_UNLOCK: 'Mengajukan unlock',
  APPROVE_UNLOCK: 'Menyetujui unlock',
  REJECT_UNLOCK: 'Menolak permohonan unlock',
  FORCE_UNLOCK: 'Force unlock',
  UPDATE_AFTER_UNLOCK: 'Mengubah notulen setelah unlock',
  REAPPROVE_MEETING: 'Menyetujui ulang setelah revisi',
};

const FIELD_LABEL = {
  meeting_title: 'Judul',
  meeting_type: 'Jenis rapat',
  meeting_date: 'Tanggal',
  start_time: 'Jam mulai',
  end_time: 'Jam selesai',
  location: 'Lokasi',
  agenda: 'Agenda',
  background: 'Latar belakang',
  conclusion: 'Kesimpulan',
  approver_id: 'Approver',
  discussion_mode: 'Mode pembahasan',
  discussion_manual_content: 'Pembahasan',
  visibility: 'Visibilitas',
  jumlah_action_item: 'Action item',
  jumlah_peserta: 'Peserta',
  jumlah_catatan_pembahasan: 'Catatan pembahasan',
};

// created_at riwayat adalah string "YYYY-MM-DD HH:mm:ss" dari database; ditampilkan apa adanya.
export default function MeetingHistory({ meetingId, refreshKey }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMeetingHistory(meetingId)
      .then((data) => { if (!cancelled) { setItems(data); setError(''); } })
      .catch(() => { if (!cancelled) setError('Gagal memuat riwayat.'); });
    return () => { cancelled = true; };
  }, [meetingId, refreshKey]);

  return (
    <div className="bg-white border border-gray-200 rounded p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <History size={16} strokeWidth={1.75} />
        Riwayat Perubahan
      </h3>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : items === null ? (
        <p className="text-sm text-gray-400">Memuat...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">
          Belum ada riwayat unlock atau perubahan setelah disetujui.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border-l-2 border-gray-200 pl-4">
              <p className="text-sm text-gray-800">
                <span className="font-medium">{ACTION_LABEL[item.action] || item.action}</span>
                <span className="text-gray-500"> oleh {item.user || 'sistem'}</span>
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(item.created_at)}, {timeOf(item.created_at)}
              </p>
              {item.detail && (
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">Alasan: {item.detail}</p>
              )}
              {item.changed_fields?.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Yang berubah: {item.changed_fields.map((f) => FIELD_LABEL[f] || f).join(', ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}