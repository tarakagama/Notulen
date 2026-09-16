import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Edit, Download, Send, Check, X } from 'lucide-react';
import { getMeeting, submitMeeting, approveMeeting, rejectMeeting, exportMeetingPdf } from '../api/meetings';
import { useAuth } from '../context/AuthContext';
import { meetingStatusLabel } from '../lib/statuslabels';

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Waiting Approval': 'bg-blue-50 text-blue-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-700',
};

export default function NotulenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function load() {
    setLoading(true);
    setError('');
    getMeeting(id)
      .then(setMeeting)
      .catch(() => setError('Gagal memuat notulen. Mungkin sudah dihapus atau kamu tidak punya akses.'))
      .finally(() => setLoading(false));
  }

  const isOwner = user?.id === meeting?.notulis_id;
  const isApprover = user?.id === meeting?.approver_id;
  const canEdit = (isOwner && ['Draft', 'Rejected'].includes(meeting?.status)) || user?.is_admin;
  const canSubmit = isOwner && meeting?.status === 'Draft';
  const canApprove = isApprover && meeting?.status === 'Waiting Approval';
  const canExport = meeting?.status === 'Approved';

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

  async function handleReject() {
    const note = window.prompt('Catatan revisi untuk Notulis (wajib diisi):');
    if (!note?.trim()) return;
    setActionLoading(true);
    try {
      await rejectMeeting(meeting.id, note.trim());
      load();
    } catch {
      setError('Gagal menolak notulen.');
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

  if (loading) return <p className="text-sm text-gray-400">Memuat...</p>;
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
                onClick={handleReject}
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {meeting.revision_note && meeting.status === 'Rejected' && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm font-medium text-red-700">Catatan revisi dari approver:</p>
          <p className="text-sm text-red-600 mt-1">{meeting.revision_note}</p>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{meeting.meeting_title}</h2>
          <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[meeting.status]}`}>
            {meetingStatusLabel(meeting.status)}
          </span>
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
                  <span className="text-gray-400 text-xs">{item.pic?.full_name} · {item.deadline}</span>
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
            <div className="space-y-1">
              {meeting.attendees.map((a) => (
                <p key={a.id} className="text-sm text-gray-600">
                  {a.user?.full_name || a.external_name} — {a.user?.division || a.external_org || '-'}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
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