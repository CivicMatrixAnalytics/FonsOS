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
  Check, 
  X, 
  ShieldCheck,
  Building2,
  MessageCircle,
  BrainCircuit,
  Target,
  AlertTriangle,
  UserCheck,
  Flame,
  Lock,
  Unlock,
  KeyRound,
  Radio,
  FileText,
  BarChart3,
  Printer,
  PieChart,
  TrendingUp,
  PlusCircle,
  Send,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { StateTallyBar } from './components/StateTallyBar';

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
  political_sentiment?: 'anti_incumbency' | 'ruling_defense' | 'neutral';
  verification_status?: 'verified' | 'pending' | 'rejected';
}

interface PoliticalConfig {
  ruling_party: string;
  opposition_parties: string[];
  election_cycle: string;
}

interface MlaInfo {
  mla_name: string;
  party: string;
}

type UserRole = 'public' | 'admin' | 'candidate';

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
  const [mlaRegistry, setMlaRegistry] = useState<Record<string, MlaInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attack' | 'defense'>('details');

  // Role & Authentication States
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [candidateParty, setCandidateParty] = useState<string>('DMK');

  // Realtime Live Feed Notification
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  // Constituency Deep Dive Modal State
  const [deepDiveAC, setDeepDiveAC] = useState<string | null>(null);
  const [dossierExportCopied, setDossierExportCopied] = useState<boolean>(false);

  // Ground Report Submission Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState({
    title: '',
    summary: '',
    district: 'Chennai',
    constituency: '',
    category: 'Civic Grievance',
    severity: 'Medium' as 'High' | 'Medium' | 'Low',
    source_outlet: 'Ground Cadre Dispatch',
    proof_url: '',
    political_sentiment: 'anti_incumbency' as 'anti_incumbency' | 'ruling_defense' | 'neutral',
    is_actionable: true
  });

  const [politicalConfig, setPoliticalConfig] = useState<PoliticalConfig>({
    ruling_party: 'TVK',
    opposition_parties: ['DMK', 'AIADMK'],
    election_cycle: '2026'
  });
  const [warRoomLens, setWarRoomLens] = useState<string>('DMK');

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionableOnly, setActionableOnly] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');

  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [dossierCopied, setDossierCopied] = useState<boolean>(false);
  const [generatingBrief, setGeneratingBrief] = useState<boolean>(false);

  // Dynamic MLA Fetch from Supabase
  const fetchMlaRegistry = async () => {
    try {
      const { data, error } = await supabase
        .from('assembly_constituencies')
        .select('ac_number, sitting_mla, party');

      if (!error && data) {
        const mapping: Record<string, MlaInfo> = {};
        data.forEach((row) => {
          if (row.sitting_mla) {
            mapping[String(row.ac_number)] = {
              mla_name: row.sitting_mla,
              party: row.party || 'IND'
            };
          }
        });
        setMlaRegistry(mapping);
      }
    } catch (e) {
      console.error('Error fetching dynamic MLA registry:', e);
    }
  };

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
        if (data.opposition_parties && data.opposition_parties.length > 0) {
          setWarRoomLens(data.opposition_parties[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching config:', e);
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
    fetchMlaRegistry();
    fetchIncidents();

    // Automated Supabase Realtime Subscription
    const channel = supabase
      .channel('incidents-realtime-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          const newIncident = payload.new as Incident;
          setIncidents((prev) => [newIncident, ...prev]);
          setRealtimeAlert(newIncident.title);
          setTimeout(() => setRealtimeAlert(null), 4500);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'incidents' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setIncidents((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload) => {
          const updated = payload.new as Incident;
          setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isPublic = userRole === 'public';
  const isRulingActive = warRoomLens === politicalConfig.ruling_party;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (passcode.trim() === 'admin2026') {
      setUserRole('admin');
      setShowLoginModal(false);
      setPasscode('');
    } else if (passcode.trim() === 'candidate2026') {
      setUserRole('candidate');
      setWarRoomLens(candidateParty);
      setShowLoginModal(false);
      setPasscode('');
    } else {
      setLoginError('Invalid Passcode! (Try "admin2026" or "candidate2026")');
    }
  };

  const handleLogout = () => {
    setUserRole('public');
    setSelectedPartyFilter(null);
    setSelectedSentiment('All');
  };

  const getMlaDetails = (ac_number?: number | null) => {
    if (!ac_number) return null;
    return mlaRegistry[String(ac_number)] || null;
  };

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
    const now = new Date('2026-09-26').getTime();

    return incidents.filter((inc) => {
      // 1. PUBLIC RESTRICTION: Do not show pending unverified incidents to the public
      if (isPublic && inc.verification_status === 'pending') {
        return false;
      }

      // 2. PUBLIC RESTRICTION: strictly Today & Yesterday (<= 48 Hours)
      if (isPublic && inc.incident_date) {
        const incTime = new Date(inc.incident_date).getTime();
        const diffDays = (now - incTime) / (1000 * 3600 * 24);
        if (diffDays > 2) return false;
      }

      const mla = getMlaDetails(inc.ac_number);

      if (!isPublic && selectedPartyFilter && (!mla || mla.party !== selectedPartyFilter)) {
        return false;
      }

      const matchDistrict = selectedDistrict === 'All' || inc.district === selectedDistrict;
      const acLabel = inc.ac_number ? `AC ${inc.ac_number}: ${inc.constituency}` : `${inc.constituency}`;
      const matchConstituency = selectedConstituency === 'All' || acLabel === selectedConstituency;
      const matchCategory = selectedCategory === 'All' || inc.category === selectedCategory;
      const matchSentiment = isPublic || selectedSentiment === 'All' || inc.political_sentiment === selectedSentiment;
      const matchActionable = isPublic || !actionableOnly || inc.is_actionable;
      const matchSearch =
        searchQuery === '' ||
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.constituency && inc.constituency.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (!isPublic && inc.strategic_tag && inc.strategic_tag.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchTime = true;
      if (!isPublic && timeFilter !== 'ALL' && inc.incident_date) {
        const incTime = new Date(inc.incident_date).getTime();
        const diffDays = (now - incTime) / (1000 * 3600 * 24);
        if (timeFilter === '24H') matchTime = diffDays <= 1;
        else if (timeFilter === '7D') matchTime = diffDays <= 7;
        else if (timeFilter === '30D') matchTime = diffDays <= 30;
      }

      return matchDistrict && matchConstituency && matchCategory && matchSentiment && matchActionable && matchSearch && matchTime;
    });
  }, [incidents, isPublic, selectedDistrict, selectedConstituency, selectedCategory, selectedSentiment, selectedPartyFilter, actionableOnly, searchQuery, timeFilter, mlaRegistry]);

  // Pending count for Admin Review
  const pendingCount = useMemo(() => {
    return incidents.filter((i) => i.verification_status === 'pending').length;
  }, [incidents]);

  // Flashpoints calculation (only for authorized war room)
  const flashpointCounts = useMemo(() => {
    if (isPublic) return {};
    const mapCount: Record<string, number> = {};
    filteredIncidents.forEach((inc) => {
      const key = inc.constituency || inc.district;
      if (key) {
        mapCount[key] = (mapCount[key] || 0) + 1;
      }
    });
    return mapCount;
  }, [filteredIncidents, isPublic]);

  const activeFlashpoints = useMemo(() => {
    return Object.entries(flashpointCounts).filter(([_, count]) => count >= 5);
  }, [flashpointCounts]);

  // Top 10 Battleground Constituencies Ranking
  const top10Battlegrounds = useMemo(() => {
    if (isPublic) return [];
    const acGroups: Record<string, { count: number; high: number; anti: number; acNumber: number | null }> = {};
    
    incidents.forEach((inc) => {
      if (!inc.constituency) return;
      const label = inc.ac_number ? `AC ${inc.ac_number}: ${inc.constituency}` : inc.constituency;
      if (!acGroups[label]) {
        acGroups[label] = { count: 0, high: 0, anti: 0, acNumber: inc.ac_number || null };
      }
      acGroups[label].count += 1;
      if (inc.severity === 'High') acGroups[label].high += 1;
      if (inc.political_sentiment === 'anti_incumbency') acGroups[label].anti += 1;
    });

    return Object.entries(acGroups)
      .map(([acLabel, data]) => {
        const score = Math.min(100, Math.max(25, (data.high * 35) + (data.anti * 25) + (data.count * 15)));
        const mla = getMlaDetails(data.acNumber);
        return {
          acLabel,
          count: data.count,
          score,
          mla
        };
      })
      .sort((a, b) => b.score - a.score || b.count - a.count)
      .slice(0, 10);
  }, [incidents, isPublic, mlaRegistry]);

  const categoryList = useMemo(() => {
    const list = Array.from(new Set(incidents.map((i) => i.category).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [incidents]);

  const selectedCoord = useMemo<[number, number] | null>(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      return [selectedIncident.latitude, selectedIncident.longitude];
    }
    return null;
  }, [selectedIncident]);

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

  // Deep Dive AC Target Context Extraction with Smart Fallback & Category Breakdown
  const deepDiveData = useMemo(() => {
    if (!deepDiveAC) return null;
    const acIncidents = incidents.filter((i) => {
      const label = i.ac_number ? `AC ${i.ac_number}: ${i.constituency}` : i.constituency;
      return label === deepDiveAC || i.constituency === deepDiveAC;
    });

    const sample = acIncidents[0] || null;
    const acNum = sample?.ac_number || null;
    const mla = getMlaDetails(acNum);

    const antiCount = acIncidents.filter((i) => i.political_sentiment === 'anti_incumbency').length;
    const defCount = acIncidents.filter((i) => i.political_sentiment === 'ruling_defense').length;
    const neutralCount = acIncidents.filter((i) => i.political_sentiment === 'neutral').length;
    
    const rawActionable = acIncidents.filter((i) => i.is_actionable);
    const actionableList = rawActionable.length > 0 ? rawActionable : acIncidents;

    // Civic Category Breakdown
    const catMap: Record<string, number> = {};
    acIncidents.forEach((item) => {
      catMap[item.category] = (catMap[item.category] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(catMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / (acIncidents.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const highCount = acIncidents.filter((i) => i.severity === 'High').length;
    const rawScore = (highCount * 35) + (actionableList.length * 25) + (acIncidents.length * 15);
    const score = Math.min(100, Math.max(25, rawScore));

    return {
      acName: deepDiveAC,
      acNum,
      district: sample?.district || 'Tamil Nadu',
      mla,
      totalIncidents: acIncidents.length,
      antiCount,
      defCount,
      neutralCount,
      actionableList,
      categoryBreakdown,
      score,
      allIncidents: acIncidents
    };
  }, [deepDiveAC, incidents, mlaRegistry]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleExportACDossier = () => {
    if (!deepDiveData) return;
    const mlaStr = deepDiveData.mla ? `${deepDiveData.mla.mla_name} (${deepDiveData.mla.party})` : 'Unassigned';

    const catSummary = deepDiveData.categoryBreakdown
      .map((c) => `- ${c.name}: ${c.percent}% (${c.count} cases)`)
      .join('\n');

    const issues = deepDiveData.actionableList.map((item, idx) => {
      return `${idx + 1}. [${item.category}] ${item.title}\n   Charge: ${item.attack_angle || item.summary}\n   Proof: ${item.proof_url}`;
    }).join('\n\n');

    const dossierText = `======================================================================
CIVIC MATRIX ANALYTICS - CONSTITUENCY EXECUTIVE INTELLIGENCE DOSSIER
Assembly Constituency: ${deepDiveData.acName}
District: ${deepDiveData.district} | Election Cycle: ${politicalConfig.election_cycle}
Sitting MLA: ${mlaStr}
Generated At: ${new Date().toLocaleDateString('en-IN')}
======================================================================

I. STRATEGIC VULNERABILITY METRIC:
- Anti-Incumbency Vulnerability Score: ${deepDiveData.score}/100 [${deepDiveData.score >= 65 ? 'SEVERE FLASHPOINT' : 'MODERATE'}]
- Total Recorded Ground Incidents: ${deepDiveData.totalIncidents}
- Anti-Incumbency Flashpoints: ${deepDiveData.antiCount}
- Ruling Defense / Remediation Events: ${deepDiveData.defCount}
- Neutral Civic Observations: ${deepDiveData.neutralCount}

II. TOP CIVIC GRIEVANCE CLUSTERS:
${catSummary || 'None documented'}

III. ACTIONABLE CHARGE-SHEET & INCIDENT DOSSIER:
${issues || 'No ground charges currently recorded for this assembly seat.'}

IV. RECOMMENDED FIELD CAMPAIGN DIRECTIVE:
${isRulingActive 
  ? `Mobilize local constituency observers to expedite grievance redressal across affected wards. Neutralize localized opposition narratives with documented welfare delivery proofs.`
  : `Direct booth-level campaign teams to distribute localized charge-sheets highlighting administrative failure of sitting MLA ${mlaStr}. Focus door-to-door campaigning on civic grievances.`}
======================================================================`;

    navigator.clipboard.writeText(dossierText);
    setDossierExportCopied(true);
    setTimeout(() => setDossierExportCopied(false), 2500);
  };

  const handleWhatsAppBatchDispatch = () => {
    if (!deepDiveData) return;
    const mlaStr = deepDiveData.mla ? `${deepDiveData.mla.mla_name} (${deepDiveData.mla.party})` : 'Unassigned';
    const topIssues = deepDiveData.actionableList.slice(0, 3).map((item, idx) => {
      return `${idx + 1}. *[${item.category}]* ${item.title}`;
    }).join('\n');

    const msg = `🚨 *[FONS-OS BOOTH BULLETIN - ${deepDiveData.acName}]*
📍 *மாவட்டம்:* ${deepDiveData.district}
👤 *நடப்பு எம்.எல்.ஏ:* ${mlaStr}
⚡ *எதிர்ப்பு நிலை (Vulnerability):* ${deepDiveData.score}/100 [${deepDiveData.score >= 65 ? 'SEVERE' : 'MODERATE'}]

🔥 *கள முக்கிய பிரச்சனைகள் (Top Flashpoints):*
${topIssues}

📢 *களப்பணி உத்தரவு:*
பூத் வாரியாக மக்கள் சந்திப்பில் இப்பிரச்சனைகளை முன்வைத்து பிரசாரம் செய்யவும்!
============================
_Civic Matrix Analytics War-Room_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleWhatsAppShare = (incident: Incident, type: 'attack' | 'defense') => {
    const mla = getMlaDetails(incident.ac_number);
    const mlaInfo = mla ? `\n👤 *Sitting MLA:* ${mla.mla_name} (${mla.party})` : '';

    const header = type === 'attack' 
      ? `🚨 *[FonsOS War-Room Alert - ${warRoomLens}]*` 
      : `🛡️ *[${politicalConfig.ruling_party} Governance Counter & Fact-Check]*`;

    const acInfo = incident.constituency 
      ? `\n📍 *Constituency:* AC ${incident.ac_number || ''} ${incident.constituency} (${incident.district})${mlaInfo}`
      : `\n📍 *District:* ${incident.district}`;

    const content = type === 'attack'
      ? `\n\n*குற்றச்சாட்டு:*\n${incident.attack_angle || incident.summary}`
      : `\n\n*விளக்கம் / தீர்வு:*\n${incident.defense_angle || incident.summary}`;

    const proof = `\n\n🔗 *ஆதாரம்:* ${incident.proof_url}`;
    const fullMessage = `${header}${acInfo}\n*தலைப்பு:* ${incident.title}${content}${proof}`;

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleGenerateExecutiveBrief = () => {
    setGeneratingBrief(true);
    const actionable = filteredIncidents.filter((i) => i.is_actionable);
    const scope = selectedConstituency !== 'All' 
      ? selectedConstituency 
      : (selectedDistrict !== 'All' ? `${selectedDistrict} District` : 'Tamil Nadu (Statewide)');

    const topIssues = actionable.slice(0, 3).map((item, idx) => {
      const mla = getMlaDetails(item.ac_number);
      const mlaStr = mla ? ` [MLA: ${mla.mla_name} - ${mla.party}]` : '';
      return `${idx + 1}. [${item.category}] ${item.title}${mlaStr} -> ${isRulingActive ? (item.defense_angle || 'Monitored') : (item.attack_angle || 'Public accountability')}`;
    }).join('\n');

    const brief = `=============================================================
FONS-OS EXECUTIVE WAR-ROOM BRIEFING (${warRoomLens} LENS)
Scope: ${scope} | Date: ${new Date().toLocaleDateString('en-IN')}
Flashpoints In Scope: ${actionable.length} critical / governance issues
=============================================================

STRATEGIC POSTURE & VULNERABILITY SCORE:
Status: ${actionable.length >= 3 ? 'HIGH EXPOSURE - IMMEDIATE FIELD RESPONSE REQUIRED' : 'MODERATE - STANDARD MEDIA MONITORING'}

TOP STRATEGIC FLASHPOINTS:
${topIssues || 'No high-severity actionable incidents recorded in current selection.'}

RECOMMENDED CAMPAIGN DIRECTIVE:
${isRulingActive 
  ? `Deploy local ward observers to verify grievance redressal; emphasize administrative containment and refute speculative claims before opposition narrative solidifies.`
  : `Issue localized constituency charge-sheet targeting sitting MLA administrative lapses; mobilize booth agents across impacted polling stations.`}
=============================================================`;

    navigator.clipboard.writeText(brief);
    setDossierCopied(true);
    setGeneratingBrief(false);
    setTimeout(() => setDossierCopied(false), 2500);
  };

  // Submit Cadre Ground Report with Auto-Verification Flag
  const handleSubmitGroundReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.summary) return;

    setSubmittingReport(true);
    try {
      const matchedDistrictIncident = incidents.find((i) => i.district === reportForm.district && i.latitude && i.longitude);
      const lat = matchedDistrictIncident?.latitude || 11.1271;
      const lng = matchedDistrictIncident?.longitude || 78.6569;

      const payload = {
        title: reportForm.title.trim(),
        summary: reportForm.summary.trim(),
        district: reportForm.district,
        constituency: reportForm.constituency ? reportForm.constituency.trim() : null,
        category: reportForm.category,
        severity: reportForm.severity,
        source_outlet: reportForm.source_outlet,
        proof_url: reportForm.proof_url.trim() || 'https://civicmatrix.in',
        incident_date: new Date().toISOString().split('T')[0],
        latitude: lat,
        longitude: lng,
        political_sentiment: reportForm.political_sentiment,
        is_actionable: reportForm.is_actionable,
        // Admin submits direct-verified, public/cadre submits pending verification
        verification_status: userRole === 'admin' ? 'verified' : 'pending',
        attack_angle: `${reportForm.constituency || reportForm.district}-ல் அரசு நிர்வாக மெத்தனத்தால் மக்கள் பாதிப்பு. உடனடி தீர்வு தேவை.`,
        defense_angle: `இப்பிரச்சனை குறித்து கள அதிகாரிகள் மூலம் உடனடி நடவடிக்கை எடுக்கப்பட்டு வருகிறது.`
      };

      const { data, error } = await supabase.from('incidents').insert([payload]).select();

      if (error) throw error;

      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        setReportForm({
          title: '',
          summary: '',
          district: 'Chennai',
          constituency: '',
          category: 'Civic Grievance',
          severity: 'Medium',
          source_outlet: 'Ground Cadre Dispatch',
          proof_url: '',
          political_sentiment: 'anti_incumbency',
          is_actionable: true
        });
      }, 1500);

      if (data && data[0]) {
        setIncidents((prev) => [data[0] as Incident, ...prev]);
      }
    } catch (err) {
      console.error('Error submitting ground incident:', err);
      alert('Failed to submit ground incident. Please check database permissions.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Admin Action: Approve / Verify Incident
  const handleVerifyIncident = async (id: string) => {
    setVerifyingId(id);
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ verification_status: 'verified' })
        .eq('id', id);

      if (error) throw error;

      setIncidents((prev) =>
        prev.map((item) => (item.id === id ? { ...item, verification_status: 'verified' } : item))
      );

      if (selectedIncident?.id === id) {
        setSelectedIncident((prev) => (prev ? { ...prev, verification_status: 'verified' } : null));
      }
    } catch (err) {
      console.error('Error verifying incident:', err);
      alert('Failed to verify incident.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Admin Action: Delete / Purge Incident
  const handleDeleteIncident = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete/purge this incident from FonsOS intelligence database?');
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIncidents((prev) => prev.filter((item) => item.id !== id));
      if (selectedIncident?.id === id) {
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error('Error deleting incident:', err);
      alert('Failed to delete incident. Please check database permissions.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Realtime Alert Notification Toast */}
      {realtimeAlert && (
        <div className="fixed top-18 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-amber-300 animate-bounce">
          <Radio size={16} className="text-slate-950 animate-pulse" />
          <span>⚡ Live Ground Incident Ingested: {realtimeAlert}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">FonsOS</h1>
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isPublic 
                  ? 'bg-slate-800 text-slate-300 border-slate-700' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isPublic ? 'TN HYPERLOCAL FEED' : `${politicalConfig.election_cycle} WAR-ROOM INTEL`}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isPublic 
                ? 'Tamil Nadu 234 Constituencies - Verified 48-Hour News & Issues' 
                : 'Incident Intelligence, Rapid Rebuttal & Constituency Micro-Mapping'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Ground Cadre Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer shadow-sm"
            title="Dispatch Ground Cadre Incident / Grievance"
          >
            <PlusCircle size={14} />
            <span>Ground Report</span>
          </button>

          {/* Deep Dive Action Button (If AC is Selected in filter) */}
          {selectedConstituency !== 'All' && !isPublic && (
            <button
              onClick={() => setDeepDiveAC(selectedConstituency)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm"
            >
              <BarChart3 size={14} />
              <span>AC Intel Dossier</span>
            </button>
          )}

          {/* Public Badge vs Time Scope */}
          {isPublic ? (
            <div className="bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live: Last 48 Hours
            </div>
          ) : (
            <div className="flex items-center bg-slate-950/80 border border-slate-700 rounded-lg p-0.5 text-xs">
              {(['ALL', '24H', '7D', '30D'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    timeFilter === period 
                      ? 'bg-amber-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}

          {/* War-Room Lens Selector (Authorized Only) */}
          {!isPublic && (
            <div className="flex items-center bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 mr-2">Lens:</span>
              {userRole === 'admin' ? (
                <select
                  value={warRoomLens}
                  onChange={(e) => setWarRoomLens(e.target.value)}
                  className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
                >
                  <optgroup label="Ruling Lens" className="bg-slate-900 text-slate-400">
                    <option value={politicalConfig.ruling_party} className="bg-slate-900 text-amber-300">
                      {politicalConfig.ruling_party} (Ruling)
                    </option>
                  </optgroup>
                  <optgroup label="Opposition Lenses" className="bg-slate-900 text-slate-400">
                    {politicalConfig.opposition_parties.map((party) => (
                      <option key={party} value={party} className="bg-slate-900 text-slate-100">
                        {party} (Opposition)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Challenger / Third Front" className="bg-slate-900 text-slate-400">
                    <option value="THIRD_FRONT" className="bg-slate-900 text-indigo-300">
                      Third Front (Challenger)
                    </option>
                  </optgroup>
                </select>
              ) : (
                <span className="text-amber-400 font-bold">{warRoomLens} (Candidate View)</span>
              )}
            </div>
          )}

          {/* AI Executive Brief (Authorized Only) */}
          {!isPublic && (
            <button
              onClick={handleGenerateExecutiveBrief}
              disabled={generatingBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all cursor-pointer"
              title="Generate Synthesized AI War-Room Briefing"
            >
              {dossierCopied ? <Check size={14} className="text-emerald-400" /> : <BrainCircuit size={14} />}
              <span>{dossierCopied ? 'Briefing Copied!' : 'AI Executive Brief'}</span>
            </button>
          )}

          {/* Login / Logout Switcher */}
          {isPublic ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md"
            >
              <KeyRound size={14} />
              <span>War-Room Login</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              <Unlock size={14} />
              <span>Exit War-Room</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchIncidents();
              fetchMlaRegistry();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Tactical Banner (War-Room Only) */}
      {!isPublic && (
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
                ? `${politicalConfig.ruling_party} RULING LENS ACTIVE | Rapid Response, Fact-Check & Field Remediation`
                : warRoomLens === 'THIRD_FRONT'
                ? 'THIRD FRONT / CHALLENGER LENS ACTIVE | Anti-Establishment Vulnerability Exposure'
                : `${warRoomLens} OPPOSITION LENS ACTIVE | Anti-Incumbency Flashpoints & Ground Charges`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin Verification Pending Pill */}
            {userRole === 'admin' && pendingCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                🛡️ {pendingCount} Pending Review
              </span>
            )}
            {activeFlashpoints.length > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-1 animate-pulse">
                <Flame size={11} />
                🚨 {activeFlashpoints.length} Flashpoint Spike{activeFlashpoints.length > 1 ? 's' : ''} (5+ Incidents)
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              {filteredIncidents.length} Filtered Incidents ({timeFilter} Scope)
            </span>
          </div>
        </div>
      )}

      {/* Top 10 Battleground Flashpoints Ticker (War-Room Only) */}
      {!isPublic && top10Battlegrounds.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 whitespace-nowrap mr-1">
            <TrendingUp size={13} />
            <span>Top 10 Battlegrounds:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {top10Battlegrounds.map((bg, idx) => (
              <button
                key={bg.acLabel}
                onClick={() => setDeepDiveAC(bg.acLabel)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all text-[10px] whitespace-nowrap cursor-pointer group"
              >
                <span className="text-slate-500 font-mono">#{idx + 1}</span>
                <span className="font-semibold text-slate-200 group-hover:text-amber-300">{bg.acLabel}</span>
                <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${
                  bg.score >= 65 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {bg.score}
                </span>
                {bg.mla && (
                  <span className="text-[9px] text-slate-400 bg-slate-900 px-1 rounded">
                    {bg.mla.party}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic 234 Assembly Seat Share Tally Bar (War-Room Only) */}
      {!isPublic && (
        <StateTallyBar
          selectedParty={selectedPartyFilter}
          onSelectParty={(party) => setSelectedPartyFilter(party)}
        />
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Side: Filterable Feed */}
        <div className="w-[430px] flex flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur z-10">
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/90">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder={isPublic ? "Search Tamil Nadu news, AC, district..." : "Search district, AC, charges, keywords..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

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

            <div className={`grid ${isPublic ? 'grid-cols-1' : 'grid-cols-2'} gap-2 items-center`}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>

              {!isPublic && (
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="All" className="bg-slate-900">All Sentiments</option>
                  <option value="anti_incumbency" className="bg-slate-900">⚡ Anti-Incumbency</option>
                  <option value="ruling_defense" className="bg-slate-900">🛡️ Ruling Counter</option>
                  <option value="neutral" className="bg-slate-900">🏛️ Civic Neutral</option>
                </select>
              )}
            </div>

            {!isPublic && (
              <div className="pt-1 flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={actionableOnly}
                    onChange={(e) => setActionableOnly(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  Actionable Ground Flashpoints Only
                </label>
                {(selectedDistrict !== 'All' || selectedConstituency !== 'All' || selectedCategory !== 'All' || selectedSentiment !== 'All' || actionableOnly || selectedPartyFilter) && (
                  <button
                    onClick={() => {
                      setSelectedDistrict('All');
                      setSelectedConstituency('All');
                      setSelectedCategory('All');
                      setSelectedSentiment('All');
                      setSelectedPartyFilter(null);
                      setActionableOnly(false);
                      setSearchQuery('');
                    }}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {filteredIncidents.map((incident) => {
              const isSelected = selectedIncident?.id === incident.id;
              const isActionable = incident.is_actionable;
              const mla = getMlaDetails(incident.ac_number);
              const isRulingMla = mla && mla.party === politicalConfig.ruling_party;
              const acLabel = incident.ac_number ? `AC ${incident.ac_number}: ${incident.constituency}` : (incident.constituency || null);
              const isPending = incident.verification_status === 'pending';

              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncident(incident);
                    setActiveTab(isPublic ? 'details' : (isActionable ? (isRulingActive ? 'defense' : 'attack') : 'details'));
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isPublic && acLabel) {
                              setDeepDiveAC(acLabel);
                            }
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 transition-all ${
                            !isPublic ? 'hover:bg-amber-500/30 hover:border-amber-400 cursor-pointer' : ''
                          }`}
                          title={!isPublic ? "Click for Constituency Deep Dive Dossier" : ""}
                        >
                          <Building2 size={11} />
                          {incident.ac_number ? `AC ${incident.ac_number}: ` : ''}{incident.constituency}
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {incident.category}
                        </span>
                      )}

                      {/* Verification Status Pill for War Room */}
                      {!isPublic && isPending && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          Pending Review
                        </span>
                      )}

                      {/* Strategic Badges only visible in War Room */}
                      {!isPublic && (
                        <>
                          {mla && !isRulingActive && isRulingMla && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                              <Target size={10} />
                              Target Strike
                            </span>
                          )}

                          {mla && isRulingActive && isRulingMla && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Damage Control
                            </span>
                          )}

                          {incident.political_sentiment === 'anti_incumbency' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isRulingActive
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {isRulingActive ? '⚠️ Governance Vulnerability' : '⚡ Anti-Incumbency'}
                            </span>
                          )}
                          {incident.political_sentiment === 'ruling_defense' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isRulingActive
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {isRulingActive ? '✅ Scheme Delivery' : '🛡️ Ruling Counter'}
                            </span>
                          )}
                          {incident.political_sentiment === 'neutral' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              🏛️ Civic Neutral
                            </span>
                          )}

                          {isActionable && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                isRulingActive
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              }`}
                            >
                              <Sparkles size={10} />
                              {isRulingActive ? 'REBUTTAL' : 'CHARGE'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{incident.incident_date}</span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-100 mt-2 line-clamp-2 leading-relaxed">
                    {incident.title}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">📍 {incident.district}</span>
                    {!isPublic && mla ? (
                      <span className="text-[10px] font-medium text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        MLA: {mla.mla_name} ({mla.party})
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">{incident.source_outlet}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                {isPublic 
                  ? 'No news records found for the last 48 hours in this filter.' 
                  : 'No incidents match your selected filters.'}
              </div>
            )}
          </div>
        </div>

        {/* Center: Interactive Leaflet Map */}
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
              const placeKey = incident.constituency || incident.district;
              const isFlashpoint = !isPublic && placeKey && (flashpointCounts[placeKey] || 0) >= 5;

              const color = isPublic 
                ? '#38bdf8' 
                : (isActionable 
                    ? (isRulingActive ? '#f59e0b' : '#ef4444') 
                    : '#10b981');

              return (
                <div key={incident.id}>
                  {isFlashpoint && (
                    <CircleMarker
                      center={[incident.latitude, incident.longitude]}
                      radius={22}
                      pathOptions={{
                        color: '#f43f5e',
                        fillColor: '#f43f5e',
                        fillOpacity: 0.18,
                        weight: 1,
                        dashArray: '3, 6'
                      }}
                    />
                  )}

                  <CircleMarker
                    center={[incident.latitude, incident.longitude]}
                    radius={isSelected ? 11 : isActionable ? 8 : 5}
                    pathOptions={{
                      color: isFlashpoint ? '#f43f5e' : color,
                      fillColor: isFlashpoint ? '#e11d48' : color,
                      fillOpacity: isSelected ? 0.95 : 0.65,
                      weight: isSelected ? 3 : 1.5,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedIncident(incident);
                        setActiveTab(isPublic ? 'details' : (isActionable ? (isRulingActive ? 'defense' : 'attack') : 'details'));
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-xs max-w-xs text-slate-900 font-sans">
                        <div className="font-bold mb-1">{incident.title}</div>
                        <div className="text-[10px] text-slate-600 mb-1">
                          {incident.constituency ? `AC: ${incident.constituency} | ` : ''}{incident.district}
                        </div>
                        {isFlashpoint && (
                          <div className="text-[10px] font-bold text-rose-600 mb-1">
                            🚨 Flashpoint Hotspot ({flashpointCounts[placeKey]} issues in area)
                          </div>
                        )}
                        {!isPublic && incident.strategic_tag && (
                          <div className="text-[10px] font-semibold text-indigo-600">
                            {incident.strategic_tag}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </div>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Drawer: Intelligence Details & Field Dispatch */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 bottom-4 w-[460px] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 backdrop-blur overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedIncident.constituency && (
                    <button
                      onClick={() => {
                        if (!isPublic) {
                          const acLabel = selectedIncident.ac_number 
                            ? `AC ${selectedIncident.ac_number}: ${selectedIncident.constituency}` 
                            : (selectedIncident.constituency || null);
                          if (acLabel) setDeepDiveAC(acLabel);
                        }
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase ${
                        !isPublic ? 'hover:bg-amber-500/30 cursor-pointer' : ''
                      }`}
                    >
                      {selectedIncident.ac_number ? `AC ${selectedIncident.ac_number}: ` : ''}{selectedIncident.constituency}
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {selectedIncident.category}
                  </span>
                  {selectedIncident.verification_status === 'pending' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Pending Review
                    </span>
                  )}
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

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>

              {isPublic ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex-1 py-2.5 text-center border-b-2 border-transparent text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock size={12} />
                  <span>War-Room Playbook</span>
                </button>
              ) : (
                <>
                  {(userRole === 'admin' || (userRole === 'candidate' && warRoomLens !== politicalConfig.ruling_party)) && (
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
                  )}

                  {(userRole === 'admin' || (userRole === 'candidate' && warRoomLens === politicalConfig.ruling_party)) && (
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
                  )}
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {!isPublic && selectedIncident.ac_number && getMlaDetails(selectedIncident.ac_number) && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Sitting MLA</div>
                          <div className="text-xs font-bold text-slate-100">
                            {getMlaDetails(selectedIncident.ac_number)?.mla_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {getMlaDetails(selectedIncident.ac_number)?.party}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isPublic && (() => {
                    const acIncidents = filteredIncidents.filter(
                      (i) =>
                        (selectedIncident.ac_number && Number(i.ac_number) === Number(selectedIncident.ac_number)) ||
                        (selectedIncident.constituency && i.constituency === selectedIncident.constituency)
                    );
                    const count = acIncidents.length > 0 ? acIncidents.length : 1;
                    const highCount = acIncidents.filter((i) => i.severity === 'High').length;
                    const actionableCount = acIncidents.filter((i) => i.is_actionable).length;

                    const rawScore = (highCount * 35) + (actionableCount * 25) + (count * 15);
                    const score = Math.min(100, Math.max(25, rawScore));
                    const isSevere = score >= 65;
                    const isModerate = score >= 35 && score < 65;

                    return (
                      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{isRulingActive ? '🛡️' : '⚡'}</span>
                            <span>{isRulingActive ? 'Cadre Defense Priority' : 'Anti-Incumbency Vulnerability'}</span>
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded border font-mono ${
                              isSevere
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isModerate
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {isSevere ? 'SEVERE' : isModerate ? 'MODERATE' : 'LOW'} ({score}/100)
                          </span>
                        </div>

                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isSevere
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : isModerate
                                ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                          <span>
                            Constituency: <b className="text-amber-300">{selectedIncident.constituency || 'Target AC'}</b>
                          </span>
                          <div className="flex items-center gap-2">
                            <span>High: <b className="text-rose-400">{highCount}</b></span>
                            <span>•</span>
                            <span>Actionable: <b className="text-amber-400">{actionableCount}</b></span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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

                  {isPublic && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Lock size={14} />
                        <span>Political & Campaign Intelligence Protected</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Opposition attack charge-sheets, ruling counter-rebuttals, and micro-constituency vulnerability scores are restricted to authorized campaign war-room units.
                      </p>
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Authorize War-Room Session
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isPublic && activeTab === 'attack' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      Opposition Charge Point ({warRoomLens === 'THIRD_FRONT' ? 'Third Front' : warRoomLens} Lens)
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

              {!isPublic && activeTab === 'defense' && (
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

            {/* Bottom Actions: Proof + Admin Verify & Delete */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <a
                href={selectedIncident.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
              >
                <span>Examine Public Proof / Article</span>
                <ExternalLink size={13} />
              </a>

              {/* Admin Moderation Controls */}
              {userRole === 'admin' && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  {selectedIncident.verification_status === 'pending' && (
                    <button
                      onClick={() => handleVerifyIncident(selectedIncident.id)}
                      disabled={verifyingId === selectedIncident.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>{verifyingId === selectedIncident.id ? 'Publishing...' : 'Verify & Publish'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteIncident(selectedIncident.id)}
                    disabled={deletingId === selectedIncident.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{deletingId === selectedIncident.id ? 'Deleting...' : 'Delete Incident'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ground Cadre Grievance Submission Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ground Cadre Incident Dispatch</h3>
                  <p className="text-[11px] text-slate-400">
                    {userRole === 'admin' ? 'Immediate Verified Ingestion' : 'Submitted for Intelligence Verification'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitGroundReport} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Issue Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. குடிநீர் குழாய் உடைந்து சாலை சேதம் - பொதுமக்கள் மறியல்"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    District *
                  </label>
                  <select
                    value={reportForm.district}
                    onChange={(e) => setReportForm({ ...reportForm, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {districtList.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Assembly Constituency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai Central"
                    value={reportForm.constituency}
                    onChange={(e) => setReportForm({ ...reportForm, constituency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Civic Grievance">Civic Grievance</option>
                    <option value="Governance">Governance</option>
                    <option value="Law & Order">Law & Order</option>
                    <option value="Public Health">Public Health</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Education">Education</option>
                    <option value="Agriculture">Agriculture</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="High">High (Immediate Flashpoint)</option>
                    <option value="Medium">Medium (Ward Level)</option>
                    <option value="Low">Low (General Observation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Ground Details & Grievance Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="விவரங்கள் மற்றும் கள நிலவரம்..."
                  value={reportForm.summary}
                  onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Proof Link / Photo URL / News Report
                </label>
                <input
                  type="url"
                  placeholder="https://... (Optional)"
                  value={reportForm.proof_url}
                  onChange={(e) => setReportForm({ ...reportForm, proof_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {reportSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <Check size={16} />
                  <span>
                    {userRole === 'admin' 
                      ? 'Ground incident ingested and published successfully!' 
                      : 'Incident submitted to War-Room Verification Queue!'}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || reportSuccess}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {submittingReport ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{submittingReport ? 'Dispatching...' : 'Dispatch Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Constituency Deep Dive & Dossier Export Modal */}
      {deepDiveAC && deepDiveData && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                  <Building2 size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm md:text-base text-white truncate">{deepDiveData.acName}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                      {deepDiveData.district}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Constituency Vulnerability Profile & Ground Charge-Sheet</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  title="Print / Save Clean A4 Dossier PDF"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleWhatsAppBatchDispatch}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                  title="Send 3-Point Bulletin to WhatsApp Booth Groups"
                >
                  <MessageCircle size={13} />
                  <span>Forward</span>
                </button>

                <button
                  onClick={handleExportACDossier}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                  title="Copy Full A4 Briefing Dossier to Clipboard"
                >
                  {dossierExportCopied ? <Check size={13} className="text-emerald-300" /> : <FileText size={13} />}
                  <span>{dossierExportCopied ? 'Copied' : 'Export'}</span>
                </button>

                <button
                  onClick={() => setDeepDiveAC(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Sitting MLA</span>
                  <span className="font-bold text-sm text-slate-100 mt-0.5 block truncate">
                    {deepDiveData.mla ? deepDiveData.mla.mla_name : 'Data Ingesting...'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 mt-1 block">
                    {deepDiveData.mla ? `Party: ${deepDiveData.mla.party}` : 'Party Pending'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Vulnerability Score</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-black text-amber-400">{deepDiveData.score}/100</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      deepDiveData.score >= 65 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {deepDiveData.score >= 65 ? 'SEVERE' : 'MODERATE'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {deepDiveData.actionableList.length} Recorded Issues
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Ingested</span>
                  <span className="text-base font-black text-slate-100 mt-0.5 block">{deepDiveData.totalIncidents}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span className="text-rose-400">⚡ {deepDiveData.antiCount}</span>
                    <span>•</span>
                    <span className="text-emerald-400">🛡️ {deepDiveData.defCount}</span>
                    <span>•</span>
                    <span className="text-slate-400">🏛️ {deepDiveData.neutralCount}</span>
                  </div>
                </div>
              </div>

              {deepDiveData.categoryBreakdown.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PieChart size={13} className="text-amber-400" />
                      <span>Dominant Grievance Categories in AC</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{deepDiveData.categoryBreakdown.length} Sectors Active</span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2.5 flex overflow-hidden border border-slate-800">
                    {deepDiveData.categoryBreakdown.map((cat, idx) => {
                      const colors = ['bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-sky-500'];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={cat.name}
                          style={{ width: `${cat.percent}%` }}
                          className={`${color} h-full transition-all`}
                          title={`${cat.name}: ${cat.percent}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {deepDiveData.categoryBreakdown.map((cat, idx) => {
                      const dotColors = ['bg-amber-400', 'bg-rose-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-sky-400'];
                      return (
                        <div key={cat.name} className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] text-slate-300 font-medium">
                          <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                          <span>{cat.name}:</span>
                          <span className="font-bold text-slate-100">{cat.percent}%</span>
                          <span className="text-slate-500">({cat.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Flame size={14} className="text-amber-500" />
                    <span>Constituency Ground Flashpoints & Directives</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {deepDiveData.actionableList.length} Ground Incidents
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {deepDiveData.actionableList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.incident_date}</span>
                      </div>
                      <h5 className="font-semibold text-slate-200 text-xs">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isRulingActive ? (item.defense_angle || item.summary) : (item.attack_angle || item.summary)}
                      </p>
                    </div>
                  ))}

                  {deepDiveData.actionableList.length === 0 && (
                    <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No ground incidents recorded for this constituency.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Civic Matrix Analytics • Field Intelligence Unit
              </span>
              <button
                onClick={() => setDeepDiveAC(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-all cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* War-Room Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError('');
                setPasscode('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">War-Room Access Gateway</h3>
                <p className="text-xs text-slate-400">Restricted to authorized campaign strategists & candidates</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Candidate Party Affiliation (for candidate passcodes)
                </label>
                <select
                  value={candidateParty}
                  onChange={(e) => setCandidateParty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="DMK">DMK</option>
                  <option value="AIADMK">AIADMK</option>
                  <option value="TVK">TVK</option>
                  <option value="INC">Congress</option>
                  <option value="PMK">PMK</option>
                  <option value="BJP">BJP</option>
                  <option value="THIRD_FRONT">Third Front / Independent</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Security Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter passcode (e.g. admin2026 or candidate2026)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError('');
                    setPasscode('');
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md"
                >
                  Unlock War-Room
                </button>
              </div>
            </form>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3 flex justify-between">
              <span>Admin: <code>admin2026</code></span>
              <span>Candidate: <code>candidate2026</code></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}