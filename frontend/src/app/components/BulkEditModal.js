"use client";
import { useState } from "react";

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedMembers,
  onSave,
  members,
}) {
  const [editData, setEditData] = useState({
    membership_status: "",
    executive_position: "",
    attends_communion: "",
    congregation: "",
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (Object.values(editData).every((value) => value === "")) {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please select at least one field to update", "error");
      }
      return;
    }

    const updatedMembers = members.map((member) => {
      if (selectedMembers.includes(member.id)) {
        const updates = {};

        // Map the edit data to the appropriate fields based on member structure
        if (editData.membership_status !== "") {
          updates.membership_status = editData.membership_status;
        }
        if (editData.executive_position !== "") {
          updates.executive_position = editData.executive_position;
        }
        if (editData.attends_communion !== "") {
          updates.attends_communion = editData.attends_communion;
        }
        if (editData.congregation !== "") {
          updates.congregation = editData.congregation;
        }

        return {
          ...member,
          ...updates,
        };
      }
      return member;
    });

    onSave(updatedMembers);
    onClose();
    setEditData({
      membership_status: "",
      executive_position: "",
      attends_communion: "",
      congregation: "",
    });
    setShowPreview(false);
  };

  const getSelectedMembersInfo = () => {
    return members.filter((member) => selectedMembers.includes(member.id));
  };

  const congregations = [
    ...new Set(
      members.map((m) => {
        // Handle both district and local member structures
        if (m.congregation && m.congregation.name) {
          return m.congregation.name;
        }
        // For local members, we'll use a default congregation since they're all from the same local congregation
        return "Local Congregation";
      })
    ),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-edit text-orange-500 mr-2"></i>
            Bulk Edit Members ({selectedMembers.length} selected)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Members Preview */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-2">
              Selected Members:
            </h4>
            <div className="flex flex-wrap gap-2">
              {getSelectedMembersInfo().map((member) => (
                <span
                  key={member.id}
                  className="bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-200 px-2 py-1 rounded text-xs"
                >
                  {member.first_name} {member.last_name}
                </span>
              ))}
            </div>
          </div>

          {/* Edit Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Membership Status
              </label>
              <select
                value={editData.membership_status}
                onChange={(e) =>
                  handleInputChange("membership_status", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No Change</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Executive Position
              </label>
              <select
                value={editData.executive_position}
                onChange={(e) =>
                  handleInputChange("executive_position", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No Change</option>
                <option value="President">President</option>
                <option value="Vice President">Vice President</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Organizer">Organizer</option>
                <option value="Member">Member</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Communicant Status
              </label>
              <select
                value={editData.attends_communion}
                onChange={(e) =>
                  handleInputChange("attends_communion", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No Change</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Congregation
              </label>
              <select
                value={editData.congregation}
                onChange={(e) =>
                  handleInputChange("congregation", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No Change</option>
                {congregations.map((congregation) => (
                  <option key={congregation} value={congregation}>
                    {congregation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-eye mr-2"></i>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Preview of Changes:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getSelectedMembersInfo().map((member) => {
                  const changes = [];
                  if (editData.membership_status)
                    changes.push(`Status: ${editData.membership_status}`);
                  if (editData.executive_position)
                    changes.push(`Position: ${editData.executive_position}`);
                  if (editData.attends_communion !== "")
                    changes.push(
                      `Communicant: ${editData.attends_communion === "true" ? "Yes" : "No"}`
                    );
                  if (editData.congregation)
                    changes.push(`Congregation: ${editData.congregation}`);

                  return (
                    <div
                      key={member.id}
                      className="text-xs bg-white dark:bg-gray-800 p-2 rounded border"
                    >
                      <span className="font-medium">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.name || "Unknown Member"}
                      </span>
                      {changes.length > 0 ? (
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          Will update: {changes.join(", ")}
                        </div>
                      ) : (
                        <div className="text-gray-400">No changes</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
