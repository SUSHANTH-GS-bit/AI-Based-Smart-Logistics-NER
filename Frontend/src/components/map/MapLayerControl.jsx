import React from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, Eye, EyeOff } from 'lucide-react';

export function MapLayerControl() {
  const { mapLayers, toggleLayer } = useApp();

  const layersList = [
    { key: 'vehicles', label: 'Logistics Vehicles', icon: '🚚', color: 'text-cyan-400' },
    { key: 'incidents', label: 'Active Incidents', icon: '⚠️', color: 'text-rose-400' },
    { key: 'riskZones', label: 'ML Risk Zones', icon: '⛰️', color: 'text-amber-400' },
    { key: 'hospitals', label: 'Hospitals & Medical', icon: '🏥', color: 'text-emerald-400' },
    { key: 'warehouses', label: 'Warehouses & Cold Hubs', icon: '🏬', color: 'text-blue-400' },
    { key: 'fuelStations', label: 'Fuel Stations', icon: '⛽', color: 'text-purple-400' },
    { key: 'bridges', label: 'Bridges & Culverts', icon: '🌉', color: 'text-teal-400' },
    { key: 'settlements', label: 'Settlements & Shelters', icon: '🏘️', color: 'text-indigo-400' },
    { key: 'roads', label: 'Highways & Trunk Roads', icon: '🛣️', color: 'text-slate-400' },
    { key: 'junctions', label: 'Junction Checkpoints', icon: '🚦', color: 'text-yellow-400' },
  ];

  return (
    <div className="bg-dark-700/90 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 shadow-2xl w-64 text-xs space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          GIS LAYER CONTROLS
        </span>
        <span className="text-[10px] text-slate-400">Toggle ON/OFF</span>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {layersList.map((item) => {
          const isEnabled = mapLayers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => toggleLayer(item.key)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
                isEnabled
                  ? 'bg-dark-600/80 border-cyan-500/40 text-slate-200'
                  : 'bg-dark-800/40 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="font-medium text-[11px]">{item.label}</span>
              </div>
              {isEnabled ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
