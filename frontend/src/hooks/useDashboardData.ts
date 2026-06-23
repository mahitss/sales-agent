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
  googleSheetsSpreadsheetId?: string;
  googleSheetsEnabled: boolean;
  subscription?: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
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
  totalExpectedRevenue: number;
  revenueForecast: number;
  averageLeadScore: number;
  leadConversionRate: number;
}

export interface AccountResearch {
  id: string;
  businessId: string;
  domain: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  summary?: string;
  industry?: string;
  employeeEstimate?: string;
  techStack: string[];
  challenges: string[];
  opportunities: string[];
  buyingSignals: string[];
  outreachStrategy?: string;
  emailDraft?: string;
  meetingNotes?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
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
  | "team"
  | "billing"
  | "activity"
  | "automations"
  | "settings"
  | "queues"
  | "account-research"
  | "scoring"
  | "ai-analytics";


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
    totalExpectedRevenue: 0,
    revenueForecast: 0,
    averageLeadScore: 0,
    leadConversionRate: 0,
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
  const [googleSheetsSpreadsheetId, setGoogleSheetsSpreadsheetId] = useState("");
  const [googleSheetsEnabled, setGoogleSheetsEnabled] = useState(false);
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

  // Audit activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // CRM, Outreach, & Automations
  const [outreachSequences, setOutreachSequences] = useState<any[]>([]);
  const [workflowRules, setWorkflowRules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; content: string; type: string; timestamp: Date }>>([]);

