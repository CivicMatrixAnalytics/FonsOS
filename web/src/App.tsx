import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from './supabaseClient';
import { 
  ShieldAlert, 
  MapPin, 
  Search, 
  Activity, 
  Calendar, 
  ExternalLink, 
  Flame, 
  AlertOctagon, 
  X,
  Radio,
  RotateCw
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  summary: string;
  district: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  source_outlet: string;
  proof_url: string;
  incident_date: string;
}

const createMarkerIcon = (category: string) => {
  let color = '#ef4444'; 
  if (category === 'Corruption') color = '#f59e0b';
  if (category === 'Infrastructure') color = '#3b82f6';
  if (category === 'Governance') color = '#10b981';

  return L.divIcon({
    className: 'custom-fons-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 13px;
        height: 13px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 12px ${color};
        cursor: pointer;
      "></div>
    `,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
};

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 11, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    setIsRefreshing(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('incident_date', { ascending: false });

    if (!error && data) {
      setIncidents(data);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      corruption: incidents.filter(i => i.category === 'Corruption').length,
      lawOrder: incidents.filter(i => i.category === 'Law & Order').length,
      districtsCount: new Set(incidents.map(i => i.district)).size
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchDistrict = selectedDistrict === 'All' || item.district === selectedDistrict;
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchCat && matchSearch;
    });
  }, [incidents, selectedDistrict, selectedCategory, searchQuery]);

  const districts = ['All', ...Array.from(new Set(incidents.map((i) => i.district))).sort()];
  const categories = ['All', 'Corruption', 'Law & Order', 'Infrastructure', 'Governance'];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-gray-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-800 bg-[#0f172a] px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-amber-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-wide text-white">FonsOS</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <Radio size={10} className="animate-pulse" /> LIVE TN INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-gray-400">Automated Public Governance, Grievance & Incident Dossier</p>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <button
            onClick={fetchIncidents}
            disabled={isRefreshing}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer disabled:opacity-50"
            title="Fetch Latest from Supabase"
          >
            <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          <div className="bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/80 flex items-center gap-2">
            <Activity size={14} className="text-blue-400" />
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
          </div>
          <div className="bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2 text-amber-400">
            <Flame size={14} />
            <span>Corruption: <strong>{stats.corruption}</strong></span>
          </div>
          <div className="bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-2 text-red-400">
            <AlertOctagon size={14} />
            <span>Law & Order: <strong>{stats.lawOrder}</strong></span>
          </div>
          <div className="text-gray-400 border-l border-gray-700 pl-3">
            Since <span className="text-amber-400 font-semibold">May 10, 2026</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Filter & Feed */}
        <aside className="w-[42%] flex flex-col border-r border-gray-800 bg-[#0d1322] shrink-0">
          <div className="p-4 border-b border-gray-800 flex flex-col gap-3 bg-[#111827]/70">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search district, keywords, charges..."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="flex-1 bg-[#1e293b] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>

              <select
                className="flex-1 bg-[#1e293b] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-24 text-gray-400 text-sm flex flex-col items-center gap-2">
                <Activity size={24} className="animate-spin text-amber-400" />
                Updating Intelligence Feed...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-24 text-gray-400 text-sm">
                No incidents match this criterion.
              </div>
            ) : (
              filteredIncidents.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveCoords([item.latitude, item.longitude]);
                    setSelectedIncident(item);
                  }}
                  className={`p-3.5 rounded-lg border transition cursor-pointer ${
                    selectedIncident?.id === item.id
                      ? 'border-amber-400 bg-[#1e293b] shadow-lg shadow-amber-500/10'
                      : 'border-gray-800/90 bg-[#111827] hover:border-gray-700 hover:bg-[#141d2e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                      item.category === 'Corruption' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      item.category === 'Law & Order' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                      item.category === 'Infrastructure' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {item.incident_date}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-gray-100 leading-snug line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
                    <span className="flex items-center gap-1 text-gray-300 font-medium">
                      <MapPin size={12} className="text-amber-400" /> {item.district}
                    </span>
                    <span className="text-indigo-400 flex items-center gap-1">
                      {item.source_outlet}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Side: Map Container */}
        <main className="flex-1 h-full relative">
          <MapContainer
            center={[11.1271, 78.6569]}
            zoom={7}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ background: '#0b0f19' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToLocation coords={activeCoords} />

            {filteredIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.latitude, incident.longitude]}
                icon={createMarkerIcon(incident.category)}
                eventHandlers={{
                  click: () => {
                    setSelectedIncident(incident);
                    setActiveCoords([incident.latitude, incident.longitude]);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 max-w-xs text-xs font-sans text-gray-900">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-amber-600 mb-1">
                      {incident.category}
                    </div>
                    <h4 className="font-semibold text-gray-900 leading-snug mb-1">
                      {incident.title}
                    </h4>
                    <div className="text-[11px] text-gray-600 mb-2">
                      📍 {incident.district} • 📅 {incident.incident_date}
                    </div>
                    <a
                      href={incident.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      View Source Reference <ExternalLink size={11} />
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Quick Inspector Drawer */}
          {selectedIncident && (
            <div className="absolute right-4 top-4 w-96 bg-[#111827]/95 backdrop-blur-md border border-gray-700/80 rounded-xl p-5 shadow-2xl z-[1000] text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] tracking-wider uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  {selectedIncident.category}
                </span>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <h2 className="font-semibold text-sm text-white leading-relaxed">
                {selectedIncident.title}
              </h2>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-800 text-[11px]">
                <div>
                  <span className="text-gray-500 block">District</span>
                  <span className="text-gray-200 font-medium">{selectedIncident.district}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Incident Date</span>
                  <span className="text-gray-200 font-medium">{selectedIncident.incident_date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Severity Tier</span>
                  <span className="text-amber-400 font-semibold">{selectedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Reported By</span>
                  <span className="text-gray-200 font-medium">{selectedIncident.source_outlet}</span>
                </div>
              </div>

              <a
                href={selectedIncident.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <span>Examine Public Proof / Article</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}