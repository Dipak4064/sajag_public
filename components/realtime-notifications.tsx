'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Ban,
  AlertTriangle,
  ShieldAlert,
  BellRing,
  X
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import {
  useNotificationStore,
  timeAgo,
  type AppNotification
} from '@/stores/notification.store';
import { spring } from '@/lib/motion';

const TOAST_TTL_MS = 6500;

function toastIcon(type: AppNotification['type'], status?: string) {
  if (type === 'report') {
    return status === 'VERIFIED' ? CheckCircle2 : Ban;
  }
  if (type === 'alert') return AlertTriangle;
  if (type === 'sos') return ShieldAlert;
  return BellRing;
}

function toastTone(type: AppNotification['type'], status?: string) {
  if (type === 'report') {
    return status === 'VERIFIED'
      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
      : 'text-slate-300 bg-white/[0.06] border-white/15';
  }
  if (type === 'alert') return 'text-red-400 bg-red-500/15 border-red-500/30';
  if (type === 'sos') return 'text-red-400 bg-red-500/15 border-red-500/30';
  return 'text-cyan-400 bg-cyan-500/15 border-cyan-400/30';
}

function ReportToast({ toast }: { toast: AppNotification }) {
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const Icon = toastIcon(toast.type, toast.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={spring}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-xl ${toastTone(
        toast.type,
        toast.status
      )}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-100 leading-tight">{toast.title}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-slate-300 line-clamp-2">
          {toast.message}
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
          {timeAgo(toast.createdAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/*
  Global live-notification bridge.

  Subscribes to the shared socket gateway and converts broadcast events into
  in-app toasts + the persisted notification feed. Report verdicts carry the
  submitting citizen's userId, so only the person who filed the report gets the
  accept / deny ping; hazard broadcasts reach every open citizen session.
*/
export default function RealtimeNotifications() {
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const pushToast = useNotificationStore((s) => s.pushToast);
  const toasts = useNotificationStore((s) => s.toasts);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Auto-dismiss toasts after a few seconds.
  useEffect(() => {
    const current = toasts.map((t) => t.id);
    for (const id of Object.keys(timers.current)) {
      if (!current.includes(id)) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    }
    for (const toast of toasts) {
      if (timers.current[toast.id]) continue;
      timers.current[toast.id] = setTimeout(() => dismissToast(toast.id), TOAST_TTL_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  useEffect(() => {
    const socket = getSocket();

    const reportVerdict = (payload: any) => {
      const status = payload?.status;
      if (!status) return;

      // Verdicts are personal — only surface them to the submitting citizen.
      const currentUserId = useAuthStore.getState().user?.id;
      if (payload?.userId && payload?.userId !== currentUserId) return;

      const place = payload?.addressText
        ? ` at ${payload.addressText}`
        : '';
      const label = payload?.disasterType || 'incident';

      const content =
        status === 'VERIFIED'
          ? {
              title: 'Report verified & broadcast',
              message: `Authorities confirmed your ${label.toLowerCase()} report${place}. It is now mapped as a public advisory.`
            }
          : status === 'REJECTED'
          ? {
              title: 'Report reviewed — not elevated',
              message: `Your ${label.toLowerCase()} report${place} was reviewed and not added to the public alert feed.`
            }
          : {
              title: 'Report status updated',
              message: `Your ${label.toLowerCase()} report${place} is now ${status.replace(/_/g, ' ').toLowerCase()}.`
            };

      const id = `report-${payload.id || payload.userId || status}`;
      pushNotification({ type: 'report', id, status, ...content });
      pushToast({ type: 'report', id, status, ...content });
    };

    const hazardAlert = (event: any) => {
      const id = `alert-${event.id || event.eventId || Date.now()}`;
      const title = event.title || 'URGENT DISASTER WARNING';
      const message =
        event.description || 'A new hazard advisory has been issued for your area.';
      pushNotification({ type: 'alert', id, title, message });
      pushToast({ type: 'alert', id, title, message });
    };

    socket.on('report:status', reportVerdict);
    socket.on('report:verified', reportVerdict);
    socket.on('report:rejected', reportVerdict);
    socket.on('alert:new', hazardAlert);

    return () => {
      socket.off('report:status', reportVerdict);
      socket.off('report:verified', reportVerdict);
      socket.off('report:rejected', reportVerdict);
      socket.off('alert:new', hazardAlert);
    };
  }, [pushNotification, pushToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed z-[70] left-4 right-4 top-16 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-[360px]"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ReportToast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}