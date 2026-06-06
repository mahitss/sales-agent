"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Settings,
  Code,
  LogOut,
  TrendingUp,
  Award,
  CalendarDays,
  CheckCircle2,
  Trash2,
  Plus,
  Send,
  User,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Building,
  Globe,
  Briefcase,
  FileText,
  Bot
} from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface BusinessInfo {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  description: string;
  knowledgeBases?: FAQItem[];
}

interface FAQItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  source: string;
  status: string; // HOT, WARM, COLD
  createdAt: string;
}

interface Conversation {
  id: string;
  lead: Lead | null;
  messages: Array<{ role: "user" | "model"; content: string }>;
  updatedAt: string;
}

interface Appointment {
  id: string;
  lead: Lead;
  date: string;
  time: string;
  status: string; // PENDING, CONFIRMED, CANCELLED
  createdAt: string;
}

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  appointments: number;
  conversionRate: number;
}

export default function DashboardPage() {
  // Authentication & Profile States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding Form State
  const [compName, setCompName] = useState("");
  const [compWeb, setCompWeb] = useState("");
  const [compInd, setCompInd] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Dashboard Active State
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "conversations" | "appointments" | "kb" | "widget">("overview");

  // Content Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    appointments: 0,
    conversionRate: 0,
  });

  // Selected Items for Details Panel
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  
  // Create FAQ Form State
  const [faqTitle, setFaqTitle] = useState("");
  const [faqContent, setFaqContent] = useState("");
  const [faqLoading, setFaqLoading] = useState(false);

  // Global Loading States
  const [dataLoading, setDataLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Check LocalStorage for Auth Session
  useEffect(() => {
    const savedToken = localStorage.getItem("beacon_token");
    const savedUser = localStorage.getItem("beacon_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch Business Info when logged in
  useEffect(() => {
    if (token) {
      fetchBusiness();
    }
  }, [token]);

  // Fetch tab-specific data when business details loaded
  useEffect(() => {
    if (business) {
      refreshData();
    }
  }, [business, activeTab]);

  const fetchBusiness = async () => {
    try {
      const res = await fetch(`${API_URL}/business`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("beacon_token")}` },
      });
      if (res.ok) {
        const text = await res.text();
        if (!text || text.trim() === "null" || text.trim() === "") {
          setBusiness(null);
          return;
        }
        const data = JSON.parse(text);
        setBusiness(data);
        if (data) {
          setCompName(data.companyName || "");
          setCompWeb(data.website || "");
          setCompInd(data.industry || "");
          setCompDesc(data.description || "");
        }
      }
    } catch (err) {
      console.error("Fetch business failed", err);
    }
  };

  const refreshData = async () => {
    if (!business) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("beacon_token")}` };
      
      if (activeTab === "overview") {
        const res = await fetch(`${API_URL}/leads/stats/${business.id}`, { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "leads") {
        const res = await fetch(`${API_URL}/leads/business/${business.id}`, { headers });
        if (res.ok) setLeads(await res.json());
      } else if (activeTab === "conversations") {
        const res = await fetch(`${API_URL}/conversations/business/${business.id}`, { headers });
        if (res.ok) {
          const list = await res.json();
          setConversations(list);
          // Sync selected conversation if open
          if (selectedConv) {
            const updated = list.find((c: Conversation) => c.id === selectedConv.id);
            if (updated) setSelectedConv(updated);
          }
        }
      } else if (activeTab === "appointments") {
        const res = await fetch(`${API_URL}/appointments/business/${business.id}`, { headers });
        if (res.ok) setAppointments(await res.json());
      } else if (activeTab === "kb") {
        const res = await fetch(`${API_URL}/business/${business.id}/faq`);
        if (res.ok) setFaqs(await res.json());
      }
    } catch (err) {
      console.error("Data refresh failed", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Auth Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const payload = isLogin
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, name: authName };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("beacon_token", data.token);
      localStorage.setItem("beacon_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("beacon_token");
    localStorage.removeItem("beacon_user");
    setToken(null);
    setUser(null);
    setBusiness(null);
    setSelectedConv(null);
  };

  // Onboarding Handler
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: compName,
          website: compWeb,
          industry: compInd,
          description: compDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      const data = await res.json();
      setBusiness(data);
    } catch (err) {
      console.error(err);
    } finally {
      setOnboardLoading(false);
    }
  };

  // Add FAQ Handler
  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqTitle || !faqContent || !business) return;
    setFaqLoading(true);
    try {
      const res = await fetch(`${API_URL}/business/${business.id}/faq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: faqTitle, content: faqContent }),
      });
      if (res.ok) {
        setFaqTitle("");
        setFaqContent("");
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFaqLoading(false);
    }
  };

  // Delete FAQ Handler
  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`${API_URL}/business/faq/${faqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Appointment Status
  const handleUpdateApptStatus = async (apptId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${apptId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Lead Status
  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RENDER: Auth Gate
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <Building className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {isLogin ? "Welcome to Beacon AI" : "Create Business Portal"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin ? "Manage your AI Sales Agent and leads" : "Get started with your AI-powered site widget"}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            {authError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 text-center">
                {authError}
              </div>
            )}
            <div className="space-y-4 rounded-md">
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all shadow-lg"
              >
                {authLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Register Agent"
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError("");
              }}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isLogin ? "Need a portal account? Register here" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Onboarding Wizard (If no business created yet)
  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Set Up Your Business Profile
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Tell Beacon AI about your business so it can qualify leads and answer FAQs accurately.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleOnboard}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Name</label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-600" />
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Acme Agency"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Website URL</label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-600" />
                  <input
                    type="text"
                    required
                    value={compWeb}
                    onChange={(e) => setCompWeb(e.target.value)}
                    placeholder="e.g. acme.com"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Industry</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-600" />
                <input
                  type="text"
                  required
                  value={compInd}
                  onChange={(e) => setCompInd(e.target.value)}
                  placeholder="e.g. Marketing, Real Estate, Consulting"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Description & Services</label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-600" />
                <textarea
                  required
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe what your business does, who you serve, pricing structure, and key services..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={onboardLoading}
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all shadow-lg"
              >
                {onboardLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Create Business Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // RENDER: Full Dashboard Portal
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Layout */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/30 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Logo / Org Name */}
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-white">{business.companyName}</h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Portal Active</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "leads"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="h-5 w-5" />
              Leads
            </button>
            <button
              onClick={() => setActiveTab("conversations")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "conversations"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Conversations
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "appointments"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Calendar className="h-5 w-5" />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("kb")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "kb"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab("widget")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === "widget"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Code className="h-5 w-5" />
              Widget Installation
            </button>
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-emerald-400">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-red-400 hover:bg-red-500/5 hover:text-red-300 border border-transparent hover:border-red-500/10 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize text-white">{activeTab === "kb" ? "Knowledge Base" : activeTab}</h2>
            {dataLoading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-800/80 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Header Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-emerald-600/20 to-teal-500/5 border border-emerald-500/20 p-8">
                <h3 className="text-2xl font-extrabold text-white">Hey {user?.name}!</h3>
                <p className="mt-1 text-slate-400 text-sm max-w-xl">
                  Your Sales Agent is active on the widget. Here is an overview of how your leads and visitor conversations are progressing.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads</span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-4xl font-black text-white">{stats.totalLeads}</span>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Users className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Qualified Leads</span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-4xl font-black text-white">{stats.qualifiedLeads}</span>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Award className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booked Calls</span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-4xl font-black text-white">{stats.appointments}</span>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CalendarDays className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion Rate</span>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-4xl font-black text-emerald-400">{stats.conversionRate}%</span>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="h-5.5 w-5.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Leads / Appointments Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Lead Health breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span> Hot Leads
                      </span>
                      <span className="text-sm font-semibold text-white">{stats.hotLeads}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span> Warm Leads
                      </span>
                      <span className="text-sm font-semibold text-white">{stats.warmLeads}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span> Cold Leads
                      </span>
                      <span className="text-sm font-semibold text-white">{stats.coldLeads}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">System Integration Checklist</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-300">Register business portal account</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-300">Set up business profile info</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4.5 w-4.5 rounded-full border border-slate-800 flex items-center justify-center shrink-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-800"></div>
                      </div>
                      <span className="text-xs text-slate-400">Configure target custom FAQs in Knowledge Base</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4.5 w-4.5 rounded-full border border-slate-800 flex items-center justify-center shrink-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-800"></div>
                      </div>
                      <span className="text-xs text-slate-400">Install logicra-widget script on your site</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Leads Log</h3>
                  <p className="text-xs text-slate-500 mt-1">Visitors qualified and captured by the AI agent</p>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-900 rounded-2xl bg-slate-900/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900/50 border-b border-slate-900 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date Captured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No leads captured yet. Run a chat in the Widget tab to generate test leads!
                        </td>
                      </tr>
                    ) : (
                      leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-200">
                            {l.name === "Anonymous Visitor" ? (
                              <span className="italic text-slate-500">Anonymous Visitor</span>
                            ) : (
                              l.name
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-300">{l.email || "—"}</td>
                          <td className="px-6 py-4 text-slate-300">{l.phone || "—"}</td>
                          <td className="px-6 py-4 text-slate-300">{l.budget || "—"}</td>
                          <td className="px-6 py-4">
                            <select
                              value={l.status}
                              onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                              className={`rounded-lg border border-transparent px-2.5 py-1 text-xs font-bold focus:outline-none transition-all ${
                                l.status === "HOT" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                l.status === "WARM" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              }`}
                            >
                              <option value="HOT" className="bg-slate-950 text-red-400">HOT</option>
                              <option value="WARM" className="bg-slate-950 text-amber-400">WARM</option>
                              <option value="COLD" className="bg-slate-950 text-blue-400">COLD</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(l.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CONVERSATIONS */}
          {activeTab === "conversations" && (
            <div className="flex h-[calc(100vh-12rem)] border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
              {/* Left pane: conversations list */}
              <div className="w-1/3 border-r border-slate-900 flex flex-col">
                <div className="p-4 border-b border-slate-900 font-semibold text-xs uppercase tracking-wider text-slate-500">
                  All Chats
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No conversations log available.
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isSelected = selectedConv?.id === c.id;
                      const leadName = c.lead?.name || "Anonymous Visitor";
                      const lastMsg = c.messages[c.messages.length - 1]?.content || "";
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedConv(c)}
                          className={`w-full text-left p-4 hover:bg-slate-900/30 transition-all ${
                            isSelected ? "bg-slate-900/50 border-l-2 border-emerald-500" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-slate-200 truncate pr-2">
                              {leadName === "Anonymous Visitor" ? (
                                <span className="italic font-normal text-slate-500">Anonymous</span>
                              ) : (
                                leadName
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-1">{lastMsg}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right pane: chat viewer */}
              <div className="flex-1 flex flex-col bg-slate-950">
                {selectedConv ? (
                  <>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {selectedConv.lead?.name || "Anonymous Visitor"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedConv.lead?.email ? `${selectedConv.lead.email} • ` : ""}
                          {selectedConv.lead?.phone ? `${selectedConv.lead.phone} • ` : ""}
                          {selectedConv.lead?.budget ? `Budget: ${selectedConv.lead.budget}` : ""}
                        </p>
                      </div>
                      {selectedConv.lead?.status && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          selectedConv.lead.status === "HOT" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          selectedConv.lead.status === "WARM" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {selectedConv.lead.status}
                        </span>
                      )}
                    </div>
                    {/* Chat Bubble List */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {selectedConv.messages.map((m, idx) => {
                        const isUser = m.role === "user";
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            {!isUser && (
                              <div className="h-7.5 w-7.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4" />
                              </div>
                            )}
                            <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                              isUser
                                ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                                : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/80 shadow-sm"
                            }`}>
                              {m.content}
                            </div>
                            {isUser && (
                              <div className="h-7.5 w-7.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare className="h-10 w-10 text-slate-700 mb-2" />
                    <p className="text-sm">Select a conversation from the sidebar to view transcript</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Booked Appointments</h3>
                <p className="text-xs text-slate-500 mt-1">Interactions where the AI extracted and scheduled a callback</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {appointments.length === 0 ? (
                  <div className="col-span-full border border-slate-900 border-dashed rounded-2xl p-12 text-center text-slate-500">
                    No appointments scheduled yet. Let a user ask to schedule a call in the widget simulator!
                  </div>
                ) : (
                  appointments.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base text-white">{a.lead.name || "Anonymous Lead"}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{a.lead.email || "No email"}</p>
                          <p className="text-xs text-slate-500">{a.lead.phone || "No phone"}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          a.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {a.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900 text-sm">
                        <Calendar className="h-4.5 w-4.5 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-slate-200">{a.date}</p>
                          <p className="text-xs text-slate-400">{a.time}</p>
                        </div>
                      </div>

                      {a.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateApptStatus(a.id, "CONFIRMED")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-xs font-semibold transition-all shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateApptStatus(a.id, "CANCELLED")}
                            className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg py-2 text-xs font-semibold transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: KNOWLEDGE BASE */}
          {activeTab === "kb" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white">Company FAQs & Knowledge Base</h3>
                <p className="text-xs text-slate-500 mt-1">Upload answers, instructions, and services so the AI sales agent can reference them.</p>
              </div>

              {/* Add FAQ form */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Add FAQ Question</h4>
                <form onSubmit={handleAddFAQ} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question / Topic Title</label>
                    <input
                      type="text"
                      required
                      value={faqTitle}
                      onChange={(e) => setFaqTitle(e.target.value)}
                      placeholder="e.g. What are your pricing plans for SEO services?"
                      className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Answer / Knowledge Content</label>
                    <textarea
                      required
                      value={faqContent}
                      onChange={(e) => setFaqContent(e.target.value)}
                      rows={3}
                      placeholder="Detail the answer here..."
                      className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={faqLoading || !faqTitle || !faqContent}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md disabled:opacity-50"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Add to Knowledge Base
                    </button>
                  </div>
                </form>
              </div>

              {/* FAQs list */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Existing Knowledge Items</h4>
                {faqs.length === 0 ? (
                  <div className="border border-slate-900 border-dashed rounded-2xl p-8 text-center text-slate-500 text-sm">
                    No FAQs uploaded yet. Add your first knowledge item above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 flex justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-bold text-sm text-slate-200">{faq.title}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{faq.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFAQ(faq.id)}
                          className="text-slate-600 hover:text-red-400 rounded-lg p-1.5 self-start transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: WIDGET INSTALLATION */}
          {activeTab === "widget" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Instructions Panel */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Embed Chat Widget</h3>
                  <p className="text-xs text-slate-500 mt-1">Copy and paste this snippet into the HTML of your website</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-950 border border-slate-900 p-5 font-mono text-xs overflow-x-auto text-emerald-400 select-all leading-relaxed relative group">
                    <code>
                      {`<script\n  src="${API_URL}/widget/logicra-widget.js"\n  data-business-id="${business.id}"\n></script>`}
                    </code>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2 text-xs leading-relaxed text-slate-300">
                    <p className="font-bold text-white">💡 Easy Installation Steps:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Copy the script snippet above.</li>
                      <li>Paste it right before the closing <code className="text-emerald-400">&lt;/body&gt;</code> tag of your website's index file.</li>
                      <li>Save and publish your site. The floating chat bubble will appear automatically!</li>
                    </ol>
                  </div>
                </div>

                {/* Simulated Business Site Mock */}
                <div className="border border-slate-900 rounded-2xl p-6 bg-slate-900/10 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Live Simulation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test the loader script locally on a simulated environment. The floating green button in the bottom-right of your screen is the active sales widget!
                  </p>
                </div>
              </div>

              {/* Sandbox Panel */}
              <div className="flex flex-col h-[calc(100vh-12rem)] border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
                <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">Sandbox Preview</span>
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
                </div>
                
                {/* Embed the Next.js widget directly into this preview container */}
                <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
                  <div className="w-full max-w-sm h-[480px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <iframe
                      src={`/widget?id=${business.id}`}
                      className="w-full h-full border-none bg-slate-950"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
