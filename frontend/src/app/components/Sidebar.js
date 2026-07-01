"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useToast } from "./Toast";

export default function Sidebar({
  notifications,
  notificationsOpen,
  setNotificationsOpen,
  userMenuOpen,
  setUserMenuOpen,
  sidebarOpen,
  setSidebarOpen,
  setSettingsOpen,
}) {
  const { theme, setTheme, mounted } = useTheme();
  const { showSuccess } = useToast();
  const pathname = usePathname();

  // Test toast on mount
  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        showSuccess("Sidebar loaded successfully!");
      }, 1000);
    }
  }, [mounted, showSuccess]);

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const parsedUser = JSON.parse(user);

          if (parsedUser.congregationId === "1") {
            setUserInfo({
              username: "District Admin",
              congregationName: "District Admin",
            });
          } else {
            setUserInfo(parsedUser);
          }
        } catch (e) {
          setUserInfo({
            username: "District Admin",
            congregationName: "District Admin",
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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <>
      {/* Sidebar */}
      <div
        data-sidebar
        className={`fixed left-0 top-16 ${mounted && theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg transition-all duration-300 z-20 
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
              >
                <i
                  className={`fas ${sidebarOpen ? "fa-chevron-left" : "fa-chevron-right"} text-sm`}
                ></i>
              </button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className={`${sidebarOpen ? "p-4" : "p-2"} space-y-2`}>
            <Link
              href={
                typeof window !== "undefined" &&
                localStorage.getItem("congregationId") &&
                localStorage.getItem("congregationId") !== "1"
                  ? "/local/dashboard"
                  : "/dashboard"
              }
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/dashboard"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Dashboard"
            >
              <i
                className={`fas fa-tachometer-alt text-lg flex-shrink-0 ${pathname === "/dashboard" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/dashboard" ? "text-white" : ""}`}
                >
                  Dashboard
                </span>
              )}
            </Link>

            <Link
              href="/"
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Home"
            >
              <i
                className={`fas fa-home text-lg flex-shrink-0 ${pathname === "/" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/" ? "text-white" : ""}`}
                >
                  Home
                </span>
              )}
            </Link>

            <Link
              href="/members"
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/members"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Members"
            >
              <i
                className={`fas fa-users text-lg flex-shrink-0 ${pathname === "/members" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/members" ? "text-white" : ""}`}
                >
                  Members
                </span>
              )}
            </Link>

            <Link
              href="/attendance"
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/attendance"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Attendance"
            >
              <i
                className={`fas fa-calendar-check text-lg flex-shrink-0 ${pathname === "/attendance" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/attendance" ? "text-white" : ""}`}
                >
                  Attendance
                </span>
              )}
            </Link>

            <Link
              href="/analytics"
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/analytics"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Analytics"
            >
              <i
                className={`fas fa-chart-bar text-lg flex-shrink-0 ${pathname === "/analytics" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/analytics" ? "text-white" : ""}`}
                >
                  Analytics
                </span>
              )}
            </Link>

            <Link
              href="/bulk"
              className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 rounded-lg transition-all duration-200 min-w-0 ${
                pathname === "/bulk"
                  ? mounted && theme === "dark"
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : mounted && theme === "dark"
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"
              }`}
              title="Add Member"
            >
              <i
                className={`fas fa-user-plus text-lg flex-shrink-0 ${pathname === "/bulk" ? "text-white" : ""}`}
              ></i>
              {sidebarOpen && (
                <span
                  className={`font-medium truncate ${pathname === "/bulk" ? "text-white" : ""}`}
                >
                  Add Member
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <div
              className={`w-full flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"} p-3 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors min-w-0`}
            >
              <button
                onClick={toggleTheme}
                className="relative w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full p-0.5 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label="Toggle theme"
                title={
                  mounted && theme === "light"
                    ? "Switch to Dark Mode"
                    : "Switch to Light Mode"
                }
              >
                {/* Toggle Track */}
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-inner">
                  {/* Toggle Handle */}
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-600 rounded-full shadow-lg transition-all duration-300 transform ${
                      mounted && theme === "dark"
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  >
                    {/* Moon Icon for Dark Mode */}
                    {mounted && theme === "dark" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}

                    {/* Sun Icon for Light Mode */}
                    {mounted && theme === "light" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      mounted && theme === "dark"
                        ? "bg-gradient-to-r from-cyan-400/20 to-orange-500/20 shadow-lg shadow-cyan-400/30"
                        : "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 shadow-lg shadow-yellow-400/30"
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
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`w-full flex items-center space-x-3 p-2 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors relative min-w-0`}
                title="Notifications"
              >
                <i className="fas fa-bell text-lg flex-shrink-0"></i>
                {sidebarOpen && (
                  <span className="font-medium text-sm truncate">
                    Notifications
                  </span>
                )}
                {notifications && notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                    {notifications.length}
                  </span>
                )}
              </button>
              {/* Notifications Dropdown */}
              {notificationsOpen && sidebarOpen && (
                <div
                  id="notifications-dropdown"
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-48 overflow-y-auto min-w-0"
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                                      : "bg-orange-500"
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-900 dark:text-white truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {notification.time}
                              </p>
                            </div>
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
                    <button className="text-xs text-orange-500 dark:text-orange-400 hover:underline truncate">
                      View all notifications
                    </button>
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
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`w-full flex items-center space-x-3 p-2 ${mounted && theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors min-w-0`}
                title={userInfo?.username || "User"}
              >
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
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
              {userMenuOpen && sidebarOpen && (
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
                        // Clear localStorage
                        localStorage.removeItem("authToken");
                        sessionStorage.removeItem("authToken");
                        localStorage.removeItem("user");
                        sessionStorage.removeItem("user");
                        localStorage.removeItem("congregationId");
                        localStorage.removeItem("congregationName");

                        // Clear autoLogout timers if available
                        if (
                          typeof window !== "undefined" &&
                          window.autoLogout
                        ) {
                          window.autoLogout.destroy();
                        }

                        // Show success message
                        showSuccess("Logged out successfully!");

                        // Create a visible notification that stays on screen
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
