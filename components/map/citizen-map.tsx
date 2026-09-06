'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface CitizenMapProps {
  userLocation?: { lat: number; lng: number };
  shelters?: any[];
  disasters?: any[];
  height?: string;
}

export default function CitizenMap({
  userLocation = { lat: 27.6895, lng: 85.3021 }, // Default Kathmandu Balkhu
  shelters = [],
  disasters = [],
  height = '350px'
}: CitizenMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      setMounted(true);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        style={{ height }}
        className="w-full glass-card rounded-2xl flex items-center justify-center text-slate-500 text-xs"
      >
        Loading Evacuation Map...
      </motion.div>
    );
  }

  const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #22d3ee;
        border: 3px solid #ffffff;
        box-shadow: 0 0 14px rgba(34, 211, 238, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
      ">
        📍
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const shelterIcon = L.divIcon({
    className: 'custom-shelter-icon',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #10b981;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        🏕️
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-cyan-400/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_0_24px_-16px_rgba(34,211,238,0.7),0_8px_30px_-12px_rgba(0,0,0,0.6)] relative z-0"
    >
      {/* @ts-ignore */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        {/* Dark CartoDB Matter Tile Layer */}
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Marker */}
        {/* @ts-ignore */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          {/* @ts-ignore */}
          <Popup className="custom-popup">
            <div className="p-1 text-slate-100 font-sans">
              <strong className="block text-xs font-bold text-cyan-300">Your Detected Location</strong>
              <p className="text-[11px] text-slate-400">Kathmandu Basin</p>
            </div>
          </Popup>
        </Marker>

        {/* Shelters */}
        {shelters.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={shelterIcon}>
            <Popup className="custom-popup">
              <div className="p-1 text-slate-100 font-sans">
                <strong className="block text-xs font-bold text-emerald-300">{s.name}</strong>
                <p className="text-[11px] text-slate-400">{s.address}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span>Capacity: {s.currentOccupancy}/{s.totalCapacity}</span>
                  {s.hasMedicalFacility && <span>• 🏥 Medical</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Danger Zones / Disasters */}
        {disasters.map((d) => (
          <Circle
            key={d.id}
            center={[d.latitude, d.longitude]}
            radius={d.radiusMeters || 3000}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '4, 8'
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-100 font-sans">
                <strong className="block text-xs font-bold text-red-400">⚠️ {d.title || d.type}</strong>
                <p className="text-[11px] text-slate-300">{d.description}</p>
                <span className="text-[10px] bg-red-500/20 border border-red-500/40 text-red-200 px-1.5 py-0.5 rounded font-bold">
                  Danger Radius: {((d.radiusMeters || 3000) / 1000).toFixed(1)} km
                </span>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </motion.div>
  );
}
