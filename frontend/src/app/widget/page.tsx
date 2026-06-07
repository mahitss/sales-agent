"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, X, Bot, User, Phone, Mail, UserCheck } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface BusinessInfo {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  description: string;
}

interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  status?: string;
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load business info
  useEffect(() => {
    if (!businessId) {
      setError("No Business ID specified. Widget cannot initialize.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    fetch(`${apiUrl}/business/${businessId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Business profile not found");
        return res.json();
      })
      .then((data) => {
        setBusiness(data);
        
        // Retrieve session storage if exists
        const savedLeadId = sessionStorage.getItem(`leadId_${businessId}`);
        const savedConvId = sessionStorage.getItem(`convId_${businessId}`);

        if (savedLeadId && savedConvId) {
          setLeadId(savedLeadId);
          setConversationId(savedConvId);
          
          // Fetch existing conversation history
          fetch(`${apiUrl}/conversations/${savedConvId}`)
            .then((r) => r.json())
            .then((cData) => {
              if (cData && cData.messages) {
                setMessages(cData.messages);
              }
              if (cData && cData.lead) {
                setLead(cData.lead);
              }
            })
            .catch(console.error);
        } else {
          // Add initial welcome message
          setMessages([
            {
              role: "model",
              content: `Hello! Welcome to ${data.companyName}. How can I assist you today?`,
            },
          ]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load chat assistant. Please try again later.");
      });
  }, [businessId]);

  // Track visitor on mount
  useEffect(() => {
    if (!businessId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    
    // Generate realistic mock tracking parameters for dashboard metrics
    const locations = ["Mumbai", "New York", "London", "Berlin", "San Francisco", "Sydney", "Tokyo", "Paris", "Toronto"];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    const pageOptions = [
      ["/pricing", "/services"],
      ["/features", "/pricing"],
      ["/documentation", "/services", "/pricing"],
      ["/pricing"],
      ["/services"],
      ["/features", "/about", "/pricing"]
    ];
    const randomPages = pageOptions[Math.floor(Math.random() * pageOptions.length)];
    const randomDuration = Math.floor(Math.random() * 400) + 80; // seconds
    
    fetch(`${apiUrl}/business/${businessId}/track-visitor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: randomLocation,
        pagesViewed: randomPages,
        duration: randomDuration
      })
    }).catch(console.error);
  }, [businessId]);

  // Poll conversation history for operator takeover replies
  useEffect(() => {
    if (!conversationId || loading) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    
    const interval = setInterval(() => {
      fetch(`${apiUrl}/conversations/${conversationId}`)
        .then((r) => r.json())
        .then((cData) => {
          if (cData && cData.messages && !loading) {
            setMessages((prev) => {
              if (prev.length !== cData.messages.length) {
                return cData.messages;
              }
              return prev;
            });
          }
        })
        .catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, [conversationId, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !businessId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          businessId,
          leadId,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      setMessages((prev) => [...prev, { role: "model", content: data.response }]);
      
      // Save session info
      if (data.leadId) {
        setLeadId(data.leadId);
        sessionStorage.setItem(`leadId_${businessId}`, data.leadId);
      }
      if (data.conversationId) {
        setConversationId(data.conversationId);
        sessionStorage.setItem(`convId_${businessId}`, data.conversationId);
      }
      if (data.lead) {
        setLead(data.lead);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I encountered an issue. Let's try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const closeWidget = () => {
    window.parent.postMessage("close-logicra-widget", "*");
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 p-4 text-center text-white">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
          <p className="font-semibold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-400">Initializing Assistant...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white font-sans overflow-hidden border border-slate-800/80 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md">
            <Bot className="h-5.5 w-5.5 text-white" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 bg-green-400"></span>
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight text-slate-100">{business.companyName}</h2>
            <p className="text-xs text-emerald-400 font-medium">AI Agent Online</p>
          </div>
        </div>
        <button
          onClick={closeWidget}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50">
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "0ms" }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "150ms" }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Captured Info Banner */}
      {lead && (lead.name || lead.email || lead.phone || lead.budget) && (
        <div className="mx-4 mb-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Profile Sync:</span>
            {lead.name && lead.name !== "Anonymous Visitor" && <span className="font-semibold text-slate-200">Name</span>}
            {lead.email && <span className="font-semibold text-slate-200">• Email</span>}
            {lead.phone && <span className="font-semibold text-slate-200">• Phone</span>}
            {lead.budget && <span className="font-semibold text-slate-200">• Budget</span>}
          </div>
          {lead.status && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              lead.status === "HOT" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
              lead.status === "WARM" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {lead.status} LEAD
            </span>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your message..."
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:active:scale-100 transition-all shadow-md"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-600">
          Powered by <span className="font-semibold text-slate-500">Beacon AI</span>
        </p>
      </form>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-400">Loading Widget...</p>
      </div>
    }>
      <WidgetContent />
    </Suspense>
  );
}
