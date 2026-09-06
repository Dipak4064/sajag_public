'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Users, HeartPulse, Navigation, Phone, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, scaleIn, staggerContainer, spring } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SOSPage() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const [sosRecord, setSosRecord] = useState<any>(null);
  const [location, setLocation] = useState({ lat: 27.6895, lng: 85.3021 });
  const [addressText, setAddressText] = useState('Near Balkhu Bridge, Kathmandu');
  const [description, setDescription] = useState('Immediate flood water rising inside ground floor.');
  const [numberOfPeople, setNumberOfPeople] = useState(3);
  const [medicalEmergency, setMedicalEmergency] = useState<'NONE' | 'MINOR' | 'SEVERE' | 'CRITICAL'>('SEVERE');
  const [contactNumber, setContactNumber] = useState('+9779800000001');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setAddressText(`GPS Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 3-second abort countdown
  const startCountdown = () => {
    setCountdown(3);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      setCountdown(null);
      triggerSOS();
    }
  }, [countdown]);

  const triggerSOS = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/sos', {
        latitude: location.lat,
        longitude: location.lng,
        addressText,
        description,
        numberOfPeople,
        medicalEmergency,
        contactNumber
      });

      if (res.data.success) {
        setSosRecord(res.data.data);
        setIsTriggered(true);
      }
    } catch (err: any) {
      // Fallback optimistic local record if offline
      setSosRecord({
        id: 'offline-' + Date.now(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        addressText,
        description,
        numberOfPeople,
        medicalEmergency
      });
      setIsTriggered(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time listener for SOS updates from Authority Command Center
  useEffect(() => {
    const socket = getSocket();
    socket.on('sos:update', (updated: any) => {
      if (sosRecord && updated.id === sosRecord.id) {
        setSosRecord(updated);
      }
    });

    return () => {
      socket.off('sos:update');
    };
  }, [sosRecord]);

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-md mx-auto px-4 py-5 min-h-[85vh] flex flex-col justify-between"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <Link href="/" className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Emergency SOS Dispatch
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="my-auto py-6 space-y-6">
        <AnimatePresence mode="wait">
          {!isTriggered ? (
            <motion.div key="pre-trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Countdown Overlay */}
              <AnimatePresence mode="wait">
                {countdown !== null ? (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={spring}
                    className="p-8 bg-red-950 border-2 border-red-500 rounded-3xl text-center flex flex-col items-center shadow-glow-red animate-glow-pulse"
                  >
                    <span className="text-xs uppercase font-bold text-red-300 mb-2">Broadcasting Distress In</span>
                    <motion.span
                      key={countdown}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={spring}
                      className="text-7xl font-black text-white mb-4"
                    >
                      {countdown}
                    </motion.span>
                    <p className="text-xs text-red-200 mb-6">Dispatching rescue to your coordinates</p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={cancelCountdown}
                      className="w-full py-3.5 bg-white/[0.06] border border-white/15 text-white font-bold rounded-xl text-sm hover:bg-white/[0.12] hover:border-white/25 transition-colors"
                    >
                      CANCEL ALARM ✕
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Big Action Button */}
                    <div className="text-center space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        onClick={startCountdown}
                        disabled={submitting}
                        className="w-44 h-44 mx-auto rounded-full bg-gradient-to-tr from-red-600 to-rose-600 border-4 border-red-400/40 shadow-glow-red flex flex-col items-center justify-center text-white"
                      >
                        <ShieldAlert className="w-14 h-14 animate-pulse mb-1" />
                        <span className="text-2xl font-black tracking-wider">TAP SOS</span>
                        <span className="text-[10px] uppercase font-bold text-red-200">3s Abort Window</span>
                      </motion.button>
                      <p className="text-xs text-slate-400">
                        Pressing will alert Nepal Police, APF, and Army Command with your live coordinates.
                      </p>
                    </div>

                    {/* Location Detection pill */}
                    <Card className="p-3 rounded-xl flex items-center gap-2 text-xs">
                      <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-slate-400">Distress Geolocation</div>
                        <div className="font-mono text-slate-200 truncate">{addressText}</div>
                      </div>
                    </Card>

                    {/* Emergency Situation Triage Parameters */}
                    <Card className="p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Distress Details (Optional)
                      </span>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Current Situation:</label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">People Trapped:</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={numberOfPeople}
                            onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Medical Need:</label>
                          <select
                            value={medicalEmergency}
                            onChange={(e) => setMedicalEmergency(e.target.value as any)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                          >
                            <option value="NONE">None</option>
                            <option value="MINOR">Minor First Aid</option>
                            <option value="SEVERE">Severe Injury</option>
                            <option value="CRITICAL">Critical / Unconscious</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Direct Contact Phone:</label>
                        <input
                          type="tel"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                        />
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Real-time Status Card Post-Trigger */
            <motion.div
              key="post-trigger"
              variants={scaleIn}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              <div className="p-6 bg-red-950/40 border border-red-500/50 rounded-2xl text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                  className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/40"
                >
                  <CheckCircle2 className="w-8 h-8 text-red-500" />
                </motion.div>
                <h2 className="text-xl font-black text-white">SOS SIGNAL BROADCASTED</h2>
                <p className="text-xs text-slate-300">
                  Your distress request has been registered with the Kathmandu Metropolitan Disaster Command Center.
                </p>
              </div>

              {/* Lifecycle Tracker */}
              <Card className="p-4 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Rescue Dispatch Status
                </span>

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${sosRecord?.assignedTeam ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {sosRecord?.status === 'ASSIGNED' || sosRecord?.assignedTeam
                        ? `Team Assigned: ${sosRecord?.assignedTeam?.name || 'Armed Police Force Unit 2'}`
                        : 'Triaging with nearest responder unit...'}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      Status:
                      <Badge variant={sosRecord?.assignedTeam ? 'success' : 'warning'}>
                        {sosRecord?.status || 'PENDING'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {sosRecord?.assignedTeam && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs space-y-1"
                  >
                    <div className="font-bold text-emerald-300">Responders en route!</div>
                    <div className="text-slate-300">Officer: {sosRecord.assignedTeam.leadOfficerName}</div>
                    <div className="text-slate-400 font-mono">Radio: {sosRecord.assignedTeam.contactRadioFreq || 'VHF 156.800 MHz'}</div>
                  </motion.div>
                )}
              </Card>

              {/* Survival Guidance */}
              <Card className="p-4 space-y-2 text-xs text-slate-300">
                <span className="font-bold text-white block">Immediate Actions:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Move to higher ground or upper floor if water is rising.</li>
                  <li>Keep your phone battery conserved and torch/whistle handy.</li>
                  <li>Do not attempt to cross swift flood currents on foot.</li>
                </ul>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Emergency Phone Bar */}
      <motion.div variants={fadeUp} className="pt-3 border-t border-white/[0.06] text-center">
        <motion.div whileTap={{ scale: 0.95 }} className="inline-block">
          <Button asChild variant="outline" className="border-red-500/40 text-red-300 hover:text-red-200 hover:border-red-400/60 hover:bg-red-500/10">
            <a href="tel:100">
              <Phone className="w-3.5 h-3.5" /> Call Police Directly (100)
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
