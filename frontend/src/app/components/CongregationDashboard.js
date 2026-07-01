"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "./DashboardLayout";
import ToastContainer from "./ToastContainer";
import autoLogout from "../utils/autoLogout";
import getDataStore from "../utils/dataStore";

export default function CongregationDashboard({
  congregationId,
  congregationName,
}) {
  const [congregationData, setCongregationData] = useState({
    members: [],
    attendance: [],
    analytics: {},
    leaderboard: [],
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Congregation color mapping
  const congregationColors = {
    "Emmanuel Congregation Ahinsan": "bg-blue-500",
    "Peniel Congregation Esreso No1": "bg-green-500",
    "Mizpah Congregation Odagya No1": "bg-purple-500",
    "Christ Congregation Ahinsan Estate": "bg-red-500",
    "Ebenezer Congregation Dompoase Aprabo": "bg-yellow-500",
    "Favour Congregation Esreso No2": "bg-indigo-500",
    "Liberty Congregation Esreso High Tension": "bg-pink-500",
    "Odagya No2": "bg-teal-500",
    NOM: "bg-blue-500",
    Kokobriko: "bg-cyan-500",
  };

  const colorClass = congregationColors[congregationName] || "bg-gray-500";

  // Initialize auto-logout when component mounts
  useEffect(() => {
    // Check if user is logged in
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (token) {
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

  // Fetch congregation-specific data
  useEffect(() => {
    if (congregationId) {
      fetchCongregationData();
    }
  }, [congregationId]);

  const fetchCongregationData = () => {
    setLoading(true);

    try {
      // Filter data by congregation
      const dataStore = getDataStore();
      const members = dataStore.getMembers({ congregation: congregationName });
      const attendance = dataStore.getAttendanceRecords({
        congregation: congregationName,
      });
      const analytics = dataStore.getAnalyticsData();
      const leaderboard = dataStore.getLeaderboardData("weekly");

      setCongregationData({
        members,
        attendance,
        analytics,
        leaderboard,
      });
    } catch (error) {
      showToast("Error loading congregation data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  // Calculate statistics
  const calculateStats = () => {
    const { members, attendance } = congregationData;

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status !== "Inactive").length;
    const maleMembers = members.filter((m) => m.gender === "Male").length;
    const femaleMembers = members.filter((m) => m.gender === "Female").length;
    const executiveMembers = members.filter((m) => m.is_executive).length;

    const totalAttendance = attendance.reduce(
      (sum, r) => sum + (r.total || 0),
      0
    );
    const averageAttendance =
      attendance.length > 0 ? totalAttendance / attendance.length : 0;

    // This week's attendance
    const currentDate = new Date();
    const currentWeek = Math.ceil(
      (currentDate.getDate() +
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        ).getDay()) /
        7
    );
    const thisWeekAttendance = attendance
      .filter((r) => {
        const recordDate = new Date(r.date);
        const recordWeek = Math.ceil(
          (recordDate.getDate() +
            new Date(
              recordDate.getFullYear(),
              recordDate.getMonth(),
              1
            ).getDay()) /
            7
        );
        return (
          recordDate.getFullYear() === currentDate.getFullYear() &&
          recordDate.getMonth() === currentDate.getMonth() &&
          recordWeek === currentWeek
        );
      })
      .reduce((sum, r) => sum + (r.total || 0), 0);

    return {
      totalMembers,
      activeMembers,
      maleMembers,
      femaleMembers,
      executiveMembers,
      totalAttendance,
      averageAttendance: Math.round(averageAttendance),
      thisWeekAttendance,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Congregation Header */}
        <div
          className={`mb-8 p-6 rounded-lg text-white ${colorClass} shadow-lg`}
        >
          <h1 className="text-3xl font-bold mb-2">
            {congregationName} Dashboard
          </h1>
          <p className="text-lg opacity-90">
            Welcome to your congregation&apos;s management center
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <i className="fas fa-users text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <i className="fas fa-user-check text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <i className="fas fa-church text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Attendance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageAttendance}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <i className="fas fa-calendar-week text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.thisWeekAttendance}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {stats.maleMembers}
                </div>
                <div className="text-sm text-gray-600">Male</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {stats.femaleMembers}
                </div>
                <div className="text-sm text-gray-600">Female</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.executiveMembers}
                </div>
                <div className="text-sm text-gray-600">Executives</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/local/members"
                className="bg-blue-500 hover:bg-blue-500 text-white p-3 rounded-lg text-center transition-colors"
              >
                <i className="fas fa-users mr-2"></i>
                Manage Members
              </Link>
              <Link
                href="/local/attendance"
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg text-center transition-colors"
              >
                <i className="fas fa-calendar-check mr-2"></i>
                Log Attendance
              </Link>
              <Link
                href="/local/analytics"
                className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg text-center transition-colors"
              >
                <i className="fas fa-chart-bar mr-2"></i>
                View Analytics
              </Link>
              <Link
                href="/local/bulk"
                className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-colors"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Bulk Add
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {congregationData.attendance.slice(-3).map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">Attendance Record</div>
                  <div className="text-sm text-gray-600">
                    {new Date(record.date).toLocaleDateString()} -{" "}
                    {record.total} members
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Male: {record.male} | Female: {record.female}
                  </div>
                </div>
              </div>
            ))}
            {congregationData.attendance.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No recent activity found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </DashboardLayout>
  );
}
