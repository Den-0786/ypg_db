"use client";
export default function AttendanceForDayCard({
  selectedDate,
  onEdit,
  onDelete,
  attendanceData = { male: 0, female: 0, total: 0 },
  serviceTime = "9:00 AM",
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-calendar-day text-green-500 mr-2"></i>
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
              title="Edit Attendance"
            >
              <i className="fas fa-edit text-lg"></i>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Delete Attendance"
            >
              <i className="fas fa-trash text-lg"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-[800px]">
            {/* Male Attendance */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 w-64 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-lg p-2">
                    <i className="fas fa-male text-blue-500 dark:text-blue-400 text-lg"></i>
                  </div>
                  <div className="text-blue-500 dark:text-blue-400 text-sm font-medium">
                    Male
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white text-xl font-bold">
                  {attendanceData.male || 0}
                </div>
                <div className="text-blue-500 dark:text-blue-400 text-xs">
                  <i className="fas fa-users mr-1"></i>
                  Present
                </div>
              </div>
            </div>

            {/* Female Attendance */}
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800 w-64 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-pink-100 dark:bg-pink-800 rounded-lg p-2">
                    <i className="fas fa-female text-pink-600 dark:text-pink-400 text-lg"></i>
                  </div>
                  <div className="text-pink-600 dark:text-pink-400 text-sm font-medium">
                    Female
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white text-xl font-bold">
                  {attendanceData.female || 0}
                </div>
                <div className="text-pink-600 dark:text-pink-400 text-xs">
                  <i className="fas fa-users mr-1"></i>
                  Present
                </div>
              </div>
            </div>

            {/* Total Attendance */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 w-64 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 dark:bg-green-800 rounded-lg p-2">
                    <i className="fas fa-users text-green-600 dark:text-green-400 text-lg"></i>
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Total
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white text-xl font-bold">
                  {attendanceData.total || 0}
                </div>
                <div className="text-green-600 dark:text-green-400 text-xs">
                  <i className="fas fa-calendar-check mr-1"></i>
                  Today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <div className="flex items-center justify-center">
            <i className="fas fa-clock mr-2 text-blue-500"></i>
            <span>Service Time: {serviceTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
