import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react';
import {
  createMeeting, getMeeting, updateMeeting,
  uploadAttachment, deleteAttachment,
  addAttendee, updateAttendee, removeAttendee,
} from '../api/meetings';
import { listUsers } from '../api/users';
import { listDivisions } from '../api/divisions';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import { VISIBILITY_TO_LABEL } from '../lib/statuslabels';
import { extractError } from '../lib/errors';
import { compressImage } from '../lib/image';
import { extractAgreementItems, guessPicId, normalizeText } from '../lib/agreements';

const VISIBILITY_HINT = {
  Public: 'Setelah disetujui, bisa dilihat semua user.',
  Division: 'Setelah disetujui, bisa dilihat user di divisimu.',
  Restricted: 'Hanya notulis, approver, peserta internal (akun terdaftar), dan Admin. Tamu eksternal yang diketik manual tidak punya akses.',
};

// Presensi tiga keadaan. Di <select>: '' = belum dikonfirmasi, 'true' = hadir, 'false' = tidak hadir.
const toPresence = (value) => (value === '' ? null : value === 'true');
const presenceValue = (v) => (v === null || v === undefined ? '' : String(v));

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
    discussion_content: '',
    conclusion: '',
    approver_id: '',
    visibility: 'Division',
  });

  const [attendees, setAttendees] = useState([{ name: '', division: '', is_present: null }]);
  // PIC/tenggat/prioritas per butir kesepakatan; kuncinya teks butir
  const [itemMeta, setItemMeta] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newAttendee, setNewAttendee] = useState({ name: '', division: '', is_present: '' });
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [internalPick, setInternalPick] = useState('');

  useEffect(() => {
    listUsers().then(setUsers).catch(() => {});
    listDivisions().then(setDivisions).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      getMeeting(id).then((data) => {
        setForm((prev) => ({
          ...prev,
          meeting_title: data.meeting_title || '',
          meeting_date: data.meeting_date?.slice(0, 10) || '',
          start_time: data.start_time?.slice(0, 5) || '',
          end_time: data.end_time?.slice(0, 5) || '',
          location: data.location || '',
          agenda: data.agenda || '',
          background: data.background || '',
          conclusion: data.conclusion || '',
          discussion_content: data.discussion_manual_content || '',
          approver_id: data.approver_id || '',
          visibility: data.visibility || 'Division',
        }));
        setAttendees((data.attendees || []).map((a) => ({
          id: a.id,
          user_id: a.user_id,
          name: a.name || '',
          division: a.division || '',
          is_present: a.is_present ?? null,
        })));
        if (data.action_items?.length) {
          const seen = {};
          setItemMeta(Object.fromEntries(data.action_items.map((ai) => {
            const text = normalizeText(ai.description);
            seen[text] = (seen[text] ?? -1) + 1;
            return [`${text}#${seen[text]}`, {
              pic_id: ai.pic_id || '',
              deadline: ai.deadline?.slice(0, 10) || '',
              priority: ai.priority || 'Medium',
            }];
          })));
        }
        setAttachments(data.attachments || []);
      });
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const handleRichChange = (field) => (html) => setForm({ ...form, [field]: html });

  const handleAttendeeChange = (index, field) => (e) => {
    const value = field === 'is_present' ? e.target.checked : e.target.value;
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };
  const addAttendeeRow = () => setAttendees([...attendees, { name: '', division: '', is_present: true }]);
  const removeAttendeeRow = (index) => setAttendees(attendees.filter((_, i) => i !== index));
  const handleAddAttendee = async () => {
    if (!newAttendee.name.trim()) return;
    setAddingAttendee(true);
    setError('');
    try {
      const added = await addAttendee(id, {
        name: newAttendee.name,
        division: newAttendee.division,
        is_present: toPresence(newAttendee.is_present),
      });
      setAttendees((prev) => [...prev, added]);
      setNewAttendee({ name: '', division: '', is_present: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah peserta.');
    } finally {
      setAddingAttendee(false);
    }
  };

  const handleRemoveAttendee = async (attendeeId) => {
    try {
      await removeAttendee(id, attendeeId);
      setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
    } catch {
      setError('Gagal menghapus peserta.');
    }
  };

  // Notulis mengonfirmasi presensi peserta (disimpan langsung, dikembalikan kalau gagal).
  const handleAttendanceChange = async (attendee, value) => {
    const next = toPresence(value);
    const previous = attendee.is_present;
    setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? { ...a, is_present: next } : a)));
    try {
      await updateAttendee(id, attendee.id, next);
    } catch (err) {
      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? { ...a, is_present: previous } : a)));
      setError(extractError(err, 'Gagal mengubah kehadiran.'));
    }
  };

  // Peserta internal: kirim user_id saja, backend mengisi nama & divisi dari data user.
  const handleAddInternalAttendee = async (userId) => {
    if (!userId) return;
    setAddingAttendee(true);
    setError('');
    try {
            const added = await addAttendee(id, { user_id: Number(userId) }); // presensi dikonfirmasi notulis kemudian
      setAttendees((prev) => [...prev, added]);
    } catch (err) {
      setError(extractError(err, 'Gagal menambah peserta.'));
    } finally {
      setAddingAttendee(false);
      setInternalPick('');
    }
  };

  const divisionName = Object.fromEntries(divisions.map((d) => [d.id, d.division_name]));
  const availableUsers = users.filter((u) => !attendees.some((a) => a.user_id === u.id));

  // Butir kesepakatan diambil langsung dari editor; tiap butir otomatis jadi action item.
  const seen = {};
  const agreementItems = extractAgreementItems(form.conclusion).map((text) => {
    seen[text] = (seen[text] ?? -1) + 1;
    const key = `${text}#${seen[text]}`; // butir kembar dibedakan lewat urutannya
    const meta = itemMeta[key] || {};
    return {
      key,
      text,
      pic_id: meta.pic_id ?? guessPicId(text, users),
      deadline: meta.deadline || '',
      priority: meta.priority || 'Medium',
    };
  });
  const missingPic = agreementItems.filter((ai) => !ai.pic_id).length;

  const setMeta = (key, field) => (e) => {
    const current = agreementItems.find((ai) => ai.key === key) || {};
    setItemMeta((prev) => ({
      ...prev,
      [key]: {
        pic_id: current.pic_id,
        deadline: current.deadline,
        priority: current.priority,
        ...prev[key],
        [field]: e.target.value,
      },
    }));
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    setError('');
    try {
      const prepared = await compressImage(
        file,
        fileType === 'Scan Daftar Hadir' ? { maxSide: 2000, quality: 0.85 } : { maxSide: 1600, quality: 0.8 },
      );
      const uploaded = await uploadAttachment(id, prepared, fileType);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal upload file.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await deleteAttachment(id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      setError('Gagal menghapus file.');
    }
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
      conclusion: form.conclusion,
      discussion_mode: 'manual',
      discussion_manual_content: form.discussion_content,
      approver_id: Number(form.approver_id),
      visibility: form.visibility,
      discussion_notes: [],
      action_items: agreementItems
        .filter((ai) => ai.pic_id)
        .map((ai) => ({
          description: ai.text,
          pic_id: Number(ai.pic_id),
          deadline: ai.deadline || null,
          priority: ai.priority,
        })),
      ...(!isEdit && {
        attendees: attendees
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name, division: a.division, is_present: a.is_present })),
      }),
    };
    try {
      if (isEdit) {
        await updateMeeting(id, payload);
      } else {
        await createMeeting(payload);
      }
      navigate('/notulen');
    } catch (err) {
      setError(extractError(err, 'Gagal menyimpan notulen. Cek kembali isian kamu.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/notulen')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} strokeWidth={1.75} />
        Kembali ke daftar notulen
      </button>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2.5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">{isEdit ? 'Edit Notulen' : 'Buat Notulen Baru'}</h2>
          <Field label="Judul Rapat" value={form.meeting_title} onChange={handleChange('meeting_title')} required />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Tanggal" type="date" value={form.meeting_date} onChange={handleChange('meeting_date')} required />
            <Field label="Jam Mulai" type="time" value={form.start_time} onChange={handleChange('start_time')} required />
            <Field label="Jam Selesai" type="time" value={form.end_time} onChange={handleChange('end_time')} required />
          </div>
          <Field label="Lokasi" value={form.location} onChange={handleChange('location')} placeholder="Ruang Rapat Lantai 3" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Approver</label>
            <select value={form.approver_id} onChange={handleChange('approver_id')} required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500">
              <option value="">Pilih approver...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Visibilitas</label>
            <select value={form.visibility} onChange={handleChange('visibility')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500">
              {Object.entries(VISIBILITY_TO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{VISIBILITY_HINT[form.visibility]}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 space-y-5">
          <TextAreaField label="Agenda" value={form.agenda} onChange={handleChange('agenda')} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Latar Belakang</label>
            <RichTextEditor value={form.background} onChange={handleRichChange('background')} placeholder="Latar belakang rapat..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Pembahasan</label>
            <RichTextEditor value={form.discussion_content} onChange={handleRichChange('discussion_content')} placeholder="Poin-poin pembahasan rapat..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Hasil Pembahasan / Kesepakatan</label>
            <RichTextEditor value={form.conclusion} onChange={handleRichChange('conclusion')} placeholder="Kesepakatan dan tindak lanjut hasil rapat..." />
          </div>
        </div>

       {/* Action Items — otomatis dari butir "Hasil Kesepakatan / Tindak Lanjut" */}
      <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Action Items</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Setiap butir di "Hasil Kesepakatan / Tindak Lanjut" otomatis jadi action item. Tentukan PIC, tenggat, dan prioritasnya di sini
            (atau tulis <span className="font-mono">(PIC: Nama)</span> di butirnya agar PIC terisi sendiri).
          </p>
        </div>

        {agreementItems.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada butir. Tulis kesepakatan sebagai daftar di kolom di atas.</p>
        ) : (
          <div className="space-y-3">
            {agreementItems.map((ai) => (
              <div key={ai.key} className="border border-gray-100 rounded p-3 space-y-2">
                <p className="text-sm text-gray-800">{ai.text}</p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={ai.pic_id}
                    onChange={setMeta(ai.key, 'pic_id')}
                    className={`px-3 py-2 text-sm border rounded focus:outline-none focus:border-blue-500 ${ai.pic_id ? 'border-gray-300' : 'border-yellow-400'}`}
                  >
                    <option value="">PIC...</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={ai.deadline}
                    onChange={setMeta(ai.key, 'deadline')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={ai.priority}
                    onChange={setMeta(ai.key, 'priority')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {missingPic > 0 && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            {missingPic} butir belum punya PIC dan belum akan tercatat sebagai action item.
          </p>
        )}
      </div>

        {/* Daftar Hadir */}
        <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Daftar Hadir</h3>

          {isEdit ? (
            <>
              <div className="space-y-2">
                {attendees.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                    <span className="text-gray-700">
                      {a.name}
                      {a.user_id && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Internal</span>
                      )}
                    </span>
                    <span className="text-gray-400 text-xs">{a.division || '-'}</span>
                    <select
                      value={presenceValue(a.is_present)}
                      onChange={(e) => handleAttendanceChange(a, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Belum dikonfirmasi</option>
                      <option value="true">Hadir</option>
                      <option value="false">Tidak Hadir</option>
                    </select>
                    <button type="button" onClick={() => handleRemoveAttendee(a.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Tambah peserta internal</label>
                <select
                  value={internalPick}
                  onChange={(e) => handleAddInternalAttendee(e.target.value)}
                  disabled={addingAttendee}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="">Pilih user terdaftar...</option>
                  {availableUsers.map((u) => {
                    const division = divisionName[u.division_id] || u.division;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.full_name}{division ? ` — ${division}` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-400">
                  Peserta internal punya akun, sehingga bisa membuka notulen Terbatas ini. Untuk tamu eksternal, isi nama di bawah.
                </p>
              </div>

              <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
                <input type="text" placeholder="Nama" value={newAttendee.name}
                  onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                <input type="text" placeholder="Divisi" value={newAttendee.division}
                  onChange={(e) => setNewAttendee({ ...newAttendee, division: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                <select
                  value={newAttendee.is_present}
                  onChange={(e) => setNewAttendee({ ...newAttendee, is_present: e.target.value })}
                  className="px-2 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Belum dikonfirmasi</option>
                  <option value="true">Hadir</option>
                  <option value="false">Tidak Hadir</option>
                </select>
                <button type="button" onClick={handleAddAttendee} disabled={addingAttendee}
                  className="text-xs text-white bg-[#0f2557] rounded px-3 py-2 hover:bg-[#0c1e47] disabled:opacity-60 whitespace-nowrap">
                  {addingAttendee ? 'Menambah...' : 'Tambah'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">
              Daftar hadir bisa ditambahkan langsung (satu per satu) setelah notulen ini disimpan pertama kali.
            </p>
          )}

          {isEdit && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-500">Unggah scan daftar hadir fisik atau dokumentasi foto.</p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs border border-gray-300 rounded px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
                  <Upload size={14} strokeWidth={1.75} />
                  {uploadingFile ? 'Mengunggah...' : 'Unggah Scan Daftar Hadir'}
                  <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" disabled={uploadingFile} onChange={(e) => handleFileUpload(e, 'Scan Daftar Hadir')} />
                </label>
                <label className="flex items-center gap-2 text-xs border border-gray-300 rounded px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
                  <Upload size={14} strokeWidth={1.75} />
                  {uploadingFile ? 'Mengunggah...' : 'Unggah Dokumentasi'}
                  <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" disabled={uploadingFile} onChange={(e) => handleFileUpload(e, 'Dokumentasi Foto')} />
                </label>
              </div>
              <p className="text-xs text-gray-400">
                Format foto (JPG/PNG).
              </p>
              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-2">
                      <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{att.file_type}</a>
                      <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="text-gray-400 hover:text-red-600">
                        <X size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isEdit && (
            <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
              Upload scan daftar hadir/dokumentasi bisa dilakukan setelah notulen ini disimpan.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/notulen')} className="text-sm border border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60">
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
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea value={value} onChange={onChange} rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
    </div>
  );
}