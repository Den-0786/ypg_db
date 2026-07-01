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

const CustomTooltip = ({ active, payload, label, labelKey, colorScheme }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  const { accent } = colorScheme;
  const prevDiff = d?.__diff;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 text-sm min-w-[170px]">
      <p className="font-semibold text-gray-800 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <span className="font-semibold" style={{ color: accent }}>{d?.total ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Male</span>
          <span className="font-semibold text-orange-500">{d?.male ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Female</span>
          <span className="font-semibold text-pink-500">{d?.female ?? 0}</span>
        </div>
        {prevDiff !== undefined && prevDiff !== 0 && (
          <div className={`text-xs font-medium pt-1 border-t border-gray-100 dark:border-gray-700 mt-1 ${prevDiff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {prevDiff > 0 ? "+" : ""}{prevDiff} from previous
          </div>
        )}
      </div>
    </div>
  );
};

export default function TrendLineChart({ data, labelKey, colorScheme, title, subtitle }) {
  const colors = colorScheme || { accent: "#f97316", gradientId: "gradTrend", gradientColor: "#f97316" };

  const enrichedData = data.map((item, i) => ({
    ...item,
    __diff: i > 0 ? (item.total || 0) - (data[i - 1]?.total || 0) : undefined,
  }));

  const maxVal = Math.max(...data.map((d) => d.total || 0), 1);

  return (
    <div
      className="p-4 md:p-6 h-[20rem] md:h-[30rem] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full"
      style={{ boxShadow: `0 0 20px ${colors.accent}33` }}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-white text-lg font-semibold">{title}</h4>
          <p className="text-gray-300 text-sm">{subtitle}</p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg"
          style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
        >
          <i className="fas fa-chart-line text-white text-sm"></i>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={enrichedData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.gradientColor} stopOpacity={0.22} />
              <stop offset="95%" stopColor={colors.gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey={labelKey}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={38}
            domain={[0, Math.ceil(maxVal * 1.1)]}
          />
          <Tooltip
            content={<CustomTooltip labelKey={labelKey} colorScheme={colors} />}
            cursor={{ stroke: colors.accent, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px", color: "#9ca3af" }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Total"
            stroke={colors.accent}
            strokeWidth={2.5}
            fill={`url(#${colors.gradientId})`}
            dot={{ r: 3, fill: colors.accent, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="male"
            name="Male"
            stroke="#3b82f6"
            strokeWidth={1.8}
            fill="none"
            dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="female"
            name="Female"
            stroke="#ec4899"
            strokeWidth={1.8}
            fill="none"
            dot={{ r: 2.5, fill: "#ec4899", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
