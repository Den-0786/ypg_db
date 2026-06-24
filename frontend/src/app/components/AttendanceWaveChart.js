"use client";
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

function getMonthsUpToCurrent() {
  const currentMonth = new Date().getMonth();
  return MONTH_NAMES.slice(0, currentMonth + 1);
}

const MOCK_DATA_FULL = [
  { total: 120, communicants: 72, nonCommunicants: 48, male: 58, female: 62 },
  { total: 135, communicants: 80, nonCommunicants: 55, male: 64, female: 71 },
  { total: 118, communicants: 68, nonCommunicants: 50, male: 55, female: 63 },
  { total: 142, communicants: 85, nonCommunicants: 57, male: 70, female: 72 },
  { total: 150, communicants: 90, nonCommunicants: 60, male: 74, female: 76 },
  { total: 138, communicants: 82, nonCommunicants: 56, male: 66, female: 72 },
  { total: 155, communicants: 95, nonCommunicants: 60, male: 78, female: 77 },
  { total: 162, communicants: 100, nonCommunicants: 62, male: 80, female: 82 },
  { total: 145, communicants: 88, nonCommunicants: 57, male: 71, female: 74 },
  { total: 158, communicants: 96, nonCommunicants: 62, male: 77, female: 81 },
  { total: 170, communicants: 104, nonCommunicants: 66, male: 85, female: 85 },
  { total: 180, communicants: 110, nonCommunicants: 70, male: 90, female: 90 },
];

function buildChartData() {
  const months = getMonthsUpToCurrent();
  return months.map((month, i) => ({
    month,
    ...MOCK_DATA_FULL[i],
  }));
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
          <span className="font-semibold text-blue-600">{d?.total}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Communicants</span>
          <span className="font-semibold text-indigo-500">{d?.communicants}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Non-Communicants</span>
          <span className="font-semibold text-purple-500">{d?.nonCommunicants}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Total Male</span>
          <span className="font-semibold text-cyan-600">{d?.male}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Total Female</span>
          <span className="font-semibold text-pink-500">{d?.female}</span>
        </div>
      </div>
    </div>
  );
};

export default function AttendanceWaveChart() {
  const data = buildChartData();

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="fas fa-chart-area text-blue-600 mr-2"></i>
          Attendance Overview
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Monthly attendance breakdown — Jan to {MONTH_NAMES[new Date().getMonth()]}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradNonComm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
            dataKey="communicants"
            name="Communicants"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradComm)"
            dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="nonCommunicants"
            name="Non-Communicants"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#gradNonComm)"
            dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
