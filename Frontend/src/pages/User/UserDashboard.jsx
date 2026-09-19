import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MOCK_VEHICLES, MOCK_INCIDENTS, MOCK_FACILITIES } from '../../data/mockData';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import {
  Truck,
  Route,
  AlertTriangle,
  Hospital,
  Activity,
  ArrowRight,
  ShieldAlert,
  Radio,
  Clock,
  CloudUpload,
  Layers,
} from 'lucide-react';

export function UserDashboard() {
  const navigate = useNavigate();
  const { simulatedRisk, offlineSync } = useApp();
  const activeVehicle = MOCK_VEHICLES[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            NER Operator Dispatch Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Logistics Telemetry & Accessibility Intelligence across North Eastern Region
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/user/routes')}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Route className="w-4 h-4" />
            <span>Plan Route & Risk</span>
          </button>
          <button
            onClick={() => navigate('/user/report-incident')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Radio className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Vehicle Card */}
        <DashboardCard
          title="ACTIVE VEHICLE"
          value={activeVehicle.id}
          subtitle={`${activeVehicle.type} • ${activeVehicle.speed} km/h`}
          icon={Truck}
          color="cyan"
          trend="Moving • Assam → Guwahati"
          action={
            <button onClick={() => navigate('/user/vehicles')} className="text-cyan-400 hover:underline">
              Track Fleet →
            </button>
          }
        />

        {/* Current Route Card */}
        <DashboardCard
          title="CURRENT ROUTE"
          value={activeVehicle.route}
          subtitle="Distance: 417 km • ETA: 8h 45m"
          icon={Route}
          color="emerald"
          trend={`Risk Level: ${simulatedRisk}`}
          action={
            <button onClick={() => navigate('/user/routes')} className="text-emerald-400 hover:underline">
              Analyze Risk →
            </button>
          }
        />

        {/* Regional Risk Summary Card */}
        <DashboardCard
          title="REGIONAL RISK LEVEL"
          value={simulatedRisk === 'HIGH' ? '72 / 100 (HIGH)' : '28 / 100 (LOW)'}
          subtitle="Kohima-Imphal Hill Sector"
          icon={Activity}
          color={simulatedRisk === 'HIGH' ? 'amber' : 'emerald'}
          trend="ML Prediction Active"
          action={
            <button onClick={() => navigate('/user/analytics')} className="text-amber-400 hover:underline">
              View Model →
            </button>
          }
        />

        {/* Active Incidents Card */}
        <DashboardCard
          title="ACTIVE INCIDENTS"
          value={`${MOCK_INCIDENTS.length} Incidents`}
          subtitle="2 Landslides • 1 Bridge Damage"
          icon={AlertTriangle}
          color="rose"
          trend="2 Critical Sectors"
          action={
            <button onClick={() => navigate('/user/incidents')} className="text-rose-400 hover:underline">
              View Feed →
            </button>
          }
        />
      </div>

      {/* Middle Grid: Live Map Widget + Recent Incidents Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live GIS Map Widget */}
        <div className="lg:col-span-8 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm text-white">Live Regional Dispatch Map</h2>
            </div>
            <button
              onClick={() => navigate('/user/map')}
              className="text-xs text-cyan-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>Full Screen GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapView height="h-80" />
        </div>

        {/* Recent Incidents Sidebar Panel */}
        <div className="lg:col-span-4 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Active Incident Alerts
              </span>
              <span className="text-[10px] text-slate-400">Live Telemetry</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {MOCK_INCIDENTS.slice(0, 3).map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl bg-dark-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{inc.title}</span>
                    <Badge variant={inc.severity.toLowerCase()} size="sm">{inc.severity}</Badge>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{inc.description}</p>
                  <p className="text-slate-500 text-[10px] font-mono mt-1">{inc.location}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/user/incidents')}
            className="w-full py-2 rounded-xl bg-dark-600 hover:bg-dark-500 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            View All Incident Reports ({MOCK_INCIDENTS.length})
          </button>
        </div>
      </div>

      {/* Bottom Grid: Nearby Accessibility Intelligence + Offline Queue Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nearby Facilities Counter Card */}
        <div className="lg:col-span-8 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-sm text-white flex items-center gap-1.5">
              <Hospital className="w-4 h-4 text-emerald-400" />
              Nearby Accessibility Intelligence (Within 10 km)
            </span>
            <button onClick={() => navigate('/user/accessibility')} className="text-xs text-cyan-400 hover:underline">
              View All Facilities →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 text-center">
              <span className="text-xl font-extrabold text-emerald-400">3</span>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">Hospitals</p>
              <p className="text-[10px] text-slate-500">Trauma Ready</p>
            </div>

            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 text-center">
              <span className="text-xl font-extrabold text-purple-400">7</span>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">Fuel Stations</p>
              <p className="text-[10px] text-slate-500">Diesel Stocked</p>
            </div>

            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 text-center">
              <span className="text-xl font-extrabold text-blue-400">4</span>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">Warehouses</p>
              <p className="text-[10px] text-slate-500">Cold Chain</p>
            </div>

            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 text-center">
              <span className="text-xl font-extrabold text-teal-400">12</span>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">Bridges</p>
              <p className="text-[10px] text-slate-500">Capacity Rated</p>
            </div>

            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 text-center col-span-2 sm:col-span-1">
              <span className="text-xl font-extrabold text-indigo-400">18</span>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">Settlements</p>
              <p className="text-[10px] text-slate-500">Shelters</p>
            </div>
          </div>
        </div>

        {/* Offline Queue Sync Card */}
        <div className="lg:col-span-4 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-amber-400" />
                Offline Storage & Sync
              </span>
              <Badge variant={offlineSync.pendingCount > 0 ? 'medium' : 'safe'}>
                {offlineSync.pendingCount > 0 ? `${offlineSync.pendingCount} QUEUED` : 'SYNCED'}
              </Badge>
            </div>

            <div className="text-xs text-slate-300 space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span>GPS Location Queue:</span>
                <span className="font-mono text-cyan-400">IndexedDB Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Synchronized:</span>
                <span className="font-mono text-slate-400">{offlineSync.lastSyncTime}</span>
              </div>
              <p className="text-[11px] text-slate-400 bg-dark-800 p-2 rounded-lg border border-slate-700">
                Coordinates & reports automatically buffer when traversing internet blindspots in mountain sectors.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/user/routes')}
            className="w-full py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 font-semibold text-xs border border-amber-800 transition-colors"
          >
            Manage Offline Sync Queue →
          </button>
        </div>
      </div>
    </div>
  );
}
