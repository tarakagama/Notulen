import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Clock, RotateCcw, History, ShieldCheck } from 'lucide-react';
import {
  listMyTasks, updateActionItemStatus,
  listToVerify, verifyActionItem, getActionItemLogs,
} from '../api/actionItems';
import { ACTION_ITEM_STATUS_TO_LABEL } from '../lib/statuslabels';
import { extractError } from '../lib/errors';
import Modal from '../components/Modal';
import ActionItemTabs from '../components/ActionItemTabs';


const PRIORITY_STYLE = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-gray-50 text-gray-600',
};

// Badge memakai effective_status (Open | In Progress | Overdue | Completed) dari backend.
// "Overdue" dihitung server dari deadline, bukan disimpan di kolom status.
const STATUS_STYLE = {
  Open: 'text-gray-700 bg-gray-100',
  'In Progress': 'text-blue-700 bg-blue-50',
  Overdue: 'text-red-700 bg-red-50',
  Completed: 'text-green-700 bg-green-50',
};

const LOG_ACTION_LABEL = {
  Started: 'Mulai dikerjakan',
  Completed: 'Ditandai selesai',
  Reopened: 'Dibuka kembali',
  Verified: 'Penyelesaian diverifikasi',
  VerificationRejected: 'Verifikasi ditolak, dikembalikan',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Timestamp (completed_at, created_at) selalu ditampilkan menurut jam Jakarta.
function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  });
}

// diff negatif = lebih cepat dari deadline, 0 = tepat waktu, positif = terlambat
function timing(diff) {
  if (diff === null || diff === undefined) return null;
  if (diff < 0) return { text: `${-diff} hari lebih cepat`, className: 'text-green-700' };
  if (diff === 0) return { text: 'Tepat waktu', className: 'text-green-700' };
  return { text: `Terlambat ${diff} hari`, className: 'text-red-600' };
}

