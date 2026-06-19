import React, { useState, useEffect } from "react";
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
  Briefcase
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
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "enrichment" | "outreach">("analysis");

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
    }
  }, [lead]);

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

  const dealProbability = lead.status === "HOT" ? 88 : lead.status === "WARM" ? 54 : 12;

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
      <div className="flex border-b border-card-border bg-slate-950/10 px-6 gap-6 shrink-0 text-sm">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "analysis"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          AI Sales Dossier
        </button>
        <button
          onClick={() => setActiveTab("enrichment")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "enrichment"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          Company Intelligence
        </button>
        <button
          onClick={() => setActiveTab("outreach")}
          className={`py-3.5 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "outreach"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-muted-text hover:text-white"
          }`}
        >
          Automated Outreach
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* Prospect score panel */}
            <div className="grid grid-cols-2 gap-4 border border-card-border rounded-2xl bg-card/20 p-5">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Prospect scoring</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{lead.engagementScore || 15}%</span>
                  <span className="text-xs text-red-400 capitalize font-bold">{lead.status} Lead</span>
                </div>
                <p className="text-[10px] text-muted-text">Engagement based on chat interaction</p>
              </div>
              <div className="space-y-1 border-l border-card-border/60 pl-5">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Deal Probability</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{dealProbability}%</span>
                </div>
                <p className="text-[10px] text-muted-text">Estimated win chance ratio</p>
              </div>
            </div>

            {/* AI intelligence items */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Customer goals</h4>
                <p className="text-xs text-slate-300 bg-slate-900/40 border border-card-border p-3 rounded-xl">
                  {mockAIAnalysis.goals}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Objections</h4>
                <p className="text-xs text-slate-300 bg-slate-900/40 border border-card-border p-3 rounded-xl">
                  {mockAIAnalysis.objections}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">Recommended Next Action</h4>
                <p className="text-xs text-slate-300 bg-slate-900/40 border border-card-border p-3 rounded-xl flex items-start gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{mockAIAnalysis.nextAction}</span>
                </p>
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
      </div>
    </div>
  );
};
