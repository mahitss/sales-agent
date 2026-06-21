import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Sparkles,
  Building2,
  Mail,
  Send,
  Compass,
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase,
  Eye,
  Reply,
  ArrowUpRight,
  ArrowDownLeft,
  PlayCircle,
  PauseCircle,
  Inbox,
  RefreshCw,
  Target,
  TrendingUp,
  MessageSquare,
  MousePointer,
} from "lucide-react";

interface Lead {
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
  score?: {
    id: string;
    score: number;
    classification: string;
    dealProbability: number;
    urgency: string;
    decisionMakerStatus: string;
    businessSize: string;
    serviceMatch: string;
    engagement: number;
    buyingIntent?: string;
    companyGrowth?: string;
    hiringSignals?: string;
    engagementActivity?: string;
    websiteActivity?: string;
    emailActivity?: string;
    reasoning?: string;
    recommendedAction?: string;
    priority?: string;
  };
}

interface LeadDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdateStatus: (leadId: string, status: string) => void;
  handleScheduleOutreach: (leadId: string, template: string, subject: string, bodyText: string) => Promise<boolean>;
  handleEnrichCompany: (leadId: string, domain: string) => Promise<any>;
  handleFindEmails: (domain: string) => Promise<any>;
  outreachSequences: any[];
  // Email integration props
  emailAccounts?: any[];
  emailActivities?: any[];
  emailTemplates?: any[];
  emailSequences?: any[];
  emailLoading?: boolean;
  fetchEmailActivities?: (leadId: string) => void;
  handleSendManualEmail?: (accountId: string, to: string, subject: string, body: string, leadId?: string) => Promise<boolean>;
  handleEnrollLeadInSequence?: (sequenceId: string, leadIds: string[]) => Promise<void>;
  handleDisenrollLeadFromSequence?: (sequenceId: string, leadIds: string[]) => Promise<void>;
  token?: string;
  API_URL?: string;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  isOpen,
  onClose,
  lead,
  onUpdateStatus,
  handleScheduleOutreach,
  handleEnrichCompany,
  handleFindEmails,
  outreachSequences,
  // Email integration props
  emailAccounts = [],
  emailActivities = [],
  emailTemplates = [],
  emailSequences = [],
  emailLoading = false,
  fetchEmailActivities,
  handleSendManualEmail,
  handleEnrollLeadInSequence,
  handleDisenrollLeadFromSequence,
  token = "",
  API_URL = "",
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "enrichment" | "outreach" | "email">("analysis");

  // Mock enrichment states
  const [domainInput, setDomainInput] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichLogs, setEnrichLogs] = useState<string[]>([]);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  // Email finder states
  const [finderDomain, setFinderDomain] = useState("");
  const [finding, setFinding] = useState(false);
  const [foundEmails, setFoundEmails] = useState<any[]>([]);

  // Outreach sequence states
  const [emailTemplate, setEmailTemplate] = useState("INTRO_PITCH");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Manual email compose states
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sending, setSending] = useState(false);

  // Sequence enrollment
  const [selectedSequenceId, setSelectedSequenceId] = useState("");

  useEffect(() => {
    if (lead) {
      // Auto-extract domain from email if available
      if (lead.email && lead.email.includes("@")) {
        const domain = lead.email.split("@")[1];
        if (!domain.match(/gmail|yahoo|outlook|hotmail/)) {
          setDomainInput(domain);
          setFinderDomain(domain);
        }
      }
      setCompanyDetails(null);
      setFoundEmails([]);

      // Fetch email activities for this lead
      if (fetchEmailActivities) {
        fetchEmailActivities(lead.id);
      }

      // Pre-select first connected email account
      if (emailAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(emailAccounts[0].id);
      }
    }
  }, [lead]);

  // Scoring History and Rescoring States
  const [scoringHistory, setScoringHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  const fetchScoreHistory = useCallback(async () => {
    if (!lead || !token || !API_URL) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/leads/${lead.id}/score-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setScoringHistory(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch score history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [lead, token, API_URL]);

  useEffect(() => {
    if (lead) {
      fetchScoreHistory();
    } else {
      setScoringHistory([]);
    }
  }, [lead, fetchScoreHistory]);

  const handleRescoreLead = async () => {
    if (!lead || !token || !API_URL || rescoring) return;
    setRescoring(true);
    try {
      const res = await fetch(`${API_URL}/leads/${lead.id}/score`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        console.log("Successfully re-scored lead");
      }
      await fetchScoreHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setRescoring(false);
    }
  };

  // Update selected account when accounts load
  useEffect(() => {
    if (emailAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(emailAccounts[0].id);
    }
  }, [emailAccounts]);

  if (!isOpen || !lead) return null;

  // Filter outreach sequences for this lead
  const leadOutreach = outreachSequences.filter((os) => os.leadId === lead.id);

  // Mock intelligence reports
  const mockAIAnalysis = {
    goals: "Qualify automated sales CRM integrations for inbound tracking.",
    painPoints: "Existing manual workflows lead to high drop-offs and low qualification rates.",
    services: "Multi-Channel AI Sales Widget and WhatsApp API integrations.",
    objections: "Concerned about data residency policies and billing limits.",
    nextAction: "Provide custom Enterprise integration blueprint during the next scheduled call.",
  };

  const handleEnrichTrigger = async () => {
    if (!domainInput) return;
    setEnriching(true);
    setEnrichLogs(["[Enricher] Intercepting domain URL query...", `[Enricher] Querying DNS registers for ${domainInput}...`]);

    setTimeout(() => setEnrichLogs((prev) => [...prev, "[Agent] Harvesting WHOIS registrations and MX records..."]), 500);
    setTimeout(() => setEnrichLogs((prev) => [...prev, "[Agent] Resolving LinkedIn organization API metadata..."]), 1000);
    setTimeout(() => setEnrichLogs((prev) => [...prev, "[Enricher] Compiling technology stacks & hosting data..."]), 1500);

    try {
      const data = await handleEnrichCompany(lead.id, domainInput);
      setTimeout(() => {
        setEnrichLogs((prev) => [...prev, "[Success] Enrichment dossier compiled successfully!"]);
        setCompanyDetails(data);
        setEnriching(false);
      }, 2000);
    } catch {
      setEnriching(false);
    }
  };

  const handleFindEmailsTrigger = async () => {
    if (!finderDomain) return;
    setFinding(true);
    try {
      const data = await handleFindEmails(finderDomain);
      if (data && data.contacts) {
        setFoundEmails(data.contacts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFinding(false);
    }
  };

  const handleOutreachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) return;
    setScheduling(true);
    try {
      const success = await handleScheduleOutreach(lead.id, emailTemplate, emailSubject, emailBody);
      if (success) {
        setEmailSubject("");
        setEmailBody("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScheduling(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    setEmailTemplate(template);
    if (template === "INTRO_PITCH") {
      setEmailSubject(`Custom AI Automation Partnership - ${lead.name}`);
      setEmailBody(`Hi ${lead.name},\n\nI saw you checked out our site widget configurations. I'd love to show you how our multi-channel conversational AI can increase your inbound qualified leads by 40%.\n\nAre you available for a brief demo next Tuesday?\n\nBest regards,\nSales Team`);
    } else if (template === "FOLLOW_UP") {
      setEmailSubject(`Following up on our conversation - ${lead.name}`);
      setEmailBody(`Hi ${lead.name},\n\nHope you are doing well. I am following up on your session with our AI Sales assistant. I noticed you discussed integration goals for budget range: ${lead.budget || "₹50,000"}.\n\nWould you like me to send over our customized API integration guide?\n\nBest,\nSales Team`);
    }
  };

  // Trigger default templates once when drawer loads
  if (!emailSubject && !emailBody) {
    handleTemplateChange("INTRO_PITCH");
  }

  const handleDownloadDossier = () => {
    const printContent = `
      <html>
        <head>
          <title>Lead Intelligence Dossier - ${lead.name}</title>
          <style>
            body { font-family: sans-serif; color: #1e293b; padding: 40px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #0f172a; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #10b981; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .item { margin-bottom: 10px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .value { font-size: 14px; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Lead Intelligence Dossier</h1>
            <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <div class="section-title">Lead Overview</div>
            <div class="grid">
              <div class="item"><div class="label">Name</div><div class="value">${lead.name}</div></div>
              <div class="item"><div class="label">Email</div><div class="value">${lead.email || "N/A"}</div></div>
              <div class="item"><div class="label">Phone</div><div class="value">${lead.phone || "N/A"}</div></div>
              <div class="item"><div class="label">Budget</div><div class="value">${lead.budget || "N/A"}</div></div>
              <div class="item"><div class="label">Source</div><div class="value">${lead.source}</div></div>
              <div class="item"><div class="label">Status</div><div class="value">${lead.status}</div></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">AI Summary Breakdown</div>
            <div class="item"><div class="label">Customer Goals</div><div class="value">${mockAIAnalysis.goals}</div></div>
            <div class="item"><div class="label">Objections</div><div class="value">${mockAIAnalysis.objections}</div></div>
            <div class="item"><div class="label">Next Recommended Action</div><div class="value">${mockAIAnalysis.nextAction}</div></div>
          </div>
          ${companyDetails ? `
          <div class="section">
            <div class="section-title">Enriched Company Insights</div>
            <div class="grid">
              <div class="item"><div class="label">Company Name</div><div class="value">${companyDetails.companyName}</div></div>
              <div class="item"><div class="label">Domain</div><div class="value">${companyDetails.domain}</div></div>
              <div class="item"><div class="label">Headquarters</div><div class="value">${companyDetails.headquarters}</div></div>
              <div class="item"><div class="label">Employees</div><div class="value">${companyDetails.employees}</div></div>
              <div class="item"><div class="label">Industry</div><div class="value">${companyDetails.industry}</div></div>
              <div class="item"><div class="label">Tech Stack</div><div class="value">${companyDetails.techStack}</div></div>
            </div>
          </div>
          ` : ""}
          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const handleComposeFromTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = emailTemplates.find((t: any) => t.id === templateId);
    if (tmpl) {
      // Replace template variables
      let subject = tmpl.subject
        .replace(/\{\{name\}\}/g, lead.name || "")
        .replace(/\{\{email\}\}/g, lead.email || "")
        .replace(/\{\{company\}\}/g, "");
      let body = tmpl.body
        .replace(/\{\{name\}\}/g, lead.name || "")
        .replace(/\{\{email\}\}/g, lead.email || "")
        .replace(/\{\{company\}\}/g, "");
      setComposeSubject(subject);
      setComposeBody(body);
    }
  };

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject || !composeBody || !selectedAccountId || !lead.email) return;
    if (!handleSendManualEmail) return;
    setSending(true);
    try {
      const success = await handleSendManualEmail(selectedAccountId, lead.email, composeSubject, composeBody, lead.id);
      if (success) {
        setComposeSubject("");
        setComposeBody("");
        setSelectedTemplateId("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedSequenceId || !handleEnrollLeadInSequence) return;
    await handleEnrollLeadInSequence(selectedSequenceId, [lead.id]);
    setSelectedSequenceId("");
  };

  const handleDisenroll = async (seqId: string) => {
    if (!handleDisenrollLeadFromSequence) return;
    await handleDisenrollLeadFromSequence(seqId, [lead.id]);
  };

  const dealProbability = lead.status === "HOT" ? 88 : lead.status === "WARM" ? 54 : 12;

  const parseScoreField = (fieldVal: any) => {
    if (!fieldVal) return { score: 0, details: "No scoring record generated." };
    try {
      return typeof fieldVal === "string" ? JSON.parse(fieldVal) : fieldVal;
    } catch {
      return { score: 0, details: String(fieldVal) };
    }
  };

  // Find active enrollments for this lead
  const leadEnrollments = emailSequences
    .filter((seq: any) => seq.enrollments?.some((e: any) => e.status === "ACTIVE"))
    .map((seq: any) => ({
      sequenceId: seq.id,
      sequenceName: seq.name,
      enrollment: seq.enrollments?.find((e: any) => e.status === "ACTIVE"),
    }))
    .filter(Boolean);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-card border-l border-card-border shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border flex items-center justify-between shrink-0 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-accent-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {lead.name === "Anonymous Visitor" ? "Anonymous Prospect" : lead.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-text">Captured via {lead.source}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              <select
                value={lead.status}
                onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold focus:outline-none bg-transparent border border-transparent hover:border-slate-800 cursor-pointer ${
                  lead.status === "HOT" ? "text-red-400" :
                  lead.status === "WARM" ? "text-amber-400" :
                  "text-blue-400"
                }`}
              >
                <option value="HOT" className="bg-card text-red-400">HOT</option>
                <option value="WARM" className="bg-card text-amber-400">WARM</option>
                <option value="COLD" className="bg-card text-blue-400">COLD</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadDossier}
            className="p-2 rounded-xl text-muted-text hover:bg-slate-900 border border-transparent hover:border-card-border transition-all cursor-pointer"
            title="Download PDF Dossier"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-text hover:bg-slate-900 border border-transparent hover:border-card-border transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card-border bg-slate-950/10 px-6 gap-6 shrink-0 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "analysis"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          AI Sales Dossier
        </button>
        <button
          onClick={() => setActiveTab("enrichment")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "enrichment"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          Company Intelligence
        </button>
        <button
          onClick={() => setActiveTab("outreach")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "outreach"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          Automated Outreach
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "email"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Email Activity
          {emailActivities.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary text-[9px] font-extrabold">
              {emailActivities.length}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* Prospect score panel */}
            <div className="grid grid-cols-3 gap-4 border border-card-border rounded-2xl bg-card/20 p-5">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Prospect score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{lead.engagementScore || 15}%</span>
                  <span className="text-xs text-red-400 capitalize font-bold">{lead.status} Lead</span>
                </div>
                <p className="text-[10px] text-muted-text">Aggregate quality metric</p>
              </div>
              <div className="space-y-1 border-l border-card-border/60 pl-5">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Priority Level</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${
                    lead.score?.priority === "HIGH" ? "text-red-400" :
                    lead.score?.priority === "MEDIUM" ? "text-amber-400" :
                    "text-blue-400"
                  }`}>
                    {lead.score?.priority || "MEDIUM"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-text">Recommended response</p>
              </div>
              <div className="space-y-1 border-l border-card-border/60 pl-5">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Deal Probability</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {lead.score?.dealProbability ? Math.round(lead.score.dealProbability * 100) : dealProbability}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-text">Estimated win chance</p>
              </div>
            </div>

            {/* AI intelligence items */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">AI Scoring Breakdown</h4>
                  <button
                    onClick={handleRescoreLead}
                    disabled={rescoring}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-card-border hover:border-accent-primary text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${rescoring ? "animate-spin text-accent-primary" : ""}`} />
                    {rescoring ? "Scoring Lead..." : "Re-score Prospect"}
                  </button>
                </div>
                
                {/* 6 Sub-scores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Buying Intent", key: "buyingIntent", icon: Target, color: "text-red-400 bg-red-500" },
                    { label: "Company Growth", key: "companyGrowth", icon: TrendingUp, color: "text-emerald-400 bg-emerald-500" },
                    { label: "Hiring Signals", key: "hiringSignals", icon: Briefcase, color: "text-amber-400 bg-amber-500" },
                    { label: "Engagement Level", key: "engagementActivity", icon: MessageSquare, color: "text-indigo-400 bg-indigo-500" },
                    { label: "Website Activity", key: "websiteActivity", icon: MousePointer, color: "text-pink-400 bg-pink-500" },
                    { label: "Email Activity", key: "emailActivity", icon: Mail, color: "text-cyan-400 bg-cyan-500" }
                  ].map((item) => {
                    const parsed = lead.score ? parseScoreField((lead.score as any)[item.key]) : { score: 0, details: "No score generated yet." };
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="p-3 border border-card-border/60 bg-slate-950/20 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                          </span>
                          <span className="font-black text-white">{parsed.score || 0}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color.split(" ")[1]}`}
                            style={{ width: `${parsed.score || 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-text italic leading-tight">{parsed.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">AI Evaluation Reasoning</h4>
                <p className="text-xs text-slate-300 bg-slate-900/40 border border-card-border p-3 rounded-xl leading-relaxed">
                  {lead.score?.reasoning || "No evaluation reasoning has been compiled for this prospect yet. Click 'Re-score' to run analysis."}
                </p>
              </div>

              {/* Recommended Next Action */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Recommended Next Action</h4>
                <p className="text-xs text-slate-300 bg-slate-900/40 border border-card-border p-3 rounded-xl flex items-start gap-2 leading-relaxed">
                  <Sparkles className="h-4.5 w-4.5 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{lead.score?.recommendedAction || "Schedule follow-up email outreach template sequence."}</span>
                </p>
              </div>

              {/* Scoring History Timeline */}
              <div className="space-y-2 pt-2 border-t border-card-border/40">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Scoring History Timeline</h4>
                {loadingHistory ? (
                  <p className="text-[10px] text-muted-text animate-pulse">Loading historical evaluations...</p>
                ) : scoringHistory.length === 0 ? (
                  <p className="text-[10px] text-muted-text italic">No historical scoring records found.</p>
                ) : (
                  <div className="relative border-l border-card-border/60 ml-2 pl-4 py-2 space-y-4">
                    {scoringHistory.map((h: any, i: number) => (
                      <div key={h.id} className="relative">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                          i === 0 ? "bg-accent-primary" : "bg-slate-700"
                        }`} />
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="font-bold text-white">Score: {h.score}%</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                          <span className={`font-semibold ${
                            h.priority === "HIGH" ? "text-red-400" :
                            h.priority === "MEDIUM" ? "text-amber-400" :
                            "text-blue-400"
                          }`}>{h.priority} Priority</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "enrichment" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Target Company Website Domain</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. stripe.com"
                  className="flex-1 bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:border-accent-primary focus:outline-none transition-colors"
                />
                <button
                  onClick={handleEnrichTrigger}
                  disabled={enriching || !domainInput}
                  className="px-4 py-2.5 bg-accent-primary text-slate-950 font-bold hover:bg-emerald-400 text-xs rounded-xl disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  {enriching ? "Enriching..." : "Enrich Company"}
                </button>
              </div>
            </div>

            {/* Live enrichment agent logs */}
            {enriching && (
              <div className="bg-slate-950 border border-card-border p-4 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1 max-h-48 overflow-y-auto">
                {enrichLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            )}

            {/* Enriched dashboard details */}
            {companyDetails && (
              <div className="border border-card-border rounded-2xl bg-card/10 p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-card-border/60 pb-3">
                  <div className="h-9 w-9 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-lg font-bold text-white uppercase">
                    {companyDetails.companyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">{companyDetails.companyName}</h4>
                    <p className="text-[10px] text-muted-text">{companyDetails.domain}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Headquarters</span>
                    <span className="text-slate-200 font-semibold">{companyDetails.headquarters}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Company Size</span>
                    <span className="text-slate-200 font-semibold">{companyDetails.employees} employees</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Industry</span>
                    <span className="text-slate-200 font-semibold">{companyDetails.industry}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Technologies Detected</span>
                    <span className="text-slate-300 font-mono text-[10px] bg-slate-900 p-2 rounded block mt-1 leading-relaxed">
                      {companyDetails.techStack}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="space-y-6">
            {/* Email Finder widget */}
            <div className="border border-card-border rounded-2xl bg-card/10 p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Search className="h-4 w-4 text-accent-primary" />
                Find Company Contact Emails
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={finderDomain}
                  onChange={(e) => setFinderDomain(e.target.value)}
                  placeholder="e.g. stripe.com"
                  className="flex-1 bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={handleFindEmailsTrigger}
                  disabled={finding || !finderDomain}
                  className="px-4 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-xs hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
                >
                  {finding ? "Searching..." : "Scan Domain"}
                </button>
              </div>

              {foundEmails.length > 0 && (
                <div className="space-y-2 border-t border-card-border/60 pt-3">
                  {foundEmails.map((emailObj, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2 rounded-xl border border-card-border/60">
                      <div>
                        <p className="text-xs text-white font-bold">{emailObj.name}</p>
                        <p className="text-[10px] text-muted-text">{emailObj.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {emailObj.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule campaign form */}
            <form onSubmit={handleOutreachSubmit} className="space-y-4 border border-card-border rounded-2xl bg-card/10 p-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4 w-4 text-accent-primary" />
                Trigger Outreach Sequence Campaign
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Template Sequence</label>
                  <select
                    value={emailTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
                  >
                    <option value="INTRO_PITCH">Sequence A: AI Introductory Pitch</option>
                    <option value="FOLLOW_UP">Sequence B: Interactive Conversational Follow-up</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Email Subject</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Email Message Body</label>
                  <textarea
                    required
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-900 border border-card-border text-white text-xs p-3 rounded-xl focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2.5 bg-accent-primary text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {scheduling ? "Scheduling..." : "Schedule Campaign"}
                </button>
              </div>
            </form>

            {/* Scheduled outbox list */}
            {leadOutreach.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Scheduled outreach outbox</h4>
                <div className="space-y-2">
                  {leadOutreach.map((os) => (
                    <div key={os.id} className="border border-card-border rounded-xl bg-slate-900/30 p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200 truncate">{os.subject}</p>
                        <p className="text-[9px] text-muted-text flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Send target: {new Date(os.scheduledFor).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {os.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ EMAIL ACTIVITY TAB ============ */}
        {activeTab === "email" && (
          <div className="space-y-6">
            {/* Sequence Enrollment Controls */}
            {emailSequences.length > 0 && (
              <div className="border border-card-border rounded-2xl bg-card/10 p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-accent-primary" />
                  Sequence Enrollment
                </h4>

                {/* Active enrollments */}
                {leadEnrollments.length > 0 && (
                  <div className="space-y-2">
                    {leadEnrollments.map((le: any) => (
                      <div key={le.sequenceId} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-emerald-300 font-bold">{le.sequenceName}</span>
                          <span className="text-[9px] text-muted-text">Active</span>
                        </div>
                        <button
                          onClick={() => handleDisenroll(le.sequenceId)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer"
                        >
                          <PauseCircle className="h-3 w-3" />
                          Pause
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enroll in new sequence */}
                <div className="flex gap-2">
                  <select
                    value={selectedSequenceId}
                    onChange={(e) => setSelectedSequenceId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
                  >
                    <option value="">Select a sequence to enroll...</option>
                    {emailSequences.map((seq: any) => (
                      <option key={seq.id} value={seq.id}>{seq.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleEnroll}
                    disabled={!selectedSequenceId}
                    className="px-4 py-2.5 bg-accent-primary text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Enroll
                  </button>
                </div>
              </div>
            )}

            {/* Manual Email Compose */}
            {emailAccounts.length > 0 && lead.email && (
              <form onSubmit={handleManualSend} className="border border-card-border rounded-2xl bg-card/10 p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Send className="h-4 w-4 text-accent-primary" />
                  Compose Email
                </h4>

                <div className="space-y-3">
                  {/* From account selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase">From Account</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
                    >
                      {emailAccounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.email} ({acc.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template quick-fill */}
                  {emailTemplates.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-300 font-bold uppercase">Quick Template Fill</label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => handleComposeFromTemplate(e.target.value)}
                        className="w-full bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary cursor-pointer"
                      >
                        <option value="">Compose from scratch...</option>
                        {emailTemplates.map((tmpl: any) => (
                          <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase">To</label>
                    <input
                      type="text"
                      readOnly
                      value={lead.email}
                      className="w-full bg-slate-900/60 border border-card-border text-slate-400 text-xs px-3 py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full bg-slate-900 border border-card-border text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full bg-slate-900 border border-card-border text-white text-xs p-3 rounded-xl focus:outline-none focus:border-accent-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || emailLoading}
                    className="px-5 py-2.5 bg-accent-primary text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </form>
            )}

            {/* No connected accounts CTA */}
            {emailAccounts.length === 0 && (
              <div className="border border-dashed border-card-border rounded-2xl bg-card/5 p-8 text-center space-y-2">
                <Mail className="h-8 w-8 mx-auto text-slate-600" />
                <p className="text-xs text-muted-text font-semibold">No email accounts connected</p>
                <p className="text-[10px] text-slate-600">
                  Connect Gmail or Outlook from the Integrations tab to send emails directly from Beacon.
                </p>
              </div>
            )}

            {/* No lead email */}
            {emailAccounts.length > 0 && !lead.email && (
              <div className="border border-dashed border-amber-500/20 rounded-2xl bg-amber-500/5 p-6 text-center space-y-2">
                <HelpCircle className="h-6 w-6 mx-auto text-amber-500" />
                <p className="text-xs text-amber-400 font-semibold">No email address on file</p>
                <p className="text-[10px] text-slate-500">
                  This lead doesn&apos;t have an email address. Use the Company Intelligence tab to find contacts.
                </p>
              </div>
            )}

            {/* Email Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent-primary" />
                Conversation Timeline
                {emailLoading && <span className="text-[9px] text-muted-text animate-pulse">Loading...</span>}
              </h4>

              {emailActivities.length === 0 && !emailLoading && (
                <div className="text-center py-8 text-muted-text">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No email activity recorded for this lead yet.</p>
                </div>
              )}

              <div className="space-y-3">
                {emailActivities.map((activity: any) => {
                  const isSent = activity.direction === "SENT";
                  const hasOpens = activity.opensCount > 0;
                  const hasReply = !!activity.repliedAt;
                  
                  return (
                    <div
                      key={activity.id}
                      className={`border rounded-2xl p-4 space-y-2 transition-all ${
                        isSent
                          ? "border-indigo-500/20 bg-indigo-500/5"
                          : "border-emerald-500/20 bg-emerald-500/5"
                      }`}
                    >
                      {/* Direction indicator + subject */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSent ? "bg-indigo-500/15 text-indigo-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {isSent ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{activity.subject}</p>
                            <p className="text-[10px] text-muted-text">
                              {isSent ? `To: ${activity.toAddress}` : `From: ${activity.fromAddress}`}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${
                          isSent
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {isSent ? "SENT" : "RECEIVED"}
                        </span>
                      </div>

                      {/* Body preview */}
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed pl-9">
                        {activity.body?.replace(/<[^>]*>/g, "").substring(0, 200)}
                        {(activity.body?.length || 0) > 200 ? "..." : ""}
                      </p>

                      {/* Meta badges row */}
                      <div className="flex items-center gap-3 pl-9 text-[10px]">
                        <span className="text-muted-text flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.sentAt).toLocaleString()}
                        </span>
                        {hasOpens && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Eye className="h-3 w-3" />
                            {activity.opensCount} open{activity.opensCount > 1 ? "s" : ""}
                          </span>
                        )}
                        {hasReply && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Reply className="h-3 w-3" />
                            Replied {new Date(activity.repliedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
