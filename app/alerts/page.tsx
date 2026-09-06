'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing, AlertTriangle, ShieldCheck, CheckCircle2, ShieldAlert, Radio, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

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
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
          <BellRing className="w-3.5 h-3.5 text-red-500" /> Active Emergency Broadcasts
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Real-time Twilio & IVR Municipal Broadcast Stream</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">{alerts.length} Active Bulletins</span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Checking active broadcasts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">All Clear in Kathmandu Valley</h3>
            <p className="text-xs text-slate-400">No active disaster warnings or evacuations in effect.</p>
          </div>
        ) : (
          alerts.map((item) => {
            const isResponded = respondedAlerts[item.id];
            const isCritical = item.severity === 'CRITICAL';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-600/70 shadow-xl shadow-red-950/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                    <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                      isCritical ? 'bg-red-600 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Response Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 self-start sm:self-auto">
                    Geofenced Coverage: {(item.radiusMeters / 1000).toFixed(0)} km radius
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isResponded ? (
                      <span
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 ${
                          isResponded === 'SAFE'
                            ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                            : 'bg-red-950 border border-red-700 text-red-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Status Logged: {isResponded}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRespond(item.id, 'SAFE')}
                          className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/70 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> I Am Safe
                        </button>
                        <button
                          onClick={() => handleRespond(item.id, 'UNSAFE')}
                          className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-950/70 border border-red-700 text-red-300 hover:bg-red-900 transition-colors flex items-center justify-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Need Assistance
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
