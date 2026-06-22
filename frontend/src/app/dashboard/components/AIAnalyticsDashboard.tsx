"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Sparkles,
  Zap,
  Activity,
  DollarSign,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  HelpCircle,
  Eye,
  Calendar,
  Cpu
} from "lucide-react";

interface AICostLog {
  id: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  action: string;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
  createdAt: string;
}

interface AIAnalyticsDashboardProps {
  businessId: string;
  token: string;
  API_URL: string;
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({
  businessId,
  token,
  API_URL,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AICostLog | null>(null);

  const fetchStats = useCallback(async () => {
    if (!businessId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/business/${businessId}/ai-usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch AI usage analytics");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load AI usage analytics");
    } finally {
      setLoading(false);
    }
  }, [businessId, token, API_URL]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-text">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-primary" />
          <p className="text-sm font-semibold animate-pulse">Aggregating token consumption telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-xl mx-auto border border-red-500/20 bg-red-500/5 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-white mb-1">Telemetry Disconnected</h3>
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

  const totalQueries = stats?.totalQueries || 0;
  const totalCost = stats?.totalCost || 0;
  const totalTokens = stats?.totalTokens || 0;
  const totalPromptTokens = stats?.totalPromptTokens || 0;
  const totalCompletionTokens = stats?.totalCompletionTokens || 0;
  const successfulQueries = stats?.successfulQueries || 0;
  const failedQueries = stats?.failedQueries || 0;
  const successRate = stats?.successRate !== undefined ? stats.successRate : 100;
  const failureRate = stats?.failureRate !== undefined ? stats.failureRate : 0;
  const byAction = stats?.byAction || {};
  const history: AICostLog[] = stats?.history || [];

  const filteredHistory = history.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.errorMessage && log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-accent-primary animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white">AI Engine Analytics & Cost</h1>
          </div>
          <p className="text-xs text-muted-text">
            Monitor API token throughput, cost analytics, and request success telemetry across direct OpenRouter integrations.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-card-border hover:border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh telemetry
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Cost */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Aggregate AI Spend</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold flex items-center">
              Active
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">${totalCost.toFixed(4)}</h2>
            <p className="text-[10px] text-muted-text mt-1">Calculated via OpenRouter billing weights</p>
          </div>
        </div>

        {/* Card 2: Total Queries */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Total API Queries</span>
            <span className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary text-[10px] font-extrabold uppercase">
              Operations
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{totalQueries} requests</h2>
            <p className="text-[10px] text-muted-text mt-1">{successfulQueries} succeeded | {failedQueries} failed</p>
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CheckCircle className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Request Success Rate</span>
            <span className={`p-1.5 rounded-lg text-[10px] font-extrabold uppercase ${
              successRate >= 95 ? "bg-emerald-500/10 text-emerald-400" :
              successRate >= 80 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
            }`}>
              {successRate >= 95 ? "Excellent" : "Investigate"}
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{successRate.toFixed(1)}%</h2>
            <p className="text-[10px] text-muted-text mt-1">Target SLA threshold standard: 99.0%</p>
          </div>
        </div>

        {/* Card 4: Total Tokens */}
        <div className="p-5 rounded-2xl border border-card-border bg-card/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="h-20 w-20 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Total Tokens Flow</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold uppercase">
              Throughput
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{(totalTokens / 1000).toFixed(1)}k</h2>
            <p className="text-[10px] text-muted-text mt-1">Prompt: {(totalPromptTokens / 1000).toFixed(1)}k | Compl: {(totalCompletionTokens / 1000).toFixed(1)}k</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Split & Details */}
        <div className="p-6 rounded-2xl border border-card-border bg-card/25 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent-primary" />
              Token Budget Allocation
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Structural distribution of raw tokens consumed by AI context windows.
            </p>
          </div>

          <div className="space-y-5">
            {/* Prompt Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Input (Prompt) Tokens</span>
                <span className="text-white font-bold">{totalPromptTokens.toLocaleString()} ({totalTokens > 0 ? ((totalPromptTokens / totalTokens) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${totalTokens > 0 ? (totalPromptTokens / totalTokens) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Completion Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Output (Generation) Tokens</span>
                <span className="text-white font-bold">{totalCompletionTokens.toLocaleString()} ({totalTokens > 0 ? ((totalCompletionTokens / totalTokens) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${totalTokens > 0 ? (totalCompletionTokens / totalTokens) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* SLA Failure rate */}
            <div className="space-y-2 pt-4 border-t border-card-border/40">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Error Rate</span>
                <span className="text-red-400 font-bold">{failureRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${failureRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Specific breakdown */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-card-border bg-card/25 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Resource Allocation by Model Action
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Categorized tracking of execution frequency and cumulative billing weights per AI task.
            </p>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {Object.keys(byAction).length === 0 ? (
              <p className="text-xs text-muted-text text-center py-8">No action usage logs registered.</p>
            ) : (
              Object.entries(byAction).map(([action, entry]: [string, any]) => {
                const percentageOfSpend = totalCost > 0 ? (entry.cost / totalCost) * 100 : 0;
                return (
                  <div key={action} className="space-y-1.5 p-3 rounded-xl border border-card-border/40 bg-card/10 hover:border-slate-800 transition-all">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white capitalize">{action.replace(/-/g, " ")}</span>
                      <span className="text-slate-300 font-bold">
                        {entry.count} queries | ${entry.cost.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${percentageOfSpend}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold w-8 text-right">
                        {percentageOfSpend.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* History Log Section */}
      <div className="p-6 rounded-2xl border border-card-border bg-card/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-card-border/40">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-accent-primary" />
              AI Execution Registry
            </h2>
            <p className="text-[10px] text-muted-text mt-0.5">
              Live audit logs of recent generative queries executed through backend services.
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-text" />
            <input
              type="text"
              placeholder="Filter by action or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-xl bg-slate-900 border border-card-border focus:outline-none focus:border-accent-primary text-white"
            />
          </div>
        </div>

        {/* Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-card-border/40 text-[10px] uppercase font-bold text-muted-text">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">LLM Model</th>
                <th className="py-3 px-4 text-center">Prompt/Completion</th>
                <th className="py-3 px-4 text-center">Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Executed At</th>
                <th className="py-3 px-4 text-right">Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-text">
                    No registered telemetry records match the search.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((log) => (
                  <tr key={log.id} className="border-b border-card-border/20 hover:bg-card/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white capitalize">
                      {log.action.replace(/-/g, " ")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[10px]">
                      {log.model.split("/").pop()}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {log.promptTokens} / {log.completionTokens}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white font-mono">
                      ${log.cost.toFixed(5)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-[10px]">
                      <span className={`px-2.5 py-0.5 rounded-full inline-block ${
                        log.status === "SUCCESS"
                          ? "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20"
                          : "text-red-400 bg-red-400/10 border border-red-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 px-2 rounded-lg bg-slate-900 border border-card-border hover:border-accent-primary text-slate-300 hover:text-white transition-all text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspector Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-card-border bg-slate-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-accent-primary" />
                Query Telemetry Inspector
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">LLM Target Model</span>
                  <span className="font-mono text-white text-[11px] mt-1 block">{selectedLog.model}</span>
                </div>
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Action Code</span>
                  <span className="font-bold text-white mt-1 block capitalize">{selectedLog.action.replace(/-/g, " ")}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40 text-center">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Prompt Tokens</span>
                  <span className="font-mono font-bold text-white text-sm mt-0.5 block">{selectedLog.promptTokens}</span>
                </div>
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40 text-center">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Completion Tokens</span>
                  <span className="font-mono font-bold text-white text-sm mt-0.5 block">{selectedLog.completionTokens}</span>
                </div>
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40 text-center">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Computed Cost</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">${selectedLog.cost.toFixed(6)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Execution State</span>
                  <span className={`font-extrabold text-[11px] mt-1 inline-block px-2 py-0.5 rounded ${
                    selectedLog.status === "SUCCESS" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-card/25 border border-card-border/40">
                  <span className="text-[10px] text-muted-text uppercase font-bold block">Timestamp</span>
                  <span className="text-slate-300 mt-1 block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1">
                  <span className="text-[10px] text-red-400 uppercase font-extrabold block">Error Stack / Message</span>
                  <p className="font-mono text-red-300 text-[10px] leading-relaxed break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-card-border/60">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-card-border text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
