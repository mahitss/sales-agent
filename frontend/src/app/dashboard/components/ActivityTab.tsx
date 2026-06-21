"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldX,
  LogIn,
  LogOut,
  UserCheck,
  Users,
  Layers,
  Zap,
  CreditCard,
  Mail,
  Key,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
  Activity,
  TrendingUp,
  AlertTriangle,
  User,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AuditMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AuditStats {
  total: number;
  last24h: number;
  criticalCount: number;
  warnCount: number;
  actionBreakdown: { action: string; count: number }[];
  topActors: { userId: string; name: string; email: string; count: number }[];
}

interface AuditActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ActivityTabProps {
  businessId: string;
  token: string;
  API_URL: string;
  // Legacy fallback
  activityLogs?: AuditLog[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "AUTH_LOGIN", label: "Auth Login" },
  { value: "AUTH_LOGOUT", label: "Auth Logout" },
  { value: "AUTH_REGISTER", label: "Auth Register" },
  { value: "LEAD_CREATED", label: "Lead Created" },
  { value: "LEAD_UPDATED", label: "Lead Updated" },
  { value: "LEAD_DELETED", label: "Lead Deleted" },
  { value: "PIPELINE_CHANGED", label: "Pipeline Changed" },
  { value: "WORKFLOW_TRIGGERED", label: "Workflow Triggered" },
  { value: "WORKFLOW_CREATED", label: "Workflow Created" },
  { value: "WORKFLOW_DELETED", label: "Workflow Deleted" },
  { value: "EMAIL_SENT", label: "Email Sent" },
  { value: "BILLING_CHECKOUT", label: "Billing Checkout" },
  { value: "BILLING_CHANGED", label: "Billing Changed" },
  { value: "ROLE_CHANGED", label: "Role Changed" },
  { value: "API_KEY_CREATED", label: "API Key Created" },
  { value: "API_KEY_REVOKED", label: "API Key Revoked" },
  { value: "AI_RESEARCH_STARTED", label: "AI Research" },
  { value: "PASSWORD_RESET", label: "Password Reset" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "User", label: "User" },
  { value: "Lead", label: "Lead" },
  { value: "Workflow", label: "Workflow" },
  { value: "Billing", label: "Billing" },
  { value: "EmailActivity", label: "Email" },
  { value: "ApiKey", label: "API Key" },
  { value: "AccountResearch", label: "AI Research" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "INFO", label: "Info" },
  { value: "WARN", label: "Warning" },
  { value: "CRITICAL", label: "Critical" },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border";
  if (severity === "CRITICAL")
    return (
      <span className={`${base} bg-red-500/10 text-red-400 border-red-500/20`}>
        <ShieldX className="h-2.5 w-2.5" /> Critical
      </span>
    );
  if (severity === "WARN")
    return (
      <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20`}>
        <ShieldAlert className="h-2.5 w-2.5" /> Warning
      </span>
    );
  return (
    <span className={`${base} bg-slate-700/60 text-slate-400 border-slate-700`}>
      <Shield className="h-2.5 w-2.5" /> Info
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const label = action.replace(/_/g, " ");
  const colorMap: Record<string, string> = {
    AUTH_LOGIN:          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    AUTH_LOGOUT:         "bg-slate-700/60 text-slate-400 border-slate-700",
    AUTH_REGISTER:       "bg-sky-500/10 text-sky-400 border-sky-500/20",
    LEAD_CREATED:        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    LEAD_UPDATED:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
    LEAD_DELETED:        "bg-red-500/10 text-red-400 border-red-500/20",
    PIPELINE_CHANGED:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    WORKFLOW_TRIGGERED:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
    WORKFLOW_CREATED:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    WORKFLOW_DELETED:    "bg-red-500/10 text-red-400 border-red-500/20",
    EMAIL_SENT:          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    BILLING_CHECKOUT:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    BILLING_CHANGED:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
    ROLE_CHANGED:        "bg-rose-500/10 text-rose-400 border-rose-500/20",
    API_KEY_CREATED:     "bg-teal-500/10 text-teal-400 border-teal-500/20",
    API_KEY_REVOKED:     "bg-red-500/10 text-red-400 border-red-500/20",
    AI_RESEARCH_STARTED: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    PASSWORD_RESET:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const cls = colorMap[action] || "bg-slate-700/60 text-slate-400 border-slate-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${cls}`}>
      {getActionIcon(action, "h-2.5 w-2.5")}
      {label}
    </span>
  );
}

