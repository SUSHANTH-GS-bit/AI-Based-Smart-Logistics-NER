import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NER_CITIES, MOCK_ML_PREDICTION } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import {
  Route,
  Navigation,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function RoutePlanningPage() {
  const { simulatedRisk } = useApp();
  const [origin, setOrigin] = useState('imphal');
  const [destination, setDestination] = useState('guwahati');
  const [vehicleWeight, setVehicleWeight] = useState('16T Heavy Axle');
  const [avoidLandslides, setAvoidLandslides] = useState(true);
  const [avoidBridges, setAvoidBridges] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  const originCity = NER_CITIES.find((c) => c.id === origin) || NER_CITIES[2];
  const destCity = NER_CITIES.find((c) => c.id === destination) || NER_CITIES[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Smart Route Planning & AI Risk Prediction</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine Learning risk evaluation & dynamic rerouting around monsoon hazards
          </p>
        </div>

        <Badge variant={simulatedRisk === 'HIGH' ? 'high' : 'safe'}>
          ML PREDICTION: {simulatedRisk} RISK
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form Panel */}
        <div className="lg:col-span-4 bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="font-bold text-sm text-white border-b border-slate-700 pb-2">Route Parameters</h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Origin City (Start)</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                {NER_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Destination City</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                {NER_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vehicle Weight / Class</label>
              <select
                value={vehicleWeight}
                onChange={(e) => setVehicleWeight(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="16T Heavy Axle">16T Heavy Freight Truck</option>
                <option value="12,000L Fuel Tanker">12,000L Fuel Tanker</option>
                <option value="Cold Chain Van">Refrigerated Van (7.5T)</option>
                <option value="Light Commercial">Light Pickup (3.5T)</option>
              </select>
            </div>

            {/* Avoidance Checkboxes */}
            <div className="pt-2 space-y-2 border-t border-slate-700">
              <span className="font-semibold text-slate-300 block">Routing Constraints</span>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidLandslides}
                  onChange={(e) => setAvoidLandslides(e.target.checked)}
                  className="rounded bg-dark-800 border-slate-700 text-cyan-500"
                />
                <span>Avoid High Landslide Risk Slopes</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidBridges}
                  onChange={(e) => setAvoidBridges(e.target.checked)}
                  className="rounded bg-dark-800 border-slate-700 text-cyan-500"
                />
                <span>Avoid Damaged / Weight-Restricted Bridges</span>
              </label>
            </div>

            <button
              onClick={() => setShowComparison(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all mt-3"
            >
              <Zap className="w-4 h-4" />
              <span>Calculate AI Risk & Compare Routes</span>
            </button>
          </div>
        </div>

        {/* Right AI Prediction & Route Display Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Risk Score Gauge Card */}
          <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
                <h2 className="font-bold text-sm text-white">Machine Learning Risk Prediction</h2>
              </div>
              <span className="text-[10px] text-purple-300 font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                {MOCK_ML_PREDICTION.modelStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Risk Gauge Graphic */}
              <div className="md:col-span-5 bg-dark-800/90 p-4 rounded-xl border border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-400 uppercase font-semibold">Predicted Landslide Risk</p>
                <div className="text-4xl font-extrabold text-rose-400 tracking-tight">
                  {simulatedRisk === 'HIGH' ? '72 / 100' : '24 / 100'}
                </div>
                <Badge variant={simulatedRisk === 'HIGH' ? 'high' : 'safe'} size="lg">
                  {simulatedRisk === 'HIGH' ? 'HIGH RISK SECTOR' : 'LOW RISK SECTOR'}
                </Badge>
                <p className="text-[10px] text-slate-400 pt-1">
                  Confidence Score: {MOCK_ML_PREDICTION.confidence} (Response: {MOCK_ML_PREDICTION.responseTimeMs}ms)
                </p>
              </div>

              {/* Environmental Risk Factors Breakdown */}
              <div className="md:col-span-7 space-y-2 text-xs">
                <span className="font-bold text-slate-200">Environmental Risk Drivers:</span>
                {MOCK_ML_PREDICTION.factors.map((f, i) => (
                  <div key={i} className="p-2 rounded-lg bg-dark-800 border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-300">{f.factor}</p>
                      <p className="text-[10px] text-slate-400">Observed Value: {f.value}</p>
                    </div>
                    <span className="font-bold text-rose-400 font-mono">{f.contribution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alternative Route Comparison Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Trunk Route */}
            <div className="bg-dark-700/60 p-5 rounded-2xl border border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-sm text-slate-200">Primary Direct Highway</span>
                <Badge variant="high">HIGH RISK</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Distance:</span>
                  <span className="font-mono font-bold">417 km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Time:</span>
                  <span className="font-mono font-bold">8h 45m</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Road Condition:</span>
                  <span className="text-amber-400 font-semibold">Saturated Mudslide Zone</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300">
                  ⚠️ 72% Landslide Probability on NH-2 Mountain Sector. Heavy delay likely.
                </div>
              </div>
            </div>

            {/* Alternative Safe Route */}
            <div className="bg-dark-700/60 p-5 rounded-2xl border border-emerald-500/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-sm text-emerald-400">AI Recommended Alternative</span>
                <Badge variant="safe">SAFE (LOW RISK)</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Distance:</span>
                  <span className="font-mono font-bold">{MOCK_ML_PREDICTION.recommendedAlternative.distanceKm} km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Time:</span>
                  <span className="font-mono font-bold text-emerald-400">{MOCK_ML_PREDICTION.recommendedAlternative.eta}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Safety Rating:</span>
                  <span className="text-emerald-400 font-bold">{MOCK_ML_PREDICTION.recommendedAlternative.safetyRating}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300">
                  ✅ Silchar-Shillong Highway Express. Bypasses active landslide area (+1h 35m).
                </div>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          <div className="bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80">
            <h3 className="font-bold text-xs text-slate-300 mb-2">Calculated Route & Bypass Overlay</h3>
            <MapView height="h-64" center={[25.5, 93.0]} zoom={7} />
          </div>
        </div>
      </div>
    </div>
  );
}
