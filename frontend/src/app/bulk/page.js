"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import PersonalInfoSection from "./components/PersonalInfoSection";
import ChurchInfoSection from "./components/ChurchInfoSection";
import MemberList from "./components/MemberList";
import ModeToggle from "./components/ModeToggle";
import ToastNotification from "./components/ToastNotification";

export default function BulkRegistrationPage() {
  // Redirect local users to local add member page
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.congregationId && user.congregationId !== "1") {
          window.location.href = "/local/bulk";
        }
      }
    } catch (e) {}
  }, []);
  const [selectedCongregation, setSelectedCongregation] = useState("");
  const [members, setMembers] = useState([]);
  const [currentSection, setCurrentSection] = useState("personal");
  const [isBulkMode, setIsBulkMode] = useState(false); // false for single, true for bulk
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
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
    executive_level: "",
    local_executive_position: "",
    district_executive_position: "",
    congregation: "",
    confirmation: "",
    baptism: "",
    communicant: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
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
      showToast(
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
      showToast(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }

    if (isBulkMode) {
      // Add to list for bulk submission
      setMembers([...members, { ...currentMember, id: Date.now() }]);
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
        executive_level: "",
        local_executive_position: "",
        district_executive_position: "",
        congregation: "",
        confirmation: "",
        baptism: "",
        communicant: "",
      });
      setCurrentSection("personal");
      showToast("Member added to list successfully!", "success");
    } else {
      // Submit single member immediately
      handleSubmitSingle();
    }
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
        // Remove the old field names
        baptism: undefined,
        confirmation: undefined,
        communicant: undefined,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/add/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify(memberData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        showToast("Single member added successfully!", "success");
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
          executive_level: "",
          local_executive_position: "",
          district_executive_position: "",
          congregation: "",
          confirmation: "",
          baptism: "",
          communicant: "",
        });
        setCurrentSection("personal");
      } else {
        const errorData = await response.json();
        console.error("Member add error:", errorData);
        if (errorData.errors) {
          // Show specific validation errors
          const errorMessages = Object.values(errorData.errors).flat();
          showToast(`Validation errors: ${errorMessages.join(", ")}`, "error");
        } else {
          showToast(
            errorData.message || errorData.error || "Error adding member",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting single member:", error);
      showToast("Error adding member. Please try again.", "error");
    }
  };

  const handleRemoveMember = (id) => {
    setMembers(members.filter((member) => member.id !== id));
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

  // Function to get CSRF token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  const handleSubmit = async () => {
    if (members.length === 0) {
      showToast("Please add at least one member before submitting", "error");
      return;
    }

    try {
      // Map frontend fields to backend model fields for all members
      const mappedMembers = members.map((member) => ({
        ...member,
        is_baptized: member.baptism === "Yes" || member.baptism === true,
        is_confirmed:
          member.confirmation === "Yes" || member.confirmation === true,
        is_communicant:
          member.communicant === "Yes" || member.communicant === true,
        // Remove the old field names
        baptism: undefined,
        confirmation: undefined,
        communicant: undefined,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/add/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ members: mappedMembers }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        showToast("Members submitted successfully!", "success");
        setMembers([]);
      } else {
        const errorData = await response.json();
        console.error("Bulk member add error:", errorData);
        if (errorData.errors) {
          // Show specific validation errors
          const errorMessages = Object.values(errorData.errors).flat();
          showToast(`Validation errors: ${errorMessages.join(", ")}`, "error");
        } else {
          showToast(
            errorData.message || errorData.error || "Error submitting members",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting members:", error);
      showToast("Error submitting members. Please try again.", "error");
    }
  };

  return (
    <DashboardLayout
      currentPage="Bulk Add"
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
      <ToastNotification toast={toast} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="neumorphic-light dark:neumorphic-dark p-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text flex items-center flex-wrap">
              <i className="fas fa-users text-light-accent dark:text-dark-accent mr-2 sm:mr-3 flex-shrink-0"></i>
              <span className="break-words">
                {isBulkMode
                  ? "Bulk Member Registration"
                  : "Single Member Registration"}
              </span>
            </h1>
            <div className="mt-2">
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-2">
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

        {/* Form Sections */}
        {currentSection === "personal" && (
          <PersonalInfoSection
            currentMember={currentMember}
            setCurrentMember={setCurrentMember}
            onNext={handleNextSection}
          />
        )}

        {currentSection === "church" && (
          <ChurchInfoSection
            currentMember={currentMember}
            setCurrentMember={setCurrentMember}
            onPrev={handlePrevSection}
            onAddToList={handleAddToList}
            isBulkMode={isBulkMode}
          />
        )}

        {/* Members List */}
        {isBulkMode && members.length > 0 && (
          <MemberList
            members={members}
            onRemoveMember={handleRemoveMember}
            onSubmitBulk={handleSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
