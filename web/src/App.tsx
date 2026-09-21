import React, { useState, useEffect, useMemo } from 'react';
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
  Filter, 
  Search, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  FileDown, 
  Check, 
  X, 
  Crosshair, 
  Flame, 
  ShieldCheck, 
  AlertTriangle 
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
}

// Helper component to pan/zoom map dynamically
function MapFlyToController({ selectedCoord }: { selectedCoord: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoord) {
      map.flyTo(selectedCoord, 12, { duration: 1.2 });
    }
  }, [selectedCoord, map]);
  return null;
}

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attack' | 'defense'>('details');

  // War-room lens state: TVK (Ruling) vs Opposition (DMK/AIADMK)
  const [warRoomLens, setWarRoomLens] = useState<'DMK' | 'TVK' | 'AIADMK'>('DMK');

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionableOnly, setActionableOnly] = useState<boolean>(false);

  // Copy state
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [dossierCopied, setDossierCopied] = useState<boolean>(false);

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
    fetchIncidents();
  }, []);

  // Filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchDistrict = selectedDistrict === 'All' || inc.district === selectedDistrict;
      const matchCategory = selectedCategory === 'All' || inc.category === selectedCategory;
      const matchActionable = !actionableOnly || inc.is_actionable;
      const matchSearch =
        searchQuery === '' ||
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.strategic_tag && inc.strategic_tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDistrict && matchCategory && matchActionable && matchSearch;
    });
  }, [incidents, selectedDistrict, selectedCategory, actionableOnly, searchQuery]);

  // Unique list of districts from current dataset
  const districtList = useMemo(() => {
    const list = Array.from(new Set(incidents.map((i) => i.district).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [incidents]);

  // Unique list of categories
  const categoryList = useMemo(() => {
    const list = Array.from(new Set(incidents.map((i) => i.category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [incidents]);

  // Active fly-to coordinate
  const selectedCoord = useMemo<[number, number] | null>(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      return [selectedIncident.latitude, selectedIncident.longitude];
    }
    return null;
  }, [selectedIncident]);

  // Copy draft to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Export full actionable dossier
  const handleExportDossier = () => {
    const actionableItems = filteredIncidents.filter((i) => i.is_actionable);
    const textLines = [
      `=============================================================`,
      `FONS-OS INTELLIGENCE WAR-ROOM DOSSIER: ${warRoomLens} LENS`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      `Total Incidents: ${actionableItems.length}`,
      `=============================================================\n`,
    ];

    actionableItems.forEach((item, idx) => {
      textLines.push(`[${idx + 1}] ${item.title}`);
      textLines.push(`District: ${item.district} | Category: ${item.category} | Tag: ${item.strategic_tag || 'N/A'}`);
      if (warRoomLens === 'TVK') {
        textLines.push(`Defense Angle: ${item.defense_angle || 'Monitoring field response'}`);
      } else {
        textLines.push(`Opposition Charge: ${item.attack_angle || 'Demand public accountability'}`);
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
                LIVE TN INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated Public Governance, Grievance & Incident Dossier</p>
          </div>
        </div>

        {/* War-room Lens selector & actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 mr-2">War-Room Lens:</span>
            <select
              value={warRoomLens}
              onChange={(e) => setWarRoomLens(e.target.value as 'DMK' | 'TVK' | 'AIADMK')}
              className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="DMK" className="bg-slate-900 text-slate-100">DMK (Opposition - Attack/Expose)</option>
              <option value="AIADMK" className="bg-slate-900 text-slate-100">AIADMK (Opposition - Attack/Expose)</option>
              <option value="TVK" className="bg-slate-900 text-slate-100">TVK (Ruling - Defend/Delivery)</option>
            </select>
          </div>

          <button
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all"
            title="Export Actionable Dossier to Clipboard"
          >
            {dossierCopied ? <Check size={14} className="text-emerald-400" /> : <FileDown size={14} />}
            <span>{dossierCopied ? 'Dossier Copied!' : 'Export Dossier'}</span>
          </button>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Dynamic Lens Banner */}
      <div
        className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b ${
          warRoomLens === 'TVK'
            ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {warRoomLens === 'TVK' ? <ShieldCheck size={15} /> : <Flame size={15} />}
          <span>
            {warRoomLens === 'TVK'
              ? 'TVK RULING LENS ACTIVE | Focus: Rapid Response, Damage Control & Countering Opposition Allegations'
              : `${warRoomLens} OPPOSITION LENS ACTIVE | Focus: Anti-Incumbency Flashpoints, Charge Dossiers & Protest Agenda`}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
          {filteredIncidents.length} Records Loaded
        </span>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar: Feed & Filters */}
        <div className="w-[430px] flex flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur z-10">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/90">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search district, keywords, charges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                {districtList.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Actionable Only Switch */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actionableOnly}
                  onChange={(e) => setActionableOnly(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                Show Actionable Issues Only
              </label>
              <span className="text-[10px] text-slate-500">
                {filteredIncidents.filter((i) => i.is_actionable).length} Actionable
              </span>
            </div>
          </div>

          {/* Incident Feed List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isActionable = incident.is_actionable;

              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncident(incident);
                    setActiveTab(isActionable ? (warRoomLens === 'TVK' ? 'defense' : 'attack') : 'details');
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/70 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {incident.category}
                      </span>

                      {/* Strategic Tag Badge */}
                      {incident.strategic_tag && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-400">
                          {incident.strategic_tag}
                        </span>
                      )}

                      {/* Actionable Badge */}
                      {isActionable && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            warRoomLens === 'TVK'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          <Sparkles size={10} />
                          {warRoomLens === 'TVK' ? 'REBUTTAL TARGET' : 'CHARGE POINT'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{incident.incident_date}</span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-100 mt-2 line-clamp-2 leading-relaxed">
                    {incident.title}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      📍 {incident.district}
                    </span>
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

        {/* Center: Leaflet Interactive Map */}
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

            <MapFlyToController selectedCoord={selectedCoord} />

            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isActionable = incident.is_actionable;
              const color = isActionable
                ? warRoomLens === 'TVK'
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
                      setActiveTab(isActionable ? (warRoomLens === 'TVK' ? 'defense' : 'attack') : 'details');
                    },
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 text-xs max-w-xs text-slate-900 font-sans">
                      <div className="font-bold mb-1">{incident.title}</div>
                      <div className="text-[10px] text-slate-600 mb-1">
                        {incident.district} | {incident.category}
                      </div>
                      {incident.strategic_tag && (
                        <div className="text-[10px] font-semibold text-indigo-600">
                          Tag: {incident.strategic_tag}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Strategic Intelligence Drawer */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 bottom-4 w-[460px] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 backdrop-blur overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {selectedIncident.category}
                  </span>
                  {selectedIncident.is_actionable && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase flex items-center gap-1">
                      <Crosshair size={11} />
                      Actionable Issue
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-100 leading-snug">
                  {selectedIncident.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('attack')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'attack'
                    ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame size={13} />
                Attack Angle
              </button>
              <button
                onClick={() => setActiveTab('defense')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'defense'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck size={13} />
                Defense Rebuttal
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Tab 1: Details */}
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
                      <span className="text-slate-500 block">District</span>
                      <span className="font-semibold text-slate-200">{selectedIncident.district}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Source Outlet</span>
                      <span className="font-semibold text-slate-200">{selectedIncident.source_outlet}</span>
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

              {/* Tab 2: Attack Angle (Opposition Lens) */}
              {activeTab === 'attack' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      Opposition Charge Point ({warRoomLens} Lens)
                    </span>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {selectedIncident.attack_angle ||
                        `${selectedIncident.district}-ல் அரசு நிர்வாகத்தின் மெத்தனத்தால் மக்கள் பாதிக்கப்பட்டுள்ளனர். துறை அதிகாரிகள் உடனடி பதில் அளிக்க வேண்டும்.`}
                    </p>
                  </div>

                  {/* Ready to post draft */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Ready-to-Post Charge Draft
                      </span>
                      <button
                        onClick={() =>
                          handleCopyText(
                            `[FonsOS Alert - ${selectedIncident.district}]\n${selectedIncident.title}\n\nகுற்றச்சாட்டு:\n${selectedIncident.attack_angle || selectedIncident.summary}\n\nஆதாரம்: ${selectedIncident.proof_url}`
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded"
                      >
                        {copiedDraft ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                        <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-slate-300 italic text-[11px] leading-relaxed">
                      "{selectedIncident.district}-ல் நிகழ்ந்த இந்த சம்பவத்திற்கு ஆளும் அரசு என்ன நடவடிக்கை எடுத்துள்ளது? மக்கள் நலனில் மெத்தனப் போக்கு ஏன்?"
                    </p>
                  </div>

                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div>• கள அளவில் மாவட்ட நிர்வாகத்திடம் விளக்கம் கோரும் மனு அளிக்கலாம்.</div>
                    <div>• பத்திரிகையாளர் சந்திப்பில் இந்த ஆதாரத்தை ஆவணப்படுத்தி கேள்வி எழுப்பலாம்.</div>
                  </div>
                </div>
              )}

              {/* Tab 3: Defense Rebuttal (TVK Ruling Lens) */}
              {activeTab === 'defense' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Governance Counter & Defense (TVK War-Room)
                    </span>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {selectedIncident.defense_angle ||
                        'இச்சம்பவம் தொடர்பாக அரசு உரிய துறைகள் மூலம் உடனடி நிவாரண நடவடிக்கைகளை மேற்கொண்டுள்ளது; கள நிலவரம் தொடர்ந்து கண்காணிக்கப்படுகிறது.'}
                    </p>
                  </div>

                  {/* Rebuttal Fact-Check Draft */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        Rebuttal Fact-Check Draft
                      </span>
                      <button
                        onClick={() =>
                          handleCopyText(
                            `[TVK Governance Update - ${selectedIncident.district}]\n${selectedIncident.title}\n\nவிளக்கம்:\n${selectedIncident.defense_angle || selectedIncident.summary}\n\nஉண்மை அறிக்கை: ${selectedIncident.proof_url}`
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded"
                      >
                        {copiedDraft ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                        <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-slate-300 italic text-[11px] leading-relaxed">
                      "இச்சம்பவம் தொடர்பாக அரசு உரிய துறைகள் மூலம் உடனடி நிவாரண நடவடிக்கைகளை மேற்கொண்டுள்ளது. தவறான தகவல்களை நம்ப வேண்டாம்."
                    </p>
                  </div>

                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div>• கள அலுவலர்கள் மூலம் தீர்வு அறிக்கையைத் தயார் செய்து சமர்ப்பிக்கவும்.</div>
                    <div>• வதந்திகளுக்கு முற்றுப்புள்ளி வைக்கும் அதிகாரப்பூர்வ உண்மை அறிக்கையைப் பகிரவும்.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer: External Proof */}
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