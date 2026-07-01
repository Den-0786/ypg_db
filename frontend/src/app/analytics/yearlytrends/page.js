"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import getDataStore from "../../utils/dataStore";
import TrendLineChart from "../../components/TrendLineChart";
import TrendBarChart from "../../components/TrendBarChart";

export default function YearlyTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const dataStore = getDataStore();
      const attendanceRecords = await dataStore.getAttendanceRecords();
      
      console.log("DEBUG: Raw attendance records:", attendanceRecords);
      console.log("DEBUG: Number of records:", attendanceRecords?.length || 0);
      
      if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        console.log("DEBUG: No valid attendance records found");
        setChartData({
          sundayAttendance: {
            yearlyTrend: []
          }
        });
        setLoading(false);
        return;
      }

      const yearlyData = {};
      
      attendanceRecords.forEach(record => {
        if (record && record.date) {
          const date = new Date(record.date);
          const year = date.getFullYear().toString();
          
          if (!yearlyData[year]) {
            yearlyData[year] = {
              year: year,
              male: 0,
              female: 0,
              total: 0
            };
          }
          
          yearlyData[year].male += record.male || 0;
          yearlyData[year].female += record.female || 0;
          yearlyData[year].total += record.total || 0;
        }
      });

      const yearlyTrend = Object.values(yearlyData).sort((a, b) => {
        return parseInt(a.year) - parseInt(b.year);
      });

      console.log("DEBUG: Processed yearly trend:", yearlyTrend);

      const realData = {
        sundayAttendance: {
          yearlyTrend: yearlyTrend
        }
      };
      
      setChartData(realData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setChartData({
        sundayAttendance: {
          yearlyTrend: []
        }
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const yearlyTrend = chartData.sundayAttendance?.yearlyTrend || [];
  const maxValue = Math.max(...yearlyTrend.map(y => Math.max(y?.male || 0, y?.female || 0, y?.total || 0)), 1);
  const firstYear = yearlyTrend[0] || {};
  const lastYear = yearlyTrend[yearlyTrend.length - 1] || {};
  const difference = (lastYear?.total || 0) - (firstYear?.total || 0);
  const average = yearlyTrend.length > 0 ? Math.round(yearlyTrend.reduce((sum, year) => sum + (year?.total || 0), 0) / yearlyTrend.length) : 0;

  return (
    <DashboardLayout>
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
                href="/analytics/weeklytrends"
                className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Weekly
              </a>
              <a
                href="/analytics/monthlytrends"
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
                      {chartData.sundayAttendance?.yearlyTrend?.length > 0 ? 
                        `${chartData.sundayAttendance.yearlyTrend[0]?.year || 'N/A'} - ${chartData.sundayAttendance.yearlyTrend[chartData.sundayAttendance.yearlyTrend.length - 1]?.year || 'N/A'} - ${chartData.sundayAttendance.yearlyTrend.length} Year Analysis` : 
                        'No Data Available'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {yearlyTrend.length}
                      </div>
                      <div className="text-xs text-gray-500">Years</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {average}
                      </div>
                      <div className="text-xs text-gray-500">Avg/Year</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {difference > 0 ? "+" + difference : difference}
                      </div>
                      <div className="text-xs text-gray-500">Growth</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Yearly attendance analysis shows long-term attendance
                    patterns across {yearlyTrend.length} years. The data reveals{" "}
                    {difference > 0
                      ? "sustained yearly growth with excellent long-term trends."
                      : "fluctuating yearly patterns that need strategic planning."}
                  </p>
                </div>
              </div>
            </div>

            {/* Yearly Trend Chart */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Yearly Attendance Trend
              </h3>

              {yearlyTrend.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-lg">
                    No attendance data available
                  </div>
                </div>
              ) : (
                <TrendBarChart data={yearlyTrend} labelKey="year" />
              )}

              {/* Yearly Trend Analytics Card */}
              <div className="mt-6">
                <TrendLineChart
                  data={yearlyTrend}
                  labelKey="year"
                  title="Yearly Trend"
                  subtitle={`Total Attendance: ${yearlyTrend.reduce((sum, y) => sum + (y?.total || 0), 0)}`}
                  colorScheme={{ accent: "#10b981", gradientId: "gradYearly", gradientColor: "#10b981" }}
                />
              </div>

              <div className="mt-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Yearly Trend Analysis
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {difference > 0
                    ? `Yearly attendance has increased by ${Math.abs(difference)} people over the years. Excellent long-term growth!`
                    : `Yearly attendance has decreased by ${Math.abs(difference)} people. Consider long-term engagement strategies.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
