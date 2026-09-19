import React, { useState } from 'react';
import { MapView } from '../../components/map/MapView';
import { MapLayerControl } from '../../components/map/MapLayerControl';
import { useApp } from '../../context/AppContext';
import { NER_CITIES } from '../../data/mockData';
import { Search, MapPin, Navigation, Sliders, Layers, WifiOff } from 'lucide-react';

export function LiveMapPage() {
  const { isOnline, offlineSync } = useApp();
  const [showLayers, setShowLayers] = useState(true);
  const [selectedCity, setSelectedCity] = useState(NER_CITIES[0]);

  return (
    <div className="relative h-[calc(100vh-100px)] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* City Quick Zoom Dropdown */}
        <div className="pointer-events-auto flex items-center gap-2 bg-dark-800/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-xl text-xs">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">Zoom City:</span>
          <select
            value={selectedCity.id}
            onChange={(e) => {
              const city = NER_CITIES.find((c) => c.id === e.target.value);
              if (city) setSelectedCity(city);
            }}
            className="bg-dark-700 text-slate-200 font-medium rounded px-2 py-1 border border-slate-700 focus:outline-none"
          >
            {NER_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.state})
              </option>
            ))}
          </select>
        </div>

        {/* Offline GIS Indicator */}
        {!isOnline && (
          <div className="pointer-events-auto bg-amber-950/90 backdrop-blur-md border border-amber-500/50 text-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>Offline GIS Mode • Cached Data (Last Sync: {offlineSync.lastSyncTime})</span>
          </div>
        )}

        {/* Toggle Layer Panel Button */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="pointer-events-auto bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>{showLayers ? 'Hide Layer Controls' : 'Show Layer Controls'}</span>
        </button>
      </div>

      {/* Floating Layer Control Overlay */}
      {showLayers && (
        <div className="absolute top-16 left-4 z-[400] pointer-events-auto max-h-[calc(100vh-220px)] overflow-y-auto">
          <MapLayerControl />
        </div>
      )}

      {/* Full-Screen Map Component */}
      <MapView center={[selectedCity.lat, selectedCity.lng]} zoom={9} height="h-full" />
    </div>
  );
}
