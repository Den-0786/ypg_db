"use client";
export default function ChurchInfoSection({
  currentMember,
  setCurrentMember,
  onPrev,
  onAddToList,
  isBulkMode,
}) {
  // Function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Handle input change with capitalization
  const handleInputChange = (field, value) => {
    const capitalizedValue = capitalizeWords(value);
    setCurrentMember({
      ...currentMember,
      [field]: capitalizedValue,
    });
  };

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
      evangelism_coordinator: "Evangelism Coordinator",
    };
    return positionMap[position] || position;
  };

  return (
    <div className="space-y-4 neumorphic-light dark:neumorphic-dark p-6">
      <h4 className="text-md font-semibold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-2">
        Section B: Church Information
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Congregation <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={currentMember.congregation}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                congregation: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            required
          >
            <option value="" className="text-light-text dark:text-dark-text">
              Select Congregation
            </option>
            <option
              value="Emmanuel Congregation Ahinsan"
              className="text-light-text dark:text-dark-text"
            >
              Emmanuel Congregation Ahinsan
            </option>
            <option
              value="Peniel Congregation Esreso No1"
              className="text-light-text dark:text-dark-text"
            >
              Peniel Congregation Esreso No1
            </option>
            <option
              value="Mizpah Congregation Odagya No1"
              className="text-light-text dark:text-dark-text"
            >
              Mizpah Congregation Odagya No1
            </option>
            <option
              value="Christ Congregation Ahinsan Estate"
              className="text-light-text dark:text-dark-text"
            >
              Christ Congregation Ahinsan Estate
            </option>
            <option
              value="Ebenezer Congregation Dompoase Aprabo"
              className="text-light-text dark:text-dark-text"
            >
              Ebenezer Congregation Dompoase Aprabo
            </option>
            <option
              value="Favour Congregation Esreso No2"
              className="text-light-text dark:text-dark-text"
            >
              Favour Congregation Esreso No2
            </option>
            <option
              value="Liberty Congregation Esreso High Tension"
              className="text-light-text dark:text-dark-text"
            >
              Liberty Congregation Esreso High Tension
            </option>
            <option
              value="Odagya No2"
              className="text-light-text dark:text-dark-text"
            >
              Odagya No2
            </option>
            <option value="NOM" className="text-light-text dark:text-dark-text">
              NOM
            </option>
            <option
              value="Kokobriko"
              className="text-light-text dark:text-dark-text"
            >
              Kokobriko
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Position
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_executive_inline"
                checked={currentMember.is_executive}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    is_executive: e.target.checked,
                    executive_level: e.target.checked ? "local" : "",
                    position: e.target.checked ? currentMember.position : "",
                  })
                }
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_executive_inline"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                Executive
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentMember.is_executive ? (
              <select
                value={currentMember.local_executive_position}
                onChange={(e) => {
                  const position = e.target.value;
                  const positionDisplay = getExecutivePositionDisplay(position);
                  setCurrentMember({
                    ...currentMember,
                    local_executive_position: position,
                    executive_position: position,
                    position: positionDisplay,
                  });
                }}
                className="flex-1 px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
              >
                <option value="" className="text-gray-800 dark:text-white">
                  Select Position
                </option>
                <option
                  value="president"
                  className="text-gray-800 dark:text-white"
                >
                  President
                </option>
                <option
                  value="vice_president"
                  className="text-gray-800 dark:text-white"
                >
                  Vice President
                </option>
                <option
                  value="secretary"
                  className="text-gray-800 dark:text-white"
                >
                  Secretary
                </option>
                <option
                  value="assistant_secretary"
                  className="text-gray-800 dark:text-white"
                >
                  Assistant Secretary
                </option>
                <option
                  value="financial_secretary"
                  className="text-gray-800 dark:text-white"
                >
                  Financial Secretary
                </option>
                <option
                  value="treasurer"
                  className="text-gray-800 dark:text-white"
                >
                  Treasurer
                </option>
                <option
                  value="organizer"
                  className="text-gray-800 dark:text-white"
                >
                  Organizer
                </option>
                <option
                  value="evangelism_coordinator"
                  className="text-gray-800 dark:text-white"
                >
                  Evangelism Coordinator
                </option>
              </select>
            ) : (
              <input
                type="text"
                value={currentMember.position}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    position: e.target.value,
                  })
                }
                className="flex-1 px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
                placeholder="Member, Elder, etc."
              />
            )}
          </div>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Membership Status
          </label>
          <select
            value={currentMember.membership_status}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                membership_status: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
          >
            <option value="Active" className="text-gray-800 dark:text-white">
              Active
            </option>
            <option value="Inactive" className="text-gray-800 dark:text-white">
              Inactive
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmation <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={currentMember.confirmation}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                confirmation: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            required
          >
            <option value="" className="text-gray-800 dark:text-white">
              Select Confirmation Status
            </option>
            <option value="Yes" className="text-gray-800 dark:text-white">
              Yes
            </option>
            <option value="No" className="text-gray-800 dark:text-white">
              No
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Baptism <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={currentMember.baptism}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                baptism: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            required
          >
            <option value="" className="text-gray-800 dark:text-white">
              Select Baptism Status
            </option>
            <option value="Yes" className="text-gray-800 dark:text-white">
              Yes
            </option>
            <option value="No" className="text-gray-800 dark:text-white">
              No
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Communicant <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={currentMember.communicant}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                communicant: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            required
          >
            <option value="" className="text-gray-800 dark:text-white">
              Select Communicant Status
            </option>
            <option value="Yes" className="text-gray-800 dark:text-white">
              Yes
            </option>
            <option value="No" className="text-gray-800 dark:text-white">
              No
            </option>
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="px-6 py-2 bg-light-text-secondary hover:bg-light-text dark:bg-dark-text-secondary dark:hover:bg-dark-text text-white rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 transition-all duration-200 flex items-center neumorphic-light dark:neumorphic-dark hover:shadow-lg"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          <span>Previous Section</span>
        </button>
        <button
          onClick={onAddToList}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center neumorphic-light dark:neumorphic-dark hover:shadow-lg"
        >
          <i className="fas fa-plus mr-2"></i>
          <span>{isBulkMode ? "Add to List" : "Submit Member"}</span>
        </button>
      </div>
    </div>
  );
}
