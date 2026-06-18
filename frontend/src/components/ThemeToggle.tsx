import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme mode"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/10 dark:bg-slate-900/50 hover:bg-slate-900/20 dark:hover:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/80 text-foreground transition-all cursor-pointer overflow-hidden focus:outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="text-amber-400"
          >
            <Moon size={18} className="fill-amber-400/20" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="text-indigo-600"
          >
            <Sun size={18} className="fill-indigo-600/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
