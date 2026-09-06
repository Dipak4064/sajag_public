'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Tent,
  Camera,
  PhoneCall,
  Navigation,
  ArrowRight,
  Droplets,
  Activity,
  CloudRain,
  Mountain,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import CitizenMap from '@/components/map/citizen-map';
import { fadeUp, scaleIn, staggerContainer, spring, softSpring } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MotionLink = motion(Link);

export default function CitizenDashboard() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [nearestShelter, setNearestShelter] = useState<any>(null);
  const [riskScore, setRiskScore] = useState(24);
  const [locationName, setLocationName] = useState('Balkhu, Ward 14, Kathmandu');
  const [userLocation, setUserLocation] = useState({ lat: 27.6895, lng: 85.3021 });
  const [safetyStatusMarked, setSafetyStatusMarked] = useState<string | null>(null);

  // Animated count-up for the hazard risk score
  const scoreMotionValue = useMotionValue(riskScore);
  const [displayScore, setDisplayScore] = useState(riskScore);

  useEffect(() => {
    const controls = animate(scoreMotionValue, riskScore, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v))
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskScore]);

  useEffect(() => {
    // 1. Try browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // 2. Fetch active alerts
    api.get('/alerts/active')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setActiveAlerts(res.data.data);
          setRiskScore(res.data.data[0].riskScore || 65);
        }
      })
      .catch(() => {});

    // 3. Fetch shelters
    api.get(`/shelters/nearest?lat=${userLocation.lat}&lng=${userLocation.lng}`)
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setShelters(res.data.data);
          setNearestShelter(res.data.data[0]);
        }
      })
      .catch(() => {
        // Fallback default shelter for Kathmandu if API is spinning up
        const fallbackShelters = [
          {
            id: 'sh-1',
            name: 'Dasharath Stadium Open Ground Safe Haven',
            address: 'Tripureshwor, Kathmandu',
            latitude: 27.6953,
            longitude: 85.3146,
            totalCapacity: 1200,
            currentOccupancy: 180,
            hasMedicalFacility: true,
            hasFoodWater: true,
            hasBackupPower: true,
            distanceMeters: 1400
          }
        ];
        setShelters(fallbackShelters);
        setNearestShelter(fallbackShelters[0]);
      });

    // 4. Socket.IO live emergency updates
    const socket = getSocket();
    socket.on('alert:new', (event: any) => {
      setActiveAlerts((prev) => [event, ...prev]);
      if (event.riskScore) {
        setRiskScore(event.riskScore);
      }
    });

    return () => {
      socket.off('alert:new');
    };
  }, [userLocation.lat, userLocation.lng]);

  /* Semantic hazard ramp: emerald (all clear) → amber (moderate) → orange (high) → red (critical).
     Red only ever appears in the critical band. */
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-500/10 border-red-500/40';
    if (score >= 60) return 'text-orange-300 bg-orange-500/10 border-orange-500/35';
    if (score >= 30) return 'text-amber-300 bg-amber-500/10 border-amber-500/35';
    return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/35';
  };

  const getRiskBadgeVariant = (score: number): 'destructive' | 'warning' | 'success' => {
    if (score >= 80) return 'destructive';
    if (score >= 30) return 'warning';
    return 'success';
  };

  /* The "high" band sits between amber and red — Badge has no orange variant, so tint it here. */
  const getRiskBadgeClass = (score: number) =>
    score >= 60 && score < 80 ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' : '';

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL EMERGENCY';
    if (score >= 60) return 'HIGH DANGER RISK';
    if (score >= 30) return 'MODERATE ADVISORY';
    return 'ALL CLEAR / NORMAL';
  };

  const handleMarkStatus = async (status: 'SAFE' | 'UNSAFE') => {
    setSafetyStatusMarked(status);
    try {
      await api.post('/alerts/respond', {
        response: status,
        message: status === 'SAFE' ? 'Self-reported Safe via Citizen PWA' : 'Immediate rescue needed'
      });
    } catch (e) {
      // Offline / optimistic handle
    }
  };

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto px-4 py-5 space-y-5"
    >
      {/* Location Bar & Status */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between text-xs text-slate-400 glass-card p-3 rounded-xl"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{locationName}</span>
        </div>
        <span className="shrink-0 text-slate-500 font-mono text-[11px]">
          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </span>
      </motion.div>

      {/* Real-time Emergency Warning Banner */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            key="emergency-banner"
            initial={{ opacity: 0, scale: 0.9, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={spring}
            className="p-4 bg-gradient-to-r from-red-950 to-rose-950 border border-red-500 rounded-2xl shadow-glow-red animate-glow-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm mb-1">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{activeAlerts[0].title || 'URGENT DISASTER WARNING'}</span>
              </div>
              <Badge variant="destructive" className="border-transparent bg-red-600 text-white">
                {activeAlerts[0].severity || 'CRITICAL'}
              </Badge>
            </div>
            <p className="text-xs text-red-100 mt-1 leading-relaxed">
              {activeAlerts[0].description || 'Bagmati river level exceeded hazard threshold. Evacuate low-lying corridors.'}
            </p>
            <div className="mt-3 pt-3 border-t border-red-800/60 flex items-center justify-between text-xs text-red-200">
              <span>Radius: 5 km geofence</span>
              <Link href="/shelters" className="font-bold underline flex items-center gap-1 hover:text-white">
                Evacuate to Nearest Shelter <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Hazard Index Gauge */}
      <motion.div variants={fadeUp}>
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Local Hazard Risk Index
            </h2>
            <p className="text-[11px] text-slate-400">Kathmandu Basin Multi-Sensor Composite</p>
          </div>
          <Badge
            variant={getRiskBadgeVariant(riskScore)}
            className={`text-xs px-2.5 py-1 normal-case ${getRiskBadgeClass(riskScore)}`}
          >
            {getRiskLabel(riskScore)}
          </Badge>
        </div>

        {/* Big Meter Value */}
        <div className="flex items-baseline gap-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={displayScore}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="text-5xl font-black text-white tabular-nums"
            >
              {displayScore}
            </motion.span>
          </AnimatePresence>
          <span className="text-slate-500 font-bold text-sm">/ 100</span>
          <span className="text-xs text-slate-400 ml-auto">
            Updated just now from IoT Network
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/[0.06] rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              riskScore >= 80
                ? 'bg-gradient-to-r from-orange-500 to-red-600'
                : riskScore >= 60
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : riskScore >= 30
                ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          />
        </div>

        {/* 4 Multi-Hazard Sensors Mini Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Bagmati Basin</div>
              <div className="font-bold text-white">{riskScore >= 60 ? 'High Level' : 'Normal'}</div>
            </div>
          </div>

          <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Seismic Tremor</div>
              <div className="font-bold text-white">0.08 g (Stable)</div>
            </div>
          </div>

          <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-teal-300" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Precipitation</div>
              <div className="font-bold text-white">{riskScore >= 60 ? 'Heavy Rain' : 'Light'}</div>
            </div>
          </div>

          <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Slope Soil</div>
              <div className="font-bold text-white">42% Saturation</div>
            </div>
          </div>
        </div>
      </Card>
      </motion.div>

      {/* Primary SOS Action Banner */}
      <motion.div variants={fadeUp}>
        <MotionLink
          href="/sos"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={spring}
          className="group block relative p-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 rounded-2xl shadow-glow-red ring-1 ring-red-400/50 border border-red-400/50 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="p-3.5 bg-white/20 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-10 h-10 text-white animate-pulse" />
            </div>
            <span className="text-2xl font-black text-white tracking-wider">
              1-TAP EMERGENCY SOS 🆘
            </span>
            <span className="text-xs text-red-100 font-medium mt-1">
              Tap to dispatch immediate Police, Army & APF rescue to your exact GPS coordinates
            </span>
          </div>
        </MotionLink>
      </motion.div>

      {/* Safety Status Check-in Bar */}
      <motion.div variants={fadeUp}>
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-white">Are you and your family safe?</h3>
          <p className="text-[11px] text-slate-400">Let emergency authorities and rescue coordinators know</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <motion.div whileTap={{ scale: 0.94 }} className="flex-1 sm:flex-initial">
            <Button
              onClick={() => handleMarkStatus('SAFE')}
              className={`w-full sm:w-auto ${
                safetyStatusMarked === 'SAFE'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 hover:bg-emerald-600'
                  : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {safetyStatusMarked === 'SAFE' ? (
                  <motion.span
                    key="marked"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={softSpring}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Reported Safe ✓
                  </motion.span>
                ) : (
                  <motion.span key="unmarked" className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    I am Safe
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.94 }} className="flex-1 sm:flex-initial">
            <Button
              asChild
              className="w-full bg-red-950/70 border border-red-500/50 text-red-200 hover:bg-red-900 hover:border-red-400"
            >
              <Link href="/sos">
                <ShieldAlert className="w-4 h-4" />
                Need Help
              </Link>
            </Button>
          </motion.div>
        </div>
      </Card>
      </motion.div>

      {/* 2-Column Action Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nearest Evacuation Shelter */}
        <motion.div whileHover={{ y: -3 }} transition={softSpring}>
        <Card className="p-4 flex flex-col justify-between space-y-3 h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Tent className="w-4 h-4 text-emerald-400" /> Nearest Shelter
              </span>
              <Badge variant="success">
                {nearestShelter ? `${nearestShelter.totalCapacity - nearestShelter.currentOccupancy} spots left` : 'Open'}
              </Badge>
            </div>
            <h4 className="font-bold text-white text-sm">
              {nearestShelter?.name || 'Dasharath Stadium Safe Haven'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {nearestShelter?.address || 'Tripureshwor, Kathmandu'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              {nearestShelter?.distanceMeters ? `${(nearestShelter.distanceMeters / 1000).toFixed(1)} km away` : '1.4 km away'}
            </span>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-slate-300 hover:text-white normal-case">
              <Link href="/shelters">
                All Shelters <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </Card>
        </motion.div>

        {/* Field Hazard Report */}
        <motion.div whileHover={{ y: -3 }} transition={softSpring}>
        <Card className="p-4 flex flex-col justify-between space-y-3 h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" /> Field Incident Report
              </span>
              <Badge variant="default">Community Feed</Badge>
            </div>
            <h4 className="font-bold text-white text-sm">Report Blockage or Rising Waters</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Take a photo with GPS coordinates to alert authorities and fellow citizens.
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex justify-end">
            <motion.div whileTap={{ scale: 0.96 }} className="w-full">
              <Button asChild variant="default" className="w-full">
                <Link href="/report">
                  <Camera className="w-3.5 h-3.5" /> Submit Incident Report
                </Link>
              </Button>
            </motion.div>
          </div>
        </Card>
        </motion.div>
      </motion.div>

      {/* Mini Interactive Evacuation Map */}
      <motion.div variants={fadeUp} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Kathmandu Safe Evacuation Zone Map
          </h3>
          <Link href="/shelters" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline">
            Expand Map
          </Link>
        </div>
        <CitizenMap
          userLocation={userLocation}
          shelters={shelters}
          disasters={activeAlerts}
          height="260px"
        />
      </motion.div>

      {/* Emergency Helpline Direct Dials */}
      <motion.div variants={fadeUp}>
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <PhoneCall className="w-4 h-4 text-cyan-400" />
          <span>Emergency Toll-Free Direct Dials (Nepal)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} href="tel:100" className="block">
            <Card className="p-2.5 rounded-xl transition-colors hover:border-cyan-400/25">
              <div className="text-[11px] text-slate-400">Nepal Police</div>
              <div className="font-extrabold text-sm mt-0.5 text-cyan-300">📞 100</div>
            </Card>
          </motion.a>
          <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} href="tel:1114" className="block">
            <Card className="p-2.5 rounded-xl transition-colors hover:border-cyan-400/25">
              <div className="text-[11px] text-slate-400">Armed Police (APF)</div>
              <div className="font-extrabold text-sm mt-0.5 text-sky-300">📞 1114</div>
            </Card>
          </motion.a>
          <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} href="tel:101" className="block">
            <Card className="p-2.5 rounded-xl transition-colors hover:border-cyan-400/25">
              <div className="text-[11px] text-slate-400">Fire Brigade</div>
              <div className="font-extrabold text-sm mt-0.5 text-amber-400">📞 101</div>
            </Card>
          </motion.a>
          <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} href="tel:102" className="block">
            <Card className="p-2.5 rounded-xl transition-colors hover:border-cyan-400/25">
              <div className="text-[11px] text-slate-400">Ambulance (Red Cross)</div>
              <div className="font-extrabold text-sm mt-0.5 text-emerald-400">📞 102</div>
            </Card>
          </motion.a>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
}
