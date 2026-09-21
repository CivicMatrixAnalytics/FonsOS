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
  RotateCw,
  Swords,
  ShieldCheck,
  FileText,
  Target,
  LifeBuoy,
  Sparkles
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
  is_actionable?: boolean;
  strategic_tag?: string | null;
  attack_angle?: string | null;
  defense_angle?: string | null;
}

type PersonaMode = 'neutral' | 'tvk_ruling' | 'dmk_opposition' | 'aiadmk_opposition';

const createMarkerIcon = (category: string, persona: PersonaMode) => {
  let color = '#ef4444'; 
  if (category === 'Corruption') color = '#f59e0b';
  else if (category === 'Infrastructure') color = '#3b82f6';
  else if (category === 'Governance') color = '#10b981';
  else if (category === 'Welfare & Schemes') color = '#8b5cf6';
  else if (category === 'Health & Environment') color = '#06b6d4';
  else if (category === 'Education & Jobs') color = '#ec4899';

  let borderColor = '#ffffff';
  let glow = color;
  if (persona === 'tvk_ruling') {
    borderColor = '#facc15';
    glow = '#eab308';
  } else if (persona === 'dmk_opposition') {
    borderColor = '#ef4444';
    glow = '#dc2626';
  } else if (persona === 'aiadmk_opposition') {
    borderColor = '#22c55e';
    glow = '#16a34a';
  }

  return L.divIcon({
    className: 'custom-fons-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        box-shadow: 0 0 14px ${glow};
        cursor: pointer;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
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

const ALL_TN_DISTRICTS = [
  'All',
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tamil Nadu (General)',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCoords, setActiveCoords] = useState<[number, number] | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [persona, setPersona] = useState<PersonaMode>('neutral');
  const [activePlaybookTab, setActivePlaybookTab] = useState<'details' | 'attack' | 'defend'>('details');

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

  useEffect(() => {
    if (persona === 'tvk_ruling') {
      setActivePlaybookTab('defend');
    } else if (persona === 'dmk_opposition' || persona === 'aiadmk_opposition') {
      setActivePlaybookTab('attack');
    } else {
      setActivePlaybookTab('details');
    }
  }, [persona]);

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

  const districts = ALL_TN_DISTRICTS;
  const categories = [
    'All', 
    'Corruption', 
    'Law & Order', 
    'Infrastructure', 
    'Governance', 
    'Welfare & Schemes', 
    'Health & Environment', 
    'Education & Jobs'
  ];

  const getLensBanner = () => {
    if (persona === 'tvk_ruling') {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        label: 'TVK RULING LENS ACTIVE',
        desc: 'Focus: Rapid Response, Damage Control & Countering Opposition Allegations',
        icon: <LifeBuoy size={14} className="text-amber-400" />
      };
    }
    if (persona === 'dmk_opposition') {
      return {
        bg: 'bg-red-500/10 border-red-500/30 text-red-300',
        label: 'DMK OPPOSITION LENS ACTIVE',
        desc: 'Focus: Anti-Incumbency Flashpoints, Charge Dossiers & Protest Agenda',
        icon: <Target size={14} className="text-red-400" />
      };
    }
    if (persona === 'aiadmk_opposition') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        label: 'AIADMK OPPOSITION LENS ACTIVE',
        desc: 'Focus: Grassroots Scrutiny, Regional Lapses & Accountability Drive',
        icon: <Swords size={14} className="text-emerald-400" />
      };
    }
    return null;
  };

  const lensBanner = getLensBanner();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-gray-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-800 bg-[#0f172a] px-5 flex items-center justify-between z-10 shrink-0">
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

        {/* Strategic Persona Switcher & Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            persona === 'tvk_ruling' ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10' :
            persona === 'dmk_opposition' ? 'bg-red-500/15 border-red-500/50 shadow-md shadow-red-500/10' :
            persona === 'aiadmk_opposition' ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10' :
            'bg-[#1e293b] border-gray-700'
          }`}>
            <span className="text-gray-300 text-[11px] font-semibold hidden sm:inline">War-Room Lens:</span>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaMode)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-xs text-white"
            >
              <option value="neutral" className="bg-[#0f172a] text-gray-200">Neutral (CMA Master)</option>
              <option value="tvk_ruling" className="bg-[#0f172a] text-yellow-400">TVK (Ruling - Defend/Delivery)</option>
              <option value="dmk_opposition" className="bg-[#0f172a] text-red-400">DMK (Opposition - Attack/Expose)</option>
              <option value="aiadmk_opposition" className="bg-[#0f172a] text-green-400">AIADMK (Opposition Front)</option>
            </select>
          </div>

          <button
            onClick={fetchIncidents}
            disabled={isRefreshing}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium cursor-pointer disabled:opacity-50"
            title="Fetch Latest from Supabase"
          >
            <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          <div className="hidden xl:flex items-center gap-2 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/80">
            <Activity size={14} className="text-blue-400" />
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
          </div>
          <div className="hidden xl:flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400">
            <Flame size={14} />
            <span>Corruption: <strong>{stats.corruption}</strong></span>
          </div>
          <div className="hidden xl:flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400">
            <AlertOctagon size={14} />
            <span>Law & Order: <strong>{stats.lawOrder}</strong></span>
          </div>
        </div>
      </header>

      {/* Strategic Lens Active Status Bar */}
      {lensBanner && (
        <div className={`px-5 py-1.5 border-b text-xs flex items-center justify-between shrink-0 transition-all ${lensBanner.bg}`}>
          <div className="flex items-center gap-2">
            {lensBanner.icon}
            <span className="font-bold tracking-wider text-[11px]">{lensBanner.label}</span>
            <span className="hidden md:inline text-gray-300 text-[11px]">| {lensBanner.desc}</span>
          </div>
          <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
            Active War-Room Perspective
          </div>
        </div>
      )}

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
                  <option key={d} value={d}>{d === 'All' ? '📍 All Districts' : d}</option>
                ))}
              </select>

              <select
                className="flex-1 bg-[#1e293b] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? '⚡ All Categories' : c}</option>
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
                  className={`p-3.5 rounded-lg border transition cursor-pointer relative ${
                    selectedIncident?.id === item.id
                      ? 'border-amber-400 bg-[#1e293b] shadow-lg shadow-amber-500/10'
                      : 'border-gray-800/90 bg-[#111827] hover:border-gray-700 hover:bg-[#141d2e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                        item.category === 'Corruption' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        item.category === 'Law & Order' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        item.category === 'Infrastructure' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        item.category === 'Welfare & Schemes' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                        item.category === 'Health & Environment' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                        item.category === 'Education & Jobs' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.category}
                      </span>

                      {/* AI Context-Aware Action Badges */}
                      {item.is_actionable ? (
                        <>
                          {persona === 'tvk_ruling' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/40 uppercase flex items-center gap-1 shadow-sm">
                              <Sparkles size={10} /> Rebuttal Target
                            </span>
                          )}
                          {(persona === 'dmk_opposition' || persona === 'aiadmk_opposition') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 uppercase flex items-center gap-1 shadow-sm">
                              <Sparkles size={10} /> Charge Point
                            </span>
                          )}
                        </>
                      ) : (
                        item.strategic_tag && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                            {item.strategic_tag}
                          </span>
                        )
                      )}
                    </div>

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
                icon={createMarkerIcon(incident.category, persona)}
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

          {/* Quick Inspector Drawer with AI Strategy Playbooks */}
          {selectedIncident && (
            <div className="absolute right-4 top-4 w-[430px] max-h-[90%] bg-[#111827]/95 backdrop-blur-md border border-gray-700/80 rounded-xl p-5 shadow-2xl z-[1000] text-xs flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[10px] tracking-wider uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    {selectedIncident.category}
                  </span>
                  {selectedIncident.is_actionable && (
                    <span className="font-semibold text-[10px] tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <Sparkles size={11} /> Actionable Issue
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <h2 className="font-semibold text-sm text-white leading-relaxed line-clamp-2 shrink-0">
                {selectedIncident.title}
              </h2>

              {/* Playbook Navigation Tabs */}
              <div className="flex border-b border-gray-800 gap-1 shrink-0">
                <button
                  onClick={() => setActivePlaybookTab('details')}
                  className={`px-3 py-1.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
                    activePlaybookTab === 'details'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <FileText size={12} /> Details
                </button>
                <button
                  onClick={() => setActivePlaybookTab('attack')}
                  className={`px-3 py-1.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
                    activePlaybookTab === 'attack'
                      ? 'border-red-400 text-red-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Swords size={12} /> Attack Angle
                </button>
                <button
                  onClick={() => setActivePlaybookTab('defend')}
                  className={`px-3 py-1.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
                    activePlaybookTab === 'defend'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <ShieldCheck size={12} /> Defense Rebuttal
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {activePlaybookTab === 'details' && (
                  <>
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
                        <span className="text-gray-500 block">Strategic Tag</span>
                        <span className="text-gray-200 font-medium">{selectedIncident.strategic_tag || 'Routine Feed'}</span>
                      </div>
                    </div>
                    <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-gray-800 text-[11px] text-gray-300 leading-relaxed">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">Intelligence Summary</span>
                      {selectedIncident.summary}
                    </div>
                  </>
                )}

                {activePlaybookTab === 'attack' && (
                  <div className="space-y-2.5 bg-red-950/20 border border-red-900/40 p-3 rounded-lg text-[11px]">
                    <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                      <Swords size={13} />
                      <span>Opposition Attack Strategy (DMK / AIADMK)</span>
                    </div>

                    <p className="text-gray-300 leading-relaxed">
                      <strong>AI Context Analysis:</strong>{' '}
                      {selectedIncident.attack_angle
                        ? selectedIncident.attack_angle
                        : `${selectedIncident.district} பகுதியில் ஏற்பட்டுள்ள நிர்வாகக் குறைபாடு மக்கள் அதிருப்தியை ஏற்படுத்தியுள்ளது.`}
                    </p>

                    <div className="bg-[#0f172a] p-2.5 rounded border border-gray-800 space-y-1.5 text-gray-300">
                      <span className="text-amber-400 font-bold block text-[10px] uppercase">Ready-to-Post Charge Draft:</span>
                      <p className="italic">
                        "{selectedIncident.district}-ல் நிகழ்ந்த இந்த சம்பவத்திற்கு ஆளும் அரசு என்ன நடவடிக்கை எடுத்துள்ளது? மக்கள் நலனில் மெத்தனப் போக்கு ஏன்?"
                      </p>
                    </div>

                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      <li>கள அளவில் மாவட்ட நிர்வாகத்திடம் விளக்கம் கோரும் மனு அளிக்கவும்.</li>
                      <li>பத்திரிகையாளர் சந்திப்பில் இந்த ஆதாரத்தை ஆவணப்படுத்தி கேள்வி எழுப்பவும்.</li>
                    </ul>
                  </div>
                )}

                {activePlaybookTab === 'defend' && (
                  <div className="space-y-2.5 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck size={13} />
                      <span>Governance Counter & Defense (TVK War-Room)</span>
                    </div>

                    <p className="text-gray-300 leading-relaxed">
                      <strong>Damage Control Point:</strong>{' '}
                      {selectedIncident.defense_angle
                        ? selectedIncident.defense_angle
                        : 'துறை சார்ந்த அதிகாரிகளிடம் உண்மை நிலவர அறிக்கை பெற்று துரித நடவடிக்கை எடுக்கப்பட வேண்டும்.'}
                    </p>

                    <div className="bg-[#0f172a] p-2.5 rounded border border-gray-800 space-y-1.5 text-gray-300">
                      <span className="text-emerald-400 font-bold block text-[10px] uppercase">Rebuttal Fact-Check Draft:</span>
                      <p className="italic">
                        "இச்சம்பவம் தொடர்பாக அரசு உரிய துறைகள் மூலம் உடனடி நிவாரண நடவடிக்கைகளை மேற்கொண்டுள்ளது; தவறான தகவல்களை நம்ப வேண்டாம்."
                      </p>
                    </div>

                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      <li>24 மணி நேர துரித நடவடிக்கை அறிக்கையை மக்கள் மத்தியில் பகிரவும்.</li>
                      <li>சமூக வலைதளங்களில் துறைசார்ந்த உண்மைத் தகவல்களை முன்னிறுத்தவும்.</li>
                    </ul>
                  </div>
                )}
              </div>

              <a
                href={selectedIncident.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition shrink-0"
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