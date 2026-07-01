"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ExportAnalyticsButton from "./ExportAnalyticsButton";
import PinModal from "./PinModal";
import { useTheme } from "./ThemeProvider";
import { useToast, ToastContainer } from "./Toast";
import autoLogout from "../utils/autoLogout";

export default function DashboardLayout({
  children,
  currentPage = "",
  currentPageProps = {},
  headerAction = null,
  selectedMembers = [],
  onDeleteSelected = () => {},
  onBulkEdit = () => {},
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, mounted } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);
  const [securityMethod, setSecurityMethod] = useState("password");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [securityAccessGranted, setSecurityAccessGranted] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    attendance_reminder: {
      title: "Attendance Reminder",
      message_template:
        "Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you!",
      is_active: true,
      target_congregations: "all",
      selected_congregations: [],
    },
    birthday_message: {
      title: "Birthday Message",
      message_template:
        "Happy Birthday {name}! May God bless you abundantly. - YPG",
      is_active: true,
      target_congregations: "all",
      selected_congregations: [],
    },
    welcome_message: {
      title: "Welcome Message",
      message_template:
        "Welcome {name} to {congregation}! We're glad to have you join us.",
      is_active: true,
      target_congregations: "all",
      selected_congregations: [],
    },
    joint_program_notification: {
      title: "Joint Program Notification",
      message_template:
        "Joint program scheduled for {date} ({day}) at {location}. All congregations are invited!",
      is_active: true,
      target_congregations: "all",
      selected_congregations: [],
    },
  });

  // Dynamic congregations from the system
  const [availableCongregations, setAvailableCongregations] = useState([]);

  // Fetch congregations from API
  useEffect(() => {
    const fetchCongregations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/home-stats/`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.congregations) {
            setAvailableCongregations(data.data.congregations);
          } else {
            // Fallback to default congregations if API doesn't return congregation list
            setAvailableCongregations([
              "Emmanuel Congregation Ahinsan",
              "Peniel Congregation Esreso No1",
              "Mizpah Congregation Odagya No1",
              "Christ Congregation Ahinsan Estate",
              "Ebenezer Congregation Dompoase Aprabo",
              "Favour Congregation Esreso No2",
              "Liberty Congregation Esreso High Tension",
              "Odagya No2",
              "NOM",
              "Kokobriko",
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching congregations:", error);
        // Fallback to default congregations
        setAvailableCongregations([
          "Emmanuel Congregation Ahinsan",
          "Peniel Congregation Esreso No1",
          "Mizpah Congregation Odagya No1",
          "Christ Congregation Ahinsan Estate",
          "Ebenezer Congregation Dompoase Aprabo",
          "Favour Congregation Esreso No2",
          "Liberty Congregation Esreso High Tension",
          "Odagya No2",
          "NOM",
          "Kokobriko",
        ]);
      }
    };

    fetchCongregations();
  }, []);

  // Fetch reminder settings from API
  useEffect(() => {
    const fetchReminderSettings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reminder-settings/`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setReminderSettings(data.settings);
          }
        }
      } catch (error) {
        console.error("Error fetching reminder settings:", error);
        // Keep default settings if API fails
      }
    };

    fetchReminderSettings();
  }, []);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Initialize sidebar based on screen size
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setSidebarOpen(true);
        setSettingsSidebarOpen(true);
      } else {
        setSidebarOpen(false);
        setSettingsSidebarOpen(false);
      }
    };

    // Set initial state - ensure sidebar is closed on mobile by default
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
      setSettingsSidebarOpen(true);
    } else {
      setSidebarOpen(false);
      setSettingsSidebarOpen(false);
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize auto-logout
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    const congregationId = localStorage.getItem("congregationId");
    if (user || congregationId) {
      autoLogout.updateLoginStatus(true);
    }
    // Make autoLogout available globally
    if (typeof window !== "undefined") {
      window.autoLogout = autoLogout;
      // Set up global toast function for autoLogout utility
      window.showToast = (message, type = "success", duration = 3000) => {
        if (type === "success") {
          showSuccess(message);
        } else if (type === "error") {
          showError(message);
        } else {
          // For info/warning type, use success styling
          showSuccess(message);
        }
      };
    }

    // Cleanup on unmount
    return () => {
      autoLogout.destroy();
    };
  }, [showSuccess, showError]); // Keep dependencies to avoid the error

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

  // Profile state management
  const [profileData, setProfileData] = useState({
    username: "district_admin",
    fullName: "Admin User",
    email: "admin@ypg.com",
    phone: "+233 20 123 4567",
    role: "System Administrator",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("district_admin");

  // Security state management
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    currentPin: "",
    newPin: "",
    confirmPin: "",
    twoFactorAuth: false,
    requirePinForActions: true,
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Fetch security data from API
  const fetchSecurityData = async () => {
    try {
      setSecurityLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/security/`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.security) {
          setSecurityData((prev) => ({
            ...prev,
            twoFactorAuth: data.security.twoFactorAuth || false,
            requirePinForActions: data.security.requirePinForActions || true,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching security settings:", error);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Fetch security on mount
  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/profile/`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          setProfileData(data.profile);
          if (data.profile.username) {
            setOriginalUsername(data.profile.username);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Handle settings actions with toast messages
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/profile/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(profileData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess("Profile updated successfully!");
          // Update the profile data with the response data
          if (data.profile) {
            setProfileData(data.profile);
          } else {
            // Refresh profile data from server
            fetchProfileData();
          }
        } else {
          showError(data.error || "Failed to update profile");
        }
      } else {
        showError("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUsernameOnlyUpdate = async () => {
    try {
      setSecurityLoading(true);

      const newUsername = profileData.username?.trim() || "";
      if (!newUsername) {
        showError("Username is required");
        return;
      }

      if (newUsername === originalUsername) {
        showError(
          "New username cannot be the same as current username. Please use a different username."
        );
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/security/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: newUsername,
            currentUsername: originalUsername,
            congregation_id: "district",
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        showSuccess("Username updated successfully!");
        setOriginalUsername(newUsername);
      } else {
        showError(data.error || "Failed to update username");
      }
    } catch (error) {
      showError("Failed to update username");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setSecurityLoading(true);

      // Validate passwords
      if (!securityData.currentPassword) {
        showError("Current password is required");
        return;
      }
      if (!securityData.newPassword) {
        showError("New password is required");
        return;
      }
      if (securityData.newPassword !== securityData.confirmPassword) {
        showError("New passwords do not match");
        return;
      }
      if (securityData.newPassword.length < 8) {
        showError("New password must be at least 8 characters long");
        return;
      }

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
            congregation_id: "district",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess("Password updated successfully!");
          // Clear password fields
          setSecurityData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        } else {
          showError(
            data.error ||
              data.errors?.currentPassword ||
              "Failed to update password"
          );
        }
      } else {
        showError("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      showError("Failed to update password");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePinUpdate = async () => {
    try {
      setSecurityLoading(true);

      // Validate PINs
      if (!securityData.currentPin) {
        showError("Current PIN is required");
        return;
      }
      if (!securityData.newPin) {
        showError("New PIN is required");
        return;
      }
      if (securityData.newPin !== securityData.confirmPin) {
        showError("New PINs do not match");
        return;
      }
      if (!/^\d{4}$/.test(securityData.newPin)) {
        showError("PIN must be exactly 4 digits");
        return;
      }

      // Get congregation info from localStorage
      const congregationId = localStorage.getItem("congregationId");
      const congregationName = localStorage.getItem("congregationName");

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
          // Clear PIN fields
          setSecurityData((prev) => ({
            ...prev,
            currentPin: "",
            newPin: "",
            confirmPin: "",
          }));
        } else {
          showError(
            data.error || data.errors?.currentPin || "Failed to update PIN"
          );
        }
      } else {
        showError("Failed to update PIN");
      }
    } catch (error) {
      showError("Failed to update PIN");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleNotificationUpdate = () => {
    showSuccess("Notification preferences updated successfully!");
  };

  const handleLogout = () => {
    // Use auto-logout utility for consistent logout behavior
    if (typeof window !== "undefined" && window.autoLogout) {
      window.autoLogout.manualLogout();
    } else {
      // Fallback if auto-logout is not available
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      showSuccess("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  const handleReminderSettingChange = (settingType, field, value) => {
    setReminderSettings((prev) => ({
      ...prev,
      [settingType]: {
        ...prev[settingType],
        [field]: value,
      },
    }));
  };

  const handleSaveReminderSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reminder-settings/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminderSettings),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Reminder settings saved successfully!");
      } else {
        showError(data.error || "Failed to save reminder settings");
      }
    } catch (error) {
      console.error("Error saving reminder settings:", error);
      showError("Failed to save reminder settings");
    }
  };

  // Data Management Functions
  const handleExportData = async (format, type = "all") => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/export/${format}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (format === "csv" || format === "excel") {
          // Create and download file
          const blob = new Blob([data.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          showSuccess(`${format.toUpperCase()} export completed successfully!`);
        } else {
          showSuccess(data.message);
        }
      } else {
        showError(data.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      showError("Export failed");
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/backup/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess(
          `Backup created successfully! Members: ${data.backup_info.members_count}, Attendance: ${data.backup_info.attendance_count}, Congregations: ${data.backup_info.congregations_count}`
        );
      } else {
        showError(data.error || "Backup creation failed");
      }
    } catch (error) {
      console.error("Backup error:", error);
      showError("Backup creation failed");
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/backup/restore/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess(
          `Backup restored successfully! Members: ${data.restored_info.members_count}, Attendance: ${data.restored_info.attendance_count}, Congregations: ${data.restored_info.congregations_count}`
        );
      } else {
        showError(data.error || "Backup restoration failed");
      }
    } catch (error) {
      console.error("Restore error:", error);
      showError("Backup restoration failed");
    }
  };

  const handleClearData = async () => {
    const confirmation = prompt(
      "Type DELETE_ALL_DATA to confirm clearing all data:"
    );

    if (confirmation === "DELETE_ALL_DATA") {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/clear/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirmation }),
          }
        );

        const data = await response.json();

        if (data.success) {
          showSuccess(data.message);
        } else {
          showError(data.error || "Data clearing failed");
        }
      } catch (error) {
        console.error("Clear data error:", error);
        showError("Data clearing failed");
      }
    } else {
      showError("Operation cancelled");
    }
  };

  const handleSendReminder = async (settingType) => {
    const setting = reminderSettings[settingType];

    if (!setting.is_active) {
      showError(
        "This message type is currently disabled. Please enable it first."
      );
      return;
    }

    let targetCongregations = [];

    switch (setting.target_congregations) {
      case "all":
        targetCongregations = availableCongregations;
        break;
      case "specific":
        if (setting.selected_congregations.length === 0) {
          showError(
            "Please select at least one congregation to send messages to."
          );
          return;
        }
        targetCongregations = setting.selected_congregations;
        break;
      case "non_submitting":
        // This would be determined by the current attendance data
        targetCongregations = [
          "Emmanuel Congregation Ahinsan",
          "Peniel Congregation Esreso No1",
        ]; // Demo data
        break;
    }

    // Send to backend API
    try {
      // Process message template with real data
      const message = setting.message_template
        .replace(/{congregation}/g, targetCongregations.join(", "))
        .replace(/{date}/g, new Date().toLocaleDateString())
        .replace(
          /{day}/g,
          new Date().toLocaleDateString("en-US", { weekday: "long" })
        )
        .replace(/{name}/g, "YPG Members")
        .replace(/{location}/g, "Main Hall");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/send/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: setting.target_congregations === "all" ? "all" : "specific",
            title: setting.title,
            message: message,
            congregations: targetCongregations,
            type: settingType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showSuccess(
            `Successfully sent ${setting.title} to ${targetCongregations.length} congregation(s)!`
          );
          // Refresh notifications to show the new one
          fetchNotifications();
        } else {
          showError(data.error || "Failed to send notification");
        }
      } else {
        showError("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      showError("Failed to send notification");
    }
  };

  const handleTestReminder = (settingType) => {
    const setting = reminderSettings[settingType];
    const testMessage = setting.message_template
      .replace("{congregation}", "Test Congregation")
      .replace("{date}", "2025-01-19")
      .replace("{day}", "Sunday")
      .replace("{name}", "John Doe")
      .replace("{location}", "Main Hall");

    showSuccess(`Test message: ${testMessage}`);
  };

  const handleCongregationSelection = (settingType, congregation) => {
    const setting = reminderSettings[settingType];
    const updatedSelected = setting.selected_congregations.includes(
      congregation
    )
      ? setting.selected_congregations.filter((c) => c !== congregation)
      : [...setting.selected_congregations, congregation];

    handleReminderSettingChange(
      settingType,
      "selected_congregations",
      updatedSelected
    );
  };

  const handleTargetCongregationChange = (settingType, target) => {
    handleReminderSettingChange(settingType, "target_congregations", target);
    if (target === "all") {
      handleReminderSettingChange(settingType, "selected_congregations", []);
    }
  };

  // Real-time notifications from API
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch notifications from API
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
          // Transform API data to match expected format
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
      // Keep empty array if API fails
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    // Add a small delay to ensure backend is ready
    const timeoutId = setTimeout(() => {
      fetchNotifications();
    }, 1000);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  // Website content state management
  const [websiteData, setWebsiteData] = useState({
    about: "",
    mission: "",
    vision: "",
    contact_email: "",
    contact_phone: "",
  });
  const [websiteLoading, setWebsiteLoading] = useState(false);

  const fetchWebsiteData = async () => {
    try {
      setWebsiteLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/website/`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.website) {
          setWebsiteData({
            about: data.website.about || "",
            mission: data.website.mission || "",
            vision: data.website.vision || "",
            contact_email: data.website.contact_email || "",
            contact_phone: data.website.contact_phone || "",
          });
        }
      }
    } catch (e) {
      console.error("Error fetching website settings:", e);
    } finally {
      setWebsiteLoading(false);
    }
  };

  useEffect(() => {
    if (settingsOpen && activeSettingsTab === "website") {
      fetchWebsiteData();
    }
  }, [settingsOpen, activeSettingsTab]);

  const handleWebsiteUpdate = async () => {
    try {
      setWebsiteLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/website/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(websiteData),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        showSuccess("Website content updated successfully!");
      } else {
        showError(data.error || "Failed to update website content");
      }
    } catch (e) {
      console.error("Error updating website settings:", e);
      showError("Failed to update website content");
    } finally {
      setWebsiteLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${mounted ? (theme === "dark" ? "dark bg-gray-900" : "bg-gray-50") : "bg-gray-50"}`}
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
      <Sidebar
        notifications={notifications}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setSettingsOpen={setSettingsOpen}
      />

      {/* Main content */}
      <div
        className={`pt-16 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"} ${mounted && theme === "dark" ? "bg-gray-900" : "bg-gray-50"} min-h-screen`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </div>

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
              <div className="flex max-h-[70vh] sm:max-h-[80vh]">
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
                    <button
                      onClick={() => {
                        setActiveSettingsTab("reminders");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "reminders" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-bell mr-2"></i>Reminder Messages
                    </button>
                    <button
                      onClick={() => {
                        setActiveSettingsTab("website");
                        // Close sidebar on mobile after selecting tab
                        if (window.innerWidth < 1024) {
                          setSettingsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "website" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-globe mr-2"></i>Website Content
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
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.fullName}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                fullName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            disabled={profileLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            disabled={profileLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            disabled={profileLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Role
                          </label>
                          <select
                            value={profileData.role}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                role: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            disabled={profileLoading}
                          >
                            <option value="System Administrator">
                              System Administrator
                            </option>
                            <option value="Data Manager">Data Manager</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </div>
                        <button
                          onClick={handleProfileUpdate}
                          disabled={profileLoading}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {profileLoading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Updating...
                            </>
                          ) : (
                            "Update Profile"
                          )}
                        </button>
                      </div>
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
                            Username & Password Settings
                          </h4>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Username
                            </label>
                            <input
                              type="text"
                              value={profileData.username}
                              onChange={(e) =>
                                setProfileData((prev) => ({
                                  ...prev,
                                  username: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                              disabled={securityLoading}
                            />
                            <button
                              onClick={handleUsernameOnlyUpdate}
                              disabled={securityLoading}
                              className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {securityLoading ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Updating Username...
                                </>
                              ) : (
                                "Update Username"
                              )}
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={securityData.currentPassword}
                                onChange={(e) =>
                                  setSecurityData((prev) => ({
                                    ...prev,
                                    currentPassword: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                disabled={securityLoading}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={securityLoading}
                              >
                                {showCurrentPassword ? (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                )}
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
                                disabled={securityLoading}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={securityLoading}
                              >
                                {showNewPassword ? (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={securityData.confirmPassword}
                                onChange={(e) =>
                                  setSecurityData((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                                disabled={securityLoading}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={securityLoading}
                              >
                                {showConfirmPassword ? (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                )}
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
                              disabled={securityLoading}
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
                            disabled={securityLoading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {securityLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Updating...
                              </>
                            ) : (
                              "Update Password Settings"
                            )}
                          </button>
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
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handlePinUpdate();
                            }}
                          >
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
                                  disabled={securityLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowCurrentPin(!showCurrentPin)
                                  }
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  disabled={securityLoading}
                                >
                                  {showCurrentPin ? (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  )}
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
                                  disabled={securityLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPin(!showNewPin)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  disabled={securityLoading}
                                >
                                  {showNewPin ? (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  )}
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
                                  disabled={securityLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPin(!showConfirmPin)
                                  }
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  disabled={securityLoading}
                                >
                                  {showConfirmPin ? (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  )}
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
                                disabled={securityLoading}
                              />
                              <label
                                htmlFor="pin-actions"
                                className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                              >
                                Require PIN for sensitive actions
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={handlePinUpdate}
                              disabled={securityLoading}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {securityLoading ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Updating...
                                </>
                              ) : (
                                "Update PIN Settings"
                              )}
                            </button>
                          </form>
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
                            onChange={(e) => setTheme(e.target.value)}
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
                              onClick={() => handleExportData("csv", "all")}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                              <i className="fas fa-download mr-2"></i>Export as
                              CSV
                            </button>
                            <button
                              onClick={() => handleExportData("excel", "all")}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                              <i className="fas fa-file-excel mr-2"></i>Export
                              as Excel
                            </button>
                            <button
                              onClick={() => handleExportData("pdf", "all")}
                              className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                              <i className="fas fa-file-pdf mr-2"></i>Export as
                              PDF
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
                              className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                            >
                              <i className="fas fa-save mr-2"></i>Create Backup
                            </button>
                            <button
                              onClick={handleRestoreBackup}
                              className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                            >
                              <i className="fas fa-upload mr-2"></i>Restore from
                              Backup
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
                            className="w-full text-left px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                          >
                            <i className="fas fa-trash mr-2"></i>Clear All Data
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
                            Last Updated: August 2025
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
                  {activeSettingsTab === "reminders" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Reminder Messages
                        </h3>
                        <button
                          onClick={handleSaveReminderSettings}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <i className="fas fa-save mr-2"></i>Save Settings
                        </button>
                      </div>
                      <div className="space-y-4">
                        {/* Attendance Reminder */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 mr-3">
                                <i className="fas fa-bell text-blue-600 dark:text-blue-400"></i>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Attendance Reminder
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Message sent to congregations for attendance
                                  submission
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  reminderSettings.attendance_reminder.is_active
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "attendance_reminder",
                                    "is_active",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={
                                  reminderSettings.attendance_reminder.title
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "attendance_reminder",
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={
                                  reminderSettings.attendance_reminder
                                    .message_template
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "attendance_reminder",
                                    "message_template",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {congregation}, {date}, {day} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{congregation}"},{" "}
                                {"{date}"}, {"{day}"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Target Congregations
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="attendance_target"
                                      value="all"
                                      checked={
                                        reminderSettings.attendance_reminder
                                          .target_congregations === "all"
                                      }
                                      onChange={(e) =>
                                        handleTargetCongregationChange(
                                          "attendance_reminder",
                                          e.target.value
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">
                                      All Congregations
                                    </span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="attendance_target"
                                      value="specific"
                                      checked={
                                        reminderSettings.attendance_reminder
                                          .target_congregations === "specific"
                                      }
                                      onChange={(e) =>
                                        handleTargetCongregationChange(
                                          "attendance_reminder",
                                          e.target.value
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">
                                      Specific Congregations
                                    </span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="attendance_target"
                                      value="non_submitting"
                                      checked={
                                        reminderSettings.attendance_reminder
                                          .target_congregations ===
                                        "non_submitting"
                                      }
                                      onChange={(e) =>
                                        handleTargetCongregationChange(
                                          "attendance_reminder",
                                          e.target.value
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">
                                      Non-submitting Only
                                    </span>
                                  </label>
                                </div>
                                {reminderSettings.attendance_reminder
                                  .target_congregations === "specific" && (
                                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                                    <div className="grid grid-cols-2 gap-1">
                                      {availableCongregations.map(
                                        (congregation) => (
                                          <label
                                            key={congregation}
                                            className="flex items-center text-xs"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={reminderSettings.attendance_reminder.selected_congregations.includes(
                                                congregation
                                              )}
                                              onChange={() =>
                                                handleCongregationSelection(
                                                  "attendance_reminder",
                                                  congregation
                                                )
                                              }
                                              className="mr-1"
                                            />
                                            <span className="truncate">
                                              {congregation}
                                            </span>
                                          </label>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleTestReminder("attendance_reminder")
                                }
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                <i className="fas fa-play mr-1"></i>Test Message
                              </button>
                              <button
                                onClick={() =>
                                  handleSendReminder("attendance_reminder")
                                }
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                <i className="fas fa-paper-plane mr-1"></i>Send
                                Message
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Birthday Message */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-2 mr-3">
                                <i className="fas fa-birthday-cake text-pink-600 dark:text-pink-400"></i>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Birthday Message
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Message sent to members on their birthday
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  reminderSettings.birthday_message.is_active
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "birthday_message",
                                    "is_active",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={reminderSettings.birthday_message.title}
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "birthday_message",
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={
                                  reminderSettings.birthday_message
                                    .message_template
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "birthday_message",
                                    "message_template",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {name} as placeholder"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{name}"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleTestReminder("birthday_message")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <i className="fas fa-play mr-1"></i>Test Message
                            </button>
                          </div>
                        </div>

                        {/* Welcome Message */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 mr-3">
                                <i className="fas fa-handshake text-green-600 dark:text-green-400"></i>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Welcome Message
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Message sent to new members
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  reminderSettings.welcome_message.is_active
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "welcome_message",
                                    "is_active",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={reminderSettings.welcome_message.title}
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "welcome_message",
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={
                                  reminderSettings.welcome_message
                                    .message_template
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "welcome_message",
                                    "message_template",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {name}, {congregation} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{name}"},{" "}
                                {"{congregation}"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleTestReminder("welcome_message")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <i className="fas fa-play mr-1"></i>Test Message
                            </button>
                          </div>
                        </div>

                        {/* Joint Program Notification */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2 mr-3">
                                <i className="fas fa-users text-purple-600 dark:text-purple-400"></i>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Joint Program Notification
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Message sent for joint program announcements
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  reminderSettings.joint_program_notification
                                    .is_active
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "joint_program_notification",
                                    "is_active",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={
                                  reminderSettings.joint_program_notification
                                    .title
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "joint_program_notification",
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={
                                  reminderSettings.joint_program_notification
                                    .message_template
                                }
                                onChange={(e) =>
                                  handleReminderSettingChange(
                                    "joint_program_notification",
                                    "message_template",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {date}, {day}, {location} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{date}"}, {"{day}"},{" "}
                                {"{location}"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleTestReminder("joint_program_notification")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <i className="fas fa-play mr-1"></i>Test Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === "website" && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Website Content
                        </h3>
                        <button
                          onClick={handleWebsiteUpdate}
                          disabled={websiteLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {websiteLoading ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>Save
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            About
                          </label>
                          <textarea
                            rows={3}
                            value={websiteData.about}
                            onChange={(e) =>
                              setWebsiteData((p) => ({
                                ...p,
                                about: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Mission
                          </label>
                          <textarea
                            rows={2}
                            value={websiteData.mission}
                            onChange={(e) =>
                              setWebsiteData((p) => ({
                                ...p,
                                mission: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Vision
                          </label>
                          <textarea
                            rows={2}
                            value={websiteData.vision}
                            onChange={(e) =>
                              setWebsiteData((p) => ({
                                ...p,
                                vision: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Contact Email
                            </label>
                            <input
                              type="email"
                              value={websiteData.contact_email}
                              onChange={(e) =>
                                setWebsiteData((p) => ({
                                  ...p,
                                  contact_email: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Contact Phone
                            </label>
                            <input
                              type="tel"
                              value={websiteData.contact_phone}
                              onChange={(e) =>
                                setWebsiteData((p) => ({
                                  ...p,
                                  contact_phone: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
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
    </div>
  );
}

function MembersQuickActionsDropdown({
  selectedMembers = [],
  onDeleteSelected = () => {},
  onBulkEdit = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const ref = useRef();
  const exportRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowExportModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const formatLower = format.toLowerCase();
    try {
      const response = await fetch(`${baseUrl}/api/data/export/${formatLower}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      const data = await response.json();
      if (data.success) {
        if (formatLower === "csv" || formatLower === "excel") {
          const blob = new Blob([data.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename || `members-export.${formatLower === "excel" ? "xlsx" : "csv"}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (formatLower === "pdf" && data.pdf_url) {
          window.open(`${baseUrl}${data.pdf_url}`, "_blank");
        }
        if (window.showToast) window.showToast(`${format} export completed!`, "success");
      } else {
        if (window.showToast) window.showToast(data.error || "Export failed", "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      if (window.showToast) window.showToast("Export failed. Please try again.", "error");
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
              href="/members/add"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition"
            >
              <i className="fas fa-user-plus"></i> Add New Member
            </a>
            <a
              href="/bulk"
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
          </div>
        )}
      </div>
    </>
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
