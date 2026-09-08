"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // White-only theme: the app always stays light. Dark mode is disabled so a
  // theme change in one congregation can no longer affect others.
  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [mounted]);

  const value = {
    theme: "light",
    setTheme: () => setTheme("light"),
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values instead of throwing error to prevent invariant issues

    return {
      theme: "light",
      setTheme: () => {},
      mounted: false,
    };
  }
  return context;
}
