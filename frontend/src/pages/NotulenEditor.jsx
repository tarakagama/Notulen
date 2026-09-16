import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createMeeting, getMeeting, updateMeeting } from '../api/meetings';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';

export default function NotulenEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    meeting_title: '',
    meeting_date: '',
    start_time: '',
    end_time: '',
    location: '',
    agenda: '',
    background: '',
    discussion_notes_text: '', // ditulis flat dulu, di-convert pas submit
    hasilPembahasan: '',
    approver_id: '',
  });

  // Ambil daftar user buat dropdown Approver
  useEffect(() => {
    listUsers().then(setUsers).catch(() => {});
  }, []);

  // Kalau mode edit, ambil data existing
  useEffect(() => {
    if (isEdit) {
      getMeeting(id).then((data) => {
        setForm((prev) => ({
          ...prev,
          meeting_title: data.meeting_title || '',
          meeting_date: data.meeting_date || '',
          start_time: data.start_time || '',
          end_time: data.end_time || '',
          location: data.location || '',
          agenda: data.agenda || '',
          background: data.background || '',
          approver_id: data.approver_id || '',
        }));
      });
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      meeting_title: form.meeting_title,
      meeting_type: 'Koordinasi Internal',
      meeting_date: form.meeting_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location,
      agenda: form.agenda,
      background: form.background,
      discussion_mode: 'outline',
      approver_id: Number(form.approver_id),
      attendees: [],
      discussion_notes: form.discussion_notes_text
        ? [{ temp_id: 'tmp1', parent_note_id: null, order_in_level: 0, content: form.discussion_notes_text }]
        : [],
      action_items: [],
    };

    try {
      if (isEdit) {
        await updateMeeting(id, payload);
      } else {
        await createMeeting(payload);
      }
      navigate('/notulen');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan notulen. Cek kembali isian kamu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/notulen')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Kembali ke daftar notulen
      </button>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">
            {isEdit ? 'Edit Notulen' : 'Buat Notulen Baru'}
          </h2>

          <Field label="Judul Rapat" value={form.meeting_title} onChange={handleChange('meeting_title')} required />

          <div className="grid grid-cols-3 gap-4">
            <Field label="Tanggal" type="date" value={form.meeting_date} onChange={handleChange('meeting_date')} required />
            <Field label="Jam Mulai" type="time" value={form.start_time} onChange={handleChange('start_time')} required />
            <Field label="Jam Selesai" type="time" value={form.end_time} onChange={handleChange('end_time')} required />
          </div>

          <Field label="Lokasi" value={form.location} onChange={handleChange('location')} placeholder="Ruang Rapat Lantai 3" />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Approver</label>
            <select
              value={form.approver_id}
              onChange={handleChange('approver_id')}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Pilih approver...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 space-y-5">
          <TextAreaField label="Agenda" value={form.agenda} onChange={handleChange('agenda')} />
          <TextAreaField label="Latar Belakang" value={form.background} onChange={handleChange('background')} />
          <TextAreaField label="Pembahasan" value={form.discussion_notes_text} onChange={handleChange('discussion_notes_text')} />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/notulen')}
            className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60"
          >
            <Save size={15} strokeWidth={1.75} />
            {loading ? 'Menyimpan...' : 'Simpan Notulen'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder = '', required = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>
  );
}