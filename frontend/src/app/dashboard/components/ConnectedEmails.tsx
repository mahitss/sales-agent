import React from "react";
import { Mail, Trash2, Plus, Loader, CheckCircle2, RefreshCw } from "lucide-react";

interface ConnectedEmailsProps {
  emailAccounts: any[];
  emailLoading: boolean;
  onConnect: (provider: "GMAIL" | "OUTLOOK") => void;
  onDisconnect: (id: string) => void;
}

export const ConnectedEmails: React.FC<ConnectedEmailsProps> = ({
  emailAccounts = [],
  emailLoading = false,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-200">Connected OAuth Mailboxes</h4>
          <p className="text-[10px] text-muted-text mt-0.5">
            Connect personal or corporate Gmail & Outlook mailboxes to synchronize history and send dripping followups.
          </p>
        </div>
        {emailLoading && <Loader className="h-4 w-4 animate-spin text-accent-primary" />}
      </div>

      {/* Connection Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onConnect("GMAIL")}
          disabled={emailLoading}
          className="flex items-center justify-center gap-2 p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Connect Gmail
        </button>

        <button
          onClick={() => onConnect("OUTLOOK")}
          disabled={emailLoading}
          className="flex items-center justify-center gap-2 p-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Connect Outlook
        </button>
      </div>

      {/* Connected Accounts List */}
      <div className="space-y-3">
        {emailAccounts.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-card-border rounded-xl text-xs text-slate-500">
            No mailboxes linked yet. Click above to connect via secure OAuth.
          </div>
        ) : (
          emailAccounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-card-border rounded-xl hover:border-slate-800 transition"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  acc.provider === "GMAIL" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                }`}>
                  {acc.provider === "GMAIL" ? "G" : "O"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{acc.email}</p>
                  <div className="flex items-center gap-2 text-[9px] text-muted-text mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold uppercase">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <RefreshCw className="h-2.5 w-2.5" />
                      Last Sync: {acc.syncState ? new Date(acc.syncState).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDisconnect(acc.id)}
                disabled={emailLoading}
                className="p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-card-border text-slate-500 hover:text-red-400 transition cursor-pointer"
                title="Disconnect Account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
