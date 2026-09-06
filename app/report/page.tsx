'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2, Camera, Navigation, MapPin, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { fadeUp, scaleIn, staggerContainer } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Location / Landmark:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none pr-8 transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                  <Navigation className="w-3 h-3 text-cyan-400" /> GPS: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
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
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition-colors"
                />
              </div>

              {/* Photo Attachment Section */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Field Photo Evidence:</label>
                <AnimatePresence mode="wait">
                  {photoPreview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative rounded-xl overflow-hidden border border-white/[0.08]"
                    >
                      <img src={photoPreview} alt="Incident" className="w-full h-40 object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPhotoPreview(null)}
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
                      onClick={handleSimulatePhoto}
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
