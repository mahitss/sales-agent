import React from "react";
import { Calendar } from "lucide-react";
import { Appointment } from "@/hooks/useDashboardData";

interface AppointmentsTabProps {
  appointments: Appointment[];
  handleUpdateApptStatus: (apptId: string, status: string) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  handleUpdateApptStatus,
}) => {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h3 className="text-xl font-bold text-white">Booked Appointments</h3>
        <p className="text-xs text-muted-text mt-1">Interactions where the AI extracted and scheduled a callback</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointments.length === 0 ? (
          <div className="col-span-full border border-card-border border-dashed rounded-2xl p-12 text-center text-muted-text text-sm">
            No appointments scheduled yet. Let a user ask to schedule a call in the widget simulator!
          </div>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm hover:border-card-border/85 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-white">{a.lead.name || "Anonymous Lead"}</h4>
                  <p className="text-xs text-muted-text mt-0.5">{a.lead.email || "No email"}</p>
                  <p className="text-xs text-muted-text">{a.lead.phone || "No phone"}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  a.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  a.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {a.status}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-card-border text-sm shadow-inner">
                <Calendar className="h-4.5 w-4.5 text-accent-primary" />
                <div>
                  <p className="font-semibold text-slate-200">{a.date}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>

              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateApptStatus(a.id, "CONFIRMED")}
                    className="flex-1 bg-accent-primary hover:bg-accent-hover text-white rounded-lg py-2 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateApptStatus(a.id, "CANCELLED")}
                    className="flex-1 bg-card border border-card-border text-slate-300 hover:text-white hover:bg-card/80 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
