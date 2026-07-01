"use client";
import { useState } from "react";

export default function YearlyAttendanceCards({
  currentYearData,
  onEditMonth,
  onDeleteMonth,
}) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleViewMonth = (monthData, index) => {
    setSelectedMonth({ ...monthData, monthNumber: index + 1 });
    setShowViewModal(true);
  };

  const handleEditMonth = (monthData, index) => {
    if (onEditMonth) {
      onEditMonth({ ...monthData, monthNumber: index + 1 });
    }
  };

  const handleDeleteMonth = (monthData, index) => {
    if (onDeleteMonth) {
      onDeleteMonth({ ...monthData, monthNumber: index + 1 });
    } else {
      // Fallback for backward compatibility
      setSelectedMonth({ ...monthData, monthNumber: index + 1 });
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (onDeleteMonth) {
      onDeleteMonth(selectedMonth);
    } else {
      // Fallback for backward compatibility
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Month attendance deleted successfully!", "success");
      }
    }
    setShowDeleteModal(false);
    setSelectedMonth(null);
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getMonthColorClasses = (index) => {
    const colorClasses = [
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
      "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
      "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    ];
    return colorClasses[index % colorClasses.length];
  };

  const getMonthTextColor = (index) => {
    const textColors = [
      "text-blue-500 dark:text-blue-400",
      "text-green-600 dark:text-green-400",
      "text-purple-600 dark:text-purple-400",
      "text-blue-700 dark:text-blue-400",
      "text-red-600 dark:text-red-400",
      "text-indigo-600 dark:text-indigo-400",
      "text-pink-600 dark:text-pink-400",
      "text-teal-600 dark:text-teal-400",
      "text-yellow-600 dark:text-yellow-400",
      "text-gray-600 dark:text-gray-400",
      "text-cyan-600 dark:text-cyan-400",
      "text-emerald-600 dark:text-emerald-400",
    ];
    return textColors[index % textColors.length];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="fas fa-calendar text-indigo-500 mr-2"></i>
          {currentYearData.year} - Monthly Attendance Overview
        </h3>
      </div>
      <div className="p-6">
        {/* Year Summary - Fixed at top */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-chart-line text-indigo-500 mr-3"></i>
              <div>
                <div className="text-gray-900 dark:text-white font-semibold">
                  {currentYearData.year} Annual Summary
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Attendance: {currentYearData.totalAttendance}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-sm">
                <span className="text-blue-500 dark:text-blue-400 font-semibold">
                  {currentYearData.totalMale}M
                </span>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <span className="text-pink-600 dark:text-pink-400 font-semibold">
                  {currentYearData.totalFemale}F
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Cards - Single row horizontal scroll */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          <div className="flex gap-2 min-w-[2200px]">
            {currentYearData.months.map((monthData, index) => {
              const colorClasses = getMonthColorClasses(index);
              const textColor = getMonthTextColor(index);
              // Use the actual month name from the data, or fallback to array index
              let monthName =
                monthData.monthName || monthData.month || monthNames[index];

              // Convert full month names to short names if needed
              if (monthName && monthName.length > 3) {
                const fullMonthNames = [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ];
                const monthIndex = fullMonthNames.indexOf(monthName);
                if (monthIndex !== -1) {
                  monthName = monthNames[monthIndex];
                }
              }

              return (
                <div
                  key={index}
                  className={`rounded-lg p-4 border relative group ${colorClasses} w-64 flex-shrink-0`}
                >
                  <div className="flex items-center justify-between">
                    {/* Month Label - Left */}
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${textColor}`}>
                        {monthName}
                      </div>
                    </div>

                    {/* Attendance Counts - Center */}
                    <div className="text-center">
                      <div className="text-gray-900 dark:text-white text-lg font-bold">
                        {monthData.total || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">
                        {monthData.male || 0}M / {monthData.female || 0}F
                      </div>
                    </div>

                    {/* Action Buttons - Right */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewMonth(monthData, index)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="View Details"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleEditMonth(monthData, index)}
                        className="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
                        title="Edit"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteMonth(monthData, index)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-eye text-blue-500 mr-2"></i>
                  {monthNames[selectedMonth.monthNumber - 1]} Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Month:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {monthNames[selectedMonth.monthNumber - 1]}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {selectedMonth.total || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Male:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMonth.male || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Female:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMonth.female || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                  Delete {monthNames[selectedMonth.monthNumber - 1]}
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 mr-2"></i>
                    <div>
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                        Are you sure you want to delete this month&apos;s
                        attendance record?
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        This action cannot be undone. The attendance data for
                        {monthNames[selectedMonth.monthNumber - 1]} will be
                        permanently removed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Record Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMonth.total || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Male:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMonth.male || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Female:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMonth.female || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
