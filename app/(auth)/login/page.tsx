'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, KeyRound, Camera, User as UserIcon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'register' | 'signin'>('register');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File): Promise<string | undefined> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'citizens');

    // A raw fetch avoids the shared `api` client's JSON Content-Type default,
    // which would otherwise strip the multipart boundary the upload needs.
    const res = await fetch(`${api.defaults.baseURL}/files/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) return undefined;
    const body = await res.json();
    return body?.data?.url as string | undefined;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const photoUrl = photoFile ? await uploadPhoto(photoFile) : undefined;
      const res = await api.post('/auth/quick-register', { name, phone, email, photoUrl });
      const { user, token } = res.data.data;
      setAuth(user, token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not check you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email: signinEmail, password: signinPassword });
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-8 mx-auto"
    >
      <motion.div variants={fadeUp}>
        <Card className="space-y-5 p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-cyan-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>

          <h1 className="flex items-center gap-2 text-xl font-black text-white">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
            Citizen Check-in
          </h1>

          {/* Tab switch */}
          <div className="relative flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 text-xs">
            <button
              onClick={() => setMode('register')}
              className={`relative z-10 flex-1 rounded-lg py-1.5 font-bold transition-colors ${
                mode === 'register' ? 'text-cyan-200' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`relative z-10 flex-1 rounded-lg py-1.5 font-bold transition-colors ${
                mode === 'signin' ? 'text-cyan-200' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Sign In
            </button>
            <motion.div
              layoutId="login-mode-toggle"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg border border-cyan-400/30 bg-cyan-400/15"
              style={{ left: mode === 'register' ? '4px' : 'calc(50% + 0px)' }}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
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
                Opening the Operations Command Center…
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'register' ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoPick}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-cyan-400/50"
                  >
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-8 w-8 text-slate-600 group-hover:text-cyan-400" />
                    )}
                    <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                      <Camera className="h-3 w-3" />
                    </span>
                  </motion.button>
                </div>

                <div>
                  <Label className="mb-1 block">Name</Label>
                  <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                  <Label className="mb-1 block">Phone</Label>
                  <Input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div>
                  <Label className="mb-1 block">Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                  <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full">
                    {loading ? 'Checking in…' : 'Check In'}
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignIn}
                className="space-y-4"
              >
                <div>
                  <Label className="mb-1 block">Email</Label>
                  <Input
                    type="email"
                    required
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="mb-1 block">Password</Label>
                  <Input
                    type="password"
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                  />
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                  <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full">
                    <KeyRound className="h-4 w-4" />
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </motion.div>

                <p className="text-center text-[11px] text-slate-500">
                  Municipal staff sign in here too, and land in the Command Center.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
}
