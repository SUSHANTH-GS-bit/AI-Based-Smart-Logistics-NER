import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, Calendar, Filter, Activity, TrendingUp } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7d');

  // Chart Data Sets
  const incidentTrendsData = [
    { day: 'Mon', Landslides: 4, Floods: 2, Blockages: 5 },
    { day: 'Tue', Landslides: 6, Floods: 3, Blockages: 4 },
    { day: 'Wed', Landslides: 8, Floods: 5, Blockages: 7 },
    { day: 'Thu', Landslides: 3, Floods: 1, Blockages: 2 },
    { day: 'Fri', Landslides: 9, Floods: 4, Blockages: 6 },
    { day: 'Sat', Landslides: 7, Floods: 6, Blockages: 8 },
    { day: 'Sun', Landslides: 5, Floods: 2, Blockages: 3 },
  ];

  const riskDistributionData = [
    { name: 'Low Risk', value: 45, color: '#10B981' },
    { name: 'Medium Risk', value: 30, color: '#F59E0B' },
    { name: 'High Risk', value: 18, color: '#EF4444' },
    { name: 'Critical', value: 7, color: '#9333EA' },
  ];

  const vehicleSpeedData = [
    { time: '06:00', TRK001: 42, TRK002: 30, TRK003: 0 },
    { time: '09:00', TRK001: 58, TRK002: 45, TRK003: 25 },
    { time: '12:00', TRK001: 52, TRK002: 38, TRK003: 0 },
    { time: '15:00', TRK001: 60, TRK002: 42, TRK003: 15 },
    { time: '18:00', TRK001: 48, TRK002: 35, TRK003: 0 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Reports & Logistics Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated metrics for regional route safety, incident trends, and telemetry sync
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-2 bg-dark-800 p-1.5 rounded-xl border border-slate-700 text-xs">
          {['today', '7d', '30d'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                timeframe === t ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incidents Over Time Bar Chart */}
        <div className="lg:col-span-8 bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white">Incidents & Hazards Over Time</h2>
            <Badge variant="high">MONSOON SEASON AGGREGATE</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="Landslides" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Floods" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Blockages" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="lg:col-span-4 bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="font-bold text-sm text-white">Regional Risk Distribution</h2>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 p-1.5 rounded bg-dark-800 border border-slate-700">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Speed Telemetry Line Chart */}
        <div className="lg:col-span-12 bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="font-bold text-sm text-white">Vehicle Speed Telemetry (km/h) Across Mountain Pass</h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vehicleSpeedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="TRK001" stroke="#06B6D4" strokeWidth={2} />
                <Line type="monotone" dataKey="TRK002" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="TRK003" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
