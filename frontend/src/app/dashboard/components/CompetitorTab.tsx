import React from "react";
import { Compass, RefreshCw, Share2, Check, ShieldAlert } from "lucide-react";
import { CompetitorAnalysis, BusinessInfo } from "@/hooks/useDashboardData";

interface CompetitorTabProps {
  competitorUrl: string;
  setCompetitorUrl: (val: string) => void;
  competitorLoading: boolean;
  competitorLogs: string[];
  handleStartCompetitor: (e: React.FormEvent) => void;
  competitorAnalyses: CompetitorAnalysis[];
  business: BusinessInfo | null;
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
    <div className="space-y-8 pb-10">
      <div>
        <h3 className="text-xl font-bold text-white">Competitor Domain Intelligence</h3>
        <p className="text-xs text-muted-text mt-1">Audit competitor sites to map comparative services, offering gaps, and content optimization opportunities.</p>
      </div>

      {/* Form Input */}
      <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
          <Compass className="h-4.5 w-4.5 text-accent-primary" />
          Analyze Competitor website
        </h4>
        <form onSubmit={handleStartCompetitor} className="flex gap-3">
          <input
            type="url"
            required
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="e.g. https://competitor.com"
            className="flex-1 rounded-xl bg-card border border-card-border px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={competitorLoading || !competitorUrl}
            className="bg-accent-primary hover:bg-accent-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
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
          <div className="rounded-xl bg-background border border-card-border p-4 font-mono text-[11px] text-accent-primary space-y-1 overflow-y-auto max-h-40 leading-relaxed shadow-inner">
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
            <div key={ca.id} className="rounded-2xl border border-card-border bg-card/10 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-card-border pb-4">
                <h4 className="font-bold text-sm text-white">
                  Target: <span className="text-accent-primary">{ca.competitorUrl}</span>
                </h4>
                <span className="text-xs text-muted-text">
                  Audited: {new Date(ca.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Service Comparison Matrix */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-primary" />
                  Service Comparison Matrix
                </h5>
                <div className="overflow-x-auto border border-card-border rounded-xl bg-background shadow-inner">
                  <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                    <thead className="bg-card border-b border-card-border font-bold uppercase text-muted-text">
                      <tr>
                        <th className="px-4 py-3">Feature</th>
                        <th className="px-4 py-3">Us ({business?.companyName || "Us"})</th>
                        <th className="px-4 py-3">Competitor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/60">
                      {ca.analysis.serviceCompare.map((sc, i) => (
                        <tr key={i} className="hover:bg-card/25">
                          <td className="px-4 py-3 font-semibold text-slate-200">{sc.feature}</td>
                          <td className="px-4 py-3 text-accent-primary font-bold">{sc.us}</td>
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
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-text flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Our Missing Offerings
                  </h5>
                  <ul className="space-y-2.5 p-4 rounded-xl bg-background border border-card-border shadow-inner">
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
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-text flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-blue-400" />
                    SEO Keyword / Content Gaps
                  </h5>
                  <ul className="space-y-2.5 p-4 rounded-xl bg-background border border-card-border shadow-inner">
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
        <div className="border border-card-border border-dashed rounded-2xl p-12 text-center text-muted-text text-sm">
          No competitor audits run yet. Enter competitor domain above to evaluate market gaps.
        </div>
      )}
    </div>
  );
};
