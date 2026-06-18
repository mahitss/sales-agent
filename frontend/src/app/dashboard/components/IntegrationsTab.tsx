import React from "react";
import { Check, Radio, Send } from "lucide-react";
import { BusinessInfo } from "@/hooks/useDashboardData";

interface IntegrationsTabProps {
  business: BusinessInfo | null;
  whatsappEnabled: boolean;
  setWhatsappEnabled: (val: boolean) => void;
  whatsappApiKey: string;
  setWhatsappApiKey: (val: string) => void;
  instagramEnabled: boolean;
  setInstagramEnabled: (val: boolean) => void;
  instagramAccountId: string;
  setInstagramAccountId: (val: string) => void;
  emailEnabled: boolean;
  setEmailEnabled: (val: boolean) => void;
  emailSmtp: string;
  setEmailSmtp: (val: string) => void;
  themeColor: string;
  setThemeColor: (val: string) => void;
  agentTone: string;
  setAgentTone: (val: string) => void;
  agentPrompt: string;
  setAgentPrompt: (val: string) => void;
  connectionSaving: boolean;
  handleSaveConnections: (e: React.FormEvent) => void;
  simChannel: string;
  setSimChannel: (val: string) => void;
  simLeadName: string;
  setSimLeadName: (val: string) => void;
  simLeadPhone: string;
  setSimLeadPhone: (val: string) => void;
  simLeadEmail: string;
  setSimLeadEmail: (val: string) => void;
  simMessage: string;
  setSimMessage: (val: string) => void;
  simLoading: boolean;
  simStatus: string;
  handleSimulateMessage: (e: React.FormEvent) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  whatsappEnabled,
  setWhatsappEnabled,
  whatsappApiKey,
  setWhatsappApiKey,
  instagramEnabled,
  setInstagramEnabled,
  instagramAccountId,
  setInstagramAccountId,
  emailEnabled,
  setEmailEnabled,
  emailSmtp,
  setEmailSmtp,
  themeColor,
  setThemeColor,
  agentTone,
  setAgentTone,
  agentPrompt,
  setAgentPrompt,
  connectionSaving,
  handleSaveConnections,
  simChannel,
  setSimChannel,
  simLeadName,
  setSimLeadName,
  simLeadPhone,
  setSimLeadPhone,
  simLeadEmail,
  setSimLeadEmail,
  simMessage,
  setSimMessage,
  simLoading,
  simStatus,
  handleSimulateMessage,
}) => {


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Integration Toggles Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Multi-Channel Connect Setup</h3>
          <p className="text-xs text-muted-text mt-1">Configure connections API keys to enable automatic lead qualifications across channels</p>
        </div>

        <form onSubmit={handleSaveConnections} className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-6 shadow-sm">
          {/* WhatsApp */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">WhatsApp Business API Connection</span>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="h-4 w-4 text-accent-primary bg-card border border-card-border rounded focus:ring-accent-primary cursor-pointer transition-all"
              />
            </div>
            {whatsappEnabled && (
              <input
                type="text"
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey(e.target.value)}
                placeholder="WhatsApp Api Access Key / Token"
                className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Instagram Messaging API Connection</span>
              <input
                type="checkbox"
                checked={instagramEnabled}
                onChange={(e) => setInstagramEnabled(e.target.checked)}
                className="h-4 w-4 text-accent-primary bg-card border border-card-border rounded focus:ring-accent-primary cursor-pointer transition-all"
              />
            </div>
            {instagramEnabled && (
              <input
                type="text"
                value={instagramAccountId}
                onChange={(e) => setInstagramAccountId(e.target.value)}
                placeholder="Instagram Account ID / Access Token"
                className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            )}
          </div>

          {/* Email */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Email SMTP Connection</span>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="h-4 w-4 text-accent-primary bg-card border border-card-border rounded focus:ring-accent-primary cursor-pointer transition-all"
              />
            </div>
            {emailEnabled && (
              <input
                type="text"
                value={emailSmtp}
                onChange={(e) => setEmailSmtp(e.target.value)}
                placeholder="SMTP Connection URL (e.g. smtp.mailgun.org:587)"
                className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            )}
          </div>

          {/* Brand Branding Customizations */}
          <div className="space-y-4 pt-4 border-t border-card-border/60">
            <h4 className="font-bold text-xs uppercase tracking-wider text-accent-primary font-black">AI Personalization Branding</h4>

            {/* Chat widget Theme Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-text">Widget Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-8 w-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none w-28 uppercase font-mono transition-all focus:border-accent-primary/50"
                />
                <div className="flex gap-1.5 ml-2">
                  {["#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#F59E0B"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setThemeColor(c)}
                      className="h-5.5 w-5.5 rounded-full border border-slate-950 transition-all hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c, border: themeColor === c ? '2px solid white' : 'none' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Conversational Tone */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-text">Conversational AI Tone</label>
              <select
                value={agentTone}
                onChange={(e) => setAgentTone(e.target.value)}
                className="w-full rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50 cursor-pointer transition-all"
              >
                <option value="FRIENDLY">Friendly & Approachable</option>
                <option value="PROFESSIONAL">Professional & Corporate</option>
                <option value="PERSUASIVE">Persuasive & Sales-driven</option>
                <option value="BOLD">Bold & High-energy</option>
              </select>
            </div>

            {/* Custom Prompt Directives */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-text">Agent Custom Instructions (Prompt Overrides)</label>
              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Focus on scheduling demo calls first. Offer details on price packages if they ask. Never say we support custom refunds."
                className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-accent-primary/50 focus:outline-none resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={connectionSaving}
              className="bg-accent-primary hover:bg-accent-hover text-white font-semibold rounded-xl px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="h-4 w-4" />
              Save configurations
            </button>
          </div>
        </form>
      </div>

      {/* Interactive incoming simulator panel */}
      <div className="flex flex-col border border-card-border rounded-2xl overflow-hidden bg-card/10 shadow-sm">
        <div className="p-4 border-b border-card-border bg-card/25 flex items-center gap-2">
          <Radio className="h-4.5 w-4.5 text-accent-primary animate-pulse" />
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-text">Interactive Incoming Channel Simulator</span>
        </div>

        <form onSubmit={handleSimulateMessage} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-xs text-muted-text">
              Simulate a customer texting your business via WhatsApp, Instagram, or Email. Beacon qualifies the lead, scores it, and populates the unified Live Inbox.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-text">Select Channel</label>
                <select
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50 cursor-pointer transition-all"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-text">Customer Name</label>
                <input
                  type="text"
                  required
                  value={simLeadName}
                  onChange={(e) => setSimLeadName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-text">Phone (WhatsApp ID)</label>
                <input
                  type="text"
                  value={simLeadPhone}
                  onChange={(e) => setSimLeadPhone(e.target.value)}
                  placeholder="e.g. +12345678"
                  className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-text">Email Address</label>
                <input
                  type="email"
                  value={simLeadEmail}
                  onChange={(e) => setSimLeadEmail(e.target.value)}
                  placeholder="e.g. john@email.com"
                  className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-text">Message Content</label>
              <textarea
                required
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                rows={3}
                placeholder="Type customer simulated message here..."
                className="mt-1 w-full rounded-xl bg-card border border-card-border px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary/50 resize-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-card-border">
            <button
              type="submit"
              disabled={simLoading || !simMessage || !simLeadName}
              className="w-full bg-accent-primary hover:bg-accent-hover text-white font-bold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-colors"
            >
              <Send className="h-4 w-4" />
              Simulate Incoming Message
            </button>

            {simStatus && (
              <div className="rounded-xl bg-background border border-card-border p-3 font-mono text-[10px] text-accent-primary shadow-inner">
                {simStatus}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
