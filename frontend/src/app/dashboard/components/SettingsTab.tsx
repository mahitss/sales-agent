import React, { useEffect, useState } from "react";
import { 
  Users, 
  Award, 
  TrendingUp, 
  Copy, 
  Plus, 
  RefreshCw, 
  ShieldAlert, 
  Laptop, 
  Globe, 
  Key,
  CheckCircle,
  HelpCircle,
  Clock,
  Terminal,
  Activity,
  Trash2,
  Lock,
  Eye,
  AlertTriangle
} from "lucide-react";

interface SettingsTabProps {
  waitlist: any[];
  waitlistLoading: boolean;
  referrals: any[];
  referralMetrics: {
    totalCount: number;
    convertedCount: number;
    conversionRate: number;
  };
  referralsLoading: boolean;
  sessions: any[];
  sessionsLoading: boolean;
  handleApproveWaitlist: (id: string) => void;
  handleCreateReferral: () => void;
  handleRevokeSession: (sessionId: string) => void;

  // Public Developer API Keys
  apiKeys: any[];
  apiKeysLoading: boolean;
  handleCreateApiKey: (name: string, expiresDays?: number) => Promise<string | null>;
  handleRevokeApiKey: (id: string) => void;

  // Outbound Webhooks
  webhooks: any[];
  webhooksLoading: boolean;
  handleCreateWebhook: (url: string, events: string[]) => void;
  handleDeleteWebhook: (id: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  waitlist,
  waitlistLoading,
  referrals,
  referralMetrics,
  referralsLoading,
  sessions,
  sessionsLoading,
  handleApproveWaitlist,
  handleCreateReferral,
  handleRevokeSession,
  apiKeys,
  apiKeysLoading,
  handleCreateApiKey,
  handleRevokeApiKey,
  webhooks,
  webhooksLoading,
  handleCreateWebhook,
  handleDeleteWebhook,
}) => {
  const [copied, setCopied] = useState(false);

  // API Key Form State
  const [newKeyName, setNewKeyName] = useState("");
  const [keyExpiresDays, setKeyExpiresDays] = useState(90);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyGenerating, setKeyGenerating] = useState(false);

  // Webhook Form State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead.created", "lead.qualified"]);

  // Generate Referral URL based on the user's active code
  const userReferral = referrals.length > 0 ? referrals[0] : null; 
  const referralCode = userReferral ? userReferral.code : "";
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/register?ref=${referralCode}` 
    : `http://localhost:3000/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGeneratedKey = () => {
    if (!generatedRawKey) return;
    navigator.clipboard.writeText(generatedRawKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const onSubmitApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyGenerating(true);
    setGeneratedRawKey(null);
    try {
      const rawKey = await handleCreateApiKey(newKeyName, keyExpiresDays > 0 ? keyExpiresDays : undefined);
      if (rawKey) {
        setGeneratedRawKey(rawKey);
        setNewKeyName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKeyGenerating(false);
    }
  };

  const onSubmitWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim() || selectedEvents.length === 0) return;
    handleCreateWebhook(webhookUrl, selectedEvents);
    setWebhookUrl("");
  };

  const handleToggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-white">SaaS Settings & Growth Center</h3>
        <p className="text-xs text-muted-text mt-1">Examine onboarding waitlists, referrals, active sessions, developer API Keys, and outbound webhooks.</p>
      </div>

      {/* Grid: Metrics Cards for Referrals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-card-border bg-card/20 p-5 flex flex-col justify-between hover:bg-card/30 transition-all shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">Total Referrals</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-white">{referralMetrics.totalCount}</span>
            <div className="p-2.5 rounded-xl text-accent-primary bg-accent-primary/10">
              <Users className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card/20 p-5 flex flex-col justify-between hover:bg-card/30 transition-all shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">Converted Users</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-white">{referralMetrics.convertedCount}</span>
            <div className="p-2.5 rounded-xl text-emerald-400 bg-emerald-500/10">
              <Award className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card/20 p-5 flex flex-col justify-between hover:bg-card/30 transition-all shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">Conversion Rate</span>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-white">{referralMetrics.conversionRate}%</span>
            <div className="p-2.5 rounded-xl text-amber-400 bg-amber-500/10">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral System Box */}
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-accent-primary" />
            Viral Loop & Referrals
          </h4>
          <p className="text-xs text-muted-text">
            Invite your network and fast-track their dashboard access. When referee users register, they bypass waitlists automatically.
          </p>

          {!referralCode ? (
            <button
              onClick={handleCreateReferral}
              className="flex items-center gap-2 rounded-xl bg-accent-primary hover:bg-accent-primary-hover px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-accent-primary/20"
            >
              Generate Referral Code
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Your Invitation Link</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-slate-300 focus:outline-none font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referrals List Table */}
          <div className="mt-6 pt-4 border-t border-card-border/50">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">Referred signups</h5>
            {referralsLoading ? (
              <div className="py-8 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-accent-primary" /></div>
            ) : referrals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-card-border p-6 text-center text-xs text-muted-text">
                No referrals generated yet. Invite some colleagues to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-card-border text-muted-text uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2">Referral Code</th>
                      <th className="py-2">Referee Email</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="border-b border-card-border/40 hover:bg-card/10 text-slate-300">
                        <td className="py-3 font-mono text-[10px]">{ref.code}</td>
                        <td className="py-3">{ref.refereeEmail || "Not Claimed Yet"}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            ref.status === "CONVERTED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Waitlist Control Center */}
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-accent-primary" />
            Waitlist Approvals
          </h4>
          <p className="text-xs text-muted-text">
            Control platform registrations. Approved entries receive system emails and invites immediately.
          </p>

          {waitlistLoading ? (
            <div className="py-12 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-accent-primary" /></div>
          ) : waitlist.length === 0 ? (
            <div className="rounded-xl border border-dashed border-card-border p-8 text-center text-xs text-muted-text">
              No entries on waitlist.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-card-border text-muted-text uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2">Email</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr key={entry.id} className="border-b border-card-border/40 hover:bg-card/10 text-slate-300">
                      <td className="py-3">
                        <p className="font-semibold text-slate-200">{entry.name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-text">{entry.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          entry.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : entry.status === "CONVERTED"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {entry.status === "PENDING" && (
                          <button
                            onClick={() => handleApproveWaitlist(entry.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Developer API Keys Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-accent-primary" />
            Developer API Keys
          </h4>
          <p className="text-xs text-muted-text">
            Generate programmatic keys to pull lead intelligence, qualify campaigns, and sync records with external CRMs.
          </p>

          <form onSubmit={onSubmitApiKey} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Key Name (e.g. Apollo Sync)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none"
              />
              <select
                value={keyExpiresDays}
                onChange={(e) => setKeyExpiresDays(Number(e.target.value))}
                className="rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={365}>365 Days</option>
                <option value={0}>Never Expire</option>
              </select>
              <button
                type="submit"
                disabled={keyGenerating}
                className="bg-accent-primary hover:bg-accent-primary-hover px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                {keyGenerating ? "..." : "Generate"}
              </button>
            </div>
          </form>

          {/* Secure One-time Key Display Banner */}
          {generatedRawKey && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Copy this key now. It will not be shown again.
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={generatedRawKey}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-400"
                />
                <button
                  onClick={handleCopyGeneratedKey}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs cursor-pointer"
                >
                  {keyCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* API Keys Table */}
          <div className="mt-4 pt-4 border-t border-card-border/50">
            {apiKeysLoading ? (
              <div className="py-6 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-accent-primary" /></div>
            ) : apiKeys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-card-border p-6 text-center text-xs text-muted-text">
                No active Developer API keys configured.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-card-border text-muted-text uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2">Name</th>
                      <th className="py-2">Last Used</th>
                      <th className="py-2">Expires</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((keyRec) => (
                      <tr key={keyRec.id} className="border-b border-card-border/40 hover:bg-card/10 text-slate-300">
                        <td className="py-3">
                          <p className="font-semibold text-slate-200">{keyRec.name}</p>
                          <span className="text-[8px] bg-slate-800/60 border border-slate-700 px-1 py-0.2 rounded font-mono text-slate-400 uppercase tracking-wide">
                            {keyRec.role}
                          </span>
                        </td>
                        <td className="py-3 text-[10px] font-mono text-muted-text">
                          {keyRec.lastUsedAt ? new Date(keyRec.lastUsedAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3 text-[10px] text-muted-text">
                          {keyRec.expiresAt ? new Date(keyRec.expiresAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleRevokeApiKey(keyRec.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer hover:bg-rose-500/5 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Outbound Webhooks Section */}
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-accent-primary" />
            Outbound Webhooks
          </h4>
          <p className="text-xs text-muted-text">
            Register URLs to subscribe to real-time events. Payloads are signed with an HMAC SHA-256 header.
          </p>

          <form onSubmit={onSubmitWebhook} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Webhook URL (e.g. https://api.company.com/webhook)"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-accent-primary hover:bg-accent-primary-hover px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                Subscribe
              </button>
            </div>

            {/* Event selectors checkboxes */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-muted-text uppercase font-bold">Events:</span>
              {["lead.created", "lead.qualified", "lead.updated"].map(evt => {
                const checked = selectedEvents.includes(evt);
                return (
                  <label key={evt} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleEvent(evt)}
                      className="rounded border-slate-700 bg-slate-950 text-accent-primary focus:ring-accent-primary"
                    />
                    <span>{evt}</span>
                  </label>
                );
              })}
            </div>
          </form>

          {/* Webhooks Subscription Table */}
          <div className="mt-4 pt-4 border-t border-card-border/50">
            {webhooksLoading ? (
              <div className="py-6 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-accent-primary" /></div>
            ) : webhooks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-card-border p-6 text-center text-xs text-muted-text">
                No active webhook subscriptions configured.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[220px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-card-border text-muted-text uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2">Target Endpoint</th>
                      <th className="py-2">Subscribed Events</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((sub) => (
                      <tr key={sub.id} className="border-b border-card-border/40 hover:bg-card/10 text-slate-300">
                        <td className="py-3 max-w-[200px] truncate">
                          <p className="font-semibold text-slate-200 truncate">{sub.url}</p>
                          <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-mono">
                            {sub.secret}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {sub.events.map((evt: string) => (
                              <span key={evt} className="text-[8px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded font-mono">
                                {evt}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteWebhook(sub.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer hover:bg-rose-500/5 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Audit Trails Panel */}
      <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
          <Key className="h-4.5 w-4.5 text-accent-primary" />
          Active Login Sessions Audit
        </h4>
        <p className="text-xs text-muted-text">
          Review recent browser sessions connected to your credentials. Revoke untrusted sessions instantly.
        </p>

        {sessionsLoading ? (
          <div className="py-12 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-accent-primary" /></div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border p-8 text-center text-xs text-muted-text">
            No active sessions fetched.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-card-border text-muted-text uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-2">Device & Browser</th>
                  <th className="py-2">Location/Details</th>
                  <th className="py-2">Last Active</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => {
                  const isCurrent = sess.current === true;
                  return (
                    <tr key={sess.id} className="border-b border-card-border/40 hover:bg-card/10 text-slate-300">
                      <td className="py-3 flex items-center gap-3">
                        <Laptop className="h-4.5 w-4.5 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{sess.device || "Desktop Terminal"}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent-primary/20 text-accent-primary font-bold border border-accent-primary/20">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-text font-mono truncate max-w-xs">{sess.userAgent || "Token Pair Credentials"}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-text" />
                          <span className="text-[11px] font-mono">{sess.ip || "127.0.0.1"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-text text-[10px]">
                        {sess.lastAccessed ? new Date(sess.lastAccessed).toLocaleString() : "Recently active"}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {!isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1 transition-all cursor-pointer border border-rose-500/20 rounded hover:bg-rose-500/5"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
