"use client";
import { useState, useEffect } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import BulkEditModal from "../../components/BulkEditModal";
import PinModal from "../../components/PinModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import { useToast, ToastContainer } from "../../components/Toast";
import getDataStore from "../../utils/dataStore";

export default function LocalMembersPage() {
  // Get congregation info from localStorage
  const congregationId =
    typeof window !== "undefined"
      ? localStorage.getItem("congregationId")
      : null;
  const congregationName =
    typeof window !== "undefined"
      ? localStorage.getItem("congregationName")
      : null;
  const [mounted, setMounted] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState({});
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // State for real data
  const [members, setMembers] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalMale: 0,
    totalFemale: 0,
    communicant: 0,
    confirmed: 0,
    baptism: 0,
    activeGuilders: 0,
    distantGuilders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
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
    congregation: congregationName || "",
    position: "",
    membership_status: "",
    confirmation: "",
    baptism: "",
    communicant: "",
    is_executive: false,
    executive_position: "",
    executive_level: "",
    profile_picture: null,
    profile_picture_preview: null,
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  // Fetch data for congregation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchMembers = async () => {
        if (congregationName && congregationId) {
          try {
            setLoading(true);
            // Get members for this congregation
            const dataStore = getDataStore();
            const allMembers = await dataStore.getMembers({
              congregation: congregationId,
            });

            if (allMembers.length > 0) {
              console.log("Sample member fields:", {
                phone: allMembers[0].phone,
                phone_number: allMembers[0].phone_number,
                gender: allMembers[0].gender,
                membership_status: allMembers[0].membership_status,
                status: allMembers[0].status,
                is_communicant: allMembers[0].is_communicant,
                communicant: allMembers[0].communicant,
                is_baptized: allMembers[0].is_baptized,
                baptism: allMembers[0].baptism,
              });
            }

            if (Array.isArray(allMembers)) {
              // Separate executives from regular members
              const executivesList = allMembers.filter(
                (member) => member.is_executive
              );
              const regularMembers = allMembers.filter(
                (member) => !member.is_executive
              );

              // Set members data (only non-executives)
              setMembers(regularMembers);
              setExecutives(executivesList);

              // Calculate statistics
              const totalMembers = allMembers.length;
              const totalMale = allMembers.filter(
                (m) => m.gender === "Male"
              ).length;
              const totalFemale = allMembers.filter(
                (m) => m.gender === "Female"
              ).length;
              const communicant = allMembers.filter(
                (m) => m.communicant === "Yes"
              ).length;
              const confirmed = allMembers.filter(
                (m) => m.confirmation === "Yes"
              ).length;
              const baptism = allMembers.filter(
                (m) => m.baptism === "Yes"
              ).length;
              const activeGuilders = allMembers.filter(
                (m) => m.status === "Active"
              ).length;
              const distantGuilders = allMembers.filter(
                (m) => m.status === "Inactive"
              ).length;

              setStats({
                totalMembers,
                totalMale,
                totalFemale,
                communicant,
                confirmed,
                baptism,
                activeGuilders,
                distantGuilders,
              });
            } else {
              console.error("getMembers did not return an array:", allMembers);
              setMembers([]);
              setExecutives([]);
            }
          } catch (error) {
            console.error("Error fetching members:", error);
            setMembers([]);
            setExecutives([]);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };

      fetchMembers();
    }
  }, [congregationName, congregationId]);

  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 15;

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleEditMember = (member) => {
    setPendingAction({ type: "edit", member });
    setPinModalConfig({
      title: "Edit Member",
      message: `Please enter your PIN to edit ${member.name || `${member.first_name} ${member.last_name}`}`,
      type: "edit",
    });
    setPinModalOpen(true);
  };

  const handleEditMemberConfirm = (member) => {
    setEditForm({
      first_name: member.first_name || member.name?.split(" ")[0] || "",
      last_name:
        member.last_name || member.name?.split(" ").slice(1).join(" ") || "",
      phone_number: member.phone_number || member.phone || "",
      gender: member.gender || "",
      email: member.email || member.emailAddress || "",
      date_of_birth: member.date_of_birth || member.dateOfBirth || "",
      place_of_residence: member.place_of_residence || member.residence || "",
      residential_address:
        member.residential_address || member.residentialAddress || "",
      profession: member.profession || member.occupation || "",
      hometown: member.hometown || "",
      relative_contact: member.relative_contact || member.emergencyPhone || "",
      congregation: member.congregation || "",
      position: member.position || "",
      membership_status: member.membership_status || member.status || "",
      confirmation: member.confirmation || member.confirmant || "",
      baptism: member.baptism || "",
      communicant: member.communicant || member.attends_communion || "",
      is_executive: member.is_executive || false,
      executive_position: member.executive_position || "",
      executive_level: member.executive_level || "",
      profile_picture: null,
      profile_picture_preview: member.profile_picture || null,
    });
    setEditFormErrors({});
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member) => {
    setPendingAction({ type: "delete", member });
    setPinModalConfig({
      title: "Delete Member",
      message: `Please enter your PIN to delete ${member.name || `${member.first_name} ${member.last_name}`}`,
      type: "delete",
    });
    setPinModalOpen(true);
  };

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMembers(executives.map((member) => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedMembers.length === 0) {
      showError("Please select members to delete");
      return;
    }

    const selectedNames = executives
      .filter((member) => selectedMembers.includes(member.id))
      .map(
        (member) => member.name || `${member.first_name} ${member.last_name}`
      )
      .join(", ");

    setPendingAction({ type: "bulk_delete", memberIds: selectedMembers });
    setPinModalConfig({
      title: "Delete Selected Members",
      message: `Please enter your PIN to delete ${selectedMembers.length} selected member(s)`,
      type: "delete",
    });
    setPinModalOpen(true);
  };

  const handleBulkEdit = () => {
    if (selectedMembers.length === 0) {
      showError("Please select members to edit");
      return;
    }
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = (updatedMembers) => {
    // Update the executives array with the new data
    const updatedExecutives = executives.map((member) => {
      const updatedMember = updatedMembers.find((m) => m.id === member.id);
      if (updatedMember) {
        // Map the updated fields to the local member structure
        return {
          ...member,
          status: updatedMember.membership_status || member.status,
          position: updatedMember.executive_position || member.position,
          communicant:
            updatedMember.attends_communion === "true"
              ? "Yes"
              : updatedMember.attends_communion === "false"
                ? "No"
                : member.communicant,
        };
      }
      return member;
    });

    // In a real app, you would update the state here
    setSelectedMembers([]);
    showSuccess(`${selectedMembers.length} member(s) updated successfully!`);
  };

  // Filter and search executives
  const filteredExecutives = executives.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.gender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender =
      genderFilter === "all" || member.gender.toLowerCase() === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Filter and search members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.gender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender =
      genderFilter === "all" || member.gender.toLowerCase() === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Function to get initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to get color based on name
  const getInitialsColor = (name) => {
    const colors = [
      "bg-orange-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Mock congregation data
  const [congregation, setCongregation] = useState({
    name: congregationName || "Emmanuel Congregation Ahinsan",
    location: "Ahinsan, Kumasi",
    established: "1995",
    pastor: "Rev. John Mensah",
    contact: "+233 24 123 4567",
  });

  const [editCongregationForm, setEditCongregationForm] = useState({
    name: "",
    location: "",
    established: "",
    pastor: "",
    contact: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update congregation name when it changes
  useEffect(() => {
    if (congregationName) {
      setCongregation((prev) => ({
        ...prev,
        name: congregationName,
      }));
    }
  }, [congregationName]);

  const handleEditClick = () => {
    setEditCongregationForm(congregation);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setCongregation(editCongregationForm);
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const handlePinConfirm = () => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case "edit":
        handleEditMemberConfirm(pendingAction.member);
        break;
      case "delete":
        // Show confirmation modal for single member delete
        setDeleteConfirmConfig({
          type: "single",
          itemName:
            pendingAction.member.name ||
            `${pendingAction.member.first_name} ${pendingAction.member.last_name}`,
          onConfirm: async () => {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${pendingAction.member.id}/delete/`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                  },
                }
              );

              if (response.ok) {
                const responseData = await response.json();
                const filteredMembers = members.filter(
                  (m) => m.id !== pendingAction.member.id
                );
                console.log(
                  "Deleting member with ID:",
                  pendingAction.member.id
                );
                console.log("Members before delete:", members.length);
                console.log("Members after delete:", filteredMembers.length);
                setMembers(filteredMembers);
                showSuccess(
                  `${pendingAction.member.name || `${pendingAction.member.first_name} ${pendingAction.member.last_name}`} deleted successfully!`
                );
              } else {
                const errorData = await response.json();
                showError(errorData.error || "Failed to delete member");
              }
            } catch (error) {
              console.error("Error deleting member:", error);
              showError("Failed to delete member");
            }
            setPendingAction(null);
          },
        });
        setDeleteConfirmModalOpen(true);
        break;
      case "bulk_delete":
        // Show confirmation modal for bulk delete
        setDeleteConfirmConfig({
          type: "bulk",
          itemCount: pendingAction.memberIds.length,
          onConfirm: async () => {
            try {
              const deletePromises = pendingAction.memberIds.map((id) =>
                fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${id}/delete/`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRFToken": getCookie("csrftoken"),
                    },
                  }
                )
              );

              const responses = await Promise.all(deletePromises);
              const allSuccessful = responses.every((response) => response.ok);

              if (allSuccessful) {
                const updatedMembers = members.filter(
                  (member) => !pendingAction.memberIds.includes(member.id)
                );
                setMembers(updatedMembers);
                setSelectedMembers([]);
                showSuccess(
                  `${pendingAction.memberIds.length} member(s) deleted successfully!`
                );
              } else {
                showError("Failed to delete some members");
              }
            } catch (error) {
              console.error("Error deleting members:", error);
              showError("Failed to delete members");
            }
            setPendingAction(null);
          },
        });
        setDeleteConfirmModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handlePinClose = () => {
    setPinModalOpen(false);
    setPendingAction(null);
    setPinModalConfig({});
  };

  const handleSaveMemberEdit = async () => {
    try {
      setLoading(true);

      const dataStore = getDataStore();
      await dataStore.updateMember(selectedMember.id, editForm);

      // Update local state
      const updatedExecutives = executives.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              first_name: editForm.first_name,
              last_name: editForm.last_name,
              name: `${editForm.first_name} ${editForm.last_name}`.trim(),
              phone_number: editForm.phone_number,
              phone: editForm.phone_number,
              gender: editForm.gender,
              email: editForm.email,
              emailAddress: editForm.email,
              date_of_birth: editForm.date_of_birth,
              dateOfBirth: editForm.date_of_birth,
              place_of_residence: editForm.place_of_residence,
              residence: editForm.place_of_residence,
              residential_address: editForm.residential_address,
              residentialAddress: editForm.residential_address,
              profession: editForm.profession,
              occupation: editForm.profession,
              hometown: editForm.hometown,
              relative_contact: editForm.relative_contact,
              emergencyPhone: editForm.relative_contact,
              congregation: editForm.congregation,
              position: editForm.position,
              membership_status: editForm.membership_status,
              status: editForm.membership_status,
              confirmation: editForm.confirmation,
              confirmant: editForm.confirmation,
              baptism: editForm.baptism,
              communicant: editForm.communicant,
              attends_communion: editForm.communicant,
              is_executive: editForm.is_executive,
              executive_position: editForm.executive_position,
              executive_level: editForm.executive_level,
              profile_picture: editForm.profile_picture instanceof File
                ? editForm.profile_picture_preview
                : (editForm.profile_picture_preview || member.profile_picture),
            }
          : member
      );

      // Update members list
      const updatedMembers = members.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              ...editForm,
              profile_picture: editForm.profile_picture instanceof File
                ? editForm.profile_picture_preview
                : (editForm.profile_picture_preview || member.profile_picture),
            }
          : member
      );

      setExecutives(updatedExecutives);
      setMembers(updatedMembers);
      setShowEditModal(false);
      showSuccess("Member updated successfully!");
    } catch (error) {
      console.error("Error updating member:", error);
      showError("Failed to update member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <LocalDashboardLayout currentPage="Members">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </LocalDashboardLayout>
    );
  }

  return (
    <LocalDashboardLayout
      currentPage="Members"
      selectedMembers={selectedMembers}
      onDeleteSelected={handleDeleteSelected}
      onBulkEdit={handleBulkEdit}
    >
      <div className="space-y-6">
        {/* Congregation Card */}
        <div className="bg-gradient-to-r from-orange-500 to-purple-600 dark:from-orange-600 dark:to-purple-700 rounded-xl shadow-xl overflow-hidden relative">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <i className="fas fa-church text-white text-2xl lg:text-3xl mr-3"></i>
                  <h1 className="text-xl lg:text-3xl font-bold text-white">
                    {congregationName || "Local Congregation"}
                  </h1>
                  <button
                    onClick={handleEditClick}
                    className="ml-3 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                    title="Edit congregation information"
                  >
                    <i className="fas fa-edit text-white text-sm"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-white/90 text-sm lg:text-base">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                    <span>System Active</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-calendar mr-2"></i>
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">Local</div>
                  <div className="text-white font-semibold">Dashboard</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">Status</div>
                  <div className="text-green-300 font-semibold">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="flex gap-4 min-w-max">
            {/* Total Members */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-500/5 dark:from-orange-400/20 dark:to-orange-500/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Total Members
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalMembers}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-users text-xl lg:text-2xl text-orange-500 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Total Male */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-500/5 dark:from-orange-400/20 dark:to-orange-500/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Total Male
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalMale}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-male text-xl lg:text-2xl text-orange-500 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Total Female */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-pink-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-600/5 dark:from-pink-400/20 dark:to-pink-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Total Female
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalFemale}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-female text-xl lg:text-2xl text-pink-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Communicant */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-purple-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-600/5 dark:from-purple-400/20 dark:to-purple-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Communicant
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.communicant}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-cross text-xl lg:text-2xl text-purple-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Confirmed */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-600/5 dark:from-orange-400/20 dark:to-orange-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Confirmed
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.confirmed}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-hands text-xl lg:text-2xl text-orange-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Baptism */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-indigo-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/5 to-indigo-600/5 dark:from-indigo-400/20 dark:to-indigo-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Baptism
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.baptism}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-water text-xl lg:text-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Active Guilders */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-teal-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/5 to-teal-600/5 dark:from-teal-400/20 dark:to-teal-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Active Guilders
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeGuilders}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-user-check text-xl lg:text-2xl text-teal-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            {/* Distant Guilders */}
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-cyan-500/20 relative overflow-hidden group rounded-lg p-4 lg:p-6 min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-cyan-600/5 dark:from-cyan-400/20 dark:to-cyan-600/20 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Distant Guilders
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.distantGuilders}
                  </p>
                </div>
                <div className="ml-3 lg:ml-4">
                  <i className="fas fa-user-clock text-xl lg:text-2xl text-cyan-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Card */}
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

        {/* Executives Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-users text-orange-500 mr-2"></i>
              Congregation Executives
            </h3>
          </div>
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
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mr-2"
                      />
                      Name
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Member ID
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
                {filteredExecutives.length > 0 ? (
                  filteredExecutives.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => handleSelectMember(member.id)}
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
                              className={`flex-shrink-0 h-10 w-10 rounded-full ${getInitialsColor(member.name)} flex items-center justify-center mr-3`}
                            >
                              <span className="text-sm font-medium text-white">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {member.member_id ? (
                          <span className="inline-flex px-2 py-1 text-xs font-mono font-semibold rounded bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-600">
                            {member.member_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not set</span>
                        )}
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
                            (member.is_communicant ? "Yes" : "No") ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.baptism === "Yes" ||
                            member.is_baptized === true
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {member.baptism ||
                            (member.is_baptized ? "Yes" : "No") ||
                            "N/A"}
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
                          {member.membership_status ||
                            member.status ||
                            "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3 sm:space-x-2">
                          <button
                            onClick={() => handleViewDetails(member)}
                            className="text-orange-500 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-2 rounded"
                            title="View Details"
                          >
                            <i className="fas fa-eye mr-1"></i>View
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded"
                            title="Edit Member"
                          >
                            <i className="fas fa-edit mr-1"></i>Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
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
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No results found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          No executives match your search criteria. Try
                          adjusting your search terms or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-users text-green-500 mr-2"></i>
              Congregation Members
            </h3>
          </div>
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
                          selectedMembers.length === filteredMembers.length &&
                          filteredMembers.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers(
                              filteredMembers.map((member) => member.id)
                            );
                          } else {
                            setSelectedMembers([]);
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
                {currentMembers.length > 0 ? (
                  currentMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => handleSelectMember(member.id)}
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
                              className={`flex-shrink-0 h-10 w-10 rounded-full ${getInitialsColor(member.name)} flex items-center justify-center mr-3`}
                            >
                              <span className="text-sm font-medium text-white">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {member.member_id ? (
                          <span className="inline-flex px-2 py-1 text-xs font-mono font-semibold rounded bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-600">
                            {member.member_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {member.phone || member.phone_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {member.gender || "N/A"}
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
                            (member.is_communicant ? "Yes" : "No") ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.baptism === "Yes" ||
                            member.is_baptized === true
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {member.baptism ||
                            (member.is_baptized ? "Yes" : "No") ||
                            "N/A"}
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
                          {member.membership_status ||
                            member.status ||
                            "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3 sm:space-x-2">
                          <button
                            onClick={() => handleViewDetails(member)}
                            className="text-orange-500 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-2 rounded"
                            title="View Details"
                          >
                            <i className="fas fa-eye mr-1"></i>View
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded"
                            title="Edit Member"
                          >
                            <i className="fas fa-edit mr-1"></i>Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
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
                      <div className="flex flex-col items-center justify-center">
                        <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No members found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          No congregation members found. Try adjusting your
                          search terms or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredMembers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)}{" "}
                of {filteredMembers.length} members
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    currentPage === 1
                      ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          page === currentPage
                            ? "bg-orange-500 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    currentPage === totalPages
                      ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Next
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Details Modal */}
        {showDetailsModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {selectedMember.profile_picture ? (
                    <img
                      src={selectedMember.profile_picture}
                      alt={selectedMember.name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-orange-200 shadow"
                    />
                  ) : (
                    <div className={`h-14 w-14 rounded-full ${getInitialsColor(selectedMember.name)} flex items-center justify-center shadow`}>
                      <span className="text-lg font-bold text-white">{getInitials(selectedMember.name)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedMember.name}
                    </h3>
                    {selectedMember.member_id && (
                      <span className="inline-flex px-2 py-0.5 text-xs font-mono font-semibold rounded bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-600 mt-1">
                        {selectedMember.member_id}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Personal & Contact Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div>
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                            <i className="fas fa-user text-orange-500 dark:text-orange-400 text-sm sm:text-base"></i>
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
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
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
                  <div className="bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-900/20 dark:to-orange-900/20 rounded-xl p-4 sm:p-6">
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
                                {congregationName ||
                                  "Emmanuel Congregation Ahinsan"}
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

                  {/* Quick Actions Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 mt-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                        <i className="fas fa-tools text-gray-600 dark:text-gray-400 text-sm sm:text-base"></i>
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Quick Actions
                      </h4>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <button
                        onClick={() => handleEditMember(selectedMember)}
                        className="flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit Member
                      </button>

                      <button
                        onClick={() =>
                          window.open(
                            `tel:${selectedMember.phoneNumber}`,
                            "_blank"
                          )
                        }
                        className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                      >
                        <i className="fas fa-phone mr-2"></i>
                        Call Member
                      </button>

                      <button
                        onClick={() =>
                          window.open(
                            `sms:${selectedMember.phoneNumber}`,
                            "_blank"
                          )
                        }
                        className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                      >
                        <i className="fas fa-envelope mr-2"></i>
                        Send SMS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Congregation Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Congregation Information
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Congregation Name
                  </label>
                  <input
                    type="text"
                    value={editCongregationForm.name}
                    onChange={(e) =>
                      setEditCongregationForm({
                        ...editCongregationForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editCongregationForm.location}
                    onChange={(e) =>
                      setEditCongregationForm({
                        ...editCongregationForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Established Year
                  </label>
                  <input
                    type="text"
                    value={editCongregationForm.established}
                    onChange={(e) =>
                      setEditCongregationForm({
                        ...editCongregationForm,
                        established: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pastor
                  </label>
                  <input
                    type="text"
                    value={editCongregationForm.pastor}
                    onChange={(e) =>
                      setEditCongregationForm({
                        ...editCongregationForm,
                        pastor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={editCongregationForm.contact}
                    onChange={(e) =>
                      setEditCongregationForm({
                        ...editCongregationForm,
                        contact: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    <i className="fas fa-edit text-orange-500 mr-2"></i>
                    Edit Member - {selectedMember.name}
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-camera text-gray-500 mr-2"></i>
                      Profile Picture
                    </h4>
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0">
                        {editForm.profile_picture_preview ? (
                          <img
                            src={
                              editForm.profile_picture instanceof File
                                ? URL.createObjectURL(editForm.profile_picture)
                                : editForm.profile_picture_preview
                            }
                            alt="Preview"
                            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className={`h-24 w-24 rounded-full ${getInitialsColor(editForm.first_name + " " + editForm.last_name || "Member")} flex items-center justify-center border-4 border-white shadow-lg`}>
                            <span className="text-2xl font-bold text-white">
                              {getInitials(`${editForm.first_name} ${editForm.last_name}`) || "?"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Upload Photo <span className="text-gray-400 text-xs">(JPG, PNG)</span>
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditForm({ ...editForm, profile_picture: file, profile_picture_preview: URL.createObjectURL(file) });
                            }
                          }}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-300 cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to keep existing photo</p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-user text-orange-500 mr-2"></i>
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              first_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              last_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone_number}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              phone_number: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0XXXXXXXXX"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={editForm.gender}
                          onChange={(e) =>
                            setEditForm({ ...editForm, gender: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={editForm.date_of_birth}
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
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
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
                          value={editForm.place_of_residence}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              place_of_residence: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          value={editForm.residential_address}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              residential_address: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Residential address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={editForm.profession}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              profession: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Student, Teacher, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hometown <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.hometown}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              hometown: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Hometown"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relative Contact{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={editForm.relative_contact}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              relative_contact: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0XXXXXXXXX"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Church Information Section */}
                  <div className="bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-900/20 dark:to-orange-900/20 rounded-xl p-6">
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
                          value={editForm.congregation}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              congregation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Congregation</option>
                          <option value="Ahinsan Branch">Ahinsan Branch</option>
                          <option value="Kokomlemle Branch">
                            Kokomlemle Branch
                          </option>
                          <option value="Adabraka Branch">
                            Adabraka Branch
                          </option>
                          <option value="Kaneshie Branch">
                            Kaneshie Branch
                          </option>
                          <option value="Mamprobi Branch">
                            Mamprobi Branch
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={editForm.position}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              position: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Member, Elder, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Membership Status
                        </label>
                        <select
                          value={editForm.membership_status}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              membership_status: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          value={editForm.confirmation}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              confirmation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          value={editForm.baptism}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              baptism: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          value={editForm.communicant}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              communicant: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            checked={editForm.is_executive}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                is_executive: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
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
                                value={editForm.executive_level}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    executive_level: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="">Select Level</option>
                                <option value="Local">Local</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMemberEdit}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          selectedMembers={selectedMembers}
          onSave={handleBulkEditSave}
          members={executives}
        />

        {/* PIN Modal */}
        <PinModal
          isOpen={pinModalOpen}
          onClose={handlePinClose}
          onConfirm={handlePinConfirm}
          title={pinModalConfig.title}
          message={pinModalConfig.message}
          type={pinModalConfig.type}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteConfirmModalOpen}
          onClose={() => setDeleteConfirmModalOpen(false)}
          onConfirm={deleteConfirmConfig.onConfirm}
          type={deleteConfirmConfig.type}
          itemName={deleteConfirmConfig.itemName}
          itemCount={deleteConfirmConfig.itemCount}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </LocalDashboardLayout>
  );
}
