import React from 'react';
import { MOCK_ML_PREDICTION } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { BrainCircuit, Activity, Zap, CheckCircle2, Sliders } from 'lucide-react';

export function AdminMLPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-purple-500/30 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-xl font-extrabold text-white">AI / ML Model Service Operations</h1>
          </div>
          <p className="text-xs text-purple-300/80 mt-1">
            Machine Learning inference pipeline for Landslide & Disruption Risk Prediction
          </p>
        </div>
        <Badge variant="purple" size="lg">MODEL STATUS: ACTIVE</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700">
          <span className="text-slate-400 block text-[10px] uppercase">PREDICTION SERVICE</span>
          <span className="text-lg font-bold text-emerald-400">ONLINE</span>
        </div>
        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700">
          <span className="text-slate-400 block text-[10px] uppercase">RESPONSE LATENCY</span>
          <span className="text-lg font-bold text-cyan-400 font-mono">48 ms</span>
        </div>
        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700">
          <span className="text-slate-400 block text-[10px] uppercase">TOTAL INFERENCES</span>
          <span className="text-lg font-bold text-purple-400 font-mono">1,420 Runs</span>
        </div>
        <div className="bg-dark-700/60 p-4 rounded-xl border border-slate-700">
          <span className="text-slate-400 block text-[10px] uppercase">HIGH RISK ALERTS</span>
          <span className="text-lg font-bold text-rose-400 font-mono">184 Predictions</span>
        </div>
      </div>

      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-4">
        <h2 className="font-bold text-sm text-white">Active Model Weights & Integration Hook</h2>
        <div className="p-4 bg-dark-800 rounded-xl border border-slate-700 text-xs space-y-2 font-mono text-slate-300">
          <p className="text-purple-400"># Connected Backend Endpoint: POST /api/ml/predict</p>
          <p>Model Class: backend.ml_service.MLRiskService</p>
          <p>Artifact: joblib.load("../ML-ENGINEER/models/landslide_model.pkl")</p>
          <p>Algorithm: Random Forest Classifier (n_estimators=100)</p>
        </div>
      </div>
    </div>
  );
}
