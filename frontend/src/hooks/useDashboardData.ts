import { useState, useEffect, useRef } from "react";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface EmployeeInfo extends UserInfo {
  createdAt: string;
}

export interface Recommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  content: string;
}

export interface BusinessInfo {
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
}

export interface FAQItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  source: string;
  status: string;
  sentiment?: string;
  engagementScore?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  leadId: string | null;
  lead: Lead | null;
  messages: Array<{ role: "user" | "model"; content: string }>;
  channel: string;
  isHumanTakeover: boolean;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  lead: Lead;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

export interface VisitorTrack {
  id: string;
  location: string;
  pagesViewed: string[];
  duration: number;
  createdAt: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitorUrl: string;
  analysis: {
    serviceCompare: Array<{ feature: string; us: string; competitor: string }>;
    missingOfferings: string[];
    contentGaps: string[];
  };
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  appointments: number;
  conversionRate: number;
}

export type TabType =
  | "overview"
  | "leads"
  | "conversations"
  | "appointments"
  | "kb"
  | "widget"
  | "visitor"
  | "competitor"
  | "integrations"
  | "team";

export function useDashboardData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Authentication States
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("beacon_token");
    }
    return null;
  });
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("beacon_user");
        return savedUser ? JSON.parse(savedUser) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [businessLoading, setBusinessLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("beacon_token");
      const savedUser = localStorage.getItem("beacon_user");
      return !!(savedToken && savedUser);
    }
    return true;
  });

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Auth flow states
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Core Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [visitorTracks, setVisitorTracks] = useState<VisitorTrack[]>([]);
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    appointments: 0,
    conversionRate: 0,
  });

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // Form input states
  const [faqTitle, setFaqTitle] = useState("");
  const [faqContent, setFaqContent] = useState("");
  const [faqLoading, setFaqLoading] = useState(false);

  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorLogs, setCompetitorLogs] = useState<string[]>([]);

  const [scraperUrl, setScraperUrl] = useState("");
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);

  const [operatorReply, setOperatorReply] = useState("");
  const [operatorSending, setOperatorSending] = useState(false);

  // Simulation controls
  const [simChannel, setSimChannel] = useState("WHATSAPP");
  const [simMessage, setSimMessage] = useState("");
  const [simLeadName, setSimLeadName] = useState("");
  const [simLeadPhone, setSimLeadPhone] = useState("");
  const [simLeadEmail, setSimLeadEmail] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simStatus, setSimStatus] = useState("");

  // Connections Settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [emailSmtp, setEmailSmtp] = useState("");
  const [connectionSaving, setConnectionSaving] = useState(false);

  // Widget settings
  const [themeColor, setThemeColor] = useState("#10B981");
  const [agentTone, setAgentTone] = useState("PROFESSIONAL");
  const [agentPrompt, setAgentPrompt] = useState("");

  // Filters for Leads
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [filterSentiment, setFilterSentiment] = useState("ALL");

  // Document RAG Upload
  const [kbProgress, setKbProgress] = useState(0);
  const [kbUploading, setKbUploading] = useState(false);
  const [kbFileName, setKbFileName] = useState("");

  // Global Loader
  const [dataLoading, setDataLoading] = useState(false);

  // Team
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeSuccess, setEmployeeSuccess] = useState("");

  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const authenticatedFetch = (url: string, options: RequestInit = {}) => {
    const headers = { ...options.headers } as Record<string, string>;
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

  const handleAddEmployee = async (data: { name: string; email: string; password?: string }) => {
    if (!business) return;
    setEmployeeLoading(true);
    setEmployeeError("");
    setEmployeeSuccess("");
    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: data.password || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to create employee");
      }
      setEmployeeSuccess(`Created operator credentials! Temporary password: ${data.password || 'Welcome123!'}`);
      fetchEmployees();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setEmployeeError(errorMsg || "Failed to create employee");
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleLogout = () => {
    authenticatedFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.removeItem("beacon_token");
    localStorage.removeItem("beacon_user");
    setToken(null);
    setUser(null);
    setBusiness(null);
    setSelectedConv(null);
    setBusinessLoading(true);
  };

  const handleLogin = async (data: { email: string; password?: string }) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const text = await res.text();
      const resData = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(resData.message || "Authentication failed");
      }

      localStorage.setItem("beacon_token", resData.token);
      localStorage.setItem("beacon_user", JSON.stringify(resData.user));
      setBusinessLoading(true);
      setToken(resData.token);
      setUser(resData.user);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errorMsg || "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (data: { name: string; email: string; password?: string }) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });
      const text = await res.text();
      const resData = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(resData.message || "Registration failed");
      }

      localStorage.setItem("beacon_token", resData.token);
      localStorage.setItem("beacon_user", JSON.stringify(resData.user));
      setBusinessLoading(true);
      setToken(resData.token);
      setUser(resData.user);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errorMsg || "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestPasswordReset = async (data: { email: string }) => {
    setAuthError("");
    setAuthLoading(true);
    setForgotSuccess(false);
    try {
      const res = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to request password reset");
      }
      setForgotSuccess(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errorMsg || "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboard = async (data: { companyName: string; website: string; industry: string; description: string }) => {
    setOnboardLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyName: data.companyName,
          website: data.website,
          industry: data.industry,
          description: data.description,
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
      const resData = await res.json();
      setBusiness(resData);
      if (resData) {
        setWhatsappEnabled(resData.whatsappEnabled);
        setInstagramEnabled(resData.instagramEnabled);
        setEmailEnabled(resData.emailEnabled);
        setWhatsappApiKey(resData.whatsappApiKey || "");
        setInstagramAccountId(resData.instagramAccountId || "");
        setEmailSmtp(resData.emailSmtp || "");
        setThemeColor(resData.themeColor || "#10B981");
        setAgentTone(resData.agentTone || "PROFESSIONAL");
        setAgentPrompt(resData.agentPrompt || "");
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(errorMsg || "An error occurred during onboarding");
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqTitle || !faqContent || !business) return;
    setFaqLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/business/faq/${faqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateApptStatus = async (apptId: string, status: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/appointments/${apptId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConnections = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setConnectionSaving(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
          agentPrompt,
        }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          channel: simChannel,
          message: simMessage,
          leadName: simLeadName || "Simulated " + simChannel + " Lead",
          leadPhone: simLeadPhone || null,
          leadEmail: simLeadEmail || null,
        }),
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
    } catch {
      setTimeout(() => {
        setSimStatus("[Error] Simulation failed. Check server logs.");
        setSimLoading(false);
      }, 2400);
    }
  };

  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !scraperUrl) return;
    setScraperLoading(true);
    setScraperLogs(["[Scraper] Initializing Web Crawler...", `[Scraper] Connecting to ${scraperUrl}...`]);

    setTimeout(() => setScraperLogs((prev) => [...prev, "[Crawl] Loading HTML homepage structure..."]), 800);
    setTimeout(() => setScraperLogs((prev) => [...prev, "[Parser] Extracted text blocks (4,000 characters)..."]), 1600);
    setTimeout(() => setScraperLogs((prev) => [...prev, "[AI Service] Querying Gemini for FAQ context extraction..."]), 2400);

    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scraperUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setScraperLogs((prev) => [
            ...prev,
            `[Success] Generated and saved ${data.count} new FAQ items directly into your Knowledge Base!`,
          ]);
          setScraperLoading(false);
          setScraperUrl("");
          refreshData();
        }, 3000);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setScraperLogs((prev) => [...prev, "[Error] Crawl failed. Re-verify the domain parameters."]);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: file.name, text }),
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
      } catch {
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

  const handleStartCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !competitorUrl) return;
    setCompetitorLoading(true);
    setCompetitorLogs(["[Auditor] Connecting to competitor domain...", `[Auditor] Fetching headers of ${competitorUrl}...`]);

    setTimeout(() => setCompetitorLogs((prev) => [...prev, "[Auditor] Extracting service lists and SEO keywords..."]), 800);
    setTimeout(() => setCompetitorLogs((prev) => [...prev, "[AI Service] Generating service compare matrices..."]), 1600);
    setTimeout(() => setCompetitorLogs((prev) => [...prev, "[AI Service] Finding missing offerings & content gaps..."]), 2400);

    try {
      const res = await authenticatedFetch(`${API_URL}/business/${business.id}/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrl }),
      });
      if (res.ok) {
        setTimeout(() => {
          setCompetitorLogs((prev) => [...prev, "[Success] Competitor audit analysis completed!"]);
          setCompetitorLoading(false);
          setCompetitorUrl("");
          refreshData();
        }, 3000);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setCompetitorLogs((prev) => [...prev, "[Error] Audit execution failed. Re-verify competitor domain."]);
        setCompetitorLoading(false);
      }, 3000);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedConv) return;
    const nextVal = !selectedConv.isHumanTakeover;
    try {
      const res = await authenticatedFetch(`${API_URL}/conversations/${selectedConv.id}/takeover`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHumanTakeover: nextVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv((prev) => (prev ? { ...prev, isHumanTakeover: data.isHumanTakeover } : null));
        setConversations((prev) =>
          prev.map((c) => (c.id === data.id ? { ...c, isHumanTakeover: data.isHumanTakeover } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendOperatorReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !operatorReply.trim() || operatorSending) return;
    setOperatorSending(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/chat/operator-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: operatorReply.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOperatorReply("");
        setSelectedConv((prev) => (prev ? { ...prev, messages: data.conversation.messages } : null));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversation.id
              ? { ...c, messages: data.conversation.messages }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOperatorSending(false);
    }
  };

  // Fetch business info
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBusiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Tab transitions / updates
  useEffect(() => {
    if (business) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, activeTab]);

  // Polling selected conversation messages
  useEffect(() => {
    if (!token || !selectedConv || activeTab !== "conversations") return;

    let activeController: AbortController | null = null;

    const interval = setInterval(() => {
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();
      const { signal } = activeController;

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
                  isHumanTakeover: data.isHumanTakeover,
                };
              }
              return prev;
            });
            setConversations((prev) =>
              prev.map((c) =>
                c.id === data.id
                  ? {
                      ...c,
                      messages: data.messages,
                      isHumanTakeover: data.isHumanTakeover,
                    }
                  : c
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
      if (activeController) {
        activeController.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedConv?.id, activeTab]);

  // Cleanup file upload interval
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  return {
    API_URL,
    token,
    setToken,
    user,
    setUser,
    business,
    setBusiness,
    businessLoading,
    activeTab,
    setActiveTab,
    leads,
    conversations,
    appointments,
    faqs,
    visitorTracks,
    competitorAnalyses,
    recommendations,
    stats,
    selectedConv,
    setSelectedConv,
    faqTitle,
    setFaqTitle,
    faqContent,
    setFaqContent,
    faqLoading,
    competitorUrl,
    setCompetitorUrl,
    competitorLoading,
    competitorLogs,
    scraperUrl,
    setScraperUrl,
    scraperLoading,
    scraperLogs,
    operatorReply,
    setOperatorReply,
    operatorSending,
    simChannel,
    setSimChannel,
    simMessage,
    setSimMessage,
    simLeadName,
    setSimLeadName,
    simLeadPhone,
    setSimLeadPhone,
    simLeadEmail,
    setSimLeadEmail,
    simLoading,
    simStatus,
    whatsappEnabled,
    setWhatsappEnabled,
    instagramEnabled,
    setInstagramEnabled,
    emailEnabled,
    setEmailEnabled,
    whatsappApiKey,
    setWhatsappApiKey,
    instagramAccountId,
    setInstagramAccountId,
    emailSmtp,
    setEmailSmtp,
    connectionSaving,
    themeColor,
    setThemeColor,
    agentTone,
    setAgentTone,
    agentPrompt,
    setAgentPrompt,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    filterSentiment,
    setFilterSentiment,
    kbProgress,
    kbUploading,
    kbFileName,
    dataLoading,
    employees,
    employeeLoading,
    employeeError,
    employeeSuccess,
    refreshData,
    handleAddEmployee,
    authView,
    setAuthView,
    authError,
    setAuthError,
    authLoading,
    forgotSuccess,
    setForgotSuccess,
    onboardLoading,
    handleLogout,
    handleLogin,
    handleRegister,
    handleRequestPasswordReset,
    handleOnboard,
    handleAddFAQ,
    handleExportLeads,
    handleDeleteFAQ,
    handleUpdateApptStatus,
    handleUpdateLeadStatus,
    handleSaveConnections,
    handleSimulateMessage,
    handleStartScrape,
    handleStartFileUpload,
    handleStartCompetitor,
    handleToggleTakeover,
    handleSendOperatorReply,
  };
}
