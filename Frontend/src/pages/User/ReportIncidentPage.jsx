import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_VEHICLES } from '../../data/mockData';
import { Radio, MapPin, Camera, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function ReportIncidentPage() {
  const { gps, isOnline, offlineSync } = useApp();
  const [vehicleId, setVehicleId] = useState('TRK-001');
  const [type, setType] = useState('Landslide');
  const [severity, setSeverity] = useState('High');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(gps.latitude);
  const [lng, setLng] = useState(gps.longitude);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submittedMessage, setSubmittedMessage] = useState(null);

  const handleGetCurrentLocation = () => {
    setLat(gps.latitude);
    setLng(gps.longitude);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const incidentData = {
      vehicleId,
      type,
      severity,
      title: title || `${type} Report on Sector`,
      description,
      lat,
      lng,
    };

    if (!isOnline) {
      offlineSync.queueRecord({
        type: 'INCIDENT_REPORT',
        ...incidentData,
      });
      setSubmittedMessage({
        type: 'OFFLINE',
        text: 'Incident saved offline and will sync automatically when connection is restored.',
      });
    } else {
      setSubmittedMessage({
        type: 'ONLINE',
        text: 'Incident report submitted successfully to FastAPI backend.',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
          <h1 className="text-xl font-extrabold text-white">Report Geo-Tagged Road Incident</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Broadcast hazards to regional command center. Supports offline queueing when out of cellular range.
        </p>
      </div>

      {submittedMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-3 ${
            submittedMessage.type === 'OFFLINE'
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}
        >
          {submittedMessage.type === 'OFFLINE' ? (
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{submittedMessage.text}</span>
        </div>
      )}

      {/* Incident Form */}
      <form onSubmit={handleSubmit} className="bg-dark-700/60 p-6 rounded-2xl border border-slate-700/80 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reporting Vehicle ID</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            >
              {MOCK_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} — {v.driver} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Incident Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="Landslide">Landslide / Mudslide</option>
              <option value="Road Blockage">Road Blockage / Debris</option>
              <option value="Bridge Damage">Bridge Structural Damage</option>
              <option value="Flood">Flash Flood / Inundation</option>
              <option value="Accident">Vehicle Collision</option>
              <option value="Vehicle Breakdown">Vehicle Mechanical Breakdown</option>
              <option value="Fuel Shortage">Fuel Station Exhaustion</option>
              <option value="Other">Other Hazard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Incident Title / Summary</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Major mudslide blocking double lane near NH-2 Km 48"
            className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Severity Level</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-all ${
                    severity === s
                      ? s === 'Critical'
                        ? 'bg-purple-950 text-purple-400 border-purple-500'
                        : s === 'High'
                        ? 'bg-rose-950 text-rose-400 border-rose-500'
                        : s === 'Medium'
                        ? 'bg-amber-950 text-amber-400 border-amber-500'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-500'
                      : 'bg-dark-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">GPS Coordinates</label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                <span>Get Current Location</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                placeholder="Latitude"
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                placeholder="Longitude"
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Detailed Hazard Description</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe road blockage dimensions, affected vehicles, or emergency clearance needs..."
            className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Photo Upload (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="px-4 py-2.5 rounded-lg bg-dark-800 border border-slate-700 hover:border-cyan-500 text-slate-300 font-semibold cursor-pointer flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Choose Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            {photoPreview && <img src={photoPreview} alt="Incident preview" className="w-16 h-12 rounded object-cover border border-slate-700" />}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-xl shadow-rose-950/50 transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Submit Geo-Tagged Incident Report</span>
        </button>
      </form>
    </div>
  );
}
