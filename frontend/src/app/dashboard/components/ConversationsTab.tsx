import React from "react";
import { MessageSquare, ShieldAlert, Bot, User, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Conversation } from "@/hooks/useDashboardData";

interface ConversationsTabProps {
  conversations: Conversation[];
  selectedConv: Conversation | null;
  setSelectedConv: (conv: Conversation | null) => void;
  handleToggleTakeover: () => void;
  operatorReply: string;
  setOperatorReply: (val: string) => void;
  handleSendOperatorReply: (e: React.FormEvent) => void;
  operatorSending: boolean;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
  conversations,
  selectedConv,
  setSelectedConv,
  handleToggleTakeover,
  operatorReply,
  setOperatorReply,
  handleSendOperatorReply,
  operatorSending,
}) => {

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-card-border rounded-2xl overflow-hidden bg-card/5 shadow-sm">
      {/* Left pane: conversations list */}
      <div className="w-1/3 border-r border-card-border flex flex-col bg-card/10">
        <div className="p-4 border-b border-card-border font-semibold text-xs uppercase tracking-wider text-muted-text bg-card/25">
          All Chats
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-card-border/30">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-text text-sm">
              No conversations log available.
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              const leadName = c.lead?.name || "Anonymous Visitor";
              const lastMsg = c.messages[c.messages.length - 1]?.content || "";
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
                  className={`w-full text-left p-4 hover:bg-card/20 transition-all cursor-pointer ${
                    isSelected ? "bg-card/40 border-l-2 border-accent-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-200 truncate pr-2 flex items-center gap-1.5">
                      {c.channel !== "WIDGET" && (
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          c.channel === "WHATSAPP" ? "bg-green-400" :
                          c.channel === "INSTAGRAM" ? "bg-pink-400" : "bg-indigo-400"
                        }`}></span>
                      )}
                      {leadName === "Anonymous Visitor" ? (
                        <span className="italic font-normal text-muted-text">Anonymous</span>
                      ) : (
                        leadName
                      )}
                    </span>
                    <span className="text-[10px] text-muted-text shrink-0">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">{lastMsg}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane: chat viewer */}
      <div className="flex-1 flex flex-col bg-card/5">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-card/15">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">
                    {selectedConv.lead?.name || "Anonymous Visitor"}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    selectedConv.channel === "WHATSAPP" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    selectedConv.channel === "INSTAGRAM" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                    selectedConv.channel === "EMAIL" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                    "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                  }`}>
                    {selectedConv.channel}
                  </span>
                </div>
                <div className="text-xs text-muted-text mt-0.5">
                  {selectedConv.lead?.email ? `${selectedConv.lead.email} • ` : ""}
                  {selectedConv.lead?.phone ? `${selectedConv.lead.phone} • ` : ""}
                  {selectedConv.lead?.budget ? `Budget: ${selectedConv.lead.budget}` : ""}
                </div>
              </div>
              
              {/* Takeover Control buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleTakeover}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedConv.isHumanTakeover
                      ? "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20"
                      : "bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  {selectedConv.isHumanTakeover ? "Release to AI" : "Take Over Chat"}
                </button>

                {selectedConv.lead?.status && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    selectedConv.lead.status === "HOT" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    selectedConv.lead.status === "WARM" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {selectedConv.lead.status}
                  </span>
                )}
              </div>
            </div>

            {/* Takeover Alert banner */}
            {selectedConv.isHumanTakeover && (
              <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                <span>Takeover Active. AI is currently paused. Use the message panel below to chat manually.</span>
              </div>
            )}

            {/* Chat Bubble List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <AnimatePresence initial={false}>
                {selectedConv.messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="h-7.5 w-7.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? "bg-accent-primary text-white rounded-tr-none shadow-md"
                          : "bg-card border border-card-border text-slate-200 rounded-tl-none shadow-sm"
                      }`}>
                        {m.content}
                      </div>
                      {isUser && (
                        <div className="h-7.5 w-7.5 rounded-lg bg-card border border-card-border text-muted-text flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Manual Messaging Input Panel */}
            <div className="p-4 border-t border-card-border bg-card/5">
              {selectedConv.isHumanTakeover ? (
                <form onSubmit={handleSendOperatorReply} className="flex gap-2">
                  <input
                    type="text"
                    value={operatorReply}
                    onChange={(e) => setOperatorReply(e.target.value)}
                    placeholder="Type a manual response to user..."
                    className="flex-1 rounded-xl bg-card border border-card-border px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!operatorReply.trim() || operatorSending}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </form>
              ) : (
                <p className="text-center text-xs text-muted-text py-2">
                  💡 Click <strong>Take Over Chat</strong> at the top to pause AI and message this visitor manually.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-text">
            <MessageSquare className="h-10 w-10 text-card-border mb-2" />
            <p className="text-sm">Select a conversation from the sidebar to view transcript</p>
          </div>
        )}
      </div>
    </div>
  );
};
