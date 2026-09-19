import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Settings, User, MapPin, Database, Bell, CheckCircle2, HardDrive } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function SettingsPage() {
  const { user } = useAuth();
  const { offlineSync } = useApp();

  const [name, setName] = useState(user?.name || 'Rajesh Sharma');
  const [email, setEmail] = useState(user?.email || 'operator@nerlogistics.in');
  const [phone, setPhone] = useState(user?.phone || '+91 98620 12345');
  const [language, setLanguage] = useState('English');
  const [gpsFreq, setGpsFreq] = useState('5s');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-extrabold text-white">Operator Profile & System Settings</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Configure telemetry sync rates, regional preferences, and offline cache</p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile preferences updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-dark-700/60 p-6 rounded-2xl border border-slate-700/80 space-y-5 text-xs">
        <h2 className="font-bold text-sm text-white border-b border-slate-700 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          User Account Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Preferred Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="English">English</option>
              <option value="Assamese">Assamese (অসমীয়া)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Manipuri">Manipuri (মৈতৈলোন্)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        <h2 className="font-bold text-sm text-white border-b border-slate-700 pb-2 pt-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          Offline Cache & Telemetry Config
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">GPS Update Interval</label>
            <select
              value={gpsFreq}
              onChange={(e) => setGpsFreq(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="2s">High Frequency (Every 2 seconds)</option>
              <option value="5s">Standard (Every 5 seconds)</option>
              <option value="15s">Power Saving (Every 15 seconds)</option>
            </select>
          </div>

          <div className="p-3 bg-dark-800 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200">IndexedDB Offline Queue</p>
              <p className="text-[10px] text-slate-400">{offlineSync.pendingCount} records buffered</p>
            </div>
            <button
              type="button"
              onClick={offlineSync.triggerSync}
              className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-semibold hover:bg-amber-900"
            >
              Sync Cache
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all mt-4"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}
