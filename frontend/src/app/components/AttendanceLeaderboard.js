"use client";
import { useState, useEffect } from "react";
import getDataStore from "../utils/dataStore";

export default function AttendanceLeaderboard({ type = "weekly" }) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch leaderboard data from data store
    const fetchLeaderboardData = async () => {
      setLoading(true);

      try {
        const dataStore = getDataStore();
        const attendanceRecords = await dataStore.getAttendanceRecords();
        
        console.log("DEBUG: Raw attendance records for leaderboard:", attendanceRecords);
        console.log("DEBUG: Number of records:", attendanceRecords?.length || 0);

        if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
          console.log("DEBUG: No valid attendance records found for leaderboard");
          const emptyData = {
            currentWinners: [],
            previousWinner: null,
            showComparison: false,
            period: type === "weekly" ? "This Week" : "This Month",
            date:
              type === "weekly"
                ? `Week ${Math.ceil(new Date().getDate() / 7)}, ${new Date().getFullYear()}`
                : `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
          };
          setLeaderboardData(emptyData);
          setLoading(false);
          return;
        }

        // Filter records based on type (weekly or monthly)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentWeek = Math.ceil(currentDate.getDate() / 7);

        let filteredRecords = [];
        
        if (type === "weekly") {
          filteredRecords = attendanceRecords.filter(record => {
            if (!record || !record.date) return false;
            const recordDate = new Date(record.date);
            const recordWeek = Math.ceil(recordDate.getDate() / 7);
            return recordDate.getFullYear() === currentYear && 
                   recordDate.getMonth() === currentMonth && 
                   recordWeek === currentWeek;
          });
        } else if (type === "monthly") {
          filteredRecords = attendanceRecords.filter(record => {
            if (!record || !record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === currentYear && 
                   recordDate.getMonth() === currentMonth;
          });
        }

        console.log("DEBUG: Filtered records for", type, ":", filteredRecords);

        // Group by congregation and calculate totals
        const congregationTotals = {};
        
        filteredRecords.forEach(record => {
          if (record && record.congregation) {
            if (!congregationTotals[record.congregation]) {
              congregationTotals[record.congregation] = {
                congregation: record.congregation,
                male_count: 0,
                female_count: 0,
                total_count: 0
              };
            }
            
            congregationTotals[record.congregation].male_count += record.male || 0;
            congregationTotals[record.congregation].female_count += record.female || 0;
            congregationTotals[record.congregation].total_count += record.total || 0;
          }
        });

        // Sort by total_count and take top 3
        const currentWinners = Object.values(congregationTotals)
          .sort((a, b) => b.total_count - a.total_count)
          .slice(0, 3)
          .map((item, index) => ({
            ...item,
            rank: index + 1,
          }));

        console.log("DEBUG: Calculated leaderboard:", currentWinners);

        const transformedData = {
          currentWinners,
          previousWinner: null, // Will be implemented when we have historical data
          showComparison: false,
          period: type === "weekly" ? "This Week" : "This Month",
          date:
            type === "weekly"
              ? `Week ${currentWeek}, ${currentYear}`
              : `${new Date().toLocaleString("default", { month: "long" })} ${currentYear}`,
        };

        setLeaderboardData(transformedData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);

        // Show empty data instead of mock data
        const emptyData = {
          currentWinners: [],
          previousWinner: null,
          showComparison: false,
          period: type === "weekly" ? "This Week" : "This Month",
          date:
            type === "weekly"
              ? `Week ${Math.ceil(new Date().getDate() / 7)}, ${new Date().getFullYear()}`
              : `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
        };

        setLeaderboardData(emptyData);
      }

      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    fetchLeaderboardData();
  }, [type]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return null;
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center">
            <i className="fas fa-trophy text-yellow-500 text-xs"></i>
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-xs">
              1st
            </span>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center justify-center">
            <i className="fas fa-medal text-gray-400 text-xs"></i>
            <span className="text-gray-600 dark:text-gray-400 font-bold text-xs">
              2nd
            </span>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center justify-center">
            <i className="fas fa-award text-orange-500 text-xs"></i>
            <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">
              3rd
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            <i className="fas fa-trophy text-yellow-500 mr-3"></i>
            {type === "weekly" ? "Weekly" : "Monthly"} Attendance Leaderboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            {leaderboardData.period} • {leaderboardData.date}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Updated every{" "}
            {type === "weekly" ? "Monday 10:00 AM" : "1st of month 10:00 AM"}
          </div>
        </div>
      </div>

      {/* Current Winners */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Top 3 Congregations
        </h3>
        {leaderboardData.currentWinners.map((winner, index) => (
          <div
            key={winner.congregation}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border-2 ${
              winner.rank === 1
                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                : winner.rank === 2
                  ? "border-gray-300 bg-gray-50 dark:bg-gray-700"
                  : "border-orange-200 bg-orange-50 dark:bg-orange-900/20"
            }`}
          >
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex-shrink-0">
                {getRankBadge(winner.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                  {winner.congregation}
                </h4>
              </div>
            </div>

            {/* Attendance numbers on the right */}
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 justify-end">
              <span className="whitespace-nowrap">
                <i className="fas fa-mars text-orange-500 mr-1"></i>
                {winner.male_count} Male
              </span>
              <span className="whitespace-nowrap">
                <i className="fas fa-venus text-pink-500 mr-1"></i>
                {winner.female_count} Female
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                <i className="fas fa-users mr-1"></i>
                {winner.total_count} Total
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Previous Winner Comparison */}
      {leaderboardData.showComparison && leaderboardData.previousWinner && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Previous {type === "weekly" ? "Week" : "Month"} Winner
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate mb-1">
                  {leaderboardData.previousWinner.congregation}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {leaderboardData.previousWinner.period}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 justify-end">
                <span className="whitespace-nowrap">
                  <i className="fas fa-mars text-orange-500 mr-1"></i>
                  {leaderboardData.previousWinner.male_count} Male
                </span>
                <span className="whitespace-nowrap">
                  <i className="fas fa-venus text-pink-500 mr-1"></i>
                  {leaderboardData.previousWinner.female_count} Female
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                  <i className="fas fa-users mr-1"></i>
                  {leaderboardData.previousWinner.total_count} Total
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-2 sm:space-y-0">
          <div>
            <i className="fas fa-info-circle mr-1"></i>
            Comparison will be removed in{" "}
            {type === "weekly" ? "2 days" : "5 days"}
          </div>
          <div>
            <i className="fas fa-calendar mr-1"></i>
            Next update:{" "}
            {type === "weekly"
              ? "Next Monday 10:00 AM"
              : "1st of next month 10:00 AM"}
          </div>
        </div>
      </div>
    </div>
  );
}
