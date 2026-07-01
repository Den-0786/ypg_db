"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useToast } from "./Toast";

export default function LocalSidebar({
  sidebarOpen,
  setSidebarOpen,
  setSettingsOpen,
  userMenuOpen,
  setUserMenuOpen,
  notificationsOpen,
  setNotificationsOpen,
}) {
  const { theme, setTheme, mounted } = useTheme();
  const { showSuccess } = useToast();
  const pathname = usePathname();

  // Test toast on mount
  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        showSuccess("LocalSidebar loaded successfully!");
      }, 1000);
    }
  }, [mounted, showSuccess]);

  // Get user information from localStorage
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          setUserInfo(JSON.parse(user));
        } catch (e) {
          setUserInfo({
            username: "Local Admin",
            congregationName: "Local Executive",
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuOpen) {
        const userMenuElement = document.getElementById("user-menu-dropdown");
        const userMenuButton = event.target.closest("[data-user-menu-button]");
        if (
          userMenuElement &&
          !userMenuElement.contains(event.target) &&
          !userMenuButton
        ) {
          setUserMenuOpen(false);
        }
      }

      // Close notifications if clicking outside
      if (notificationsOpen) {
        const notificationsElement = document.getElementById(
          "notifications-dropdown"
        );
        const notificationsButton = event.target.closest(
          "[data-notifications-button]"
        );
        if (
          notificationsElement &&
          !notificationsElement.contains(event.target) &&
          !notificationsButton
        ) {
          setNotificationsOpen(false);
        }
      }

      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebarElement = document.querySelector("[data-sidebar]");
        const sidebarToggleButton = event.target.closest(
          "[data-sidebar-toggle]"
        );
        if (
          sidebarElement &&
          !sidebarElement.contains(event.target) &&
          !sidebarToggleButton
        ) {
          setSidebarOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    userMenuOpen,
    notificationsOpen,
    sidebarOpen,
    setUserMenuOpen,
    setNotificationsOpen,
    setSidebarOpen,
  ]);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const congregationName = localStorage.getItem("congregationName");

      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/`;
      if (congregationName && congregationName !== "District Admin") {
        url += `?congregation=${encodeURIComponent(congregationName)}`;
      }

      const response = await fetch(url);
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
      }
    } catch (error) {
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const congregationName = localStorage.getItem("congregationName");
      let body = `id=${notificationId}`;
      if (congregationName && congregationName !== "District Admin") {
        body += `&congregation=${encodeURIComponent(congregationName)}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/mark-read/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body,
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
      }
    } catch (error) {}
  };

  const clearAllNotifications = async () => {
    try {
      const congregationName = localStorage.getItem("congregationName");
      let body = "";
      if (congregationName && congregationName !== "District Admin") {
        body = `congregation=${encodeURIComponent(congregationName)}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/clear/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body,
        }
      );

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const createTestNotifications = async () => {
    try {
      const congregationName = localStorage.getItem("congregationName");

      if (!congregationName || congregationName === "District Admin") {
        console.error("No congregation selected");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications/create-test/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            congregation: congregationName,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating test notifications:", error);
    }
  };
  const links = [
    {
      href: "/local/dashboard",
      icon: "fas fa-tachometer-alt",
      label: "Dashboard",
    },
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/local/members", icon: "fas fa-users", label: "Members" },
    {
      href: "/local/attendance",
      icon: "fas fa-calendar-check",
      label: "Attendance",
    },
    { href: "/local/analytics", icon: "fas fa-chart-bar", label: "Analytics" },
    { href: "/local/bulk", icon: "fas fa-user-plus", label: "Add Member" },
  ];
  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={`fixed left-0 top-16 ${mounted && theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg transition-all duration-300 z-40
        ${sidebarOpen ? "w-64" : "w-16"} ${sidebarOpen ? "block" : "hidden lg:block"} overflow-y-auto overflow-x-hidden`}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <div className="flex flex-col min-w-0">
          {/* Sidebar Header */}
          <div
            className={`${sidebarOpen ? "p-4" : "p-2"} border-b ${mounted && theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
          >
            <div
              className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} min-w-0`}
            >
              {sidebarOpen && (
                <h2
                  className={`text-lg font-semibold ${mounted && theme === "dark" ? "text-white" : "text-gray-800"} truncate`}
                >
                  Navigation
                </h2>
              )}
              {/* Collapse button only on desktop */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`hidden lg:inline ${mounted && theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"} transition-colors flex-shrink-0`}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                onMouseEnter={() => {
                  const el = document.getElementById("sidebar-tooltip");
                  if (el) el.style.display = "block";
                }}
                onMouseLeave={() => {
                  const el = document.getElementById("sidebar-tooltip");
                  if (el) el.style.display = "none";
                }}
                onFocus={() => {
                  const el = document.getElementById("sidebar-tooltip");
                  if (el) el.style.display = "block";
                }}
                onBlur={() => {
                  const el = document.getElementById("sidebar-tooltip");
                  if (el) el.style.display = "none";
                }}
              >
                <i
                  className={`fas ${sidebarOpen ? "fa-chevron-left" : "fa-chevron-right"} text-sm`}
                ></i>
              </button>
              {/* Tooltip for hamburger/collapse */}
              <div
                id="sidebar-tooltip"
                style={{ display: "none" }}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 rounded bg-gray-900 text-white text-xs shadow z-50 whitespace-nowrap"
                role="tooltip"
              >
                {sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              </div>
            </div>
          </div>
          {/* Sidebar Navigation */}
          <nav className={`${sidebarOpen ? "p-4" : "p-2"} space-y-2`}>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                    isActive
                      ? mounted && theme === "dark"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-blue-500 text-white shadow-lg"
                      : mounted && theme === "dark"
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
                  }`}
                  title={link.label}
                >
                  <i
                    className={`${link.icon} text-lg flex-shrink-0 ${isActive ? "text-white" : ""}`}
                  ></i>
                  {sidebarOpen && (
                    <span
                      className={`font-medium truncate ${isActive ? "text-white" : ""}`}
                    >
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Theme Toggle */}
            <div
              className={`w-full flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors min-w-0`}
            >
              <button
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                }}
                className="relative w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full p-0.5 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Toggle theme"
                title={
                  mounted && theme === "light"
                    ? "Switch to Dark Mode"
                    : "Switch to Light Mode"
                }
              >
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-inner">
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-600 rounded-full shadow-lg transition-all duration-300 transform ${
                      mounted && theme === "dark"
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  >
                    {mounted && theme === "dark" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                    {mounted && theme === "light" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-lg" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      mounted && theme === "dark"
                        ? "bg-gradient-to-r from-cyan-400/20 to-blue-500/20 shadow-lg shadow-cyan-400/30"
                        : "bg-gradient-to-r from-yellow-400/20 to-blue-500/20 shadow-lg shadow-yellow-400/30"
                    }`}
                  />
                </div>
              </button>
              {sidebarOpen && (
                <span className="font-medium truncate">Theme</span>
              )}
            </div>
          </nav>
          {/* Notifications */}
          <div
            className={`p-2 border-t ${mounted && theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="relative">
              <button
                data-notifications-button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                }}
                className={`w-full flex items-center space-x-3 p-2 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors relative min-w-0`}
                title="Notifications"
              >
                <i className="fas fa-bell text-lg flex-shrink-0"></i>
                {sidebarOpen && (
                  <span className="font-medium text-sm truncate">
                    Notifications
                  </span>
                )}
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                    {notifications.filter((n) => !n.is_read).length}
                  </span>
                )}
              </button>
              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div
                  id="notifications-dropdown"
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-48 overflow-y-auto min-w-0"
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        Notifications
                      </h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          title="Clear all notifications"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-2 text-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Loading...
                        </p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() =>
                            !notification.is_read &&
                            markNotificationAsRead(notification.id)
                          }
                          className={`p-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            notification.is_read
                              ? ""
                              : "bg-blue-50 dark:bg-blue-900/20"
                          }`}
                        >
                          <div className="flex items-start space-x-2 min-w-0">
                            <div
                              className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${
                                notification.type === "success"
                                  ? "bg-green-500"
                                  : notification.type === "warning"
                                    ? "bg-yellow-500"
                                    : notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "birthday"
                                        ? "bg-pink-500"
                                        : notification.type === "new_member"
                                          ? "bg-blue-500"
                                          : notification.type === "attendance"
                                            ? "bg-purple-500"
                                            : notification.type === "system"
                                              ? "bg-gray-500"
                                              : "bg-blue-500"
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              {notification.title && (
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </p>
                              )}
                              <p className="text-xs text-gray-900 dark:text-white truncate">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {notification.time}
                                </p>
                                {notification.sender &&
                                  notification.sender !== "System" && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate ml-2">
                                      by {notification.sender}
                                    </p>
                                  )}
                              </div>
                            </div>
                            {!notification.is_read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center">
                      <button
                        onClick={fetchNotifications}
                        className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate"
                      >
                        {notificationsLoading
                          ? "Refreshing..."
                          : "See all notifications"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* User Menu */}
          <div
            className={`p-2 border-t ${mounted && theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="relative">
              <button
                data-user-menu-button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                }}
                className={`w-full flex items-center space-x-3 p-2 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors min-w-0`}
                title={userInfo?.username || "User"}
              >
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-xs text-white"></i>
                </div>
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm truncate">
                      {userInfo?.username || "User"}
                    </span>
                    <i className="fas fa-chevron-down text-xs flex-shrink-0"></i>
                  </>
                )}
              </button>
              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div
                  id="user-menu-dropdown"
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-0"
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {userInfo?.username || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userInfo?.congregationName || "Congregation"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (setSettingsOpen) setSettingsOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 min-w-0"
                    >
                      <i className="fas fa-cog text-sm flex-shrink-0"></i>
                      <span className="truncate">Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("authToken");
                        sessionStorage.removeItem("authToken");
                        localStorage.removeItem("user");
                        sessionStorage.removeItem("user");
                        localStorage.removeItem("congregationId");
                        localStorage.removeItem("congregationName");

                        if (
                          typeof window !== "undefined" &&
                          window.autoLogout
                        ) {
                          window.autoLogout.destroy();
                        }

                        showSuccess("Logged out successfully!");
                        const notification = document.createElement("div");
                        notification.innerHTML = `
                          <div style="
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #10B981;
                            color: white;
                            padding: 16px 20px;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            z-index: 9999;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                          ">
                            <i class="fas fa-check-circle"></i>
                            Logged out successfully!
                          </div>
                        `;
                        document.body.appendChild(notification);

                        // Redirect after a short delay
                        setTimeout(() => {
                          window.location.href = "/";
                        }, 2000);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 min-w-0"
                    >
                      <i className="fas fa-sign-out-alt text-sm flex-shrink-0"></i>
                      <span className="truncate">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
