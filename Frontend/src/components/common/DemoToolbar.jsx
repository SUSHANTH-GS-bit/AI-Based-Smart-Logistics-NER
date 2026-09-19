import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Sliders, Wifi, WifiOff, Navigation, AlertTriangle, Shield, User, ChevronUp, ChevronDown } from 'lucide-react';

export function DemoToolbar() {
  const { isOnline, toggleNetworkSim, simulatedRisk, setSimulatedRisk } = useApp();
  const { role, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [gpsSim, setGpsSim] = useState(true);

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-50">
      {/* Expanded Controls Card */}
      {isOpen && (
        <div className="mb-2 p-3 bg-dark-700/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl w-72 text-xs space-y-2.5 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              DEMO / DEV CONTROLS
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
              PROTOTYPE MODE
            </span>
          </div>

          {/* Network Simulator */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Network Connection:</span>
            <button
              onClick={toggleNetworkSim}
              className={`px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          {/* Risk Prediction Simulator */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300">ML Risk Prediction:</span>
            <button
              onClick={() => setSimulatedRisk(simulatedRisk === 'HIGH' ? 'LOW' : 'HIGH')}
              className={`px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                simulatedRisk === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {simulatedRisk} RISK
            </button>
          </div>

          {/* GPS Hardware Simulator */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300">GPS Hardware:</span>
            <button
              onClick={() => setGpsSim(!gpsSim)}
              className={`px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                gpsSim ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Navigation className="w-3 h-3" />
              {gpsSim ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/80">
            <span className="text-slate-300">App Role:</span>
            <button
              onClick={() => switchRole(role === 'user' ? 'admin' : 'user')}
              className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold flex items-center gap-1 hover:bg-purple-900 transition-colors"
            >
              {role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {role === 'admin' ? 'Admin HQ' : 'Operator'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xl shadow-cyan-950/60 font-semibold text-xs border border-cyan-400/40 hover:scale-105 transition-transform"
      >
        <Sliders className="w-4 h-4 animate-spin-slow" />
        <span>Demo Controls</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
