import React from 'react';
import { MOCK_VEHICLES } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Truck, Shield, Search, Sliders } from 'lucide-react';

export function AdminFleetPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-extrabold text-white">Admin Regional Fleet Oversight</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Monitor transport operators, active routes, and telemetry logs</p>
        </div>
        <Badge variant="purple">FLEET: {MOCK_VEHICLES.length} VEHICLES</Badge>
      </div>

      <div className="bg-dark-700/60 rounded-2xl border border-slate-700/80 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 uppercase text-[10px]">
              <th className="p-3">Vehicle & Driver</th>
              <th className="p-3">Cargo</th>
              <th className="p-3">Sector</th>
              <th className="p-3">Telemetry</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
            {MOCK_VEHICLES.map((v) => (
              <tr key={v.id} className="hover:bg-dark-600/50">
                <td className="p-3">
                  <p className="font-bold text-cyan-400">{v.id}</p>
                  <p className="text-slate-400 text-[10px]">{v.driver} • {v.phone}</p>
                </td>
                <td className="p-3">{v.cargoType}</td>
                <td className="p-3">{v.route}</td>
                <td className="p-3 font-mono">{v.speed} km/h | {v.signal}</td>
                <td className="p-3">
                  <Badge variant={v.status === 'Moving' ? 'safe' : v.status === 'Delayed' ? 'medium' : 'high'}>
                    {v.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <button className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                    Inspect Telemetry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
