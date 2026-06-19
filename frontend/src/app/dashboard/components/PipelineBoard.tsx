import React from "react";
import { User, DollarSign, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

interface PipelineBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: string) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
}) => {
  const columns = [
    { id: "COLD", name: "Cold Prospects", color: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
    { id: "WARM", name: "Warm Leads", color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
    { id: "HOT", name: "Hot / Qualified", color: "border-red-500/30 text-red-400 bg-red-500/5" },
  ];

  const getLeadsByStatus = (status: string) => {
    return leads.filter((l) => l.status === status);
  };

  const getColumnSum = (leadsList: Lead[]) => {
    let sum = 0;
    leadsList.forEach((l) => {
      if (l.budget) {
        const num = parseInt(l.budget.replace(/[^0-9]/g, ""));
        if (!isNaN(num)) sum += num;
      }
    });
    return sum;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-18rem)] overflow-y-auto pr-2 pb-10">
      {columns.map((col) => {
        const colLeads = getLeadsByStatus(col.id);
        const revenueSum = getColumnSum(colLeads);

        return (
          <div
            key={col.id}
            className="flex flex-col border border-card-border rounded-2xl bg-card/10 p-4 h-full min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-card-border">
              <div>
                <h4 className="font-extrabold text-sm text-white">{col.name}</h4>
                <p className="text-[10px] text-muted-text mt-0.5">{colLeads.length} deals active</p>
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${col.color}`}>
                ₹{revenueSum.toLocaleString()}
              </div>
            </div>

            {/* Leads List */}
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pr-1">
              {colLeads.length === 0 ? (
                <div className="h-32 border border-dashed border-card-border/60 rounded-xl flex items-center justify-center text-center p-4">
                  <p className="text-xs text-muted-text">No leads in this stage.</p>
                </div>
              ) : (
                colLeads.map((lead, index) => {
                  const score = lead.engagementScore !== undefined && lead.engagementScore !== null ? lead.engagementScore : 15;
                  const scoreColor =
                    score >= 70 ? "text-emerald-400 bg-emerald-400/10" :
                    score >= 40 ? "text-amber-400 bg-amber-400/10" :
                    "text-red-400 bg-red-400/10";

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.2 }}
                      onClick={() => onSelectLead(lead)}
                      className="border border-card-border rounded-xl bg-slate-900/60 p-4 hover:border-slate-700/80 transition-all hover:bg-slate-900 cursor-pointer group shadow-sm relative overflow-hidden"
                    >
                      {/* Top elements */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                          {lead.name === "Anonymous Visitor" ? "Anonymous User" : lead.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1 ${scoreColor}`}>
                          <Sparkles className="h-2.5 w-2.5" />
                          {score}%
                        </span>
                      </div>

                      {/* Subtitle email */}
                      <p className="text-[10px] text-muted-text mt-1 truncate">{lead.email || "No email captured"}</p>

                      {/* Budget and dates */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-card-border/60">
                        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-slate-500" />
                          {lead.budget || "₹0"}
                        </span>
                        <span className="text-[9px] text-muted-text flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(lead.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Drag & shift helpers */}
                      <div className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {col.id !== "COLD" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(lead.id, col.id === "HOT" ? "WARM" : "COLD");
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[10px]"
                            title="Move back"
                          >
                            ◀
                          </button>
                        )}
                        {col.id !== "HOT" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(lead.id, col.id === "COLD" ? "WARM" : "HOT");
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[10px]"
                            title="Move forward"
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
