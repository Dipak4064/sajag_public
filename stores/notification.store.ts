import { create } from 'zustand';
import type { ReportStatus } from '@/types';

export type NotificationType = 'report' | 'alert' | 'sos' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Status attached to report-type updates (VERIFIED / REJECTED / …). */
  status?: ReportStatus | string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'sajag_notifications';
const MAX_ITEMS = 40;

function loadPersisted(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: AppNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage full or blocked — notifications stay in-memory only.
  }
}

interface NotificationState {
  items: AppNotification[];
  toasts: AppNotification[];
  pushNotification: (input: {
    type: NotificationType;
    title: string;
    message: string;
    status?: ReportStatus | string;
    id?: string;
    createdAt?: string;
  }) => void;
  pushToast: (input: {
    type: NotificationType;
    title: string;
    message: string;
    status?: ReportStatus | string;
    id?: string;
  }) => void;
  dismissToast: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

const seeded = loadPersisted();

export const useNotificationStore = create<NotificationState>((set) => ({
  items: seeded,
  toasts: [],

  pushNotification: (input) =>
    set((state) => {
      const item: AppNotification = {
        id: input.id || `${input.type}-${Date.now()}`,
        type: input.type,
        title: input.title,
        message: input.message,
        status: input.status,
        createdAt: input.createdAt || new Date().toISOString(),
        read: false
      };
      // De-duplicate emergency / status pushes for the same report id.
      const existing = state.items.find((n) => n.id === item.id && n.type === item.type);
      const items = existing
        ? state.items.map((n) => (n.id === item.id && n.type === item.type ? { ...n, ...item } : n))
        : [item, ...state.items].slice(0, MAX_ITEMS);
      persist(items);
      return { items };
    }),

  pushToast: (input) =>
    set((state) => {
      const toast: AppNotification = {
        id: input.id || `${input.type}-${Date.now()}`,
        type: input.type,
        title: input.title,
        message: input.message,
        status: input.status,
        createdAt: new Date().toISOString(),
        read: true
      };
      const toasts = state.toasts.some((t) => t.id === toast.id)
        ? state.toasts.map((t) => (t.id === toast.id ? { ...t, ...toast } : t))
        : [toast, ...state.toasts].slice(0, 3);
      return { toasts };
    }),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  markAllRead: () =>
    set((state) => {
      const items = state.items.map((n) => ({ ...n, read: true }));
      persist(items);
      return { items };
    }),

  markRead: (id) =>
    set((state) => {
      const items = state.items.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(items);
      return { items };
    }),

  clear: () => {
    persist([]);
    set({ items: [] });
  }
}));

/** Unread count selector. */
export const selectUnread = (state: NotificationState) =>
  state.items.filter((n) => !n.read).length;

/** Compact relative timestamp used across notification surfaces. */
export function timeAgo(iso?: string) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}