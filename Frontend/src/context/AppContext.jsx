import React, { createContext, useContext, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useGPS } from '../hooks/useGPS';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isOnline, setIsOnline, toggleNetworkSim } = useNetworkStatus();
  const offlineSync = useOfflineSync(isOnline);
  const gps = useGPS(true);

  // Map Layer Toggles
  const [mapLayers, setMapLayers] = useState({
    roads: true,
    junctions: true,
    bridges: true,
    hospitals: true,
    warehouses: true,
    fuelStations: true,
    settlements: true,
    vehicles: true,
    incidents: true,
    riskZones: true,
  });

  const toggleLayer = (layerName) => {
    setMapLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Demo Control States
  const [simulatedRisk, setSimulatedRisk] = useState('HIGH'); // 'HIGH' | 'LOW'
  const [selectedVehicleId, setSelectedVehicleId] = useState('TRK-001');

  // Notifications Queue
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'critical', title: 'High-risk route detected', msg: 'NH-2 Landslide alert active (Score: 72/100)', time: '5m ago', unread: true },
    { id: 2, type: 'warning', title: 'Bridge Speed Limit', msg: 'Barapani Bridge pillar crack detected', time: '20m ago', unread: true },
    { id: 3, type: 'info', title: 'Offline Sync Queue', msg: '3 location pings recorded locally', time: '45m ago', unread: false },
    { id: 4, type: 'success', title: 'Auto-Sync Completed', msg: 'All queued records updated to FastAPI server', time: '1h ago', unread: false },
  ]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        setIsOnline,
        toggleNetworkSim,
        offlineSync,
        gps,
        mapLayers,
        toggleLayer,
        simulatedRisk,
        setSimulatedRisk,
        selectedVehicleId,
        setSelectedVehicleId,
        notifications,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
