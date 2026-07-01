"use client";

import { useState } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import BulkAddForm from "./components/BulkAddForm";
import MemberList from "./components/MemberList";
import ModeToggle from "./components/ModeToggle";
import ToastNotification from "./components/ToastNotification";

export default function LocalBulkAddPage() {
  const [members, setMembers] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  const handleAddMember = (member) => {
    setMembers([...members, { ...member, id: Date.now() }]);
    showToast("Member added to list successfully!", "success");
  };

  const handleRemoveMember = (id) => {
    setMembers(members.filter((member) => member.id !== id));
    showToast("Member removed from list", "success");
  };

  const handleSubmitBulk = async () => {
    if (members.length === 0) {
      showToast("Please add at least one member before submitting", "error");
      return;
    }

    try {
      // Map frontend fields to backend model fields for all members
      const mappedMembers = members.map((member) => {
        const mappedMember = {
          ...member,
          is_baptized: member.baptism === "Yes" || member.baptism === true,
          is_confirmed:
            member.confirmation === "Yes" || member.confirmation === true,
          is_communicant:
            member.communicant === "Yes" || member.communicant === true,
        };

        // Remove the old field names to avoid validation issues
        delete mappedMember.baptism;
        delete mappedMember.confirmation;
        delete mappedMember.communicant;

        return mappedMember;
      });

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
      const response = await fetch(`${base}/api/members/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ members: mappedMembers }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast("Members submitted successfully!", "success");
        setMembers([]);

        // Redirect to local dashboard after successful bulk addition
        setTimeout(() => {
          window.location.href = "/local/dashboard";
        }, 2000);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Error submitting members", "error");
      }
    } catch (error) {
      showToast("Error submitting members. Please try again.", "error");
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
    <LocalDashboardLayout
      currentPage="Members"
      headerAction={
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30 transition-all duration-200 hover:scale-105 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-200 font-medium">Added</span>
              <span className="text-lg font-bold text-blue-500">
                {members.length}
              </span>
              <i className="fas fa-user-plus text-white text-sm"></i>
            </div>
          </div>
        </div>
      }
    >
      {/* Toast Notification */}
      <ToastNotification toast={toast} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center flex-wrap">
              <i className="fas fa-users text-blue-500 mr-2 sm:mr-3 flex-shrink-0"></i>
              <span className="break-words">
                {isBulkMode
                  ? "Bulk Member Registration"
                  : "Single Member Registration"}
              </span>
            </h1>
            <div className="mt-2">
              <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-2">
                {isBulkMode
                  ? "Add multiple members to the system at once"
                  : "Add a single member to the system"}
              </p>
              <div className="flex justify-center sm:justify-end">
                <ModeToggle
                  isBulkMode={isBulkMode}
                  setIsBulkMode={setIsBulkMode}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Member Form */}
        <BulkAddForm
          isBulkMode={isBulkMode}
          onAddMember={handleAddMember}
          onSubmitSingle={showToast}
        />

        {/* Member List (only show in bulk mode) */}
        {isBulkMode && members.length > 0 && (
          <MemberList
            members={members}
            onRemoveMember={handleRemoveMember}
            onSubmitBulk={handleSubmitBulk}
          />
        )}
      </div>
    </LocalDashboardLayout>
  );
}
