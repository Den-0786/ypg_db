"use client";

export default function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  genderFilter,
  setGenderFilter,
  clearSearch,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Section */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by name or gender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-orange-400 dark:hover:border-orange-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </span>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setGenderFilter("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                genderFilter === "all"
                  ? "bg-white dark:bg-gray-600 text-orange-500 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setGenderFilter("male")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                genderFilter === "male"
                  ? "bg-white dark:bg-gray-600 text-orange-500 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <i className="fas fa-male mr-1"></i>
              Male
            </button>
            <button
              onClick={() => setGenderFilter("female")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                genderFilter === "female"
                  ? "bg-white dark:bg-gray-600 text-orange-500 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <i className="fas fa-female mr-1"></i>
              Female
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
