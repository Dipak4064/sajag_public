'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Wifi, WifiOff, User, LogOut, UserCircle, LayoutDashboard } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { ADMIN_APP_URL } from '@/lib/session';
import NotificationCenter from '@/components/notification-center';
import { Button } from '@/components/ui/button';
import SajagMark from '@/components/brand/sajag-mark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isStaff = useAuthStore((state) => state.isStaff);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Restore the stored session on the client. The store starts empty so the
  // server and first client render match; this fills it in right after.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const socket = getSocket();
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[hsl(221_47%_7%_/_0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[900px] items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <SajagMark className="h-9 w-9" title="SAJAG" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold leading-none text-white">
              SAJAG{' '}
              <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                CITIZEN
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">Disaster Alert &amp; SOS Portal</div>
          </div>
        </Link>

        {/* Live Network & User Links */}
        <div className="flex items-center gap-2">
          {/* Socket / Network Status Pill */}
          <div
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex ${
              socketConnected
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {socketConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            {socketConnected ? 'Live Grid Active' : 'Connecting...'}
          </div>

          <NotificationCenter />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="max-w-[70px] truncate">{user.name.split(' ')[0]}</span>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="w-4 h-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <a href={ADMIN_APP_URL} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Admin Portal
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-300">
                  <LogOut className="w-4 h-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
