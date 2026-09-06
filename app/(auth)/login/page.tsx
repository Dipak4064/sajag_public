'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, KeyRound, UserCheck, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<'password' | 'quick'>('quick');
  const [phone, setPhone] = useState('+977 9801234567');
  const [name, setName] = useState('Ram Bahadur Thapa');
  const [email, setEmail] = useState('citizen@sajag.np');
  const [password, setPassword] = useState('Prakop123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. You can use Quick Resident Check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Instant local resident profile
    const dummyUser = {
      id: 'citizen-' + Date.now(),
      name,
      phone,
      email: `${phone.replace(/[^0-9]/g, '')}@citizen.sajag.np`,
      role: 'CITIZEN' as const,
      latitude: 27.6895,
      longitude: 85.3021
    };
    setAuth(dummyUser, 'token-citizen-demo');
    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col justify-center min-h-[80vh]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 inline-flex"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            Citizen Emergency Check-in
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register your emergency contact and receive instant SMS/voice disaster alerts
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border border-slate-800 p-1 rounded-xl bg-slate-950 text-xs">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'quick' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Resident Pass
          </button>
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'password' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Email Login
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {mode === 'quick' ? (
          <form onSubmit={handleQuickLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Full Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Mobile Number (For Twilio Alerts):</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none pl-9"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-transform active:scale-98"
            >
              <UserCheck className="w-4 h-4" />
              {loading ? 'Registering...' : 'Enter Citizen Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Email address:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300">Hackathon Citizen Credentials:</div>
          <div>Citizen Email: <code className="text-blue-400">citizen@sajag.np</code></div>
          <div>Password: <code className="text-emerald-400">Prakop123!</code></div>
        </div>
      </div>
    </div>
  );
}
