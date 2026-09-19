import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mountain, Lock, Mail, Shield, User, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'admin'

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password, role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const handleQuickDemo = (selectedRole) => {
    login(null, null, selectedRole);
    if (selectedRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-md bg-dark-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-950/50 mx-auto">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Mountain className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">NER Logistics Platform</h1>
          <p className="text-xs text-slate-400">Log in to access live regional dispatch & AI risk tools</p>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs space-y-2">
          <span className="font-bold text-cyan-300 block text-center">⚡ QUICK DEMO LAUNCH</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('user')}
              className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <User className="w-3.5 h-3.5" />
              <span>Operator Demo</span>
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin HQ Demo</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Application Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-2 ${
                  role === 'user' ? 'bg-cyan-950 text-cyan-400 border-cyan-500' : 'bg-dark-700 text-slate-400 border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Operator</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-2 ${
                  role === 'admin' ? 'bg-purple-950 text-purple-400 border-purple-500' : 'bg-dark-700 text-slate-400 border-slate-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin HQ</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'admin' ? 'admin@nerlogistics.gov.in' : 'operator@nerlogistics.in'}
                className="w-full bg-dark-700 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-700 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="rounded bg-dark-700 border-slate-700 text-cyan-500" defaultChecked />
              <span>Remember this device</span>
            </label>
            <a href="#" className="text-cyan-400 hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all"
          >
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
