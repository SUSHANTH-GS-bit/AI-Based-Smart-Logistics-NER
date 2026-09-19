import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mountain,
  Navigation,
  Shield,
  MapPin,
  Route,
  Radio,
  WifiOff,
  Hospital,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function LandingPage() {
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  const handleExploreUser = () => {
    switchRole('user');
    navigate('/user/dashboard');
  };

  const handleExploreAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Header Bar */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-950/50">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Mountain className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">NER Logistics</span>
            <p className="text-[10px] text-cyan-400 font-medium">Smart Accessibility & Risk Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExploreUser}
            className="text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
          >
            Operator Dashboard
          </button>
          <button
            onClick={handleExploreAdmin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/40 border border-purple-400/30 transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Admin Command HQ
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Hero Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI-POWERED PLATFORM FOR NORTH EASTERN INDIA
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Smarter Routes. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Safer Journeys.
            </span> <br />
            Stronger Connections.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Combining GIS spatial mapping, real-time GPS tracking, Machine Learning risk prediction, and offline-first data synchronization to safeguard transport and infrastructure across Assam, Meghalaya, Manipur, Nagaland, Mizoram, Tripura, Arunachal Pradesh, and Sikkim.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={handleExploreUser}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 border border-cyan-300/30 transition-all flex items-center gap-2 group"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/user/map')}
              className="px-6 py-3.5 rounded-xl bg-dark-700/80 hover:bg-dark-600 text-slate-200 font-bold text-sm border border-slate-700 shadow-xl transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>View Live Map</span>
            </button>
          </div>

          {/* Feature Highlight Pills */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Offline GPS Auto-Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ML Landslide Prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Accessibility Mapping</span>
            </div>
          </div>
        </div>

        {/* Right Hero Graphic Card */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-purple-600 opacity-30 blur-xl animate-pulse" />
          <div className="relative bg-dark-800/90 border border-slate-700 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">Live Regional Dispatch</span>
              </div>
              <Badge variant="high">HIGH RISK ZONE</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-700 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[10px]">ACTIVE ROUTE</p>
                  <p className="font-bold text-slate-200">Imphal → Guwahati Corridor</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px]">ESTIMATED TIME</p>
                  <p className="font-bold text-cyan-400">8h 45m (417 km)</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400 animate-bounce" />
                  <div>
                    <p className="font-bold">ML Risk Score: 72/100</p>
                    <p className="text-[10px] text-rose-300/80">Kohima-Imphal Landslide Alert</p>
                  </div>
                </div>
                <button
                  onClick={handleExploreUser}
                  className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-semibold text-[11px]"
                >
                  Reroute
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between text-amber-300">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-xs">Offline GPS Tracking</p>
                    <p className="text-[10px] text-amber-400/80">Queueing coordinates locally</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold">12 Records</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities Grid */}
      <section className="bg-dark-800/60 border-t border-slate-800 py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Engineered for North Eastern Terrain</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Addressing rugged mountain geography, monsoon disruptions, and intermittent connectivity across North East India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-dark-700/70 border border-slate-700/80 hover:border-cyan-500/50 transition-all space-y-3">
              <div className="p-3 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Route className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Smart Route Planning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates safer alternative paths considering landslide risk, road subsidence, and bridge capacities.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-dark-700/70 border border-slate-700/80 hover:border-cyan-500/50 transition-all space-y-3">
              <div className="p-3 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Offline GPS & Auto-Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Logs GPS trail and incident reports locally when internet drops out and auto-syncs when online.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-dark-700/70 border border-slate-700/80 hover:border-cyan-500/50 transition-all space-y-3">
              <div className="p-3 w-fit rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">ML Risk Prediction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Machine Learning models predict landslide and road disruption risk using rainfall and slope metrics.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-dark-700/70 border border-slate-700/80 hover:border-cyan-500/50 transition-all space-y-3">
              <div className="p-3 w-fit rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Hospital className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Accessibility Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Locates hospitals, fuel stations, warehouses, bridges, and settlements within 5km/10km/25km.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>NER Logistics — AI Smart Logistics & Accessibility Intelligence Platform for North Eastern Region</p>
        <p className="mt-1 text-[11px] text-slate-600">Assam • Meghalaya • Manipur • Nagaland • Mizoram • Tripura • Arunachal Pradesh • Sikkim</p>
      </footer>
    </div>
  );
}
