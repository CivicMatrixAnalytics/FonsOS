import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export interface ConstituencyRecord {
  ac_number: number;
  ac_name: string;
  district: string;
  sitting_mla: string;
  party: string;
}

interface Props {
  selectedAcNumber?: number;
  onSelectConstituency?: (ac: ConstituencyRecord) => void;
}

export const ConstituencyIntelligence: React.FC<Props> = ({
  selectedAcNumber = 13, // Default to Kolathur
  onSelectConstituency,
}) => {
  const [constituencies, setConstituencies] = useState<ConstituencyRecord[]>([]);
  const [partyTally, setPartyTally] = useState<Record<string, number>>({});
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConstituencyData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('assembly_constituencies')
        .select('ac_number, ac_name, district, sitting_mla, party')
        .order('ac_number', { ascending: true });

      if (data && !error) {
        setConstituencies(data);

        // Aggregate party seat share
        const tally: Record<string, number> = {};
        data.forEach((row) => {
          const party = row.party || 'IND';
          tally[party] = (tally[party] || 0) + 1;
        });
        setPartyTally(tally);
      }
      setLoading(false);
    }

    loadConstituencyData();
  }, []);

  const activeConstituency =
    constituencies.find((c) => c.ac_number === selectedAcNumber) || constituencies[0];

  // Helper for dynamic party theme badges
  const getPartyBadgeStyle = (party: string) => {
    switch (party?.toUpperCase()) {
      case 'TVK':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'DMK':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'AIADMK':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INC':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'BJP':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const filteredConstituencies = selectedPartyFilter
    ? constituencies.filter((c) => c.party === selectedPartyFilter)
    : constituencies;

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse text-slate-400 text-sm">
        Connecting to Assembly Registry & aggregates...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. STATE-WIDE LEGISLATIVE TALLY BAR */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              17th Tamil Nadu Legislative Assembly (2026)
            </h2>
            <p className="text-xl font-black text-white tracking-tight">
              State-wide Legislative Assembly Tally
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700">
            Total Seats: 234 / 234
          </span>
        </div>

        {/* Tally Chips */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedPartyFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedPartyFilter === null
                ? 'bg-slate-100 text-slate-900 border-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            All (234)
          </button>

          {Object.entries(partyTally)
            .sort(([, a], [, b]) => b - a)
            .map(([party, count]) => (
              <button
                key={party}
                onClick={() =>
                  setSelectedPartyFilter(selectedPartyFilter === party ? null : party)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedPartyFilter === party
                    ? 'ring-2 ring-white/80 ' + getPartyBadgeStyle(party)
                    : getPartyBadgeStyle(party)
                }`}
              >
                <span>{party}</span>
                <span className="font-mono opacity-80">({count})</span>
              </button>
            ))}
        </div>
      </div>

      {/* 2. SELECTED CONSTITUENCY COMMAND BADGE */}
      {activeConstituency && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
                  AC {String(activeConstituency.ac_number).padStart(3, '0')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {activeConstituency.district} District
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {activeConstituency.ac_name}
              </h1>
            </div>

            {/* Incumbent Badge */}
            <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md px-5 py-3 rounded-xl border border-slate-700/80 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Sitting MLA (Incumbent)
                </span>
                <span className="text-base font-extrabold text-white">
                  {activeConstituency.sitting_mla}
                </span>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm ${getPartyBadgeStyle(
                  activeConstituency.party
                )}`}
              >
                {activeConstituency.party}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};