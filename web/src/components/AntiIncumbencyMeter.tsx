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

  const metrics = useMemo(() => {
    // Incidents empty-aa irundhaalum default 1 incident base weight edukkum
    const list = incidents && incidents.length > 0 ? incidents : [{ severity: 'Medium', is_actionable: true, political_sentiment: 'anti_incumbency' }];

    let calculated = 0;
    let high = 0;
    let actionable = 0;

    list.forEach((item) => {
      if (item.severity === 'High') {
        calculated += 30;
        high += 1;
      } else if (item.severity === 'Medium') {
        calculated += 18;
      } else {
        calculated += 8;
      }

      if (item.is_actionable) {
        calculated += 20;
        actionable += 1;
      }

      if (item.political_sentiment === 'anti_incumbency') {
        calculated += 15;
      }
    });

    const finalScore = Math.min(100, Math.max(15, Math.round(calculated)));

    let riskLevel = 'LOW';
    let riskColor = 'emerald';

    if (finalScore >= 65) {
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
    <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 my-2 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>{isRuling ? '🛡️' : '⚡'}</span>
          <span>{isRuling ? 'Cadre Defense Priority' : 'Anti-Incumbency Vulnerability'}</span>
        </span>
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded border font-mono ${
            metrics.level === 'SEVERE'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : metrics.level === 'MODERATE'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {metrics.level} ({metrics.score}/100)
        </span>
      </div>

      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            metrics.level === 'SEVERE'
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : metrics.level === 'MODERATE'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${metrics.score}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>
          Constituency: <b className="text-amber-300">{constituencyName || 'Field AC'}</b>
        </span>
        <div className="flex items-center gap-2">
          <span>High: <b className="text-rose-400">{metrics.highCount}</b></span>
          <span>•</span>
          <span>Actionable: <b className="text-amber-400">{metrics.actionableCount}</b></span>
        </div>
      </div>
    </div>
  );
};