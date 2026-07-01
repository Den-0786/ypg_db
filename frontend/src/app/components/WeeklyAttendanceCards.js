"use client";
import { useState } from "react";

export default function WeeklyAttendanceCards({
  currentMonthData,
  onDeleteWeek,
  onEditWeek,
}) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const handleViewWeek = (week, index) => {
    setSelectedWeek({ ...week, weekNumber: index + 1 });
    setShowViewModal(true);
  };

  const handleDeleteWeek = (week, index) => {
    if (onDeleteWeek) {
      onDeleteWeek({ ...week, weekNumber: index + 1 });
    } else {
      // Fallback for backward compatibility
      setSelectedWeek({ ...week, weekNumber: index + 1 });
      setShowDeleteModal(true);
    }
  };

  const handleEditWeek = (week, index) => {
    if (onEditWeek) {
      onEditWeek({ ...week, weekNumber: index + 1 });
    }
  };

  const handleConfirmDelete = () => {
    if (onDeleteWeek) {
      onDeleteWeek(selectedWeek);
    } else {
      // Fallback for backward compatibility
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Week attendance deleted successfully!", "success");
      }
    }
    setShowDeleteModal(false);
    setSelectedWeek(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <i className="fas fa-calendar-week text-orange-500 mr-2"></i>
          {currentMonthData.month} {currentMonthData.year} - Weekly Attendance
        </h3>
      </div>
      <div className="p-6">
        {/* Month Summary - Fixed at top */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-chart-bar text-orange-500 mr-3"></i>
              <div>
                <div className="text-gray-900 dark:text-white font-semibold">
                  {currentMonthData.month} {currentMonthData.year} Summary
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Attendance: {currentMonthData.totalAttendance}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-sm">
                <span className="text-orange-500 dark:text-orange-400 font-semibold">
                  {currentMonthData.totalMale}M
                </span>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <span className="text-pink-600 dark:text-pink-400 font-semibold">
                  {currentMonthData.totalFemale}F
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Cards - Horizontal scroll */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          <div className="flex gap-2 min-w-[1320px]">
            {currentMonthData.weeks.map((week, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border relative group w-64 flex-shrink-0 ${
                  week.isJointProgram
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                    : index === 0
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      : index === 1
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : index === 2
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                          : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Week Label - Left */}
                  <div className="flex items-center">
                    <div
                      className={`text-sm font-medium ${
                        week.isJointProgram
                          ? "text-purple-600 dark:text-purple-400"
                          : index === 0
                            ? "text-orange-500 dark:text-orange-400"
                            : index === 1
                              ? "text-green-600 dark:text-green-400"
                              : index === 2
                                ? "text-purple-600 dark:text-purple-400"
                                : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {week.isJointProgram
                        ? "Joint Program"
                        : week.week || week.weekNumber || `Week ${index + 1}`}
                    </div>
                  </div>

                  {/* Attendance Counts - Center */}
                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white text-lg font-bold">
                      {week.isJointProgram ? "—" : week.total || 0}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">
                      {week.isJointProgram
                        ? week.programTitle || "Program"
                        : `${week.male || 0}M / ${week.female || 0}F`}
                    </div>
                  </div>

                  {/* Action Buttons - Right */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewWeek(week, index)}
                      className="p-2 text-gray-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
                      title="View Details"
                    >
                      <i className="fas fa-eye text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleEditWeek(week, index)}
                      className="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
                      title="Edit"
                    >
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteWeek(week, index)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-eye text-orange-500 mr-2"></i>
                  Week {selectedWeek.weekNumber} Details
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
                        Week:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        Week {selectedWeek.weekNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {selectedWeek.total || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Male:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedWeek.male || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Female:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedWeek.female || 0}
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
      {showDeleteModal && selectedWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                  Delete Week {selectedWeek.weekNumber}
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
                        Are you sure you want to delete this attendance record?
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        This action cannot be undone. The attendance data for
                        Week {selectedWeek.weekNumber} will be permanently
                        removed.
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
                        {selectedWeek.total || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Male:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedWeek.male || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Female:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedWeek.female || 0}
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
