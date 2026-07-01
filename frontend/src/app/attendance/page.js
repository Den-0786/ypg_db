"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import JointProgramModal from "../components/JointProgramModal";
import PinModal from "../components/PinModal";
import React from "react";
import getDataStore from "../utils/dataStore";

// Helper functions for week/month/year
const getWeekOfMonth = (date) => {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = d.getDate();

  // Calculate which week of the month this day falls into using Sunday-to-Saturday weeks
  // Find the start of the week containing this date
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay());

  // Find the start of the first week of the month
  const firstWeekStart = new Date(firstDay);
  firstWeekStart.setDate(firstDay.getDate() - firstDayOfWeek);

  // Calculate the difference in days and convert to weeks
  const daysDiff = Math.floor(
    (startOfWeek - firstWeekStart) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(daysDiff / 7) + 1;
};
function getMonthName(date) {
  return new Date(date).toLocaleString("default", { month: "short" });
}
function getYear(date) {
  return new Date(date).getFullYear();
}

export default function AttendancePage() {
  // Redirect local users to local attendance page
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && user.congregationId && user.congregationId !== "1") {
          window.location.href = "/local/attendance";
        }
      }
    } catch (e) {}
  }, []);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJointProgramModal, setShowJointProgramModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null); // 'bulk', 'monthly', 'yearly', 'single'
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [jointProgramForm, setJointProgramForm] = useState({
    week: "",
    month: "",
    year: "",
    date: "",
    programTitle: "",
    location: "",
    loggedBy: "",
    position: "",
  });
  const [selectedCongregation, setSelectedCongregation] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Monthly and yearly summary table states
  const [selectedMonthlyRecords, setSelectedMonthlyRecords] = useState([]);
  const [selectedYearlyRecords, setSelectedYearlyRecords] = useState([]);
  const [selectAllMonthly, setSelectAllMonthly] = useState(false);
  const [selectAllYearly, setSelectAllYearly] = useState(false);
  const [showMonthlyViewModal, setShowMonthlyViewModal] = useState(false);
  const [showYearlyViewModal, setShowYearlyViewModal] = useState(false);
  const [selectedMonthlyRecord, setSelectedMonthlyRecord] = useState(null);
  const [selectedYearlyRecord, setSelectedYearlyRecord] = useState(null);
  // Custom toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  }
  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: null,
  });
  function openConfirmDialog(message, onConfirm) {
    setConfirmDialog({ show: true, message, onConfirm });
  }
  function closeConfirmDialog() {
    setConfirmDialog({ show: false, message: "", onConfirm: null });
  }

  const [jointPrograms, setJointPrograms] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".quick-actions-dropdown")) {
        setShowQuickActions(false);
        setShowExportModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);

      // Get records from data store
      const dataStore = getDataStore();
      const records = await dataStore.getAttendanceRecords();

      // Use records directly as they're already in the correct format from dataStore
      const transformedRecords = records.map((record) => ({
        id: record.id,
        congregation: { name: record.congregation },
        date: record.date,
        male_count: record.male || 0,
        female_count: record.female || 0,
        total_count: record.total || 0,
        loggedBy: record.loggedBy || "Unknown",
        position: record.position || "Member",
      }));

      setAttendanceRecords(transformedRecords);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setLoading(false);
    }
  };

  // Joint program handlers
  const handleJointProgramInputChange = (field, value) => {
    setJointProgramForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleJointProgram = () => {
    setPendingDeleteAction(null);
    setSelectedRecords([]);
    setShowViewModal(false);
    setShowExportModal(false);
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    if (pendingDeleteAction) {
      // Handle different delete actions
      switch (pendingDeleteAction) {
        case "bulk":
          handlePinSuccessForBulkDelete();
          break;
        case "monthly":
          if (selectedRecords.length === 1) {
            // Single monthly record deletion
            showToast("Monthly record deleted successfully!", "success");
          } else {
            handlePinSuccessForMonthlyDelete();
          }
          break;
        case "yearly":
          if (selectedRecords.length === 1) {
            // Single yearly record deletion
            showToast("Yearly record deleted successfully!", "success");
          } else {
            handlePinSuccessForYearlyDelete();
          }
          break;
        case "single":
          handlePinSuccessForSingleDelete();
          break;
        default:
          break;
      }
      setPendingDeleteAction(null);
      setSelectedRecords([]);
      setShowPinModal(false);
      return;
    } else {
      // Original joint program logic
      setShowPinModal(false);
      setShowJointProgramModal(true);
    }
  };

  const handleClosePinModal = () => {
    setShowPinModal(false);
    setPendingDeleteAction(null);
    setSelectedRecords([]);
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
    });
  };

  const handleSubmitJointProgram = () => {
    const newJointProgram = {
      id: Date.now(),
      ...jointProgramForm,
      createdAt: new Date().toISOString(),
    };
    setJointPrograms([...jointPrograms, newJointProgram]);
    showToast("Joint program scheduled successfully!", "success");
    handleCloseJointProgramModal();
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedRecord(null);
  };

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
    if (format === "CSV") {
      exportSelectedToCSV();
    } else if (format === "Excel") {
      showToast("Excel export coming soon!", "success");
    } else if (format === "PDF") {
      showToast("PDF export coming soon!", "success");
    }
    setShowExportModal(false);
  };

  // Weekly window: Sunday 00:00 through Saturday 23:00
  const getCurrentWeekRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sunday
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    end.setHours(23, 0, 0, 0); // 11pm

    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();
  const currentSunday = new Date(weekStart).toISOString().split("T")[0];
  const hasJointProgramThisWeek = jointPrograms.some(
    (program) => program.date === currentSunday
  );

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([]);
      setSelectAll(false);
    } else {
      setSelectedRecords(attendanceRecords.map((record) => record.id));
      setSelectAll(true);
    }
  };

  const handleSelectRecord = (recordId) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter((id) => id !== recordId));
      setSelectAll(false);
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
      if (selectedRecords.length + 1 === attendanceRecords.length) {
        setSelectAll(true);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedRecords.length === 0) {
      showToast("Please select records to delete", "error");
      return;
    }
    setPendingDeleteAction("bulk");
    setShowPinModal(true);
  };

  const handlePinSuccessForBulkDelete = () => {
    // Remove selected records from the state
    const updatedRecords = attendanceRecords.filter(
      (record) => !selectedRecords.includes(record.id)
    );
    setAttendanceRecords(updatedRecords);
    setSelectedRecords([]);
    setSelectAll(false);
    showToast("Selected records deleted successfully!", "success");
  };

  const handleBulkExport = () => {
    if (selectedRecords.length === 0) {
      showToast("Please select records to export", "error");
      return;
    }
    exportSelectedToCSV();
  };

  // Monthly and yearly summary table handlers
  const handleSelectAllMonthly = () => {
    if (selectAllMonthly) {
      setSelectedMonthlyRecords([]);
      setSelectAllMonthly(false);
    } else {
      const monthlyCongregations = Object.keys(
        (() => {
          const congregationMonthData = {};
          currentMonthRecords.forEach((record) => {
            const congName = record.congregation.name;
            if (!congregationMonthData[congName]) {
              congregationMonthData[congName] = {
                male: 0,
                female: 0,
                total: 0,
              };
            }
            congregationMonthData[congName].male += record.male_count;
            congregationMonthData[congName].female += record.female_count;
            congregationMonthData[congName].total += record.total_count;
          });
          return congregationMonthData;
        })()
      );
      setSelectedMonthlyRecords(monthlyCongregations);
      setSelectAllMonthly(true);
    }
  };

  const handleSelectMonthlyRecord = (congregationName) => {
    setSelectedMonthlyRecords((prev) =>
      prev.includes(congregationName)
        ? prev.filter((name) => name !== congregationName)
        : [...prev, congregationName]
    );
  };

  const handleSelectAllYearly = () => {
    if (selectAllYearly) {
      setSelectedYearlyRecords([]);
      setSelectAllYearly(false);
    } else {
      const yearlyCongregations = Object.keys(
        (() => {
          const congregationYearData = {};
          currentYearRecords.forEach((record) => {
            const congName = record.congregation.name;
            if (!congregationYearData[congName]) {
              congregationYearData[congName] = {
                male: 0,
                female: 0,
                total: 0,
              };
            }
            congregationYearData[congName].male += record.male_count;
            congregationYearData[congName].female += record.female_count;
            congregationYearData[congName].total += record.total_count;
          });
          return congregationYearData;
        })()
      );
      setSelectedYearlyRecords(yearlyCongregations);
      setSelectAllYearly(true);
    }
  };

  const handleSelectYearlyRecord = (congregationName) => {
    setSelectedYearlyRecords((prev) =>
      prev.includes(congregationName)
        ? prev.filter((name) => name !== congregationName)
        : [...prev, congregationName]
    );
  };

  const handleViewMonthlyRecord = (congregationName, data) => {
    setSelectedMonthlyRecord({ congregationName, ...data });
    setShowMonthlyViewModal(true);
  };

  const handleViewYearlyRecord = (congregationName, data) => {
    setSelectedYearlyRecord({ congregationName, ...data });
    setShowYearlyViewModal(true);
  };

  const handleCloseMonthlyViewModal = () => {
    setShowMonthlyViewModal(false);
    setSelectedMonthlyRecord(null);
  };

  const handleCloseYearlyViewModal = () => {
    setShowYearlyViewModal(false);
    setSelectedYearlyRecord(null);
  };

  const handleDeleteMonthlyRecords = () => {
    if (selectedMonthlyRecords.length === 0) {
      showToast("Please select records to delete", "error");
      return;
    }
    setPendingDeleteAction("monthly");
    setShowPinModal(true);
  };

  const handlePinSuccessForMonthlyDelete = () => {
    // Here you would typically make an API call to delete the records
    showToast("Monthly records deleted successfully!", "success");
    setSelectedMonthlyRecords([]);
    setSelectAllMonthly(false);
  };

  const handleDeleteYearlyRecords = () => {
    if (selectedYearlyRecords.length === 0) {
      showToast("Please select records to delete", "error");
      return;
    }
    setPendingDeleteAction("yearly");
    setShowPinModal(true);
  };

  const handlePinSuccessForYearlyDelete = () => {
    // Here you would typically make an API call to delete the records
    showToast("Yearly records deleted successfully!", "success");
    setSelectedYearlyRecords([]);
    setSelectAllYearly(false);
  };

  const handlePinSuccessForSingleDelete = () => {
    // Remove the record from the state
    const updatedRecords = attendanceRecords.filter(
      (r) => r.id !== selectedRecords[0]
    );
    setAttendanceRecords(updatedRecords);
    setSelectedRecords([]);
    showToast("Attendance record deleted successfully!", "success");
  };

  // Export CSV (bulk)
  function exportSelectedToCSV() {
    if (selectedRecords.length === 0) {
      showToast("Please select records to export", "error");
      return;
    }

    const selectedData = attendanceRecords.filter((r) =>
      selectedRecords.includes(r.id)
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Congregation,Date,Male Count,Female Count,Total Count\n" +
      selectedData
        .map(
          (r) =>
            `${r.congregation.name},${r.date},${r.male_count},${r.female_count},${r.total_count}`
        )
        .join("\n");

    if (typeof window !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance-selected.csv";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Selected records exported as CSV!", "success");
    }
  }

  // Print Table
  function printTable() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return; // Don't execute on server side
    }

    const printContents = document.getElementById(
      "attendance-table-area"
    ).innerHTML;
    const win = window.open("", "", "height=700,width=900");
    if (win) {
      win.document.write("<html><head><title>Print Attendance</title>");
      win.document.write(
        "<style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;}th{background:#f3f4f6;}</style>"
      );
      win.document.write("</head><body>");
      win.document.write(printContents);
      win.document.write("</body></html>");
      win.document.close();
      win.print();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get all years, months, weeks from data
  const allYears = Array.from(
    new Set(attendanceRecords.map((r) => getYear(r.date)))
  );
  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const allWeeks = [1, 2, 3, 4, 5];
  const congregationNames = Array.from(
    new Set(attendanceRecords.map((r) => r.congregation.name))
  );

  // Filter records by congregation, year, month, week
  let filteredRecords = attendanceRecords;
  if (selectedCongregation) {
    filteredRecords = filteredRecords.filter(
      (r) => r.congregation.name === selectedCongregation
    );
  }
  if (selectedYear !== "All") {
    filteredRecords = filteredRecords.filter(
      (r) => getYear(r.date) === Number(selectedYear)
    );
  }
  if (selectedMonth !== "All") {
    filteredRecords = filteredRecords.filter(
      (r) => getMonthName(r.date) === selectedMonth
    );
  }
  if (selectedWeek !== "All") {
    filteredRecords = filteredRecords.filter(
      (r) => getWeekOfMonth(r.date) === Number(selectedWeek)
    );
  }

  // Aggregates for cards
  const totalMale = filteredRecords.reduce((sum, r) => sum + r.male_count, 0);
  const totalFemale = filteredRecords.reduce(
    (sum, r) => sum + r.female_count,
    0
  );
  const grandTotal = filteredRecords.reduce((sum, r) => sum + r.total_count, 0);

  // Current date for calculations
  const currentDate = new Date();

  // Find the most recent month and year with data, or use current date
  let targetMonthNum = currentDate.getMonth();
  let targetYear = currentDate.getFullYear();

  if (attendanceRecords.length > 0) {
    const latestRecord = attendanceRecords.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
    const latestDate = new Date(latestRecord.date);
    targetMonthNum = latestDate.getMonth();
    targetYear = latestDate.getFullYear();
  }

  // Filter records for the target month and year (most recent with data)
  const currentMonthRecords = attendanceRecords.filter((r) => {
    const recordDate = new Date(r.date);
    return (
      recordDate.getMonth() === targetMonthNum &&
      recordDate.getFullYear() === targetYear
    );
  });

  // Filter records for the target year (most recent with data)
  const currentYearRecords = attendanceRecords.filter((r) => {
    const recordDate = new Date(r.date);
    return recordDate.getFullYear() === targetYear;
  });

  // Calculate current month totals
  const currentMonthMale = currentMonthRecords.reduce(
    (sum, r) => sum + r.male_count,
    0
  );
  const currentMonthFemale = currentMonthRecords.reduce(
    (sum, r) => sum + r.female_count,
    0
  );
  const currentMonthTotal = currentMonthRecords.reduce(
    (sum, r) => sum + r.total_count,
    0
  );

  // Calculate current year totals
  const currentYearMale = currentYearRecords.reduce(
    (sum, r) => sum + r.male_count,
    0
  );
  const currentYearFemale = currentYearRecords.reduce(
    (sum, r) => sum + r.female_count,
    0
  );
  const currentYearTotal = currentYearRecords.reduce(
    (sum, r) => sum + r.total_count,
    0
  );

  // Progress for week/month/year
  const currentMonth = new Date(targetYear, targetMonthNum).toLocaleString(
    "default",
    {
      month: "short",
    }
  );
  const currentWeek = getWeekOfMonth(currentDate);
  const weekProgress =
    selectedMonth === "All"
      ? ""
      : `${selectedWeek !== "All" ? selectedWeek : currentWeek}/${4}`;
  const monthProgress = `${selectedMonth !== "All" ? allMonths.indexOf(selectedMonth) + 1 : targetMonthNum + 1}/12`;
  const yearProgress = `${selectedYear !== "All" ? allYears.indexOf(Number(selectedYear)) + 1 : allYears.indexOf(targetYear) + 1}/${allYears.length}`;

  // All congregation names
  const allCongNames = [
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
  ];
  // Congregations that have submitted within the current weekly window
  const submittedCongregations = Array.from(
    new Set(
      attendanceRecords
        .filter((r) => {
          const d = new Date(r.date);
          return d >= weekStart && d <= weekEnd;
        })
        .map((r) => r.congregation.name)
    )
  );
  const notSubmittedCongregations = allCongNames.filter(
    (name) => !submittedCongregations.includes(name)
  );
  const sundayProgress = `${submittedCongregations.length}/${allCongNames.length}`;

  // Quick Actions Component for Header
  const AttendanceQuickActions = () => (
    <div className="relative quick-actions-dropdown">
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-blue-50 text-blue-700 rounded-lg shadow-sm border border-blue-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-haspopup="true"
        aria-expanded={showQuickActions}
      >
        <i className="fas fa-bolt text-blue-500"></i>
        Quick Actions
        <i
          className={`fas fa-chevron-${showQuickActions ? "up" : "down"} text-xs ml-1`}
        ></i>
      </button>
      {showQuickActions && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2 animate-fadeIn">
          <button
            onClick={printTable}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-blue-700 transition"
          >
            <i className="fas fa-print"></i> Print Table
          </button>

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
                className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-3"
                style={{ minWidth: "140px" }}
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
            onClick={handleBulkDelete}
            disabled={selectedRecords.length === 0}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800 focus:bg-red-100 dark:focus:bg-red-700 transition ${selectedRecords.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <i className="fas fa-trash"></i> Delete Weekly Selected
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          <button
            onClick={handleDeleteMonthlyRecords}
            disabled={selectedMonthlyRecords.length === 0}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-orange-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800 focus:bg-blue-100 dark:focus:bg-orange-700 transition ${selectedMonthlyRecords.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <i className="fas fa-calendar-alt"></i> Delete Monthly Selected
          </button>

          <button
            onClick={handleDeleteYearlyRecords}
            disabled={selectedYearlyRecords.length === 0}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800 focus:bg-indigo-100 dark:focus:bg-indigo-700 transition ${selectedYearlyRecords.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <i className="fas fa-calendar"></i> Delete Yearly Selected
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      currentPage="Attendance"
      headerAction={<AttendanceQuickActions />}
    >
      {/* Custom Toast Notification */}
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
      {/* Custom Confirmation Dialog */}
      {confirmDialog.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="mb-4 text-gray-800 font-semibold">
              {confirmDialog.message}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeConfirmDialog}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm && confirmDialog.onConfirm();
                  closeConfirmDialog();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                aria-label="Confirm delete"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
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
                  Track Sunday attendance across congregations
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
                  <div className="text-blue-300 font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Management Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
            <div>
              {/* Joint Program Status */}
              {hasJointProgramThisWeek && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-handshake text-purple-600 dark:text-purple-400 mr-2"></i>
                    <div>
                      <div className="font-semibold text-purple-800 dark:text-purple-200 text-sm">
                        Joint Program Scheduled
                      </div>
                      <div className="text-purple-600 dark:text-purple-300 text-xs">
                        No individual attendance reminders this week
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mr-2">
                  This Sunday Progress: {sundayProgress}
                </span>
              </div>
              <div className="mt-2 flex flex-col md:flex-row gap-2">
                <div className="bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 rounded-lg p-3 flex-1">
                  <div className="font-semibold text-green-700 dark:text-green-300 text-xs mb-1">
                    Submitted ({submittedCongregations.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {submittedCongregations.length > 0 ? (
                      submittedCongregations.map((name) => (
                        <span
                          key={name}
                          className="bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200 px-2 py-0.5 rounded text-xs font-medium"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        None
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-gray-700 border border-red-200 dark:border-gray-600 rounded-lg p-3 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-red-700 dark:text-red-300 text-xs">
                      Not Submitted ({notSubmittedCongregations.length})
                    </div>
                    {notSubmittedCongregations.length > 0 &&
                      !hasJointProgramThisWeek && (
                        <button
                          onClick={() => {
                            // TODO: Get custom reminder message from settings
                            const customMessage =
                              "Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you!";
                            const formattedMessage = customMessage
                              .replace("{congregation}", "Test Congregation")
                              .replace(
                                "{date}",
                                new Date().toLocaleDateString()
                              )
                              .replace(
                                "{day}",
                                new Date().toLocaleDateString("en-US", {
                                  weekday: "long",
                                })
                              );

                            showToast(
                              `Sending custom reminder: "${formattedMessage}" to ${notSubmittedCongregations.length} congregation(s)`,
                              "success"
                            );
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition"
                          aria-label="Remind all non-submitting congregations"
                        >
                          <i
                            className="fas fa-bell mr-1"
                            aria-hidden="true"
                          ></i>{" "}
                          Remind All
                        </button>
                      )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {notSubmittedCongregations.length > 0 ? (
                      notSubmittedCongregations.map((name) => (
                        <span
                          key={name}
                          className="bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 px-2 py-0.5 rounded text-xs font-medium"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        None
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleJointProgram}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200 w-full sm:w-auto"
              >
                <i className="fas fa-handshake mr-2"></i>
                Schedule Joint Program
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col sm:flex-row flex-wrap gap-2 items-center">
          <div className="w-full max-w-xs sm:w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Congregation
            </label>
            <select
              value={selectedCongregation}
              onChange={(e) => setSelectedCongregation(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
              aria-label="Filter by congregation"
            >
              <option value="" className="text-gray-800 dark:text-white">
                All Congregations
              </option>
              {congregationNames.map((name) => (
                <option
                  key={name}
                  value={name}
                  className="text-gray-800 dark:text-white"
                >
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <div className="w-full max-w-xs sm:w-28">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Filter by week"
              >
                <option value="All" className="text-gray-800 dark:text-white">
                  All Weeks
                </option>
                {allWeeks.map((week) => (
                  <option
                    key={week}
                    value={week}
                    className="text-gray-800 dark:text-white"
                  >{`Week ${week}`}</option>
                ))}
              </select>
            </div>
            <div className="w-full max-w-xs sm:w-28">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Filter by month"
              >
                <option value="All" className="text-gray-800 dark:text-white">
                  All Months
                </option>
                {allMonths.map((month) => (
                  <option
                    key={month}
                    value={month}
                    className="text-gray-800 dark:text-white"
                  >
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full max-w-xs sm:w-28">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white text-xs bg-white dark:bg-gray-700"
                aria-label="Filter by year"
              >
                <option value="All" className="text-gray-800 dark:text-white">
                  All Years
                </option>
                {allYears.map((year) => (
                  <option
                    key={year}
                    value={year}
                    className="text-gray-800 dark:text-white"
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Colored Summary Cards */}
        <div className="overflow-x-auto">
          <div className="flex justify-between min-w-max p-1 gap-4">
            {/* Total Male Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-300/5 dark:from-blue-300/10 dark:to-blue-200/10 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -ml-8 -mb-8"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                    <i className="fas fa-mars text-blue-500 dark:text-blue-400 text-xl"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Total Male
                    </div>
                    <div className="text-gray-900 dark:text-white text-2xl font-bold">
                      {totalMale.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Week: {weekProgress || "All"} | Month: {monthProgress} |
                    Year: {yearProgress}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Female Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-pink-300/5 dark:from-pink-300/10 dark:to-pink-200/10 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-pink-100/30 dark:bg-pink-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-100/30 dark:bg-pink-400/10 rounded-full -ml-8 -mb-8"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-3">
                    <i className="fas fa-venus text-pink-600 dark:text-pink-400 text-xl"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Total Female
                    </div>
                    <div className="text-gray-900 dark:text-white text-2xl font-bold">
                      {totalFemale.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Week: {weekProgress || "All"} | Month: {monthProgress} |
                    Year: {yearProgress}
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-green-300/5 dark:from-green-300/10 dark:to-green-200/10 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/30 dark:bg-green-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-100/30 dark:bg-green-400/10 rounded-full -ml-8 -mb-8"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                    <i className="fas fa-users text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Grand Total
                    </div>
                    <div className="text-gray-900 dark:text-white text-2xl font-bold">
                      {grandTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Week: {weekProgress || "All"} | Month: {monthProgress} |
                    Year: {yearProgress}
                  </div>
                </div>
              </div>
            </div>

            {/* Congregations Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-w-[280px] relative overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-300/5 dark:from-purple-300/10 dark:to-purple-200/10 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/30 dark:bg-purple-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/30 dark:bg-purple-400/10 rounded-full -ml-8 -mb-8"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                    <i className="fas fa-church text-purple-600 dark:text-purple-400 text-xl"></i>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Congregations
                    </div>
                    <div className="text-gray-900 dark:text-white text-2xl font-bold">
                      {selectedCongregation ? 1 : congregationNames.length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedCongregation || "All Congregations"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Table Area for Print */}
          <div id="attendance-table-area">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Current Week Records
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        title="Select all records"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      Congregation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                      Male
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                      Female
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-gray-400 dark:text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <i className="fas fa-folder-open text-4xl mb-2"></i>
                          <div className="text-lg font-semibold mb-1">
                            No attendance records found
                          </div>
                          <div className="text-sm">
                            Try adjusting your filters or add a new attendance
                            record.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <React.Fragment>
                      {filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={() => handleSelectRecord(record.id)}
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.congregation.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.male_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.female_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {record.total_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3 sm:space-x-2">
                              <button
                                className="text-blue-500 hover:text-blue-900 transition-colors duration-200 p-2 rounded"
                                title="View attendance details"
                                onClick={() => handleViewRecord(record)}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded"
                                title="Delete attendance record"
                                onClick={() => {
                                  setPendingDeleteAction("single");
                                  setSelectedRecords([record.id]);
                                  setShowPinModal(true);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* end #attendance-table-area */}
        </div>

        {/* Current Month Summary by Congregation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-blue-300/5 dark:from-blue-300/10 dark:to-blue-200/10 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-100/30 dark:bg-blue-400/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <i className="fas fa-calendar-alt text-blue-700 dark:text-blue-400 text-xl"></i>
              </div>
              <div className="text-right">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Current Month Summary
                </div>
                <div className="text-gray-900 dark:text-white text-2xl font-bold">
                  {new Date().toLocaleString("default", { month: "long" })}{" "}
                  {targetYear}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectAllMonthly}
                        onChange={handleSelectAllMonthly}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        title="Select all monthly records"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Congregation
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Male
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Female
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Group current month records by congregation
                    const congregationMonthData = {};
                    currentMonthRecords.forEach((record) => {
                      const congName = record.congregation.name;
                      if (!congregationMonthData[congName]) {
                        congregationMonthData[congName] = {
                          male: 0,
                          female: 0,
                          total: 0,
                        };
                      }
                      congregationMonthData[congName].male += record.male_count;
                      congregationMonthData[congName].female +=
                        record.female_count;
                      congregationMonthData[congName].total +=
                        record.total_count;
                    });

                    return Object.entries(congregationMonthData).map(
                      ([congName, data]) => (
                        <tr
                          key={congName}
                          className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedMonthlyRecords.includes(
                                congName
                              )}
                              onChange={() =>
                                handleSelectMonthlyRecord(congName)
                              }
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {congName}
                          </td>
                          <td className="px-6 py-4 text-center text-blue-500 dark:text-blue-400 font-semibold">
                            {data.male.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-pink-600 dark:text-pink-400 font-semibold">
                            {data.female.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                            {data.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3 sm:space-x-2 justify-center">
                              <button
                                className="text-blue-500 hover:text-blue-900 transition-colors duration-200 p-2 rounded"
                                title="View monthly details"
                                onClick={() =>
                                  handleViewMonthlyRecord(congName, data)
                                }
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded"
                                title="Delete monthly record"
                                onClick={() => {
                                  setPendingDeleteAction("monthly");
                                  setSelectedRecords([congName]);
                                  setShowPinModal(true);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Current Year Summary by Congregation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/5 to-indigo-300/5 dark:from-indigo-300/10 dark:to-indigo-200/10 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/30 dark:bg-indigo-400/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-100/30 dark:bg-indigo-400/10 rounded-full -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-3">
                <i className="fas fa-calendar text-indigo-600 dark:text-indigo-400 text-xl"></i>
              </div>
              <div className="text-right">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Current Year Summary
                </div>
                <div className="text-gray-900 dark:text-white text-2xl font-bold">
                  {targetYear} - All Months
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectAllYearly}
                        onChange={handleSelectAllYearly}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        title="Select all yearly records"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Congregation
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Male
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Female
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Group current year records by congregation
                    const congregationYearData = {};
                    currentYearRecords.forEach((record) => {
                      const congName = record.congregation.name;
                      if (!congregationYearData[congName]) {
                        congregationYearData[congName] = {
                          male: 0,
                          female: 0,
                          total: 0,
                        };
                      }
                      congregationYearData[congName].male += record.male_count;
                      congregationYearData[congName].female +=
                        record.female_count;
                      congregationYearData[congName].total +=
                        record.total_count;
                    });

                    return Object.entries(congregationYearData).map(
                      ([congName, data]) => (
                        <tr
                          key={congName}
                          className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedYearlyRecords.includes(congName)}
                              onChange={() =>
                                handleSelectYearlyRecord(congName)
                              }
                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {congName}
                          </td>
                          <td className="px-6 py-4 text-center text-blue-500 dark:text-blue-400 font-semibold">
                            {data.male.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-pink-600 dark:text-pink-400 font-semibold">
                            {data.female.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                            {data.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3 sm:space-x-2 justify-center">
                              <button
                                className="text-blue-500 hover:text-blue-900 transition-colors duration-200 p-2 rounded"
                                title="View yearly details"
                                onClick={() =>
                                  handleViewYearlyRecord(congName, data)
                                }
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded"
                                title="Delete yearly record"
                                onClick={() => {
                                  setPendingDeleteAction("yearly");
                                  setSelectedRecords([congName]);
                                  setShowPinModal(true);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Joint Program Modal */}
        <JointProgramModal
          showJointProgramModal={showJointProgramModal}
          jointProgramForm={jointProgramForm}
          handleJointProgramInputChange={handleJointProgramInputChange}
          handleCloseJointProgramModal={handleCloseJointProgramModal}
          handleSubmitJointProgram={handleSubmitJointProgram}
        />

        {/* PIN Modal */}
        <PinModal
          isOpen={showPinModal}
          onClose={handleClosePinModal}
          onPinSuccess={handlePinSuccess}
          title={
            pendingDeleteAction
              ? "Enter PIN for Delete Operation"
              : "Enter PIN for Joint Program"
          }
          description={
            pendingDeleteAction
              ? "Please enter your PIN to confirm the delete operation"
              : "Please enter your PIN to schedule joint program"
          }
          type={pendingDeleteAction ? "delete" : "edit"}
        />

        {/* View Attendance Record Modal */}
        {showViewModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <i className="fas fa-eye text-blue-500 mr-2"></i>
                    Attendance Record Details
                  </h3>
                  <button
                    onClick={handleCloseViewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Congregation:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedRecord.congregation.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Date:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date(selectedRecord.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Male Count:
                        </span>
                        <span className="ml-2 font-medium text-blue-500 dark:text-blue-400">
                          {selectedRecord.male_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Female Count:
                        </span>
                        <span className="ml-2 font-medium text-pink-600 dark:text-pink-400">
                          {selectedRecord.female_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Total:
                        </span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                          {selectedRecord.total_count}
                        </span>
                      </div>
                      {selectedRecord.loggedBy && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Logged By:
                          </span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {selectedRecord.loggedBy}
                          </span>
                        </div>
                      )}
                      {selectedRecord.position && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Position:
                          </span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {selectedRecord.position}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseViewModal}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Summary View Modal */}
        {showMonthlyViewModal && selectedMonthlyRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <i className="fas fa-calendar-alt text-blue-500 mr-2"></i>
                    Monthly Summary Details
                  </h3>
                  <button
                    onClick={handleCloseMonthlyViewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Congregation:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedMonthlyRecord.congregationName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Period:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date().toLocaleString("default", {
                            month: "long",
                          })}{" "}
                          {targetYear}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Male Count:
                        </span>
                        <span className="ml-2 font-medium text-blue-500 dark:text-blue-400">
                          {selectedMonthlyRecord.male.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Female Count:
                        </span>
                        <span className="ml-2 font-medium text-pink-600 dark:text-pink-400">
                          {selectedMonthlyRecord.female.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Total:
                        </span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                          {selectedMonthlyRecord.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseMonthlyViewModal}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Yearly Summary View Modal */}
        {showYearlyViewModal && selectedYearlyRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <i className="fas fa-calendar text-indigo-500 mr-2"></i>
                    Yearly Summary Details
                  </h3>
                  <button
                    onClick={handleCloseYearlyViewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Congregation:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedYearlyRecord.congregationName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Period:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {targetYear} - All Months
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Male Count:
                        </span>
                        <span className="ml-2 font-medium text-blue-500 dark:text-blue-400">
                          {selectedYearlyRecord.male.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Female Count:
                        </span>
                        <span className="ml-2 font-medium text-pink-600 dark:text-pink-400">
                          {selectedYearlyRecord.female.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Total:
                        </span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                          {selectedYearlyRecord.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseYearlyViewModal}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
