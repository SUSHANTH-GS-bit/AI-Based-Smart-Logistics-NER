import React, { useState } from 'react';
import { MOCK_FACILITIES } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Hospital, Fuel, Warehouse, MapPin, Navigation, Phone, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccessibilityPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Hospitals', 'Warehouses', 'Fuel Stations', 'Bridges', 'Settlements'];

  const filteredFacilities = MOCK_FACILITIES.filter((f) => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesDistance = (f.distanceKm || 5) <= maxDistance;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDistance && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-dark-700/60 p-4 lg:p-6 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Hospital className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Accessibility & Infrastructure Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Geospatial lookup for emergency medical centers, fuel points, cold-chain hubs, and bridges
          </p>
        </div>

        <Badge variant="safe">ACCESSIBLE POIS: {filteredFacilities.length} LOCATIONS</Badge>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-dark-700/60 p-4 rounded-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950/40'
                  : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Distance Filter Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Distance Radius:</span>
          {[5, 10, 25].map((dist) => (
            <button
              key={dist}
              onClick={() => setMaxDistance(dist)}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                maxDistance === dist
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                  : 'bg-dark-800 text-slate-400 border-slate-700'
              }`}
            >
              Within {dist} km
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((f) => (
          <div
            key={f.id}
            className="bg-dark-700/60 p-5 rounded-2xl border border-slate-700/80 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="info">{f.category}</Badge>
                <span className="font-mono text-xs text-cyan-400 font-bold">{f.distanceKm || 5} km away</span>
              </div>

              <h3 className="font-bold text-base text-white">{f.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{f.location}</span>
              </p>

              <div className="p-2.5 rounded-xl bg-dark-800/80 border border-slate-700 text-xs space-y-1">
                <p className="text-slate-300"><strong>Status:</strong> {f.status}</p>
                {f.phone && <p className="text-slate-400"><strong>Phone:</strong> {f.phone}</p>}
                {f.capacity && <p className="text-slate-400"><strong>Capacity:</strong> {f.capacity}</p>}
                {f.structuralHealth && <p className="text-emerald-400 font-semibold">Structural Health: {f.structuralHealth}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate('/user/map')}
                className="flex-1 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
              <button
                onClick={() => navigate('/user/routes')}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Route</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
