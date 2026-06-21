import React, { useState } from "react";
import { FileText, Grid, List, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { PipelineBoard } from "./PipelineBoard";
import { LeadDetailDrawer } from "./LeadDetailDrawer";

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

interface LeadsTabProps {
  leads: Lead[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterSource: string;
  setFilterSource: (val: string) => void;
  filterSentiment: string;
  setFilterSentiment: (val: string) => void;
  handleExportLeads: () => void;
  handleExportLeadsExcel: () => void;
  handleUpdateLeadStatus: (leadId: string, status: string) => void;
  outreachSequences: any[];
  handleScheduleOutreach: (leadId: string, template: string, subject: string, bodyText: string) => Promise<boolean>;
  handleEnrichCompany: (leadId: string, domain: string) => Promise<any>;
  handleFindEmails: (domain: string) => Promise<any>;
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

export const LeadsTab: React.FC<LeadsTabProps> = ({
  leads,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterSource,
  setFilterSource,
  filterSentiment,
  setFilterSentiment,
  handleExportLeads,
  handleExportLeadsExcel,
  handleUpdateLeadStatus,
  outreachSequences,
  handleScheduleOutreach,
  handleEnrichCompany,
  handleFindEmails,
  // Email integration props
  emailAccounts,
  emailActivities,
  emailTemplates,
  emailSequences,
  emailLoading,
  fetchEmailActivities,
  handleSendManualEmail,
  handleEnrollLeadInSequence,
  handleDisenrollLeadFromSequence,
  token = "",
  API_URL = "",
}) => {
  const [viewType, setViewType] = useState<"list" | "pipeline">("list");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      !searchTerm ||
      (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.phone && l.phone.includes(searchTerm));
    const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
    const matchesSource = filterSource === "ALL" || l.source === filterSource;
    const matchesSentiment = filterSentiment === "ALL" || (l.sentiment || "Neutral") === filterSentiment;
    return matchesSearch && matchesStatus && matchesSource && matchesSentiment;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Leads Log</h3>
          <p className="text-xs text-muted-text mt-1">Visitors qualified and captured by the AI agent</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggler */}
          <div className="border border-card-border rounded-xl bg-card/20 p-1 flex gap-1 shadow-sm">
            <button
              onClick={() => setViewType("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === "list"
                  ? "bg-accent-primary/10 text-accent-primary font-bold"
                  : "text-muted-text hover:text-white"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setViewType("pipeline")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === "pipeline"
                  ? "bg-accent-primary/10 text-accent-primary font-bold"
                  : "text-muted-text hover:text-white"
              }`}
              title="Kanban Board View"
            >
              <Grid className="h-4 w-4" />
              CRM Pipeline
            </button>
          </div>

          <button
            onClick={handleExportLeads}
            className="border border-card-border hover:bg-card bg-card/40 text-slate-300 font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            CSV Export
          </button>
          <button
            onClick={handleExportLeadsExcel}
            className="bg-accent-primary hover:bg-accent-hover text-white font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <FileText className="h-4 w-4" />
            Excel Export (XLSX)
          </button>
        </div>
      </div>

      {/* Filters container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-card-border bg-card/10">
        <div>
          <label htmlFor="lead-search" className="text-[10px] font-bold uppercase tracking-wide text-muted-text block">Search Visitor</label>
          <input
            id="lead-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, email or phone..."
            className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary placeholder-slate-700 transition-all"
          />
        </div>
        <div>
          <label htmlFor="lead-status-filter" className="text-[10px] font-bold uppercase tracking-wide text-muted-text block">Status</label>
          <select
            id="lead-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
        </div>
        <div>
          <label htmlFor="lead-source-filter" className="text-[10px] font-bold uppercase tracking-wide text-muted-text block">Source Channel</label>
          <select
            id="lead-source-filter"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="WIDGET">WIDGET</option>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
            <option value="EMAIL">EMAIL</option>
          </select>
        </div>
        <div>
          <label htmlFor="lead-sentiment-filter" className="text-[10px] font-bold uppercase tracking-wide text-muted-text block">Sentiment</label>
          <select
            id="lead-sentiment-filter"
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary cursor-pointer"
          >
            <option value="ALL">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
            <option value="Inquisitive">Inquisitive</option>
          </select>
        </div>
      </div>

      {viewType === "pipeline" ? (
        <PipelineBoard
          leads={filteredLeads}
          onSelectLead={setSelectedLead}
          onUpdateStatus={handleUpdateLeadStatus}
        />
      ) : (
        <div className="overflow-x-auto border border-card-border rounded-2xl bg-card/10">
          <table className="w-full border-collapse text-left text-sm min-w-[800px]">
            <thead className="bg-card border-b border-card-border text-xs font-semibold uppercase text-muted-text">
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
            <tbody className="divide-y divide-card-border/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-text">
                    No matching leads found. Try adjusting your search filters!
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l, index) => {
                  const sentiment = l.sentiment || "Neutral";
                  const sentimentBadge =
                    sentiment === "Positive"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : sentiment === "Negative"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : sentiment === "Inquisitive"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20";

                  const score = l.engagementScore !== undefined && l.engagementScore !== null ? l.engagementScore : 15;
                  const scoreColor = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
                      className="hover:bg-card/25 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(l)}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {l.name === "Anonymous Visitor" ? (
                          <span className="italic text-muted-text font-normal">Anonymous Visitor</span>
                        ) : (
                          l.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{l.email || "—"}</td>
                      <td className="px-6 py-4 text-slate-300">{l.phone || "—"}</td>
                      <td className="px-6 py-4 text-slate-300">{l.budget || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.source === "WHATSAPP"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : l.source === "INSTAGRAM"
                                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                                : l.source === "EMAIL"
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {l.source}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={l.status}
                          onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                          className={`rounded-lg border border-transparent px-2.5 py-1 text-xs font-bold focus:outline-none transition-all cursor-pointer bg-transparent ${
                            l.status === "HOT"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : l.status === "WARM"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          <option value="HOT" className="bg-card text-red-400">
                            HOT
                          </option>
                          <option value="WARM" className="bg-card text-amber-400">
                            WARM
                          </option>
                          <option value="COLD" className="bg-card text-blue-400">
                            COLD
                          </option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sentimentBadge}`}>
                          {sentiment === "Positive"
                            ? "🟢 Positive"
                            : sentiment === "Negative"
                              ? "🔴 Negative"
                              : sentiment === "Inquisitive"
                                ? "🔵 Inquisitive"
                                : "⚪ Neutral"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 w-8">{score}%</span>
                          <div className="w-16 bg-card-border/40 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-text">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <LeadDetailDrawer
        isOpen={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onUpdateStatus={handleUpdateLeadStatus}
        handleScheduleOutreach={handleScheduleOutreach}
        handleEnrichCompany={handleEnrichCompany}
        handleFindEmails={handleFindEmails}
        outreachSequences={outreachSequences}
        emailAccounts={emailAccounts}
        emailActivities={emailActivities}
        emailTemplates={emailTemplates}
        emailSequences={emailSequences}
        emailLoading={emailLoading}
        fetchEmailActivities={fetchEmailActivities}
        handleSendManualEmail={handleSendManualEmail}
        handleEnrollLeadInSequence={handleEnrollLeadInSequence}
        handleDisenrollLeadFromSequence={handleDisenrollLeadFromSequence}
        token={token}
        API_URL={API_URL}
      />
    </div>
  );
};
