import React from "react";
import { Users, Award, CalendarDays, TrendingUp, Brain } from "lucide-react";

interface OverviewTabProps {
  user: any;
  stats: any;
  recommendations: any[];
  whatsappEnabled: boolean;
  instagramEnabled: boolean;
  emailEnabled: boolean;
  setActiveTab: (tab: any) => void;
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
  
  // Funnel calculations fixed to use stats.totalLeads as the denominator (issue request)
  const leadsPct = totalVisitors > 0 ? Math.round((stats.totalLeads / totalVisitors) * 100) : 0;
  const qualPct = stats.totalLeads > 0 ? Math.round((stats.qualifiedLeads / stats.totalLeads) * 100) : 0;
  const apptPct = stats.totalLeads > 0 ? Math.round((stats.appointments / stats.totalLeads) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600/20 to-teal-500/5 border border-emerald-500/20 p-8">
        <h3 className="text-2xl font-extrabold text-white">Hey {user?.name}!</h3>
        <p className="mt-1 text-slate-400 text-sm max-w-xl">
          Your Sales Agent is active on your site. Here is an overview of how your leads and visitor conversations are progressing.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-white">{stats.totalLeads}</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Qualified Leads</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-white">{stats.qualifiedLeads}</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booked Calls</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-white">{stats.appointments}</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CalendarDays className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion Rate</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-emerald-400">{stats.conversionRate}%</span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Engine Section */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Brain className="h-4.5 w-4.5 text-emerald-400" />
            AI Action Recommendations
          </h4>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-black tracking-wide">
            FEED LIVE
          </span>
        </div>
        
        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No active recommendations. Setup your knowledge base and capture leads to get AI prioritized actions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2 relative group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider ${
                    rec.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    rec.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {rec.priority} PRIORITY
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{rec.category}</span>
                </div>
                <h5 className="text-sm font-bold text-slate-200">{rec.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Funnel Chart & Channel Distribution Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Stage Funnel Chart */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Sales Conversion Funnel</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Flow of visitor traffic to scheduled callbacks</p>
          </div>
          
          <div className="space-y-4">
            {/* Stage 1: Traffic */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>1. Total Traffic (Simulated)</span>
                <span>{totalVisitors} sessions ({visitorsPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                <div className="h-full rounded-lg bg-gradient-to-r from-emerald-700/50 to-teal-500/50" style={{ width: `${visitorsPct}%` }}></div>
              </div>
            </div>

            {/* Stage 2: Lead Capture */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>2. Captured Leads</span>
                <span>{stats.totalLeads} users ({leadsPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                <div className="h-full rounded-lg bg-gradient-to-r from-emerald-600/50 to-teal-400/50" style={{ width: `${leadsPct}%` }}></div>
              </div>
            </div>

            {/* Stage 3: Qualified leads */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>3. Qualified Leads (HOT/WARM)</span>
                <span>{stats.qualifiedLeads} users ({qualPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                <div className="h-full rounded-lg bg-gradient-to-r from-emerald-500/60 to-emerald-400/60" style={{ width: `${qualPct}%` }}></div>
              </div>
            </div>

            {/* Stage 4: Appointment Booked */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>4. Booked Appointments</span>
                <span>{stats.appointments} calls ({apptPct}%)</span>
              </div>
              <div className="h-7 w-full rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800">
                <div className="h-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${apptPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Distribution & Integrations Checklist */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Conversations By Channel</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Interaction density comparison</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Website Chat</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-white">WIDGET</span>
                <span className="text-xs text-slate-400 font-semibold">Active</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "65%" }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">WhatsApp</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-white">WHATSAPP</span>
                <span className="text-xs text-slate-400 font-semibold">{whatsappEnabled ? "Connected" : "Inactive"}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full bg-green-500" style={{ width: whatsappEnabled ? "25%" : "0%" }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Instagram</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-white">INSTAGRAM</span>
                <span className="text-xs text-slate-400 font-semibold">{instagramEnabled ? "Connected" : "Inactive"}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full bg-pink-500" style={{ width: instagramEnabled ? "15%" : "0%" }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Email SMTP</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-white">EMAIL</span>
                <span className="text-xs text-slate-400 font-semibold">{emailEnabled ? "Connected" : "Inactive"}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: emailEnabled ? "10%" : "0%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
