"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Compass,
  LogOut,
  Sun,
  Moon,
  MessageSquare,
  Terminal,
  Users,
  Sparkles,
  Calendar,
  Zap,
  Globe,
  Trash2,
  Clock,
  Briefcase
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setSearchTerm: (term: string) => void;
  handleLogout: () => void;
  onOpenFeedback: () => void;
  token: string;
  businessId: string;
  API_URL: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  setSearchTerm,
  handleLogout,
  onOpenFeedback,
  token,
  businessId,
  API_URL,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search Results
  const [results, setResults] = useState<{
    leads: any[];
    companies: any[];
    conversations: any[];
    users: any[];
    appointments: any[];
    workflows: any[];
  }>({
    leads: [],
    companies: [],
    conversations: [],
    users: [],
    appointments: [],
    workflows: [],
  });

  // History & Recent States
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load history & recent items from LocalStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      try {
        const history = localStorage.getItem("beacon_search_history");
        setSearchHistory(history ? JSON.parse(history) : []);

        const recents = localStorage.getItem("beacon_recent_items");
        setRecentItems(recents ? JSON.parse(recents) : []);
      } catch (err) {
        console.error("Failed to parse search history/recents", err);
      }
    }
  }, [isOpen]);

  // Handle Ctrl+K/Cmd+K window listener (in case of double hooks)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setResults({
        leads: [],
        companies: [],
        conversations: [],
        users: [],
        appointments: [],
        workflows: [],
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounce query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results from backend when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2 || !businessId || !token) {
      setResults({
        leads: [],
        companies: [],
        conversations: [],
        users: [],
        appointments: [],
        workflows: [],
      });
      setSearching(false);
      return;
    }

    const performSearch = async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_URL}/search?businessId=${businessId}&q=${encodeURIComponent(debouncedQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Global search fetch failed", err);
      } finally {
        setSearching(false);
        setSelectedIndex(0);
      }
    };

    performSearch();
  }, [debouncedQuery, businessId, token, API_URL]);

  if (!isOpen) return null;

  // Add a query to search history
  const addToHistory = (q: string) => {
    if (!q || q.trim() === "") return;
    const clean = q.trim();
    const updated = [clean, ...searchHistory.filter((item) => item !== clean)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem("beacon_search_history", JSON.stringify(updated));
  };

  // Add an item to recent items
  const addToRecents = (item: { id: string; type: string; title: string; subtitle: string; tab: string; searchVal?: string }) => {
    const updated = [item, ...recentItems.filter((r) => r.id !== item.id)].slice(0, 5);
    setRecentItems(updated);
    localStorage.setItem("beacon_recent_items", JSON.stringify(updated));
  };

  // Clear history functions
  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem("beacon_search_history");
  };

  const clearRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentItems([]);
    localStorage.removeItem("beacon_recent_items");
  };

  // Build commands / static actions list
  const staticActions = [
    { id: "nav-overview", title: "Go to Overview Dashboard", category: "Navigation", icon: Compass, action: () => { setActiveTab("overview"); onClose(); } },
    { id: "nav-leads", title: "Go to CRM Leads Table", category: "Navigation", icon: Users, action: () => { setActiveTab("leads"); onClose(); } },
    { id: "nav-scoring", title: "Go to AI Lead Scoring Tab", category: "Navigation", icon: Sparkles, action: () => { setActiveTab("scoring"); onClose(); } },
    { id: "nav-settings", title: "Go to Growth Settings", category: "Navigation", icon: Terminal, action: () => { setActiveTab("settings"); onClose(); } },
    { id: "act-theme", title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, category: "Actions", icon: theme === "dark" ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
    { id: "act-feedback", title: "Submit App Feedback", category: "Actions", icon: MessageSquare, action: () => { onOpenFeedback(); onClose(); } },
    { id: "act-logout", title: "Sign Out", category: "Actions", icon: LogOut, action: () => { handleLogout(); onClose(); } },
  ];

  // Map API search results to actionable command items
  const leadItems = results.leads.map((l) => ({
    id: `lead-${l.id}`,
    title: `${l.name} (${l.email || "No email"})`,
    category: "Leads",
    icon: Users,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `lead-${l.id}`, type: "Lead", title: l.name, subtitle: l.email || "Lead Profile", tab: "leads", searchVal: l.name });
      setSearchTerm(l.name);
      setActiveTab("leads");
      onClose();
    },
  }));

  const companyItems = results.companies.map((c) => ({
    id: `company-${c.id}`,
    title: c.companyName + (c.industry ? ` - ${c.industry}` : ""),
    category: "Companies",
    icon: Briefcase,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `company-${c.id}`, type: "Company", title: c.companyName, subtitle: c.website || "Company Enrichment", tab: "leads", searchVal: c.companyName });
      setSearchTerm(c.companyName);
      setActiveTab("leads");
      onClose();
    },
  }));

  const convItems = results.conversations.map((c) => ({
    id: `conv-${c.id}`,
    title: `Chat with ${c.leadName} (${c.channel})`,
    category: "Conversations",
    icon: MessageSquare,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `conv-${c.id}`, type: "Conversation", title: `Chat with ${c.leadName}`, subtitle: c.channel, tab: "conversations" });
      setActiveTab("conversations");
      onClose();
    },
  }));

  const userItems = results.users.map((u) => ({
    id: `user-${u.id}`,
    title: `${u.name} - ${u.role}`,
    category: "Users",
    icon: Users,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `user-${u.id}`, type: "User", title: u.name, subtitle: u.email, tab: "team" });
      setActiveTab("team");
      onClose();
    },
  }));

  const apptItems = results.appointments.map((a) => ({
    id: `appt-${a.id}`,
    title: `Appointment with ${a.lead?.name || "Client"} - ${a.date} at ${a.time}`,
    category: "Appointments",
    icon: Calendar,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `appt-${a.id}`, type: "Appointment", title: `Meeting with ${a.lead?.name || "Client"}`, subtitle: `${a.date} (${a.status})`, tab: "appointments" });
      setActiveTab("appointments");
      onClose();
    },
  }));

  const workflowItems = results.workflows.map((w) => ({
    id: `workflow-${w.id}`,
    title: `Workflow: ${w.workflow?.name} (${w.status})`,
    category: "Workflow runs",
    icon: Zap,
    action: () => {
      addToHistory(query);
      addToRecents({ id: `workflow-${w.id}`, type: "Workflow Run", title: w.workflow?.name || "Execution", subtitle: `Status: ${w.status}`, tab: "automations" });
      setActiveTab("automations");
      onClose();
    },
  }));

  // Filter commands by query
  const matchingCommands = staticActions.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Compile final items list to display
  let allItems: any[] = [];
  const hasSearchQuery = query.trim().length >= 2;

  if (hasSearchQuery) {
    allItems = [
      ...leadItems,
      ...companyItems,
      ...convItems,
      ...userItems,
      ...apptItems,
      ...workflowItems,
      ...matchingCommands,
    ];
  } else {
    // Show commands by default + history + recents
    allItems = matchingCommands;
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        />

        {/* Command Panel box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -6 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-card-border bg-slate-900/95 shadow-2xl backdrop-blur-md flex flex-col max-h-[500px]"
        >
          {/* Header search bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-card-border/60 shrink-0 bg-slate-950/15">
            <Search className="h-4.5 w-4.5 text-muted-text" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search leads, companies, history, or workflow runs..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {searching && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-primary shrink-0" />
            )}
            <span className="text-[9px] bg-slate-800 text-slate-400 font-bold border border-slate-700/60 px-1.5 py-0.5 rounded shadow-sm">
              ESC
            </span>
          </div>

          {/* Body content */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-2 space-y-0.5 divide-y divide-card-border/20"
          >
            {/* Empty Input state: Display History & Recent Items */}
            {!hasSearchQuery && (
              <div className="space-y-4 p-2 pb-4 shrink-0">
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-text font-black uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearHistory}
                        className="hover:text-red-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-0.5">
                      {searchHistory.map((h) => (
                        <button
                          key={h}
                          onClick={() => {
                            setQuery(h);
                            inputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700/60 text-slate-300 font-medium transition-all cursor-pointer border border-card-border/40"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Visited Items */}
                {recentItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-text font-black uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        Recent Items
                      </span>
                      <button
                        onClick={clearRecents}
                        className="hover:text-red-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {recentItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.searchVal) setSearchTerm(item.searchVal);
                            setActiveTab(item.tab);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left border border-card-border/30 hover:border-card-border transition-all cursor-pointer"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                            <p className="text-[9px] text-muted-text truncate">{item.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results Grid Table */}
            <div className="space-y-0.5 pt-1.5">
              {allItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-text flex flex-col items-center justify-center gap-2">
                  <Globe className="h-8 w-8 text-slate-700 animate-pulse" />
                  <span>No matching entries or commands discovered.</span>
                </div>
              ) : (
                allItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                          : "text-slate-300 hover:bg-slate-850 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? "text-accent-primary" : "text-slate-400"
                          }`}
                        />
                        <span className="text-xs font-semibold truncate">{item.title}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-text bg-slate-850 px-2 py-0.5 rounded border border-card-border/40 shrink-0">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer instruction guidelines */}
          <div className="px-4 py-2 border-t border-card-border/60 bg-slate-950/20 flex items-center justify-between text-[10px] text-muted-text shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Use</span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-semibold border border-slate-700/60">
                ↑↓
              </kbd>
              <span>to navigate,</span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-semibold border border-slate-700/60">
                Enter
              </kbd>
              <span>to select</span>
            </div>
            <span>Global search index palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Simple spin icon declaration helper
const RefreshCw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
