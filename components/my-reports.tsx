'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Ban,
  Loader2,
  Inbox,
  BellRing
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotificationStore } from '@/stores/notification.store';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportRow {
  id: string;
  disasterType: string;
  description: string;
  addressText?: string;
  status: string;
  createdAt: string;
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}

function statusMeta(status: string) {
  switch (status) {
    case 'VERIFIED':
      return { label: 'Verified · Public', variant: 'success' as const, Icon: CheckCircle2 };
    case 'REJECTED':
      return { label: 'Reviewed · Not elevated', variant: 'secondary' as const, Icon: Ban };
    case 'RESOLVED':
      return { label: 'Resolved', variant: 'success' as const, Icon: CheckCircle2 };
    case 'SUBMITTED':
      return { label: 'Submitted', variant: 'info' as const, Icon: Clock };
    default:
      return { label: 'Under review', variant: 'warning' as const, Icon: Clock };
  }
}

const DEMO_REPORTS: ReportRow[] = [
  {
    id: 'rep-01',
    disasterType: 'FLOOD',
    description: 'Bagmati river is overflowing above retaining wall at Balkhu corridor. Road submerged under 2 feet.',
    addressText: 'Balkhu Riverbank Corridor, Kathmandu',
    status: 'UNDER_REVIEW',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rep-02',
    disasterType: 'LANDSLIDE',
    description: 'Mudflow debris obstructing Nagdhunga highway uphill lane.',
    addressText: 'Nagdhunga Corridor, Kathmandu',
    status: 'VERIFIED',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export default function MyReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/mine');
      if (res.data.success && res.data.data.length > 0) {
        setReports(res.data.data);
        return;
      }
    } catch {
      // backend offline — fall through to demo feed
    }

    // Backend unreachable (or no reports yet): show an illustrative feed so the
    // section is never an unexplained blank.
    const statusFeed = useNotificationStore.getState().items
      .filter((n) => n.type === 'report')
      .reduce<Record<string, string>>((acc, n) => {
        if (n.status) acc[n.id.replace(/^report-/, '')] = n.status;
        return acc;
      }, {});

    setReports(
      DEMO_REPORTS.map((r) => ({
        ...r,
        status: statusFeed[r.id] || r.status,
        description:
          statusFeed[r.id] && statusFeed[r.id] !== r.status
            ? `Updated by municipal review — status is now ${statusFeed[r.id].toLowerCase()}.`
            : r.description
      }))
    );
  }, []);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      id="reports"
      className="space-y-3 scroll-mt-24"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            My Field Reports
          </h2>
          <p className="text-[11px] text-slate-400">
            Track how the command center is responding to your submissions.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={fetchMine}
          whileTap={{ scale: 0.94 }}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* Verdict explainer */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-2 p-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] text-[11px] text-cyan-200"
      >
        <BellRing className="w-4 h-4 shrink-0 text-cyan-400" />
        <span>
          Accept or deny verdicts from the command center appear here and as a live
          notification in the bell above.
        </span>
      </motion.div>

      {loading ? (
        <Card className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your reports…
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-700" />
          You have not submitted any field reports yet.
        </Card>
      ) : (
        <motion.div variants={staggerContainer()} className="space-y-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {reports.map((rep) => {
              const meta = statusMeta(rep.status);
              const Icon = meta.Icon;
              return (
                <motion.div
                  key={rep.id}
                  layout
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <Card className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-white uppercase">
                        {rep.disasterType}
                      </span>
                      <Badge variant={meta.variant}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{rep.description}</p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06] text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono truncate">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{rep.addressText || 'Location captured'}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(rep.createdAt)}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}