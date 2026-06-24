/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import ToastContainer from "../components/ToastContainer";
import AttendanceWaveChart from "../components/AttendanceWaveChart";
import autoLogout from "../utils/autoLogout";
import getDataStore from "../utils/dataStore";

export default function DashboardPage() {
  // Redirect local users to their local dashboard
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.congregationId && user.congregationId !== "1") {
          window.location.href = "/local/dashboard";
        }
      }
    } catch (e) {}
  }, []);
  const [dashboardStats, setDashboardStats] = useState({
    totalMembers: 0,
    totalCongregations: 0,
    thisWeekAttendance: 0,
    newMembersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Initialize auto-logout when component mounts
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    const congregationId = localStorage.getItem("congregationId");
    if (user && congregationId) {
      autoLogout.updateLoginStatus(true);
    } else {
      // If not logged in, redirect to login
      window.location.href = "/login";
    }

    // Cleanup on unmount
    return () => {
      autoLogout.destroy();
    };
  }, []);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dataStore = getDataStore();
      const stats = await dataStore.fetchHomeStats();
      if (stats) {
        setDashboardStats({
          totalMembers: stats.totalMembers || 0,
          totalCongregations: stats.totalCongregations || 0,
          thisWeekAttendance: stats.thisWeekAttendance || 0,
          newMembersThisMonth: stats.newMembersThisMonth || 0,
        });
      } else {
        showToast("Failed to fetch dashboard data", "error");
      }
    } catch (error) {
      showToast("Error fetching dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  return (
    <DashboardLayout currentPage="Dashboard">
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white text-sm font-semibold transition-all duration-300
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          role="alert"
          aria-live="assertive"
          tabIndex={0}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Welcome Message Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <i className="fas fa-church text-blue-200"></i>
                You Are Welcome
              </h2>
              <p className="text-blue-100 text-lg mb-4">
                Grace and leadership go hand in hand. You&apos;re logged in as a
                District Admin. View, manage and check the trends of the
                district guild across the{" "}
                {loading ? "..." : dashboardStats.totalCongregations}{" "}
                congregations in the district
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <span>System Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className="fas fa-calendar"></i>
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
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 sm:gap-6 lg:grid lg:grid-cols-4 min-w-max lg:min-w-0">
            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden group rounded-lg p-3 sm:p-4 lg:p-6 flex-shrink-0 w-48 sm:w-auto lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 dark:from-blue-400/10 dark:to-blue-600/10 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Total Members
                  </p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? "Loading..." : dashboardStats.totalMembers}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <i className="fas fa-users text-sm sm:text-xl lg:text-2xl text-blue-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-green-500/20 relative overflow-hidden group rounded-lg p-3 sm:p-4 lg:p-6 flex-shrink-0 w-48 sm:w-auto lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 dark:from-green-400/10 dark:to-green-600/10 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Congregations
                  </p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? "Loading..." : dashboardStats.totalCongregations}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <i className="fas fa-church text-sm sm:text-xl lg:text-2xl text-green-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-purple-500/20 relative overflow-hidden group rounded-lg p-3 sm:p-4 lg:p-6 flex-shrink-0 w-48 sm:w-auto lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 dark:from-purple-400/10 dark:to-purple-600/10 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    This Week&apos;s Attendance
                  </p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? "Loading..." : dashboardStats.thisWeekAttendance}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <i className="fas fa-calendar-check text-sm sm:text-xl lg:text-2xl text-purple-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden group rounded-lg p-3 sm:p-4 lg:p-6 flex-shrink-0 w-48 sm:w-auto lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20 dark:from-orange-400/10 dark:to-orange-600/10 animate-pulse"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    New Members This Month
                  </p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {loading
                      ? "Loading..."
                      : dashboardStats.newMembersThisMonth}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <i className="fas fa-user-plus text-sm sm:text-xl lg:text-2xl text-orange-600 group-hover:scale-110 transition-transform duration-200"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AttendanceWaveChart />

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-bolt text-blue-600 mr-2"></i>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Add New Member */}
            <div className="relative group">
              <div className="bg-blue-50 dark:bg-gray-700 shadow-lg dark:shadow-blue-500/20 relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 dark:from-blue-400/10 dark:to-blue-600/10 animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Member
                  </span>
                  <i className="fas fa-user-plus text-lg text-blue-600"></i>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute z-20 w-64 p-3 text-sm text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 before:absolute before:w-2 before:h-2 before:bg-gray-800 dark:before:bg-gray-900 before:rotate-45 before:top-full before:-translate-y-1/2 before:left-1/2 before:-translate-x-1/2">
                Register individual members with personal and church details
                Navigate to the sidebar and get started
              </div>
            </div>

            {/* Record Attendance */}
            <div className="relative group">
              <div className="bg-green-50 dark:bg-gray-700 shadow-lg dark:shadow-green-500/20 relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 dark:from-green-400/10 dark:to-green-600/10 animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Record Attendance
                  </span>
                  <i className="fas fa-clipboard-check text-lg text-green-600"></i>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute z-20 w-64 p-3 text-sm text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 before:absolute before:w-2 before:h-2 before:bg-gray-800 dark:before:bg-gray-900 before:rotate-45 before:top-full before:-translate-y-1/2 before:left-1/2 before:-translate-x-1/2">
                Track weekly attendance of all guilders across the district
                Navigate to the sidebar and get started
              </div>
            </div>

            {/* View Analytics */}
            <div className="relative group">
              <div className="bg-purple-50 dark:bg-gray-700 shadow-lg dark:shadow-purple-500/20 relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 dark:from-purple-400/10 dark:to-purple-600/10 animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    View Analytics
                  </span>
                  <i className="fas fa-chart-bar text-lg text-purple-600"></i>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute z-20 w-64 p-3 text-sm text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 before:absolute before:w-2 before:h-2 before:bg-gray-800 dark:before:bg-gray-900 before:rotate-45 before:top-full before:-translate-y-1/2 before:left-1/2 before:-translate-x-1/2">
                View comprehensive analytics and reports for attendance and
                growth trends Navigate to the sidebar and get started
              </div>
            </div>

            {/* Bulk Registration */}
            <div className="relative group">
              <div className="bg-orange-50 dark:bg-gray-700 shadow-lg dark:shadow-orange-500/20 relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20 dark:from-orange-400/10 dark:to-orange-600/10 animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bulk Registration
                  </span>
                  <i className="fas fa-users text-lg text-orange-600"></i>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute z-20 w-64 p-3 text-sm text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 before:absolute before:w-2 before:h-2 before:bg-gray-800 dark:before:bg-gray-900 before:rotate-45 before:top-full before:-translate-y-1/2 before:left-1/2 before:-translate-x-1/2">
                Import multiple members at once using CSV files or manual entry
                forms Navigate to the sidebar and get started
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Toast Container */}
      <ToastContainer />
    </DashboardLayout>
  );
}
