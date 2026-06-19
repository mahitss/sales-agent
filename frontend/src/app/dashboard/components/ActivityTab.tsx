import React from "react";
import { ListFilter, ShieldAlert, Key, ClipboardList, RefreshCw, Layers } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  ipAddress: string | null;
  metadata: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

interface ActivityTabProps {
  activityLogs: ActivityLog[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ activityLogs }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "AUTH_LOGIN":
      case "AUTH_REGISTER":
        return <Key className="h-4 w-4 text-amber-400" />;
      case "LEAD_QUALIFY":
      case "LEAD_STATUS_UPDATE":
        return <Layers className="h-4 w-4 text-sky-400" />;
      case "SHEET_SYNC":
        return <RefreshCw className="h-4 w-4 text-emerald-400" />;
      default:
        return <ClipboardList className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    const base = "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border";
    switch (action) {
      case "AUTH_LOGIN":
        return `${base} bg-amber-500/10 text-amber-400 border-amber-500/20`;
      case "LEAD_QUALIFY":
        return `${base} bg-sky-500/10 text-sky-400 border-sky-500/20`;
      case "SHEET_SYNC":
        return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`;
      case "BILLING_UPDATE":
        return `${base} bg-purple-500/10 text-purple-400 border-purple-500/20`;
      default:
        return `${base} bg-slate-800 text-slate-300 border-slate-700/50`;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h3 className="text-xl font-bold text-white">System Audit logs</h3>
        <p className="text-xs text-muted-text mt-1">
          Chronological record of account events, authentication actions, data modifications, and API triggers inside the workspace.
        </p>
      </div>

      <div className="overflow-x-auto border border-card-border rounded-2xl bg-card/10 shadow-sm">
        <table className="w-full border-collapse text-left text-sm min-w-[800px]">
          <thead className="bg-card border-b border-card-border text-xs font-semibold uppercase text-muted-text">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Operator</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border/60">
            {activityLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-text">
                  No activity logs recorded. Perform actions in the dashboard to populate logs.
                </td>
              </tr>
            ) : (
              activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-card/25 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className={getActionBadge(log.action)}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-sm">
                    <p className="truncate text-xs" title={log.description}>
                      {log.description}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[9px] font-mono text-muted-text bg-card border border-card-border p-1 rounded mt-1 overflow-x-auto max-w-xs">
                        {JSON.stringify(log.metadata)}
                      </pre>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">{log.user.name}</p>
                        <p className="text-[10px] text-muted-text">{log.user.email} ({log.user.role})</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-text italic">System Process</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {log.ipAddress || "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-text whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString()} ({new Date(log.createdAt).toLocaleDateString()})
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
