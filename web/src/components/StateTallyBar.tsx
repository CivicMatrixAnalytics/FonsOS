import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Unga existing supabase client path

interface TallyCount {
  party: string;
  count: number;
}

interface Props {
  selectedParty: string | null;
  onSelectParty: (party: string | null) => void;
}

export const StateTallyBar: React.FC<Props> = ({ selectedParty, onSelectParty }) => {
  const [tallies, setTallies] = useState<TallyCount[]>([]);
  const [totalSeats, setTotalSeats] = useState(0);

  useEffect(() => {
    async function fetchTally() {
      const { data, error } = await supabase
        .from('assembly_constituencies')
        .select('party');

      if (data && !error) {
        const counts: Record<string, number> = {};
        data.forEach((r) => {
          const p = r.party || 'IND';
          counts[p] = (counts[p] || 0) + 1;
        });

        const sorted = Object.entries(counts)
          .map(([party, count]) => ({ party, count }))
          .sort((a, b) => b.count - a.count);

        setTallies(sorted);
        setTotalSeats(data.length);
      }
    }
    fetchTally();
  }, []);

  const getPartyColors = (party: string) => {
    switch (party?.toUpperCase()) {
      case 'TVK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      case 'DMK':
        return 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30';
      case 'AIADMK':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'INC':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30';
      case 'BJP':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30';
      case 'PMK':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30';
      case 'VCK':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700';
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md scrollbar-none text-xs">
      <span className="text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap text-[11px] pr-2 border-r border-slate-800">
        17th TN Assembly ({totalSeats}):
      </span>

      <button
        onClick={() => onSelectParty(null)}
        className={`px-2.5 py-1 rounded-md font-bold whitespace-nowrap border transition-all ${
          selectedParty === null
            ? 'bg-slate-200 text-slate-900 border-white shadow'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
        }`}
      >
        ALL (234)
      </button>

      {tallies.map(({ party, count }) => {
        const isSelected = selectedParty === party;
        return (
          <button
            key={party}
            onClick={() => onSelectParty(isSelected ? null : party)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold whitespace-nowrap border transition-all ${
              isSelected ? 'ring-2 ring-white/90 scale-105 ' + getPartyColors(party) : getPartyColors(party)
            }`}
          >
            <span>{party}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};