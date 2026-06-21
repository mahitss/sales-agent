import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Search, 
  Building, 
  Users, 
  Shield, 
  Target, 
  TrendingUp, 
  Mail, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  CheckCircle,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { AccountResearch } from "../../../hooks/useDashboardData";

interface AccountIntelTabProps {
  accountResearches: AccountResearch[];
  researchLoading: boolean;
  handleAnalyzeAccount: (domain: string) => Promise<void>;
  handleDownloadBriefingPdf: (id: string) => Promise<void>;
  fetchAccountResearchHistory: () => Promise<void>;
}

export const AccountIntelTab: React.FC<AccountIntelTabProps> = ({
  accountResearches,
  researchLoading,
  handleAnalyzeAccount,
  handleDownloadBriefingPdf,
  fetchAccountResearchHistory,
}) => {
  const [domainInput, setDomainInput] = useState("");
  const [selectedResearch, setSelectedResearch] = useState<AccountResearch | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Poll for updates if there are pending or processing jobs
  useEffect(() => {
    const hasActiveJobs = accountResearches.some(
      (r) => r.status === "PENDING" || r.status === "PROCESSING"
    );

    if (hasActiveJobs) {
      const interval = setInterval(() => {
        fetchAccountResearchHistory();
      }, 3000); // Poll every 3s during active run
      return () => clearInterval(interval);
    }
  }, [accountResearches, fetchAccountResearchHistory]);

  // Keep the selected item details in sync when background polling updates it
  useEffect(() => {
    if (selectedResearch) {
      const updated = accountResearches.find((r) => r.id === selectedResearch.id);
      if (updated) {
        setSelectedResearch(updated);
      }
    }
  }, [accountResearches, selectedResearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setLocalSubmitting(true);
    try {
      await handleAnalyzeAccount(domainInput.trim());
      setDomainInput("");
    } finally {
      setLocalSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            Complete
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Queued
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building className="h-6 w-6 text-teal-400" />
            AI Account Intelligence Engine
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Analyze target websites, uncover pain points, map tech stacks, and draft hyper-personalized sales outreach in real-time.
          </p>
        </div>
        <button
          onClick={() => fetchAccountResearchHistory()}
          disabled={researchLoading}
          className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 hover:text-white transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${researchLoading ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* Target Domain Input Box */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <label htmlFor="domain" className="block text-sm font-semibold text-slate-300 mb-2">
            Initiate Real-time Company Analysis
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-500">
              <Globe className="h-5 w-5" />
            </div>
            <input
              id="domain"
              type="text"
              placeholder="e.g. stripe.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="w-full pl-12 pr-32 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              disabled={researchLoading || localSubmitting}
            />
            <button
              type="submit"
              disabled={researchLoading || localSubmitting || !domainInput.trim()}
              className="absolute right-2 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
            >
              {localSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Analyze Domain
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Takes 15-30 seconds. Beacon crawls the domain, runs deep content extraction, and structures data with Gemini.
          </p>
        </form>
      </div>

      {/* Main Grid: Left is history list, Right is details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Research Logs / History List (size 4 or 5) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Research History</h4>
            <span className="text-xs font-mono text-slate-500">{accountResearches.length} profiles</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {accountResearches.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                No companies analyzed yet. Submit a domain above to get started.
              </div>
            ) : (
              accountResearches.map((r) => {
                const isSelected = selectedResearch?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResearch(r)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-slate-800/80 border-teal-500/50 shadow-md shadow-teal-950/20"
                        : "bg-slate-900/30 border-slate-800/60 hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-white text-sm truncate flex-1">
                        {r.domain}
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    {/* Progress indicator */}
                    {(r.status === "PENDING" || r.status === "PROCESSING") && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Enriching context...</span>
                          <span className="text-teal-400 font-bold">{r.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                            style={{ width: `${r.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {r.status === "COMPLETED" && (
                      <div className="mt-2 text-xs text-slate-400 truncate">
                        {r.industry || "No industry mapped"}
                      </div>
                    )}

                    {r.status === "FAILED" && (
                      <div className="mt-2 text-xs text-rose-400 line-clamp-1">
                        {r.error || "Execution failed"}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Company Detail Briefing (size 8 or 7) */}
        <div className="lg:col-span-8">
          {!selectedResearch ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-center">
              <Building className="h-12 w-12 text-slate-600 mb-4 stroke-1" />
              <h5 className="text-base font-bold text-slate-300">No Profile Selected</h5>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select a company from the history list to view the deep research, target technology stack, challenges, and outreach strategy.
              </p>
            </div>
          ) : selectedResearch.status === "PENDING" || selectedResearch.status === "PROCESSING" ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border border-slate-800 rounded-2xl bg-slate-900/10 text-center">
              <RefreshCw className="h-10 w-10 text-teal-500 animate-spin mb-4" />
              <h5 className="text-base font-bold text-slate-200">Analyzing {selectedResearch.domain}...</h5>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                We are actively crawling the website homepage, detecting technologies, extracting intent signals, and synthesising meeting preps.
              </p>
              <div className="w-64 mt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span className="font-bold text-teal-400">{selectedResearch.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                    style={{ width: `${selectedResearch.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : selectedResearch.status === "FAILED" ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border border-slate-800 rounded-2xl bg-rose-950/10 text-center">
              <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
              <h5 className="text-base font-bold text-rose-400">Analysis Failed</h5>
              <p className="text-sm text-slate-400 max-w-md mt-1">
                An error occurred during website crawler or Gemini generation. This can be caused by firewall blockages, network timeouts, or invalid domain entries.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left max-w-lg w-full">
                <div className="text-xs font-mono text-rose-400 font-bold mb-1">Error Logs:</div>
                <p className="text-xs font-mono text-slate-400 break-words">{selectedResearch.error || "Reason: Timeout during external fetch."}</p>
              </div>
            </div>
          ) : (
            /* COMPLETED Research Panel */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header Box */}
              <div className="p-6 rounded-2xl border border-slate-850 bg-gradient-to-r from-slate-900 to-slate-950 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest">Master Profile</span>
                    <h4 className="text-2xl font-black text-white mt-1">{selectedResearch.domain}</h4>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {selectedResearch.industry || "Unknown Industry"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {selectedResearch.employeeEstimate || "Unknown Size"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadBriefingPdf(selectedResearch.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 font-semibold text-xs tracking-tight transition shadow self-start sm:self-auto"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Master PDF
                  </button>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company Overview</h5>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {selectedResearch.summary}
                </p>
              </div>

              {/* Split Column: Tech Stack & buying intent signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tech Stack */}
                <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4.5 w-4.5 text-emerald-400" />
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Technology Stack</h5>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResearch.techStack.length === 0 ? (
                      <span className="text-xs text-slate-500">No technologies detected.</span>
                    ) : (
                      selectedResearch.techStack.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/10 shadow-sm"
                        >
                          {tech}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Buying Intent Signals */}
                <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Buying & Growth Signals</h5>
                  </div>
                  <ul className="space-y-2">
                    {selectedResearch.buyingSignals.length === 0 ? (
                      <li className="text-xs text-slate-500">No clear intent signals found.</li>
                    ) : (
                      selectedResearch.buyingSignals.map((signal, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span>{signal}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Split Column: Challenges & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Challenges */}
                <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Business Challenges</h5>
                  </div>
                  <ul className="space-y-2">
                    {selectedResearch.challenges.length === 0 ? (
                      <li className="text-xs text-slate-500 font-medium">No obvious challenges detected.</li>
                    ) : (
                      selectedResearch.challenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4.5 w-4.5 text-indigo-400" />
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Value-Add Opportunities</h5>
                  </div>
                  <ul className="space-y-2">
                    {selectedResearch.opportunities.length === 0 ? (
                      <li className="text-xs text-slate-500 font-medium">No sales matches identified.</li>
                    ) : (
                      selectedResearch.opportunities.map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{opp}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Outreach Strategy */}
              <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="h-4.5 w-4.5 text-teal-400" />
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Outreach Playbook</h5>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedResearch.outreachStrategy}
                </p>
              </div>

              {/* Email Outreach Block */}
              <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4.5 w-4.5 text-sky-400" />
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-semibold">Cold Outreach Email Draft</h5>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedResearch.emailDraft || "")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-850 border border-slate-700 hover:bg-slate-700 hover:text-white text-slate-400 text-[10px] font-bold tracking-tight transition"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Email
                      </>
                    )}
                  </button>
                </div>
                
                {/* Email text box */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-900/60 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                  {selectedResearch.emailDraft || "No email draft created."}
                </div>
              </div>

              {/* Meeting Prep Notes */}
              <div className="p-6 rounded-xl border border-slate-850 bg-slate-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4.5 w-4.5 text-violet-400" />
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">First Meeting Preparation Notes</h5>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                  {selectedResearch.meetingNotes}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
