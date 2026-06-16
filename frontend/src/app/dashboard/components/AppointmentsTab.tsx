import React from "react";
import { Calendar } from "lucide-react";

interface Appointment {
  id: string;
  lead: any;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

interface AppointmentsTabProps {
  appointments: Appointment[];
  handleUpdateApptStatus: (apptId: string, status: string) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  handleUpdateApptStatus,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Booked Appointments</h3>
        <p className="text-xs text-slate-500 mt-1">Interactions where the AI extracted and scheduled a callback</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointments.length === 0 ? (
          <div className="col-span-full border border-slate-900 border-dashed rounded-2xl p-12 text-center text-slate-500 text-sm">
            No appointments scheduled yet. Let a user ask to schedule a call in the widget simulator!
          </div>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-white">{a.lead.name || "Anonymous Lead"}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{a.lead.email || "No email"}</p>
                  <p className="text-xs text-slate-500">{a.lead.phone || "No phone"}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  a.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  a.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {a.status}
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-900 text-sm">
                <Calendar className="h-4.5 w-4.5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-slate-200">{a.date}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>

              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateApptStatus(a.id, "CONFIRMED")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateApptStatus(a.id, "CANCELLED")}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
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
