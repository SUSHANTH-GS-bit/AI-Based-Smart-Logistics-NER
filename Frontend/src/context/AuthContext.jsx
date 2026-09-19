import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'usr-101',
    name: 'Rajesh Sharma',
    email: 'operator@nerlogistics.in',
    phone: '+91 98620 12345',
    role: 'user', // 'user' or 'admin'
    vehicleId: 'TRK-001',
    assignedSector: 'Guwahati-Imphal Axis',
  });

  const login = (email, password, role = 'user') => {
    setUser({
      id: role === 'admin' ? 'adm-99' : 'usr-101',
      name: role === 'admin' ? 'Commander Dr. A. K. Baruah' : 'Rajesh Sharma',
      email: email || (role === 'admin' ? 'admin@nerlogistics.gov.in' : 'operator@nerlogistics.in'),
      role,
      vehicleId: role === 'admin' ? null : 'TRK-001',
      assignedSector: 'All North Eastern States (NER-HQ)',
    });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole) => {
    login(null, null, newRole);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, role: user?.role || 'guest', login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
