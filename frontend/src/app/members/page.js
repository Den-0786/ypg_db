"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import ExecutivesTable from "../components/ExecutivesTable";
import MembersTable from "../components/MembersTable";
import PinModal from "../components/PinModal";
import ToastContainer from "../components/ToastContainer";
import getDataStore from "../utils/dataStore";

export default function MembersPage() {
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.congregationId && user.congregationId !== "1") {
          window.location.href = "/local/members";
        }
      }
    } catch (e) {}
  }, []);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedExecutives, setSelectedExecutives] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [congregationFilter, setCongregationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage] = useState(10);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState({});
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalMale, setTotalMale] = useState(0);
  const [totalFemale, setTotalFemale] = useState(0);
  const [totalCongregations, setTotalCongregations] = useState(0);

  const [executiveView, setExecutiveView] = useState("district");
  const [congregationName, setCongregationName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("congregationName");
    }
    return null;
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const storedCongregationName = localStorage.getItem("congregationName");
    if (storedCongregationName) {
      setCongregationName(storedCongregationName);
    }
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const storedCongregationName = localStorage.getItem("congregationName");
      const allMembers = await getDataStore().getMembers();
      const cleanedMembers = allMembers.filter(
        (m) => (m.name || "").toLowerCase() !== "john doe"
      );
      console.log("DEBUG: storedCongregationName:", storedCongregationName);
      console.log("DEBUG: allMembers count:", allMembers.length);
      console.log("DEBUG: cleanedMembers count:", cleanedMembers.length);
      console.log("DEBUG: Sample member congregation:", cleanedMembers[0]?.congregation);
      let filteredMembers = cleanedMembers;
      if (
        storedCongregationName &&
        storedCongregationName !== "District Admin"
      ) {
        filteredMembers = cleanedMembers.filter(
          (member) =>
            member.congregation === storedCongregationName ||
            member.congregation === "District Office"
        );
      }
      console.log("DEBUG: filteredMembers count:", filteredMembers.length);
      console.log("DEBUG: Sample member is_executive:", filteredMembers[0]?.is_executive);

      const executivesList = filteredMembers.filter(
        (member) => member.is_executive
      );
      const regularMembers = filteredMembers.filter(
        (member) => !member.is_executive
      );

      console.log("DEBUG: executivesList count:", executivesList.length);
      console.log("DEBUG: regularMembers count:", regularMembers.length);

      setExecutives(executivesList);
      setMembers(regularMembers);
      console.log("DEBUG: District members data sample:", regularMembers[0]);
      console.log("DEBUG: Has profile_picture?", !!regularMembers[0]?.profile_picture);

      setTotalMembers(filteredMembers.length);
      setTotalMale(filteredMembers.filter((m) => m.gender === "Male").length);
      setTotalFemale(
        filteredMembers.filter((m) => m.gender === "Female").length
      );

      const congregations = new Set(filteredMembers.map((m) => m.congregation));
      setTotalCongregations(congregations.size);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
    }
  };

  const getFilteredExecutives = () => {
    if (executiveView === "district") {
      const districtExecs = executives.filter(
        (exec) =>
          exec.executive_level === "district" ||
          exec.executive_level === "District" ||
          exec.executive_level === "both"
      );
      return districtExecs;
    } else {
      const localExecs = executives.filter(
        (exec) =>
          exec.executive_level === "local" ||
          exec.executive_level === "Local" ||
          exec.executive_level === "both"
      );
      return localExecs;
    }
  };

  const getGroupedLocalExecutives = () => {
    const localExecutives = executives.filter(
      (exec) =>
        exec.executive_level === "local" ||
        exec.executive_level === "Local" ||
        exec.executive_level === "both"
    );
    const grouped = {};

    localExecutives.forEach((exec) => {
      if (!grouped[exec.congregation]) {
        grouped[exec.congregation] = [];
      }
      grouped[exec.congregation].push(exec);
    });

    return grouped;
  };
  const handleExecutiveViewToggle = () => {
    setExecutiveView(executiveView === "district" ? "local" : "district");
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    const currentExecutives = getFilteredExecutives();
    if (selectedMembers.length === currentExecutives.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(currentExecutives.map((member) => member.id));
    }
  };
  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setEditForm({
      first_name: member.first_name || member.name?.split(" ")[0] || "",
      last_name:
        member.last_name || member.name?.split(" ").slice(1).join(" ") || "",
      phone_number: member.phone_number || member.phone || "",
      email: member.email || "",
      gender: member.gender || "",
      congregation: member.congregation || "",
      membership_status: member.membership_status || member.status || "Active",
      is_executive: member.is_executive || false,
      executive_position: member.executive_position || member.position || "",
      executive_level: member.executive_level || "",
      district_executive_position: member.district_executive_position || "",
      date_of_birth: member.date_of_birth || member.dateOfBirth || "",
      place_of_residence: member.place_of_residence || member.residence || "",
      residential_address:
        member.residential_address || member.residentialAddress || "",
      hometown: member.hometown || "",
      relative_contact: member.relative_contact || member.emergencyPhone || "",
      profession: member.profession || member.occupation || "",
      baptism: member.baptism || (member.is_baptized ? "Yes" : "No"),
      confirmation: member.confirmation || (member.is_confirmed ? "Yes" : "No"),
      communicant: member.communicant || (member.is_communicant ? "Yes" : "No"),
    });
    setEditFormErrors({});
    setPendingAction("edit");
    setPinModalConfig({
      title: "Enter PIN for Edit Operation",
      description: "Please enter your PIN to confirm the edit operation",
      type: "edit",
    });
    setShowPinModal(true);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setPendingAction("delete");
    setPinModalConfig({
      title: "Enter PIN for Delete Operation",
      description: "Please enter your PIN to confirm the delete operation",
      type: "delete",
    });
    setShowPinModal(true);
  };
  const handlePinSuccess = () => {
    if (pendingAction === "edit") {
      setShowEditModal(true);
      setShowPinModal(false);
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          "PIN verified! You can now edit the member.",
          "success"
        );
      }
    } else if (pendingAction === "delete") {
      setDeleteConfirmConfig({
        title: "Confirm Delete",
        message: `Are you sure you want to delete ${selectedMember?.name}? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            const ds = getDataStore();
            setMembers((prev) =>
              prev.filter((m) => m.id !== selectedMember.id)
            );
            setExecutives((prev) =>
              prev.filter((m) => m.id !== selectedMember.id)
            );
            const removed = selectedMember;
            setTotalMembers((n) => Math.max(0, n - 1));
            if ((removed.gender || "").toLowerCase() === "male") {
              setTotalMale((n) => Math.max(0, n - 1));
            } else if ((removed.gender || "").toLowerCase() === "female") {
              setTotalFemale((n) => Math.max(0, n - 1));
            }

            await ds.deleteMember(selectedMember.id);

            if (typeof window !== "undefined" && window.showToast) {
              window.showToast("Member deleted successfully!", "success");
            }
          } catch (e) {
            if (typeof window !== "undefined" && window.showToast) {
              window.showToast("Failed to delete member", "error");
            }
          } finally {
            setDeleteConfirmModalOpen(false);
          }
        },
      });
      setDeleteConfirmModalOpen(true);
      setShowPinModal(false);
    }
  };

  const handleClosePinModal = () => {
    setShowPinModal(false);
    setPendingAction(null);
    setSelectedMember(null);
  };
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedMember(null);
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedMember(null);
    setEditForm({});
  };
  const handleSaveMemberEdit = async () => {
    try {
      setLoading(true);
      const dataStore = getDataStore();
      await dataStore.updateMember(selectedMember.id, editForm);
      const updatedMembers = members.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              first_name: editForm.first_name,
              last_name: editForm.last_name,
              name: `${editForm.first_name} ${editForm.last_name}`.trim(),
              phone_number: editForm.phone_number,
              phone: editForm.phone_number,
              email: editForm.email,
              gender: editForm.gender,
              congregation: editForm.congregation,
              membership_status: editForm.membership_status,
              status: editForm.membership_status,
              is_executive: editForm.is_executive,
              executive_position: editForm.executive_position,
              executive_level: editForm.executive_level,
              district_executive_position: editForm.district_executive_position,
              date_of_birth: editForm.date_of_birth,
              place_of_residence: editForm.place_of_residence,
              residential_address: editForm.residential_address,
              hometown: editForm.hometown,
              relative_contact: editForm.relative_contact,
              profession: editForm.profession,
              baptism: editForm.baptism,
              confirmation: editForm.confirmation,
              communicant: editForm.communicant,
              is_baptized: editForm.baptism === "Yes",
              is_confirmed: editForm.confirmation === "Yes",
              is_communicant: editForm.communicant === "Yes",
            }
          : member
      );

      setMembers(updatedMembers);
      setShowEditModal(false);
      setSelectedMember(null);
      setEditForm({});
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Member updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating member:", error);
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Failed to update member. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="Members">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="Members">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <i className="fas fa-users text-white text-2xl lg:text-3xl mr-3"></i>
                  <h1 className="text-xl lg:text-3xl font-bold text-white">
                    {congregationName
                      ? `${congregationName} Members`
                      : "Members Management"}
                    {/* Debug: {congregationName || 'null'} */}
                  </h1>
                </div>
                <p className="text-white/90 text-sm lg:text-base">
                  {congregationName
                    ? `Manage ${congregationName} members and executives`
                    : "Manage congregation members and executives"}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">Total</div>
                  <div className="text-white font-semibold">{totalMembers}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">
                    Congregations
                  </div>
                  <div className="text-blue-300 font-semibold">
                    {totalCongregations}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max md:grid md:grid-cols-4 md:min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[280px] md:min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <i className="fas fa-users text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalMembers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[280px] md:min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center w-12 h-12">
                    <i className="fas fa-male text-green-600 dark:text-green-400 text-lg"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Male
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalMale}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[280px] md:min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center w-12 h-12">
                    <i className="fas fa-female text-pink-600 dark:text-pink-400 text-lg"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Female
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalFemale}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[280px] md:min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <i className="fas fa-church text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Congregations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    10
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {executiveView === "district"
                ? "District Executives"
                : "Local Executives"}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                District
              </span>
              <button
                onClick={handleExecutiveViewToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  executiveView === "local"
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    executiveView === "local"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Local
              </span>
            </div>
          </div>

          {/* Executives Table */}
          {executiveView === "district" ? (
            <ExecutivesTable
              executives={getFilteredExecutives()}
              onView={handleViewDetails}
              onEdit={handleEditMember}
              onDelete={handleDeleteMember}
              onSelect={handleSelectMember}
              selectedMembers={selectedMembers}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              membersPerPage={membersPerPage}
            />
          ) : (
            <div>
              {Object.keys(getGroupedLocalExecutives()).length > 0 ? (
                Object.entries(getGroupedLocalExecutives()).map(
                  ([congregation, execs]) => (
                    <div key={congregation} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {congregation}
                      </h3>
                      <ExecutivesTable
                        executives={execs}
                        onView={handleViewDetails}
                        onEdit={handleEditMember}
                        onDelete={handleDeleteMember}
                        onSelect={handleSelectMember}
                        selectedMembers={selectedMembers}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        membersPerPage={membersPerPage}
                      />
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400">
                    No Local Executives Found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Congregation Members
          </h2>
          <MembersTable
            members={members}
            onView={handleViewDetails}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            onSelect={handleSelectMember}
            selectedMembers={selectedMembers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            membersPerPage={membersPerPage}
            handleSelectAll={handleSelectAll}
          />
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Member Details - {selectedMember.name}
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Personal & Contact Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-user text-blue-600 dark:text-blue-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Personal Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              First Name:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.name.split(" ")[0]}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Last Name:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.name
                                .split(" ")
                                .slice(1)
                                .join(" ")}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Date of Birth:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.date_of_birth || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Gender:
                            </label>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedMember.gender === "Male"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                              }`}
                            >
                              {selectedMember.gender}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-phone text-green-600 dark:text-green-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Contact Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Phone Number:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.phone ||
                                selectedMember.phone_number ||
                                "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Email Address:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.email || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Relative Contact:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.relative_contact || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Relative Phone:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.relative_contact || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address & Professional Information */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Address Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-map-marker-alt text-purple-600 dark:text-purple-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Address Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Hometown:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.hometown || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Place of Residence:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.place_of_residence || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Residential Address:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.residential_address || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-briefcase text-orange-600 dark:text-orange-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Professional Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Profession:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.profession || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Church & Religious Information */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Church Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-church text-indigo-600 dark:text-indigo-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Church Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Congregation:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.congregation || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Position:
                            </label>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedMember.position || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Membership Status:
                            </label>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedMember.status === "Active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {selectedMember.status ||
                                selectedMember.membership_status ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Religious Information */}
                    <div>
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <i className="fas fa-cross text-red-600 dark:text-red-400 text-sm sm:text-base"></i>
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Religious Information
                        </h4>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Confirmation:
                            </label>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedMember.confirmant === "Yes"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {selectedMember.confirmant ||
                                selectedMember.confirmation ||
                                "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Baptism:
                            </label>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedMember.baptism === "Yes"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {selectedMember.baptism}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                          <div className="flex justify-between items-center">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                              Communicant:
                            </label>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedMember.communicant === "Yes"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {selectedMember.communicant}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-edit text-blue-500 mr-2"></i>
                  Edit Member - {selectedMember.name}
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <i className="fas fa-user text-blue-500 mr-2"></i>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.first_name || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.last_name || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone_number || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0XXXXXXXXX"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.gender || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, gender: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editForm.date_of_birth || ""}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          if (selectedDate) {
                            const today = new Date();
                            const birthDate = new Date(selectedDate);
                            const age =
                              today.getFullYear() - birthDate.getFullYear();
                            const monthDiff =
                              today.getMonth() - birthDate.getMonth();

                            // Adjust age if birthday hasn't occurred this year
                            const actualAge =
                              monthDiff < 0 ||
                              (monthDiff === 0 &&
                                today.getDate() < birthDate.getDate())
                                ? age - 1
                                : age;

                            if (actualAge < 17) {
                              setEditFormErrors((prev) => ({
                                ...prev,
                                date_of_birth: "Age cannot be less than 17",
                              }));
                            } else if (actualAge > 30) {
                              setEditFormErrors((prev) => ({
                                ...prev,
                                date_of_birth: "Age cannot be more than 30",
                              }));
                            } else {
                              setEditFormErrors((prev) => ({
                                ...prev,
                                date_of_birth: "",
                              }));
                            }
                          } else {
                            setEditFormErrors((prev) => ({
                              ...prev,
                              date_of_birth: "",
                            }));
                          }

                          setEditForm({
                            ...editForm,
                            date_of_birth: selectedDate,
                          });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editFormErrors.date_of_birth
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      {editFormErrors.date_of_birth && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {editFormErrors.date_of_birth}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Place of Residence{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.place_of_residence || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            place_of_residence: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City/Town"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        value={editForm.residential_address || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            residential_address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Residential address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={editForm.profession || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            profession: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Student, Teacher, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hometown <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.hometown || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            hometown: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Hometown"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Relative Contact <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editForm.relative_contact || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            relative_contact: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0XXXXXXXXX"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Church Information Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <i className="fas fa-church text-indigo-500 mr-2"></i>
                    Church Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Congregation <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.congregation || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            congregation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Congregation</option>
                        <option value="Peniel Congregation Esreso No1">
                          Peniel Congregation Esreso No1
                        </option>
                        <option value="Christ Congregation Ahinsan Estate">
                          Christ Congregation Ahinsan Estate
                        </option>
                        <option value="Ebenezer Congregation Dompoase Aprabo">
                          Ebenezer Congregation Dompoase Aprabo
                        </option>
                        <option value="Mizpah Congregation Odagya No1">
                          Mizpah Congregation Odagya No1
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={editForm.position || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            position: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Member, Elder, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Membership Status
                      </label>
                      <select
                        value={editForm.membership_status || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            membership_status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmation <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.confirmation || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            confirmation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Confirmation Status</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Baptism <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.baptism || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            baptism: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Baptism Status</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Communicant <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.communicant || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            communicant: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Communicant Status</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Executive Information */}
                  <div className="mt-6">
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="is_executive"
                          checked={editForm.is_executive || false}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              is_executive: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="is_executive"
                          className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Is Executive Member
                        </label>
                      </div>

                      {editForm.is_executive && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Executive Level
                            </label>
                            <select
                              value={editForm.executive_level || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  executive_level: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Level</option>
                              <option value="local">Local</option>
                              <option value="district">District</option>
                              <option value="both">Both</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Executive Position
                            </label>
                            <input
                              type="text"
                              value={editForm.executive_position || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  executive_position: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="President, Secretary, etc."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              District Executive Position
                            </label>
                            <input
                              type="text"
                              value={editForm.district_executive_position || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  district_executive_position: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="District position"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMemberEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Modal */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Member Details - {selectedMember.name}
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Name:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMember.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMember.phone || selectedMember.phone_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMember.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Gender:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMember.gender}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Congregation:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMember.congregation}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Church Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedMember.status === "Active" ||
                          selectedMember.membership_status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedMember.status ||
                          selectedMember.membership_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Baptism:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedMember.baptism === "Yes" ||
                          selectedMember.is_baptized
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedMember.baptism ||
                          (selectedMember.is_baptized ? "Yes" : "No")}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Confirmation:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedMember.confirmation === "Yes" ||
                          selectedMember.is_confirmed
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedMember.confirmation ||
                          (selectedMember.is_confirmed ? "Yes" : "No")}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Communicant:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedMember.communicant === "Yes" ||
                          selectedMember.is_communicant
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedMember.communicant ||
                          (selectedMember.is_communicant ? "Yes" : "No")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={handleClosePinModal}
        onPinSuccess={handlePinSuccess}
        title={pinModalConfig.title}
        description={pinModalConfig.description}
        type={pinModalConfig.type}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmModalOpen}
        onClose={() => setDeleteConfirmModalOpen(false)}
        onConfirm={deleteConfirmConfig.onConfirm}
        title={deleteConfirmConfig.title}
        message={deleteConfirmConfig.message}
        confirmText={deleteConfirmConfig.confirmText}
        cancelText={deleteConfirmConfig.cancelText}
        type={deleteConfirmConfig.type}
        itemName={deleteConfirmConfig.itemName}
        itemCount={deleteConfirmConfig.itemCount}
      />

      {/* Toast Container */}
      <ToastContainer />
    </DashboardLayout>
  );
}
