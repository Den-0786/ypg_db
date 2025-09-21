/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import ToastContainer from "../components/ToastContainer";
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
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizPassword, setQuizPassword] = useState("");
  const [showQuizPassword, setShowQuizPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [storedAdminPassword, setStoredAdminPassword] = useState("");
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    startTime: "",
    endTime: "",
  });
  const [quizSubmissions, setQuizSubmissions] = useState([]);
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
    fetchActiveQuiz();
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

  const fetchActiveQuiz = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/active/`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.quiz) {
          setActiveQuiz(data.quiz);
        }
      }
    } catch (error) {
      showToast("Error fetching active quiz", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  const generateRandomPassword = () => {
    const numbers = "0123456789";
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const allChars = numbers + letters + specialChars;

    let password = "";
    // Ensure at least one of each type
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += letters[Math.floor(Math.random() * letters.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = 3; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setQuizPassword(newPassword);
    showToast("New password generated successfully!", "success");
  };

  const handleCreateQuiz = async () => {
    // Check if there's already an active quiz
    if (activeQuiz) {
      showToast(
        "There is already an active quiz. Please delete the existing quiz before creating a new one.",
        "error"
      );
      return;
    }

    if (
      !newQuestion.title ||
      !newQuestion.question ||
      !newQuestion.optionA ||
      !newQuestion.optionB ||
      !newQuestion.optionC ||
      !newQuestion.optionD ||
      !newQuestion.correctAnswer ||
      !newQuestion.startTime ||
      !newQuestion.endTime
    ) {
      showToast("Please fill in all fields", "error");
      return;
    }

    // Use the generated quiz password
    const passwordToUse = quizPassword;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "district_admin",
            admin_password: storedAdminPassword,
            title: newQuestion.title,
            question: newQuestion.question,
            option_a: newQuestion.optionA,
            option_b: newQuestion.optionB,
            option_c: newQuestion.optionC,
            option_d: newQuestion.optionD,
            correct_answer: newQuestion.correctAnswer,
            start_time: newQuestion.startTime,
            end_time: newQuestion.endTime,
            password: passwordToUse,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveQuiz({
          id: data.quiz_id,
          title: newQuestion.title,
          question: newQuestion.question,
          option_a: newQuestion.optionA,
          option_b: newQuestion.optionB,
          option_c: newQuestion.optionC,
          option_d: newQuestion.optionD,
          correct_answer: newQuestion.correctAnswer,
          start_time: newQuestion.startTime,
          end_time: newQuestion.endTime,
          password: passwordToUse,
          is_active: true,
          submissions_count: 0,
          correct_submissions_count: 0,
        });

        setNewQuestion({
          title: "",
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "",
          startTime: "",
          endTime: "",
        });
        setShowQuizModal(false);
        showToast("Quiz created successfully!", "success");
      } else {
        showToast(data.error || "Failed to create quiz", "error");
      }
    } catch (error) {
      showToast("Failed to create quiz", "error");
    }
  };

  const handleEndQuiz = async () => {
    if (!activeQuiz) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/${activeQuiz.id}/end/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveQuiz({ ...activeQuiz, is_active: false });
        // Clear password when quiz is ended
        setQuizPassword("");
        showToast("Quiz ended successfully!", "success");
      } else {
        showToast(data.error || "Failed to end quiz", "error");
      }
    } catch (error) {
      showToast("Failed to end quiz", "error");
    }
  };

  const handleDeleteQuiz = async () => {
    if (!activeQuiz) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/${activeQuiz.id}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveQuiz(null);
        setQuizSubmissions([]);
        // Clear form when quiz is deleted
        setNewQuestion({
          title: "",
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "",
          startTime: "",
          endTime: "",
        });
        setQuizPassword("");
        showToast("Quiz deleted successfully!", "success");
      } else {
        showToast(data.error || "Failed to delete quiz", "error");
      }
    } catch (error) {
      showToast("Failed to delete quiz", "error");
    }
  };

  const handleEditQuiz = () => {
    if (!activeQuiz) return;

    // Populate the form with existing quiz data
    setNewQuestion({
      title: activeQuiz.title || "",
      question: activeQuiz.question || "",
      optionA: activeQuiz.option_a || "",
      optionB: activeQuiz.option_b || "",
      optionC: activeQuiz.option_c || "",
      optionD: activeQuiz.option_d || "",
      correctAnswer: activeQuiz.correct_answer || "",
      startTime: activeQuiz.start_time || "",
      endTime: activeQuiz.end_time || "",
    });
    setQuizPassword(activeQuiz.password || "");
    setEditingQuiz(true);
    setShowEditModal(true);
  };

  const handleUpdateQuiz = async () => {
    if (!activeQuiz) return;

    if (
      !newQuestion.title ||
      !newQuestion.question ||
      !newQuestion.optionA ||
      !newQuestion.optionB ||
      !newQuestion.optionC ||
      !newQuestion.optionD ||
      !newQuestion.correctAnswer ||
      !newQuestion.startTime ||
      !newQuestion.endTime
    ) {
      showToast("Please fill in all fields", "error");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/${activeQuiz.id}/update/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newQuestion.title,
            question: newQuestion.question,
            option_a: newQuestion.optionA,
            option_b: newQuestion.optionB,
            option_c: newQuestion.optionC,
            option_d: newQuestion.optionD,
            correct_answer: newQuestion.correctAnswer,
            start_time: newQuestion.startTime,
            end_time: newQuestion.endTime,
            password: quizPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveQuiz({
          ...activeQuiz,
          title: newQuestion.title,
          question: newQuestion.question,
          option_a: newQuestion.optionA,
          option_b: newQuestion.optionB,
          option_c: newQuestion.optionC,
          option_d: newQuestion.optionD,
          correct_answer: newQuestion.correctAnswer,
          start_time: newQuestion.startTime,
          end_time: newQuestion.endTime,
          password: quizPassword,
        });
        // Clear form after successful update
        setNewQuestion({
          title: "",
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "",
          startTime: "",
          endTime: "",
        });
        setQuizPassword("");
        setShowEditModal(false);
        setEditingQuiz(false);
        showToast("Quiz updated successfully!", "success");
      } else {
        showToast(data.error || "Failed to update quiz", "error");
      }
    } catch (error) {
      showToast("Failed to update quiz", "error");
    }
  };

  const handlePasswordSubmit = async (password) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/verify-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "district_admin",
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStoredAdminPassword(adminPasswordInput);
        setShowPasswordModal(false);
        setShowQuizModal(true);
        setAdminPasswordInput("");
      } else {
        showToast("Incorrect admin password!", "error");
      }
    } catch (error) {
      showToast("Failed to verify password", "error");
    }
  };

  const handleQuizSubmission = async (submission) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/quizzes/submit/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quiz_id: activeQuiz.id,
            name: submission.name,
            phone_number: submission.phoneNumber,
            congregation: submission.congregation,
            selected_answer: submission.selectedAnswer,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchActiveQuiz();
        showToast(data.message, "success");
      } else {
        showToast(data.error || "Failed to submit quiz", "error");
      }
    } catch (error) {
      showToast("Failed to submit quiz", "error");
    }
  };

  const getWinners = () => {
    return quizSubmissions.filter((sub) => sub.isCorrect);
  };

  const getTotalParticipants = () => {
    return activeQuiz ? activeQuiz.submissions_count : 0;
  };

  const getCorrectAnswers = () => {
    return activeQuiz ? activeQuiz.correct_submissions_count : 0;
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

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              <i className="fas fa-question-circle text-blue-600 mr-2 sm:mr-3"></i>
              <span className="hidden sm:inline">Quiz Management</span>
              <span className="sm:hidden">Quiz</span>
            </h2>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-3">
              <button
                onClick={() => {
                  if (activeQuiz) {
                    showToast(
                      "There is already an active quiz. Please delete the existing quiz before creating a new one.",
                      "error"
                    );
                  } else {
                    // Clear password when starting to create a new quiz
                    setQuizPassword("");
                    setShowPasswordModal(true);
                  }
                }}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm sm:text-base ${
                  activeQuiz
                    ? "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                disabled={activeQuiz}
              >
                <i className="fas fa-plus mr-1 sm:mr-2"></i>
                <span className="hidden xs:inline">
                  {activeQuiz ? "Quiz Exists" : "Create Quiz"}
                </span>
                <span className="xs:hidden">
                  {activeQuiz ? "Exists" : "Create"}
                </span>
              </button>
              {activeQuiz && (
                <button
                  onClick={handleEditQuiz}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm sm:text-base"
                >
                  <i className="fas fa-edit mr-1 sm:mr-2"></i>
                  <span className="hidden xs:inline">Edit Quiz</span>
                  <span className="xs:hidden">Edit</span>
                </button>
              )}
              {activeQuiz && activeQuiz.is_active && (
                <button
                  onClick={handleEndQuiz}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm sm:text-base"
                >
                  <i className="fas fa-stop mr-1 sm:mr-2"></i>
                  <span className="hidden xs:inline">End Quiz</span>
                  <span className="xs:hidden">End</span>
                </button>
              )}
              {activeQuiz && (
                <button
                  onClick={handleDeleteQuiz}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm sm:text-base"
                >
                  <i className="fas fa-trash mr-1 sm:mr-2"></i>
                  <span className="hidden xs:inline">Delete Quiz</span>
                  <span className="xs:hidden">Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Quiz Display */}
          {activeQuiz && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Current Quiz: {activeQuiz.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Question:</strong> {activeQuiz.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="truncate">
                      <strong>A:</strong>{" "}
                      <span className="ml-1">{activeQuiz.option_a}</span>
                    </div>
                    <div className="truncate">
                      <strong>B:</strong>{" "}
                      <span className="ml-1">{activeQuiz.option_b}</span>
                    </div>
                    <div className="truncate">
                      <strong>C:</strong>{" "}
                      <span className="ml-1">{activeQuiz.option_c}</span>
                    </div>
                    <div className="truncate">
                      <strong>D:</strong>{" "}
                      <span className="ml-1">{activeQuiz.option_d}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeQuiz.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {activeQuiz.is_active ? "Active" : "Ended"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="truncate">
                  <strong>Start Time:</strong>{" "}
                  <span className="text-xs sm:text-sm">
                    {new Date(activeQuiz.start_time).toLocaleString()}
                  </span>
                </div>
                <div className="truncate">
                  <strong>End Time:</strong>{" "}
                  <span className="text-xs sm:text-sm">
                    {new Date(activeQuiz.end_time).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong>Submissions:</strong> {activeQuiz.submissions_count}
                </div>
              </div>
            </div>
          )}

          {/* Quiz Statistics */}
          {activeQuiz && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="fas fa-users text-blue-600 text-2xl mr-3"></i>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Total Participants
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {getTotalParticipants()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="fas fa-trophy text-green-600 text-2xl mr-3"></i>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Correct Answers
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {getCorrectAnswers()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="fas fa-percentage text-purple-600 text-2xl mr-3"></i>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {getTotalParticipants() > 0
                        ? Math.round(
                            (getCorrectAnswers() / getTotalParticipants()) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Password Management */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-key text-blue-600 mr-2"></i>
            Quiz Password Management
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Quiz Password
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showQuizPassword ? "text" : "password"}
                  value={quizPassword}
                  onChange={(e) => setQuizPassword(e.target.value)}
                  className="flex-1 px-2 w-[2rem] py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter quiz password"
                />
                <button
                  onClick={() => setShowQuizPassword((v) => !v)}
                  className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                  title={showQuizPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`fas ${showQuizPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quizPassword);
                    showToast("Password copied to clipboard!", "success");
                  }}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
                  title="Copy password"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <button
              onClick={handleGeneratePassword}
              className="bg-purple-600 hover:bg-purple-700 mt-6 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
            >
              <i className="fas fa-sync-alt mr-2"></i>G N P
            </button>
          </div>
        </div>

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
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Enter Admin Password
            </h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type={showAdminPassword ? "text" : "password"}
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit(adminPasswordInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200"
                title={showAdminPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`fas ${showAdminPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPasswordInput("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePasswordSubmit(adminPasswordInput)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Quiz
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="e.g., Bible Quiz, Hymnal Quiz, General Knowledge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  rows="3"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionA}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionA: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Option A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionB}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionB: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Option B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionC}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionC: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionD}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionD: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Option D"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Correct Answer
                  </label>
                  <select
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  >
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newQuestion.startTime}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newQuestion.endTime}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  // Clear form when canceling
                  setNewQuestion({
                    title: "",
                    question: "",
                    optionA: "",
                    optionB: "",
                    optionC: "",
                    optionD: "",
                    correctAnswer: "",
                    startTime: "",
                    endTime: "",
                  });
                  setQuizPassword("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Quiz
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="e.g., Bible Quiz, Hymna Quiz, General Knowledge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionA}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionA: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionB}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionB: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionC}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionC: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={newQuestion.optionD}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        optionD: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correct Answer
                </label>
                <select
                  value={newQuestion.correctAnswer}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">Select correct answer</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Password
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showQuizPassword ? "text" : "password"}
                    value={quizPassword}
                    onChange={(e) => setQuizPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Enter quiz password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuizPassword(!showQuizPassword)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200"
                    title={showQuizPassword ? "Hide password" : "Show password"}
                  >
                    <i
                      className={`fas ${showQuizPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
                    title="Generate random password"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newQuestion.startTime}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newQuestion.endTime}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingQuiz(false);
                  // Clear form when canceling edit
                  setNewQuestion({
                    title: "",
                    question: "",
                    optionA: "",
                    optionB: "",
                    optionC: "",
                    optionD: "",
                    correctAnswer: "",
                    startTime: "",
                    endTime: "",
                  });
                  setQuizPassword("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuiz}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Update Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </DashboardLayout>
  );
}
