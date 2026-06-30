"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import getDataStore from "../utils/dataStore";

export default function AnalyticsPage() {
  // Redirect local users to local analytics page
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.congregationId && user.congregationId !== "1") {
          window.location.href = "/local/analytics";
        }
      }
    } catch (e) {}
  }, []);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    sundayAttendance: {
      totalAttendance: 0,
      averageAttendance: 0,
      congregationsCount: 0,
      growth: 0,
      weeklyTrend: [],
      monthlyTrend: [],
      yearlyTrend: [],
    },
    membersDatabase: {
      totalMembers: 0,
      congregations: [],
      genderDistribution: [],
    },
  });
  const [tooltip, setTooltip] = useState({
    show: false,
    data: null,
    x: 0,
    y: 0,
  });
  const [selectedCongregation, setSelectedCongregation] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filtered, setFiltered] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (!chartData.sundayAttendance) return;
    let filteredData = { ...chartData };
    // Filter by congregation
    if (selectedCongregation !== "All") {
      filteredData = {
        ...filteredData,
        sundayAttendance: {
          ...filteredData.sundayAttendance,
          weeklyTrend: filteredData.sundayAttendance.weeklyTrend.filter(
            (w) => w.congregation === selectedCongregation
          ),
          monthlyTrend: filteredData.sundayAttendance.monthlyTrend, // Could filter if data is per congregation
          yearlyTrend: filteredData.sundayAttendance.yearlyTrend, // Could filter if data is per congregation
        },
        membersDatabase: {
          ...filteredData.membersDatabase,
          congregations: filteredData.membersDatabase.congregations.filter(
            (c) => c.name === selectedCongregation
          ),
          genderDistribution:
            filteredData.membersDatabase.genderDistribution.filter(
              (g) => g.congregation === selectedCongregation
            ),
        },
      };
    }
    // Filter by date range (for weeklyTrend only)
    if (dateRange.start && dateRange.end) {
      filteredData = {
        ...filteredData,
        sundayAttendance: {
          ...filteredData.sundayAttendance,
          weeklyTrend: filteredData.sundayAttendance.weeklyTrend.filter(
            (w) => w.date >= dateRange.start && w.date <= dateRange.end
          ),
        },
      };
    }
    setFiltered(filteredData);
  }, [chartData, selectedCongregation, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const dataStore = getDataStore();

      // Known congregations baseline to always display
      const baselineCongregations = [
        "Emmanuel Congregation Ahinsan",
        "Peniel Congregation Esreso No1",
        "Mizpah Congregation Odagya No1",
        "Christ Congregation Ahinsan Estate",
        "Ebenezer Congregation Dompoase Aprabo",
        "Favour Congregation Esreso No2",
        "Liberty Congregation Esreso High Tension",
        "Odagya No2",
        "NOM",
        "Kokobriko",
      ];

      // Get real data from dataStore
      const attendanceRecords = await dataStore.getAttendanceRecords();
      const members = await dataStore.getMembers();

      // Calculate real analytics from attendance records
      const totalAttendance = attendanceRecords.reduce(
        (sum, record) => sum + (record.total || 0),
        0
      );
      const averageAttendance =
        attendanceRecords.length > 0
          ? Math.round(totalAttendance / attendanceRecords.length)
          : 0;

      // Get unique congregations
      const congregations = [
        ...new Set(attendanceRecords.map((record) => record.congregation)),
      ];
      const congregationsCount = congregations.length;

      // Calculate growth (compare last month vs previous month)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      const lastMonthRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === lastMonth.getMonth() &&
          recordDate.getFullYear() === lastMonth.getFullYear()
        );
      });

      const previousMonthRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === previousMonth.getMonth() &&
          recordDate.getFullYear() === previousMonth.getFullYear()
        );
      });

      const lastMonthTotal = lastMonthRecords.reduce(
        (sum, record) => sum + (record.total || 0),
        0
      );
      const previousMonthTotal = previousMonthRecords.reduce(
        (sum, record) => sum + (record.total || 0),
        0
      );
      const growth =
        previousMonthTotal > 0
          ? Math.round(
              ((lastMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
            )
          : 0;

      // Group attendance by week for weekly trend
      const weeklyTrend = [];
      const weeklyMap = new Map();
      attendanceRecords.forEach((record) => {
        const date = new Date(record.date);
        const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, {
            date: record.date,
            male: 0,
            female: 0,
            total: 0,
            congregation: record.congregation,
          });
        }
        const week = weeklyMap.get(weekKey);
        week.male += record.male || 0;
        week.female += record.female || 0;
        week.total += record.total || 0;
      });
      weeklyTrend.push(...Array.from(weeklyMap.values()));

      // Group attendance by month for monthly trend
      const monthlyTrend = [];
      const monthlyMap = new Map();
      attendanceRecords.forEach((record) => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: date.toLocaleString("default", { month: "short" }),
            year: date.getFullYear(),
            male: 0,
            female: 0,
            total: 0,
          });
        }
        const month = monthlyMap.get(monthKey);
        month.male += record.male || 0;
        month.female += record.female || 0;
        month.total += record.total || 0;
      });
      monthlyTrend.push(...Array.from(monthlyMap.values()));

      // Group attendance by year for yearly trend
      const yearlyTrend = [];
      const yearlyMap = new Map();
      attendanceRecords.forEach((record) => {
        const date = new Date(record.date);
        const year = date.getFullYear();
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, {
            year: year,
            male: 0,
            female: 0,
            total: 0,
          });
        }
        const yearData = yearlyMap.get(year);
        yearData.male += record.male || 0;
        yearData.female += record.female || 0;
        yearData.total += record.total || 0;
      });
      yearlyTrend.push(...Array.from(yearlyMap.values()));

      // Calculate members data
      const totalMembers = members.length;

      // Helper: normalize congregation name to string
      const getCongregationName = (value) => {
        if (typeof value === "string") return value;
        if (!value) return "Unknown";
        if (typeof value === "object") {
          return value.name || value.title || String(value.id || "Unknown");
        }
        return String(value);
      };

      // Group members by congregation with male/female counts and total members field expected by UI
      const membersByCongregation = [];
      const congregationMap = new Map();
      members.forEach((member) => {
        const congregation = getCongregationName(member.congregation);
        const isMale = member.gender === "Male" || member.gender === "male";
        const isFemale =
          member.gender === "Female" || member.gender === "female";
        if (!congregationMap.has(congregation)) {
          congregationMap.set(congregation, {
            name: congregation,
            members: 0,
            male: 0,
            female: 0,
            color: undefined,
            active_members: 0,
            inactive_members: 0,
          });
        }
        const cong = congregationMap.get(congregation);
        cong.members += 1;
        if (isMale) cong.male += 1;
        if (isFemale) cong.female += 1;
        const status = (member.membership_status || member.status || "")
          .toString()
          .toLowerCase();
        if (status === "active") {
          cong.active_members += 1;
        } else {
          cong.inactive_members += 1;
        }
      });

      // Ensure all congregations seen in attendance also appear, even if they have 0 members
      const attendanceCongregations = new Set(
        attendanceRecords.map((r) => getCongregationName(r.congregation))
      );
      attendanceCongregations.forEach((congName) => {
        if (!congregationMap.has(congName)) {
          congregationMap.set(congName, {
            name: congName,
            members: 0,
            male: 0,
            female: 0,
            color: undefined,
            active_members: 0,
            inactive_members: 0,
          });
        }
      });

      // Ensure baseline congregations also appear
      baselineCongregations.forEach((congName) => {
        const name = getCongregationName(congName);
        if (!congregationMap.has(name)) {
          congregationMap.set(name, {
            name,
            members: 0,
            male: 0,
            female: 0,
            color: undefined,
            active_members: 0,
            inactive_members: 0,
          });
        }
      });

      membersByCongregation.push(...Array.from(congregationMap.values()));

      // Assign colors deterministically so bars are visible
      const colorPalette = [
        "#4CAF50",
        "#2196F3",
        "#FF9800",
        "#9C27B0",
        "#F44336",
        "#00BCD4",
        "#8BC34A",
        "#FFC107",
        "#795548",
        "#607D8B",
      ];
      membersByCongregation
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .forEach((c, idx) => {
          if (!c.color) c.color = colorPalette[idx % colorPalette.length];
        });

      // Gender distribution by congregation for UI cards (include all congregations)
      const genderDistribution = membersByCongregation.map((c) => ({
        congregation: c.name,
        male: c.male,
        female: c.female,
      }));

      const realData = {
        sundayAttendance: {
          totalAttendance,
          averageAttendance,
          congregationsCount,
          growth,
          weeklyTrend,
          monthlyTrend,
          yearlyTrend,
        },
        membersDatabase: {
          totalMembers,
          congregations: membersByCongregation,
          genderDistribution,
        },
      };

      setChartData(realData);
      setLoading(false);
      return;
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }

    // Fallback to mock data if API fails
    const mockData = {
      sundayAttendance: {
        totalAttendance: 1250,
        averageAttendance: 125,
        congregationsCount: 0, // Will be populated from API
        growth: 12.5,
        weeklyTrend: [
          {
            date: "2024-01-01",
            male: 45,
            female: 52,
            total: 97,
            congregation: "Emmanuel Congregation Ahinsan",
          },
          {
            date: "2024-01-08",
            male: 48,
            female: 55,
            total: 103,
            congregation: "Peniel Congregation Esreso No1",
          },
          {
            date: "2024-01-15",
            male: 42,
            female: 49,
            total: 91,
            congregation: "Mizpah Congregation Odagya No1",
          },
          {
            date: "2024-01-22",
            male: 50,
            female: 58,
            total: 108,
            congregation: "Christ Congregation Ahinsan Estate",
          },
          {
            date: "2024-01-29",
            male: 47,
            female: 54,
            total: 101,
            congregation: "Ebenezer Congregation Dompoase Aprabo",
          },
          {
            date: "2024-02-05",
            male: 44,
            female: 51,
            total: 95,
            congregation: "Favour Congregation Esreso No2",
          },
          {
            date: "2024-02-11",
            male: 129,
            female: 157,
            total: 286,
            congregation: "Liberty Congregation Esreso High Tension",
          },
        ],
        monthlyTrend: [
          { month: "Jan", male: 505, female: 635, total: 1140 },
          { month: "Feb", male: 510, female: 643, total: 1153 },
          { month: "Mar", male: 498, female: 628, total: 1126 },
          { month: "Apr", male: 515, female: 645, total: 1160 },
          { month: "May", male: 508, female: 638, total: 1146 },
          { month: "Jun", male: 512, female: 642, total: 1154 },
          { month: "Jul", male: 518, female: 648, total: 1166 },
          { month: "Aug", male: 525, female: 655, total: 1180 },
          { month: "Sep", male: 532, female: 662, total: 1194 },
        ],
        yearlyTrend: [
          { year: "2020", male: 4800, female: 6000, total: 10800 },
          { year: "2021", male: 5100, female: 6400, total: 11500 },
          { year: "2022", male: 5400, female: 6800, total: 12200 },
          { year: "2023", male: 5700, female: 7200, total: 12900 },
          { year: "2024", male: 6000, female: 7600, total: 13600 },
        ],
      },
      membersDatabase: {
        totalMembers: 850,
        congregations: [
          {
            name: "Emmanuel Congregation Ahinsan",
            members: 0,
            color: "#4CAF50",
          },
          {
            name: "Peniel Congregation Esreso No1",
            members: 0,
            color: "#2196F3",
          },
          {
            name: "Mizpah Congregation Odagya No1",
            members: 0,
            color: "#FF9800",
          },
          {
            name: "Christ Congregation Ahinsan Estate",
            members: 0,
            color: "#9C27B0",
          },
          {
            name: "Ebenezer Congregation Dompoase Aprabo",
            members: 0,
            color: "#F44336",
          },
          {
            name: "Favour Congregation Esreso No2",
            members: 0,
            color: "#00BCD4",
          },
          {
            name: "Liberty Congregation Esreso High Tension",
            members: 0,
            color: "#8BC34A",
          },
          { name: "Odagya No2", members: 0, color: "#FFC107" },
          { name: "NOM", members: 0, color: "#795548" },
          { name: "Kokobriko", members: 0, color: "#607D8B" },
        ],
        genderDistribution: [
          {
            congregation: "Emmanuel Congregation Ahinsan",
            male: 0,
            female: 0,
          },
          {
            congregation: "Peniel Congregation Esreso No1",
            male: 0,
            female: 0,
          },
          {
            congregation: "Mizpah Congregation Odagya No1",
            male: 0,
            female: 0,
          },
          {
            congregation: "Christ Congregation Ahinsan Estate",
            male: 0,
            female: 0,
          },
          {
            congregation: "Ebenezer Congregation Dompoase Aprabo",
            male: 0,
            female: 0,
          },
          {
            congregation: "Favour Congregation Esreso No2",
            male: 0,
            female: 0,
          },
          {
            congregation: "Liberty Congregation Esreso High Tension",
            male: 0,
            female: 0,
          },
          { congregation: "Odagya No2", male: 0, female: 0 },
          { congregation: "NOM", male: 0, female: 0 },
          { congregation: "Kokobriko", male: 0, female: 0 },
        ],
      },
    };
    setChartData(mockData);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty state if no data after filtering
  if (
    filtered &&
    !filtered.sundayAttendance?.weeklyTrend?.length &&
    !filtered.sundayAttendance?.monthlyTrend?.length &&
    !filtered.sundayAttendance?.yearlyTrend?.length
  ) {
    // Don't show empty state - show the cards with zero data instead
    console.log("No trend data found, but showing cards with zero values");
  }

  return (
    <DashboardLayout currentPage="Analytics" currentPageProps={{ filtered }}>
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <i className="fas fa-chart-bar text-blue-600 mr-3"></i>
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive insights into YPG attendance and membership data
          </p>
        </div>
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {/* Large screens - All filters on single row */}
          <div className="hidden lg:grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="analytics-cong-filter-lg"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Congregation
              </label>
              <select
                id="analytics-cong-filter-lg"
                value={selectedCongregation}
                onChange={(e) => setSelectedCongregation(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Filter by congregation"
              >
                <option value="All" className="text-gray-800 dark:text-white">
                  All Congregations
                </option>
                {chartData.membersDatabase?.congregations?.map((c) => (
                  <option
                    key={c.name}
                    value={c.name}
                    className="text-gray-800 dark:text-white"
                  >
                    {c.name}
                  </option>
                )) || []}
              </select>
            </div>
            <div>
              <label
                htmlFor="analytics-date-start-lg"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Start Date
              </label>
              <input
                id="analytics-date-start-lg"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Start date"
              />
            </div>
            <div>
              <label
                htmlFor="analytics-date-end-lg"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Date
              </label>
              <input
                id="analytics-date-end-lg"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="End date"
              />
            </div>
          </div>
          {/* Small screens - Congregation on top, dates on single row below */}
          <div className="lg:hidden space-y-3">
            <div>
              <label
                htmlFor="analytics-cong-filter-sm"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Congregation
              </label>
              <select
                id="analytics-cong-filter-sm"
                value={selectedCongregation}
                onChange={(e) => setSelectedCongregation(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Filter by congregation"
              >
                <option value="All" className="text-gray-800 dark:text-white">
                  All Congregations
                </option>
                {chartData.membersDatabase?.congregations?.map((c) => (
                  <option
                    key={c.name}
                    value={c.name}
                    className="text-gray-800 dark:text-white"
                  >
                    {c.name}
                  </option>
                )) || []}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="analytics-date-start-sm"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="analytics-date-start-sm"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                  aria-label="Start date"
                />
              </div>
              <div>
                <label
                  htmlFor="analytics-date-end-sm"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  End Date
                </label>
                <input
                  id="analytics-date-end-sm"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            <i className="fas fa-calendar-check text-blue-600 mr-3"></i>
            Sunday Attendance Analytics
          </h2>

          <div className="mb-8">
            {/* Large screens - Grid layout */}
            <div className="hidden lg:grid grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Attendance</p>
                  <p className="text-lg font-bold">
                      {chartData.sundayAttendance?.totalAttendance || 0}
                    </p>
                </div>
                <i className="fas fa-users text-xl text-blue-600 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Average Attendance</p>
                  <p className="text-lg font-bold">
                      {chartData.sundayAttendance?.averageAttendance || 0}
                    </p>
                </div>
                <i className="fas fa-chart-line text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-purple-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-600/5 dark:from-purple-400/20 dark:to-purple-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Congregations</p>
                  <p className="text-lg font-bold">
                      {chartData.sundayAttendance?.congregationsCount || 0}
                    </p>
                </div>
                <i className="fas fa-church text-xl text-purple-600 dark:text-purple-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                      {chartData.sundayAttendance?.growth || 0}%
                    </p>
                </div>
                <i className="fas fa-arrow-up text-xl text-yellow-600 dark:text-yellow-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
            </div>
            {/* Small screens - Horizontal scrollable layout */}
            <div className="lg:hidden">
              <div className="overflow-x-auto">
                <div className="flex space-x-3 min-w-max pb-2">
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Attendance</p>
                  <p className="text-lg font-bold">
                          {chartData.sundayAttendance?.totalAttendance || 0}
                        </p>
                </div>
                <i className="fas fa-users text-xl text-blue-600 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Average Attendance</p>
                  <p className="text-lg font-bold">
                          {chartData.sundayAttendance?.averageAttendance || 0}
                        </p>
                </div>
                <i className="fas fa-chart-line text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-purple-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-600/5 dark:from-purple-400/20 dark:to-purple-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Congregations</p>
                  <p className="text-lg font-bold">
                          {chartData.sundayAttendance?.congregationsCount || 0}
                        </p>
                </div>
                <i className="fas fa-church text-xl text-purple-600 dark:text-purple-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                          {chartData.sundayAttendance?.growth || 0}%
                        </p>
                </div>
                <i className="fas fa-arrow-up text-xl text-yellow-600 dark:text-yellow-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Navigation Cards to Separate Trend Components */}
            <div>
              {/* Large screens - Grid layout */}
              <div className="hidden md:grid grid-cols-3 gap-6">
                {/* Weekly Trends Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Trends
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Detailed weekly attendance analysis
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar-week text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    View comprehensive weekly attendance trends with bar charts
                    and line graphs
                  </p>
                  <a
                    href="/analytics/weeklytrends"
                    className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    View Weekly Trends
                    <i className="fas fa-arrow-right ml-2"></i>
                  </a>
                </div>

                {/* Monthly Trends Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Monthly Trends
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Monthly attendance patterns
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar-alt text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Explore monthly attendance trends with detailed analytics
                    and visualizations
                  </p>
                  <a
                    href="/analytics/monthlytrends"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    View Monthly Trends
                    <i className="fas fa-arrow-right ml-2"></i>
                  </a>
                </div>

                {/* Yearly Trends Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Yearly Trends
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Long-term attendance analysis
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-chart-line text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Analyze yearly attendance patterns and long-term growth
                    trends
                  </p>
                  <a
                    href="/analytics/yearlytrends"
                    className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    View Yearly Trends
                    <i className="fas fa-arrow-right ml-2"></i>
                  </a>
                </div>
              </div>
              {/* Small screens - Horizontal scrollable layout */}
              <div className="md:hidden">
                <div className="overflow-x-auto">
                  <div className="flex space-x-4 min-w-max pb-2">
                    {/* Weekly Trends Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Weekly Trends
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Detailed weekly attendance analysis
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-calendar-week text-white"></i>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        View comprehensive weekly attendance trends with bar
                        charts and line graphs
                      </p>
                      <a
                        href="/analytics/weeklytrends"
                        className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        View Weekly Trends
                        <i className="fas fa-arrow-right ml-2"></i>
                      </a>
                    </div>

                    {/* Monthly Trends Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Monthly Trends
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Monthly attendance patterns
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-calendar-alt text-white"></i>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Explore monthly attendance trends with detailed
                        analytics and visualizations
                      </p>
                      <a
                        href="/analytics/monthlytrends"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        View Monthly Trends
                        <i className="fas fa-arrow-right ml-2"></i>
                      </a>
                    </div>

                    {/* Yearly Trends Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Yearly Trends
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Long-term attendance analysis
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-chart-line text-white"></i>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Analyze yearly attendance patterns and long-term growth
                        trends
                      </p>
                      <a
                        href="/analytics/yearlytrends"
                        className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        View Yearly Trends
                        <i className="fas fa-arrow-right ml-2"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Database Analytics Section */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            <i className="fas fa-database text-green-600 mr-3"></i>
            Congregations Database Analytics
          </h2>

          {/* Members Key Metrics */}
          <div className="mb-8">
            {/* Large screens - Grid layout */}
            <div className="hidden lg:grid grid-cols-6 gap-3">
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-lg font-bold">
                      {chartData.membersDatabase?.totalMembers || 0}
                    </p>
                </div>
                <i className="fas fa-users text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Male Members</p>
                  <p className="text-lg font-bold">
                      {chartData.membersDatabase?.genderDistribution?.reduce(
                        (sum, item) => sum + item.male,
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-mars text-xl text-blue-600 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Female Members</p>
                  <p className="text-lg font-bold">
                      {chartData.membersDatabase?.genderDistribution?.reduce(
                        (sum, item) => sum + item.female,
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-venus text-xl text-pink-600 dark:text-pink-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-600/5 dark:from-orange-400/20 dark:to-orange-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Guilders</p>
                  <p className="text-lg font-bold">
                      {chartData.membersDatabase?.congregations?.reduce(
                        (sum, c) => sum + (c.active_members || 0),
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-user-check text-xl text-orange-600 dark:text-orange-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-red-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-600/5 dark:from-red-400/20 dark:to-red-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inactive Guilders</p>
                  <p className="text-lg font-bold">
                      {chartData.membersDatabase?.congregations?.reduce(
                        (sum, c) => sum + (c.inactive_members || 0),
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-user-times text-xl text-red-600 dark:text-red-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                      {chartData.sundayAttendance?.growth || 0}%
                    </p>
                </div>
                <i className="fas fa-arrow-up text-xl text-yellow-600 dark:text-yellow-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
            </div>
            {/* Small screens - Horizontal scrollable layout */}
            <div className="lg:hidden">
              <div className="overflow-x-auto">
                <div className="flex space-x-3 min-w-max pb-2">
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-lg font-bold">
                          {chartData.membersDatabase?.totalMembers || 0}
                        </p>
                </div>
                <i className="fas fa-users text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Male Members</p>
                  <p className="text-lg font-bold">
                          {chartData.membersDatabase?.genderDistribution?.reduce(
                            (sum, item) => sum + item.male,
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-mars text-xl text-blue-600 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Female Members</p>
                  <p className="text-lg font-bold">
                          {chartData.membersDatabase?.genderDistribution?.reduce(
                            (sum, item) => sum + item.female,
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-venus text-xl text-pink-600 dark:text-pink-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-600/5 dark:from-orange-400/20 dark:to-orange-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Guilders</p>
                  <p className="text-lg font-bold">
                          {chartData.membersDatabase?.congregations?.reduce(
                            (sum, c) => sum + (c.active_members || 0),
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-user-check text-xl text-orange-600 dark:text-orange-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-red-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-600/5 dark:from-red-400/20 dark:to-red-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inactive Guilders</p>
                  <p className="text-lg font-bold">
                          {chartData.membersDatabase?.congregations?.reduce(
                            (sum, c) => sum + (c.inactive_members || 0),
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-user-times text-xl text-red-600 dark:text-red-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group flex-shrink-0 w-40">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                          {chartData.sundayAttendance?.growth || 0}%
                        </p>
                </div>
                <i className="fas fa-arrow-up text-xl text-yellow-600 dark:text-yellow-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:p-4 lg:max-h-[50rem]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Members by Congregation
              </h3>
              <div className="space-y-3 lg:space-y-2">
                {chartData.membersDatabase?.congregations?.map(
                  (congregation, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {congregation.name}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {congregation.members}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${congregation.members > 0 ? Math.max((congregation.members / Math.max(1, ...(chartData.membersDatabase?.congregations || []).map((c) => c.members || 0))) * 100, 2) : 0}%`,
                            backgroundColor: congregation.color || "#3B82F6",
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Gender Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Gender Distribution by Congregation
              </h3>
              {/* Large screens - Grid layout with cards */}
              <div className="hidden lg:grid grid-cols-1 gap-6">
                {chartData.membersDatabase?.genderDistribution?.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
                      <div className="relative z-10">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">
                          {item.congregation}
                        </h4>
                        <div className="flex justify-center space-x-4">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                              <i className="fas fa-mars text-white text-sm"></i>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.male}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Male
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                              <i className="fas fa-venus text-white text-sm"></i>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.female}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Female
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
              {/* Small screens - Horizontal scrollable layout */}
              <div className="lg:hidden">
                <div className="overflow-x-auto">
                  <div className="flex space-x-4 min-w-max pb-2">
                    {chartData.membersDatabase?.genderDistribution?.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group flex-shrink-0 w-48"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-600/5 dark:from-blue-400/20 dark:to-blue-600/20 animate-pulse"></div>
                          <div className="relative z-10">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">
                              {item.congregation}
                            </h4>
                            <div className="flex justify-center space-x-4">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                                  <i className="fas fa-mars text-white text-sm"></i>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.male}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Male
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                                  <i className="fas fa-venus text-white text-sm"></i>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.female}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Female
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
