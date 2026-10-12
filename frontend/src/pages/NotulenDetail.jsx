import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CalendarDays, MapPin, User, Edit, Download, Send, Check, X, Trash2, AlertTriangle, Lock } from 'lucide-react';
import {
  getMeeting, submitMeeting, approveMeeting, rejectMeeting, exportMeetingPdf, deleteMeeting,
  requestUnlock, approveUnlock, forceUnlock,
} from '../api/meetings';
import { useAuth } from '../context/AuthContext';
import { meetingStatusLabel, visibilityLabel } from '../lib/statuslabels';
import { extractError } from '../lib/errors';
import Modal from '../components/Modal';

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Waiting Approval': 'bg-blue-50 text-blue-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-700',
};

const visibilityStyle = {
  Public: 'bg-green-50 text-green-700',
  Division: 'bg-blue-50 text-blue-700',
  Restricted: 'bg-red-50 text-red-700',
};

export default function NotulenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function load() {
    setLoading(true);
    setError('');
    setForbidden(false);
    getMeeting(id)
      .then(setMeeting)
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) setForbidden(true);
        else if (status === 404) setError('Notulen tidak ditemukan. Mungkin sudah dihapus.');
        else setError('Gagal memuat notulen. Coba muat ulang halaman.');
      })
      .finally(() => setLoading(false));
  }

  const isOwner = user?.id === meeting?.notulis_id;
  const isApprover = user?.id === meeting?.approver_id;
  const canEdit = (isOwner && ['Draft', 'Rejected'].includes(meeting?.status)) || isSuperAdmin;
  const canSubmit = isOwner && meeting?.status === 'Draft';
  const canApprove = isApprover && meeting?.status === 'Waiting Approval';
  const canExport = meeting?.status === 'Approved';
  const canDelete = isSuperAdmin;

  // Alur unlock notulen yang sudah Approved
  const unlockRequested = meeting?.status === 'Approved' && meeting?.unlock_request_status === 'Requested';
  const canRequestUnlock = isOwner && meeting?.status === 'Approved' && !unlockRequested;
  const canApproveUnlock = unlockRequested && (isApprover || isSuperAdmin);
  const canForceUnlock = isSuperAdmin && meeting?.status === 'Approved' && !unlockRequested;
  const reopened = meeting?.status === 'Draft' && meeting?.unlock_request_status === 'Approved';

  async function handleSubmit() {
    setActionLoading(true);
    try {
      await submitMeeting(meeting.id);
      load();
    } catch {
      setError('Gagal submit notulen.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      await approveMeeting(meeting.id);
      load();
    } catch {
      setError('Gagal menyetujui notulen.');
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReject() {
    if (!rejectNote.trim()) return;
    setActionLoading(true);
    console.log('DEBUG rejectNote:', JSON.stringify(rejectNote));
    try {
      await rejectMeeting(meeting.id, rejectNote.trim());
      setRejectOpen(false);
      setRejectNote('');
      load();
    } catch {
      setError('Gagal menolak notulen.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestUnlock() {
    if (!unlockReason.trim()) return;
    setActionLoading(true);
    setUnlockError('');
    try {
      await requestUnlock(meeting.id, unlockReason.trim());
      setUnlockOpen(false);
      setUnlockReason('');
      load();
    } catch (err) {
      setUnlockError(extractError(err, 'Gagal mengajukan unlock.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveUnlock() {
    if (!window.confirm('Setujui permohonan unlock? Notulen akan kembali ke status Draft dan bisa diedit oleh notulis.')) return;
    setActionLoading(true);
    setError('');
    try {
      await approveUnlock(meeting.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal menyetujui unlock.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleForceUnlock() {
    if (!window.confirm('Force unlock membuka notulen yang sudah disetujui tanpa menunggu approver. Tindakan ini tercatat di audit log. Lanjutkan?')) return;
    setActionLoading(true);
    setError('');
    try {
      await forceUnlock(meeting.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Gagal melakukan force unlock.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExport() {
    setActionLoading(true);
    try {
      await exportMeetingPdf(meeting.id, `Notulen-${meeting.meeting_title}.pdf`);
    } catch {
      setError('Gagal export PDF.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
  const ok = window.confirm(
    `Hapus notulen "${meeting.meeting_title}"?\n\nSemua daftar hadir, lampiran, dan action item terkait ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
  );
  if (!ok) return;
  setActionLoading(true);
  try {
    await deleteMeeting(meeting.id);
    navigate('/notulen');
  } catch (err) {
    setError(err.response?.data?.message || 'Gagal menghapus notulen.');
    setActionLoading(false);
  }
}

  if (loading) return <p className="text-sm text-gray-400">Memuat...</p>;
  if (forbidden) return <AccessDenied />;
  if (error && !meeting) return <p className="text-sm text-red-500">{error}</p>;
  if (!meeting) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/notulen" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Kembali ke daftar notulen
        </Link>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/notulen/${meeting.id}/edit`)}
              className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47]"
            >
              <Edit size={15} strokeWidth={1.75} />
              Edit Notulen
            </button>
          )}

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-white bg-blue-600 rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={15} strokeWidth={1.75} />
              Submit untuk Approval
            </button>
          )}

          {canApprove && (
            <>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 text-sm text-red-600 border border-red-300 rounded px-4 py-2 hover:bg-red-50 disabled:opacity-50"
              >
                <X size={15} strokeWidth={1.75} />
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2 text-sm text-white bg-green-600 rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              >
                <Check size={15} strokeWidth={1.75} />
                Setujui
              </button>
            </>
          )}

          {canRequestUnlock && (
            <button
              onClick={() => { setUnlockError(''); setUnlockOpen(true); }}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Lock size={15} strokeWidth={1.75} />
              Ajukan Unlock
            </button>
          )}

          {canApproveUnlock && (
            <button
              onClick={handleApproveUnlock}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-white bg-green-600 rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={15} strokeWidth={1.75} />
              Setujui Unlock
            </button>
          )}

          {canForceUnlock && (
            <button
              onClick={handleForceUnlock}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-amber-700 border border-amber-300 rounded px-4 py-2 hover:bg-amber-50 disabled:opacity-50"
            >
              <Lock size={15} strokeWidth={1.75} />
              Force Unlock
            </button>
          )}

          {canExport && (
            <button
              onClick={handleExport}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={15} strokeWidth={1.75} />
              {actionLoading ? 'Memproses...' : 'Export PDF'}
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-red-600 border border-red-300 rounded px-4 py-2 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={15} strokeWidth={1.75} />
              Hapus
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {unlockRequested && (
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          <p className="font-medium flex items-center gap-2">
            <Lock size={15} />
            Permohonan unlock menunggu persetujuan
          </p>
          {meeting.unlock_reason && (
            <p className="mt-1 text-xs whitespace-pre-line">Alasan: {meeting.unlock_reason}</p>
          )}
          <p className="mt-1 text-xs opacity-80">
            {canApproveUnlock
              ? 'Kamu bisa menyetujui permohonan ini lewat tombol "Setujui Unlock".'
              : isOwner
                ? 'Menunggu approver menyetujui permohonanmu.'
                : 'Notulen tetap terkunci sampai permohonan ini diproses.'}
          </p>
        </div>
      )}

      {reopened && (
        <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 text-sm text-blue-800">
          Notulen ini dibuka kembali untuk revisi (unlock disetujui). Setelah selesai diedit, ajukan approval lagi.
        </div>
      )}

      {meeting.revision_note && meeting.status === 'Rejected' && (
        <button
          onClick={() => setRevisionOpen(true)}
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5 hover:bg-red-100 flex items-center gap-2 w-fit"
        >
          <AlertTriangle size={15} />
          Lihat Catatan Revisi dari Approver
        </button>
      )}

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{meeting.meeting_title}</h2>
          <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[meeting.status]}`}>
            {meetingStatusLabel(meeting.status)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
          {meeting.visibility && (
            <span className={`px-2.5 py-1 rounded text-xs ${visibilityStyle[meeting.visibility] || 'bg-gray-50 text-gray-600'}`}>
              Visibilitas: {visibilityLabel(meeting.visibility)}
            </span>
          )}
          {meeting.room_booking_id && (
            <span className="px-2.5 py-1 rounded text-xs bg-teal-50 text-teal-700 inline-flex items-center gap-1">
              <CalendarDays size={12} />
              Dari booking ruangan
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            {new Date(meeting.meeting_date).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            {meeting.start_time?.slice(0, 5)}–{meeting.end_time?.slice(0, 5)} WIB
            {meeting.location ? `, ${meeting.location}` : ''}
          </div>
          <div className="flex items-center gap-2">
            <User size={15} className="text-gray-400" />
            Notulis: {meeting.notulis?.full_name || '-'}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
        {meeting.background && <Section title="Latar Belakang" content={meeting.background} />}

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Pembahasan</h3>
          {meeting.discussion_mode === 'manual' ? (
            <div
              className="text-sm text-gray-600 leading-relaxed prose-sm"
              dangerouslySetInnerHTML={{ __html: meeting.discussion_manual_content || '' }}
            />
          ) : (
            <DiscussionNotesList notes={meeting.discussion_notes} />
          )}
        </div>

        {meeting.conclusion && (
          <Section title="Hasil Pembahasan / Tindak Lanjut / Kesepakatan" content={meeting.conclusion} />
        )}

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Tindak Lanjut (Action Items)</h3>
          {!meeting.action_items || meeting.action_items.length === 0 ? (
            <p className="text-sm text-gray-400">Rapat ini tidak menghasilkan action item.</p>
          ) : (
            <div className="space-y-2">
              {meeting.action_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="text-gray-400 text-xs">
                  {item.pic?.full_name} · deadline {new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Daftar Hadir</h3>
          {!meeting.attendees || meeting.attendees.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data daftar hadir.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-100">
                  <th className="py-2 font-medium">Nama</th>
                  <th className="py-2 font-medium">Divisi</th>
                  <th className="py-2 font-medium">Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {meeting.attendees.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">
                      {a.name}
                      {a.user_id && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Internal</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">{a.division || '-'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${a.is_present ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        {a.is_present ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Lampiran</h3>
          {!meeting.attachments || meeting.attachments.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada file terlampir.</p>
          ) : (
            <div className="space-y-2">
              {meeting.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2 hover:bg-gray-100"
                >
                  <span className="text-blue-600">{att.file_type}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(att.uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {rejectOpen && (
      <Modal title="Tolak Notulen" onClose={() => setRejectOpen(false)}>
        <p className="text-sm text-gray-600 mb-3">
          Jelaskan apa yang perlu direvisi oleh Notulis. Catatan ini wajib diisi.
        </p>
        <textarea
          autoFocus
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={5}
          placeholder="Contoh: Latar belakang belum lengkap, tambahkan action item untuk tim IT..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setRejectOpen(false)}
            className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={submitReject}
            disabled={actionLoading || !rejectNote.trim()}
            className="text-sm text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading ? 'Mengirim...' : 'Kirim Penolakan'}
          </button>
        </div>
      </Modal>
    )}

    {unlockOpen && (
      <Modal title="Ajukan Unlock Notulen" onClose={() => setUnlockOpen(false)}>
        <p className="text-sm text-gray-600 mb-3">
          Notulen yang sudah disetujui terkunci. Jelaskan alasan kamu perlu membukanya kembali. Approver akan menyetujui permohonan ini.
        </p>
        {unlockError && (
          <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{unlockError}</div>
        )}
        <textarea
          autoFocus
          value={unlockReason}
          onChange={(e) => setUnlockReason(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Contoh: Ada koreksi data pada bagian kesimpulan..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setUnlockOpen(false)}
            className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleRequestUnlock}
            disabled={actionLoading || !unlockReason.trim()}
            className="text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-50"
          >
            {actionLoading ? 'Mengirim...' : 'Kirim Permohonan'}
          </button>
        </div>
      </Modal>
    )}

    {revisionOpen && (
      <Modal title="Catatan Revisi dari Approver" onClose={() => setRevisionOpen(false)}>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {meeting.revision_note}
        </p>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setRevisionOpen(false)}
            className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </Modal>
    )}
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <div
        className="text-sm text-gray-600 leading-relaxed prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content || '' }}
      />
    </div>
  );
}

function DiscussionNotesList({ notes, depth = 0 }) {
  if (!notes || notes.length === 0) {
    return depth === 0 ? <p className="text-sm text-gray-400">Tidak ada catatan pembahasan.</p> : null;
  }
  return (
    <div style={{ marginLeft: depth * 16 }} className="space-y-1">
      {notes.map((note) => (
        <div key={note.id}>
          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: `• ${note.content}` }} />
          {note.child_notes_recursive?.length > 0 && (
            <DiscussionNotesList notes={note.child_notes_recursive} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="bg-white border border-gray-200 rounded p-8 max-w-lg mx-auto text-center space-y-3">
      <div className="mx-auto w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <Lock size={20} strokeWidth={1.75} />
      </div>
      <h2 className="text-base font-semibold text-gray-800">Kamu tidak punya akses ke notulen ini</h2>
      <p className="text-sm text-gray-500">
        Notulen ini bersifat terbatas, atau belum disetujui dan hanya terlihat oleh pihak yang terlibat.
        Hubungi notulis jika kamu merasa perlu mengaksesnya.
      </p>
      <Link to="/notulen" className="inline-block text-sm text-blue-600 hover:underline">
        Kembali ke daftar notulen
      </Link>
    </div>
  );
}