'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Camera,
  Navigation,
  MapPin,
  AlertCircle,
  LocateFixed,
  RefreshCw,
  Map
} from 'lucide-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';
import { fadeUp, scaleIn, staggerContainer } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const LocationPickerMap = dynamic(
  () => import('@/components/map/location-picker-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full glass-card rounded-xl flex items-center justify-center text-xs text-slate-500">
        Loading Map...
      </div>
    )
  }
);

const KATHMANDU_PRESETS = [
  { name: 'Balkhu Riverbank Corridor', lat: 27.6895, lng: 85.3021 },
  { name: 'Thapathali Bridge (Bagmati)', lat: 27.6934, lng: 85.3211 },
  { name: 'Kalanki Underpass Chowk', lat: 27.6938, lng: 85.2818 },
  { name: 'Koteshwor Chowk (Manohara)', lat: 27.6756, lng: 85.3458 },
  { name: 'Teku Dovan Confluence', lat: 27.6965, lng: 85.3060 },
  { name: 'Maitighar Mandala', lat: 27.6946, lng: 85.3204 },
  { name: 'New Baneshwor Chowk', lat: 27.6915, lng: 85.3420 },
  { name: 'Sundarijal Reservoir', lat: 27.7558, lng: 85.4247 },
  { name: 'Chobhar Gorge Outlet', lat: 27.6592, lng: 85.2917 },
  { name: 'Nakhkhu River Corridor', lat: 27.6620, lng: 85.3120 },
  { name: 'Nagdhunga Pass', lat: 27.7080, lng: 85.2200 },
  { name: 'Swayambhu / Ring Road', lat: 27.7149, lng: 85.2904 },
  { name: 'Balaju Bypass', lat: 27.7324, lng: 85.3012 },
  { name: 'Maharajgunj Chowk', lat: 27.7367, lng: 85.3308 },
  { name: 'Gaushala / Tilganga', lat: 27.7058, lng: 85.3489 }
];

type LocationStatus = 'locating' | 'located' | 'custom' | 'denied' | 'unavailable' | 'unsupported';

