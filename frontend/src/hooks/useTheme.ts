import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("beacon_theme") as Theme | null;
      if (stored) return stored;
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return systemDark ? "dark" : "light";
    }
    return "dark";
  });

  const applyTheme = useCallback((targetTheme: Theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (targetTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("beacon_theme", nextTheme);
    }
  };

  return { theme, toggleTheme };
}
