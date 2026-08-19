"use client";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const name = MONTH_NAMES[parseInt(month, 10) - 1];
  return `${name} ${year}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-800 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Total Attendance</span>
          <span className="font-semibold text-blue-500">{d?.total}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Male</span>
          <span className="font-semibold text-cyan-600">{d?.male}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Female</span>
          <span className="font-semibold text-pink-500">{d?.female}</span>
        </div>
      </div>
    </div>
  );
};

export default function AttendanceWaveChart({ congregationId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
        let url = `${base}/api/analytics/attendance-trends/?months=12`;
        if (congregationId) {
          url += `&congregation=${congregationId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.labels && json.labels.length > 0) {
            const apiData = {};
            json.labels.forEach((label, i) => {
              apiData[label] = {
                total: json.data[i] || 0,
                male: json.male_data[i] || 0,
                female: json.female_data[i] || 0,
              };
            });

            const firstKey = json.labels[0];
            const now = new Date();
            const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

            const [startYear, startMonth] = firstKey.split("-").map(Number);
            let y = startYear;
            let m = startMonth;
            const filled = [];

            while (true) {
              const key = `${y}-${String(m).padStart(2, "0")}`;
              if (key > currentKey) break;
              filled.push({
                month: formatMonthLabel(key),
                total: apiData[key]?.total ?? 0,
                male: apiData[key]?.male ?? 0,
                female: apiData[key]?.female ?? 0,
              });
              m++;
              if (m > 12) { m = 1; y++; }
            }

            setData(filled);
          }
        }
      } catch (err) {
        console.error("Failed to load attendance trends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [congregationId]);

  const currentMonth = MONTH_NAMES[new Date().getMonth()];
  const firstLabel = data.length > 0 ? data[0].month : "";
  const lastLabel = data.length > 0 ? data[data.length - 1].month : currentMonth;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="fas fa-chart-area text-blue-500 mr-2"></i>
          Attendance Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Monthly attendance — {firstLabel || "Loading..."} to {lastLabel || "..."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[280px] text-gray-400">
          <i className="fas fa-spinner fa-spin mr-2"></i> Loading chart data...
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
          No attendance data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            />

            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradTotal)"
              dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="male"
              name="Male"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#gradMale)"
              dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="female"
              name="Female"
              stroke="#ec4899"
              strokeWidth={2}
              fill="url(#gradFemale)"
              dot={{ r: 3, fill: "#ec4899", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
