import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Edit, Check, X, Download, Send } from 'lucide-react';
import { getMeeting, submitMeeting, approveMeeting, rejectMeeting, exportMeetingPdf } from '../api/meetings';
import { useAuth } from '../context/AuthContext';

const statusStyle = {
  Draft: 'bg-yellow-50 text-yellow-700',
  'Menunggu Approval': 'bg-blue-50 text-blue-700',
  Disetujui: 'bg-green-50 text-green-700',
  Ditolak: 'bg-red-50 text-red-700',
};

function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function NotulenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const loadMeeting = () => {
    setLoading(true);
    getMeeting(id)
      .then(setMeeting)
      .catch(() => setError('Gagal memuat detail notulen.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMeeting(); }, [id]);

  const isOwner = meeting?.notulis_id === user?.id;
  const isApprover = meeting?.approver_id === user?.id;

  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    try {
      await submitMeeting(id);
      loadMeeting();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan approval.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveMeeting(id);
      loadMeeting();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui notulen.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!revisionNote.trim()) return;
    setActionLoading(true);
    try {
      await rejectMeeting(id, revisionNote);
      setShowRejectBox(false);
      setRevisionNote('');
      loadMeeting();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menolak notulen.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportMeetingPdf(id, `${meeting.meeting_title}.pdf`);
    } catch (err) {
      setError('Gagal mengekspor PDF. Pastikan notulen sudah Disetujui.');
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Memuat data...</p>;
  if (!meeting) return <p className="text-sm text-red-600">{error || 'Notulen tidak ditemukan.'}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/notulen')}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Kembali ke daftar notulen
        </button>

        <div className="flex items-center gap-2">
          {meeting.status === 'Disetujui' && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              <Download size={15} strokeWidth={1.75} />
              Export PDF
            </button>
          )}

          {isOwner && meeting.status === 'Draft' && (
            <Link
              to={`/notulen/${id}/edit`}
              className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47]"
            >
              <Edit size={15} strokeWidth={1.75} />
              Edit Notulen
            </Link>
          )}

          {isOwner && meeting.status === 'Draft' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
              className="flex items-center gap-2 text-sm text-white bg-blue-600 rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              <Send size={15} strokeWidth={1.75} />
              Ajukan Approval
            </button>
          )}

          {isApprover && meeting.status === 'Menunggu Approval' && (
            <>
              <button
                onClick={() => setShowRejectBox(!showRejectBox)}
                className="flex items-center gap-2 text-sm border border-red-300 text-red-600 rounded px-4 py-2 hover:bg-red-50"
              >
                <X size={15} strokeWidth={1.75} />
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2 text-sm text-white bg-green-600 rounded px-4 py-2 hover:bg-green-700 disabled:opacity-60"
              >
                <Check size={15} strokeWidth={1.75} />
                Setujui
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">
          {error}
        </div>
      )}

      {showRejectBox && (
        <div className="bg-white border border-red-200 rounded p-4 space-y-3">
          <label className="block text-xs font-medium text-gray-700">Catatan Revisi</label>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan apa yang perlu direvisi..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={handleReject}
            disabled={actionLoading || !revisionNote.trim()}
            className="text-sm text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-60"
          >
            Kirim Penolakan
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{meeting.meeting_title}</h2>
          <span className={`px-2.5 py-1 rounded text-xs ${statusStyle[meeting.status] || 'bg-gray-50 text-gray-600'}`}>
            {meeting.status}
          </span>
        </div>

        {meeting.status === 'Ditolak' && meeting.revision_note && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            <strong>Catatan revisi:</strong> {meeting.revision_note}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            {formatDate(meeting.meeting_date)}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" />
            {meeting.start_time?.slice(0, 5)} - {meeting.end_time?.slice(0, 5)}, {meeting.location}
          </div>
          <div className="flex items-center gap-2">
            <User size={15} className="text-gray-400" />
            Notulis: {meeting.notulis?.full_name || '-'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
        <Section title="Agenda" content={meeting.agenda} />
        <Section title="Latar Belakang" content={meeting.background} />
        <Section
          title="Pembahasan"
          content={meeting.discussion_notes?.map((n) => n.content).join('\n\n') || '-'}
        />
        {meeting.conclusion && (
          <Section title="Hasil Pembahasan / Tindak Lanjut / Kesepakatan" content={meeting.conclusion} />
        )}
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content || '-'}</p>
    </div>
  );
}