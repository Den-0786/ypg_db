"use client";

export default function ExecutivesTable({
  executives,
  selectedMembers,
  onView,
  onEdit,
  onDelete,
  onSelect,
  searchTerm,
  onSearchChange,
  currentPage,
  onPageChange,
  membersPerPage,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedMembers.length === executives.length &&
                      executives.length > 0
                    }
                    onChange={() => {
                      if (selectedMembers.length === executives.length) {
                        onSelect([]);
                      } else {
                        onSelect(executives.map((member) => member.id));
                      }
                    }}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mr-2"
                  />
                  Name
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Position
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Level
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Congregation
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Gender
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Communicant
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Baptism
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {executives && executives.length > 0 ? (
              executives.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => {
                          if (selectedMembers.includes(member.id)) {
                            onSelect(
                              selectedMembers.filter((id) => id !== member.id)
                            );
                          } else {
                            onSelect([...selectedMembers, member.id]);
                          }
                        }}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mr-3"
                      />
                      {member.profile_picture ? (
                        <img
                          src={
                            member.profile_picture.startsWith("http")
                              ? member.profile_picture
                              : `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${member.profile_picture}`
                          }
                          alt={member.name}
                          className="flex-shrink-0 h-10 w-10 rounded-full object-cover mr-3 border border-gray-200"
                        />
                      ) : (
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center mr-3`}
                        >
                          <span className="text-sm font-medium text-white">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {member.executive_position || member.position || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.executive_level === "local" ||
                        member.executive_level === "Local"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : member.executive_level === "district" ||
                              member.executive_level === "District"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : member.executive_level === "both"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {member.executive_level || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {member.congregation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {member.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.communicant === "Yes" ||
                        member.is_communicant === true
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {member.communicant ||
                        (member.is_communicant ? "Yes" : "No")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.baptism === "Yes" || member.is_baptized === true
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {member.baptism || (member.is_baptized ? "Yes" : "No")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.membership_status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {member.membership_status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3 sm:space-x-2">
                      <button
                        onClick={() => onView(member)}
                        className="text-orange-500 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-2 rounded"
                        title="View Details"
                      >
                        <i className="fas fa-eye mr-1"></i>View
                      </button>
                      <button
                        onClick={() => onEdit(member)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded"
                        title="Edit Member"
                      >
                        <i className="fas fa-edit mr-1"></i>Edit
                      </button>
                      <button
                        onClick={() => onDelete(member)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded"
                        title="Delete Member"
                      >
                        <i className="fas fa-trash mr-1"></i>Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No executives match your search criteria. Try adjusting
                      your search terms or filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
