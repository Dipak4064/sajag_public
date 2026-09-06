'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[hsl(221_47%_7%_/_0.85)] px-3 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl">
      {/* Hairline of brand light along the top edge */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="relative mx-auto flex max-w-md items-end justify-around pb-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // The SOS trigger is the one intentionally red element in the whole shell.
          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-6 flex flex-col items-center"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 hsl(0 84% 60% / 0.6)',
                      '0 0 0 12px hsl(0 84% 60% / 0)'
                    ]
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[hsl(222_48%_5%)] bg-gradient-to-tr from-red-600 to-rose-500 text-white"
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <span className="mt-1 text-[10px] font-black tracking-wider text-red-400">SOS</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center rounded-xl px-2.5 py-1.5 transition-colors ${
                isActive ? 'font-bold text-cyan-300' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-xl border border-cyan-400/25 bg-cyan-400/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`relative z-10 mb-0.5 h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}
              />
              <span className="relative z-10 text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
