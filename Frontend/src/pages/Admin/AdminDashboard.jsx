import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_VEHICLES, MOCK_INCIDENTS, MOCK_GIS_DATASETS } from '../../data/mockData';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import {
  Shield,
  Truck,
  AlertTriangle,
  Activity,
  BrainCircuit,
  Database,
  WifiOff,
  Layers,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Command Center Header */}
      <div className="bg-gradient-to-r from-purple-950/80 via-dark-700 to-dark-800 p-5 lg:p-6 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              NER Logistics — Regional Operations Center
            </h1>
          </div>
          <p className="text-xs text-purple-300/80 font-medium">
            State-level Command & Control for 8 North Eastern States • Live GIS, GPS Telemetry & ML Safety Intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="lg">SYSTEM HEALTH: ONLINE</Badge>
        </div>
      </div>

      {/* 8 Regional Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="TOTAL FLEET VEHICLES"
          value={`${MOCK_VEHICLES.length} Vehicles`}
          subtitle="4 Moving • 1 Offline"
          icon={Truck}
          color="cyan"
          action={
            <button onClick={() => navigate('/admin/fleet')} className="text-cyan-400 hover:underline">
              Manage Fleet →
            </button>
          }
        />

        <DashboardCard
          title="ACTIVE REGIONAL INCIDENTS"
          value={`${MOCK_INCIDENTS.length} Incidents`}
          subtitle="2 High Severity • 1 Critical"
          icon={AlertTriangle}
          color="rose"
          action={
            <button onClick={() => navigate('/admin/incidents')} className="text-rose-400 hover:underline">
              Verify Incidents →
            </button>
          }
        />

        <DashboardCard
          title="AI ML PREDICTION ENGINE"
          value="MODEL ACTIVE"
          subtitle="RandomForest_NER_v2.4"
          icon={BrainCircuit}
          color="purple"
          action={
            <button onClick={() => navigate('/admin/ml-monitoring')} className="text-purple-400 hover:underline">
              Inspect AI Model →
            </button>
          }
        />

        <DashboardCard
          title="GIS DATASETS INDEXED"
          value="28,716 Records"
          subtitle="Roads, Bridges, Hospitals"
          icon={Database}
          color="emerald"
          action={
            <button onClick={() => navigate('/admin/gis-data')} className="text-emerald-400 hover:underline">
              View Datasets →
            </button>
          }
        />
      </div>

      {/* Main Map + Command Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Regional Operations Map */}
        <div className="lg:col-span-8 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="font-bold text-sm text-white">NER Regional Operations Map</h2>
            </div>
            <button onClick={() => navigate('/admin/map')} className="text-xs text-purple-400 hover:underline">
              Open Master Map →
            </button>
          </div>

          <MapView height="h-96" center={[25.8, 93.0]} zoom={7} />
        </div>

        {/* System & Audit Feed */}
        <div className="lg:col-span-4 bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-white border-b border-slate-700 pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              System Status & API Health
            </h2>

            <div className="space-y-3 text-xs pt-3">
              <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 flex items-center justify-between">
                <span>FastAPI Backend API:</span>
                <span className="text-emerald-400 font-bold font-mono">ONLINE (Port 8000)</span>
              </div>

              <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 flex items-center justify-between">
                <span>PostgreSQL Database:</span>
                <span className="text-emerald-400 font-bold font-mono">CONNECTED (5432)</span>
              </div>

              <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 flex items-center justify-between">
                <span>ML Inference Service:</span>
                <span className="text-emerald-400 font-bold font-mono">ACTIVE (48ms)</span>
              </div>

              <div className="p-3 rounded-xl bg-dark-800 border border-slate-700 flex items-center justify-between">
                <span>GIS Route Engine:</span>
                <span className="text-emerald-400 font-bold font-mono">READY</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/system-health')}
            className="w-full py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-500/40 transition-colors"
          >
            Open System Health Console →
          </button>
        </div>
      </div>
    </div>
  );
}
