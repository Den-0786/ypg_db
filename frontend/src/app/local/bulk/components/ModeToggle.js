'use client';
export default function ModeToggle({ isBulkMode, setIsBulkMode }) {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setIsBulkMode(false)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
          !isBulkMode
            ? "bg-orange-500 text-white shadow-md"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <i className="fas fa-user mr-1"></i>
        <span>Single</span>
      </button>
      <button
        onClick={() => setIsBulkMode(true)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
          isBulkMode
            ? "bg-orange-500 text-white shadow-md"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <i className="fas fa-users mr-1"></i>
        <span>Bulk</span>
      </button>
    </div>
  );
}
