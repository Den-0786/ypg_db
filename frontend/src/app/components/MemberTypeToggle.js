"use client";

import React from "react";

export default function MemberTypeToggle({ value, onChange }) {
  return (
    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1 shadow-sm">
      {["existing", "new"].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === type
              ? type === "new"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-blue-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {type === "existing" ? "Existing" : "New"}
        </button>
      ))}
    </div>
  );
}