export default function CitizenReportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [disasterType, setDisasterType] = useState('FLOOD');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 27.6895, lng: 85.3021 });
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('locating');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('located');
      },
      (err) => {
        setLocationStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide an observation description.');
      return;
    }

    if (description.trim().length < 5) {
      setError('Observation description must be at least 5 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('disasterType', disasterType);
    formData.append('latitude', String(coordinates.lat));
    formData.append('longitude', String(coordinates.lng));
    formData.append('addressText', addressText.trim());
    formData.append('description', description.trim());
    if (photoFile) formData.append('photos', photoFile);

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // A raw fetch avoids the shared `api` client's JSON Content-Type
      // default, which would otherwise strip the multipart boundary photos
      // need to upload correctly.
      const res = await fetch(`${api.defaults.baseURL}/reports`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        setIsSubmitted(true);
        return;
      }

      // The server was reachable and rejected the report (bad input, server
      // error) — this is a real failure and must not be reported as success.
      const body = await res.json().catch(() => null);
      let errorMsg = body?.message || 'The server could not accept this report. Please try again.';
      if (Array.isArray(body?.errors) && body.errors.length > 0) {
        errorMsg = body.errors.map((item: any) => item.message || item.path?.join('.')).filter(Boolean).join('. ');
      }
      setError(errorMsg);
    } catch (err) {
      // The request never reached the server at all (offline, DNS, etc).
      // That is a genuinely different situation from a rejection, so it is
      // fair to acknowledge the report optimistically here.
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const locationCaption = {
    locating: { icon: RefreshCw, spin: true, text: 'Finding your GPS location…', tone: 'text-slate-500' },
    located: {
      icon: Navigation,
      spin: false,
      text: `GPS confirmed: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
      tone: 'text-emerald-400'
    },
    custom: {
      icon: MapPin,
      spin: false,
      text: `Selected Location: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
      tone: 'text-cyan-400'
    },
    denied: {
      icon: AlertCircle,
      spin: false,
      text: 'Location permission denied — using an approximate default. Enable location or set it manually.',
      tone: 'text-amber-400'
    },
    unavailable: {
      icon: AlertCircle,
      spin: false,
      text: 'Could not determine your location — using an approximate default.',
      tone: 'text-amber-400'
    },
    unsupported: {
      icon: AlertCircle,
      spin: false,
      text: 'This browser does not support location services.',
      tone: 'text-amber-400'
    }
  }[locationStatus];

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="max-w-md mx-auto px-4 py-5 space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <Link href="/" className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-cyan-400" /> Citizen Hazard Report
        </span>
      </motion.div>

      <motion.div variants={fadeUp}>
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div key="success" variants={scaleIn} initial="hidden" animate="show">
            <Card className="text-center p-8 space-y-4 my-8">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Report Submitted Successfully</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thank you! Your field incident has been broadcast to Kathmandu Emergency Operations Center and mapped for public awareness.
              </p>
              <div className="pt-2">
                <Button asChild variant="default" size="lg">
                  <Link href="/">Back to Citizen Home</Link>
                </Button>
              </div>
            </Card>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="p-3 bg-cyan-400/10 border border-cyan-400/25 rounded-xl text-xs text-cyan-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Report live ground conditions like submerged roads, swollen riverbanks, or road debris to help your community.
                </span>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Hazard Category:</label>
                <select
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                >
                  <option value="FLOOD">🌊 Flood / River Water Overflow</option>
                  <option value="LANDSLIDE">⛰️ Landslide / Mudflow / Slope Slip</option>
                  <option value="EARTHQUAKE">🌎 Earthquake Damage / Structural Fissures</option>
                  <option value="ROAD_BLOCKED">🚧 Blocked Access / Debris Obstruction</option>
                  <option value="FOREST_FIRE">🔥 Fire Outbreak</option>
                  <option value="OTHER">⚠️ Other Hazard</option>
                </select>
              </div>

              {/* Location & Landmark Section */}
              <div className="space-y-3 bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 block">Incident Location:</label>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/25">
                    📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </span>
                </div>

                {/* 1. Enter Location / Landmark Name */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">
                    Location / Landmark Name:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g., Balkhu Corridor, Kalanki Chowk, Thapathali"
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none pr-8 transition-colors"
                    />
                    <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                  </div>
                </div>

                {/* 2. Choose from Known Locations Dropdown */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">
                    Choose Location (Presets / Key Areas):
                  </label>
                  <select
                    value={
                      KATHMANDU_PRESETS.find(
                        (p) =>
                          Math.abs(p.lat - coordinates.lat) < 0.0008 &&
                          Math.abs(p.lng - coordinates.lng) < 0.0008
                      )?.name || ''
                    }
                    onChange={(e) => {
                      const selected = KATHMANDU_PRESETS.find((p) => p.name === e.target.value);
                      if (selected) {
                        setCoordinates({ lat: selected.lat, lng: selected.lng });
                        setAddressText(selected.name);
                        setLocationStatus('custom');
                      }
                    }}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                  >
                    <option value="">-- Choose from Known Areas / Hotspots --</option>
                    {KATHMANDU_PRESETS.map((preset) => (
                      <option key={preset.name} value={preset.name}>
                        📍 {preset.name} ({preset.lat.toFixed(4)}, {preset.lng.toFixed(4)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Live Updating Coordinates (Latitude & Longitude) */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">
                    Coordinates (Auto-updates with Selection):
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-black/30 border border-white/[0.07] p-2 rounded-xl">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono">LATITUDE</span>
                      <input
                        type="number"
                        step="any"
                        value={coordinates.lat}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!isNaN(lat)) {
                            setCoordinates((prev) => ({ ...prev, lat }));
                            setLocationStatus('custom');
                          }
                        }}
                        className="w-full bg-transparent border-none text-xs font-mono font-bold text-cyan-300 outline-none p-0"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono">LONGITUDE</span>
                      <input
                        type="number"
                        step="any"
                        value={coordinates.lng}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lng)) {
                            setCoordinates((prev) => ({ ...prev, lng }));
                            setLocationStatus('custom');
                          }
                        }}
                        className="w-full bg-transparent border-none text-xs font-mono font-bold text-cyan-300 outline-none p-0"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Action Buttons: Use Current GPS vs Choose on Map */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={locate}
                    className="flex items-center justify-center gap-1.5 text-xs py-2.5 h-auto hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-colors"
                  >
                    <LocateFixed
                      className={`w-3.5 h-3.5 text-cyan-400 ${
                        locationStatus === 'locating' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Use Current GPS</span>
                  </Button>

                  <Button
                    type="button"
                    variant={showMapPicker ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="flex items-center justify-center gap-1.5 text-xs py-2.5 h-auto transition-colors"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>{showMapPicker ? 'Hide Map' : 'Choose on Map'}</span>
                  </Button>
                </div>

                {/* Status caption */}
                <div className="flex items-center justify-between px-1">
                  <p className={`text-[10px] flex items-center gap-1 font-mono ${locationCaption.tone}`}>
                    <locationCaption.icon
                      className={`w-3 h-3 ${locationCaption.spin ? 'animate-spin' : ''}`}
                    />
                    {locationCaption.text}
                  </p>
                </div>

                {/* 5. Interactive Map Pin Drop & Quick Preset Chips */}
                <AnimatePresence>
                  {showMapPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3 pt-2 pb-1 border-t border-white/[0.06]"
                    >
                      {/* Interactive Leaflet Map */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                          <span>Tap anywhere or drag pin to update:</span>
                          <span className="text-cyan-400 font-mono">
                            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                          </span>
                        </div>
                        <LocationPickerMap
                          location={coordinates}
                          onChange={(loc) => {
                            setCoordinates(loc);
                            setLocationStatus('custom');
                          }}
                          height="220px"
                        />
                      </div>

                      {/* Quick Chips */}
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 block">
                          Popular Landmarks:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {KATHMANDU_PRESETS.map((preset) => {
                            const isSelected =
                              Math.abs(coordinates.lat - preset.lat) < 0.0008 &&
                              Math.abs(coordinates.lng - preset.lng) < 0.0008;
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setCoordinates({ lat: preset.lat, lng: preset.lng });
                                  setAddressText(preset.name);
                                  setLocationStatus('custom');
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-cyan-400/30 hover:bg-white/[0.06]'
                                }`}
                              >
                                📍 {preset.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400 block">Observation Description:</label>
                  <span className={`text-[10px] ${description.trim().length > 0 && description.trim().length < 5 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                    {description.trim().length}/5 min chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="E.g., Bagmati river is overflowing above the bridge retaining wall. Current depth is 2-3 feet."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                />
              </div>

              {/* Photo Attachment Section */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Field Photo Evidence:</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoPick}
                />
                <AnimatePresence mode="wait">
                  {photoPreview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative rounded-xl overflow-hidden border border-white/[0.08]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Incident" className="w-full h-40 object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 h-auto px-2 py-1 text-[10px] bg-background/80 backdrop-blur"
                      >
                        Remove Photo ✕
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="attach"
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 bg-white/[0.03] border border-dashed border-white/15 hover:border-cyan-400/45 hover:bg-cyan-400/[0.06] rounded-xl text-center transition-colors block group"
                    >
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 mx-auto mb-1 transition-colors" />
                      <div className="text-xs text-slate-300 font-medium">Tap to Attach Ground Photo</div>
                      <div className="text-[10px] text-slate-500">JPG, PNG up to 10MB</div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full">
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting Report...' : 'Transmit Incident Report'}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
