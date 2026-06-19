import React from "react";
import { Zap, Play, CheckCircle2, AlertCircle, Clock, Calendar } from "lucide-react";

interface WorkflowRule {
  id: string;
  trigger: string;
  action: string;
  isEnabled: boolean;
}

interface OutreachSequence {
  id: string;
  template: string;
  subject: string;
  status: string;
  scheduledFor: string;
  lead: {
    name: string;
    email: string;
  };
}

interface AutomationsTabProps {
  workflowRules: WorkflowRule[];
  outreachSequences: OutreachSequence[];
  handleToggleWorkflowRule: (ruleId: string, isEnabled: boolean) => Promise<void>;
}

export const AutomationsTab: React.FC<AutomationsTabProps> = ({
  workflowRules,
  outreachSequences,
  handleToggleWorkflowRule,
}) => {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h3 className="text-xl font-bold text-white">Workflow Automations & Outreach</h3>
        <p className="text-xs text-muted-text mt-1">
          Configure rule-based triggers and view scheduled corporate outreach campaigns.
        </p>
      </div>

      {/* Rules block */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Active Automation Trigger Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowRules.length === 0 ? (
            <div className="col-span-2 text-center py-6 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
              Loading automation settings...
            </div>
          ) : (
            workflowRules.map((rule) => (
              <div
                key={rule.id}
                className="border border-card-border bg-card/10 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Trigger
                    </span>
                    <span className="text-xs text-white font-extrabold font-mono">
                      {rule.trigger.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                      Action
                    </span>
                    <span className="text-xs text-slate-300">
                      {rule.action.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggleWorkflowRule(rule.id, !rule.isEnabled)}
                  className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-all duration-200 focus:outline-none flex items-center ${
                    rule.isEnabled ? "bg-accent-primary justify-end" : "bg-slate-800 justify-start border border-slate-700"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-slate-950 shadow transition-all ${rule.isEnabled ? "bg-slate-950" : "bg-slate-500"}`} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campaigns log outbox */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Outreach Sequence Outbox Queue
        </h4>

        <div className="overflow-x-auto border border-card-border rounded-2xl bg-card/10 shadow-sm">
          <table className="w-full border-collapse text-left text-sm min-w-[700px]">
            <thead className="bg-card border-b border-card-border text-xs font-semibold uppercase text-muted-text">
              <tr>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Sequence Template</th>
                <th className="px-6 py-4">Email Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Send Date Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/60">
              {outreachSequences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-text">
                    No outbound emails scheduled currently. Open a Lead dossier details drawer to schedule campaigns.
                  </td>
                </tr>
              ) : (
                outreachSequences.map((seq) => (
                  <tr key={seq.id} className="hover:bg-card/25 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-200 text-xs">{seq.lead.name}</p>
                      <p className="text-[10px] text-muted-text">{seq.lead.email}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {seq.template}
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {seq.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {seq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-text whitespace-nowrap">
                      {new Date(seq.scheduledFor).toLocaleTimeString()} ({new Date(seq.scheduledFor).toLocaleDateString()})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
