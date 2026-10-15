import { useState } from 'react';
import Modal from './Modal';
import { extractError } from '../lib/errors';

// onSubmit(note) harus mengembalikan promise; error-nya ditampilkan di dalam modal.
export default function RejectUnlockModal({ onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit(note.trim());
    } catch (err) {
      setError(extractError(err, 'Gagal menolak permohonan unlock.'));
      setSaving(false);
    }
  };

  return (
    <Modal title="Tolak Permohonan Unlock" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-3">
        Notulen tetap terkunci. Jelaskan alasan penolakan supaya notulis tahu apa yang perlu dilengkapi sebelum mengajukan lagi.
      </p>
      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="Contoh: Koreksi cukup lewat catatan terpisah, tidak perlu membuka notulen."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
      />
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !note.trim()}
          className="text-sm text-white bg-red-600 rounded px-4 py-2 hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Mengirim...' : 'Tolak Permohonan'}
        </button>
      </div>
    </Modal>
  );
}