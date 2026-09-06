'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Wifi, WifiOff, Bell, User } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const user = useAuthStore((state) => state.user);

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
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-red-950/60">
            स
          </div>
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-none">
              SAJAG <span className="text-[10px] text-red-500 font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">CITIZEN</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Disaster Alert & SOS Portal</div>
          </div>
        </Link>

        {/* Live Network & User Links */}
        <div className="flex items-center gap-2">
          {/* Socket / Network Status Pill */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              socketConnected 
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' 
                : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {socketConnected ? 'Live Grid Active' : 'Connecting...'}
          </div>

          <Link
            href="/alerts"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors relative"
            title="Disaster Alerts"
          >
            <Bell className="w-4 h-4" />
          </Link>

          {user ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="max-w-[70px] truncate">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
