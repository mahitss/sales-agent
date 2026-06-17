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
  themeColor?: string;
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [visitorToken, setVisitorToken] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Play premium notification chime using Web Audio API
  const playNotificationSound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === "suspended") {
        return;
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chord
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      
      oscillator.start();
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5 chime
      oscillator.stop(audioCtx.currentTime + 0.26);
    } catch (e) {
      console.warn("Audio chime block bypass:", e);
    }
  };

  // Sound triggers on incoming messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === "model" && lastMessageCountRef.current > 0) {
        playNotificationSound();
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // Load business info
  useEffect(() => {
    if (!businessId) {
      setError("No Business ID specified. Widget cannot initialize.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    fetch(`${apiUrl}/business/${businessId}/public`)
      .then((res) => {
        if (!res.ok) throw new Error("Business profile not found");
        return res.json();
      })
      .then((data) => {
        setBusiness(data);
        
        // Retrieve visitor token if exists with exception safety
        let savedVisitorToken: string | null = null;
        try {
          savedVisitorToken = sessionStorage.getItem(`visitorToken_${businessId}`);
        } catch (e) {
          console.error("sessionStorage access blocked:", e);
        }

        const proceedWithHistory = (tokenToUse: string) => {
          setVisitorToken(tokenToUse);
          let savedLeadId: string | null = null;
          let savedConvId: string | null = null;
          try {
            savedLeadId = sessionStorage.getItem(`leadId_${businessId}`);
            savedConvId = sessionStorage.getItem(`convId_${businessId}`);
          } catch (e) {
            console.error("sessionStorage access blocked:", e);
          }

          if (savedLeadId && savedConvId) {
            setLeadId(savedLeadId);
            setConversationId(savedConvId);
            setHistoryLoading(true);
            
            fetch(`${apiUrl}/conversations/${savedConvId}`, {
              headers: {
                "Authorization": `Bearer ${tokenToUse}`
              }
            })
              .then((r) => {
                if (!r.ok) throw new Error("Conversation fetch failed");
                return r.json();
              })
              .then((cData) => {
                if (cData && cData.messages) {
                  setMessages(cData.messages);
                }
                if (cData && cData.lead) {
                  setLead(cData.lead);
                }
              })
              .catch(console.error)
              .finally(() => setHistoryLoading(false));
          } else {
            // Add initial welcome message
            setMessages([
              {
                role: "model",
                content: `Hello! Welcome to ${data.companyName}. How can I assist you today?`,
              },
            ]);
          }
        };

        if (savedVisitorToken) {
          proceedWithHistory(savedVisitorToken);
        } else {
          // Request new visitor token
          fetch(`${apiUrl}/auth/visitor-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId })
          })
            .then((r) => {
              if (!r.ok) throw new Error("Visitor token error");
              return r.json();
            })
            .then((vData) => {
              try {
                sessionStorage.setItem(`visitorToken_${businessId}`, vData.token);
              } catch (e) {
                console.error("sessionStorage write error:", e);
              }
              proceedWithHistory(vData.token);
            })
            .catch((err) => {
              console.error("Failed to generate visitor token:", err);
              // Fallback with empty welcome message
              setMessages([
                {
                  role: "model",
                  content: `Hello! Welcome to ${data.companyName}. How can I assist you today?`,
                },
              ]);
            });
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
    
    let referrerPath = "/";
    if (typeof document !== "undefined" && document.referrer) {
      try {
        const url = new URL(document.referrer);
        referrerPath = url.pathname + url.search;
      } catch (e) {
        referrerPath = document.referrer || "/";
      }
    }

    const reportTracking = (tokenToUse: string | null) => {
      // Geolocate user using ipapi.co
      fetch("https://ipapi.co/json/")
        .then((res) => {
          if (!res.ok) throw new Error("Geolocation request failed");
          return res.json();
        })
        .then((data) => {
          const location = data.city && data.country_name 
            ? `${data.city}, ${data.country_name}` 
            : data.city || data.country_name || "Unknown Location";
          
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (tokenToUse) {
            headers["Authorization"] = `Bearer ${tokenToUse}`;
          }
          return fetch(`${apiUrl}/business/${businessId}/track-visitor`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              location: location,
              pagesViewed: [referrerPath],
              duration: 120
            })
          });
        })
        .catch((err) => {
          console.warn("IP Geolocation lookup failed, using fallback:", err);
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (tokenToUse) {
            headers["Authorization"] = `Bearer ${tokenToUse}`;
          }
          fetch(`${apiUrl}/business/${businessId}/track-visitor`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              location: "Local Visitor",
              pagesViewed: [referrerPath],
              duration: 90
            })
          }).catch(console.error);
        });
    };

    if (visitorToken) {
      reportTracking(visitorToken);
    }
  }, [businessId, visitorToken]);

  // Poll conversation history for operator takeover replies
  useEffect(() => {
    if (!conversationId || loading || !visitorToken) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    
    const interval = setInterval(() => {
      fetch(`${apiUrl}/conversations/${conversationId}`, {
        headers: {
          "Authorization": `Bearer ${visitorToken}`
        }
      })
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
  }, [conversationId, loading, visitorToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !businessId) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    // Add user message to history
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Add a placeholder message for the incoming model response
    setMessages((prev) => [...prev, { role: "model", content: "" }]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (visitorToken) {
        headers["Authorization"] = `Bearer ${visitorToken}`;
      }

      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          businessId,
          leadId: leadId || undefined,
          conversationId: conversationId || undefined,
          channel: "WIDGET",
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let modelContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Event source standard: expect "data: <JSON>"
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                modelContent += parsed.text;
                // Update the last message (the bot's message) in messages
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "model",
                    content: modelContent,
                  };
                  return newMsgs;
                });
              }

              if (parsed.metadata) {
                const meta = parsed.metadata;
                // If metadata returned, update state and session storage
                if (meta.leadId) {
                  setLeadId(meta.leadId);
                  try {
                    sessionStorage.setItem(`leadId_${businessId}`, meta.leadId);
                  } catch (e) {
                    console.error("sessionStorage write error:", e);
                  }
                }
                if (meta.conversationId) {
                  setConversationId(meta.conversationId);
                  try {
                    sessionStorage.setItem(`convId_${businessId}`, meta.conversationId);
                  } catch (e) {
                    console.error("sessionStorage write error:", e);
                  }
                }
                if (meta.lead) {
                  setLead(meta.lead);
                }
              }
            } catch (err) {
              console.warn("Error parsing stream chunk JSON:", err, dataStr);
            }
          }
        }
      }

      // Handle any remaining text in the buffer if it was somehow formatted as data: ...
      if (buffer.startsWith("data: ")) {
        const dataStr = buffer.slice(6);
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            modelContent += parsed.text;
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = {
                role: "model",
                content: modelContent,
              };
              return newMsgs;
            });
          }
          if (parsed.metadata) {
            const meta = parsed.metadata;
            if (meta.leadId) {
              setLeadId(meta.leadId);
              try {
                sessionStorage.setItem(`leadId_${businessId}`, meta.leadId);
              } catch (e) {
                console.error("sessionStorage write error:", e);
              }
            }
            if (meta.conversationId) {
              setConversationId(meta.conversationId);
              try {
                sessionStorage.setItem(`convId_${businessId}`, meta.conversationId);
              } catch (e) {
                console.error("sessionStorage write error:", e);
              }
            }
            if (meta.lead) {
              setLead(meta.lead);
            }
          }
        } catch (e) {}
      }

    } catch (err: any) {
      console.error("Streaming error:", err);
      // Remove the last model message (which was empty) or change it to error message
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.role === "model" && lastMsg.content === "") {
          lastMsg.content = "Oops! I encountered an error connecting to our system. Please try again.";
        }
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  const closeWidget = () => {
    window.parent.postMessage("close-logicra-widget", "*");
  };

  if (!mounted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white animate-pulse">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

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

  const themeColor = business.themeColor || "#10B981";

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white font-sans overflow-hidden border border-slate-800/80 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${themeColor}, #0F172A)` }}>
            <Bot className="h-5.5 w-5.5 text-white" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950" style={{ backgroundColor: themeColor }}></span>
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight text-slate-100">{business.companyName}</h2>
            <p className="text-xs font-semibold" style={{ color: themeColor }}>AI Agent Online</p>
          </div>
        </div>
        <button
          onClick={closeWidget}
          aria-label="Close chat assistant"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        role="log" 
        aria-live="polite" 
        aria-label="Chat transcript"
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {historyLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: themeColor }}></div>
            <p className="mt-2 text-xs">Loading chat history...</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border" style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}>
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "text-white rounded-tr-none"
                      : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-tl-none"
                  }`}
                  style={isUser ? { backgroundColor: themeColor } : {}}
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
          })
        )}

        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border" style={{ backgroundColor: `${themeColor}1A`, color: themeColor, borderColor: `${themeColor}33` }}>
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
            <UserCheck className="h-3.5 w-3.5" style={{ color: themeColor }} />
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
            aria-label="Chat message input"
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 disabled:opacity-50 transition-all"
            style={{ "--tw-ring-color": themeColor } as any}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer"
            style={{ backgroundColor: themeColor }}
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
