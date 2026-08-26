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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(key) {
  if (!key) return "";
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

function buildMonthlyData(members) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const months = {};
  for (let i = 0; i <= currentMonth; i++) {
    const key = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    months[key] = { month: key, male: 0, female: 0, total: 0 };
  }

  members.forEach((m) => {
    if (m.member_type !== "new") return;
    const ts = m.timestamp || m.created_at || "";
    if (!ts) return;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) {
      months[key] = { month: key, male: 0, female: 0, total: 0 };
    }
    months[key].total++;
    if (m.gender === "Male") months[key].male++;
    else months[key].female++;
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
      <p className="text-blue-600 dark:text-blue-400">
        Male: <span className="font-bold">{data?.male ?? 0}</span>
      </p>
      <p className="text-pink-600 dark:text-pink-400">
        Female: <span className="font-bold">{data?.female ?? 0}</span>
      </p>
      <p className="text-emerald-600 dark:text-emerald-400 mt-1">
        Total New: <span className="font-bold">{data?.total ?? 0}</span>
      </p>
    </div>
  );
}

export default function NewMemberStreamGraph({ members = [] }) {
  const chartData = useMemo(() => buildMonthlyData(members), [members]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        No new member data available for stream graph
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="gradFemale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1} />
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
            dataKey="male"
            stackId="1"
            stroke="#3B82F6"
            fill="url(#gradMale)"
            name="Male"
          />
          <Area
            type="monotone"
            dataKey="female"
            stackId="1"
            stroke="#EC4899"
            fill="url(#gradFemale)"
            name="Female"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
