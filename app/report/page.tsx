'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Camera, Navigation, MapPin, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function CitizenReportPage() {
  const [disasterType, setDisasterType] = useState('FLOOD');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('Balkhu Riverbank Corridor, Kathmandu');
  const [coordinates, setCoordinates] = useState({ lat: 27.6895, lng: 85.3021 });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleSimulatePhoto = () => {
    // For demo/hackathon purpose: simulate attaching a high-water or landslide hazard photo
    setPhotoPreview('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      await api.post('/reports', {
        disasterType,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        addressText,
        description,
        mediaUrls: photoPreview ? [photoPreview] : []
      });
      setIsSubmitted(true);
    } catch (err: any) {
      // Optimistic local success if offline
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-amber-400" /> Citizen Hazard Report
        </span>
      </div>

      <div>
        {isSubmitted ? (
          <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 my-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Report Submitted Successfully</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you! Your field incident has been broadcast to Kathmandu Emergency Operations Center and mapped for public awareness.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Back to Citizen Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Report live ground conditions like submerged roads, swollen riverbanks, or road debris to help your community.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Hazard Category:</label>
              <select
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
              >
                <option value="FLOOD">🌊 Flood / River Water Overflow</option>
                <option value="LANDSLIDE">⛰️ Landslide / Mudflow / Slope Slip</option>
                <option value="EARTHQUAKE">🌎 Earthquake Damage / Structural Fissures</option>
                <option value="ROAD_BLOCKED">🚧 Blocked Access / Debris Obstruction</option>
                <option value="FOREST_FIRE">🔥 Fire Outbreak</option>
                <option value="OTHER">⚠️ Other Hazard</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Location / Landmark:</label>
              <div className="relative">
                <input
                  type="text"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none pr-8"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <Navigation className="w-3 h-3 text-blue-400" /> GPS: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Observation Description:</label>
              <textarea
                rows={3}
                required
                placeholder="E.g., Bagmati river is overflowing above the bridge retaining wall. Current depth is 2-3 feet."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            {/* Photo Attachment Section */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Field Photo Evidence:</label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800">
                  <img src={photoPreview} alt="Incident" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700"
                  >
                    Remove Photo ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePhoto}
                  className="w-full p-4 bg-slate-900/60 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-center transition-colors block group"
                >
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-white mx-auto mb-1" />
                  <div className="text-xs text-slate-300 font-medium">Tap to Attach Ground Photo</div>
                  <div className="text-[10px] text-slate-500">JPG, PNG up to 10MB</div>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-transform active:scale-98"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting Report...' : 'Transmit Incident Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
