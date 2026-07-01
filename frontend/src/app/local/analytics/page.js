"use client";

import { useState, useEffect } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import getDataStore from "../../utils/dataStore";

export default function LocalAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const [tooltip, setTooltip] = useState({
    show: false,
    data: null,
    x: 0,
    y: 0,
  });
  const [selectedCongregation, setSelectedCongregation] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filtered, setFiltered] = useState(null);
  const [currentCongregationName, setCurrentCongregationName] = useState(null);

  useEffect(() => {
    // Get current congregation from localStorage
    const congregationName = localStorage.getItem("congregationName");
    console.log("Local Analytics - Current congregation:", congregationName);
    setCurrentCongregationName(congregationName);

    // Set the congregation filter to current congregation
    if (congregationName) {
      setSelectedCongregation(congregationName);
      console.log(
        "Local Analytics - Set selected congregation to:",
        congregationName
      );
    } else {
      console.log(
        "Local Analytics - No congregation found in localStorage, redirecting to selection"
      );
      window.location.href = "/local/select-congregation";
      return;
    }

    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (!(filtered?.sundayAttendance || chartData.sundayAttendance)) return;
    let filteredData = { ...chartData };

    console.log(
      "Local Analytics - Filtering data for congregation:",
      selectedCongregation
    );
    console.log(
      "Local Analytics - Available congregations:",
      (
        filtered?.membersDatabase || chartData.membersDatabase
      )?.congregations?.map((c) => c.name)
    );

    // Filter by congregation
    if (selectedCongregation !== "All") {
      console.log(
        "Local Analytics - Filtering by congregation:",
        selectedCongregation
      );

      filteredData = {
        ...filteredData,
        sundayAttendance: {
          ...filteredData.sundayAttendance,
          weeklyTrend: filteredData.sundayAttendance.weeklyTrend.filter(
            (w) => w.congregation === selectedCongregation
          ),
          monthlyTrend: filteredData.sundayAttendance.monthlyTrend,
          yearlyTrend: filteredData.sundayAttendance.yearlyTrend,
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

      console.log(
        "Local Analytics - Filtered congregations:",
        filteredData.membersDatabase.congregations
      );
      console.log(
        "Local Analytics - Filtered weekly trend:",
        filteredData.sundayAttendance.weeklyTrend
      );
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
      
      // Get congregation name from localStorage
      const congregationName = localStorage.getItem("congregationName");
      
      // Get data from data store
      const dataStore = getDataStore();
      const members = await dataStore.getMembers({ congregation: congregationName });
      const attendanceRecords = await dataStore.getAttendanceRecords({ congregation: congregationName });

      console.log("Analytics - Members data:", members);
      console.log("Analytics - Attendance data:", attendanceRecords);

      // Calculate attendance analytics
      const totalAttendance = attendanceRecords.reduce((sum, r) => sum + (r.total || 0), 0);
      const totalMale = attendanceRecords.reduce((sum, r) => sum + (r.male || 0), 0);
      const totalFemale = attendanceRecords.reduce((sum, r) => sum + (r.female || 0), 0);
      const averageAttendance = attendanceRecords.length > 0 ? totalAttendance / attendanceRecords.length : 0;

                // Convert attendance records to weekly trend format
      const weeklyTrend = attendanceRecords.map((record) => ({
                  date: record.date,
                  congregation: congregationName,
        total: record.total || 0,
        male: record.male || 0,
        female: record.female || 0,
      }));

      // Calculate members analytics
      const maleMembers = members.filter(m => m.gender === "Male").length;
      const femaleMembers = members.filter(m => m.gender === "Female").length;
      const totalMembers = members.length;

      const analyticsData = {
            sundayAttendance: {
          totalAttendance,
          averageAttendance: Math.round(averageAttendance),
          congregationsCount: 1,
          growth: 0,
          weeklyTrend,
          monthlyTrend: [],
          yearlyTrend: [],
            },
            membersDatabase: {
          totalMembers,
          congregations: [{
            name: congregationName,
            members: totalMembers,
            active_members: totalMembers,
            inactive_members: 0,
          }],
          genderDistribution: [{
            congregation: congregationName,
            male: maleMembers,
            female: femaleMembers,
          }],
        },
      };

      console.log("Analytics - Final data:", analyticsData);
      setChartData(analyticsData);
          setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    setLoading(false);
    }
  };

  if (loading) {
    return (
      <LocalDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </LocalDashboardLayout>
    );
  }

  return (
    <LocalDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <i className="fas fa-chart-bar text-blue-500 mr-3"></i>
            {currentCongregationName
              ? `${currentCongregationName} Analytics`
              : "Local Analytics Dashboard"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive insights into{" "}
            {currentCongregationName ? `${currentCongregationName}'s` : "local"}{" "}
            YPG attendance and membership data
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {/* Show current congregation info instead of filter */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  <i className="fas fa-church text-blue-500 mr-2"></i>
                  {currentCongregationName || "Local Congregation"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Analytics data for this congregation
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Filtered Data
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-400">
                  {selectedCongregation}
                </div>
              </div>
            </div>
          </div>

          {/* Large screens - Date filters only */}
          <div className="hidden lg:grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="local-analytics-date-start-lg"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Start Date
              </label>
              <input
                id="local-analytics-date-start-lg"
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
                htmlFor="local-analytics-date-end-lg"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Date
              </label>
              <input
                id="local-analytics-date-end-lg"
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

          {/* Small screens - Date filters only */}
          <div className="lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="local-analytics-date-start-sm"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="local-analytics-date-start-sm"
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
                  htmlFor="local-analytics-date-end-sm"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  End Date
                </label>
                <input
                  id="local-analytics-date-end-sm"
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

        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 mt-6">
            <i className="fas fa-calendar-check text-blue-500 mr-3"></i>
            Sunday Attendance Analytics
          </h2>

          {/* Statistics Cards */}
          <div className="flex overflow-x-auto space-x-4 pb-4 mb-8">
            <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Attendance</p>
                  <p className="text-lg font-bold">
                    {
                      (filtered?.sundayAttendance || chartData.sundayAttendance)
                        .totalAttendance
                    }
                  </p>
                </div>
                <i className="fas fa-users text-xl text-blue-500 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>

            <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/5 to-indigo-600/5 dark:from-indigo-400/20 dark:to-indigo-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Male Attendance</p>
                  <p className="text-lg font-bold">
                    {(
                      filtered?.sundayAttendance || chartData.sundayAttendance
                    ).weeklyTrend
                      .slice(0, 4)
                      .reduce((sum, week) => sum + week.male, 0)}
                  </p>
                </div>
                <i className="fas fa-mars text-xl text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>

            <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Female Attendance</p>
                  <p className="text-lg font-bold">
                    {(
                      filtered?.sundayAttendance || chartData.sundayAttendance
                    ).weeklyTrend
                      .slice(0, 4)
                      .reduce((sum, week) => sum + week.female, 0)}
                  </p>
                </div>
                <i className="fas fa-venus text-xl text-pink-600 dark:text-pink-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>

            <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Average Attendance</p>
                  <p className="text-lg font-bold">
                    {
                      (filtered?.sundayAttendance || chartData.sundayAttendance)
                        .averageAttendance
                    }
                  </p>
                </div>
                <i className="fas fa-chart-bar text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>

            <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                    {
                      (filtered?.sundayAttendance || chartData.sundayAttendance)
                        .growth
                    }
                    %
                  </p>
                </div>
                <i className="fas fa-arrow-up text-xl text-yellow-600 dark:text-yellow-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
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
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar-week text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    View comprehensive weekly attendance trends with bar charts
                    and line graphs
                  </p>
                  <a
                    href="/local/weeklytrends"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
                    href="/local/monthlytrends"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
                    href="/local/yearlytreds"
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
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-calendar-week text-white"></i>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        View comprehensive weekly attendance trends with bar
                        charts and line graphs
                      </p>
                      <a
                        href="/local/weeklytrends"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
                        href="/local/monthlytrends"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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
                        href="/local/yearlytreds"
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
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            <i className="fas fa-database text-green-600 mr-3"></i>
            Members Database Analytics
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
                      {(
                        filtered?.membersDatabase?.congregations ||
                        (filtered?.membersDatabase || chartData.membersDatabase)
                          ?.congregations
                      )?.reduce((sum, c) => sum + c.members, 0) || 0}
                    </p>
                </div>
                <i className="fas fa-users text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Male Members</p>
                  <p className="text-lg font-bold">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.genderDistribution?.reduce(
                        (sum, item) => sum + item.male,
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-mars text-xl text-blue-500 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Female Members</p>
                  <p className="text-lg font-bold">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.genderDistribution?.reduce(
                        (sum, item) => sum + item.female,
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-venus text-xl text-pink-600 dark:text-pink-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-700/5 dark:from-blue-400/20 dark:to-blue-700/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Guilders</p>
                  <p className="text-lg font-bold">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.congregations?.reduce(
                        (sum, c) => sum + (c.active_members || 0),
                        0
                      ) || 0}
                    </p>
                </div>
                <i className="fas fa-user-check text-xl text-blue-700 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-red-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-600/5 dark:from-red-400/20 dark:to-red-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inactive Guilders</p>
                  <p className="text-lg font-bold">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.congregations?.reduce(
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
                      {(
                        filtered?.sundayAttendance || chartData.sundayAttendance
                      )?.growth || 0}
                      %
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
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-600/5 dark:from-green-400/20 dark:to-green-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.congregations?.reduce(
                            (sum, c) => sum + c.members,
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-users text-xl text-green-600 dark:text-green-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Male Members</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.genderDistribution?.reduce(
                            (sum, item) => sum + item.male,
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-mars text-xl text-blue-500 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Female Members</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.genderDistribution?.reduce(
                            (sum, item) => sum + item.female,
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-venus text-xl text-pink-600 dark:text-pink-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-700/5 dark:from-blue-400/20 dark:to-blue-700/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Guilders</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.congregations?.reduce(
                            (sum, c) => sum + (c.active_members || 0),
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-user-check text-xl text-blue-700 dark:text-blue-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-red-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-600/5 dark:from-red-400/20 dark:to-red-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inactive Guilders</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.congregations?.reduce(
                            (sum, c) => sum + (c.inactive_members || 0),
                            0
                          ) || 0}
                        </p>
                </div>
                <i className="fas fa-user-times text-xl text-red-600 dark:text-red-400 opacity-80 group-hover:scale-110 transition-transform duration-200"></i>
              </div>
            </div>
                  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 shadow-lg dark:shadow-yellow-500/20 relative overflow-hidden group flex-shrink-0 w-48">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 dark:from-yellow-400/20 dark:to-yellow-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Growth</p>
                  <p className="text-lg font-bold">
                          {(
                            filtered?.sundayAttendance ||
                            chartData.sundayAttendance
                          )?.growth || 0}
                          %
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
                Members by Gender
              </h3>
              <div className="space-y-3 lg:space-y-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Male Members
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.genderDistribution?.reduce(
                        (sum, item) => sum + item.male,
                        0
                      ) || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min((((filtered?.membersDatabase || chartData.membersDatabase)?.genderDistribution?.reduce((sum, item) => sum + item.male, 0) || 0) / ((filtered?.membersDatabase || chartData.membersDatabase)?.congregations?.reduce((sum, c) => sum + c.members, 0) || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Female Members
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(
                        filtered?.membersDatabase || chartData.membersDatabase
                      )?.genderDistribution?.reduce(
                        (sum, item) => sum + item.female,
                        0
                      ) || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-pink-500"
                      style={{
                        width: `${Math.min((((filtered?.membersDatabase || chartData.membersDatabase)?.genderDistribution?.reduce((sum, item) => sum + item.female, 0) || 0) / ((filtered?.membersDatabase || chartData.membersDatabase)?.congregations?.reduce((sum, c) => sum + c.members, 0) || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Gender Distribution
              </h3>
              {/* Large screens - Grid layout with cards */}
              <div className="hidden lg:grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
                  <div className="relative z-10">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">
                      Total Members
                    </h4>
                    <div className="flex justify-center space-x-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                          <i className="fas fa-mars text-white text-sm"></i>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.genderDistribution?.reduce(
                            (sum, item) => sum + item.male,
                            0
                          ) || 0}
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
                          {(
                            filtered?.membersDatabase ||
                            chartData.membersDatabase
                          )?.genderDistribution?.reduce(
                            (sum, item) => sum + item.female,
                            0
                          ) || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Female
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Small screens - Grid layout with evenly distributed cards */}
              <div className="lg:hidden">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
                    <div className="relative z-10">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">
                        Total Members
                      </h4>
                      <div className="flex justify-center space-x-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                            <i className="fas fa-mars text-white text-sm"></i>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {(
                              filtered?.membersDatabase ||
                              chartData.membersDatabase
                            )?.genderDistribution?.reduce(
                              (sum, item) => sum + item.male,
                              0
                            ) || 0}
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
                            {(
                              filtered?.membersDatabase ||
                              chartData.membersDatabase
                            )?.genderDistribution?.reduce(
                              (sum, item) => sum + item.female,
                              0
                            ) || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Female
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocalDashboardLayout>
  );
}
