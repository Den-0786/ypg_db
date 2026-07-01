"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import getDataStore from "../../utils/dataStore";
import TrendLineChart from "../../components/TrendLineChart";
import TrendBarChart from "../../components/TrendBarChart";

export default function WeeklyTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const dataStore = getDataStore();
      const attendanceRecords = await dataStore.getAttendanceRecords();

      const weeklyData = {};
      attendanceRecords.forEach((record) => {
        const date = new Date(record.date);
        const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week: weekKey,
            male: 0,
            female: 0,
            total: 0,
            date: record.date,
          };
        }
        
        weeklyData[weekKey].male += record.male || 0;
        weeklyData[weekKey].female += record.female || 0;
        weeklyData[weekKey].total += record.total || 0;
      });

      const weeklyTrend = Object.values(weeklyData).sort((a, b) => {
        const weekA = parseInt(a.week.split(' ')[1]);
        const weekB = parseInt(b.week.split(' ')[1]);
        return weekA - weekB;
      });

      const realData = {
        sundayAttendance: {
          weeklyTrend: weeklyTrend,
        },
      };

      setChartData(realData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 mt-4 md:mt-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              <i className="fas fa-calendar-check text-orange-500 mr-3"></i>
              Weekly Attendance Trends
            </h2>

            {/* Navigation Buttons */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Weekly
              </button>
              <a
                href="/analytics/monthlytrends"
                className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Monthly
              </a>
              <a
                href="/analytics/yearlytrends"
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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-orange-500 border dark:border-gray-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-orange-600/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Weekly Attendance Overview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(() => {
                        const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                        if (weeklyData.length === 0) return "No data available";
                        const firstRecord = weeklyData[0];
                        const month = new Date(firstRecord?.date || new Date()).toLocaleDateString("default", { month: "long" });
                        const year = new Date(firstRecord?.date || new Date()).getFullYear();
                        return `${month} ${year} - ${weeklyData.length} Week Analysis`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        {chartData.sundayAttendance?.weeklyTrend?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Weeks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                          if (weeklyData.length === 0) return 0;
                          const total = weeklyData.reduce((sum, week) => sum + (week?.total || 0), 0);
                          return Math.round(total / weeklyData.length);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Avg/Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(() => {
                          const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                          if (weeklyData.length === 0) return 0;
                          const firstWeek = weeklyData[0];
                          const lastWeek = weeklyData[weeklyData.length - 1];
                          const difference = (lastWeek?.total || 0) - (firstWeek?.total || 0);
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
                      const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                      if (weeklyData.length === 0) return "no data available for analysis.";
                      const firstWeek = weeklyData[0];
                      const lastWeek = weeklyData[weeklyData.length - 1];
                      const difference = (lastWeek?.total || 0) - (firstWeek?.total || 0);
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
                data={chartData.sundayAttendance?.weeklyTrend || []}
                labelKey="week"
              />
            </div>

            {/* Weekly Attendance Line Graph */}
            <div className="w-full">
              <TrendLineChart
                data={chartData.sundayAttendance?.weeklyTrend || []}
                labelKey="week"
                title="Weekly Trend"
                subtitle={`Total Attendance: ${(chartData.sundayAttendance?.weeklyTrend || []).reduce((sum, w) => sum + (w?.total || 0), 0)}`}
                colorScheme={{ accent: "#f97316", gradientId: "gradWeekly", gradientColor: "#f97316" }}
              />

                {/* Trend Analysis */}
                <div className="mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Weekly Trend Analysis
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {(() => {
                      const weeklyData = chartData.sundayAttendance?.weeklyTrend || [];
                      if (weeklyData.length === 0) return "No data available for analysis.";
                      const firstWeek = weeklyData[0];
                      const lastWeek = weeklyData[weeklyData.length - 1];
                      const difference = (lastWeek?.total || 0) - (firstWeek?.total || 0);
                      return difference > 0
                        ? `Weekly attendance has increased by ${Math.abs(difference)} people over the period. Strong weekly growth!`
                        : `Weekly attendance has decreased by ${Math.abs(difference)} people. Consider weekly engagement strategies.`;
                    })()}
                  </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
