"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 bg-gray-200 dark:bg-gray-800 rounded-full p-1 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Toggle theme"
    >
      {/* Toggle Track */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-inner">
        {/* Toggle Handle */}
        <div
          className={`absolute top-0.5 w-6 h-6 bg-white dark:bg-gray-600 rounded-full shadow-lg transition-all duration-300 transform ${
            isDark ? "translate-x-8" : "translate-x-0"
          }`}
        >
          {/* Moon Icon for Dark Mode */}
          {isDark && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg animate-pulse" />
            </div>
          )}

          {/* Sun Icon for Light Mode */}
          {!isDark && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg" />
            </div>
          )}
        </div>

        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-r from-cyan-400/20 to-blue-500/20 shadow-lg shadow-cyan-400/30"
              : "bg-gradient-to-r from-yellow-400/20 to-blue-500/20 shadow-lg shadow-yellow-400/30"
          }`}
        />
      </div>
    </button>
  );
}
