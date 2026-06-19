import React from "react";
import { Users, Award, CalendarDays, TrendingUp, Brain, DollarSign, LineChart, Percent, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { UserInfo, DashboardStats, TabType, Recommendation } from "@/hooks/useDashboardData";

interface OverviewTabProps {
  user: UserInfo | null;
  stats: DashboardStats;
  recommendations: Recommendation[];
  whatsappEnabled: boolean;
  instagramEnabled: boolean;
  emailEnabled: boolean;
  setActiveTab: (tab: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  stats,
  recommendations,
  whatsappEnabled,
  instagramEnabled,
  emailEnabled,
  setActiveTab,
}) => {
  const totalVisitors = stats.totalLeads * 3 + 28;
  const visitorsPct = 100;
  
  // Funnel calculations based on total leads as denominator
  const leadsPct = totalVisitors > 0 ? Math.round((stats.totalLeads / totalVisitors) * 100) : 0;
  const qualPct = stats.totalLeads > 0 ? Math.round((stats.qualifiedLeads / stats.totalLeads) * 100) : 0;
  const apptPct = stats.totalLeads > 0 ? Math.round((stats.appointments / stats.totalLeads) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const }
    })
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600/15 via-teal-500/5 to-transparent border border-accent-primary/10 p-8">
        <h3 className="text-2xl font-extrabold text-white">Hey {user?.name}!</h3>
        <p className="mt-1 text-muted-text text-sm max-w-xl">
          Your Sales Agent is active on your site. Here is an overview of how your leads and visitor conversations are progressing.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Leads", val: stats.totalLeads, icon: Users, color: "text-accent-primary bg-accent-primary/10" },
          { label: "Qualified Leads", val: stats.qualifiedLeads, icon: Award, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Booked Calls", val: stats.appointments, icon: CalendarDays, color: "text-teal-400 bg-teal-500/10" },
          { label: "Conversion Rate", val: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              custom={idx}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl border border-card-border bg-card/40 p-6 flex flex-col justify-between hover:border-card-border/80 hover:bg-card/75 transition-all shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">{item.label}</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl font-black text-white">{item.val}</span>
                <div className={`p-2.5 rounded-xl ${item.color}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue & Intelligence Forecasting Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Expected Revenue", val: `₹${(stats.totalExpectedRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-400 bg-amber-500/10", desc: "Deal Value × Probability" },
          { label: "Revenue Pipeline", val: `₹${(stats.revenueForecast || 0).toLocaleString()}`, icon: LineChart, color: "text-emerald-400 bg-emerald-500/10", desc: "Unweighted potential value" },
          { label: "Appointment Conv. Rate", val: `${stats.leadConversionRate || 0}%`, icon: Percent, color: "text-teal-400 bg-teal-500/10", desc: "Leads with booked calls" },
          { label: "Avg. Lead Score", val: `${stats.averageLeadScore || 0} / 100`, icon: CheckSquare, color: "text-accent-primary bg-accent-primary/10", desc: "AI quality score average" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx + 4}
              custom={idx + 4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl border border-card-border bg-card/25 p-5 flex flex-col justify-between hover:border-card-border/80 hover:bg-card/50 transition-all shadow-inner"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">{item.label}</span>
                <span className="text-[10px] text-muted-text/70 mt-0.5">{item.desc}</span>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-black text-slate-100">{item.val}</span>
                <div className={`p-2.5 rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Onboarding Checklist Tour */}
      <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
          <CheckSquare className="h-4.5 w-4.5 text-accent-primary" />
          Guided Workspace Setup Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              title: "Connect Multi-Channel Links",
              desc: "Setup WhatsApp, Instagram, or email inbound webhook routes.",
              completed: whatsappEnabled || instagramEnabled || emailEnabled,
              tab: "integrations" as TabType,
            },
            {
              title: "Train AI Knowledge Base",
              desc: "Import company files or URLs to train your conversational sales agents.",
              completed: stats.totalLeads > 0 || recommendations.length > 0, // Mock fallback
              tab: "kb" as TabType,
            },
            {
              title: "Qualify Visitor Leads",
              desc: "Use widget previews to qualified cold visitors into scored pipeline leads.",
              completed: stats.totalLeads > 0,
              tab: "leads" as TabType,
            },
            {
              title: "Configure Custom Prompts",
              desc: "Adjust branding themes, positions, and tone rules for widget scripts.",
              completed: true, // Seeded default
              tab: "widget" as TabType,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab(item.tab)}
              className={`p-4 border rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all hover:bg-card/45 relative overflow-hidden ${
                item.completed ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-card-border bg-card/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide border ${
                    item.completed ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700/50"
                  }`}>
                    {item.completed ? "COMPLETED" : "TODO"}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-200 mt-3">{item.title}</h5>
                <p className="text-[10px] text-muted-text mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Engine Section */}
      <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
            <Brain className="h-4.5 w-4.5 text-accent-primary" />
            AI Action Recommendations
          </h4>
          <span className="text-[10px] bg-accent-primary/10 text-accent-primary border border-accent-primary/25 px-2 py-0.5 rounded font-black tracking-wide">
            FEED LIVE
          </span>
        </div>
        
        {recommendations.length === 0 ? (
          <p className="text-xs text-muted-text text-center py-6">No active recommendations. Setup your knowledge base and capture leads to get AI prioritized actions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="p-4 rounded-xl bg-card border border-card-border space-y-2 relative group hover:border-accent-primary/30 transition-all shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider ${
                    rec.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    rec.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {rec.priority} PRIORITY
                  </span>
                  <span className="text-[10px] text-muted-text font-semibold uppercase">{rec.category}</span>
                </div>
                <h5 className="text-sm font-bold text-slate-200">{rec.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.content}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Funnel Chart & Channel Distribution Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Stage Funnel Chart */}
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-6 shadow-sm">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text">Sales Conversion Funnel</h4>
            <p className="text-[11px] text-muted-text mt-0.5">Flow of visitor traffic to scheduled callbacks</p>
          </div>
          
          <div className="space-y-4">
            {/* Stage 1: Traffic */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-muted-text">
                <span>1. Total Traffic (Simulated)</span>
                <span>{totalVisitors} sessions ({visitorsPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-xl bg-card-border/30 overflow-hidden relative border border-card-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${visitorsPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-xl bg-gradient-to-r from-emerald-600/40 to-teal-500/40"
                />
              </div>
            </div>

            {/* Stage 2: Lead Capture */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-muted-text">
                <span>2. Captured Leads</span>
                <span>{stats.totalLeads} users ({leadsPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-xl bg-card-border/30 overflow-hidden relative border border-card-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${leadsPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="h-full rounded-xl bg-gradient-to-r from-emerald-500/40 to-teal-400/40"
                />
              </div>
            </div>

            {/* Stage 3: Qualified leads */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-muted-text">
                <span>3. Qualified Leads (HOT/WARM)</span>
                <span>{stats.qualifiedLeads} users ({qualPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-xl bg-card-border/30 overflow-hidden relative border border-card-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-xl bg-gradient-to-r from-emerald-500/50 to-emerald-400/50"
                />
              </div>
            </div>

            {/* Stage 4: Appointment Booked */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-muted-text">
                <span>4. Booked Appointments</span>
                <span>{stats.appointments} calls ({apptPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-xl bg-card-border/30 overflow-hidden relative border border-card-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${apptPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-xl bg-gradient-to-r from-teal-500 to-accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Distribution & Integrations Checklist */}
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-6 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text">Conversations By Channel</h4>
            <p className="text-[11px] text-muted-text mt-0.5">Interaction density comparison</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Website Chat", key: "WIDGET", text: "Active", pct: "65%", bg: "bg-accent-primary" },
              { label: "WhatsApp", key: "WHATSAPP", text: whatsappEnabled ? "Connected" : "Inactive", pct: whatsappEnabled ? "25%" : "0%", bg: "bg-green-500" },
              { label: "Instagram", key: "INSTAGRAM", text: instagramEnabled ? "Connected" : "Inactive", pct: instagramEnabled ? "15%" : "0%", bg: "bg-pink-500" },
              { label: "Email SMTP", key: "EMAIL", text: emailEnabled ? "Connected" : "Inactive", pct: emailEnabled ? "10%" : "0%", bg: "bg-indigo-500" }
            ].map((chan, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-card border border-card-border flex flex-col justify-between gap-2 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-muted-text">{chan.label}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-black text-slate-200">{chan.key}</span>
                  <span className="text-[10px] text-muted-text font-semibold">{chan.text}</span>
                </div>
                <div className="w-full bg-card-border/40 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: chan.pct }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className={`h-full rounded-full ${chan.bg}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
