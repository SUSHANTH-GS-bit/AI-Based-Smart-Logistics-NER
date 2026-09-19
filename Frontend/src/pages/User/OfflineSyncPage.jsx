import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
  Navigation,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Plus,
} from 'lucide-react';

export function OfflineSyncPage() {
  const { isOnline, toggleNetworkSim, offlineSync, gps } = useApp();

  const handleSimulateOfflineRecord = () => {
    offlineSync.queueRecord({
      type: 'GPS_PING',
      vehicle_id: 'TRK-001',
      latitude: gps.latitude,
      longitude: gps.longitude,
      speed: gps.speed,
      note: 'Offline mountain location ping',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Offline GPS & Automatic Synchronization</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Guaranteed telemetry buffering during network blindspots across North Eastern mountain passes
          </p>
        </div>

        <button
          onClick={toggleNetworkSim}
          className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
            isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{isOnline ? 'Network Connected (Online)' : 'Network Disconnected (Offline)'}</span>
        </button>
      </div>

      {/* Top Telemetry Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <p className="text-slate-400 uppercase font-semibold text-[10px]">NETWORK STATUS</p>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'safe' : 'medium'}>{isOnline ? '🟢 ONLINE' : '🟠 OFFLINE MODE'}</Badge>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            {isOnline ? 'Connected to FastAPI Backend' : 'Offline queue active'}
          </p>
        </div>

        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <p className="text-slate-400 uppercase font-semibold text-[10px]">GPS HARDWARE FIX</p>
          <div className="flex items-center gap-2">
            <Badge variant={gps.gpsAvailable ? 'info' : 'critical'}>
              {gps.gpsAvailable ? '🔵 GPS ACTIVE' : '🔴 GPS UNAVAILABLE'}
            </Badge>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">Acc: ±{gps.accuracy}m | Speed: {gps.speed} km/h</p>
        </div>

        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <p className="text-slate-400 uppercase font-semibold text-[10px]">QUEUED RECORDS</p>
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {offlineSync.pendingCount} Items Waiting
          </div>
          <p className="text-[10px] text-slate-500">Stored in IndexedDB / LocalStorage</p>
        </div>

        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <p className="text-slate-400 uppercase font-semibold text-[10px]">LAST SYNCHRONIZED</p>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {offlineSync.lastSyncTime}
          </div>
          <p className="text-[10px] text-slate-500">Auto-sync on reconnect</p>
        </div>
      </div>

      {/* Main Action & Queue Display */}
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              IndexedDB Local Queue Contents
            </h2>
            <p className="text-xs text-slate-400">
              Each record carries a unique client_record_id for duplicate-safe sync
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateOfflineRecord}
              className="px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Offline Location Ping</span>
            </button>

            <button
              onClick={offlineSync.triggerSync}
              disabled={offlineSync.pendingCount === 0 || offlineSync.isSyncing}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${offlineSync.isSyncing ? 'animate-spin' : ''}`} />
              <span>{offlineSync.isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Queue Table */}
        {offlineSync.pendingCount === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-slate-200">All Telemetry Data Synchronized</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              No offline records queued. When travelling through mountain passes without internet, new coordinates will buffer here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Client Record ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">GPS Coordinates</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                {offlineSync.syncQueue.map((item) => (
                  <tr key={item.client_record_id} className="hover:bg-dark-600/40">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{item.client_record_id}</td>
                    <td className="py-2.5 px-3">{item.type || 'GPS_PING'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.timestamp}</td>
                    <td className="py-2.5 px-3">{item.latitude}, {item.longitude}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="medium" size="sm">QUEUED LOCALLY</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
