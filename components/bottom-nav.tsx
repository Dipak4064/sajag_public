'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldAlert, Tent, Camera, BellRing } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shelters', label: 'Shelters', icon: Tent },
    { href: '/sos', label: 'SOS', icon: ShieldAlert, isPrimary: true },
    { href: '/report', label: 'Report', icon: Camera },
    { href: '/alerts', label: 'Alerts', icon: BellRing }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -top-5 relative group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-red-950/80 border-4 border-slate-950 group-hover:scale-105 active:scale-95 transition-transform animate-pulse">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-red-500 mt-0.5 tracking-wider">
                  SOS
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
                isActive ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
