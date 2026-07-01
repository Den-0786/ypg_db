"use client";
import { useState } from "react";

export default function LogAttendanceModal({
  showLogModal,
  logForm,
  handleInputChange,
  handleCloseLogModal,
  handleSubmitLog,
  editMode = false,
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!showLogModal) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                <i className="fas fa-calendar-plus text-green-500 mr-2"></i>
                {editMode ? "Edit Attendance" : "Log Attendance"}
              </h3>
              <button
                onClick={handleCloseLogModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Week
                </label>
                <select
                  value={logForm.week}
                  onChange={(e) => handleInputChange("week", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Week</option>
                  <option value="week-1">Week 1</option>
                  <option value="week-2">Week 2</option>
                  <option value="week-3">Week 3</option>
                  <option value="week-4">Week 4</option>
                  <option value="week-5">Week 5</option>
                </select>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={logForm.month}
                  onChange={(e) => handleInputChange("month", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Month</option>
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

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={logForm.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Year</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Male Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Male Count{" "}
                  <span className="text-gray-500 text-xs">
                    (at least one count required)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={logForm.male}
                  onChange={(e) =>
                    handleInputChange("male", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Female Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Female Count{" "}
                  <span className="text-gray-500 text-xs">
                    (at least one count required)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={logForm.female}
                  onChange={(e) =>
                    handleInputChange("female", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Total (Auto-calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total
                </label>
                <input
                  type="number"
                  value={logForm.total}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Logged By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logged By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={logForm.loggedBy}
                  onChange={(e) =>
                    handleInputChange("loggedBy", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={logForm.position}
                  onChange={(e) =>
                    handleInputChange("position", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Position</option>
                  <option value="President">President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Assistant Secretary">
                    Assistant Secretary
                  </option>
                  <option value="Financial Secretary">
                    Financial Secretary
                  </option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Evangelism Coordinator">
                    Evangelism Coordinator
                  </option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseLogModal}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                   // Validate required fields
                    if (!logForm.loggedBy.trim() || !logForm.position) {
                      window.showToast("Please fill in your name and position before continuing.", "error");
                      return;
                    }
                    if (logForm.male === 0 && logForm.female === 0) {
                      window.showToast("Please enter attendance counts (male and/or female) before continuing.", "error");
                      return;
                    }
                    setShowConfirmation(true);
                  }}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  Confirm Attendance
                </h3>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Attendance Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Week:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.week
                          ? logForm.week.replace("week-", "Week ")
                          : "Not selected"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Date:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.date || "Not selected"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Male:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.male}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Female:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.female}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                        {logForm.total}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Logged By:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.loggedBy || "Not specified"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Position:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {logForm.position || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Please review the attendance details above. Once
                      confirmed, this data will be logged and cannot be easily
                      modified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={() => {
                    handleSubmitLog();
                    setShowConfirmation(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
