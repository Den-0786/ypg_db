"use client";
import { useState } from "react";

export default function ExportAnalyticsButton({
  filtered,
  label = "Export Analytics Report",
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
      const response = await fetch(`${base}/api/analytics/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${format}-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast(
            "Failed to export analytics. Please try again.",
            "error"
          );
        }
      }
    } catch (error) {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          "Failed to export analytics. Please try again.",
          "error"
        );
      }
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-800 focus:bg-orange-100 dark:focus:bg-orange-600 transition rounded-t-lg ${className}`}
      aria-label={label}
      disabled={loading}
    >
      <i className="fas fa-download"></i> {loading ? "Exporting..." : label}
    </button>
  );
}
