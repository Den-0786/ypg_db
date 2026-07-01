/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import getDataStore from "../../utils/dataStore";
import TrendLineChart from "../../components/TrendLineChart";
import TrendBarChart from "../../components/TrendBarChart";

export default function WeeklyTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const [congregationName, setCongregationName] = useState(null);

  useEffect(() => {
    // Get congregation name from localStorage
    const storedCongregationName = localStorage.getItem("congregationName");
    if (storedCongregationName) {
      setCongregationName(storedCongregationName);
    }
  }, []);

  useEffect(() => {
    if (congregationName) {
      fetchAnalyticsData();
    }
  }, [congregationName]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get data from data store
      const dataStore = getDataStore();
      const attendanceRecords = await dataStore.getAttendanceRecords({ congregation: congregationName });

      console.log("Weekly Trends - Attendance data:", attendanceRecords);

      // Convert attendance records to weekly trend format
      const weeklyTrend = attendanceRecords.map((record) => ({
        date: record.date,
        congregation: congregationName,
        total: record.total || 0,
        male: record.male || 0,
        female: record.female || 0,
      }));

          const realData = {
            sundayAttendance: {
          weeklyTrend: weeklyTrend,
            },
          };

      console.log("Weekly Trends - Final data:", realData);
          setChartData(realData);
          setLoading(false);
    } catch (error) {
      console.error("Error fetching weekly trends data:", error);
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
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 mt-4 md:mt-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              <i className="fas fa-calendar-check text-blue-500 mr-3"></i>
              Weekly Attendance Trends
            </h2>

            {/* Navigation Buttons */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Weekly
              </button>
              <a
                href="/local/monthlytrends"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Monthly
              </a>
              <a
                href="/local/yearlytreds"
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-chart-line mr-2"></i>
                Yearly
              </a>
            </div>
          </div>

          <div className="space-y-6">
            {/* Weekly Trends Description Card */}
            <div className="w-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-blue-500 border dark:border-gray-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-700/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Weekly Attendance Overview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(() => {
                        const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                        if (weeklyData.length === 0) return "No data available";
                        const firstDate = new Date(weeklyData[0]?.date);
                        const monthYear = firstDate.toLocaleDateString("default", { month: "long", year: "numeric" });
                        return `${monthYear} - ${weeklyData.length} Week Analysis`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {
                          chartData.sundayAttendance.weeklyTrend.slice(0, 4)
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-500">Weeks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          const weeklyData =
                            chartData.sundayAttendance?.weeklyTrend?.slice(
                              0,
                              4
                            ) || [];
                          if (weeklyData.length === 0) return 0;
                          const total = weeklyData.reduce(
                            (sum, week) => sum + (week?.total || 0),
                            0
                          );
                          return Math.round(total / weeklyData.length);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Avg/Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {(() => {
                          const weeklyData =
                            chartData.sundayAttendance?.weeklyTrend?.slice(
                              0,
                              4
                            ) || [];
                          if (weeklyData.length < 2) return 0;
                          const firstWeek = weeklyData[0];
                          const lastWeek = weeklyData[weeklyData.length - 1];
                          if (!firstWeek || !lastWeek) return 0;
                          const difference =
                            (lastWeek.total || 0) - (firstWeek.total || 0);
                          return difference > 0 ? "+" + difference : difference;
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Growth</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Weekly attendance analysis shows attendance patterns across
                    4 weeks. The data reveals{" "}
                    {(() => {
                      const weeklyData =
                        chartData.sundayAttendance?.weeklyTrend?.slice(0, 4) ||
                        [];
                      if (weeklyData.length < 2)
                        return "insufficient data for trend analysis.";
                      const firstWeek = weeklyData[0];
                      const lastWeek = weeklyData[weeklyData.length - 1];
                      if (!firstWeek || !lastWeek)
                        return "insufficient data for trend analysis.";
                      const difference =
                        (lastWeek.total || 0) - (firstWeek.total || 0);
                      return difference > 0
                        ? "positive growth trends with increasing attendance."
                        : "fluctuating attendance patterns that need attention.";
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Attendance Bar Chart */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-2 md:mt-6">
                Weekly Attendance Trend
              </h3>
              <TrendBarChart
                data={(chartData.sundayAttendance?.weeklyTrend || []).map((w, i) => ({ ...w, label: `Week ${i + 1}` }))}
                labelKey="label"
              />
            </div>

            {/* Weekly Attendance Line Graph */}
            <div className="w-full">
              <div>

                <TrendLineChart
                  data={(chartData.sundayAttendance?.weeklyTrend || []).map((w, i) => ({ ...w, label: `Week ${i + 1}` }))}
                  labelKey="label"
                  title="Weekly Trend"
                  subtitle={`Total Attendance: ${(chartData.sundayAttendance?.weeklyTrend || []).reduce((sum, w) => sum + (w?.total || 0), 0)}`}
                  colorScheme={{ accent: "#f97316", gradientId: "gradLocalWeekly", gradientColor: "#f97316" }}
                />

                <div className="mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Weekly Trend Analysis
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {(() => {
                      const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                      if (weeklyData.length < 2) return "Insufficient data for trend analysis.";
                      const firstWeek = weeklyData[0];
                      const lastWeek = weeklyData[weeklyData.length - 1];
                      const difference = (lastWeek?.total || 0) - (firstWeek?.total || 0);
                      return difference > 0
                        ? `Weekly attendance has increased by ${Math.abs(difference)} people over the month. Strong weekly growth!`
                        : `Weekly attendance has decreased by ${Math.abs(difference)} people. Consider weekly engagement strategies.`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocalDashboardLayout>
  );
}
