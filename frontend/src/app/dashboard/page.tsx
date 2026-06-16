"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Code,
  LogOut,
  TrendingUp,
  RefreshCw,
  Building,
  Globe,
  Briefcase,
  FileText,
  MapPin,
  Compass,
  Radio,
  Activity
} from "lucide-react";

import { OverviewTab } from "./components/OverviewTab";
import { LeadsTab } from "./components/LeadsTab";
import { ConversationsTab } from "./components/ConversationsTab";
import { AppointmentsTab } from "./components/AppointmentsTab";
import { KnowledgeBaseTab } from "./components/KnowledgeBaseTab";
import { VisitorTracksTab } from "./components/VisitorTracksTab";
import { CompetitorTab } from "./components/CompetitorTab";
import { TeamTab } from "./components/TeamTab";
import { WidgetTab } from "./components/WidgetTab";
import { IntegrationsTab } from "./components/IntegrationsTab";

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

export default function DashboardPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
    "overview" | "leads" | "conversations" | "appointments" | "kb" | "widget" | "visitor" | "competitor" | "integrations" | "team"
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

  // Team Seats States
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeSuccess, setEmployeeSuccess] = useState("");

  // Refs for upload interval unmount safety
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Wrapper fetch to support credentials/cookies and authorization header fallback
  const authenticatedFetch = (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
    } as any;
    
    const savedToken = localStorage.getItem("beacon_token");
    if (savedToken) {
      headers["Authorization"] = `Bearer ${savedToken}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  const handleUnauthorized = () => {
    handleLogout();
    alert("Your session has expired. Please sign in again.");
  };

  // Check Session on mount
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

  // Poll current chat conversation details when takeover chat is selected (with AbortController protection)
  useEffect(() => {
    if (!token || !selectedConv || activeTab !== "conversations") return;

    const controller = new AbortController();
    const { signal } = controller;

    const interval = setInterval(() => {
      fetch(`${API_URL}/conversations/${selectedConv.id}`, { signal })
        .then((res) => {
          if (!res.ok) throw new Error("Conversation not found");
          return res.json();
        })
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
            setConversations((prev) =>
              prev.map((c) =>
                c.id === data.id ? { ...c, messages: data.messages, isHumanTakeover: data.isHumanTakeover } : c
              )
            );
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error(err);
          }
        });
    }, 3000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [token, selectedConv, activeTab]);

  // Clear upload interval on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  const fetchBusiness = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/business`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
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
      if (activeTab === "overview") {
        const statsRes = await authenticatedFetch(`${API_URL}/leads/stats/${business.id}`);
        if (statsRes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (statsRes.ok) setStats(await statsRes.json());
        
        const recsRes = await authenticatedFetch(`${API_URL}/business/${business.id}/recommendations`);
        if (recsRes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (recsRes.ok) setRecommendations(await recsRes.json());
      } else if (activeTab === "leads") {
        const res = await authenticatedFetch(`${API_URL}/leads/business/${business.id}`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setLeads(await res.json());
      } else if (activeTab === "conversations") {
        const res = await authenticatedFetch(`${API_URL}/conversations/business/${business.id}`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) {
          const list = await res.json();
          setConversations(list);
          if (selectedConv) {
            const updated = list.find((c: Conversation) => c.id === selectedConv.id);
            if (updated) setSelectedConv(updated);
          }
        }
      } else if (activeTab === "appointments") {
        const res = await authenticatedFetch(`${API_URL}/appointments/business/${business.id}`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setAppointments(await res.json());
      } else if (activeTab === "kb") {
        const res = await authenticatedFetch(`${API_URL}/business/${business.id}/faq`);
        if (res.ok) setFaqs(await res.json());
      } else if (activeTab === "visitor") {
        const res = await authenticatedFetch(`${API_URL}/business/${business.id}/visitor-tracks`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setVisitorTracks(await res.json());
      } else if (activeTab === "competitor") {
        const res = await authenticatedFetch(`${API_URL}/business/${business.id}/competitor-analysis`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setCompetitorAnalyses(await res.json());
      } else if (activeTab === "team") {
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Data refresh failed", err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!business) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/employees`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeEmail || !employeeName || !business) return;
    setEmployeeLoading(true);
    setEmployeeError("");
    setEmployeeSuccess("");
    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: employeeEmail,
          name: employeeName,
          password: employeePassword || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create employee");
      }
      setEmployeeSuccess(`Created operator credentials! Temporary password: ${employeePassword || 'Welcome123!'}`);
      setEmployeeEmail("");
      setEmployeeName("");
      setEmployeePassword("");
      fetchEmployees();
    } catch (err: any) {
      setEmployeeError(err?.message || String(err) || "Failed to create employee");
    } finally {
      setEmployeeLoading(false);
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
      setAuthError(err?.message || String(err) || "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  function handleLogout() {
    // Clear cookies on backend side
    authenticatedFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.removeItem("beacon_token");
    localStorage.removeItem("beacon_user");
    setToken(null);
    setUser(null);
    setBusiness(null);
    setSelectedConv(null);
    setBusinessLoading(true);
  }

  // Onboarding Handler
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyName: compName,
          website: compWeb,
          industry: compInd,
          description: compDesc,
        }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
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
      alert(err?.message || String(err) || "An error occurred during onboarding");
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
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/faq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
    window.open(`${API_URL}/leads/business/${business.id}/export`, "_blank");
  };

  // Delete FAQ Handler
  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/business/faq/${faqId}`, {
        method: "DELETE"
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
      const res = await authenticatedFetch(`${API_URL}/appointments/${apptId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/chat/simulate-incoming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);

    uploadIntervalRef.current = setInterval(() => {
      setKbProgress((prev) => {
        if (prev >= 95) {
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
          return 95;
        }
        return prev + 15;
      });
    }, 150);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await authenticatedFetch(`${API_URL}/business/${business.id}/import-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ title: file.name, text })
        });
        
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
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
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
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
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/competitor-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/conversations/${selectedConv.id}/takeover`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
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
      const res = await authenticatedFetch(`${API_URL}/chat/operator-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: operatorReply.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOperatorReply("");
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

  // RENDER: Loading Gate
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

  // RENDER: Onboarding Wizard
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

          <div className="text-center mt-4">
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
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

            {user?.role === "ADMIN" && (
              <>
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
                  onClick={() => setActiveTab("team")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "team"
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Users className="h-4.5 w-4.5" />
                  Team Members
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
              </>
            )}
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-emerald-400">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
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
               activeTab === "team" ? "Team Seats Management" :
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
          {activeTab === "overview" && (
            <OverviewTab
              user={user}
              stats={stats}
              recommendations={recommendations}
              whatsappEnabled={whatsappEnabled}
              instagramEnabled={instagramEnabled}
              emailEnabled={emailEnabled}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "leads" && (
            <LeadsTab
              leads={leads}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterSource={filterSource}
              setFilterSource={setFilterSource}
              filterSentiment={filterSentiment}
              setFilterSentiment={setFilterSentiment}
              handleExportLeads={handleExportLeads}
              handleUpdateLeadStatus={handleUpdateLeadStatus}
            />
          )}

          {activeTab === "conversations" && (
            <ConversationsTab
              conversations={conversations}
              selectedConv={selectedConv}
              setSelectedConv={setSelectedConv}
              handleToggleTakeover={handleToggleTakeover}
              operatorReply={operatorReply}
              setOperatorReply={setOperatorReply}
              handleSendOperatorReply={handleSendOperatorReply}
              operatorSending={operatorSending}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              handleUpdateApptStatus={handleUpdateApptStatus}
            />
          )}

          {activeTab === "kb" && (
            <KnowledgeBaseTab
              user={user}
              business={business}
              faqs={faqs}
              scraperUrl={scraperUrl}
              setScraperUrl={setScraperUrl}
              scraperLoading={scraperLoading}
              scraperLogs={scraperLogs}
              handleStartScrape={handleStartScrape}
              kbUploading={kbUploading}
              kbFileName={kbFileName}
              kbProgress={kbProgress}
              handleStartFileUpload={handleStartFileUpload}
              faqTitle={faqTitle}
              setFaqTitle={setFaqTitle}
              faqContent={faqContent}
              setFaqContent={setFaqContent}
              faqLoading={faqLoading}
              handleAddFAQ={handleAddFAQ}
              handleDeleteFAQ={handleDeleteFAQ}
            />
          )}

          {activeTab === "visitor" && (
            <VisitorTracksTab
              visitorTracks={visitorTracks}
            />
          )}

          {activeTab === "competitor" && (
            <CompetitorTab
              competitorUrl={competitorUrl}
              setCompetitorUrl={setCompetitorUrl}
              competitorLoading={competitorLoading}
              competitorLogs={competitorLogs}
              handleStartCompetitor={handleStartCompetitor}
              competitorAnalyses={competitorAnalyses}
              business={business}
            />
          )}

          {activeTab === "team" && (
            <TeamTab
              employees={employees}
              employeeError={employeeError}
              employeeSuccess={employeeSuccess}
              employeeEmail={employeeEmail}
              setEmployeeEmail={setEmployeeEmail}
              employeeName={employeeName}
              setEmployeeName={setEmployeeName}
              employeePassword={employeePassword}
              setEmployeePassword={setEmployeePassword}
              employeeLoading={employeeLoading}
              handleAddEmployee={handleAddEmployee}
            />
          )}

          {activeTab === "widget" && (
            <WidgetTab
              business={business}
              API_URL={API_URL}
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationsTab
              business={business}
              whatsappEnabled={whatsappEnabled}
              setWhatsappEnabled={setWhatsappEnabled}
              whatsappApiKey={whatsappApiKey}
              setWhatsappApiKey={setWhatsappApiKey}
              instagramEnabled={instagramEnabled}
              setInstagramEnabled={setInstagramEnabled}
              instagramAccountId={instagramAccountId}
              setInstagramAccountId={setInstagramAccountId}
              emailEnabled={emailEnabled}
              setEmailEnabled={setEmailEnabled}
              emailSmtp={emailSmtp}
              setEmailSmtp={setEmailSmtp}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              agentTone={agentTone}
              setAgentTone={setAgentTone}
              agentPrompt={agentPrompt}
              setAgentPrompt={setAgentPrompt}
              connectionSaving={connectionSaving}
              handleSaveConnections={handleSaveConnections}
              simChannel={simChannel}
              setSimChannel={setSimChannel}
              simLeadName={simLeadName}
              setSimLeadName={setSimLeadName}
              simLeadPhone={simLeadPhone}
              setSimLeadPhone={setSimLeadPhone}
              simLeadEmail={simLeadEmail}
              setSimLeadEmail={setSimLeadEmail}
              simMessage={simMessage}
              setSimMessage={setSimMessage}
              simLoading={simLoading}
              simStatus={simStatus}
              handleSimulateMessage={handleSimulateMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
