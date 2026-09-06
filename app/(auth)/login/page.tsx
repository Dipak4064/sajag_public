'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, KeyRound, UserCheck, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ADMIN_APP_URL, isStaffRole } from '@/lib/session';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [redirecting, setRedirecting] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user, token } = res.data.data;
        setAuth(user, token);

        // Municipal/admin staff belong in the operations console, not the
        // citizen portal. The session cookie is host-scoped (ports are ignored),
        // so they arrive there already signed in.
        if (isStaffRole(user.role)) {
          setRedirecting(true);
          window.location.href = ADMIN_APP_URL;
          return;
        }

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
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-md mx-auto px-4 py-8 flex flex-col justify-center min-h-[80vh]"
    >
      <motion.div variants={fadeUp}>
      <Card className="p-6 sm:p-8 space-y-5">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 inline-flex"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Citizen Emergency Check-in
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register your emergency contact and receive instant SMS/voice disaster alerts
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border border-white/[0.08] p-1 rounded-xl bg-white/[0.03] text-xs relative">
          <button
            onClick={() => setMode('quick')}
            className={`relative z-10 flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'quick' ? 'text-cyan-200' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Quick Resident Pass
          </button>
          <button
            onClick={() => setMode('password')}
            className={`relative z-10 flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'password' ? 'text-cyan-200' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Email Login
          </button>
          <motion.div
            layoutId="login-mode-toggle"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute inset-y-1 w-[calc(50%-4px)] bg-cyan-400/15 border border-cyan-400/30 rounded-lg"
            style={{ left: mode === 'quick' ? '4px' : 'calc(50% + 0px)' }}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 overflow-hidden"
            >
              {error}
            </motion.div>
          )}

          {redirecting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 overflow-hidden rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs text-cyan-200"
            >
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
              Municipal account detected — opening the Operations Command Center…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === 'quick' ? (
            <motion.form
              key="quick"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleQuickLogin}
              className="space-y-4"
            >
              <div>
                <Label className="mb-1 block">Full Name:</Label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1 block">Mobile Number (For Twilio Alerts):</Label>
                <div className="relative">
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full">
                  <UserCheck className="w-4 h-4" />
                  {loading ? 'Registering...' : 'Enter Citizen Portal'}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordLogin}
              className="space-y-4"
            >
              <div>
                <Label className="mb-1 block">Email address:</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1 block">Password:</Label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  <KeyRound className="w-4 h-4" />
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[11px] text-slate-400">
          <div className="font-bold text-slate-300">Hackathon Citizen Credentials:</div>
          <div>Citizen Email: <code className="text-cyan-300">citizen@sajag.np</code></div>
          <div>Password: <code className="text-emerald-400">Prakop123!</code></div>
        </div>

        {/* Single sign-in point: municipal staff authenticate here too and are
            forwarded to the operations console automatically. */}
        <div className="space-y-1 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-bold text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Municipal Officer?
          </div>
          <div>
            Sign in with <code className="text-cyan-300">admin@kmc.gov.np</code> /{' '}
            <code className="text-emerald-400">Prakop123!</code> using{' '}
            <span className="font-semibold text-slate-300">Email Login</span> — you&apos;ll be taken
            straight to the Command Center.
          </div>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
}
