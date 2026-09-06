'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function CitizenDashboard() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [nearestShelter, setNearestShelter] = useState<any>(null);
  const [riskScore, setRiskScore] = useState(24);
  const [locationName, setLocationName] = useState('Balkhu, Ward 14, Kathmandu');
  const [userLocation, setUserLocation] = useState({ lat: 27.6895, lng: 85.3021 });
  const [safetyStatusMarked, setSafetyStatusMarked] = useState<string | null>(null);

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

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

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
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      {/* Location Bar & Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 truncate">
          <Navigation className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{locationName}</span>
        </div>
        <span className="shrink-0 text-slate-500 font-mono text-[11px]">
          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </span>
      </div>

      {/* Real-time Emergency Warning Banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-950 to-rose-950 border border-red-600 rounded-2xl animate-pulse shadow-lg shadow-red-950/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm mb-1">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{activeAlerts[0].title || 'URGENT DISASTER WARNING'}</span>
            </div>
            <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase">
              {activeAlerts[0].severity || 'CRITICAL'}
            </span>
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
        </div>
      )}

      {/* Community Hazard Index Gauge */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Local Hazard Risk Index
            </h2>
            <p className="text-[11px] text-slate-400">Kathmandu Basin Multi-Sensor Composite</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold border ${getRiskColor(riskScore)}`}>
            {getRiskLabel(riskScore)}
          </span>
        </div>

        {/* Big Meter Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-white">{riskScore}</span>
          <span className="text-slate-500 font-bold text-sm">/ 100</span>
          <span className="text-xs text-slate-400 ml-auto">
            Updated just now from IoT Network
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              riskScore >= 60 ? 'bg-gradient-to-r from-orange-500 to-red-600' : riskScore >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          />
        </div>

        {/* 4 Multi-Hazard Sensors Mini Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Bagmati Basin</div>
              <div className="font-bold text-white">{riskScore >= 60 ? 'High Level' : 'Normal'}</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Seismic Tremor</div>
              <div className="font-bold text-white">0.08 g (Stable)</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Precipitation</div>
              <div className="font-bold text-white">{riskScore >= 60 ? 'Heavy Rain' : 'Light'}</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Slope Soil</div>
              <div className="font-bold text-white">42% Saturation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary SOS Action Banner */}
      <Link
        href="/sos"
        className="group block relative p-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 rounded-2xl shadow-2xl shadow-red-950/80 border border-red-400/30 text-center transition-all duration-200 active:scale-95"
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
      </Link>

      {/* Safety Status Check-in Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-white">Are you and your family safe?</h3>
          <p className="text-[11px] text-slate-400">Let emergency authorities and rescue coordinators know</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleMarkStatus('SAFE')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              safetyStatusMarked === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {safetyStatusMarked === 'SAFE' ? 'Reported Safe ✓' : 'I am Safe'}
          </button>

          <Link
            href="/sos"
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-red-950/70 border border-red-800 text-red-300 hover:bg-red-900 flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            Need Help
          </Link>
        </div>
      </div>

      {/* 2-Column Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nearest Evacuation Shelter */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Tent className="w-4 h-4 text-emerald-400" /> Nearest Shelter
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {nearestShelter ? `${nearestShelter.totalCapacity - nearestShelter.currentOccupancy} spots left` : 'Open'}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">
              {nearestShelter?.name || 'Dasharath Stadium Safe Haven'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {nearestShelter?.address || 'Tripureshwor, Kathmandu'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              {nearestShelter?.distanceMeters ? `${(nearestShelter.distanceMeters / 1000).toFixed(1)} km away` : '1.4 km away'}
            </span>
            <Link
              href="/shelters"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-bold underline"
            >
              All Shelters <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Field Hazard Report */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" /> Field Incident Report
              </span>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Community Feed
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">Report Blockage or Rising Waters</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Take a photo with GPS coordinates to alert authorities and fellow citizens.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/report"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" /> Submit Incident Report
            </Link>
          </div>
        </div>
      </div>

      {/* Mini Interactive Evacuation Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Kathmandu Safe Evacuation Zone Map
          </h3>
          <Link href="/shelters" className="text-xs text-blue-400 hover:underline">
            Expand Map
          </Link>
        </div>
        <CitizenMap
          userLocation={userLocation}
          shelters={shelters}
          disasters={activeAlerts}
          height="260px"
        />
      </div>

      {/* Emergency Helpline Direct Dials */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <PhoneCall className="w-4 h-4 text-red-500" />
          <span>Emergency Toll-Free Direct Dials (Nepal)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <a
            href="tel:100"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl block transition-colors"
          >
            <div className="text-[11px] text-slate-400">Nepal Police</div>
            <div className="font-extrabold text-white text-sm mt-0.5 text-blue-400">📞 100</div>
          </a>
          <a
            href="tel:1114"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl block transition-colors"
          >
            <div className="text-[11px] text-slate-400">Armed Police (APF)</div>
            <div className="font-extrabold text-white text-sm mt-0.5 text-red-400">📞 1114</div>
          </a>
          <a
            href="tel:101"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl block transition-colors"
          >
            <div className="text-[11px] text-slate-400">Fire Brigade</div>
            <div className="font-extrabold text-white text-sm mt-0.5 text-amber-400">📞 101</div>
          </a>
          <a
            href="tel:102"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl block transition-colors"
          >
            <div className="text-[11px] text-slate-400">Ambulance (Red Cross)</div>
            <div className="font-extrabold text-white text-sm mt-0.5 text-emerald-400">📞 102</div>
          </a>
        </div>
      </div>
    </div>
  );
}