function TimingText({ diff }) {
  const t = timing(diff);
  if (!t) return null;
  return <span className={`block text-[11px] ${t.className}`}>{t.text}</span>;
}

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Modal "Tandai Selesai"
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeNote, setCompleteNote] = useState('');
  const [completeError, setCompleteError] = useState('');

  // Verifikasi (untuk notulis / approver rapat)
  const [toVerify, setToVerify] = useState([]);
  const [verifyTarget, setVerifyTarget] = useState(null); // { item, approved }
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);

  // Riwayat
  const [logTarget, setLogTarget] = useState(null);
  const [logs, setLogs] = useState(null);
  const [logsError, setLogsError] = useState('');

  const load = () => {
    setLoading(true);
    listMyTasks({ per_page: 100 })
      .then((res) => setItems(res.data || res))
      .catch(() => setError('Gagal memuat daftar action items.'))
      .finally(() => setLoading(false));
  };

  const loadToVerify = () => {
    listToVerify()
      .then((res) => setToVerify(res.data || res))
      .catch(() => setToVerify([]));
  };

  useEffect(() => { load(); loadToVerify(); }, []);

  const changeStatus = async (item, status, completion_note = null) => {
    setBusyId(item.id);
    setError('');
    try {
      await updateActionItemStatus(item.id, { status, completion_note });
      load();
      loadToVerify();
      return null;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengubah status.';
      setError(message);
      return message;
    } finally {
      setBusyId(null);
    }
  };

  // ── Tandai selesai ──
  const openComplete = (item) => {
    setCompleteTarget(item);
    setCompleteNote('');
    setCompleteError('');
  };

  const closeComplete = () => {
    setCompleteTarget(null);
    setCompleteNote('');
    setCompleteError('');
  };

  const confirmComplete = async () => {
    setCompleteError('');
    const message = await changeStatus(completeTarget, 'Completed', completeNote.trim() || null);
    if (message) {
      setCompleteError(message);
    } else {
      closeComplete();
    }
  };

  // ── Verifikasi ──
  const openVerify = (item, approved) => {
    setVerifyTarget({ item, approved });
    setVerifyNote('');
    setVerifyError('');
  };

  const closeVerify = () => {
    setVerifyTarget(null);
    setVerifyNote('');
    setVerifyError('');
  };

  const submitVerify = async () => {
    const { item, approved } = verifyTarget;
    if (!approved && !verifyNote.trim()) {
      setVerifyError('Alasan penolakan wajib diisi.');
      return;
    }
    setVerifyError('');
    setVerifyBusy(true);
    try {
      await verifyActionItem(item.id, { approved, note: verifyNote.trim() || null });
      closeVerify();
      loadToVerify();
      load();
    } catch (err) {
      setVerifyError(extractError(err, 'Gagal memproses verifikasi.'));
    } finally {
      setVerifyBusy(false);
    }
  };

  // ── Riwayat ──
  const openLogs = (item) => {
    setLogTarget(item);
    setLogs(null);
    setLogsError('');
    getActionItemLogs(item.id)
      .then(setLogs)
      .catch((err) => setLogsError(extractError(err, 'Gagal memuat riwayat.')));
  };

  const closeLogs = () => {
    setLogTarget(null);
    setLogs(null);
    setLogsError('');
  };

  const active = items.filter((i) => i.status !== 'Completed');
  const done = items.filter((i) => i.status === 'Completed');

  return (
    <div className="space-y-6">
      <ActionItemTabs />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      {/* Perlu diverifikasi (hanya muncul untuk notulis / approver rapat yang punya antrean) */}
      {toVerify.length > 0 && (
        <div className="bg-white border border-yellow-300 rounded">
          <div className="px-5 py-3.5 border-b border-yellow-200 bg-yellow-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
              <ShieldCheck size={15} strokeWidth={1.75} />
              Perlu Diverifikasi
            </h2>
            <span className="text-xs text-yellow-800">{toVerify.length} tugas</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Action Item</th>
                <th className="px-5 py-3 font-medium">PIC</th>
                <th className="px-5 py-3 font-medium">Selesai Pada</th>
                <th className="px-5 py-3 font-medium">Catatan PIC</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {toVerify.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 align-top">
                  <td className="px-5 py-3.5 text-gray-800 font-medium">
                    {item.description}
                    <span className="block text-xs text-gray-400 font-normal">{item.meeting?.meeting_title || '-'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{item.pic?.full_name || '-'}</td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {formatDateTime(item.completed_at)}
                    <TimingText diff={item.completion_days_diff} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{item.completion_note || '-'}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button onClick={() => openLogs(item)} className="text-xs text-gray-500 hover:text-gray-800 mr-3">Riwayat</button>
                    <button onClick={() => openVerify(item, false)} className="text-xs text-red-600 hover:underline mr-3">Kembalikan</button>
                    <button
                      onClick={() => openVerify(item, true)}
                      className="text-xs text-white bg-green-600 rounded px-3 py-1.5 hover:bg-green-700"
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aktif */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tugas Aktif</h2>
          <span className="text-xs text-gray-400">{active.length} tugas</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 p-5">Memuat data...</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Tidak ada tugas aktif. </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Action Item</th>
                <th className="px-5 py-3 font-medium">Sumber Rapat</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Prioritas</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {active.map((item) => {
                const overdue = item.effective_status === 'Overdue';
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">
                      {item.description}
                      {item.verification_status === 'Rejected' && (
                        <span className="block mt-1 text-xs font-normal text-red-600">
                          Dikembalikan oleh verifikator: {item.verification_note}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{item.meeting?.meeting_title || '-'}</td>
                    <td className={`px-5 py-3.5 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {formatDate(item.deadline)}{overdue && ' (terlambat)'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_STYLE[item.priority] || ''}`}>{item.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded ${STATUS_STYLE[item.effective_status] || STATUS_STYLE.Open}`}>
                        {overdue ? <AlertTriangle size={12} /> : item.status === 'In Progress' ? <Clock size={12} /> : <Circle size={12} />}
                        {ACTION_ITEM_STATUS_TO_LABEL[item.effective_status] || item.effective_status}
                      </span>
                      {overdue && item.status === 'In Progress' && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">Sedang dikerjakan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openLogs(item)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mr-3"
                      >
                        <History size={12} />
                        Riwayat
                      </button>
                      {item.status === 'Open' && (
                        <button
                          onClick={() => changeStatus(item, 'In Progress')}
                          disabled={busyId === item.id}
                          className="text-xs text-blue-600 hover:underline mr-3 disabled:opacity-50"
                        >
                          Mulai
                        </button>
                      )}
                      <button
                        onClick={() => openComplete(item)}
                        disabled={busyId === item.id}
                        className="text-xs text-white bg-green-600 rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                      >
                        Tandai Selesai
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Selesai */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tugas Selesai</h2>
          <span className="text-xs text-gray-400">{done.length} tugas</span>
        </div>

        {done.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Belum ada tugas yang selesai.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Action Item</th>
                <th className="px-5 py-3 font-medium">Sumber Rapat</th>
                <th className="px-5 py-3 font-medium">Selesai Pada</th>
                <th className="px-5 py-3 font-medium">Verifikasi</th>
                <th className="px-5 py-3 font-medium">Catatan</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {done.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 align-top">
                  <td className="px-5 py-3.5 text-gray-500 line-through">{item.description}</td>
                  <td className="px-5 py-3.5 text-gray-500">{item.meeting?.meeting_title || '-'}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <span className="inline-flex items-center gap-1.5 text-green-700">
                      <CheckCircle2 size={13} />
                      {formatDateTime(item.completed_at)}
                    </span>
                    <TimingText diff={item.completion_days_diff} />
                  </td>
                  <td className="px-5 py-3.5">
                    {item.verification_status === 'Verified' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">Terverifikasi</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">Menunggu verifikasi</span>
                    )}
                    {item.verification_note && item.verification_status === 'Verified' && (
                      <span className="block text-[11px] text-gray-400 mt-0.5">{item.verification_note}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{item.completion_note || '-'}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openLogs(item)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mr-3"
                    >
                      <History size={12} />
                      Riwayat
                    </button>
                    {item.verification_status !== 'Verified' && (
                      <button
                        onClick={() => changeStatus(item, 'Open')}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        Buka kembali
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: catatan penyelesaian */}
      {completeTarget && (
        <Modal title="Tandai Selesai" onClose={closeComplete}>
          <p className="text-sm text-gray-700 mb-1 font-medium">{completeTarget.description}</p>
          <p className="text-xs text-gray-400 mb-3">{completeTarget.meeting?.meeting_title || '-'}</p>

          {completeError && (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{completeError}</div>
          )}

          <label className="block text-xs font-medium text-gray-700 mb-1.5">Catatan penyelesaian (opsional)</label>
          <textarea
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            rows={3}
            maxLength={1000}
            autoFocus
            placeholder="Mis. sudah dikirim ke vendor, dokumen ada di folder bersama..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            Setelah ditandai selesai, tugas ini menunggu verifikasi notulis atau approver rapat.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={closeComplete} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button
              type="button"
              onClick={confirmComplete}
              disabled={busyId === completeTarget.id}
              className="text-sm text-white bg-green-600 rounded px-4 py-2 hover:bg-green-700 disabled:opacity-60"
            >
              {busyId === completeTarget.id ? 'Menyimpan...' : 'Tandai Selesai'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: verifikasi / kembalikan */}
      {verifyTarget && (
        <Modal title={verifyTarget.approved ? 'Verifikasi Penyelesaian' : 'Kembalikan ke PIC'} onClose={closeVerify}>
          <p className="text-sm text-gray-700 mb-1 font-medium">{verifyTarget.item.description}</p>
          <p className="text-xs text-gray-400 mb-3">
            PIC: {verifyTarget.item.pic?.full_name || '-'} · {formatDateTime(verifyTarget.item.completed_at)}
          </p>
          {verifyTarget.item.completion_note && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 mb-3">
              Catatan PIC: {verifyTarget.item.completion_note}
            </p>
          )}

          {verifyError && (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{verifyError}</div>
          )}

          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {verifyTarget.approved ? 'Catatan verifikasi (opsional)' : 'Alasan dikembalikan (wajib)'}
          </label>
          <textarea
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            rows={3}
            maxLength={1000}
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={closeVerify} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button
              type="button"
              onClick={submitVerify}
              disabled={verifyBusy}
              className={`text-sm text-white rounded px-4 py-2 disabled:opacity-60 ${
                verifyTarget.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {verifyBusy ? 'Memproses...' : verifyTarget.approved ? 'Verifikasi' : 'Kembalikan'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: riwayat */}
      {logTarget && (
        <Modal title="Riwayat Action Item" onClose={closeLogs}>
          <p className="text-sm text-gray-700 font-medium mb-3">{logTarget.description}</p>

          {logsError ? (
            <p className="text-xs text-red-600">{logsError}</p>
          ) : logs === null ? (
            <p className="text-xs text-gray-400">Memuat riwayat...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-gray-400">Belum ada riwayat.</p>
          ) : (
            <ol className="space-y-3">
              {logs.map((log) => {
                const t = log.action === 'Completed' ? timing(log.days_diff) : null;
                return (
                  <li key={log.id} className="border-l-2 border-gray-200 pl-3">
                    <p className="text-sm text-gray-800">{LOG_ACTION_LABEL[log.action] || log.action}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(log.created_at)} · {log.user?.full_name || '-'}
                    </p>
                    {t && <p className={`text-xs ${t.className}`}>{t.text}{log.deadline ? ` (deadline ${formatDate(log.deadline)})` : ''}</p>}
                    {log.note && <p className="text-xs text-gray-600 mt-0.5">"{log.note}"</p>}
                  </li>
                );
              })}
            </ol>
          )}

          <div className="flex justify-end pt-4">
            <button type="button" onClick={closeLogs} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}