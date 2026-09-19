import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { MOCK_VEHICLES, MOCK_INCIDENTS, MOCK_FACILITIES } from '../../data/mockData';
import { Badge } from '../common/Badge';
import { Navigation, Truck, AlertTriangle, Hospital, Fuel, Warehouse, Layers } from 'lucide-react';

// Fix standard Leaflet default icon paths in bundler environment
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon Creators
const createCustomIcon = (emoji, bgColor = '#06B6D4') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 12px ${bgColor}80;
      border: 2px solid #ffffff;
      font-size: 16px;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const vehicleIcon = createCustomIcon('🚚', '#06B6D4');
const incidentIcon = createCustomIcon('⚠️', '#EF4444');
const hospitalIcon = createCustomIcon('🏥', '#10B981');
const warehouseIcon = createCustomIcon('🏬', '#3B82F6');
const fuelIcon = createCustomIcon('⛽', '#A855F7');
const bridgeIcon = createCustomIcon('🌉', '#14B8A6');
const settlementIcon = createCustomIcon('🏘️', '#6366F1');

// Recenter Map Component Helper
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export function MapView({ height = 'h-full', center = [25.8, 93.0], zoom = 7, selectedVehicle }) {
  const { mapLayers, gps, isOnline } = useApp();

  // Imphal to Guwahati Route Polylines
  const primaryRouteCoords = [
    [24.8170, 93.9368], // Imphal
    [25.2200, 94.0200], // Kohima Landslide Zone
    [25.6751, 94.1086], // Kohima
    [25.9060, 93.7271], // Dimapur
    [26.1200, 91.7800], // Guwahati
  ];

  const altRouteCoords = [
    [24.8170, 93.9368], // Imphal
    [24.8333, 92.7789], // Silchar Bypass
    [25.5788, 91.8933], // Shillong Highway
    [26.1445, 91.7362], // Guwahati
  ];

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl`}>
      {/* Offline Watermark Indicator */}
      {!isOnline && (
        <div className="absolute top-4 right-4 z-[400] bg-amber-950/90 backdrop-blur-md border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          OFFLINE CACHED GIS MAP
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <ChangeView center={selectedVehicle ? [selectedVehicle.lat, selectedVehicle.lng] : center} />

        {/* Dark Matter GIS Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Current User Live GPS Location Pulse Marker */}
        {gps?.gpsAvailable && (
          <Marker position={[gps.latitude, gps.longitude]} icon={createCustomIcon('🎯', '#22D3EE')}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-cyan-400">Your GPS Location</p>
                <p className="text-slate-300 font-mono mt-1">{gps.latitude}, {gps.longitude}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Accuracy: ±{gps.accuracy}m | Speed: {gps.speed} km/h</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Primary Route Polyline (High Risk Segment in Amber/Red) */}
        {mapLayers.roads && (
          <>
            <Polyline
              positions={primaryRouteCoords}
              pathOptions={{ color: '#EF4444', weight: 4, dashArray: '8, 8', opacity: 0.9 }}
            />
            <Polyline
              positions={altRouteCoords}
              pathOptions={{ color: '#10B981', weight: 4, opacity: 0.8 }}
            />
          </>
        )}

        {/* Risk Zones Overlay Circles */}
        {mapLayers.riskZones && (
          <>
            <Circle
              center={[25.2200, 94.0200]}
              radius={18000}
              pathOptions={{ fillColor: '#EF4444', fillOpacity: 0.25, color: '#EF4444', weight: 2 }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold text-rose-400">⚠️ Landslide High-Risk Zone</p>
                  <p className="text-slate-300 mt-1">Predicted Landslide Probability: 72%</p>
                  <p className="text-slate-400 text-[10px]">Sector: Kohima-Imphal Mountain Corridor</p>
                </div>
              </Popup>
            </Circle>

            <Circle
              center={[26.2500, 92.3400]}
              radius={12000}
              pathOptions={{ fillColor: '#F59E0B', fillOpacity: 0.2, color: '#F59E0B', weight: 1.5 }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold text-amber-400">🌊 River Inundation Warning Zone</p>
                  <p className="text-slate-300 mt-1">Morigaon Flood Risk Level: Medium</p>
                </div>
              </Popup>
            </Circle>
          </>
        )}

        {/* Vehicles Layer */}
        {mapLayers.vehicles &&
          MOCK_VEHICLES.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={vehicleIcon}>
              <Popup>
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-cyan-400 border-b border-slate-700 pb-1">
                    <span>{v.id} — {v.driver}</span>
                    <Badge variant={v.riskLevel.toLowerCase()} size="sm">{v.status}</Badge>
                  </div>
                  <p className="text-slate-200"><strong>Type:</strong> {v.type}</p>
                  <p className="text-slate-300"><strong>Location:</strong> {v.locationName}</p>
                  <p className="text-slate-300"><strong>Route:</strong> {v.route}</p>
                  <p className="text-slate-400"><strong>Speed:</strong> {v.speed} km/h | Signal: {v.signal}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Incidents Layer */}
        {mapLayers.incidents &&
          MOCK_INCIDENTS.map((inc) => (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon}>
              <Popup>
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-rose-400 border-b border-slate-700 pb-1">
                    <span>{inc.title}</span>
                    <Badge variant={inc.severity.toLowerCase()} size="sm">{inc.severity}</Badge>
                  </div>
                  <p className="text-slate-300">{inc.description}</p>
                  <p className="text-slate-400 font-mono text-[10px]">Location: {inc.location}</p>
                  <p className="text-slate-400 text-[10px]">Est. Clearance: {inc.estimatedClearance}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Facilities Layers */}
        {mapLayers.hospitals &&
          MOCK_FACILITIES.filter((f) => f.category === 'Hospitals').map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={hospitalIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-400">{f.name}</p>
                  <p className="text-slate-300">{f.location}</p>
                  <p className="text-slate-400">{f.status} | {f.phone}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {mapLayers.warehouses &&
          MOCK_FACILITIES.filter((f) => f.category === 'Warehouses').map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={warehouseIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-blue-400">{f.name}</p>
                  <p className="text-slate-300">{f.location}</p>
                  <p className="text-slate-400">Capacity: {f.capacity}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {mapLayers.fuelStations &&
          MOCK_FACILITIES.filter((f) => f.category === 'Fuel Stations').map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={fuelIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-purple-400">{f.name}</p>
                  <p className="text-slate-300">{f.location}</p>
                  <p className="text-slate-400">{f.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {mapLayers.bridges &&
          MOCK_FACILITIES.filter((f) => f.category === 'Bridges').map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={bridgeIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-teal-400">{f.name}</p>
                  <p className="text-slate-300">{f.location}</p>
                  <p className="text-slate-400">Health: {f.structuralHealth}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {mapLayers.settlements &&
          MOCK_FACILITIES.filter((f) => f.category === 'Settlements').map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={settlementIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-indigo-400">{f.name}</p>
                  <p className="text-slate-300">Pop: {f.population}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
