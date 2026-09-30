import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, FileText, ListChecks, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoPlnEpi from '../assets/logo-plnepi.png';

const FEATURES = [
  { icon: FileText, title: 'Notulen terpusat', desc: 'Susun, simpan, dan cari notulen rapat dalam satu tempat.' },
  { icon: ListChecks, title: 'Pantau tindak lanjut', desc: 'Setiap action item punya PIC, deadline, dan status yang jelas.' },
  { icon: ShieldCheck, title: 'Alur persetujuan', desc: 'Notulen disahkan approver sebelum diterbitkan sebagai PDF.' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  if (user) return <Navigate to="/" replace />;

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
           {/* Panel kiri — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f2557] flex-col px-14 py-14 subpixel-antialiased">
        <div className="text-white text-3xl font-bold tracking-wide">MoMHub</div>

        <div className="w-full mt-16">
          <div className="text-white text-5xl font-bold leading-tight mb-6">
            Minutes of Meeting &amp;
            <br />
            Action Item Tracker
          </div>
          <p className="text-blue-50 text-xl font-medium mb-14 leading-relaxed">
            Kelola notulen rapat dan pantau tindak lanjutnya dalam satu sistem terpusat.
          </p>

          <div className="space-y-5 w-full">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-5 w-full border border-white/25 bg-white/10 rounded px-6 py-5"
              >
                <div className="w-14 h-14 shrink-0 rounded bg-white/15 flex items-center justify-center">
                  <Icon size={28} strokeWidth={2} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white text-xl font-semibold">{title}</div>
                  <p className="text-blue-50 text-base font-medium mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-100 text-sm font-medium mt-auto pt-10">
          &copy; 2026 PT PLN Energi Primer Indonesia
        </p>
      </div>

      {/* Panel kanan — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <img src={logoPlnEpi} alt="PLN Energi Primer Indonesia" className="h-20 w-auto mb-12" />

          <div className="text-3xl font-semibold text-gray-900 mb-2">Masuk ke MoMHub</div>
          <p className="text-base text-gray-500 mb-8">Gunakan email dan password perusahaan kamu.</p>

          {error && (
            <div role="alert" className="mb-6 text-base text-red-700 bg-red-50 border border-red-200 rounded px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="nama@plnepi.co.id"
                  className="w-full pl-11 pr-3 py-3 text-base border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Masukkan password"
                  className="w-full pl-11 pr-12 py-3 text-base border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0f2557] text-white text-base font-medium py-3 rounded hover:bg-[#0c1e47] transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-8">
            Lupa password atau belum punya akun? Hubungi admin sistem.
          </p>
        </div>
      </div>
    </div>
  );
}