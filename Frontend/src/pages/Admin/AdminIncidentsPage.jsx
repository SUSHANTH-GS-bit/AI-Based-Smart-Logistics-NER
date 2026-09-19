import React from 'react';
import { MOCK_INCIDENTS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export function AdminIncidentsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-extrabold text-white">Admin Incident Verification Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Review driver-submitted reports, adjust severity, and dispatch emergency response</p>
        </div>
        <Badge variant="high">ACTIVE ALERTS: {MOCK_INCIDENTS.length}</Badge>
      </div>

      <div className="space-y-3">
        {MOCK_INCIDENTS.map((inc) => (
          <div key={inc.id} className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={inc.severity.toLowerCase()}>{inc.severity}</Badge>
                <span className="font-bold text-white text-sm">{inc.title}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{inc.reportedAt}</span>
            </div>

            <p className="text-xs text-slate-300">{inc.description}</p>

            <div className="p-3 bg-dark-800 rounded-xl border border-slate-700 text-xs flex flex-wrap justify-between gap-2 text-slate-400">
              <span><strong>Location:</strong> {inc.location}</span>
              <span><strong>Reported By:</strong> {inc.reportedBy}</span>
              <span><strong>Clearance:</strong> {inc.estimatedClearance}</span>
            </div>

            <div className="flex justify-end gap-2 pt-1 text-xs">
              <button className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Verified</span>
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-dark-600 text-slate-200 border border-slate-700 font-semibold">
                Dispatch PWD / Rescue Team
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
