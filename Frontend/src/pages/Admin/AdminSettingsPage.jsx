import React, { useState } from 'react';
import { Settings, Shield, Server, Database, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function AdminSettingsPage() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  const [demoMode, setDemoMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-extrabold text-white">Admin Command Settings</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Configure API gateway endpoints, fallback demo triggers, and GIS layers</p>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Admin configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-dark-700/60 p-6 rounded-2xl border border-slate-700 space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">FastAPI Backend API Base URL</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 font-mono focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="p-3 bg-dark-800 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-200">Demo Fallback Mode</p>
            <p className="text-[10px] text-slate-400">Uses mock telemetry when backend is unreachable</p>
          </div>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1 rounded font-semibold ${demoMode ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-dark-700 text-slate-400 border border-slate-700'}`}
          >
            {demoMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all mt-2"
        >
          Save Admin Configuration
        </button>
      </form>
    </div>
  );
}
