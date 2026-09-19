import React from 'react';
import { Badge } from '../../components/common/Badge';
import { Users, Shield, CheckCircle, UserX } from 'lucide-react';

export function AdminUsersPage() {
  const usersList = [
    { id: 'usr-101', name: 'Rajesh Sharma', email: 'operator@nerlogistics.in', role: 'Operator', status: 'Active', registered: '2026-08-10' },
    { id: 'usr-102', name: 'Tenzing Lobsang', email: 'tenzing@arunachal.gov.in', role: 'Driver', status: 'Active', registered: '2026-08-15' },
    { id: 'usr-103', name: 'Lalremruata Mizoram', email: 'lalrem@mizoram.in', role: 'Driver', status: 'Active', registered: '2026-08-20' },
    { id: 'adm-99', name: 'Commander Dr. A. K. Baruah', email: 'admin@nerlogistics.gov.in', role: 'Admin HQ', status: 'Active', registered: '2026-07-01' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-extrabold text-white">User Access & Role Oversight</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage transport operators, drivers, and admin permissions</p>
        </div>
        <Badge variant="purple">TOTAL USERS: {usersList.length}</Badge>
      </div>

      <div className="bg-dark-700/60 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 uppercase text-[10px]">
              <th className="p-3">User & Email</th>
              <th className="p-3">Assigned Role</th>
              <th className="p-3">Registered Date</th>
              <th className="p-3">Account Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-dark-600/50">
                <td className="p-3">
                  <p className="font-bold text-white">{u.name}</p>
                  <p className="text-slate-400 text-[10px]">{u.email}</p>
                </td>
                <td className="p-3">
                  <Badge variant={u.role.includes('Admin') ? 'purple' : 'info'}>{u.role}</Badge>
                </td>
                <td className="p-3 font-mono text-slate-400">{u.registered}</td>
                <td className="p-3">
                  <Badge variant="safe">{u.status}</Badge>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button className="px-2.5 py-1 rounded bg-dark-600 text-slate-200 border border-slate-700 font-semibold">
                    Edit
                  </button>
                  <button className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
