import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listDivisions } from '../api/divisions';
import { updateProfile, updatePassword } from '../api/auth';
import { roleLabel } from '../lib/statuslabels';
import { extractError } from '../lib/errors';

const tabs = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'keamanan', label: 'Keamanan', icon: Lock },
];

export default function Settings() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'profil';

  return (
    <div className="bg-white border border-gray-200 rounded">
      {/* Horizontal tab bar */}
      <div className="flex border-b border-gray-200 px-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(`/settings/${id}`)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
              activeTab === id
                ? 'border-[#0f2557] text-[#0f2557] font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'profil' && <ProfilTab />}
        {activeTab === 'keamanan' && <KeamananTab />}
      </div>
    </div>
  );
}

function ProfilTab() {
  const { user, updateLocalUser } = useAuth();
  const [divisions, setDivisions] = useState([]);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [position, setPosition] = useState(user?.position_title || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  useEffect(() => {
    listDivisions().then(setDivisions).catch(() => {});
  }, []);

  const divisionName = divisions.find((d) => d.id === user?.division_id)?.division_name || user?.division || '-';
  const initial = (fullName || user?.full_name || '?').trim().charAt(0).toUpperCase();

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        full_name: fullName.trim(),
        position_title: position.trim() || null,
      });
      updateLocalUser(updated);
      setMessage({ type: 'ok', text: 'Profil berhasil disimpan.' });
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err, 'Gagal menyimpan profil.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Informasi Profil</h2>
      <p className="text-sm text-gray-500 mb-5">Nama dan jabatan bisa kamu ubah. Email dan divisi diatur oleh admin.</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#0f2557] text-white text-lg flex items-center justify-center font-medium">
          {initial}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{user?.full_name || '-'}</p>
          <p className="text-xs text-gray-500">{roleLabel(user?.global_role)}</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <Field label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Field label="Email" type="email" value={user?.email || ''} readOnly />
        <Field label="Divisi" value={divisionName} readOnly />
        <Field label="Jabatan" value={position} onChange={(e) => setPosition(e.target.value)} />
      </div>

      {message && (
        <p className={`mt-4 text-xs max-w-md ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
      )}

      <button
        type="submit"
        disabled={saving || !fullName.trim()}
        className="mt-6 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60"
      >
        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </form>
  );
}

function KeamananTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (form.new_password !== form.new_password_confirmation) {
      setMessage({ type: 'error', text: 'Konfirmasi password baru tidak sama.' });
      return;
    }

    setSaving(true);
    try {
      await updatePassword(form);
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setMessage({ type: 'ok', text: 'Password berhasil diubah.' });
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err, 'Gagal mengubah password.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Keamanan</h2>
      <p className="text-sm text-gray-500 mb-5">Ubah password akun kamu secara berkala. Minimal 8 karakter.</p>

      <div className="space-y-4 max-w-md">
        <Field label="Password Saat Ini" type="password" value={form.current_password} onChange={set('current_password')} required />
        <Field label="Password Baru" type="password" value={form.new_password} onChange={set('new_password')} required />
        <Field label="Konfirmasi Password Baru" type="password" value={form.new_password_confirmation} onChange={set('new_password_confirmation')} required />
      </div>

      {message && (
        <p className={`mt-4 text-xs max-w-md ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47] disabled:opacity-60"
      >
        {saving ? 'Memperbarui...' : 'Perbarui Password'}
      </button>
    </form>
  );
}

function Field({ label, type = 'text', defaultValue, value, readOnly = false, required = false, onChange }) {
  const valueProps = value !== undefined ? { value, onChange: onChange || (() => {}) } : { defaultValue: defaultValue ?? '' };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        {...valueProps}
        readOnly={readOnly}
        required={required}
        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
          readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''
        }`}
      />
    </div>
  );
}