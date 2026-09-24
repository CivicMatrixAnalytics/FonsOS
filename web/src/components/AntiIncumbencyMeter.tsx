import React, { useMemo } from 'react';

interface IncidentData {
  id: string;
  severity?: 'High' | 'Medium' | 'Low' | string;
  is_actionable?: boolean;
  category?: string;
  political_sentiment?: 'anti_incumbency' | 'ruling_defense' | 'neutral' | string;
}

interface MeterProps {
  acNumber?: number | null;
  constituencyName?: string | null;
  incidents: IncidentData[];
  lens: string;
  rulingParty: string;
}

export const AntiIncumbencyMeter: React.FC<MeterProps> = ({
  constituencyName,
  incidents,
  lens,
  rulingParty,
}) => {
  const isRuling = lens === rulingParty;

  // Pure reactive client-side scoring formula
  const metrics = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return {
        score: 0,
        highCount: 0,
        actionableCount: 0,
        level: 'LOW',
        color: 'emerald',
      };
    }

    let calculated = 0;
    let high = 0;
    let actionable = 0;

    incidents.forEach((item) => {
      if (item.severity === 'High') {
        calculated += 25;
        high += 1;
      } else if (item.severity === 'Medium') {
        calculated += 12;
      } else {
        calculated += 5;
      }

      if (item.is_actionable) {
        calculated += 15;
        actionable += 1;
      }

      if (item.political_sentiment === 'anti_incumbency') {
        calculated += 10;
      }
    });

    // Score ni 0 nundi 100 madhya cap chesthunnam
    const finalScore = Math.min(100, Math.round(calculated));

    let riskLevel = 'LOW';
    let riskColor = 'emerald';

    if (finalScore >= 70) {
      riskLevel = 'SEVERE';
      riskColor = 'rose';
    } else if (finalScore >= 35) {
      riskLevel = 'MODERATE';
      riskColor = 'amber';
    }

    return {
      score: finalScore,
      highCount: high,
      actionableCount: actionable,
      level: riskLevel,
      color: riskColor,
    };
  }, [incidents]);

  return (
    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
      {/* Header with Lens-Aware Metric Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>{isRuling ? '🛡️' : '⚡'}</span>
          <span>{isRuling ? 'Cadre Defense Priority' : 'Anti-Incumbency Vulnerability'}</span>
        </span>
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border font-mono ${
            metrics.level === 'SEVERE'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : metrics.level === 'MODERATE'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {metrics.level} ({metrics.score}/100)
        </span>
      </div>

      {/* Progress Meter Bar */}
      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${
            metrics.level === 'SEVERE'
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : metrics.level === 'MODERATE'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.max(8, metrics.score)}%` }}
        />
      </div>

      {/* Breakdown Badges */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-medium">
        <span>
          Scope: <b className="text-slate-200">{constituencyName || 'Constituency'}</b>
        </span>
        <div className="flex items-center gap-2">
          <span>High Severity: <b className="text-rose-400">{metrics.highCount}</b></span>
          <span>•</span>
          <span>Actionable: <b className="text-amber-400">{metrics.actionableCount}</b></span>
        </div>
      </div>
    </div>
  );
};