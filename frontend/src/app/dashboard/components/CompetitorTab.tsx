import React from "react";
import { Compass, RefreshCw, Share2, Check, ShieldAlert } from "lucide-react";

interface CompetitorAnalysis {
  id: string;
  competitorUrl: string;
  analysis: {
    serviceCompare: Array<{ feature: string; us: string; competitor: string }>;
    missingOfferings: string[];
    contentGaps: string[];
  };
  createdAt: string;
}

interface CompetitorTabProps {
  competitorUrl: string;
  setCompetitorUrl: (val: string) => void;
  competitorLoading: boolean;
  competitorLogs: string[];
  handleStartCompetitor: (e: React.FormEvent) => void;
  competitorAnalyses: CompetitorAnalysis[];
  business: any;
}

export const CompetitorTab: React.FC<CompetitorTabProps> = ({
  competitorUrl,
  setCompetitorUrl,
  competitorLoading,
  competitorLogs,
  handleStartCompetitor,
  competitorAnalyses,
  business,
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">Competitor Domain Intelligence</h3>
        <p className="text-xs text-slate-500 mt-1">Audit competitor sites to map comparative services, offering gaps, and content optimization opportunities.</p>
      </div>

      {/* Form Input */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Compass className="h-4.5 w-4.5 text-emerald-400" />
          Analyze Competitor website
        </h4>
        <form onSubmit={handleStartCompetitor} className="flex gap-3">
          <input
            type="url"
            required
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="e.g. https://competitor.com"
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={competitorLoading || !competitorUrl}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {competitorLoading ? (
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Share2 className="h-4.5 w-4.5" />
            )}
            Analyze Domain
          </button>
        </form>

        {competitorLogs.length > 0 && (
          <div className="rounded-xl bg-slate-950 border border-slate-900 p-4 font-mono text-[11px] text-emerald-500 space-y-1 overflow-y-auto max-h-40 leading-relaxed shadow-inner">
            {competitorLogs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-emerald-800 shrink-0">[{i+1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Display */}
      {competitorAnalyses.length > 0 ? (
        <div className="space-y-8">
          {competitorAnalyses.map((ca) => (
            <div key={ca.id} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <h4 className="font-bold text-sm text-white">
                  Target: <span className="text-emerald-400">{ca.competitorUrl}</span>
                </h4>
                <span className="text-xs text-slate-500">
                  Audited: {new Date(ca.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Service Comparison Matrix */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Service Comparison Matrix
                </h5>
                <div className="overflow-hidden border border-slate-900 rounded-xl bg-slate-950">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-slate-900/50 border-b border-slate-900 font-bold uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Feature</th>
                        <th className="px-4 py-3">Us ({business.companyName})</th>
                        <th className="px-4 py-3">Competitor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {ca.analysis.serviceCompare.map((sc, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="px-4 py-3 font-semibold text-slate-200">{sc.feature}</td>
                          <td className="px-4 py-3 text-emerald-400">{sc.us}</td>
                          <td className="px-4 py-3 text-slate-400">{sc.competitor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing offerings */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Our Missing Offerings
                  </h5>
                  <ul className="space-y-2.5 p-4 rounded-xl bg-slate-950 border border-slate-900">
                    {ca.analysis.missingOfferings.map((mo, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                        <span>{mo}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Content Gaps */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-blue-400" />
                    SEO Keyword / Content Gaps
                  </h5>
                  <ul className="space-y-2.5 p-4 rounded-xl bg-slate-950 border border-slate-900">
                    {ca.analysis.contentGaps.map((cg, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
                        <span>{cg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-slate-900 border-dashed rounded-2xl p-12 text-center text-slate-500 text-sm">
          No competitor audits run yet. Enter competitor domain above to evaluate market gaps.
        </div>
      )}
    </div>
  );
};
