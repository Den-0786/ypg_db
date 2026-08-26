"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatMonth(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
}

function aggregateByMonth(members) {
  const months = {};
  members.forEach((m) => {
    const ts = m.timestamp || m.created_at || "";
    if (!ts) return;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) {
      months[key] = { month: key, newCount: 0, existingCount: 0, totalCount: 0 };
    }
    months[key].totalCount++;
    if (m.member_type === "new") months[key].newCount++;
    else months[key].existingCount++;
  });
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {formatMonth(label)}
      </p>
      <p className="text-emerald-600 dark:text-emerald-400">
        New Members: <span className="font-bold">{data?.newCount ?? 0}</span>
      </p>
      <p className="text-blue-600 dark:text-blue-400">
        Existing Members:{" "}
        <span className="font-bold">{data?.existingCount ?? 0}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Total: <span className="font-bold">{data?.totalCount ?? 0}</span>
      </p>
    </div>
  );
}

export default function NewMemberStreamGraph({ members = [] }) {
  const chartData = useMemo(() => aggregateByMonth(members), [members]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        No member data available for stream graph
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="gradExisting" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="existingCount"
            stackId="1"
            stroke="#3B82F6"
            fill="url(#gradExisting)"
            name="Existing"
          />
          <Area
            type="monotone"
            dataKey="newCount"
            stackId="1"
            stroke="#10B981"
            fill="url(#gradNew)"
            name="New"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
