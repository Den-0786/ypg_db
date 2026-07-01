'use client';
export default function AttendanceSummaryCards({ attendanceStats }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between min-w-max p-1 gap-4">
        {/* Total Male Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-300/5 dark:from-blue-300/10 dark:to-blue-200/10 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <i className="fas fa-male text-blue-500 dark:text-blue-400 text-xl"></i>
              </div>
              <div className="text-right">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Male
                </div>
                <div className="text-gray-900 dark:text-white text-2xl font-bold">
                  {attendanceStats.totalMale.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {attendanceStats.weeksLogged}/{attendanceStats.totalWeeks} weeks
              </div>
              <div className="text-blue-500 dark:text-blue-400 font-semibold">
                {Math.round(
                  (attendanceStats.weeksLogged / attendanceStats.totalWeeks) *
                    100
                )}
                %
              </div>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(attendanceStats.weeksLogged / attendanceStats.totalWeeks) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Female Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-300/5 dark:from-pink-300/10 dark:to-pink-200/10 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100/30 dark:bg-pink-400/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-100/30 dark:bg-pink-400/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-3">
                <i className="fas fa-female text-pink-600 dark:text-pink-400 text-xl"></i>
              </div>
              <div className="text-right">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Female
                </div>
                <div className="text-gray-900 dark:text-white text-2xl font-bold">
                  {attendanceStats.totalFemale.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {attendanceStats.weeksLogged}/{attendanceStats.totalWeeks} weeks
              </div>
              <div className="text-pink-600 dark:text-pink-400 font-semibold">
                {Math.round(
                  (attendanceStats.weeksLogged / attendanceStats.totalWeeks) *
                    100
                )}
                %
              </div>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(attendanceStats.weeksLogged / attendanceStats.totalWeeks) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Grand Total Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-300/5 dark:from-green-300/10 dark:to-green-200/10 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/30 dark:bg-green-400/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-100/30 dark:bg-green-400/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                <i className="fas fa-users text-green-600 dark:text-green-400 text-xl"></i>
              </div>
              <div className="text-right">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Grand Total
                </div>
                <div className="text-gray-900 dark:text-white text-2xl font-bold">
                  {(
                    attendanceStats.totalMale + attendanceStats.totalFemale
                  ).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {attendanceStats.weeksLogged}/{attendanceStats.totalWeeks} weeks
              </div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {Math.round(
                  (attendanceStats.weeksLogged / attendanceStats.totalWeeks) *
                    100
                )}
                %
              </div>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(attendanceStats.weeksLogged / attendanceStats.totalWeeks) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
