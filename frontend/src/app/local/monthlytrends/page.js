"use client";

import { useState, useEffect } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import getDataStore from "../../utils/dataStore";
import TrendLineChart from "../../components/TrendLineChart";
import TrendBarChart from "../../components/TrendBarChart";

export default function MonthlyTrendsPage() {
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

      console.log("Monthly Trends - Attendance data:", attendanceRecords);

      // Group attendance records by month
      const monthlyData = {};
      if (attendanceRecords && Array.isArray(attendanceRecords)) {
        attendanceRecords.forEach((record) => {
          if (record && record.date) {
            const date = new Date(record.date);
            const monthKey = date.toLocaleDateString("default", { month: "long" });
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthKey,
                male: 0,
                female: 0,
                total: 0,
              };
            }
            
            monthlyData[monthKey].male += record?.male || 0;
            monthlyData[monthKey].female += record?.female || 0;
            monthlyData[monthKey].total += record?.total || 0;
          }
        });
      }

      // Convert to array and sort by month order
      const monthOrder = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      const monthlyTrend = Object.values(monthlyData).sort((a, b) => {
        return monthOrder.indexOf(a?.month || "") - monthOrder.indexOf(b?.month || "");
      });

          const realData = {
            sundayAttendance: {
          monthlyTrend: monthlyTrend,
            },
          };

      console.log("Monthly Trends - Final data:", realData);
          setChartData(realData);
          setLoading(false);
    } catch (error) {
      console.error("Error fetching monthly trends data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LocalDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
              <i className="fas fa-calendar-check text-orange-500 mr-3"></i>
              Monthly Attendance Trends
            </h2>

            {/* Navigation Buttons */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <a
                href="/local/weeklytrends"
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Weekly
              </a>
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Monthly
              </button>
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
            {/* Monthly Trends Description Card */}
            <div className="w-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-orange-500 border  dark:border-gray-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-orange-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Monthly Attendance Overview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(() => {
                        const monthlyData = chartData.sundayAttendance?.monthlyTrend || [];
                        if (monthlyData.length === 0) return "No data available";
                        const firstRecord = monthlyData[0] || {};
                        const year = new Date().getFullYear(); // Use current year as fallback
                        return `${year} - ${monthlyData.length} Month Analysis`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        {chartData.sundayAttendance?.monthlyTrend?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Months</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          const monthlyData =
                            chartData.sundayAttendance?.monthlyTrend || [];
                          if (monthlyData.length === 0) return 0;
                          const total = monthlyData.reduce(
                            (sum, month) => sum + (month?.total || 0),
                            0
                          );
                          return Math.round(total / monthlyData.length);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Avg/Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(() => {
                          const monthlyData =
                            chartData.sundayAttendance?.monthlyTrend || [];
                          if (monthlyData.length === 0) return 0;
                          const firstMonth = monthlyData[0] || {};
                          const lastMonth = monthlyData[monthlyData.length - 1] || {};
                          const difference =
                            (lastMonth?.total || 0) - (firstMonth?.total || 0);
                          return difference > 0 ? "+" + difference : difference;
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Growth</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Monthly attendance analysis shows attendance patterns across
                    12 months. The data reveals{" "}
                    {(() => {
                      const monthlyData =
                        chartData.sundayAttendance?.monthlyTrend || [];
                      if (monthlyData.length === 0) return "no data available for analysis.";
                      const firstMonth = monthlyData[0] || {};
                      const lastMonth = monthlyData[monthlyData.length - 1] || {};
                      const difference =
                        (lastMonth?.total || 0) - (firstMonth?.total || 0);
                      return difference > 0
                        ? "consistent monthly growth with improving attendance trends."
                        : "varying monthly patterns that require strategic attention.";
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monthly Attendance Trend
              </h3>

              <TrendBarChart
                data={chartData.sundayAttendance?.monthlyTrend || []}
                labelKey="month"
              />

              <div className="mt-6">
                <TrendLineChart
                  data={chartData.sundayAttendance?.monthlyTrend || []}
                  labelKey="month"
                  title="Monthly Trend"
                  subtitle={`Total Attendance: ${(chartData.sundayAttendance?.monthlyTrend || []).reduce((sum, m) => sum + (m?.total || 0), 0)}`}
                  colorScheme={{ accent: "#3b82f6", gradientId: "gradLocalMonthly", gradientColor: "#3b82f6" }}
                />
              </div>

              <div className="mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Monthly Trend Analysis
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {(() => {
                    const monthlyData = chartData.sundayAttendance?.monthlyTrend || [];
                    if (monthlyData.length === 0) return "No data available for analysis.";
                    const firstMonth = monthlyData[0] || {};
                    const lastMonth = monthlyData[monthlyData.length - 1] || {};
                    const difference = (lastMonth?.total || 0) - (firstMonth?.total || 0);
                    return difference > 0
                      ? `Monthly attendance has increased by ${Math.abs(difference)} people over the year. Strong growth!`
                      : `Monthly attendance has decreased by ${Math.abs(difference)} people. Consider engagement strategies.`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocalDashboardLayout>
  );
}
