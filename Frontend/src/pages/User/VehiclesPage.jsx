import React, { useState } from 'react';
import { MOCK_VEHICLES } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import { Truck, Navigation, Phone, Shield, MapPin, Clock, Signal, BatteryCharging, X } from 'lucide-react';

export function VehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Logistics Fleet Tracking</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GPS positions, speed telemetry, and cargo status across North Eastern states
          </p>
        </div>

        <Badge variant="info">FLEET SIZE: {MOCK_VEHICLES.length} VEHICLES</Badge>
      </div>

      {/* Vehicles Table / Cards */}
      <div className="bg-dark-700/60 rounded-2xl border border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800/80 border-b border-slate-700 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Vehicle ID & Driver</th>
                <th className="py-3 px-4">Type & Cargo</th>
                <th className="py-3 px-4">Current Sector</th>
                <th className="py-3 px-4">Speed & Signal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {MOCK_VEHICLES.map((v) => (
                <tr key={v.id} className="hover:bg-dark-600/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-cyan-400 text-sm">{v.id}</p>
                    <p className="text-slate-400 text-[11px]">{v.driver} • {v.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold">{v.type}</p>
                    <p className="text-slate-400 text-[11px]">{v.cargoType}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-300">{v.locationName}</p>
                    <p className="text-slate-500 text-[10px]">{v.route}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-slate-200">{v.speed} km/h</p>
                    <p className="text-slate-400 text-[10px]">{v.signal} • Battery {v.battery}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        v.status === 'Moving'
                          ? 'safe'
                          : v.status === 'Delayed'
                          ? 'medium'
                          : v.status === 'Stopped'
                          ? 'high'
                          : 'neutral'
                      }
                    >
                      {v.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedVehicle(v)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-colors"
                    >
                      Track Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedVehicle.id}</h2>
                  <Badge variant={selectedVehicle.riskLevel.toLowerCase()}>{selectedVehicle.status}</Badge>
                </div>
                <p className="text-xs text-slate-400">{selectedVehicle.driver} ({selectedVehicle.phone})</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-dark-700 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">CARGO TYPE</span>
                <span className="font-bold text-slate-200">{selectedVehicle.cargoType}</span>
              </div>
              <div className="p-3 bg-dark-700 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">ROUTE SECTOR</span>
                <span className="font-bold text-slate-200">{selectedVehicle.route}</span>
              </div>
            </div>

            {/* Mini Map View */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-300">Live GPS Location & Trail</span>
              <MapView height="h-48" selectedVehicle={selectedVehicle} center={[selectedVehicle.lat, selectedVehicle.lng]} zoom={10} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
