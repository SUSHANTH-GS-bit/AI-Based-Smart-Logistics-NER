import React from 'react';
import { MOCK_GIS_DATASETS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Database, Upload, CheckCircle2, Layers } from 'lucide-react';

export function AdminGISDataPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-extrabold text-white">GIS Spatial Datasets Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Geospatial feature layers for North Eastern Region infrastructure</p>
        </div>
        <button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5">
          <Upload className="w-4 h-4" />
          <span>Upload GeoJSON / SHP</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_GIS_DATASETS.map((ds) => (
          <div key={ds.id} className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{ds.label}</span>
              <Badge variant="safe">SYNCED</Badge>
            </div>

            <div className="p-3 bg-dark-800 rounded-xl border border-slate-700 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Features:</span>
                <span className="font-bold text-cyan-400">{ds.records.toLocaleString()} Records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Layer Size:</span>
                <span className="text-slate-300">{ds.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Sync:</span>
                <span className="text-slate-300">{ds.lastUpdate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
