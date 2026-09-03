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
  const [securityMethod, setSecurityMethod] = useState("password");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [securityAccessGranted, setSecurityAccessGranted] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    attendance_reminder: {
      title: "Attendance Reminder",
      message_template: "Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you! - Ahinsan District YPG",
      is_active: true,
      target_congregations: "all", 
      selected_congregations: []
    },
    birthday_message: {
      title: "Birthday Message", 
      message_template: "On your special day, {name}, Ahinsan District YPG celebrates you! Wishing you joy, good health, and God's abundant favour in the year ahead. Happy Birthday!",
      is_active: true,
      target_congregations: "all",
      selected_congregations: []
    },
    welcome_message: {
      title: "Welcome Message",
      message_template: "Welcome {name} to {congregation}! We're so glad to have you join our family at Ahinsan District YPG.",
      is_active: true,
      target_congregations: "all",
      selected_congregations: []
    },
    joint_program_notification: {
      title: "Joint Program Notification",
      message_template: "Joint program scheduled for {date} ({day}) at {location}. All congregations are invited by Ahinsan District YPG!",
      is_active: true,
      target_congregations: "all",
      selected_congregations: []
    }
  });

  // All 10 congregations from the system
  const [availableCongregations] = useState([
    "Emmanuel Congregation Ahinsan",
    "Peniel Congregation Esreso No1",
    "Mizpah Congregation Odagya No1",
    "Christ Congregation Ahinsan Estate",
    "Ebenezer Congregation Dompoase Aprabo",
    "Favour Congregation Esreso No2",
    "Liberty Congregation Esreso High Tension",
    "Odagya No2",
    "NOM",
    "Kokobriko"
  ]);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Initialize sidebar based on screen size
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

   
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize auto-logout
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      autoLogout.updateLoginStatus(true);
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
            // For info type, use success but with different styling
            showSuccess(message);
          }
        };
      }
    }

    // Cleanup on unmount
    return () => {
      autoLogout.destroy();
    };
  }, [showSuccess, showError]);

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

  // Handle settings actions with toast messages
  const handleProfileUpdate = () => {
    showSuccess("Profile updated successfully!");
  };

  const handlePasswordUpdate = () => {
    showSuccess("Password settings updated successfully!");
  };

  const handlePinUpdate = () => {
    showSuccess("PIN settings updated successfully!");
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
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      showSuccess("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  const handleReminderSettingChange = (settingType, field, value) => {
    setReminderSettings(prev => ({
      ...prev,
      [settingType]: {
        ...prev[settingType],
        [field]: value
      }
    }));
  };

  const handleSaveReminderSettings = () => {
    // TODO: Save to backend
    showSuccess("Reminder settings saved successfully!");
  };

  const handleSendReminder = (settingType) => {
    const setting = reminderSettings[settingType];
    
    if (!setting.is_active) {
      showError("This message type is currently disabled. Please enable it first.");
      return;
    }

    let targetCongregations = [];
    
    switch (setting.target_congregations) {
      case "all":
        targetCongregations = availableCongregations;
        break;
      case "specific":
        if (setting.selected_congregations.length === 0) {
          showError("Please select at least one congregation to send messages to.");
          return;
        }
        targetCongregations = setting.selected_congregations;
        break;
      case "non_submitting":
        // This would be determined by the current attendance data
        targetCongregations = ["Emmanuel Congregation Ahinsan", "Peniel Congregation Esreso No1"]; // Demo data
        break;
    }

    // TODO: Send to backend API
    const message = setting.message_template
      .replace('{congregation}', 'Test Congregation')
      .replace('{date}', new Date().toLocaleDateString())
      .replace('{day}', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
      .replace('{name}', 'John Doe')
      .replace('{location}', 'Main Hall');

    showSuccess(`Sending ${setting.title} to ${targetCongregations.length} congregation(s): ${targetCongregations.join(', ')}`);
    
    // Simulate sending
    setTimeout(() => {
      showSuccess(`Successfully sent ${setting.title} to ${targetCongregations.length} congregation(s)!`);
    }, 2000);
  };

  const handleTestReminder = (settingType) => {
    const setting = reminderSettings[settingType];
    const testMessage = setting.message_template
      .replace('{congregation}', 'Test Congregation')
      .replace('{date}', '2025-01-19')
      .replace('{day}', 'Sunday')
      .replace('{name}', 'John Doe')
      .replace('{location}', 'Main Hall');
    
    showSuccess(`Test message: ${testMessage}`);
  };

  const handleCongregationSelection = (settingType, congregation) => {
    const setting = reminderSettings[settingType];
    const updatedSelected = setting.selected_congregations.includes(congregation)
      ? setting.selected_congregations.filter(c => c !== congregation)
      : [...setting.selected_congregations, congregation];
    
    handleReminderSettingChange(settingType, 'selected_congregations', updatedSelected);
  };

  const handleTargetCongregationChange = (settingType, target) => {
    handleReminderSettingChange(settingType, 'target_congregations', target);
    if (target === 'all') {
      handleReminderSettingChange(settingType, 'selected_congregations', []);
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
        onClick={() => {
          // Close sidebar when clicking outside on mobile
          if (sidebarOpen && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <div className="flex h-96">
                {/* Settings Sidebar */}
                <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <nav className="p-4 space-y-2">
                    <button
                      onClick={() => setActiveSettingsTab("profile")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "profile" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-user mr-2"></i>Profile
                    </button>
                    <button
                      onClick={handleSecurityTabClick}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "security" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-shield-alt mr-2"></i>Security
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("privacy")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "privacy" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-user-secret mr-2"></i>Privacy
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("notifications")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "notifications" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-bell mr-2"></i>Notifications
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("appearance")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "appearance" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-palette mr-2"></i>Appearance
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("data")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "data" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-database mr-2"></i>Data Management
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("about")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "about" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-info-circle mr-2"></i>About
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("reminders")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === "reminders" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <i className="fas fa-bell mr-2"></i>Reminder Messages
                    </button>
                    <button
                      onClick={() => setActiveSettingsTab("website")}
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
                            defaultValue="Admin User"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            defaultValue="admin@ypg.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            defaultValue="+233 20 123 4567"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                            Role
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base">
                            <option>System Administrator</option>
                            <option>Data Manager</option>
                            <option>Viewer</option>
                          </select>
                        </div>
                        <button
                          onClick={handleProfileUpdate}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base"
                        >
                          Update Profile
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
                            Password Settings
                          </h4>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="2fa"
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
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base"
                          >
                            Update Password Settings
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
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Current PIN
                            </label>
                            <input
                              type="password"
                              maxLength="6"
                              placeholder="Enter 4-6 digit PIN"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              New PIN
                            </label>
                            <input
                              type="password"
                              maxLength="6"
                              placeholder="Enter 4-6 digit PIN"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                              Confirm New PIN
                            </label>
                            <input
                              type="password"
                              maxLength="6"
                              placeholder="Confirm 4-6 digit PIN"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs sm:text-base"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pin-actions"
                              className="rounded"
                              defaultChecked
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
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base"
                          >
                            Update PIN Settings
                          </button>
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
                            <button className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700">
                              <i className="fas fa-download mr-2"></i>Export as
                              CSV
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700">
                              <i className="fas fa-file-excel mr-2"></i>Export
                              as Excel
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700">
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
                            <button className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700">
                              <i className="fas fa-save mr-2"></i>Create Backup
                            </button>
                            <button className="w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700">
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
                          <button className="w-full text-left px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700">
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
                            Version: 1.0.0
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Build: 2025.1.1
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Last Updated: January 2024
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Description
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            YPG Database Management System is a comprehensive
                            solution for managing Young People&apos;s Group
                            data, attendance tracking, and analytics. Built with
                            modern web technologies to provide a seamless
                            experience for church administrators and youth
                            leaders.
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
                                  Message sent to congregations for attendance submission
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={reminderSettings.attendance_reminder.is_active}
                                onChange={(e) => handleReminderSettingChange("attendance_reminder", "is_active", e.target.checked)}
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
                                value={reminderSettings.attendance_reminder.title}
                                onChange={(e) => handleReminderSettingChange("attendance_reminder", "title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={reminderSettings.attendance_reminder.message_template}
                                onChange={(e) => handleReminderSettingChange("attendance_reminder", "message_template", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {congregation}, {date}, {day} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{congregation}"}, {"{date}"}, {"{day}"}
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
                                       checked={reminderSettings.attendance_reminder.target_congregations === "all"}
                                       onChange={(e) => handleTargetCongregationChange("attendance_reminder", e.target.value)}
                                       className="mr-2"
                                     />
                                     <span className="text-xs text-gray-700 dark:text-gray-300">All Congregations</span>
                                   </label>
                                   <label className="flex items-center">
                                     <input
                                       type="radio"
                                       name="attendance_target"
                                       value="specific"
                                       checked={reminderSettings.attendance_reminder.target_congregations === "specific"}
                                       onChange={(e) => handleTargetCongregationChange("attendance_reminder", e.target.value)}
                                       className="mr-2"
                                     />
                                     <span className="text-xs text-gray-700 dark:text-gray-300">Specific Congregations</span>
                                   </label>
                                   <label className="flex items-center">
                                     <input
                                       type="radio"
                                       name="attendance_target"
                                       value="non_submitting"
                                       checked={reminderSettings.attendance_reminder.target_congregations === "non_submitting"}
                                       onChange={(e) => handleTargetCongregationChange("attendance_reminder", e.target.value)}
                                       className="mr-2"
                                     />
                                     <span className="text-xs text-gray-700 dark:text-gray-300">Non-submitting Only</span>
                                   </label>
                                 </div>
                                 {reminderSettings.attendance_reminder.target_congregations === "specific" && (
                                   <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                                     <div className="grid grid-cols-2 gap-1">
                                       {availableCongregations.map((congregation) => (
                                         <label key={congregation} className="flex items-center text-xs">
                                           <input
                                             type="checkbox"
                                             checked={reminderSettings.attendance_reminder.selected_congregations.includes(congregation)}
                                             onChange={() => handleCongregationSelection("attendance_reminder", congregation)}
                                             className="mr-1"
                                           />
                                           <span className="truncate">{congregation}</span>
                                         </label>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                             <div className="flex space-x-2">
                               <button
                                 onClick={() => handleTestReminder("attendance_reminder")}
                                 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                               >
                                 <i className="fas fa-play mr-1"></i>Test Message
                               </button>
                               <button
                                 onClick={() => handleSendReminder("attendance_reminder")}
                                 className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                               >
                                 <i className="fas fa-paper-plane mr-1"></i>Send Message
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
                                checked={reminderSettings.birthday_message.is_active}
                                onChange={(e) => handleReminderSettingChange("birthday_message", "is_active", e.target.checked)}
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
                                onChange={(e) => handleReminderSettingChange("birthday_message", "title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={reminderSettings.birthday_message.message_template}
                                onChange={(e) => handleReminderSettingChange("birthday_message", "message_template", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {name} as placeholder"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{name}"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleTestReminder("birthday_message")}
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
                                checked={reminderSettings.welcome_message.is_active}
                                onChange={(e) => handleReminderSettingChange("welcome_message", "is_active", e.target.checked)}
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
                                onChange={(e) => handleReminderSettingChange("welcome_message", "title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={reminderSettings.welcome_message.message_template}
                                onChange={(e) => handleReminderSettingChange("welcome_message", "message_template", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {name}, {congregation} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{name}"}, {"{congregation}"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleTestReminder("welcome_message")}
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
                                checked={reminderSettings.joint_program_notification.is_active}
                                onChange={(e) => handleReminderSettingChange("joint_program_notification", "is_active", e.target.checked)}
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
                                value={reminderSettings.joint_program_notification.title}
                                onChange={(e) => handleReminderSettingChange("joint_program_notification", "title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Message Template
                              </label>
                              <textarea
                                value={reminderSettings.joint_program_notification.message_template}
                                onChange={(e) => handleReminderSettingChange("joint_program_notification", "message_template", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-700"
                                placeholder="Use {date}, {day}, {location} as placeholders"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Available placeholders: {"{date}"}, {"{day}"}, {"{location}"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleTestReminder("joint_program_notification")}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <i className="fas fa-play mr-1"></i>Test Message
                            </button>
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

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
    // Here you would implement actual export logic
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
