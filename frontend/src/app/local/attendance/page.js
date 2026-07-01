/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useMemo } from "react";
import LocalDashboardLayout from "../../components/LocalDashboardLayout";
import AttendanceSummaryCards from "../../components/AttendanceSummaryCards";
import AttendanceForDayCard from "../../components/AttendanceForDayCard";
import WeeklyAttendanceCards from "../../components/WeeklyAttendanceCards";
import YearlyAttendanceCards from "../../components/YearlyAttendanceCards";
import AttendanceFilter from "../../components/AttendanceFilter";
import LogAttendanceModal from "../../components/LogAttendanceModal";
import JointProgramModal from "../../components/JointProgramModal";
import PinModal from "../../components/PinModal";
import ToastContainer from "../../components/ToastContainer";
import getDataStore from "../../utils/dataStore";

export default function LocalAttendancePage() {
  const [mounted, setMounted] = useState(false);
  const [congregationId, setCongregationId] = useState(null);
  const [congregationName, setCongregationName] = useState(null);

  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showJointProgramModal, setShowJointProgramModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);
  const [pendingEditAction, setPendingEditAction] = useState(null);
  const [editData, setEditData] = useState(null);
  const [prefillForm, setPrefillForm] = useState(null);
  const [logForm, setLogForm] = useState({
    week: "",
    month: "",
    year: "",
    date: "",
    male: 0,
    female: 0,
    total: 0,
    loggedBy: "",
    position: "",
    congregation: congregationName || "Local Congregation",
  });
  const [jointProgramForm, setJointProgramForm] = useState({
    week: "",
    month: "",
    year: "",
    date: "",
    programTitle: "",
    location: "",
    loggedBy: "",
    position: "",
    congregation: congregationName || "Local Congregation", // Dynamic congregation
  });

  // Get attendance records from data store
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalMale: 0,
    totalFemale: 0,
    weeksLogged: 0,
    totalWeeks: 52,
  });
  const [loading, setLoading] = useState(true);

  const getWeekNumber = (date) => {
    const d = new Date(date);
    const dayOfMonth = d.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);

    return weekNumber;
  };

  const getMonthName = (date) => {
    return new Date(date).toLocaleString("default", { month: "long" });
  };

  const getYear = (date) => {
    return new Date(date).getFullYear();
  };

  const generateCurrentMonthData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Deduplicate records by date+congregation (keep latest)
    const dedupMap = new Map();
    attendanceRecords.forEach((r) => {
      const key = `${r.date}__${r.congregation || ""}`;
      const existing = dedupMap.get(key);
      if (
        !existing ||
        new Date(r.timestamp || r.date) >
          new Date(existing.timestamp || existing.date)
      ) {
        dedupMap.set(key, r);
      }
    });
    const allRecords = Array.from(dedupMap.values());

    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (allRecords.length > 0) {
      const latestRecord = allRecords
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const latestDate = new Date(latestRecord.date);
      targetMonth = latestDate.getMonth();
      targetYear = latestDate.getFullYear();
    }

    // Filter records for the target month and year
    const monthRecords = allRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === targetMonth &&
        recordDate.getFullYear() === targetYear
      );
    });

    // Group by week
    const weeksMap = new Map();
    monthRecords.forEach((record) => {
      const weekNumber = getWeekNumber(record.date);
      if (!weeksMap.has(weekNumber)) {
        weeksMap.set(weekNumber, {
          week: `Week ${weekNumber}`,
          male: 0,
          female: 0,
          total: 0,
          isJointProgram: false,
          programTitle: "",
          location: "",
        });
      }
      const week = weeksMap.get(weekNumber);
      week.male += record.male || 0;
      week.female += record.female || 0;
      week.total += record.total || 0;
    });

    // Convert weeksMap to array and sort by week number
    const weeks = Array.from(weeksMap.values()).sort((a, b) => {
      const weekA = parseInt(a.week.replace("Week ", ""));
      const weekB = parseInt(b.week.replace("Week ", ""));
      return weekA - weekB;
    });

    // Calculate totals
    const totalMale = weeks.reduce((sum, week) => sum + week.male, 0);
    const totalFemale = weeks.reduce((sum, week) => sum + week.female, 0);
    const totalAttendance = totalMale + totalFemale;

    return {
      month: getMonthName(currentDate),
      year: currentYear.toString(),
      totalAttendance,
      totalMale,
      totalFemale,
      weeks,
    };
  };

  // Generate current year data dynamically from records
  const generateCurrentYearData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Deduplicate records by date+congregation (keep latest)
    const dedupMap = new Map();
    attendanceRecords.forEach((r) => {
      const key = `${r.date}__${r.congregation || ""}`;
      const existing = dedupMap.get(key);
      if (
        !existing ||
        new Date(r.timestamp || r.date) >
          new Date(existing.timestamp || existing.date)
      ) {
        dedupMap.set(key, r);
      }
    });
    const allRecords = Array.from(dedupMap.values());

    let targetYear = currentYear;

    if (allRecords.length > 0) {
      const latestRecord = allRecords
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const latestDate = new Date(latestRecord.date);
      targetYear = latestDate.getFullYear();
    }

    // Filter records for the target year
    const yearRecords = allRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === targetYear;
    });

    // Group by month
    const monthsMap = new Map();
    yearRecords.forEach((record) => {
      const monthName = getMonthName(record.date);
      if (!monthsMap.has(monthName)) {
        monthsMap.set(monthName, {
          month: monthName,
          male: 0,
          female: 0,
          total: 0,
        });
      }
      const month = monthsMap.get(monthName);
      month.male += record.male || 0;
      month.female += record.female || 0;
      month.total += record.total || 0;
    });

    // Convert monthsMap to array and sort by month order
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const months = Array.from(monthsMap.values()).sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    // Calculate totals
    const totalMale = months.reduce((sum, month) => sum + month.male, 0);
    const totalFemale = months.reduce((sum, month) => sum + month.female, 0);
    const totalAttendance = totalMale + totalFemale;

    return {
      year: currentYear.toString(),
      totalAttendance,
      totalMale,
      totalFemale,
      months,
    };
  };

  // Handle mounting and data loading
  useEffect(() => {
    setMounted(true);

    // Load congregation data from localStorage
    const storedCongregationId = localStorage.getItem("congregationId");
    const storedCongregationName = localStorage.getItem("congregationName");

    setCongregationId(storedCongregationId);
    setCongregationName(storedCongregationName);

    // Load data if congregation is available
    if (storedCongregationName) {
      loadAttendanceData(storedCongregationName);
    }
  }, []);

  const loadAttendanceData = async (congregationName) => {
    try {
      setLoading(true);
      const dataStore = getDataStore();

      // Fetch attendance records from API
      const records = await dataStore.getAttendanceRecords({
        congregation: congregationName,
      });

      setAttendanceRecords(records);

      // Update stats for congregation only
      const totalMale = records.reduce((sum, r) => sum + (r.male || 0), 0);
      const totalFemale = records.reduce((sum, r) => sum + (r.female || 0), 0);
      const weeksLogged = new Set(
        records.map((r) => `${r.year}-${r.month}-${r.week}`)
      ).size;

      setAttendanceStats({
        totalMale: totalMale,
        totalFemale: totalFemale,
        weeksLogged: weeksLogged,
        totalWeeks: 52,
      });

      // Update form congregation
      setLogForm((prev) => ({ ...prev, congregation: congregationName }));
      setJointProgramForm((prev) => ({
        ...prev,
        congregation: congregationName,
      }));
    } catch (error) {
      // Show error toast
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Error loading attendance data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate current month and year data with memoization
  const currentMonthData = useMemo(
    () => generateCurrentMonthData(),
    [attendanceRecords]
  );
  const currentYearData = useMemo(
    () => generateCurrentYearData(),
    [attendanceRecords]
  );

  // Get attendance data for the selected date
  const getAttendanceForDate = (date) => {
    // First try to find exact date match
    let record = attendanceRecords.find((r) => r.date === date);

    // If no exact match, get the most recent record
    if (!record && attendanceRecords.length > 0) {
      record = attendanceRecords[0]; // Records are already sorted by date desc
    }
    if (record) {
      // Ensure derived fields
      const d = new Date(record.date);
      const weekNum = getWeekNumber(record.date);
      const monthVal = (d.getMonth() + 1).toString().padStart(2, "0");
      return {
        id: record.id,
        date: record.date,
        male: record.male || 0,
        female: record.female || 0,
        total: record.total || 0,
        week: `week-${weekNum}`,
        month: monthVal,
        year: d.getFullYear().toString(),
        loggedBy: record.loggedBy || "",
        position: record.position || "",
        congregation: record.congregation,
      };
    }
    const now = new Date();
    return {
      id: undefined,
      date: now.toISOString().split("T")[0],
      male: 0,
      female: 0,
      total: 0,
      week: `week-${getWeekNumber(now)}`,
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
      year: now.getFullYear().toString(),
      loggedBy: "",
      position: "",
      congregation: congregationName,
    };
  };

  const selectedDateAttendance = getAttendanceForDate(selectedDate);

  useEffect(() => {
    setLogForm((prev) => ({
      ...prev,
      total: prev.male + prev.female,
    }));
  }, [logForm.male, logForm.female]);

  const handleInputChange = (field, value) => {
    setLogForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleJointProgramInputChange = (field, value) => {
    setJointProgramForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogAttendance = () => {
    setPendingDeleteAction(null);
    setPendingEditAction(null);
    setPendingAction("log");
    setShowPinModal(true);
  };

  const handleJointProgram = () => {
    setPendingDeleteAction(null);
    setPendingEditAction(null);
    setPendingAction("joint");
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    console.log("pendingDeleteAction:", pendingDeleteAction);
    console.log("attendanceRecords:", attendanceRecords);

    if (pendingDeleteAction) {
      // Check if there are records to delete
      if (attendanceRecords.length === 0) {
        window.showToast("No attendance records to delete", "error");
        setPendingDeleteAction(null);
        setShowPinModal(false);
        return;
      }

      // Show confirmation modal
      setShowDeleteConfirmModal(true);
    } else if (pendingEditAction) {
      // Handle edit operations
      switch (pendingEditAction) {
        case "week":
          window.showToast("PIN verified for week edit operation", "success");
          // Apply prepared prefill so all fields show
          if (prefillForm) {
            setLogForm((prev) => ({ ...prev, ...prefillForm }));
          }
          setShowLogModal(true);
          break;
        case "month":
          window.showToast("PIN verified for month edit operation", "success");
          // Use same modal for simplicity
          if (prefillForm) {
            setLogForm((prev) => ({ ...prev, ...prefillForm }));
          }
          setShowLogModal(true);
          break;
        case "day":
          window.showToast("PIN verified for day edit operation", "success");
          if (prefillForm) {
            setLogForm((prev) => ({ ...prev, ...prefillForm }));
          }
          setShowLogModal(true);
          break;
        default:
          break;
      }
      setPendingEditAction(null);
      setShowPinModal(false);
      return;
    } else if (pendingAction === "log") {
      // Handle log attendance
      window.showToast("PIN verified for attendance logging", "success");
      setShowPinModal(false);
      setShowLogModal(true);
    } else if (pendingAction === "joint") {
      // Handle joint program
      window.showToast("PIN verified for joint program", "success");
      setShowPinModal(false);
      setShowJointProgramModal(true);
    }
    setPendingAction(null);
  };

  const handleClosePinModal = () => {
    setShowPinModal(false);
    setPendingAction(null);
    setPendingDeleteAction(null);
    setPendingEditAction(null);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirmModal(false);

    try {
      let deletedCount = 0;

      switch (pendingDeleteAction) {
        case "week":
          // For testing - delete ALL records to see if API works
          console.log("All attendance records:", attendanceRecords);
          console.log("Total records to delete:", attendanceRecords.length);

          for (const record of attendanceRecords) {
            console.log(
              `Attempting to delete record ID: ${record.id}, Date: ${record.date}`
            );
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/${record.id}/delete/`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
              console.log(
                `Response for ID ${record.id}:`,
                response.status,
                response.ok
              );
              if (response.ok) {
                deletedCount++;
                console.log(`Successfully deleted record ID: ${record.id}`);
              } else {
                const errorText = await response.text();
                console.error(
                  `Failed to delete record ID ${record.id}:`,
                  errorText
                );
              }
            } catch (error) {
              console.error(`Error deleting record ID ${record.id}:`, error);
            }
          }
          console.log(
            `Total deleted: ${deletedCount} out of ${attendanceRecords.length}`
          );
          if (deletedCount > 0) {
            window.showToast(
              `Deleted ${deletedCount} attendance records`,
              "success"
            );
          } else {
            window.showToast("No records were deleted", "error");
          }
          break;

        case "month":
          // Delete all records for the current month
          const currentMonthRecords = attendanceRecords.filter((record) => {
            const recordDate = new Date(record.date);
            const today = new Date();
            return (
              recordDate.getMonth() === today.getMonth() &&
              recordDate.getFullYear() === today.getFullYear()
            );
          });

          for (const record of currentMonthRecords) {
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
            const response = await fetch(
              `${base}/api/attendance/${record.id}/delete/`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            if (response.ok) {
              deletedCount++;
            }
          }
          if (deletedCount > 0) {
            window.showToast(
              `Deleted ${deletedCount} attendance records for this month`,
              "success"
            );
          } else {
            window.showToast("No records were deleted", "error");
          }
          break;

        case "day":
          // For testing - delete ALL records to see if API works
          console.log(
            "Day delete - all attendance records:",
            attendanceRecords
          );
          console.log("Total records to delete:", attendanceRecords.length);

          for (const record of attendanceRecords) {
            console.log(
              `Attempting to delete record ID: ${record.id}, Date: ${record.date}`
            );
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/${record.id}/delete/`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
              console.log(
                `Response for ID ${record.id}:`,
                response.status,
                response.ok
              );
              if (response.ok) {
                deletedCount++;
                console.log(`Successfully deleted record ID: ${record.id}`);
              } else {
                const errorText = await response.text();
                console.error(
                  `Failed to delete record ID ${record.id}:`,
                  errorText
                );
              }
            } catch (error) {
              console.error(`Error deleting record ID ${record.id}:`, error);
            }
          }
          console.log(
            `Total deleted: ${deletedCount} out of ${attendanceRecords.length}`
          );
          if (deletedCount > 0) {
            window.showToast(
              `Deleted ${deletedCount} attendance records`,
              "success"
            );
          } else {
            window.showToast("No records were deleted", "error");
          }
          break;

        default:
          break;
      }

      // Update UI immediately after deletion
      if (deletedCount > 0) {
        console.log("Updating UI immediately...");
        // Clear all records immediately for instant UI update
        setAttendanceRecords([]);

        // Also refresh from server to ensure consistency
        console.log("Refreshing attendance data from server...");
        const dataStore = getDataStore();
        const refreshedRecords = await dataStore.getAttendanceRecords({
          congregation: congregationName,
        });
        setAttendanceRecords(refreshedRecords);
        console.log("Attendance data refreshed");
      }
    } catch (error) {
      console.error("Error deleting attendance records:", error);
      window.showToast("Failed to delete attendance records", "error");
    }

    setPendingDeleteAction(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setPendingDeleteAction(null);
  };

  const handleCloseLogModal = () => {
    setShowLogModal(false);
    setLogForm({
      week: "",
      month: "",
      year: "",
      date: "",
      male: 0,
      female: 0,
      total: 0,
      loggedBy: "",
      position: "",
      congregation: "Emmanuel Congregation Ahinsan",
    });
  };

  const handleCloseJointProgramModal = () => {
    setShowJointProgramModal(false);
    setJointProgramForm({
      week: "",
      month: "",
      year: "",
      date: "",
      programTitle: "",
      location: "",
      loggedBy: "",
      position: "",
      congregation: "Emmanuel Congregation Ahinsan",
    });
  };

  const handleSubmitLog = async () => {
    try {
      const dataStore = getDataStore();

      const attendanceData = {
        date: logForm.date,
        male: logForm.male,
        female: logForm.female,
        total: logForm.total,
        congregation: logForm.congregation,
        week: logForm.week,
        month: logForm.month,
        year: logForm.year,
        loggedBy: logForm.loggedBy,
        position: logForm.position,
      };

      // Use the new API endpoint
      const newRecord = await dataStore.addAttendanceRecord(attendanceData);

      // Update local state
      setAttendanceRecords((prev) => [...prev, newRecord]);

      // Update stats
      const updatedStats = {
        totalMale: attendanceStats.totalMale + logForm.male,
        totalFemale: attendanceStats.totalFemale + logForm.female,
        weeksLogged: attendanceStats.weeksLogged + 1,
        totalWeeks: attendanceStats.totalWeeks,
      };
      setAttendanceStats(updatedStats);

      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Attendance logged successfully!", "success");
      }

      handleCloseLogModal();
    } catch (error) {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          "Error logging attendance. Please try again.",
          "error"
        );
      }
    }
  };

  const handleSubmitJointProgram = async () => {
    try {
      const dataStore = getDataStore();

      const jointProgramData = {
        date: jointProgramForm.date,
        programTitle: jointProgramForm.programTitle,
        location: jointProgramForm.location,
        loggedBy: jointProgramForm.loggedBy,
        position: jointProgramForm.position,
        week: jointProgramForm.week,
        month: jointProgramForm.month,
        year: jointProgramForm.year,
        congregation: jointProgramForm.congregation,
        isJointProgram: true,
      };

      // Use the API endpoint
      const newJointProgram =
        await dataStore.addAttendanceRecord(jointProgramData);

      // Update local state
      setAttendanceRecords((prev) => [...prev, newJointProgram]);

      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Joint program logged successfully!", "success");
      } else {
        // Fallback for when toast is not available
      }
      handleCloseJointProgramModal();
    } catch (error) {
      // Error logging joint program
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          "Error logging joint program. Please try again.",
          "error"
        );
      }
    }
  };

  // Function to get CSRF token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <LocalDashboardLayout currentPage="Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </LocalDashboardLayout>
    );
  }

  return (
    <LocalDashboardLayout currentPage="Attendance">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-orange-500 dark:from-green-700 dark:to-orange-600 rounded-xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-orange-400/20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <i className="fas fa-calendar-check text-white text-2xl lg:text-3xl mr-3"></i>
                  <h1 className="text-xl lg:text-3xl font-bold text-white">
                    Attendance Management
                  </h1>
                </div>
                <p className="text-white/90 text-sm lg:text-base">
                  Track and manage member attendance for services and events
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">Today</div>
                  <div className="text-white font-semibold">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white text-xs opacity-90">Day</div>
                  <div className="text-green-300 font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AttendanceSummaryCards attendanceStats={attendanceStats} />
        <AttendanceFilter
          handleLogAttendance={handleLogAttendance}
          handleJointProgram={handleJointProgram}
          onFilterChange={(filters) => {
            // Handle filter changes here if needed
          }}
        />
        <AttendanceForDayCard
          selectedDate={selectedDate}
          attendanceData={selectedDateAttendance}
          onEdit={() => {
            // Prepare prefill from the exact date record
            const rec = getAttendanceForDate(selectedDate);
            setPrefillForm({
              male: rec.male,
              female: rec.female,
              total: rec.total,
              date: rec.date,
              week: rec.week,
              month: rec.month,
              year: rec.year,
              loggedBy: rec.loggedBy,
              position: rec.position,
            });
            setPendingEditAction("day");
            setShowPinModal(true);
          }}
          onDelete={() => {
            setPendingDeleteAction("day");
            setShowPinModal(true);
          }}
        />
        <WeeklyAttendanceCards
          currentMonthData={currentMonthData}
          onDeleteWeek={(week) => {
            setPendingDeleteAction("week");
            setShowPinModal(true);
          }}
          onEditWeek={(week) => {
            setEditData(week);
            // Prefill from underlying records for this week
            const weekNumber =
              parseInt(
                (week.week || week.weekNumber || "")
                  .toString()
                  .replace("Week ", "")
              ) ||
              week.weekNumber ||
              0;
            // Determine target month/year from latest record or currentMonthData
            let targetMonthIndex = new Date().getMonth();
            let targetYear = new Date().getFullYear();
            if (attendanceRecords.length > 0) {
              const latest = attendanceRecords
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
              const ld = new Date(latest.date);
              targetMonthIndex = ld.getMonth();
              targetYear = ld.getFullYear();
            }
            // Filter records for that week within target month/year
            const weekRecords = attendanceRecords.filter((r) => {
              const d = new Date(r.date);
              return (
                d.getFullYear() === targetYear &&
                d.getMonth() === targetMonthIndex &&
                getWeekNumber(r.date) === weekNumber
              );
            });
            // Pick the most recent record for date/metadata prefill
            const latestWeekRecord = weekRecords
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            const maleVal = week.male || latestWeekRecord?.male || 0;
            const femaleVal = week.female || latestWeekRecord?.female || 0;
            const dateVal =
              latestWeekRecord?.date || new Date().toISOString().split("T")[0];
            const monthVal = (targetMonthIndex + 1).toString().padStart(2, "0");
            const yearVal = targetYear.toString();
            const weekVal = weekNumber ? `week-${weekNumber}` : "";
            const loggedByVal = latestWeekRecord?.loggedBy || "";
            const positionVal = latestWeekRecord?.position || "";

            setPrefillForm({
              male: maleVal,
              female: femaleVal,
              total: maleVal + femaleVal,
              date: dateVal,
              week: weekVal,
              month: monthVal,
              year: yearVal,
              loggedBy: loggedByVal,
              position: positionVal,
            });

            setPendingEditAction("week");
            setShowPinModal(true);
          }}
        />
        <YearlyAttendanceCards
          currentYearData={currentYearData}
          onEditMonth={(month) => {
            setPendingEditAction("month");
            setShowPinModal(true);
          }}
          onDeleteMonth={(month) => {
            setPendingDeleteAction("month");
            setShowPinModal(true);
          }}
        />
      </div>

      <LogAttendanceModal
        showLogModal={showLogModal}
        logForm={logForm}
        handleInputChange={handleInputChange}
        handleCloseLogModal={handleCloseLogModal}
        handleSubmitLog={handleSubmitLog}
        editMode={Boolean(prefillForm)}
      />

      <JointProgramModal
        showJointProgramModal={showJointProgramModal}
        jointProgramForm={jointProgramForm}
        handleJointProgramInputChange={handleJointProgramInputChange}
        handleCloseJointProgramModal={handleCloseJointProgramModal}
        handleSubmitJointProgram={handleSubmitJointProgram}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={handleClosePinModal}
        onPinSuccess={handlePinSuccess}
        title={
          pendingDeleteAction
            ? "Enter PIN for Delete Operation"
            : pendingEditAction
              ? "Enter PIN for Edit Operation"
              : pendingAction === "log"
                ? "Enter PIN to Log Attendance"
                : "Enter PIN for Joint Program"
        }
        description={
          pendingDeleteAction
            ? "Please enter your PIN to confirm the delete operation"
            : pendingEditAction
              ? "Please enter your PIN to confirm the edit operation"
              : pendingAction === "log"
                ? "Please enter your PIN to log attendance"
                : "Please enter your PIN to schedule joint program"
        }
        type={pendingDeleteAction ? "delete" : "edit"}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                  Confirm Delete
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 mr-2"></i>
                    <div>
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                        Are you sure you want to delete attendance records?
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        This action cannot be undone. The attendance data will
                        be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Records to Delete
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {pendingDeleteAction === "week" && "All attendance records"}
                    {pendingDeleteAction === "month" &&
                      "Current month's attendance records"}
                    {pendingDeleteAction === "day" && "All attendance records"}
                    <br />
                    <span className="font-medium">
                      Total: {attendanceRecords.length} record(s)
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </LocalDashboardLayout>
  );
}
