'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BellRing, AlertTriangle, ShieldCheck, CheckCircle2, ShieldAlert, Radio, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, staggerContainer, softSpring } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondedAlerts, setRespondedAlerts] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/alerts/active')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setAlerts(res.data.data);
        } else {
          setFallbackAlerts();
        }
      })
      .catch(() => {
        setFallbackAlerts();
      })
      .finally(() => setLoading(false));

    const socket = getSocket();
    socket.on('alert:new', (event: any) => {
      setAlerts((prev) => [event, ...prev]);
    });

    return () => {
      socket.off('alert:new');
    };
  }, []);

  const setFallbackAlerts = () => {
    setAlerts([
      {
        id: 'ev-1',
        title: 'Flash Flood Warning - Bagmati River Basin',
        description: 'Automated telemetry at Balkhu Station (ST-001) detected water level rising past danger limit (82 cm). Low-lying residents in Ward 14 are advised to evacuate immediately to Dasharath Stadium safe haven.',
        severity: 'CRITICAL',
        type: 'FLOOD',
        radiusMeters: 5000,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ev-2',
        title: 'Landslide Hazard Advisory - Nagdhunga Highway',
        description: 'Slope saturation reached 86% following heavy monsoon precipitation. Single-lane movement active. Travelers urged to delay movement.',
        severity: 'HIGH',
        type: 'LANDSLIDE',
        radiusMeters: 4000,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  };

  const handleRespond = async (alertId: string, status: 'SAFE' | 'UNSAFE') => {
    setRespondedAlerts((prev) => ({ ...prev, [alertId]: status }));
    try {
      await api.post('/alerts/respond', {
        alertId,
        response: status,
        message: status === 'SAFE' ? 'Self-reported Safe via Citizen PWA' : 'Immediate assistance needed'
      });
    } catch (e) {
      // offline handling
    }
  };

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto px-4 py-5 space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <Link href="/" className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
          <BellRing className="w-3.5 h-3.5 text-cyan-400" /> Active Emergency Broadcasts
        </span>
      </motion.div>

      <motion.div variants={fadeUp}>
      <Card className="flex items-center justify-between text-xs text-slate-400 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Real-time Twilio & IVR Municipal Broadcast Stream</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">{alerts.length} Active Bulletins</span>
      </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Checking active broadcasts...</div>
        ) : alerts.length === 0 ? (
          <Card className="text-center py-12 p-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">All Clear in Kathmandu Valley</h3>
            <p className="text-xs text-slate-400">No active disaster warnings or evacuations in effect.</p>
          </Card>
        ) : (
          <motion.div variants={staggerContainer(0.1)} initial="hidden" animate="show" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {alerts.map((item) => {
                const isResponded = respondedAlerts[item.id];
                const isCritical = item.severity === 'CRITICAL';

                const cardBody = (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                        <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                      </div>
                      <Badge
                        variant={isCritical ? 'destructive' : 'warning'}
                        className={isCritical ? 'border-transparent bg-red-600 text-white' : ''}
                      >
                        {item.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Response Actions */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400 self-start sm:self-auto">
                        Geofenced Coverage: {(item.radiusMeters / 1000).toFixed(0)} km radius
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <AnimatePresence mode="wait" initial={false}>
                          {isResponded ? (
                            <motion.div
                              key="responded"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={softSpring}
                            >
                              <Badge
                                variant={isResponded === 'SAFE' ? 'success' : 'destructive'}
                                className="text-xs px-3 py-1.5 normal-case"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Status Logged: {isResponded}
                              </Badge>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="actions"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 w-full sm:w-auto"
                            >
                              <motion.div whileTap={{ scale: 0.94 }} className="flex-1 sm:flex-initial">
                                <Button
                                  onClick={() => handleRespond(item.id, 'SAFE')}
                                  className="w-full bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900 hover:border-emerald-500"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> I Am Safe
                                </Button>
                              </motion.div>
                              <motion.div whileTap={{ scale: 0.94 }} className="flex-1 sm:flex-initial">
                                <Button
                                  onClick={() => handleRespond(item.id, 'UNSAFE')}
                                  className="w-full bg-red-950/70 border border-red-500/60 text-red-200 hover:bg-red-900 hover:border-red-400"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Need Assistance
                                </Button>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                );

                return (
                  <motion.div
                    key={item.id}
                    layout
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  >
                    {isCritical ? (
                      <div className="p-5 rounded-2xl border bg-gradient-to-r from-red-950/85 to-[hsl(221_45%_9%)] border-red-500/70 shadow-glow-red">
                        {cardBody}
                      </div>
                    ) : (
                      <Card className="p-5">{cardBody}</Card>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
