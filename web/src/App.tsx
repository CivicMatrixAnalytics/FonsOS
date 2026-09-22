import { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  FileDown, 
  Check, 
  X, 
  ShieldCheck,
  Building2,
  MessageCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

interface Incident {
  id: string;
  title: string;
  summary: string;
  district: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  source_outlet: string;
  proof_url: string;
  incident_date: string;
  is_actionable?: boolean;
  strategic_tag?: string;
  attack_angle?: string;
  defense_angle?: string;
  constituency?: string | null;
  ac_number?: number | null;
}

interface PoliticalConfig {
  ruling_party: string;
  opposition_parties: string[];
  election_cycle: string;
}

// Controller for programmatic map zooming and panning
function MapViewController({ 
  selectedCoord, 
  filterCoord 
}: { 
  selectedCoord: [number, number] | null;
  filterCoord: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoord) {
      map.flyTo(selectedCoord, 12, { duration: 1.2 });
    } else if (filterCoord) {
      map.flyTo(filterCoord, 10, { duration: 1.2 });
    }
  }, [selectedCoord, filterCoord, map]);

  return null;
}

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attack' | 'defense'>('details');

  // Dynamic Political Config from DB
  const [politicalConfig, setPoliticalConfig] = useState<PoliticalConfig>({
    ruling_party: 'TVK',
    opposition_parties: ['DMK', 'AIADMK'],
    election_cycle: '2026'
  });
  const [warRoomLens, setWarRoomLens] = useState<string>('DMK');

  // Hierarchical Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionableOnly, setActionableOnly] = useState<boolean>(false);

  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [dossierCopied, setDossierCopied] = useState<boolean>(false);

  // Fetch active political config
  const fetchPoliticalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('political_config')
        .select('ruling_party, opposition_parties, election_cycle')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setPoliticalConfig({
          ruling_party: data.ruling_party || 'TVK',
          opposition_parties: data.opposition_parties || ['DMK', 'AIADMK'],
          election_cycle: data.election_cycle || '2026'
        });
        // Default lens setup
        if (data.opposition_parties && data.opposition_parties.length > 0) {
          setWarRoomLens(data.opposition_parties[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching political config:', e);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('incident_date', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliticalConfig();
    fetchIncidents();
  }, []);

  const isRulingActive = warRoomLens === politicalConfig.ruling_party;

  const districtList = useMemo(() => {
    const list = Array.from(new Set(incidents.map((i) => i.district).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [incidents]);

  const constituencyList = useMemo(() => {
    const relevant = selectedDistrict === 'All' 
      ? incidents 
      : incidents.filter((i) => i.district === selectedDistrict);
    
    const acs = Array.from(
      new Set(
        relevant
          .filter((i) => i.constituency)
          .map((i) => (i.ac_number ? `AC ${i.ac_number}: ${i.constituency}` : `${i.constituency}`))
      )
    );
    return ['All', ...acs.sort()];
  }, [incidents, selectedDistrict]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchDistrict = selectedDistrict === 'All' || inc.district === selectedDistrict;
      const acLabel = inc.ac_number ? `AC ${inc.ac_number}: ${inc.constituency}` : `${inc.constituency}`;
      const matchConstituency = selectedConstituency === 'All' || acLabel === selectedConstituency;
      const matchCategory = selectedCategory === 'All' || inc.category === selectedCategory;
      const matchActionable = !actionableOnly || inc.is_actionable;
      const matchSearch =
        searchQuery === '' ||
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.constituency && inc.constituency.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.strategic_tag && inc.strategic_tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDistrict && matchConstituency && matchCategory && matchActionable && matchSearch;
    });
  }, [incidents, selectedDistrict, selectedConstituency, selectedCategory, actionableOnly, searchQuery]);

  const categoryList = useMemo(() => {
    const list = Array.from(new Set(incidents.map((i) => i.category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [incidents]);

  // Selected incident coords
  const selectedCoord = useMemo<[number, number] | null>(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      return [selectedIncident.latitude, selectedIncident.longitude];
    }
    return null;
  }, [selectedIncident]);

  // Feature 1: Dynamic Auto-Zoom on Filter changes (District/AC)
  const filterCoord = useMemo<[number, number] | null>(() => {
    if (selectedConstituency !== 'All') {
      const match = filteredIncidents.find((i) => {
        const acLabel = i.ac_number ? `AC ${i.ac_number}: ${i.constituency}` : `${i.constituency}`;
        return acLabel === selectedConstituency;
      });
      if (match && match.latitude && match.longitude) return [match.latitude, match.longitude];
    }

    if (selectedDistrict !== 'All') {
      const match = filteredIncidents.find((i) => i.district === selectedDistrict && i.latitude && i.longitude);
      if (match) return [match.latitude, match.longitude];
    }

    return null;
  }, [selectedDistrict, selectedConstituency, filteredIncidents]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Feature 3: One-Click WhatsApp Dispatch Formatter
  const handleWhatsAppShare = (incident: Incident, type: 'attack' | 'defense') => {
    const header = type === 'attack' 
      ? `🚨 *[FonsOS War-Room Alert - ${warRoomLens}]*` 
      : `🛡️ *[${politicalConfig.ruling_party} Governance Counter & Fact-Check]*`;

    const acInfo = incident.constituency 
      ? `\n📍 *Constituency:* AC ${incident.ac_number || ''} ${incident.constituency} (${incident.district})`
      : `\n📍 *District:* ${incident.district}`;

    const content = type === 'attack'
      ? `\n\n*குற்றச்சாட்டு:*\n${incident.attack_angle || incident.summary}`
      : `\n\n*விளக்கம் / தீர்வு:*\n${incident.defense_angle || incident.summary}`;

    const proof = `\n\n🔗 *ஆதாரம்:* ${incident.proof_url}`;
    const fullMessage = `${header}${acInfo}\n*தலைப்பு:* ${incident.title}${content}${proof}`;

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleExportDossier = () => {
    const actionableItems = filteredIncidents.filter((i) => i.is_actionable);
    const filterContext = selectedConstituency !== 'All' 
      ? `Constituency Focus: ${selectedConstituency}` 
      : (selectedDistrict !== 'All' ? `District Focus: ${selectedDistrict}` : 'Statewide TN Focus');

    const textLines = [
      `=============================================================`,
      `FONS-OS INTELLIGENCE WAR-ROOM DOSSIER (${warRoomLens} LENS)`,
      `Cycle: ${politicalConfig.election_cycle} | Scope: ${filterContext}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      `Actionable Flashpoints Recorded: ${actionableItems.length}`,
      `=============================================================\n`,
    ];

    actionableItems.forEach((item, idx) => {
      const acTag = item.constituency ? `[AC ${item.ac_number || 'N/A'}: ${item.constituency}] ` : '';
      textLines.push(`[${idx + 1}] ${acTag}${item.title}`);
      textLines.push(`District: ${item.district} | Category: ${item.category} | Tag: ${item.strategic_tag || 'Ground Feed'}`);
      if (isRulingActive) {
        textLines.push(`${politicalConfig.ruling_party} Rebuttal/Defense: ${item.defense_angle || 'Monitoring field response'}`);
      } else {
        textLines.push(`${warRoomLens} Opposition Charge: ${item.attack_angle || 'Public accountability demanded'}`);
      }
      textLines.push(`Source: ${item.source_outlet} | Proof: ${item.proof_url}`);
      textLines.push(`-------------------------------------------------------------\n`);
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setDossierCopied(true);
    setTimeout(() => setDossierCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">FonsOS</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {politicalConfig.election_cycle} ELECTORAL INTEL
              </span>
            </div>
            <p className="text-xs text-slate-400">Public Governance, Rapid Rebuttal & Constituency Micro-Mapping</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Feature 2: Database-driven dynamic lenses */}
          <div className="flex items-center bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 mr-2">Active Lens:</span>
            <select
              value={warRoomLens}
              onChange={(e) => setWarRoomLens(e.target.value)}
              className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              <optgroup label="Ruling Lens" className="bg-slate-900 text-slate-400">
                <option value={politicalConfig.ruling_party} className="bg-slate-900 text-amber-300">
                  {politicalConfig.ruling_party} (Ruling - Defend/Counter)
                </option>
              </optgroup>
              <optgroup label="Opposition Lenses" className="bg-slate-900 text-slate-400">
                {politicalConfig.opposition_parties.map((party) => (
                  <option key={party} value={party} className="bg-slate-900 text-slate-100">
                    {party} (Opposition - Attack/Expose)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all cursor-pointer"
            title="Export Actionable Dossier to Clipboard"
          >
            {dossierCopied ? <Check size={14} className="text-emerald-400" /> : <FileDown size={14} />}
            <span>{dossierCopied ? 'Dossier Copied!' : 'Export Dossier'}</span>
          </button>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* War-Room Tactical Banner */}
      <div
        className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b ${
          isRulingActive
            ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isRulingActive ? <ShieldCheck size={15} /> : <span className="text-sm">🔥</span>}
          <span>
            {isRulingActive
              ? `${politicalConfig.ruling_party} RULING LENS ACTIVE | Rapid Response, Fact-Check & Remediation Defense`
              : `${warRoomLens} OPPOSITION LENS ACTIVE | Anti-Incumbency Flashpoints, Direct Charges & Press Agenda`}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
          {filteredIncidents.length} Filtered Incidents
        </span>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Side: Filterable Feed */}
        <div className="w-[430px] flex flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur z-10">
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/90">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search district, AC, charges, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Hierarchical Dropdowns: District -> Assembly Constituency */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedConstituency('All');
                }}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                {districtList.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>

              <select
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
              >
                {constituencyList.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'All Constituencies' : c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>

              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={actionableOnly}
                  onChange={(e) => setActionableOnly(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                Actionable Only
              </label>
            </div>
          </div>

          {/* Cards List with AC Badges */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isActionable = incident.is_actionable;

              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncident(incident);
                    setActiveTab(isActionable ? (isRulingActive ? 'defense' : 'attack') : 'details');
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/70 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {incident.constituency ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                          <Building2 size={11} />
                          {incident.ac_number ? `AC ${incident.ac_number}: ` : ''}{incident.constituency}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {incident.category}
                        </span>
                      )}

                      {incident.strategic_tag && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-400">
                          {incident.strategic_tag}
                        </span>
                      )}

                      {isActionable && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isRulingActive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          <Sparkles size={10} />
                          {isRulingActive ? 'REBUTTAL' : 'CHARGE'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{incident.incident_date}</span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-100 mt-2 line-clamp-2 leading-relaxed">
                    {incident.title}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">📍 {incident.district}</span>
                    <span className="text-slate-500 text-[10px]">{incident.source_outlet}</span>
                  </div>
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No incidents match your selected filters.
              </div>
            )}
          </div>
        </div>

        {/* Center: Interactive Leaflet Map with Auto-Zoom on Filter */}
        <div className="flex-1 h-full relative z-0">
          <MapContainer
            center={[11.1271, 78.6569]}
            zoom={7}
            className="h-full w-full"
            style={{ background: '#020617' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewController 
              selectedCoord={selectedCoord} 
              filterCoord={filterCoord} 
            />

            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isActionable = incident.is_actionable;
              const color = isActionable
                ? isRulingActive
                  ? '#f59e0b'
                  : '#ef4444'
                : '#10b981';

              return (
                <CircleMarker
                  key={incident.id}
                  center={[incident.latitude, incident.longitude]}
                  radius={isSelected ? 10 : isActionable ? 8 : 5}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.9 : 0.6,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedIncident(incident);
                      setActiveTab(isActionable ? (isRulingActive ? 'defense' : 'attack') : 'details');
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs max-w-xs text-slate-900 font-sans">
                      <div className="font-bold mb-1">{incident.title}</div>
                      <div className="text-[10px] text-slate-600 mb-1">
                        {incident.constituency ? `AC: ${incident.constituency} | ` : ''}{incident.district}
                      </div>
                      {incident.strategic_tag && (
                        <div className="text-[10px] font-semibold text-indigo-600">
                          {incident.strategic_tag}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Drawer: Intelligence Details, Copy, and One-Click WhatsApp Dispatch */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 bottom-4 w-[460px] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 backdrop-blur overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedIncident.constituency && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {selectedIncident.ac_number ? `AC ${selectedIncident.ac_number}: ` : ''}{selectedIncident.constituency}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {selectedIncident.category}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-100 leading-snug">
                  {selectedIncident.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('attack')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'attack'
                    ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔥</span>
                Attack Angle
              </button>
              <button
                onClick={() => setActiveTab('defense')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'defense'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck size={13} />
                Defense Rebuttal
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Incident Summary
                    </h4>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      {selectedIncident.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Assembly Constituency</span>
                      <span className="font-semibold text-amber-300">
                        {selectedIncident.constituency ? `${selectedIncident.constituency} (AC ${selectedIncident.ac_number || 'N/A'})` : 'District Level'}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">District</span>
                      <span className="font-semibold text-slate-200">{selectedIncident.district}</span>
                    </div>
                  </div>

                  {selectedIncident.strategic_tag && (
                    <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Strategic Classification</span>
                      <span className="font-semibold text-indigo-300">{selectedIncident.strategic_tag}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attack' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      Opposition Charge Point ({warRoomLens} Lens)
                    </span>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {selectedIncident.attack_angle ||
                        `${selectedIncident.constituency || selectedIncident.district}-ல் அரசு நிர்வாகத்தின் மெத்தனத்தால் மக்கள் பாதிக்கப்பட்டுள்ளனர். துறை அதிகாரிகள் உடனடி பதில் அளிக்க வேண்டும்.`}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Actionable Ground Draft
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWhatsAppShare(selectedIncident, 'attack')}
                          className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded cursor-pointer transition-all"
                          title="Share to WhatsApp"
                        >
                          <MessageCircle size={12} />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() =>
                            handleCopyText(
                              `[FonsOS AC Alert - ${selectedIncident.constituency || selectedIncident.district}]\n${selectedIncident.title}\n\nகுற்றச்சாட்டு:\n${selectedIncident.attack_angle || selectedIncident.summary}\n\nஆதாரம்: ${selectedIncident.proof_url}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded cursor-pointer"
                        >
                          {copiedDraft ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                          <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 italic text-[11px] leading-relaxed">
                      "{selectedIncident.constituency || selectedIncident.district}-ல் நிகழ்ந்த இந்த சம்பவத்திற்கு ஆளும் அரசு என்ன நடவடிக்கை எடுத்துள்ளது? மக்கள் நலனில் மெத்தனப் போக்கு ஏன்?"
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'defense' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Governance Counter & Rebuttal ({politicalConfig.ruling_party} Lens)
                    </span>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {selectedIncident.defense_angle ||
                        'இச்சம்பவம் தொடர்பாக அரசு உரிய துறைகள் மூலம் உடனடி நிவாரண நடவடிக்கைகளை மேற்கொண்டுள்ளது; கள நிலவரம் தொடர்ந்து கண்காணிக்கப்படுகிறது.'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        Fact-Check Counter Copy
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWhatsAppShare(selectedIncident, 'defense')}
                          className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded cursor-pointer transition-all"
                          title="Share to WhatsApp"
                        >
                          <MessageCircle size={12} />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() =>
                            handleCopyText(
                              `[${politicalConfig.ruling_party} Governance Update - ${selectedIncident.constituency || selectedIncident.district}]\n${selectedIncident.title}\n\nவிளக்கம்:\n${selectedIncident.defense_angle || selectedIncident.summary}\n\nஉண்மை அறிக்கை: ${selectedIncident.proof_url}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded cursor-pointer"
                        >
                          {copiedDraft ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                          <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 italic text-[11px] leading-relaxed">
                      "இச்சம்பவம் தொடர்பாக உரிய துறைகள் மூலம் உடனடி நடவடிக்கைகள் எடுக்கப்பட்டுள்ளன. தவறான தகவல்களைப் பரப்ப வேண்டாம்."
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/60">
              <a
                href={selectedIncident.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
              >
                <span>Examine Public Proof / Article</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}