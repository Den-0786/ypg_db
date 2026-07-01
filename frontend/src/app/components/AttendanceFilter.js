"use client";
import { useState, useEffect } from "react";

export default function AttendanceFilter({
  handleLogAttendance,
  handleJointProgram,
  onFilterChange,
}) {
  const [weekFilter, setWeekFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Set current week, month, and year as defaults
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");

    // Calculate current week of the month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentWeekOfMonth = Math.ceil(
      (now.getDate() + firstDayOfMonth.getDay()) / 7
    );
    const currentWeek = `week-${currentWeekOfMonth}`;

    setWeekFilter(currentWeek);
    setMonthFilter(currentMonth);
    setYearFilter(currentYear);

    // Notify parent component of initial filter values
    if (onFilterChange) {
      onFilterChange({
        week: currentWeek,
        month: currentMonth,
        year: currentYear,
      });
    }
  }, [onFilterChange]);

  const handleWeekChange = (value) => {
    setWeekFilter(value);
    if (onFilterChange) {
      onFilterChange({
        week: value,
        month: monthFilter,
        year: yearFilter,
      });
    }
  };

  const handleMonthChange = (value) => {
    setMonthFilter(value);
    if (onFilterChange) {
      onFilterChange({
        week: weekFilter,
        month: value,
        year: yearFilter,
      });
    }
  };

  const handleYearChange = (value) => {
    setYearFilter(value);
    if (onFilterChange) {
      onFilterChange({
        week: weekFilter,
        month: monthFilter,
        year: value,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col sm:flex-row flex-wrap gap-2 items-center">
      <div className="w-full max-w-xs sm:w-40">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Week
        </label>
        <select
          value={weekFilter}
          onChange={(e) => handleWeekChange(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
          aria-label="Filter by week"
        >
          <option value="">All Weeks</option>
          <option value="week-1">Week 1</option>
          <option value="week-2">Week 2</option>
          <option value="week-3">Week 3</option>
          <option value="week-4">Week 4</option>
          <option value="week-5">Week 5</option>
        </select>
      </div>

      <div className="flex flex-row gap-2 w-full sm:w-auto">
        <div className="w-full max-w-xs sm:w-28">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Month
          </label>
          <select
            value={monthFilter}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
            aria-label="Filter by month"
          >
            <option value="">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        <div className="w-full max-w-xs sm:w-28">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Year
          </label>
          <select
            value={yearFilter}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
            aria-label="Filter by year"
          >
            <option value="">All Years</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={handleLogAttendance}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 w-full sm:w-auto text-sm"
        >
          <i className="fas fa-plus mr-2"></i>
          Log Attendance
        </button>
        <button
          onClick={handleJointProgram}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200 w-full sm:w-auto text-sm"
        >
          <i className="fas fa-handshake mr-2"></i>
          Joint Program
        </button>
      </div>
    </div>
  );
}