  // Growth & Settings
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralMetrics, setReferralMetrics] = useState<any>({ totalCount: 0, convertedCount: 0, conversionRate: 0 });
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // API Keys & Webhooks
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  // Queues Monitoring States
  const [queueMetrics, setQueueMetrics] = useState<any>(null);
  const [queueFailures, setQueueFailures] = useState<any[]>([]);
  const [queuesLoading, setQueuesLoading] = useState(false);

  // Account Intelligence States
  const [accountResearches, setAccountResearches] = useState<AccountResearch[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);

  // Workflow Automation States
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowExecutions, setWorkflowExecutions] = useState<any[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<any>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Connected Emails & Campaigns Sequences States
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [emailSequences, setEmailSequences] = useState<any[]>([]);
  const [emailActivities, setEmailActivities] = useState<any[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);



  const fetchQueueMetrics = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/jobs/metrics`);
      if (res.ok) {
        const data = await res.json();
        setQueueMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to fetch queue metrics", err);
    }
  };

  const fetchQueueFailures = async () => {
    setQueuesLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/jobs/failures`);
      if (res.ok) {
        const data = await res.json();
        setQueueFailures(data.failures || []);
      }
    } catch (err) {
      console.error("Failed to fetch queue failures", err);
    } finally {
      setQueuesLoading(false);
    }
  };

  const fetchAccountResearchHistory = async () => {
    setResearchLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/account-research/history`);
      if (res.ok) {
        setAccountResearches(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch account research history", err);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleAnalyzeAccount = async (domain: string) => {
    if (!domain) return;
    setResearchLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/account-research/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        addNotification(
          "Research Started",
          `Background analysis initiated for domain: ${domain}`,
          "info"
        );
        await fetchAccountResearchHistory();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to trigger account analysis");
      }
    } catch (err) {
      console.error(err);
      alert("Error initiating account analysis");
    } finally {
      setResearchLoading(false);
    }
  };

  const handleDownloadBriefingPdf = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/account-research/${id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `briefing-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download PDF briefing");
      }
    } catch (err) {
      console.error(err);
      alert("Error downloading PDF briefing");
    }
  };

  const fetchWorkflows = async () => {
    if (!business) return;
    setWorkflowLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/workflows/business/${business.id}`);
      if (res.ok) {
        setWorkflows(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch workflows", err);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const fetchWorkflowExecutions = async (workflowId: string) => {
    setWorkflowLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/workflows/${workflowId}/executions`);
      if (res.ok) {
        setWorkflowExecutions(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch executions", err);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const fetchWorkflowMetrics = async () => {
    if (!business) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/workflows/business/${business.id}/metrics`);
      if (res.ok) {
        setWorkflowMetrics(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch workflow metrics", err);
    }
  };

  const handleSaveWorkflow = async (
    id: string | null,
    name: string,
    trigger: string,
    nodes: any[],
    edges: any[],
  ) => {
    setWorkflowLoading(true);
    try {
      const url = id ? `${API_URL}/workflows/${id}` : `${API_URL}/workflows`;
      const method = id ? "PUT" : "POST";
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, trigger, nodes, edges }),
      });
      if (res.ok) {
        addNotification(
          "Workflow Saved",
          `Successfully saved workflow configuration for: ${name}`,
          "success"
        );
        await fetchWorkflows();
        await fetchWorkflowMetrics();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to save workflow");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving workflow");
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleToggleWorkflow = async (id: string, isEnabled: boolean) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (res.ok) {
        addNotification(
          "Workflow Updated",
          `Workflow toggled ${isEnabled ? "ON" : "OFF"}.`,
          "info"
        );
        await fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleRetryJob = async (queueName: string, jobId: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/jobs/retry/${queueName}/${jobId}`, {
        method: "POST",
      });
      if (res.ok) {
        addNotification(
          "Job Promoted",
          `Job ${jobId.substring(0, 8)} in queue ${queueName} promoted for retry.`,
          "success"
        );
        await fetchQueueMetrics();
        await fetchQueueFailures();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to retry job");
      }
    } catch (err) {
      console.error(err);
      alert("Error retrying job");
    }
  };

  const handleRetryAllJobs = async (queueName: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/jobs/retry-all/${queueName}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(
          "Queue Retried",
          data.message,
          "success"
        );
        await fetchQueueMetrics();
        await fetchQueueFailures();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to retry all jobs");
      }
    } catch (err) {
      console.error(err);
      alert("Error retrying all jobs");
    }
  };

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
          setGoogleSheetsSpreadsheetId(data.googleSheetsSpreadsheetId || "");
          setGoogleSheetsEnabled(data.googleSheetsEnabled || false);
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
        if (res.ok) {
          const json = await res.json();
          setLeads(Array.isArray(json) ? json : json.data || []);
        }
        // Pre-fetch email data for lead detail drawer
        await fetchEmailAccounts();
        await fetchEmailTemplates();
        await fetchEmailSequences();
      } else if (activeTab === "conversations") {
        const res = await authenticatedFetch(`${API_URL}/conversations/business/${business.id}`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
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
      } else if (activeTab === "activity") {
        const res = await authenticatedFetch(`${API_URL}/business/${business.id}/activities`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setActivityLogs(await res.json());
      } else if (activeTab === "integrations") {
        await fetchEmailAccounts();
      } else if (activeTab === "automations") {
        const res = await authenticatedFetch(`${API_URL}/crm/business/${business.id}/workflow-rules`);
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) setWorkflowRules(await res.json());
        fetchOutreachSequences();
        await fetchWorkflows();
        await fetchWorkflowMetrics();
        await fetchEmailAccounts();
        await fetchEmailTemplates();
        await fetchEmailSequences();
      } else if (activeTab === "settings") {
        await fetchWaitlist();
        await fetchReferrals();
        await fetchSessions();
        await fetchApiKeys();
        await fetchWebhooks();
      } else if (activeTab === "queues") {
        await fetchQueueMetrics();
        await fetchQueueFailures();
      } else if (activeTab === "account-research") {
        await fetchAccountResearchHistory();
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

  const fetchWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/waitlist`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setWaitlist(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch waitlist", err);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleApproveWaitlist = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/waitlist/${id}/approve`, {
        method: "POST",
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        addNotification("Waitlist Approved", "User has been approved and invited successfully.", "success");
        fetchWaitlist();
      } else {
        alert("Failed to approve waitlist user.");
      }
    } catch (err) {
      console.error("Failed to approve waitlist entry", err);
    }
  };

  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/referrals`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
        setReferralMetrics(data.metrics || { totalCount: 0, convertedCount: 0, conversionRate: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch referrals", err);
    } finally {
      setReferralsLoading(false);
    }
  };

  const handleCreateReferral = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/referral`, {
        method: "POST",
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        addNotification("Referral Code Created", "Your referral link is ready to share!", "success");
        fetchReferrals();
      }
    } catch (err) {
      console.error("Failed to create referral code", err);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/sessions`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/sessions/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        addNotification("Session Revoked", "Active login session has been closed.", "success");
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to revoke session", err);
    }
  };

  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/apikeys`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setApiKeys(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch api keys", err);
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateApiKey = async (name: string, expiresDays?: number) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/apikeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiresDays }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return null;
      }
      const data = await res.json();
      if (res.ok) {
        addNotification("API Key Created", "Developer key generated successfully.", "success");
        fetchApiKeys();
        return data.rawKey;
      } else {
        alert(data.message || "Failed to create API key");
        return null;
      }
    } catch (err) {
      console.error("Failed to create API key", err);
      return null;
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/auth/apikeys/${id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        addNotification("API Key Revoked", "Developer key deleted permanently.", "success");
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to revoke API key", err);
    }
  };

  const fetchWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/business/webhooks`);
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setWebhooks(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch webhooks", err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  const handleCreateWebhook = async (url: string, events: string[]) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/business/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        addNotification("Webhook Subscribed", "Outbound events will be published to your URL.", "success");
        fetchWebhooks();
      } else {
        alert(data.message || "Failed to subscribe webhook");
      }
    } catch (err) {
      console.error("Failed to create webhook", err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/business/webhooks/${id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        addNotification("Webhook Deleted", "Webhook subscription removed.", "success");
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Failed to delete webhook", err);
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

  const handleGoogleAuth = async (mode: "login" | "register") => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/sso/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samlResponse: "google-oauth-mock-token" }),
      });
      const text = await res.text();
      const resData = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(resData.message || "Google authentication failed");
      }

      localStorage.setItem("beacon_token", resData.token);
      localStorage.setItem("beacon_user", JSON.stringify(resData.user));
      setBusinessLoading(true);
      setToken(resData.token);
      setUser(resData.user);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errorMsg || "Google authentication failed");
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
        setGoogleSheetsSpreadsheetId(resData.googleSheetsSpreadsheetId || "");
        setGoogleSheetsEnabled(resData.googleSheetsEnabled || false);
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

  const handleExportLeadsExcel = () => {
    if (!business) return;
    window.open(`${API_URL}/leads/business/${business.id}/export/excel`, "_blank");
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

  const addNotification = (title: string, content: string, type: "info" | "success" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [
      { id, title, content, type, timestamp: new Date() },
      ...prev.slice(0, 19),
    ]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const fetchOutreachSequences = async () => {
    if (!business) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/crm/business/${business.id}/outreach`);
      if (res.ok) setOutreachSequences(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleOutreach = async (leadId: string, template: string, subject: string, bodyText: string, delayMinutes?: number) => {
    if (!business) return false;
    try {
      const res = await authenticatedFetch(`${API_URL}/crm/business/${business.id}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, template, subject, bodyText, delayMinutes }),
      });
      if (res.ok) {
        addNotification("Sequence Scheduled", `Campaign template ${template} scheduled.`, "success");
        fetchOutreachSequences();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleToggleWorkflowRule = async (ruleId: string, isEnabled: boolean) => {
    if (!business) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/crm/workflow-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (res.ok) {
        addNotification("Automation Updated", `Workflow rule configuration updated.`, "success");
        const rulesRes = await authenticatedFetch(`${API_URL}/crm/business/${business.id}/workflow-rules`);
        if (rulesRes.ok) setWorkflowRules(await rulesRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrichCompany = async (leadId: string, domain: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/crm/company/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, domain }),
      });
      if (res.ok) {
        addNotification("Company Enriched", `Profile data scraped for ${domain}`, "success");
        refreshData();
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleFindEmails = async (domain: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/crm/company/email-finder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        addNotification("Domain Scanned", `Verified business contacts discovered.`, "success");
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        addNotification("Lead Status Updated", `Lead status successfully shifted to ${status}.`, "success");
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
          googleSheetsSpreadsheetId,
          googleSheetsEnabled,
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

  const handleStripeCheckout = async (planId: string) => {
    if (!business) return;
    try {
      const returnUrl = window.location.origin + "/dashboard";
      const res = await authenticatedFetch(`${API_URL}/stripe/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, planId, returnUrl }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to initiate Stripe checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting payment gateway");
    }
  };

  const handleStripePortal = async () => {
    if (!business) return;
    try {
      const returnUrl = window.location.origin + "/dashboard";
      const res = await authenticatedFetch(`${API_URL}/stripe/billing-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, returnUrl }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to load Stripe billing portal");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting payment gateway");
    }
  };

  // Complete mock payment if redirect payload is in the URL
  useEffect(() => {
    if (typeof window !== "undefined" && token && business) {
      const params = new URLSearchParams(window.location.search);
      const mockSession = params.get("mock_session_id");
      const planId = params.get("plan_id");
      const businessId = params.get("business_id");
      if (mockSession && planId && businessId === business.id) {
        authenticatedFetch(`${API_URL}/stripe/mock-checkout-success`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, planId }),
        })
          .then((res) => {
            if (res.ok) {
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
              fetchBusiness();
            }
          })
          .catch((err) => console.error("Mock checkout completion failed", err));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, business?.id]);

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

  const fetchEmailAccounts = async () => {
    setEmailLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/integrations/email/accounts`);
      if (res.ok) {
        setEmailAccounts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch email accounts", err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConnectEmailAccount = async (provider: 'GMAIL' | 'OUTLOOK') => {
    setEmailLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard`;
      const res = await authenticatedFetch(
        `${API_URL}/integrations/email/connect?provider=${provider}&redirectUri=${encodeURIComponent(redirectUri)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (data.url.includes("mock_")) {
            const urlObj = new URL(data.url);
            const mockCode = urlObj.searchParams.get("code") || "";
            const mockState = urlObj.searchParams.get("state") || "";
            
            const callbackRes = await authenticatedFetch(`${API_URL}/integrations/email/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider,
                code: mockCode,
                redirectUri
              })
            });
            if (callbackRes.ok) {
              addNotification(
                "Account Connected",
                `Connected mock sandbox ${provider} email account.`,
                "success"
              );
              await fetchEmailAccounts();
            }
          } else {
            window.location.href = data.url;
          }
        }
      }
    } catch (err) {
      console.error("OAuth connect error", err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDisconnectEmailAccount = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/integrations/email/accounts/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        addNotification("Account Disconnected", "Email mailbox integration disconnected successfully.", "info");
        await fetchEmailAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-templates`);
      if (res.ok) {
        setEmailTemplates(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const handleSaveEmailTemplate = async (id: string | null, name: string, subject: string, body: string) => {
    setEmailLoading(true);
    try {
      const url = id ? `${API_URL}/email-templates/${id}` : `${API_URL}/email-templates`;
      const method = id ? "PUT" : "POST";
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, body })
      });
      if (res.ok) {
        addNotification("Template Saved", `Successfully saved template: ${name}`, "success");
        await fetchEmailTemplates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteEmailTemplate = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        addNotification("Template Deleted", "Email template removed.", "info");
        await fetchEmailTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmailSequences = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-sequences`);
      if (res.ok) {
        setEmailSequences(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch sequences", err);
    }
  };

  const handleSaveEmailSequence = async (id: string | null, name: string, steps: any[]) => {
    setEmailLoading(true);
    try {
      const url = id ? `${API_URL}/email-sequences/${id}` : `${API_URL}/email-sequences`;
      const method = id ? "PUT" : "POST";
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, steps })
      });
      if (res.ok) {
        addNotification("Sequence Saved", `Successfully saved sequence: ${name}`, "success");
        await fetchEmailSequences();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteEmailSequence = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-sequences/${id}`, { method: "DELETE" });
      if (res.ok) {
        addNotification("Sequence Deleted", "Email sequence removed.", "info");
        await fetchEmailSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrollLeadInSequence = async (sequenceId: string, leadIds: string[]) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-sequences/${sequenceId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds })
      });
      if (res.ok) {
        addNotification("Lead Enrolled", "Successfully enrolled lead in sequence.", "success");
        await fetchEmailSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisenrollLeadFromSequence = async (sequenceId: string, leadIds: string[]) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/email-sequences/${sequenceId}/disenroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds })
      });
      if (res.ok) {
        addNotification("Lead Disenrolled", "Lead sequence outreach paused.", "info");
        await fetchEmailSequences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmailActivities = async (leadId: string) => {
    try {
      const res = await authenticatedFetch(`${API_URL}/integrations/email/activities/${leadId}`);
      if (res.ok) {
        setEmailActivities(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch lead activities", err);
    }
  };

  const handleSendManualEmail = async (accountId: string, to: string, subject: string, body: string, leadId?: string) => {
    setEmailLoading(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/integrations/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, to, subject, body, leadId }),
      });
      if (res.ok) {
        addNotification("Email Sent", `Email sent to ${to} successfully.`, "success");
        if (leadId) await fetchEmailActivities(leadId);
        return true;
      } else {
        const err = await res.json();
        alert(err.message || "Failed to send email");
      }
    } catch (err) {
      console.error("Send email failed", err);
      alert("Error sending email");
    } finally {
      setEmailLoading(false);
    }
    return false;
  };

  // Intercept real OAuth callback landings in dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && business) {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const stateStr = searchParams.get("state");
      
      if (code && stateStr) {
        // Clear params to prevent double callback trigger
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          const stateObj = JSON.parse(decodeURIComponent(stateStr));
          const provider = stateObj.provider;
          const redirectUri = `${window.location.origin}/dashboard`;
          
          authenticatedFetch(`${API_URL}/integrations/email/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, code, redirectUri })
          }).then(async (res) => {
            if (res.ok) {
              addNotification("Account Connected", `Successfully connected ${provider} email account!`, "success");
              await fetchEmailAccounts();
            } else {
              const err = await res.json();
              alert(err.message || "Failed to complete email callback");
            }
          });
        } catch (e) {
          console.error("Failed to parse callback state parameters", e);
        }
      }
    }
  }, [business]);

  return {
    API_URL,
    token,
    user,
    business,
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
    handleGoogleAuth,
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
    googleSheetsSpreadsheetId,
    setGoogleSheetsSpreadsheetId,
    googleSheetsEnabled,
    setGoogleSheetsEnabled,
    handleExportLeadsExcel,
    activityLogs,
    handleStripeCheckout,
    handleStripePortal,
    outreachSequences,
    workflowRules,
    notifications,
    addNotification,
    removeNotification,
    handleScheduleOutreach,
    handleToggleWorkflowRule,
    handleEnrichCompany,
    handleFindEmails,
    waitlist,
    waitlistLoading,
    referrals,
    referralMetrics,
    referralsLoading,
    sessions,
    sessionsLoading,
    handleApproveWaitlist,
    handleCreateReferral,
    handleRevokeSession,
    apiKeys,
    apiKeysLoading,
    webhooks,
    webhooksLoading,
    handleCreateApiKey,
    handleRevokeApiKey,
    handleCreateWebhook,
    handleDeleteWebhook,
    queueMetrics,
    queueFailures,
    queuesLoading,
    fetchQueueMetrics,
    fetchQueueFailures,
    handleRetryJob,
    handleRetryAllJobs,
    accountResearches,
    researchLoading,
    handleAnalyzeAccount,
    handleDownloadBriefingPdf,
    fetchAccountResearchHistory,
    workflows,
    workflowExecutions,
    workflowMetrics,
    workflowLoading,
    fetchWorkflows,
    fetchWorkflowExecutions,
    fetchWorkflowMetrics,
    handleSaveWorkflow,
    handleToggleWorkflow,
    emailAccounts,
    emailTemplates,
    emailSequences,
    emailActivities,
    emailLoading,
    fetchEmailAccounts,
    handleConnectEmailAccount,
    handleDisconnectEmailAccount,
    fetchEmailTemplates,
    handleSaveEmailTemplate,
    handleDeleteEmailTemplate,
    fetchEmailSequences,
    handleSaveEmailSequence,
    handleDeleteEmailSequence,
    handleEnrollLeadInSequence,
    handleDisenrollLeadFromSequence,
    fetchEmailActivities,
    handleSendManualEmail,
  };
}
