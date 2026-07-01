export default function MemberList({ members, onRemoveMember, onSubmitBulk }) {
  const getExecutivePositionDisplay = (position) => {
    const positionMap = {
      president: "President",
      vice_president: "Vice President",
      secretary: "Secretary",
      assistant_secretary: "Assistant Secretary",
      financial_secretary: "Financial Secretary",
      treasurer: "Treasurer",
      organizer: "Organizer",
      evangelism: "Evangelism",
    };
    return positionMap[position] || position;
  };

  return (
    <div className="space-y-4 neumorphic-light dark:neumorphic-dark p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-2">
          Members List ({members.length})
        </h4>
        <button
          onClick={onSubmitBulk}
          disabled={members.length === 0}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 flex items-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-upload mr-2"></i>
          <span>Submit All Members</span>
        </button>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="border border-light-border dark:border-dark-border rounded-lg p-4 bg-light-surface dark:bg-dark-surface hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-light-accent dark:bg-dark-accent rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-semibold text-light-text dark:text-dark-text">
                      {member.first_name} {member.last_name}
                    </h5>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {member.phone_number} • {member.congregation}
                    </p>
                    {member.is_executive && (
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                        {getExecutivePositionDisplay(member.executive_position)}
                        {member.executive_level &&
                          ` (${member.executive_level})`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemoveMember(member.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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
          <i className="fas fa-users text-4xl text-light-text-secondary dark:text-dark-text-secondary mb-4"></i>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            No members added yet. Add members to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
