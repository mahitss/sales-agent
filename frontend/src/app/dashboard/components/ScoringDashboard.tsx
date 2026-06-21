"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Sparkles,
  Zap,
  Activity,
  Users,
  Target,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Search,
  MessageSquare,
  Mail,
  MousePointer,
  Briefcase,
  Play
} from "lucide-react";

interface ScoringDashboardProps {
  businessId: string;
  token: string;
  API_URL: string;
  onViewLead?: (leadId: string) => void;
}

export const ScoringDashboard: React.FC<ScoringDashboardProps> = ({
  businessId,
  token,
  API_URL,
  onViewLead,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [rescoringId, setRescoringId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStats = useCallback(async () => {
    if (!businessId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/leads/business/${businessId}/score-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch scoring stats");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [businessId, token, API_URL]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleManualRescore = async (leadId: string) => {
    if (rescoringId) return;
    setRescoringId(leadId);
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/score`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Scoring execution failed");
      }
      // Re-fetch stats to update the UI
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to re-score lead");
    } finally {
      setRescoringId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-text">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-primary" />
          <p className="text-sm font-semibold animate-pulse">Analyzing scoring registry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-xl mx-auto border border-red-500/20 bg-red-500/5 rounded-2xl p-6 text-center">
          <Target className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-white mb-1">Failed to load lead scoring dashboard</h3>
          <p className="text-xs text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-xs font-bold border border-red-500/30 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const averages = stats?.averagesBreakdown || {
    buyingIntent: 0,
    companyGrowth: 0,
    hiringSignals: 0,
    engagementActivity: 0,
    websiteActivity: 0,
    emailActivity: 0,
  };

  const priorityDist = stats?.priorityDistribution || { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const classDist = stats?.classificationDistribution || { HOT: 0, WARM: 0, COLD: 0 };
  const history = stats?.recentScoringHistory || [];

  const filteredHistory = history.filter((h: any) =>
    h.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.leadEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-primary animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white">AI Lead Scoring & Intent</h1>
          </div>
          <p className="text-xs text-muted-text">
            Advanced real-time prospect qualification mapping Intent, Growth, Hiring, and Outreach signals.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-card-border hover:border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Recalculate Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Target className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Avg. Lead Quality</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              Optimal
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{stats?.averageScore || 0}%</h2>
            <p className="text-[10px] text-muted-text mt-1">Consolidated prospect engagement index</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">High Priority</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-extrabold uppercase">
              Urgent Followup
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{priorityDist.HIGH || 0} Leads</h2>
            <p className="text-[10px] text-muted-text mt-1">Prospects scored above 75% Intent</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Total Evaluated</span>
            <span className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary text-[10px] font-extrabold uppercase">
              Registry
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{stats?.totalScored || 0} Profiles</h2>
            <p className="text-[10px] text-muted-text mt-1">Leads with active scoring dossiers</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Growth Matched</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-extrabold flex items-center gap-0.5">
              Strong
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">
              {classDist.HOT + classDist.WARM} Active
            </h2>
            <p className="text-[10px] text-muted-text mt-1">Leads classified as Hot or Warm</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria Breakdown Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-card-border bg-card/25 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent-primary" />
              Lead Criteria Sub-Score Performance
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Average aggregate scores across the 6 major intelligence metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Criteria 1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-red-400" />
                  Buying Intent
                </span>
                <span className="font-black text-white">{averages.buyingIntent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${averages.buyingIntent}%` }}
                />
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  Company Growth Signals
                </span>
                <span className="font-black text-white">{averages.companyGrowth}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${averages.companyGrowth}%` }}
                />
              </div>
            </div>

            {/* Criteria 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                  Hiring Signals
                </span>
                <span className="font-black text-white">{averages.hiringSignals}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${averages.hiringSignals}%` }}
                />
              </div>
            </div>

            {/* Criteria 4 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                  Engagement Activity
                </span>
                <span className="font-black text-white">{averages.engagementActivity}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${averages.engagementActivity}%` }}
                />
              </div>
            </div>

            {/* Criteria 5 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MousePointer className="h-3.5 w-3.5 text-pink-400" />
                  Website Activity
                </span>
                <span className="font-black text-white">{averages.websiteActivity}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-pink-400"
                  style={{ width: `${averages.websiteActivity}%` }}
                />
              </div>
            </div>

            {/* Criteria 6 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  Email Activity
                </span>
                <span className="font-black text-white">{averages.emailActivity}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${averages.emailActivity}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Distributions Box */}
        <div className="p-6 rounded-2xl border border-card-border bg-card/25 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-primary" />
              Segmentation Breakdown
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Segmentation by priority levels and AI pipeline status
            </p>
          </div>

          <div className="space-y-4">
            {/* Priority Distribution */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-text">
                Priority Distribution
              </span>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 flex gap-1 h-3 rounded-full overflow-hidden bg-slate-900">
                  {priorityDist.HIGH > 0 && (
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(priorityDist.HIGH / stats?.totalScored) * 100}%` }}
                      title={`High: ${priorityDist.HIGH}`}
                    />
                  )}
                  {priorityDist.MEDIUM > 0 && (
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(priorityDist.MEDIUM / stats?.totalScored) * 100}%` }}
                      title={`Medium: ${priorityDist.MEDIUM}`}
                    />
                  )}
                  {priorityDist.LOW > 0 && (
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(priorityDist.LOW / stats?.totalScored) * 100}%` }}
                      title={`Low: ${priorityDist.LOW}`}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  High: {priorityDist.HIGH || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Medium: {priorityDist.MEDIUM || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Low: {priorityDist.LOW || 0}
                </span>
              </div>
            </div>

            {/* Classification Distribution */}
            <div className="space-y-2 pt-2 border-t border-card-border/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-text">
                Pipeline Stages
              </span>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 flex gap-1 h-3 rounded-full overflow-hidden bg-slate-900">
                  {classDist.HOT > 0 && (
                    <div
                      className="bg-red-400 h-full"
                      style={{ width: `${(classDist.HOT / stats?.totalScored) * 100}%` }}
                    />
                  )}
                  {classDist.WARM > 0 && (
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${(classDist.WARM / stats?.totalScored) * 100}%` }}
                    />
                  )}
                  {classDist.COLD > 0 && (
                    <div
                      className="bg-blue-400 h-full"
                      style={{ width: `${(classDist.COLD / stats?.totalScored) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Hot: {classDist.HOT || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Warm: {classDist.WARM || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Cold: {classDist.COLD || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Log Section */}
      <div className="p-6 rounded-2xl border border-card-border bg-card/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-card-border/40">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-accent-primary" />
              Scoring History Log
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Timeline of automated and manual prospect score updates
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-text" />
            <input
              type="text"
              placeholder="Search history by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-xl bg-slate-900 border border-card-border focus:outline-none focus:border-accent-primary text-white"
            />
          </div>
        </div>

        {/* Scoring Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-card-border/40 text-[10px] uppercase font-bold text-muted-text">
                <th className="py-3 px-4">Prospect</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4">AI Reasoning Snippet</th>
                <th className="py-3 px-4">Evaluation Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-text">
                    No matching scoring records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h: any) => (
                  <tr key={h.id} className="border-b border-card-border/20 hover:bg-card/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <button
                          onClick={() => onViewLead && onViewLead(h.leadId)}
                          className="font-bold text-white hover:text-accent-primary cursor-pointer hover:underline text-left block"
                        >
                          {h.leadName}
                        </button>
                        <span className="text-[10px] text-muted-text block">{h.leadEmail}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-black ${
                        h.score >= 75 ? "bg-red-500/10 text-red-400" :
                        h.score >= 45 ? "bg-amber-500/10 text-amber-400" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>
                        {h.score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${
                        h.priority === "HIGH" ? "text-red-400 bg-red-400/10 border border-red-500/20" :
                        h.priority === "MEDIUM" ? "text-amber-400 bg-amber-400/10 border border-amber-500/20" :
                        "text-blue-400 bg-blue-400/10 border border-blue-500/20"
                      }`}>
                        {h.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-text italic max-w-xs truncate">
                      {h.reasoningSnippet}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleManualRescore(h.leadId)}
                        disabled={rescoringId === h.leadId}
                        className="p-1 px-2.5 rounded-lg bg-slate-900 border border-card-border hover:border-accent-primary text-slate-300 hover:text-white transition-all text-[10px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${rescoringId === h.leadId ? "animate-spin text-accent-primary" : ""}`} />
                        {rescoringId === h.leadId ? "Scoring..." : "Re-score"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
