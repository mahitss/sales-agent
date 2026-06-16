"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Bot,
  MapPin,
  Eye,
  Compass,
  Radio,
  Share2,
  Brain,
  ShieldAlert,
  ArrowUpRight,
  Flame,
  Check
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
  whatsappEnabled: boolean;
  instagramEnabled: boolean;
  emailEnabled: boolean;
  whatsappApiKey?: string;
  instagramAccountId?: string;
  emailSmtp?: string;
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
  sentiment?: string;
  engagementScore?: number;
  createdAt: string;
}

interface Conversation {
  id: string;
  leadId: string | null;
  lead: Lead | null;
  messages: Array<{ role: "user" | "model"; content: string }>;
  channel: string; // WIDGET, WHATSAPP, INSTAGRAM, EMAIL
  isHumanTakeover: boolean;
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

interface VisitorTrack {
  id: string;
  location: string;
  pagesViewed: string[];
  duration: number;
  createdAt: string;
}

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

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  appointments: number;
  conversionRate: number;
}

const sanitizeHtml = (str: string): string => {
  if (!str) return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export default function DashboardPage() {
  // Authentication & Profile States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [businessLoading, setBusinessLoading] = useState(true);

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "leads" | "conversations" | "appointments" | "kb" | "widget" | "visitor" | "competitor" | "integrations"
  >("overview");

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

  // --- V2 Extensions Local States ---
  // Visitor Tracking
  const [visitorTracks, setVisitorTracks] = useState<VisitorTrack[]>([]);
  // Competitor Analysis
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorLogs, setCompetitorLogs] = useState<string[]>([]);
  // Scraper/Website Learning
  const [scraperUrl, setScraperUrl] = useState("");
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  // AI Recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  // Takeover Input
  const [operatorReply, setOperatorReply] = useState("");
  const [operatorSending, setOperatorSending] = useState(false);
  // Channel Simulator Input
  const [simChannel, setSimChannel] = useState("WHATSAPP");
  const [simMessage, setSimMessage] = useState("");
  const [simLeadName, setSimLeadName] = useState("");
  const [simLeadPhone, setSimLeadPhone] = useState("");
  const [simLeadEmail, setSimLeadEmail] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simStatus, setSimStatus] = useState("");

  // Connection Settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [emailSmtp, setEmailSmtp] = useState("");
  const [connectionSaving, setConnectionSaving] = useState(false);

  // Personalized Agent branding Settings
  const [themeColor, setThemeColor] = useState("#10B981");
  const [agentTone, setAgentTone] = useState("PROFESSIONAL");
  const [agentPrompt, setAgentPrompt] = useState("");

  // Leads Filtering & Searching
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [filterSentiment, setFilterSentiment] = useState("ALL");

  // KB File Upload States
  const [kbProgress, setKbProgress] = useState(0);
  const [kbUploading, setKbUploading] = useState(false);
  const [kbFileName, setKbFileName] = useState("");

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
    } else {
      setBusinessLoading(false);
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

  // Poll current chat conversation details when takeover chat is selected
  useEffect(() => {
    if (!token || !selectedConv || activeTab !== "conversations") return;

    const interval = setInterval(() => {
      fetch(`${API_URL}/conversations/${selectedConv.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.messages) {
            setSelectedConv((prev) => {
              if (prev && prev.id === data.id) {
                return {
                  ...prev,
                  messages: data.messages,
                  isHumanTakeover: data.isHumanTakeover
                };
              }
              return prev;
            });
            // Update in list too
            setConversations((prev) =>
              prev.map((c) =>
                c.id === data.id ? { ...c, messages: data.messages, isHumanTakeover: data.isHumanTakeover } : c
              )
            );
          }
        })
        .catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [token, selectedConv, activeTab]);

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
          setCompName(data.companyName);
          setCompWeb(data.website);
          setCompInd(data.industry);
          setCompDesc(data.description);
          setWhatsappEnabled(data.whatsappEnabled);
          setInstagramEnabled(data.instagramEnabled);
          setEmailEnabled(data.emailEnabled);
          setWhatsappApiKey(data.whatsappApiKey || "");
          setInstagramAccountId(data.instagramAccountId || "");
          setEmailSmtp(data.emailSmtp || "");
          setThemeColor(data.themeColor || "#10B981");
          setAgentTone(data.agentTone || "PROFESSIONAL");
          setAgentPrompt(data.agentPrompt || "");
        }
      }
    } catch (err) {
      console.error("Fetch business failed", err);
    } finally {
      setBusinessLoading(false);
    }
  };

  const refreshData = async () => {
    if (!business) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("beacon_token")}` };
      
      if (activeTab === "overview") {
        const statsRes = await fetch(`${API_URL}/leads/stats/${business.id}`, { headers });
        if (statsRes.ok) setStats(await statsRes.json());
        
        const recsRes = await fetch(`${API_URL}/business/${business.id}/recommendations`, { headers });
        if (recsRes.ok) setRecommendations(await recsRes.json());
      } else if (activeTab === "leads") {
        const res = await fetch(`${API_URL}/leads/business/${business.id}`, { headers });
        if (res.ok) setLeads(await res.json());
      } else if (activeTab === "conversations") {
        const res = await fetch(`${API_URL}/conversations/business/${business.id}`, { headers });
        if (res.ok) {
          const list = await res.json();
          setConversations(list);
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
      } else if (activeTab === "visitor") {
        const res = await fetch(`${API_URL}/business/${business.id}/visitor-tracks`, { headers });
        if (res.ok) setVisitorTracks(await res.json());
      } else if (activeTab === "competitor") {
        const res = await fetch(`${API_URL}/business/${business.id}/competitor-analysis`, { headers });
        if (res.ok) setCompetitorAnalyses(await res.json());
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
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("beacon_token", data.token);
      localStorage.setItem("beacon_user", JSON.stringify(data.user));
      setBusinessLoading(true);
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
    setBusinessLoading(true);
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create profile");
      }
      const data = await res.json();
      setBusiness(data);
      if (data) {
        setCompName(data.companyName);
        setCompWeb(data.website);
        setCompInd(data.industry);
        setCompDesc(data.description);
        setWhatsappEnabled(data.whatsappEnabled);
        setInstagramEnabled(data.instagramEnabled);
        setEmailEnabled(data.emailEnabled);
        setWhatsappApiKey(data.whatsappApiKey || "");
        setInstagramAccountId(data.instagramAccountId || "");
        setEmailSmtp(data.emailSmtp || "");
        setThemeColor(data.themeColor || "#10B981");
        setAgentTone(data.agentTone || "PROFESSIONAL");
        setAgentPrompt(data.agentPrompt || "");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during onboarding");
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

  const handleExportLeads = () => {
    if (!business) return;
    window.open(`${API_URL}/leads/business/${business.id}/export`, '_blank');
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

  // --- V2 Feature Handlers ---

  // Save Channels Integrations settings
  const handleSaveConnections = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setConnectionSaving(true);
    try {
      const res = await fetch(`${API_URL}/business/${business.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: business.companyName,
          website: business.website,
          industry: business.industry,
          description: business.description,
          whatsappEnabled,
          instagramEnabled,
          emailEnabled,
          whatsappApiKey,
          instagramAccountId,
          emailSmtp,
          themeColor,
          agentTone,
          agentPrompt
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
        alert("Branding and connectivity configurations saved successfully.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save connectivity parameters.");
    } finally {
      setConnectionSaving(false);
    }
  };

  // Trigger Multi-Channel incoming message simulation
  const handleSimulateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !simMessage) return;
    setSimLoading(true);
    setSimStatus("[Simulating] Resolving webhook endpoint...");

    setTimeout(() => setSimStatus(`[Simulating] Creating qualified lead source: ${simChannel}...`), 600);
    setTimeout(() => setSimStatus("[Simulating] Mapping webhook contents to conversation log..."), 1200);
    setTimeout(() => setSimStatus("[AI Service] Executing intent scoring & response parsing..."), 1800);

    try {
      const res = await fetch(`${API_URL}/chat/simulate-incoming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: business.id,
          channel: simChannel,
          message: simMessage,
          leadName: simLeadName || "Simulated " + simChannel + " Lead",
          leadPhone: simLeadPhone || null,
          leadEmail: simLeadEmail || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setSimStatus(`[Success] AI replied: "${data.response}". Simulation complete! Go to Conversations to view.`);
          setSimMessage("");
          setSimLeadName("");
          setSimLeadPhone("");
          setSimLeadEmail("");
          setSimLoading(false);
        }, 2400);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTimeout(() => {
        setSimStatus("[Error] Simulation failed. Check server logs.");
        setSimLoading(false);
      }, 2400);
    }
  };

  // Trigger website scraper (Auto Learning)
  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !scraperUrl) return;
    setScraperLoading(true);
    setScraperLogs(["[Scraper] Initializing Web Crawler...", `[Scraper] Connecting to ${scraperUrl}...`]);

    setTimeout(() => setScraperLogs(prev => [...prev, "[Crawl] Loading HTML homepage structure..."]), 800);
    setTimeout(() => setScraperLogs(prev => [...prev, "[Parser] Extracted text blocks (4,000 characters)..."]), 1600);
    setTimeout(() => setScraperLogs(prev => [...prev, "[AI Service] Querying Gemini for FAQ context extraction..."]), 2400);

    try {
      const res = await fetch(`${API_URL}/business/${business.id}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: scraperUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setScraperLogs(prev => [
            ...prev,
            `[Success] Generated and saved ${data.count} new FAQ items directly into your Knowledge Base!`
          ]);
          setScraperLoading(false);
          setScraperUrl("");
          refreshData();
        }, 3000);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTimeout(() => {
        setScraperLogs(prev => [...prev, "[Error] Crawl failed. Re-verify the domain parameters."]);
        setScraperLoading(false);
      }, 3000);
    }
  };

  const handleStartFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!business || !file) return;

    setKbFileName(file.name);
    setKbUploading(true);
    setKbProgress(0);

    const interval = setInterval(() => {
      setKbProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 150);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await fetch(`${API_URL}/business/${business.id}/import-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: file.name, text })
        });
        
        clearInterval(interval);
        setKbProgress(100);

        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            alert(`Document imported: AI generated ${data.count} FAQ items directly from "${file.name}"!`);
            setKbUploading(false);
            setKbFileName("");
            setKbProgress(0);
            refreshData();
          }, 500);
        } else {
          throw new Error();
        }
      } catch (err) {
        clearInterval(interval);
        setTimeout(() => {
          alert("Failed to process document content. Please try another file.");
          setKbUploading(false);
          setKbFileName("");
          setKbProgress(0);
        }, 500);
      }
    };
    reader.readAsText(file);
  };

  // Run competitor analysis scraper
  const handleStartCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !competitorUrl) return;
    setCompetitorLoading(true);
    setCompetitorLogs(["[Auditor] Connecting to competitor domain...", `[Auditor] Fetching headers of ${competitorUrl}...`]);

    setTimeout(() => setCompetitorLogs(prev => [...prev, "[Auditor] Extracting service lists and SEO keywords..."]), 800);
    setTimeout(() => setCompetitorLogs(prev => [...prev, "[AI Service] Generating service compare matrices..."]), 1600);
    setTimeout(() => setCompetitorLogs(prev => [...prev, "[AI Service] Finding missing offerings & content gaps..."]), 2400);

    try {
      const res = await fetch(`${API_URL}/business/${business.id}/competitor-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ competitorUrl })
      });
      if (res.ok) {
        setTimeout(() => {
          setCompetitorLogs(prev => [...prev, "[Success] Competitor audit analysis completed!"]);
          setCompetitorLoading(false);
          setCompetitorUrl("");
          refreshData();
        }, 3000);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTimeout(() => {
        setCompetitorLogs(prev => [...prev, "[Error] Audit execution failed. Re-verify competitor domain."]);
        setCompetitorLoading(false);
      }, 3000);
    }
  };

  // Toggle Human Takeover
  const handleToggleTakeover = async () => {
    if (!selectedConv) return;
    const nextVal = !selectedConv.isHumanTakeover;
    try {
      const res = await fetch(`${API_URL}/conversations/${selectedConv.id}/takeover`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isHumanTakeover: nextVal })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(prev => prev ? { ...prev, isHumanTakeover: data.isHumanTakeover } : null);
        setConversations(prev =>
          prev.map(c => c.id === data.id ? { ...c, isHumanTakeover: data.isHumanTakeover } : c)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send human operator reply
  const handleSendOperatorReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !operatorReply.trim() || operatorSending) return;
    setOperatorSending(true);
    try {
      const res = await fetch(`${API_URL}/chat/operator-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: operatorReply.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOperatorReply("");
        // Local state updates
        setSelectedConv(prev => prev ? { ...prev, messages: data.conversation.messages } : null);
        setConversations(prev =>
          prev.map(c => c.id === data.conversation.id ? { ...c, messages: data.conversation.messages } : c)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOperatorSending(false);
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
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
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
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {isLogin ? "Need a portal account? Register here" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Loading Gate (If authenticated but business profile query is in flight)
  if (token && businessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading Business Profile...</p>
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
                className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
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
          <nav className="mt-6 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Leads
            </button>
            <button
              onClick={() => setActiveTab("conversations")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "conversations"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              Live Inbox
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "appointments"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("kb")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "kb"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              Knowledge Base
            </button>
            
            {/* V2 Extensions Tabs */}
            <button
              onClick={() => setActiveTab("visitor")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "visitor"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <MapPin className="h-4.5 w-4.5" />
              Visitor Activity
            </button>
            <button
              onClick={() => setActiveTab("competitor")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "competitor"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Compass className="h-4.5 w-4.5" />
              Competitor Insights
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "integrations"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Radio className="h-4.5 w-4.5" />
              Integrations settings
            </button>

            <button
              onClick={() => setActiveTab("widget")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "widget"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Code className="h-4.5 w-4.5" />
              Widget Code
            </button>
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-emerald-400">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-red-400 hover:bg-red-500/5 hover:text-red-300 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
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
            <h2 className="text-lg font-bold capitalize text-white">
              {activeTab === "kb" ? "Knowledge Base" : 
               activeTab === "visitor" ? "Visitor Activity Tracking" :
               activeTab === "competitor" ? "Competitor Analysis Audit" :
               activeTab === "integrations" ? "Multi-Channel Settings" :
               activeTab}
            </h2>
            {dataLoading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-800/80 transition-all cursor-pointer"
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
                  Your Sales Agent is active on your site. Here is an overview of how your leads and visitor conversations are progressing.
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

              {/* Recommendations Engine Section */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Brain className="h-4.5 w-4.5 text-emerald-400" />
                    AI Action Recommendations
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-black tracking-wide">
                    FEED LIVE
                  </span>
                </div>
                
                {recommendations.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No active recommendations. Setup your knowledge base and capture leads to get AI prioritized actions.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2 relative group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider ${
                            rec.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            rec.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {rec.priority} PRIORITY
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">{rec.category}</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-200">{rec.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{rec.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Funnel Chart & Channel Distribution Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Stage Funnel Chart */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Sales Conversion Funnel</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Flow of visitor traffic to scheduled callbacks</p>
                  </div>
                  
                  {(() => {
                    const totalVisitors = stats.totalLeads * 3 + 28;
                    const visitorsPct = 100;
                    const leadsPct = totalVisitors > 0 ? Math.round((stats.totalLeads / totalVisitors) * 100) : 0;
                    const qualPct = totalVisitors > 0 ? Math.round((stats.qualifiedLeads / totalVisitors) * 100) : 0;
                    const apptPct = totalVisitors > 0 ? Math.round((stats.appointments / totalVisitors) * 100) : 0;
                    
                    return (
                      <div className="space-y-4">
                        {/* Stage 1: Traffic */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>1. Total Traffic (Simulated)</span>
                            <span>{totalVisitors} sessions ({visitorsPct}%)</span>
                          </div>
                          <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                            <div className="h-full rounded-lg bg-gradient-to-r from-emerald-700/50 to-teal-500/50" style={{ width: `${visitorsPct}%` }}></div>
                          </div>
                        </div>

                        {/* Stage 2: Lead Capture */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>2. Captured Leads</span>
                            <span>{stats.totalLeads} users ({leadsPct}%)</span>
                          </div>
                          <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                            <div className="h-full rounded-lg bg-gradient-to-r from-emerald-600/50 to-teal-400/50" style={{ width: `${leadsPct}%` }}></div>
                          </div>
                        </div>

                        {/* Stage 3: Qualified leads */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>3. Qualified Leads (HOT/WARM)</span>
                            <span>{stats.qualifiedLeads} users ({qualPct}%)</span>
                          </div>
                          <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                            <div className="h-full rounded-lg bg-gradient-to-r from-emerald-500/60 to-emerald-400/60" style={{ width: `${qualPct}%` }}></div>
                          </div>
                        </div>

                        {/* Stage 4: Appointment Booked */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>4. Booked Appointments</span>
                            <span>{stats.appointments} calls ({apptPct}%)</span>
                          </div>
                          <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                            <div className="h-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${apptPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Channel Distribution & Integrations Checklist */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Conversations By Channel</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Interaction density comparison</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Website Chat</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-bold text-white">WIDGET</span>
                        <span className="text-xs text-slate-400 font-semibold">Active</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">WhatsApp</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-bold text-white">WHATSAPP</span>
                        <span className="text-xs text-slate-400 font-semibold">{whatsappEnabled ? "Connected" : "Inactive"}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-green-500" style={{ width: whatsappEnabled ? "25%" : "0%" }}></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Instagram</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-bold text-white">INSTAGRAM</span>
                        <span className="text-xs text-slate-400 font-semibold">{instagramEnabled ? "Connected" : "Inactive"}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-pink-500" style={{ width: instagramEnabled ? "15%" : "0%" }}></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Email SMTP</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-bold text-white">EMAIL</span>
                        <span className="text-xs text-slate-400 font-semibold">{emailEnabled ? "Connected" : "Inactive"}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: emailEnabled ? "10%" : "0%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Leads Log</h3>
                  <p className="text-xs text-slate-500 mt-1">Visitors qualified and captured by the AI agent</p>
                </div>
                <button
                  onClick={handleExportLeads}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md self-start md:self-auto"
                >
                  <FileText className="h-4 w-4" />
                  Export Leads (CSV)
                </button>
              </div>

              {/* Filters container */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-slate-900 bg-slate-900/10">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Search Visitor</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, email or phone..."
                    className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 placeholder-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Source Channel</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">All Channels</option>
                    <option value="WIDGET">WIDGET</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="EMAIL">EMAIL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sentiment</label>
                  <select
                    value={filterSentiment}
                    onChange={(e) => setFilterSentiment(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">All Sentiments</option>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                    <option value="Inquisitive">Inquisitive</option>
                  </select>
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
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Sentiment</th>
                      <th className="px-6 py-4">Engagement</th>
                      <th className="px-6 py-4">Date Captured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {(() => {
                      const filteredLeads = leads.filter(l => {
                        const matchesSearch = !searchTerm || 
                          (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (l.phone && l.phone.includes(searchTerm));
                        const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
                        const matchesSource = filterSource === "ALL" || l.source === filterSource;
                        const matchesSentiment = filterSentiment === "ALL" || (l.sentiment || "Neutral") === filterSentiment;
                        return matchesSearch && matchesStatus && matchesSource && matchesSentiment;
                      });

                      if (filteredLeads.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                              No matching leads found. Try adjusting your search filters!
                            </td>
                          </tr>
                        );
                      }

                      return filteredLeads.map((l) => {
                        const sentiment = l.sentiment || "Neutral";
                        const sentimentBadge = 
                          sentiment === "Positive" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          sentiment === "Negative" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          sentiment === "Inquisitive" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20";
                        
                        const score = l.engagementScore !== undefined && l.engagementScore !== null ? l.engagementScore : 15;
                        const scoreColor = 
                          score >= 70 ? "bg-emerald-500" :
                          score >= 40 ? "bg-amber-500" :
                          "bg-red-500";

                        return (
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.source === "WHATSAPP" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                l.source === "INSTAGRAM" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                                l.source === "EMAIL" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                                "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              }`}>
                                {l.source}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={l.status}
                                onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                                className={`rounded-lg border border-transparent px-2.5 py-1 text-xs font-bold focus:outline-none transition-all cursor-pointer ${
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
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sentimentBadge}`}>
                                {sentiment === "Positive" ? "🟢 Positive" :
                                 sentiment === "Negative" ? "🔴 Negative" :
                                 sentiment === "Inquisitive" ? "🔵 Inquisitive" :
                                 "⚪ Neutral"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-300 w-8">{score}%</span>
                                <div className="w-16 bg-slate-900 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {new Date(l.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      });
                    })()}
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
                          className={`w-full text-left p-4 hover:bg-slate-900/30 transition-all cursor-pointer ${
                            isSelected ? "bg-slate-900/50 border-l-2 border-emerald-500" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-slate-200 truncate pr-2 flex items-center gap-1.5">
                              {c.channel !== "WIDGET" && (
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  c.channel === "WHATSAPP" ? "bg-green-400" :
                                  c.channel === "INSTAGRAM" ? "bg-pink-400" : "bg-indigo-400"
                                }`}></span>
                              )}
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">
                            {selectedConv.lead?.name || "Anonymous Visitor"}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            selectedConv.channel === "WHATSAPP" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            selectedConv.channel === "INSTAGRAM" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                            selectedConv.channel === "EMAIL" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                            "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}>
                            {selectedConv.channel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedConv.lead?.email ? `${selectedConv.lead.email} • ` : ""}
                          {selectedConv.lead?.phone ? `${selectedConv.lead.phone} • ` : ""}
                          {selectedConv.lead?.budget ? `Budget: ${selectedConv.lead.budget}` : ""}
                        </p>
                      </div>
                      
                      {/* Takeover Control buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleToggleTakeover}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            selectedConv.isHumanTakeover
                              ? "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20"
                              : "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20"
                          }`}
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {selectedConv.isHumanTakeover ? "Release to AI" : "Take Over Chat"}
                        </button>

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
                    </div>

                    {/* Takeover Alert banner */}
                    {selectedConv.isHumanTakeover && (
                      <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                        <span>Takeover Active. AI is currently paused. Use the message panel below to chat manually.</span>
                      </div>
                    )}

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

                    {/* Manual Messaging Input Panel (only allowed when takeover is active) */}
                    <div className="p-4 border-t border-slate-900 bg-slate-950">
                      {selectedConv.isHumanTakeover ? (
                        <form onSubmit={handleSendOperatorReply} className="flex gap-2">
                          <input
                            type="text"
                            value={operatorReply}
                            onChange={(e) => setOperatorReply(e.target.value)}
                            placeholder="Type a manual response to user..."
                            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                          />
                          <button
                            type="submit"
                            disabled={!operatorReply.trim() || operatorSending}
                            className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            Send
                          </button>
                        </form>
                      ) : (
                        <p className="text-center text-xs text-slate-500 py-2">
                          💡 Click <strong>Take Over Chat</strong> at the top to pause AI and message this visitor manually.
                        </p>
                      )}
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
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateApptStatus(a.id, "CANCELLED")}
                            className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* V3: Auto Website Learning Scraper Container */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                    Auto Website Learning (Instant RAG Scraper)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Enter any website URL. Beacon will crawl the pages, extract FAQs/services, and automatically generate Knowledge Base articles using Gemini context extraction.
                  </p>

                  <form onSubmit={handleStartScrape} className="flex gap-3">
                    <input
                      type="url"
                      required
                      value={scraperUrl}
                      onChange={(e) => setScraperUrl(e.target.value)}
                      placeholder="e.g. https://theirwebsite.com"
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder-slate-700"
                    />
                    <button
                      type="submit"
                      disabled={scraperLoading || !scraperUrl}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {scraperLoading ? (
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4.5 w-4.5" />
                      )}
                      Crawl Website
                    </button>
                  </form>

                  {/* Scraper Logs Console */}
                  {scraperLogs.length > 0 && (
                    <div className="rounded-xl bg-slate-950 border border-slate-900 p-4 font-mono text-[11px] text-emerald-500 space-y-1 overflow-y-auto max-h-40 leading-relaxed shadow-inner">
                      {scraperLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-emerald-800 shrink-0">[{i+1}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PDF/Text Document RAG Upload Container */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-emerald-400" />
                    RAG Knowledge Document Upload
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload service lists, catalogs, or context files (.txt, .csv, .json) to extract and inject FAQ items into your AI agent's memory.
                  </p>

                  <div className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/20 relative hover:bg-slate-950/40 transition-colors">
                    <input
                      type="file"
                      accept=".txt,.csv,.json"
                      onChange={handleStartFileUpload}
                      disabled={kbUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                    />
                    <FileText className={`h-8 w-8 text-slate-600 mb-2 ${kbUploading ? 'animate-bounce' : ''}`} />
                    <p className="text-xs text-slate-400 text-center">
                      {kbUploading ? `Reading and extracting "${kbFileName}"...` : 'Drag and drop or click to upload knowledge document'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Supports UTF-8 text files up to 2MB</p>
                  </div>

                  {kbUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                        <span>Uploading...</span>
                        <span>{kbProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${kbProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
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
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
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
                          className="text-slate-600 hover:text-red-400 rounded-lg p-1.5 self-start transition-colors cursor-pointer"
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

          {/* TAB 6: VISITOR ACTIVITY TRACKING */}
          {activeTab === "visitor" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Live Visitor Tracking</h3>
                <p className="text-xs text-slate-500 mt-1">Geographic parameters, pages viewed, and stay duration recorded by Beacon script triggers</p>
              </div>

              <div className="overflow-hidden border border-slate-900 rounded-2xl bg-slate-900/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900/50 border-b border-slate-900 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Pages Viewed</th>
                      <th className="px-6 py-4">Stay Duration</th>
                      <th className="px-6 py-4">Log Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {visitorTracks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          No visitor activities tracked yet. Open the Widget Sandbox preview to register test logs automatically.
                        </td>
                      </tr>
                    ) : (
                      visitorTracks.map((vt) => (
                        <tr key={vt.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-400 shrink-0" />
                            {vt.location}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {vt.pagesViewed.map((page, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono">
                                  {page}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {Math.floor(vt.duration / 60)}m {vt.duration % 60}s
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(vt.createdAt).toLocaleTimeString()} ({new Date(vt.createdAt).toLocaleDateString()})
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: COMPETITOR INSIGHTS AUDIT */}
          {activeTab === "competitor" && (
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
          )}

          {/* TAB 8: MULTI-CHANNEL SETTINGS & SIMULATOR */}
          {activeTab === "integrations" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Integration Toggles Panel */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Multi-Channel Connect Setup</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure connections API keys to enable automatic lead qualifications across channels</p>
                </div>

                <form onSubmit={handleSaveConnections} className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6">
                  {/* WhatsApp */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">WhatsApp Business API Connection</span>
                      <input
                        type="checkbox"
                        checked={whatsappEnabled}
                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    {whatsappEnabled && (
                      <input
                        type="text"
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder="WhatsApp Api Access Key / Token"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">Instagram Messaging API Connection</span>
                      <input
                        type="checkbox"
                        checked={instagramEnabled}
                        onChange={(e) => setInstagramEnabled(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    {instagramEnabled && (
                      <input
                        type="text"
                        value={instagramAccountId}
                        onChange={(e) => setInstagramAccountId(e.target.value)}
                        placeholder="Instagram Account ID / Access Token"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">Email SMTP Connection</span>
                      <input
                        type="checkbox"
                        checked={emailEnabled}
                        onChange={(e) => setEmailEnabled(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 bg-slate-900 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    {emailEnabled && (
                      <input
                        type="text"
                        value={emailSmtp}
                        onChange={(e) => setEmailSmtp(e.target.value)}
                        placeholder="SMTP Connection URL (e.g. smtp.mailgun.org:587)"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Brand Branding Customizations */}
                  <div className="space-y-4 pt-4 border-t border-slate-900/60">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">AI Personalization Branding</h4>

                    {/* Chat widget Theme Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Widget Theme Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="h-8 w-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                        />
                        <input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="rounded-xl bg-slate-900 border border-slate-800/80 px-3 py-2 text-xs text-white focus:outline-none w-28 uppercase font-mono"
                        />
                        <div className="flex gap-1.5 ml-2">
                          {["#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setThemeColor(c)}
                              className="h-5.5 w-5.5 rounded-full border border-slate-950 transition-all hover:scale-110 cursor-pointer"
                              style={{ backgroundColor: c, border: themeColor === c ? '2px solid white' : 'none' }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Conversational Tone */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversational AI Tone</label>
                      <select
                        value={agentTone}
                        onChange={(e) => setAgentTone(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800/80 px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="FRIENDLY">Friendly & Approachable</option>
                        <option value="PROFESSIONAL">Professional & Corporate</option>
                        <option value="PERSUASIVE">Persuasive & Sales-driven</option>
                        <option value="BOLD">Bold & High-energy</option>
                      </select>
                    </div>

                    {/* Custom Prompt Directives */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Agent Custom Instructions (Prompt Overrides)</label>
                      <textarea
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        rows={3}
                        placeholder="e.g. Focus on scheduling demo calls first. Offer details on price packages if they ask. Never say we support custom refunds."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={connectionSaving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Save configurations
                    </button>
                  </div>
                </form>
              </div>

              {/* Interactive incoming simulator panel */}
              <div className="flex flex-col border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
                <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex items-center gap-2">
                  <Radio className="h-4.5 w-4.5 text-emerald-400 animate-pulse animate-duration-1000" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">Interactive Incoming Channel Simulator</span>
                </div>

                <form onSubmit={handleSimulateMessage} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Simulate a customer texting your business via WhatsApp, Instagram, or Email. Beacon qualifies the lead, scores it, and populates the unified Live Inbox.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Select Channel</label>
                        <select
                          value={simChannel}
                          onChange={(e) => setSimChannel(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="INSTAGRAM">Instagram</option>
                          <option value="EMAIL">Email</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Customer Name</label>
                        <input
                          type="text"
                          required
                          value={simLeadName}
                          onChange={(e) => setSimLeadName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Phone (WhatsApp ID)</label>
                        <input
                          type="text"
                          value={simLeadPhone}
                          onChange={(e) => setSimLeadPhone(e.target.value)}
                          placeholder="e.g. +12345678"
                          className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Email Address</label>
                        <input
                          type="email"
                          value={simLeadEmail}
                          onChange={(e) => setSimLeadEmail(e.target.value)}
                          placeholder="e.g. john@email.com"
                          className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Message Content</label>
                      <textarea
                        required
                        value={simMessage}
                        onChange={(e) => setSimMessage(e.target.value)}
                        rows={3}
                        placeholder="Type customer simulated message here..."
                        className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-900">
                    <button
                      type="submit"
                      disabled={simLoading || !simMessage || !simLeadName}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      <Send className="h-4 w-4" />
                      Simulate Incoming Message
                    </button>

                    {simStatus && (
                      <div className="rounded-xl bg-slate-950 border border-slate-900 p-3 font-mono text-[10px] text-emerald-400">
                        {sanitizeHtml(simStatus)}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 9: WIDGET INSTALLATION */}
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
                      {`<script\n  src="${API_URL}/widget-assets/logicra-widget.js"\n  data-business-id="${business.id}"\n  data-frontend-url="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}"\n></script>`}
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
