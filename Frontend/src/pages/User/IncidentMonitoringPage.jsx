import React, { useState } from 'react';
import { MOCK_INCIDENTS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import { AlertTriangle, ShieldAlert, Clock, MapPin, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function IncidentMonitoringPage() {
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState('All');

  const filteredIncidents = MOCK_INCIDENTS.filter(
    (inc) => filterSeverity === 'All' || inc.severity === filterSeverity || (filterSeverity === 'Resolved' && inc.status === 'Resolved')
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Incident Monitoring & Hazard Alerts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time disaster feeds, road blockages, and clearance status across regional corridors
          </p>
        </div>

        <button
          onClick={() => navigate('/user/report-incident')}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
        >
          <Radio className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Severity Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-dark-700/60 p-3 rounded-xl border border-slate-700 text-xs">
        <span className="text-slate-400 font-semibold px-2">Filter Severity:</span>
        {['All', 'Critical', 'High', 'Medium', 'Low', 'Resolved'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-lg font-semibold border transition-all ${
              filterSeverity === sev
                ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-md'
                : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Split-Screen Layout: List on Left, GIS Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-6 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 hover:border-rose-500/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant={inc.severity.toLowerCase()}>{inc.severity}</Badge>
                <span className="text-[10px] text-slate-400 font-mono">{inc.reportedAt}</span>
              </div>

              <h3 className="font-bold text-base text-white">{inc.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>

              <div className="p-2.5 rounded-xl bg-dark-800/80 border border-slate-700 text-xs space-y-1">
                <p className="text-slate-300"><strong>Location:</strong> {inc.location}</p>
                <p className="text-slate-400"><strong>Reported By:</strong> {inc.reportedBy}</p>
                <p className="text-amber-400"><strong>Est. Clearance:</strong> {inc.estimatedClearance}</p>
              </div>
            </div>
          ))}
        </div>

        {/* GIS Map Preview */}
        <div className="lg:col-span-6 bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80">
          <h3 className="font-bold text-xs text-white mb-2">Live Incident Hazard Overlay</h3>
          <MapView height="h-[540px]" center={[25.4, 93.2]} zoom={8} />
        </div>
      </div>
    </div>
  );
}
