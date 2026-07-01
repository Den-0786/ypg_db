'use client';
export default function MemberList({ members, onRemoveMember, onSubmitBulk }) {
  // Function to convert executive position value to display name
  const getExecutivePositionDisplay = (position) => {
    const positionMap = {
      president: "President",
      presidents_rep: "President's Rep",
      vice_president: "Vice President",
      secretary: "Secretary",
      assistant_secretary: "Assistant Secretary",
      financial_secretary: "Financial Secretary",
      treasurer: "Treasurer",
      organizer: "Organizer",
      youth_leader: "Youth Leader",
      choir_master: "Choir Master",
      usher: "Usher",
      protocol: "Protocol",
      security: "Security",
      maintenance: "Maintenance",
      welfare: "Welfare",
      education: "Education",
      evangelism: "Evangelism",
      children_ministry: "Children Ministry",
      women_fellowship: "Women Fellowship",
      men_fellowship: "Men Fellowship",
    };
    return positionMap[position] || position;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Members List ({members.length})
        </h3>
        <button
          onClick={onSubmitBulk}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
        >
          <i className="fas fa-paper-plane mr-2"></i>
          <span>Submit All Members</span>
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-500 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {member.first_name} {member.last_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.phone_number}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Gender:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.gender}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Email:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Residence:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.place_of_residence}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Relative Contact:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.relative_contact}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Hometown:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.hometown}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Profession:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.profession || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.membership_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Position:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.position || "Member"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Congregation:
                    </span>
                    <span className="ml-1 text-gray-600 dark:text-gray-400">
                      {member.congregation}
                    </span>
                  </div>
                </div>

                {/* Church Information */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Confirmation:
                      </span>
                      <span className="ml-1 text-gray-600 dark:text-gray-400">
                        {member.confirmation}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Baptism:
                      </span>
                      <span className="ml-1 text-gray-600 dark:text-gray-400">
                        {member.baptism}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Communicant:
                      </span>
                      <span className="ml-1 text-gray-600 dark:text-gray-400">
                        {member.communicant}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Information */}
                {member.is_executive && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Executive Information
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Position:
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {getExecutivePositionDisplay(
                              member.executive_position
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Level:
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {member.executive_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onRemoveMember(member.id)}
                className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                title="Remove member"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400">
            No members added yet. Start by filling out the form above.
          </p>
        </div>
      )}
    </div>
  );
}
