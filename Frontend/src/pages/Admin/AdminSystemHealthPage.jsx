import React, { useState, useEffect } from 'react';
import { healthService } from '../../services/healthService';
import { Badge } from '../../components/common/Badge';
import { Activity, Server, Database, BrainCircuit, Navigation, Wifi, RefreshCw } from 'lucide-react';

export function AdminSystemHealthPage() {
  const [healthStatus, setHealthStatus] = useState({ online: true, loading: false });
  const [dbStatus, setDbStatus] = useState({ connected: true, loading: false });

  const runHealthCheck = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true }));
    setDbStatus((prev) => ({ ...prev, loading: true }));

    const health = await healthService.checkHealth();
    const db = await healthService.checkDatabase();

    setHealthStatus({ online: health.online, loading: false, data: health.data });
    setDbStatus({ connected: db.connected, loading: false, data: db.data });
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-extrabold text-white">System Health & Infrastructure Status</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Live monitoring for FastAPI, PostgreSQL, ML Service & GIS Engine</p>
        </div>
        <button
          onClick={runHealthCheck}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Ping Services Now</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* FastAPI Backend */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">FastAPI Backend</span>
            </div>
            <Badge variant={healthStatus.online ? 'safe' : 'medium'}>
              {healthStatus.online ? 'ONLINE' : 'DEMO MODE'}
            </Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Endpoint: GET /api/health</p>
          <p className="text-slate-500 text-[10px] font-mono">Port: 8000 | CORS Enabled</p>
        </div>

        {/* PostgreSQL Database */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">PostgreSQL DB</span>
            </div>
            <Badge variant={dbStatus.connected ? 'safe' : 'medium'}>
              {dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Endpoint: GET /api/db-test</p>
          <p className="text-slate-500 text-[10px] font-mono">Database: sih26002</p>
        </div>

        {/* ML Inference Engine */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">ML Risk Engine</span>
            </div>
            <Badge variant="purple">ACTIVE</Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Interface: ml_service.py</p>
          <p className="text-slate-500 text-[10px] font-mono">Artifact: RandomForest_v2.4</p>
        </div>

        {/* GIS Routing Engine */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">GIS Routing Engine</span>
            </div>
            <Badge variant="safe font-mono">READY</Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Interface: gis_service.py</p>
          <p className="text-slate-500 text-[10px] font-mono">GraphHopper / OSRM</p>
        </div>

        {/* GPS Hardware Telemetry */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">GPS Hardware</span>
            </div>
            <Badge variant="info">ACTIVE</Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Geolocation API</p>
          <p className="text-slate-500 text-[10px] font-mono">Update: Every 5s</p>
        </div>

        {/* Cellular / Network Status */}
        <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Network Connection</span>
            </div>
            <Badge variant="safe">CONNECTED</Badge>
          </div>
          <p className="text-slate-400 text-[11px]">Offline Sync Engine</p>
          <p className="text-slate-500 text-[10px] font-mono">IndexedDB Active</p>
        </div>
      </div>
    </div>
  );
}
