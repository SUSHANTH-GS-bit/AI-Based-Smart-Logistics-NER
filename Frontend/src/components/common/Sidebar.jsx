import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Route,
  Truck,
  AlertTriangle,
  Hospital,
  BarChart3,
  Settings,
  Shield,
  BrainCircuit,
  Database,
  Activity,
  Users,
  Radio,
  X,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();

  const userNavItems = [
    { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/user/map', label: 'Live GIS Map', icon: MapPin },
    { to: '/user/routes', label: 'Routes & ML Risk', icon: Route },
    { to: '/user/vehicles', label: 'Vehicle Tracking', icon: Truck },
    { to: '/user/report-incident', label: 'Report Incident', icon: Radio },
    { to: '/user/incidents', label: 'Incident Monitoring', icon: AlertTriangle },
    { to: '/user/accessibility', label: 'Accessibility Intelligence', icon: Hospital },
    { to: '/user/analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/user/settings', label: 'Profile & Settings', icon: Settings },
  ];

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { to: '/admin/map', label: 'Regional Map', icon: MapPin },
    { to: '/admin/fleet', label: 'Fleet Management', icon: Truck },
    { to: '/admin/incidents', label: 'Incident Verification', icon: AlertTriangle },
    { to: '/admin/users', label: 'User Oversight', icon: Users },
    { to: '/admin/ml-monitoring', label: 'AI / ML Monitoring', icon: BrainCircuit },
    { to: '/admin/gis-data', label: 'GIS Datasets', icon: Database },
    { to: '/admin/system-health', label: 'System Health', icon: Activity },
    { to: '/admin/settings', label: 'Admin Settings', icon: Settings },
  ];

  const currentNav = role === 'admin' ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-600 z-50 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile Header Close */}
          <div className="lg:hidden p-4 flex items-center justify-between border-b border-dark-600">
            <span className="font-bold text-sm text-cyan-400">NER Logistics Menu</span>
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Indicator */}
          <div className="px-4 py-3 border-b border-dark-600/60 bg-dark-700/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {role === 'admin' ? 'COMMAND CENTER NAV' : 'OPERATOR NAVIGATION'}
              </span>
              {role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            {currentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                      isActive
                        ? role === 'admin'
                          ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-950/30 font-semibold'
                          : 'bg-gradient-to-r from-cyan-900/60 to-teal-800/40 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / Status Summary */}
        <div className="p-3 border-t border-dark-600 bg-dark-700/30">
          <div className="p-2.5 rounded-xl bg-dark-700/80 border border-slate-700/60 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Region Coverage</span>
              <span className="font-bold text-cyan-400">8 NER States</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>GIS Layer Engine</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
