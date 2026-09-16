import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import logoPlnEpi from '../assets/logo-plnepi.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect ke API Laravel /api/login nanti
    console.log('Login submit:', form);
  };

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]">
      {/* Panel kiri — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f2557] flex-col justify-between p-12">
        <div className="flex items-center gap-2 bg-white rounded px-3 py-2 w-fit">
        <img src={logoPlnEpi} alt="PLN EPI" className="h-8 w-auto" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-semibold leading-snug mb-2">
            Minutes of Meeting &amp;<br />Action Item Tracker
          </h1>
          <p className="text-blue-200/70 text-sm">
            Kelola notulen rapat dan pantau tindak lanjut dalam satu sistem terpusat.
          </p>
        </div>
        <p className="text-blue-300/50 text-xs">
          &copy; 2026 PT PLN Energi Primer Indonesia
        </p>
      </div>

      {/* Panel kanan — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk ke akun kamu</h2>
          <p className="text-sm text-gray-500 mb-6">Gunakan email dan password perusahaan.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@plnepi.co.id"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0f2557] text-white text-sm font-medium py-2.5 rounded hover:bg-[#0c1e47] transition-colors"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}