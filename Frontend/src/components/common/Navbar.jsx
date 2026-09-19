import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Mountain,
  Navigation,
  Wifi,
  WifiOff,
  Bell,
  Search,
  User,
  Shield,
  CloudUpload,
  CheckCircle2,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from './Badge';

export function Navbar({ onMenuToggle }) {
  const { user, role, logout, switchRole } = useAuth();
  const { isOnline, toggleNetworkSim, offlineSync, gps, notifications, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-dark-800/90 backdrop-blur-md border-b border-dark-600 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-dark-700 hover:text-white"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-950/40">
            <div className="w-full h-full bg-dark-800 rounded-[10px] flex items-center justify-center">
              <Mountain className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">NER Logistics</span>
              {role === 'admin' ? (
                <Badge variant="purple" size="sm">
                  ADMIN HQ
                </Badge>
              ) : (
                <Badge variant="info" size="sm">
                  OPERATOR
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-cyan-400/80 font-medium tracking-wide">
              North Eastern Region Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Search Input */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search roads, vehicles, hospitals, incidents..."
          className="w-full bg-dark-700/70 text-sm text-slate-200 placeholder-slate-500 pl-9 pr-4 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Right: Live Telemetry & User Menu */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Network & Offline Status */}
        <button
          onClick={toggleNetworkSim}
          title="Click to toggle Network Simulation (Online/Offline)"
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-dark-700 border border-slate-700 hover:border-cyan-500/50 transition-all text-xs"
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline font-semibold text-emerald-400">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-semibold text-amber-400">OFFLINE MODE</span>
            </>
          )}
        </button>

        {/* GPS Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-700 border border-slate-700 text-xs">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span className="text-slate-300 font-medium">{gps.gpsAvailable ? 'GPS ACTIVE' : 'NO GPS'}</span>
        </div>

        {/* Offline Sync Status */}
        {offlineSync.pendingCount > 0 ? (
          <button
            onClick={offlineSync.triggerSync}
            disabled={offlineSync.isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800 text-xs font-medium hover:bg-amber-900/60 transition-colors"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${offlineSync.isSyncing ? 'animate-bounce' : ''}`} />
            <span>{offlineSync.isSyncing ? 'Syncing...' : `${offlineSync.pendingCount} Queued`}</span>
          </button>
        ) : (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synced ({offlineSync.lastSyncTime})</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-dark-700 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-dark-700 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Notifications</span>
                <button onClick={markAllNotificationsRead} className="text-xs text-cyan-400 hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs hover:bg-dark-600/50 ${n.unread ? 'bg-cyan-950/20' : ''}`}>
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-400 mt-1">{n.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-dark-700 border border-slate-700 hover:border-cyan-500/50 text-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:inline font-medium text-xs">{user?.name || 'Operator'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-dark-700 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs">
              <div className="px-3 py-2 border-b border-slate-700 mb-1">
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>

              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500">Switch Role Demo</div>
              <button
                onClick={() => {
                  switchRole('user');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 ${role === 'user' ? 'bg-cyan-950/60 text-cyan-400' : 'text-slate-300 hover:bg-dark-600'}`}
              >
                <User className="w-3.5 h-3.5" />
                <span>User Operator Mode</span>
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 ${role === 'admin' ? 'bg-purple-950/60 text-purple-400' : 'text-slate-300 hover:bg-dark-600'}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Command HQ</span>
              </button>

              <div className="border-t border-slate-700 mt-2 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
