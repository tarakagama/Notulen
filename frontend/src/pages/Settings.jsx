import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock, Bell } from 'lucide-react';

const tabs = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'keamanan', label: 'Keamanan', icon: Lock },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
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
        {activeTab === 'notifikasi' && <NotifikasiTab />}
      </div>
    </div>
  );
}

function ProfilTab() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Informasi Profil</h2>
      <p className="text-sm text-gray-500 mb-5">Perbarui data pribadi dan foto profil kamu.</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#0f2557] text-white text-lg flex items-center justify-center font-medium">
          T
        </div>
        <button className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-50">
          Ganti Foto
        </button>
      </div>

      <div className="space-y-4 max-w-md">
        <Field label="Nama Lengkap" defaultValue="Taraka" />
        <Field label="Email" defaultValue="taraka@plnepi.co.id" type="email" />
        <Field label="Divisi" defaultValue="IT & Digitalization" />
      </div>

      <button className="mt-6 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47]">
        Simpan Perubahan
      </button>
    </div>
  );
}

function KeamananTab() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Keamanan</h2>
      <p className="text-sm text-gray-500 mb-5">Ubah password akun kamu secara berkala.</p>

      <div className="space-y-4 max-w-md">
        <Field label="Password Saat Ini" type="password" />
        <Field label="Password Baru" type="password" />
        <Field label="Konfirmasi Password Baru" type="password" />
      </div>

      <button className="mt-6 text-sm text-white bg-[#0f2557] rounded px-4 py-2 hover:bg-[#0c1e47]">
        Perbarui Password
      </button>
    </div>
  );
}

function NotifikasiTab() {
  const options = [
    { label: 'Notulen baru menunggu approval', checked: true },
    { label: 'Action item mendekati deadline', checked: true },
    { label: 'Action item terlambat', checked: true },
    { label: 'Komentar pada notulen', checked: false },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Preferensi Notifikasi</h2>
      <p className="text-sm text-gray-500 mb-5">Atur notifikasi apa saja yang ingin kamu terima.</p>

      <div className="space-y-3 max-w-md">
        {options.map((opt) => (
          <label key={opt.label} className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-700">{opt.label}</span>
            <input type="checkbox" defaultChecked={opt.checked} className="w-4 h-4 accent-[#0f2557]" />
          </label>
        ))}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', defaultValue = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}