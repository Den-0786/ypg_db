"use client";

import { useState, useEffect } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import getDataStore from "../../utils/dataStore";
import TrendLineChart from "../../components/TrendLineChart";
import TrendBarChart from "../../components/TrendBarChart";

export default function YearlyTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const [congregationName, setCongregationName] = useState(null);

  useEffect(() => {
    const storedCongregationName = localStorage.getItem("congregationName");
    if (storedCongregationName) {
      setCongregationName(storedCongregationName);
    }
  }, []);

  useEffect(() => {
    if (congregationName) {
      fetchAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [congregationName]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get data from data store
      const dataStore = getDataStore();
      const attendanceRecords = await dataStore.getAttendanceRecords({ congregation: congregationName });

      console.log("Yearly Trends - Attendance data:", attendanceRecords);

      // Group attendance records by year
      const yearlyData = {};
      attendanceRecords.forEach((record) => {
        const date = new Date(record.date);
        const year = date.getFullYear();
        
        if (!yearlyData[year]) {
          yearlyData[year] = {
            year: year,
            male: 0,
            female: 0,
            total: 0,
          };
        }
        
        yearlyData[year].male += record.male || 0;
        yearlyData[year].female += record.female || 0;
        yearlyData[year].total += record.total || 0;
      });

      // Convert to array and sort by year
      const yearlyTrend = Object.values(yearlyData).sort((a, b) => a.year - b.year);

          const realData = {
            sundayAttendance: {
          yearlyTrend: yearlyTrend,
            },
          };

      console.log("Yearly Trends - Final data:", realData);
          setChartData(realData);
          setLoading(false);
    } catch (error) {
      console.error("Error fetching yearly trends data:", error);
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
              Yearly Attendance Trends
            </h2>

            {/* Navigation Buttons */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <a
                href="/local/weeklytrends"
                className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Weekly
              </a>
              <a
                href="/local/monthlytrends"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Monthly
              </a>
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                <i className="fas fa-chart-line mr-2"></i>
                Yearly
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Yearly Trends Description Card */}
            <div className="w-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-green-500 border  dark:border-gray-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-green-600/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Yearly Attendance Overview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(() => {
                        const yearlyData = chartData.sundayAttendance?.yearlyTrend || [];
                        if (yearlyData.length === 0) return "No data available";
                        const firstYear = yearlyData[0]?.year || new Date().getFullYear();
                        const lastYear = yearlyData[yearlyData.length - 1]?.year || new Date().getFullYear();
                        return `${firstYear} - ${lastYear} - ${yearlyData.length} Year Analysis`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {chartData.sundayAttendance.yearlyTrend.length}
                      </div>
                      <div className="text-xs text-gray-500">Years</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(
                          (
                            chartData.sundayAttendance?.yearlyTrend || []
                          ).reduce((sum, year) => sum + (year?.total || 0), 0) /
                            Math.max(
                              (chartData.sundayAttendance?.yearlyTrend || [])
                                .length,
                              1
                            )
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Avg/Year</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {(() => {
                          const yearlyData =
                            chartData.sundayAttendance?.yearlyTrend || [];
                          const firstYear = yearlyData[0];
                          const lastYear = yearlyData[yearlyData.length - 1];
                          const difference =
                            (lastYear?.total || 0) - (firstYear?.total || 0);
                          return difference > 0 ? "+" + difference : difference;
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Growth</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Yearly attendance analysis shows long-term attendance
                    patterns across 6 years. The data reveals{" "}
                    {(() => {
                      const yearlyData =
                        chartData.sundayAttendance?.yearlyTrend || [];
                      const firstYear = yearlyData[0];
                      const lastYear = yearlyData[yearlyData.length - 1];
                      const difference =
                        (lastYear?.total || 0) - (firstYear?.total || 0);
                      return difference > 0
                        ? "sustained yearly growth with excellent long-term trends."
                        : "fluctuating yearly patterns that need strategic planning.";
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Yearly Trend Chart */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Yearly Attendance Trend
              </h3>

              <TrendBarChart
                data={chartData.sundayAttendance?.yearlyTrend || []}
                labelKey="year"
              />

              <div className="mt-6">
                <TrendLineChart
                  data={chartData.sundayAttendance?.yearlyTrend || []}
                  labelKey="year"
                  title="Yearly Trend"
                  subtitle={`Total Attendance: ${(chartData.sundayAttendance?.yearlyTrend || []).reduce((sum, y) => sum + (y?.total || 0), 0)}`}
                  colorScheme={{ accent: "#10b981", gradientId: "gradLocalYearly", gradientColor: "#10b981" }}
                />
              </div>

              <div className="mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Yearly Trend Analysis
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {(() => {
                    const yearlyData = chartData.sundayAttendance?.yearlyTrend || [];
                    const firstYear = yearlyData[0];
                    const lastYear = yearlyData[yearlyData.length - 1];
                    const difference = (lastYear?.total || 0) - (firstYear?.total || 0);
                    return difference > 0
                      ? `Yearly attendance has increased by ${Math.abs(difference)} people over the years. Excellent long-term growth!`
                      : `Yearly attendance has decreased by ${Math.abs(difference)} people. Consider long-term engagement strategies.`;
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
