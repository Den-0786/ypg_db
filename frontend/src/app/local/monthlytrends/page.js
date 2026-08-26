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
  const [members, setMembers] = useState([]);

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
      const [attendanceRecords, allMembers] = await Promise.all([
        dataStore.getAttendanceRecords({ congregation: congregationName }),
        dataStore.getMembers({ congregation: congregationName }),
      ]);
      setMembers(allMembers);

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
              Monthly Attendance Trends
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
              <button
                disabled
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-blue-500 border  dark:border-gray-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
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
                      <div className="text-2xl font-bold text-blue-500">
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

            {/* New Member Enrollment by Month */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <i className="fas fa-user-plus text-emerald-500 mr-2"></i>
                New Member Enrollment
              </h3>
              {(() => {
                const monthOrder = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const currentYear = new Date().getFullYear();
                const enrollment = {};
                monthOrder.forEach((m) => {
                  enrollment[`${m} ${currentYear}`] = { month: m, year: currentYear, newMembers: 0, male: 0, female: 0 };
                });
                members.filter((m) => m.member_type === "new").forEach((m) => {
                  const joined = m.date_joined || m.timestamp;
                  if (!joined) return;
                  const d = new Date(joined);
                  if (d.getFullYear() !== currentYear) return;
                  const mKey = d.toLocaleDateString('en-US', { month: 'long' });
                  const fullKey = `${mKey} ${currentYear}`;
                  if (!enrollment[fullKey]) {
                    enrollment[fullKey] = { month: mKey, year: currentYear, newMembers: 0, male: 0, female: 0 };
                  }
                  enrollment[fullKey].newMembers += 1;
                  if (m.gender === "Male") enrollment[fullKey].male += 1;
                  else enrollment[fullKey].female += 1;
                });
                const newMemberData = monthOrder.map((m) => enrollment[`${m} ${currentYear}`]).filter((d) => d.newMembers > 0 || monthOrder.indexOf(d.month) <= new Date().getMonth());
                const totalNew = members.filter((m) => m.member_type === "new").length;
                const yearNewMale = members.filter((m) => m.member_type === "new" && m.gender === "Male").length;
                const yearNewFemale = members.filter((m) => m.member_type === "new" && m.gender === "Female").length;
                if (newMemberData.length === 0) return (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">No new member data available</div>
                  </div>
                );
                return (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border-l-4 border-emerald-500 border dark:border-gray-600 mb-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-emerald-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white">New Members - {new Date().getFullYear()}</h4>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-emerald-600">{totalNew}</div>
                            <div className="text-xs text-gray-500">Total New</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-blue-500">{yearNewMale}</div>
                            <div className="text-xs text-gray-500">Male</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-pink-500">{yearNewFemale}</div>
                            <div className="text-xs text-gray-500">Female</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg border border-gray-100 dark:border-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newMemberData.map((d, i) => (
                          <div key={i} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center border border-emerald-100 dark:border-emerald-800">
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{d.newMembers}</div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400">{d.month}</div>
                            <div className="flex justify-center gap-2 mt-1">
                              <span className="text-[10px] text-blue-600 dark:text-blue-400">{d.male}M</span>
                              <span className="text-[10px] text-pink-600 dark:text-pink-400">{d.female}F</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </LocalDashboardLayout>
  );
}
