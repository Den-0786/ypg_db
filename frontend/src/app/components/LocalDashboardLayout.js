/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, useRef } from "react";
import LocalSidebar from "./LocalSidebar";
import ExportAnalyticsButton from "./ExportAnalyticsButton";
import PinModal from "./PinModal";
import { useTheme } from "./ThemeProvider";
import { useToast, ToastContainer } from "./Toast";

// Members Quick Actions Dropdown Component
function MembersQuickActionsDropdown({
  selectedMembers = [],
  onDeleteSelected = () => {},
  onBulkEdit = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const ref = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportModal(false);
      }
    }
    if (showExportModal)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportModal]);

  const handleExport = (format) => {
    if (format === "CSV") {
      exportSelectedToCSV();
    } else if (format === "Excel") {
      showToast("Excel export coming soon!", "success");
    } else if (format === "PDF") {
      showToast("PDF export coming soon!", "success");
    }
    setShowExportModal(false);
  };

  return (
    <>
      <div className="relative ml-2" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-blue-50 text-blue-700 rounded-lg shadow-sm border border-blue-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <i className="fas fa-bolt text-blue-500"></i>
          Quick Actions
          <i
            className={`fas fa-chevron-${open ? "up" : "down"} text-xs ml-1`}
          ></i>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2 animate-fadeIn">
            <a
              href="/local/members/add"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition"
            >
              <i className="fas fa-user-plus"></i> Add New Member
            </a>
            <a
              href="/local/bulk"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-800 focus:bg-green-100 dark:focus:bg-green-700 transition"
            >
              <i className="fas fa-users"></i> Bulk Import
            </a>
            <div className="relative">
              <button
                onClick={() => setShowExportModal(!showExportModal)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs sm:text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-800 focus:bg-purple-100 dark:focus:bg-purple-700 transition"
              >
                <div className="flex items-center gap-2">
                  <i className="fas fa-download"></i>
                  <span>Export Data As</span>
                </div>
                <i
                  className={`fas fa-chevron-${showExportModal ? "down" : "right"} text-xs`}
                ></i>
              </button>

              {/* Export Modal */}
              {showExportModal && (
                <div
                  ref={exportRef}
                  className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-3"
                  style={{
                    minWidth: "140px",
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                      Export As
                    </h3>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => handleExport("CSV")}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <i className="fas fa-file-csv text-green-600 text-xs"></i>
                      <span>CSV</span>
                    </button>

                    <button
                      onClick={() => handleExport("Excel")}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <i className="fas fa-file-excel text-green-600 text-xs"></i>
                      <span>Excel</span>
                    </button>

                    <button
                      onClick={() => handleExport("PDF")}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <i className="fas fa-file-pdf text-red-600 text-xs"></i>
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (selectedMembers.length > 0) {
                  onBulkEdit();
                }
              }}
              disabled={selectedMembers.length === 0}
              className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm transition ${
                selectedMembers.length === 0
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-800 focus:bg-yellow-100 dark:focus:bg-yellow-700"
              }`}
            >
              <i className="fas fa-edit"></i> Bulk Edit (
              {selectedMembers.length})
            </button>
            <button
              onClick={() => {
                if (selectedMembers.length > 0) {
                  onDeleteSelected();
                }
              }}
              disabled={selectedMembers.length === 0}
              className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm transition ${
                selectedMembers.length === 0
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800 focus:bg-red-100 dark:focus:bg-red-700"
              }`}
            >
              <i className="fas fa-trash"></i> Delete Selected (
              {selectedMembers.length})
            </button>
            <a
              href="/local/analytics"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-800 focus:bg-yellow-100 dark:focus:bg-yellow-700 transition rounded-b-lg"
            >
              <i className="fas fa-chart-bar"></i> View Analytics
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// Attendance Quick Actions Dropdown Component
function AttendanceQuickActionsDropdown() {
  const [open, setOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const ref = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportModal(false);
      }
    }
    if (showExportModal)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportModal]);

  const handleExport = (format) => {
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(
        `Attendance data exported as ${format.toUpperCase()}`,
        "success"
      );
    }
    setShowExportModal(false);
  };

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-blue-50 text-blue-700 rounded-lg shadow-sm border border-blue-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <i className="fas fa-bolt text-blue-500"></i>
        Quick Actions
        <i
          className={`fas fa-chevron-${open ? "up" : "down"} text-xs ml-1`}
        ></i>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2 animate-fadeIn">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.showToast) {
                window.showToast("All members marked as present", "success");
              }
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-800 focus:bg-green-100 dark:focus:bg-green-700 transition"
          >
            <i className="fas fa-check-circle"></i> Mark All Present
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.showToast) {
                window.showToast("All members marked as absent", "success");
              }
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800 focus:bg-red-100 dark:focus:bg-red-700 transition"
          >
            <i className="fas fa-times-circle"></i> Mark All Absent
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition"
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-download"></i>
                <span>Export Data As</span>
              </div>
              <i
                className={`fas fa-chevron-${showExportModal ? "down" : "right"} text-xs`}
              ></i>
            </button>

            {/* Export Modal */}
            {showExportModal && (
              <div
                ref={exportRef}
                className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-3"
                style={{
                  minWidth: "140px",
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                    Export As
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <i className="fas fa-file-csv text-green-500"></i>
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <i className="fas fa-file-pdf text-red-500"></i>
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <i className="fas fa-file-excel text-green-600"></i>
                    Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.showToast) {
                window.showToast("Attendance report generated", "success");
              }
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-800 focus:bg-purple-100 dark:focus:bg-purple-700 transition"
          >
            <i className="fas fa-chart-bar"></i> Generate Report
          </button>
        </div>
      )}
    </div>
  );
}

