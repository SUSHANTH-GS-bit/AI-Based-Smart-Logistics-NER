import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, MapPin, Route, AlertTriangle, Menu } from 'lucide-react';

export function MobileNavigation({ onOpenMenu }) {
  const { role } = useAuth();
  const basePath = role === 'admin' ? '/admin' : '/user';

  const navItems = [
    { to: `${basePath}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${basePath}/map`, label: 'Map', icon: MapPin },
    { to: role === 'admin' ? '/admin/fleet' : '/user/routes', label: role === 'admin' ? 'Fleet' : 'Routes', icon: Route },
    { to: `${basePath}/incidents`, label: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-dark-800/95 backdrop-blur-md border-t border-dark-600 z-40 px-4 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </div>
  );
}
