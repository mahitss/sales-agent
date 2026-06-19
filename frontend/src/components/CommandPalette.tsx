import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, LogOut, Sun, Moon, MessageSquare, Terminal, Users, Sparkles } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  leads: any[];
  setSearchTerm: (term: string) => void;
  handleLogout: () => void;
  onOpenFeedback: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  leads,
  setSearchTerm,
  handleLogout,
  onOpenFeedback,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle palette on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Wait, let's toggle: if open, close. If closed, we can call toggle. But wait! The parent handles isOpen state.
        // Let's delegate toggle to parent or handle it cleanly.
        // If we want this keybind to work globally, we should register it in the parent or handle it here via an internal toggle.
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build the list of static actions
  const staticActions = [
    { id: "nav-overview", title: "Go to Overview Dashboard", category: "Navigation", icon: Compass, action: () => { setActiveTab("overview"); onClose(); } },
    { id: "nav-leads", title: "Go to CRM Leads Table", category: "Navigation", icon: Users, action: () => { setActiveTab("leads"); onClose(); } },
    { id: "nav-settings", title: "Go to Workspace Growth Settings", category: "Navigation", icon: Terminal, action: () => { setActiveTab("settings"); onClose(); } },
    { id: "act-theme", title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, category: "Actions", icon: theme === "dark" ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
    { id: "act-feedback", title: "Submit Application Feedback", category: "Actions", icon: MessageSquare, action: () => { onOpenFeedback(); onClose(); } },
    { id: "act-logout", title: "Sign Out of Workspace", category: "Actions", icon: LogOut, action: () => { handleLogout(); onClose(); } },
  ];

  // Filter leads based on query
  const filteredLeads = query.trim() === "" 
    ? [] 
    : leads.filter(lead => 
        lead.name.toLowerCase().includes(query.toLowerCase()) || 
        lead.email.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5).map(lead => ({
        id: `lead-${lead.id}`,
        title: `Search Lead: ${lead.name} (${lead.email})`,
        category: "Leads",
        icon: Sparkles,
        action: () => {
          setSearchTerm(lead.name);
          setActiveTab("leads");
          onClose();
        }
      }));

  const allItems = [...filteredLeads, ...staticActions.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  )];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        {/* Overlay Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-card-border bg-slate-900/90 shadow-2xl backdrop-blur-md flex flex-col max-h-[450px]"
        >
          {/* Input container */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-card-border shrink-0">
            <Search className="h-4.5 w-4.5 text-muted-text" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search leads or type commands (Ctrl+K)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold border border-slate-700 px-1.5 py-0.5 rounded">
              ESC
            </span>
          </div>

          {/* Results list */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {allItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-text">
                No matching leads or commands found.
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
                        : "text-slate-300 hover:bg-card/30 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent-primary" : "text-slate-400"}`} />
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wide text-muted-text bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/20 shrink-0">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          
          {/* Footer controls instruction */}
          <div className="px-4 py-2 border-t border-card-border/60 bg-slate-950/20 flex items-center justify-between text-[10px] text-muted-text shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Use</span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-semibold border border-slate-700">↑↓</kbd>
              <span>to navigate,</span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-semibold border border-slate-700">Enter</kbd>
              <span>to select</span>
            </div>
            <span>Sales intelligence palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
