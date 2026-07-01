"use client";

import { useState } from "react";
import PersonalInfoSection from "./PersonalInfoSection";
import ChurchInfoSection from "./ChurchInfoSection";

export default function BulkAddForm({
  isBulkMode,
  onAddMember,
  onSubmitSingle,
}) {
  const [currentSection, setCurrentSection] = useState("personal");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    email: "",
    date_of_birth: "",
    place_of_residence: "",
    residential_address: "",
    profession: "",
    hometown: "",
    relative_contact: "",
    membership_status: "Active",
    position: "",
    is_executive: false,
    executive_position: "",
    executive_level: "district",
    local_executive_position: "",
    district_executive_position: "",
    congregation: "",
    confirmation: "",
    baptism: "",
    communicant: "",
  });

  const resetForm = () => {
    setCurrentMember({
      first_name: "",
      last_name: "",
      phone_number: "",
      gender: "",
      email: "",
      date_of_birth: "",
      place_of_residence: "",
      residential_address: "",
      profession: "",
      hometown: "",
      relative_contact: "",
      membership_status: "Active",
      position: "",
      is_executive: false,
      executive_position: "",
      executive_level: "district",
      local_executive_position: "",
      district_executive_position: "",
      congregation: "",
      confirmation: "",
      baptism: "",
      communicant: "",
    });
    setCurrentSection("personal");
  };

  const handleNextSection = () => {
    const personalFields = [
      "first_name",
      "last_name",
      "phone_number",
      "gender",
      "place_of_residence",
      "hometown",
      "relative_contact",
    ];
    const missingFields = personalFields.filter(
      (field) => !currentMember[field]
    );

    if (missingFields.length > 0) {
      onSubmitSingle(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }

    setCurrentSection("church");
  };

  const handlePrevSection = () => {
    setCurrentSection("personal");
  };

  const handleAddToList = () => {
    const churchFields = [
      "congregation",
      "confirmation",
      "baptism",
      "communicant",
    ];
    const missingFields = churchFields.filter((field) => !currentMember[field]);

    if (missingFields.length > 0) {
      onSubmitSingle(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }

    if (isBulkMode) {
      onAddMember(currentMember);
      resetForm();
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    handleSubmitSingle();
  };

  const handleSubmitSingle = async () => {
    try {
      // Map frontend fields to backend model fields
      const memberData = {
        ...currentMember,
        is_baptized:
          currentMember.baptism === "Yes" || currentMember.baptism === true,
        is_confirmed:
          currentMember.confirmation === "Yes" ||
          currentMember.confirmation === true,
        is_communicant:
          currentMember.communicant === "Yes" ||
          currentMember.communicant === true,
      };

      // Remove the old field names and frontend-only preview
      delete memberData.baptism;
      delete memberData.confirmation;
      delete memberData.communicant;
      delete memberData.profile_picture_preview;

      const hasProfilePicture = memberData.profile_picture instanceof File;
      let body;
      const headers = {
        "X-CSRFToken": getCookie("csrftoken"),
      };

      if (hasProfilePicture) {
        const formData = new FormData();
        const profilePictureFile = memberData.profile_picture;
        delete memberData.profile_picture;

        for (const [key, value] of Object.entries(memberData)) {
          if (value !== undefined && value !== null && value !== "") {
            formData.append(
              key,
              value === true ? "true" : value === false ? "false" : value
            );
          }
        }
        formData.append("profile_picture", profilePictureFile);
        body = formData;
      } else {
        delete memberData.profile_picture;
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(memberData);
      }

      console.log("BulkAddForm - Sending member data:", memberData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/add/`,
        {
          method: "POST",
          headers,
          body,
        }
      );

      if (response.ok) {
        const result = await response.json();
        onSubmitSingle("Single member added successfully!", "success");
        resetForm();

        // Redirect to local dashboard after successful addition
        setTimeout(() => {
          window.location.href = "/local/dashboard";
        }, 2000);
      } else {
        const errorData = await response.json();
        onSubmitSingle(errorData.message || "Error adding member", "error");
      }
    } catch (error) {
      onSubmitSingle("Error adding member. Please try again.", "error");
    }
  };

  // Function to get CSRF token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Add New Members
      </h3>

      {/* Section Navigation */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentSection === "personal" ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            <span className="text-sm font-medium">Section A</span>
            <span className="text-xs">Personal Info</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentSection === "church" ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            <span className="text-sm font-medium">Section B</span>
            <span className="text-xs">Church Info</span>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
        <p className="text-sm text-orange-600 dark:text-orange-300">
          <span className="font-medium">Note:</span> Fields marked with{" "}
          <span className="text-red-500 font-bold">*</span> are required and
          must be filled.
        </p>
      </div>

      {/* Section A: Personal Information */}
      {currentSection === "personal" && (
        <PersonalInfoSection
          currentMember={currentMember}
          setCurrentMember={setCurrentMember}
          onNext={handleNextSection}
        />
      )}

      {/* Section B: Church Information */}
      {currentSection === "church" && (
        <ChurchInfoSection
          currentMember={currentMember}
          setCurrentMember={setCurrentMember}
          onPrev={handlePrevSection}
          onAddToList={handleAddToList}
          isBulkMode={isBulkMode}
        />
      )}

      {/* Single Member Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Confirm Member Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Please review the details before submitting.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.first_name} {currentMember.last_name}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.phone_number}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.gender}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.email || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.date_of_birth || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Place of Residence</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.place_of_residence}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hometown</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.hometown}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Relative Contact</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.relative_contact}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Congregation</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.congregation}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Membership Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.membership_status}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Baptism</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.baptism}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Communicant</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentMember.communicant}
                  </p>
                </div>
              </div>
              {currentMember.profile_picture_preview && (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Profile Picture</p>
                  <img
                    src={currentMember.profile_picture_preview}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
