'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, LogOut, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ADMIN_APP_URL } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fadeUp, staggerContainer } from '@/lib/motion';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isStaff = useAuthStore((state) => state.isStaff);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/login');
    }
  }, [isHydrated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto px-4 py-5 space-y-5"
    >
      <motion.div variants={fadeUp}>
        <Link href="/" className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">{user.name}</h1>
              <Badge variant="default" className="mt-1">
                <ShieldCheck className="w-3 h-3" /> {user.role}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              {user.phone}
            </div>
            {user.email && (
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                {user.email}
              </div>
            )}
          </div>

          <Separator />

          {isStaff && (
            <Button asChild variant="outline" className="w-full">
              <a href={ADMIN_APP_URL}>
                <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Admin Portal
              </a>
            </Button>
          )}

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
}