function getActionIcon(action: string, cls = "h-4 w-4") {
  if (action.startsWith("AUTH_LOGIN")) return <LogIn className={cls} />;
  if (action.startsWith("AUTH_LOGOUT")) return <LogOut className={cls} />;
  if (action.startsWith("AUTH_")) return <UserCheck className={cls} />;
  if (action.startsWith("LEAD_")) return <Layers className={cls} />;
  if (action.startsWith("PIPELINE_")) return <TrendingUp className={cls} />;
  if (action.startsWith("WORKFLOW_")) return <Zap className={cls} />;
  if (action.startsWith("EMAIL_")) return <Mail className={cls} />;
  if (action.startsWith("BILLING_")) return <CreditCard className={cls} />;
  if (action.startsWith("ROLE_")) return <Users className={cls} />;
  if (action.startsWith("API_KEY_")) return <Key className={cls} />;
  if (action.startsWith("AI_")) return <Bot className={cls} />;
  if (action.startsWith("PASSWORD_")) return <ShieldAlert className={cls} />;
  return <Activity className={cls} />;
}

// ─────────────────────────────────────────────────────────────
// Stats Widget Row
// ─────────────────────────────────────────────────────────────
function StatsRow({ stats }: { stats: AuditStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="border border-card-border rounded-2xl bg-card/20 p-4 flex flex-col gap-1">
        <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Total Events</span>
        <span className="text-2xl font-black text-white">{stats.total.toLocaleString()}</span>
        <span className="text-[10px] text-muted-text">All time audit log</span>
      </div>
      <div className="border border-card-border rounded-2xl bg-card/20 p-4 flex flex-col gap-1">
        <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Last 24 Hours</span>
        <span className="text-2xl font-black text-accent-primary">{stats.last24h.toLocaleString()}</span>
        <span className="text-[10px] text-muted-text">Recent activity</span>
      </div>
      <div className="border border-amber-500/20 rounded-2xl bg-amber-500/5 p-4 flex flex-col gap-1">
        <span className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Warnings
        </span>
        <span className="text-2xl font-black text-amber-400">{stats.warnCount.toLocaleString()}</span>
        <span className="text-[10px] text-amber-400/60">Elevated risk events</span>
      </div>
      <div className="border border-red-500/20 rounded-2xl bg-red-500/5 p-4 flex flex-col gap-1">
        <span className="text-[10px] text-red-400/70 font-bold uppercase tracking-wider flex items-center gap-1">
          <ShieldX className="h-3 w-3" /> Critical
        </span>
        <span className="text-2xl font-black text-red-400">{stats.criticalCount.toLocaleString()}</span>
        <span className="text-[10px] text-red-400/60">Compliance events</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const ActivityTab: React.FC<ActivityTabProps> = ({
  businessId,
  token,
  API_URL,
}) => {
  // ── State ──────────────────────────────────────────────────
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<AuditMeta>({ total: 0, page: 1, limit: 50, pages: 1 });
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [actors, setActors] = useState<AuditActor[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Filters ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // ── Fetch helpers ──────────────────────────────────────────
  const authFetch = useCallback(
    (url: string, opts?: RequestInit) =>
      fetch(url, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(opts?.headers || {}),
        },
      }),
    [token],
  );

  const fetchLogs = useCallback(async (p = 1) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)        params.set("search",   search);
      if (filterAction)  params.set("action",   filterAction);
      if (filterEntity)  params.set("entity",   filterEntity);
      if (filterSeverity)params.set("severity", filterSeverity);
      if (filterUser)    params.set("userId",   filterUser);
      if (dateFrom)      params.set("dateFrom", dateFrom);
      if (dateTo)        params.set("dateTo",   dateTo);
      params.set("page",  String(p));
      params.set("limit", "50");

      const res = await authFetch(`${API_URL}/business/${businessId}/audit-logs?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        setMeta(json.meta || { total: 0, page: 1, limit: 50, pages: 1 });
      }
    } catch (err) {
      console.error("Audit log fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [businessId, search, filterAction, filterEntity, filterSeverity, filterUser, dateFrom, dateTo, authFetch, API_URL]);

  const fetchStats = useCallback(async () => {
    if (!businessId) return;
    setStatsLoading(true);
    try {
      const [statsRes, actorsRes] = await Promise.all([
        authFetch(`${API_URL}/business/${businessId}/audit-logs/stats`),
        authFetch(`${API_URL}/business/${businessId}/audit-logs/actors`),
      ]);
      if (statsRes.ok)  setStats(await statsRes.json());
      if (actorsRes.ok) setActors(await actorsRes.json());
    } catch (err) {
      console.error("Stats fetch failed", err);
    } finally {
      setStatsLoading(false);
    }
  }, [businessId, authFetch, API_URL]);

  const handleExportCsv = async () => {
    const params = new URLSearchParams();
    if (search)        params.set("search",   search);
    if (filterAction)  params.set("action",   filterAction);
    if (filterEntity)  params.set("entity",   filterEntity);
    if (filterSeverity)params.set("severity", filterSeverity);
    if (filterUser)    params.set("userId",   filterUser);
    if (dateFrom)      params.set("dateFrom", dateFrom);
    if (dateTo)        params.set("dateTo",   dateTo);

    const res = await authFetch(`${API_URL}/business/${businessId}/audit-logs/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `beacon-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterAction("");
    setFilterEntity("");
    setFilterSeverity("");
    setFilterUser("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = !!(search || filterAction || filterEntity || filterSeverity || filterUser || dateFrom || dateTo);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [search, filterAction, filterEntity, filterSeverity, filterUser, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchLogs(page), 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, page, fetchLogs]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-primary" />
            Enterprise Audit Log
          </h3>
          <p className="text-xs text-muted-text mt-1">
            Tamper-evident, chronological record of all security, data, and system events across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              autoRefresh
                ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                : "border-card-border text-muted-text hover:text-white hover:bg-slate-900"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Live" : "Auto-refresh"}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => { fetchStats(); fetchLogs(page); }}
            className="p-2 rounded-xl border border-card-border text-muted-text hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <StatsRow stats={stats} />

      {/* Top Actors */}
      {stats && stats.topActors.length > 0 && (
        <div className="border border-card-border rounded-2xl bg-card/10 p-5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-accent-primary" />
            Most Active Users (Last 7 Days)
          </h4>
          <div className="flex flex-wrap gap-3">
            {stats.topActors.map((actor) => (
              <button
                key={actor.userId}
                onClick={() => setFilterUser(actor.userId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  filterUser === actor.userId
                    ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                    : "border-card-border bg-slate-900/40 text-slate-300 hover:border-slate-600"
                }`}
              >
                <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-[10px]">
                  {actor.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-bold text-[11px]">{actor.name}</p>
                  <p className="text-[9px] text-muted-text">{actor.count} events</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="border border-card-border rounded-2xl bg-card/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Filter className="h-4 w-4 text-accent-primary" />
            Filter & Search
          </h4>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[10px] text-muted-text hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-text" />
            <input
              type="text"
              placeholder="Search descriptions, actions, entities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-card-border text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Action */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Entity */}
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* User filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            <option value="">All Users</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
            />
            {!dateFrom && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-text">From date…</span>
            )}
          </div>

          {/* Date To */}
          <div className="relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-900 border border-card-border text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
            />
            {!dateTo && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-text">To date…</span>
            )}
          </div>
        </div>
      </div>

      {/* Result count bar */}
      <div className="flex items-center justify-between text-xs text-muted-text">
        <span>
          {loading ? "Loading…" : `${meta.total.toLocaleString()} events${hasActiveFilters ? " matching filters" : ""}`}
        </span>
        <span>
          Page {meta.page} of {meta.pages}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-card-border rounded-2xl bg-card/10 shadow-sm">
        <table className="w-full border-collapse text-left text-sm min-w-[900px]">
          <thead className="bg-slate-950/30 border-b border-card-border text-[10px] font-bold uppercase text-muted-text tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-36">Severity / Action</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 w-28">Entity</th>
              <th className="px-5 py-3.5 w-44">Actor</th>
              <th className="px-5 py-3.5 w-32">IP Address</th>
              <th className="px-5 py-3.5 w-36">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border/40">
            {loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <RefreshCw className="h-6 w-6 mx-auto animate-spin text-accent-primary mb-2" />
                  <p className="text-xs text-muted-text">Loading audit events…</p>
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm font-bold text-slate-400">No audit events found</p>
                  <p className="text-xs text-muted-text mt-1">
                    {hasActiveFilters
                      ? "Try adjusting your filters."
                      : "Perform actions in the dashboard to populate the audit log."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-xs text-accent-primary hover:underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </td>
              </tr>
            )}

            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const rowCls =
                log.severity === "CRITICAL"
                  ? "bg-red-500/3 hover:bg-red-500/6"
                  : log.severity === "WARN"
                  ? "bg-amber-500/3 hover:bg-amber-500/6"
                  : "hover:bg-slate-900/30";

              return (
                <React.Fragment key={log.id}>
                  <tr
                    className={`transition-colors cursor-pointer ${rowCls}`}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Severity + Action */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <SeverityBadge severity={log.severity} />
                        <ActionBadge action={log.action} />
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-2">
                        {log.description}
                      </p>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-3.5">
                      {log.entity ? (
                        <div>
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {log.entity}
                          </span>
                          {log.entityId && (
                            <p className="text-[9px] text-muted-text font-mono mt-1 truncate max-w-[96px]" title={log.entityId}>
                              {log.entityId.substring(0, 8)}…
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-text italic">—</span>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-3.5">
                      {log.user ? (
                        <div>
                          <p className="text-xs font-bold text-slate-200">{log.user.name}</p>
                          <p className="text-[10px] text-muted-text truncate">{log.user.email}</p>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-text italic flex items-center gap-1">
                          <Bot className="h-3 w-3" />System
                        </span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-5 py-3.5">
                      <code className="text-[10px] text-slate-400 font-mono">
                        {log.ipAddress || "—"}
                      </code>
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1">
                        <Clock className="h-3 w-3 text-muted-text mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-300 font-mono">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-muted-text font-mono">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-text" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-text" />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded metadata row */}
                  {isExpanded && (
                    <tr className={rowCls}>
                      <td colSpan={6} className="px-5 pb-4 pt-0">
                        <div className="border border-card-border rounded-xl bg-slate-950/30 p-4 space-y-3">
                          <div className="flex flex-wrap gap-6 text-xs">
                            {log.entityId && (
                              <div>
                                <span className="text-[10px] text-muted-text font-bold uppercase block">Entity ID</span>
                                <code className="font-mono text-slate-300">{log.entityId}</code>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="max-w-xs">
                                <span className="text-[10px] text-muted-text font-bold uppercase block">User Agent</span>
                                <p className="text-slate-400 text-[10px] truncate">{log.userAgent}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] text-muted-text font-bold uppercase block">Audit ID</span>
                              <code className="font-mono text-slate-400 text-[10px]">{log.id}</code>
                            </div>
                          </div>

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <span className="text-[10px] text-muted-text font-bold uppercase block mb-1.5">Event Metadata</span>
                              <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 border border-card-border rounded-lg p-3 overflow-x-auto max-h-32">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-text">
            Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()} events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="p-2 rounded-xl border border-card-border text-muted-text hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* Page numbers (show up to 5) */}
            {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(meta.page - 2, meta.pages - 4)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`h-8 w-8 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    pg === meta.page
                      ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                      : "border-card-border text-muted-text hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={meta.page >= meta.pages}
              className="p-2 rounded-xl border border-card-border text-muted-text hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
