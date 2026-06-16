import React from "react";
import { FileText } from "lucide-react";

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
  handleUpdateLeadStatus: (leadId: string, status: string) => void;
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
  handleUpdateLeadStatus,
}) => {
  return (
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
  );
};