export default function LocalDashboardLayout({
  children,
  currentPage = "",
  currentPageProps = {},
  headerAction = null,
  selectedMembers = [],
  onDeleteSelected = () => {},
  onBulkEdit = () => {},
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme: globalTheme, setTheme: setGlobalTheme, mounted } = useTheme();
  const [theme, setTheme] = useState("light");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);
  const [securityMethod, setSecurityMethod] = useState("password"); // 'password' or 'pin'
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [securityAccessGranted, setSecurityAccessGranted] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Profile state management
  const [profileData, setProfileData] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    avatar: null,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Security state management
  const [securityData, setSecurityData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    currentPin: "",
    newPin: "",
    confirmPin: "",
    twoFactorAuth: false,
    requirePinForActions: true,
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);

  // Data Management
  const [dataManagementLoading, setDataManagementLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Reminder Settings
  const [reminderSettings, setReminderSettings] = useState({
    attendance_reminder: {
      enabled: true,
      message: "",
      target_congregations: [],
      send_time: "09:00",
      send_day: "sunday",
    },
    birthday_message: {
      enabled: true,
      message: "",
      target_congregations: [],
    },
    welcome_message: {
      enabled: true,
      message: "",
      target_congregations: [],
    },
    joint_program_notification: {
      enabled: true,
      message: "",
      target_congregations: [],
    },
  });
  const [reminderLoading, setReminderLoading] = useState(false);

  // Website Settings
  const [websiteSettings, setWebsiteSettings] = useState({
    about: "",
    mission: "",
    vision: "",
    contact_email: "",
    contact_phone: "",
  });
  const [websiteLoading, setWebsiteLoading] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Helper function to ensure form values are never undefined
  const getFormValue = (value) => {
    return value !== undefined && value !== null ? value : "";
  };

  // Handle security tab access
  const handleSecurityTabClick = () => {
    if (!securityAccessGranted) {
      setPendingAction({ type: "security_access" });
      setPinModalConfig({
        title: "Security Access",
        message: "Please enter your PIN to access security settings",
        type: "edit",
      });
      setPinModalOpen(true);
    } else {
      setActiveSettingsTab("security");
    }
  };

  // Handle PIN confirmation
  const handlePinConfirm = () => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case "security_access":
        setSecurityAccessGranted(true);
        setActiveSettingsTab("security");
        showSuccess("Security access granted!");
        break;
      default:
        break;
    }
    setPendingAction(null);
  };

  // Handle PIN close
  const handlePinClose = () => {
    setPinModalOpen(false);
    setPendingAction(null);
    setPinModalConfig({});
  };

  // Profile API functions
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const congregationName = localStorage.getItem("congregationName");

      // Try to get congregation-specific settings from localStorage first
      const localKey = `profile_${congregationName}`;
      const localData = localStorage.getItem(localKey);

      if (localData) {
        const data = JSON.parse(localData);
        setProfileData({
          username: data.username || "",
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "Local Executive",
          avatar: data.avatar || null,
        });
        setProfileLoading(false);
        return;
      }

      // No local data found, use default values for this congregation
      const defaultProfile = {
        username: "",
        fullName: "",
        email: "",
        phone: "",
        role: "Local Executive",
        avatar: null,
      };
      setProfileData(defaultProfile);
      localStorage.setItem(localKey, JSON.stringify(defaultProfile));
    } catch (error) {
      console.error("Error fetching profile:", error);
      showError("Failed to load profile data");
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      setProfileSaving(true);
      const congregationName = localStorage.getItem("congregationName");

      // Save to congregation-specific localStorage
      const localKey = `profile_${congregationName}`;
      localStorage.setItem(localKey, JSON.stringify(updatedData));

      // Update local state
      setProfileData(updatedData);
      showSuccess("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile");
      return false;
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle settings actions with toast messages
  const handleProfileUpdate = async () => {
    // This will be called from the form submission
    const success = await updateProfile(profileData);
    if (success) {
      // Profile updated successfully
    }
  };

  // Fetch security settings
  const fetchSecuritySettings = async () => {
    try {
      setSecurityLoading(true);
      const congregationName = localStorage.getItem("congregationName");

      // Try to get congregation-specific settings from localStorage first
      const localKey = `security_${congregationName}`;
      const localData = localStorage.getItem(localKey);

      if (localData) {
        const data = JSON.parse(localData);
        setSecurityData((prev) => ({
          ...prev,
          username: data.username || "",
          twoFactorAuth: data.twoFactorAuth || false,
          requirePinForActions: data.requirePinForActions || true,
        }));
        setSecurityLoading(false);
        return;
      }

      // No local data found, use default values for this congregation
      const defaultSecurity = {
        username: "",
        twoFactorAuth: false,
        requirePinForActions: true,
      };
      setSecurityData((prev) => ({
        ...prev,
        ...defaultSecurity,
      }));
      localStorage.setItem(localKey, JSON.stringify(defaultSecurity));
    } catch (error) {
      console.error("Error fetching security settings:", error);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Handle username update only
  const handleUsernameUpdate = async () => {
    try {
      // Validation checks
      if (!securityData.username.trim()) {
        showError("Username is required");
        return;
      }

      // Get current username from profile data to compare
      const currentUsername = profileData.username || "";

      // Check if new username is same as current username
      if (securityData.username === currentUsername) {
        showError(
          "New username cannot be the same as current username. Please use a different username."
        );
        return;
      }

      setSecuritySaving(true);

      // Make API call to update username in database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/security/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: securityData.username,
            currentUsername: profileData.username,
            congregation_id: localStorage.getItem("congregationId"),
            congregation_name: localStorage.getItem("congregationName"),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess("Username updated successfully!");
          // Update profile data to reflect the change
          setProfileData((prev) => ({
            ...prev,
            username: securityData.username,
          }));
        } else {
          showError(data.error || "Failed to update username");
        }
      } else {
        showError("Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      showError("Failed to update username");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      // Validation checks
      if (!securityData.currentPassword.trim()) {
        showError("Current password is required");
        return;
      }

      if (!securityData.newPassword.trim()) {
        showError("New password is required");
        return;
      }

      if (securityData.newPassword.length < 8) {
        showError("New password must be at least 8 characters long");
        return;
      }

      if (securityData.newPassword !== securityData.confirmPassword) {
        showError("New passwords do not match");
        return;
      }

      // Check if new password is same as current password
      if (securityData.newPassword === securityData.currentPassword) {
        showError(
          "New password cannot be the same as current password. Please use a different password."
        );
        return;
      }

      setSecuritySaving(true);

      // Make API call to update password in database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/security/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: profileData.username,
            currentPassword: securityData.currentPassword,
            newPassword: securityData.newPassword,
            confirmPassword: securityData.confirmPassword,
            twoFactorAuth: securityData.twoFactorAuth,
            congregation_id: localStorage.getItem("congregationId"),
            congregation_name: localStorage.getItem("congregationName"),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess("Password updated successfully!");
          // Clear sensitive fields
          setSecurityData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        } else {
          showError(data.error || "Failed to update password");
        }
      } else {
        showError("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      showError("Failed to update password");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handlePinUpdate = async () => {
    try {
      // Validation checks
      if (!securityData.currentPin.trim()) {
        showError("Current PIN is required");
        return;
      }

      if (!securityData.newPin.trim()) {
        showError("New PIN is required");
        return;
      }

      if (!/^\d{4}$/.test(securityData.newPin)) {
        showError("PIN must be exactly 4 digits");
        return;
      }

      if (securityData.newPin !== securityData.confirmPin) {
        showError("New PINs do not match");
        return;
      }

      // Check if new PIN is same as current PIN
      if (securityData.newPin === securityData.currentPin) {
        showError(
          "New PIN cannot be the same as current PIN. Please use a different PIN."
        );
        return;
      }

      setSecuritySaving(true);

      // Get congregation info from localStorage
      const congregationId = localStorage.getItem("congregationId");
      const congregationName = localStorage.getItem("congregationName");

      // Make API call to update PIN in database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/security/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPin: securityData.currentPin,
            newPin: securityData.newPin,
            confirmPin: securityData.confirmPin,
            requirePinForActions: securityData.requirePinForActions,
            congregation_id: congregationId,
            congregation_name: congregationName,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          showSuccess("PIN updated successfully!");
          // Clear sensitive fields
          setSecurityData((prev) => ({
            ...prev,
            currentPin: "",
            newPin: "",
            confirmPin: "",
          }));
        } else {
          showError(data.error || "Failed to update PIN");
        }
      } else {
        showError(data.error || "Failed to update PIN");
      }
    } catch (error) {
      console.error("Error updating PIN:", error);
      showError("Failed to update PIN");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleNotificationUpdate = () => {
    showSuccess("Notification preferences updated successfully!");
  };

  // Data Management Functions
  const handleExportData = async (format) => {
    try {
      setDataManagementLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/export/${format}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "all", // Export all data
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create and download file
          const blob = new Blob([data.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            data.filename ||
            `ypg_data_${format}_${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          showSuccess(`${format.toUpperCase()} export completed successfully!`);
        } else {
          showError(data.error || `Failed to export ${format}`);
        }
      } else {
        showError(`Failed to export ${format}`);
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      showError(`Failed to export ${format}`);
    } finally {
      setDataManagementLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setDataManagementLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/backup/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess(data.message || "Backup created successfully!");
        } else {
          showError(data.error || "Failed to create backup");
        }
      } else {
        showError("Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      showError("Failed to create backup");
    } finally {
      setDataManagementLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setDataManagementLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/backup/restore/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess(data.message || "Backup restored successfully!");
        } else {
          showError(data.error || "Failed to restore backup");
        }
      } else {
        showError("Failed to restore backup");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      showError("Failed to restore backup");
    } finally {
      setDataManagementLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirmClear) {
      showError("Click again to confirm clearing all data.");
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }

    try {
      setDataManagementLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/clear/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmation: "DELETE_ALL_DATA",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess(data.message || "All data cleared successfully!");
        } else {
          showError(data.error || "Failed to clear data");
        }
      } else {
        showError("Failed to clear data");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      showError("Failed to clear data");
    } finally {
      setDataManagementLoading(false);
      setConfirmClear(false);
    }
  };

  const handleLogout = () => {
    showSuccess("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  useEffect(() => {
    if (settingsOpen && activeSettingsTab === "profile") {
      fetchProfile();
    }
  }, [settingsOpen, activeSettingsTab]);
  useEffect(() => {
    if (settingsOpen && activeSettingsTab === "security") {
      fetchSecuritySettings();
    }
  }, [settingsOpen, activeSettingsTab]);

  useEffect(() => {
    if (!settingsOpen) {
      setProfileData({
        username: "",
        fullName: "",
        email: "",
        phone: "",
        role: "",
        avatar: null,
      });
    }
  }, [settingsOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showToast = (message, type = "success", duration = 3000) => {
        if (type === "success") {
          showSuccess(message);
        } else if (type === "error") {
          showError(message);
        } else {
          showSuccess(message);
        }
      };

      const congregationId = localStorage.getItem("congregationId");
      const savedTheme = localStorage.getItem(`theme_${congregationId}`);
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        setTheme(savedTheme);
      }

      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setSidebarOpen(true);
          setSettingsSidebarOpen(true);
        } else {
          setSidebarOpen(false);
          setSettingsSidebarOpen(false);
        }
      };

      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setSettingsSidebarOpen(true);
      } else {
        setSidebarOpen(false);
        setSettingsSidebarOpen(false);
      }

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showSuccess, showError]);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.notifications) {
          const transformedNotifications = data.notifications.map(
            (notification) => ({
              id: notification.id,
              message: notification.message,
              time: notification.created_at,
              type: notification.type,
              title: notification.title,
              is_read: notification.is_read,
              sender: notification.sender,
              congregation: notification.congregation,
            })
          );
          setNotifications(transformedNotifications);
        }
      } else if (response.status === 401) {
        console.log("Unauthorized, user not logged in");
        setNotifications([]);
      } else {
        console.error("Failed to fetch notifications:", response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure backend is ready
    const timeoutId = setTimeout(() => {
      fetchNotifications();
    }, 1000);

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <header
        className={`${mounted && theme === "dark" ? "bg-gray-800" : "bg-blue-600"} shadow-lg w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between fixed top-0 left-0 z-20`}
      >
        <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-6">
          <div className="relative lg:hidden">
            <button
              data-sidebar-toggle
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-blue-200 transition-colors mr-2 lg:hidden focus:outline-none"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              onFocus={(e) => {
                const el = document.getElementById("sidebar-tooltip");
                if (el) el.style.display = "block";
              }}
              onBlur={() => {
                const el = document.getElementById("sidebar-tooltip");
                if (el) el.style.display = "none";
              }}
              onMouseEnter={() => {
                const el = document.getElementById("sidebar-tooltip");
                if (el) el.style.display = "block";
              }}
              onMouseLeave={() => {
                const el = document.getElementById("sidebar-tooltip");
                if (el) el.style.display = "none";
              }}
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <div
              id="sidebar-tooltip"
              style={{ display: "none" }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 rounded bg-gray-900 text-white text-xs shadow z-50 whitespace-nowrap"
              role="tooltip"
            >
              {sidebarOpen ? "Close sidebar" : "Open sidebar"}
            </div>
          </div>
          <i className="fas fa-database text-white text-lg sm:text-2xl"></i>
          <span className="text-white text-lg sm:text-2xl font-bold">
            {currentPage}
          </span>
        </div>
        {/* Optional right-aligned header action */}
        {headerAction && (
          <div className="flex items-center">{headerAction}</div>
        )}
        {/* Quick Actions Dropdown for Analytics Page */}
        {currentPage === "Analytics" && (
          <QuickActionsDropdown filtered={currentPageProps?.filtered} />
        )}
        {/* Quick Actions Dropdown for Members Page */}
        {currentPage === "Members" && (
          <MembersQuickActionsDropdown
            selectedMembers={selectedMembers}
            onDeleteSelected={onDeleteSelected}
            onBulkEdit={onBulkEdit}
          />
        )}
      </header>

      {/* Sidebar */}
      <LocalSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setSettingsOpen={setSettingsOpen}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
      />

      {/* Settings Modal */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg sm:max-w-2xl max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Settings
                  </h2>
                  {/* Mobile sidebar toggle */}
                  <button
                    onClick={() => setSettingsSidebarOpen(!settingsSidebarOpen)}
                    className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-bars text-lg"></i>
                  </button>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <div className="flex h-96">
                {/* Settings Sidebar */}
                <div className={`${
                  settingsSidebarOpen ? "w-48" : "w-0"
                } transition-all duration-300 border-r overflow-hidden ${
                  theme === "dark"
                    ? "border-gray-700 bg-gray-900"
                    : "border-gray-200 bg-gray-50"
                }`}>
                  <nav className="p-4 space-y-2">
                    <button
                      onClick={() => {
                        setActiveSettingsTab("profile");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "profile" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-user mr-2"></i>Profile
                    </button>
                    <button
                      onClick={() => {
                        handleSecurityTabClick();
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "security" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-shield-alt mr-2"></i>Security
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("privacy");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "privacy" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-user-secret mr-2"></i>Privacy
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("notifications");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "notifications" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-bell mr-2"></i>Notifications
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("appearance");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "appearance" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-palette mr-2"></i>Appearance
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("data");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "data" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-database mr-2"></i>Data Management
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("about");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "about" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-info-circle mr-2"></i>About
                    </button>
                  </nav>
                </div>
                {/* Settings Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeSettingsTab === "profile" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Profile Settings
                      </h3>

                      {profileLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            Loading profile...
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={getFormValue(profileData.fullName)}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  fullName: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={getFormValue(profileData.email)}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                              placeholder="Enter your email"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={getFormValue(profileData.phone)}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                              placeholder="Enter your phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Role
                            </label>
                            <select
                              value={getFormValue(profileData.role)}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  role: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            >
                              <option value="Local Executive">
                                Local Executive
                              </option>
                              <option value="District Executive">
                                District Executive
                              </option>
                              <option value="System Administrator">
                                System Administrator
                              </option>
                              <option value="Data Manager">Data Manager</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </div>

                          <button
                            onClick={handleProfileUpdate}
                            disabled={profileSaving}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {profileSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              "Update Profile"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {activeSettingsTab === "security" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Security Settings
                      </h3>
                      {/* Authentication Method Toggle */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                          Authentication Method
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <button
                            onClick={() => setSecurityMethod("password")}
                            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${securityMethod === "password" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"}`}
                          >
                            <i className="fas fa-key mr-2"></i>Username &
                            Password
                          </button>
                          <button
                            onClick={() => setSecurityMethod("pin")}
                            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${securityMethod === "pin" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"}`}
                          >
                            <i className="fas fa-mobile-alt mr-2"></i>PIN
                            Authentication
                          </button>
                        </div>
                      </div>
                      {/* Password Authentication Form */}
                      {securityMethod === "password" && (
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-xs sm:text-md font-medium text-gray-900 dark:text-white">
                            Password Settings
                          </h4>
                          {securityLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  New Username
                                </label>
                                <input
                                  type="text"
                                  value={securityData.username}
                                  onChange={(e) =>
                                    setSecurityData((prev) => ({
                                      ...prev,
                                      username: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                  placeholder="Enter new username"
                                />
                              </div>
                              <button
                                onClick={handleUsernameUpdate}
                                disabled={securitySaving}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                              >
                                {securitySaving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                    Updating Username...
                                  </>
                                ) : (
                                  "Update Username"
                                )}
                              </button>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  Current Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={
                                      showCurrentPassword ? "text" : "password"
                                    }
                                    value={securityData.currentPassword}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        currentPassword: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                    placeholder="Enter current password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowCurrentPassword(
                                        !showCurrentPassword
                                      )
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showCurrentPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={securityData.newPassword}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        newPassword: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                    placeholder="Enter new password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  Confirm New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    value={securityData.confirmPassword}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        confirmPassword: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                    placeholder="Confirm new password"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="2fa"
                                  checked={securityData.twoFactorAuth}
                                  onChange={(e) =>
                                    setSecurityData((prev) => ({
                                      ...prev,
                                      twoFactorAuth: e.target.checked,
                                    }))
                                  }
                                  className="rounded"
                                />
                                <label
                                  htmlFor="2fa"
                                  className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                                >
                                  Enable Two-Factor Authentication
                                </label>
                              </div>
                              <button
                                onClick={handlePasswordUpdate}
                                disabled={securitySaving}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {securitySaving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                    Updating...
                                  </>
                                ) : (
                                  "Update Password Settings"
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {/* PIN Authentication Form */}
                      {securityMethod === "pin" && (
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-xs sm:text-md font-medium text-gray-900 dark:text-white">
                            PIN Settings
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                            PIN authentication is used for quick actions and
                            sensitive operations.
                          </p>
                          {securityLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  Current PIN
                                </label>
                                <div className="relative">
                                  <input
                                    type={showCurrentPin ? "text" : "password"}
                                    maxLength="6"
                                    value={securityData.currentPin}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        currentPin: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter 4-digit PIN"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowCurrentPin(!showCurrentPin)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showCurrentPin ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  New PIN
                                </label>
                                <div className="relative">
                                  <input
                                    type={showNewPin ? "text" : "password"}
                                    maxLength="6"
                                    value={securityData.newPin}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        newPin: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter 4-digit PIN"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPin(!showNewPin)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showNewPin ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                  Confirm New PIN
                                </label>
                                <div className="relative">
                                  <input
                                    type={showConfirmPin ? "text" : "password"}
                                    maxLength="6"
                                    value={securityData.confirmPin}
                                    onChange={(e) =>
                                      setSecurityData((prev) => ({
                                        ...prev,
                                        confirmPin: e.target.value,
                                      }))
                                    }
                                    placeholder="Confirm 4-digit PIN"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPin(!showConfirmPin)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <i
                                      className={`fas ${showConfirmPin ? "fa-eye-slash" : "fa-eye"} text-sm`}
                                    ></i>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="pin-actions"
                                  checked={securityData.requirePinForActions}
                                  onChange={(e) =>
                                    setSecurityData((prev) => ({
                                      ...prev,
                                      requirePinForActions: e.target.checked,
                                    }))
                                  }
                                  className="rounded"
                                />
                                <label
                                  htmlFor="pin-actions"
                                  className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                                >
                                  Require PIN for sensitive actions
                                </label>
                              </div>
                              <button
                                onClick={handlePinUpdate}
                                disabled={securitySaving}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {securitySaving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                    Updating...
                                  </>
                                ) : (
                                  "Update PIN Settings"
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {activeSettingsTab === "privacy" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Privacy Policy
                      </h3>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Your data is protected and used only for church
                          administration purposes. We do not share your
                          information with third parties. For more details,
                          contact your administrator.
                        </p>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === "notifications" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Notification Preferences
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              Email Notifications
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Receive notifications via email
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              New Member Alerts
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Get notified when new members register
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              Weekly Reports
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Receive weekly summary reports
                            </p>
                          </div>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              System Updates
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Notifications about system maintenance
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded"
                          />
                        </div>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base">
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === "appearance" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Appearance Settings
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Theme
                          </label>
                          <select
                            value={theme}
                            onChange={(e) => {
                              const newTheme = e.target.value;
                              setTheme(newTheme);
                              const congregationId = localStorage.getItem("congregationId");
                              localStorage.setItem(`theme_${congregationId}`, newTheme);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="auto">Auto (System)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Language
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base">
                            <option>English</option>
                            <option>Twi</option>
                            <option>Ga</option>
                            <option>Ewe</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Font Size
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base">
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                          </select>
                        </div>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base">
                          Apply Changes
                        </button>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === "data" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Data Management
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Export Data
                          </h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                            Download your data in various formats
                          </p>
                          <div className="space-y-2">
                            <button
                              onClick={() => handleExportData("csv")}
                              disabled={dataManagementLoading}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-download mr-2"></i>
                              {dataManagementLoading
                                ? "Exporting..."
                                : "Export as CSV"}
                            </button>
                            <button
                              onClick={() => handleExportData("excel")}
                              disabled={dataManagementLoading}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-file-excel mr-2"></i>
                              {dataManagementLoading
                                ? "Exporting..."
                                : "Export as Excel"}
                            </button>
                            <button
                              onClick={() => handleExportData("pdf")}
                              disabled={dataManagementLoading}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-file-pdf mr-2"></i>
                              {dataManagementLoading
                                ? "Exporting..."
                                : "Export as PDF"}
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                            Backup & Restore
                          </h4>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                            Manage your data backups
                          </p>
                          <div className="space-y-2">
                            <button
                              onClick={handleCreateBackup}
                              disabled={dataManagementLoading}
                              className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-save mr-2"></i>
                              {dataManagementLoading
                                ? "Creating..."
                                : "Create Backup"}
                            </button>
                            <button
                              onClick={handleRestoreBackup}
                              disabled={dataManagementLoading}
                              className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <i className="fas fa-upload mr-2"></i>
                              {dataManagementLoading
                                ? "Restoring..."
                                : "Restore from Backup"}
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                            Danger Zone
                          </h4>
                          <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                            Irreversible actions
                          </p>
                          <button
                            onClick={handleClearData}
                            disabled={dataManagementLoading}
                            className="w-full text-left px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            {dataManagementLoading
                              ? "Clearing..."
                              : confirmClear
                                ? "Click again to confirm"
                                : "Clear All Data"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === "about" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        About YPG Database
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Version Information
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Version: 1.1.0
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Build: 2025.1.1
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Last Updated: August 202524
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Description
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Ahinsan District YPG Database Management System is a
                            comprehensive solution for managing Young
                            People&apos;s Guild data, attendance tracking, and
                            analytics. Built with modern web technologies to
                            provide a seamless experience for church
                            administrators and youth leaders.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Features
                          </h4>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Member Management & Registration</li>
                            <li>• Attendance Tracking & Reporting</li>
                            <li>• Analytics & Insights</li>
                            <li>• Bulk Data Import/Export</li>
                            <li>• Multi-language Support</li>
                            <li>• Dark/Light Theme</li>
                            <li>• Mobile Responsive Design</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Support
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            For technical support or feature requests, please
                            contact the development team.
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                            Developed by Neststack Incoporate
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onConfirm={handlePinConfirm}
        title={pinModalConfig.title}
        message={pinModalConfig.message}
        type={pinModalConfig.type}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main content */}
      <div
        className={`pt-16 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"} ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} min-h-screen`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function QuickActionsDropdown({ filtered }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-blue-50 text-blue-700 rounded-lg shadow-sm border border-blue-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <i className="fas fa-bolt text-blue-500"></i>
        Quick Actions
        <i
          className={`fas fa-chevron-${open ? "up" : "down"} text-xs ml-1`}
        ></i>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2 animate-fadeIn">
          <ExportAnalyticsButton />
          <button className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition">
            <i className="fas fa-chart-line"></i> Generate Report
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition">
            <i className="fas fa-share"></i> Share Analytics
          </button>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <button className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>
      )}
    </div>
  );
}
