'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Ban,
  AlertTriangle,
  ShieldAlert,
  Inbox,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  useNotificationStore,
  selectUnread,
  timeAgo,
  type AppNotification
} from '@/stores/notification.store';

const EXPLAINER: Record<AppNotification['type'], string> = {
  report: 'Field report verdict',
  alert: 'Hazard advisory',
  sos: 'Rescue request',
  system: 'System'
};

function ItemIcon({ type, status }: { type: AppNotification['type']; status?: string }) {
  if (type === 'report') {
    const Icon = status === 'VERIFIED' ? CheckCircle2 : Ban;
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          status === 'VERIFIED'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-white/10 bg-white/[0.06] text-slate-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
    );
  }
  if (type === 'alert' || type === 'sos') {
    const Icon = type === 'alert' ? AlertTriangle : ShieldAlert;
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
        <Icon className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-400">
      <BellRing className="h-4 w-4" />
    </div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore(selectUnread);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);

  // Opening the feed marks everything as seen — but only once it's actually open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(markAllRead, 700);
    return () => clearTimeout(t);
  }, [open, markAllRead]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="relative">
          <Button variant="outline" size="icon" title="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <AnimatedBadge show={unread > 0} count={unread} />
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-[min(92vw,360px)] p-0 overflow-hidden">
        <div className="border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <BellRing className="h-4 w-4 text-cyan-400" />
              Notifications
            </div>
            <div className="text-[10px] text-slate-500">
              Submit a field report to receive accept / deny updates
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={markAllRead}
              disabled={unread === 0}
            >
              <CheckCheck className="h-3 w-3" /> Read all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={clear}
              disabled={items.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="max-h-[340px] overflow-y-auto scrollbar-thin-slate p-1.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-slate-700" />
              <p className="text-xs text-slate-500">No notifications yet.</p>
              <p className="text-[10px] text-slate-600 max-w-[220px]">
                When authorities accept or deny your field report, the verdict lands here instantly.
              </p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                  n.read ? 'opacity-60' : 'bg-cyan-400/[0.05]'
                }`}
              >
                <ItemIcon type={n.type} status={n.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-100 truncate">
                      {n.title}
                    </span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />}
                  </div>
                  <p className="text-[11px] leading-snug text-slate-400 line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500">
                    <span>{EXPLAINER[n.type]}</span>
                    <span>·</span>
                    <span>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/[0.08] p-2 grid grid-cols-2 gap-1.5">
          <Button asChild variant="outline" size="sm" className="justify-center text-[11px]">
            <Link href="/profile#reports">
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
              My reports
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-center text-[11px]">
            <Link href="/alerts">
              Hazard alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AnimatedBadge({ show, count }: { show: boolean; count: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-red-900/60 bg-red-500 px-1 text-[9px] font-black text-white"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}