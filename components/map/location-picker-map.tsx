'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface LocationPickerMapProps {
  location: { lat: number; lng: number };
  onChange: (loc: { lat: number; lng: number }) => void;
  height?: string;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function RecenterHandler({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1], map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const pinIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: linear-gradient(135deg, #06b6d4, #0d9488);
      transform: rotate(-45deg);
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: -14px;
      margin-top: -28px;
      cursor: grab;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #020617;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

export default function LocationPickerMap({
  location,
  onChange,
  height = '220px'
}: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker) {
          const pos = marker.getLatLng();
          onChange({ lat: pos.lat, lng: pos.lng });
        }
      }
    }),
    [onChange]
  );

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full glass-card rounded-xl flex items-center justify-center text-xs text-slate-500"
      >
        Loading Map...
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-cyan-400/20 relative shadow-inner z-0"
    >
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapResizeHandler />
        <MapClickHandler onSelect={(lat, lng) => onChange({ lat, lng })} />
        <RecenterHandler center={[location.lat, location.lng]} />
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={[location.lat, location.lng]}
          icon={pinIcon}
        />
      </MapContainer>

      <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none flex items-center justify-between">
        <div className="bg-slate-950/85 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-cyan-300 font-mono shadow-md">
          📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </div>
        <div className="bg-slate-950/85 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 shadow-md">
          Tap or drag pin
        </div>
      </div>
    </div>
  );
}
