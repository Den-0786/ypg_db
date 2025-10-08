/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ToastContainer from "./components/ToastContainer";
import getDataStore from "./utils/dataStore";

export default function HomePage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardPositions, setCardPositions] = useState({
    left: [0, 1, 2],
    right: [0, 1, 2],
  });
  const [mobileShowRight, setMobileShowRight] = useState(false);
  const [countingNumbers, setCountingNumbers] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [realTimeData, setRealTimeData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalMale: 0,
    totalFemale: 0,
    totalCongregations: 0,
    sundayAttendance: 0,
    weeklyQuiz: 0,
    leaderboardTop: [],
    growthRate: 0,
    averageAttendance: 0,
    executiveMembers: 0,
    thisWeekAttendance: 0,
    thisMonthAttendance: 0,
    totalEvents: 0,
    volunteerHours: 0,
    bibleStudyGroups: 0,
    communityOutreach: 0,
    prayerRequests: 0,
    digitalEngagement: 0,
    leadershipTraining: 0,
    worshipTeams: 0,
    missionTrips: 0,
    smallGroups: 0,
    discipleship: 0,
    innovationScore: "A+",
  });

  // Navigation items with descriptions
  const navigationItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "fas fa-tachometer-alt",
      description:
        "Access comprehensive overview of YPG activities, statistics, and key metrics. View district-wide data and performance indicators.",
      loginRequired: true,
    },
    {
      id: "members",
      name: "Members",
      icon: "fas fa-users",
      description:
        "Manage member database, view profiles, add new members, and track membership status across all congregations.",
      loginRequired: true,
    },
    {
      id: "attendance",
      name: "Attendance",
      icon: "fas fa-calendar-check",
      description:
        "Log and track Sunday service attendance, view trends, and generate attendance reports for all congregations.",
      loginRequired: true,
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: "fas fa-chart-bar",
      description:
        "Access detailed analytics, charts, and insights about member growth, attendance patterns, and performance metrics.",
      loginRequired: true,
    },
    {
      id: "bulk",
      name: "Bulk Add",
      icon: "fas fa-user-plus",
      description:
        "Add multiple members at once, import data from spreadsheets, and manage bulk operations efficiently.",
      loginRequired: true,
    },
  ];

  // Fetch real-time data from API and dataStore
  const fetchRealTimeData = async () => {
    const dataStore = getDataStore();

    try {
      // Try to fetch real data from API first
      const apiData = await dataStore.fetchHomeStats();

      if (apiData) {
        // Use real data from API
        setRealTimeData({
          totalMembers: apiData.totalMembers || 0,
          activeMembers: apiData.activeMembers || 0,
          totalMale: apiData.totalMale || 0,
          totalFemale: apiData.totalFemale || 0,
          totalCongregations: apiData.totalCongregations || 0,
          sundayAttendance: apiData.sundayAttendance || 0,
          weeklyQuiz: apiData.weeklyQuiz || 35,
          leaderboardTop: apiData.leaderboardTop || [],
          growthRate: apiData.growthRate || 0,
          averageAttendance: apiData.sundayAttendance || 0,
          executiveMembers: apiData.executiveMembers || 0,
          thisWeekAttendance: apiData.thisWeekAttendance || 0,
          thisMonthAttendance: apiData.thisMonthAttendance || 0,
          totalEvents: apiData.totalEvents || 12,
          volunteerHours: apiData.volunteerHours || 1850,
          bibleStudyGroups: apiData.bibleStudyGroups || 18,
          communityOutreach: apiData.communityOutreach || 150,
          prayerRequests: apiData.prayerRequests || 45,
          digitalEngagement: apiData.digitalEngagement || 85,
          leadershipTraining: apiData.leadershipTraining || 28,
          worshipTeams: apiData.worshipTeams || 8,
          missionTrips: apiData.missionTrips || 3,
          smallGroups: apiData.smallGroups || 15,
          discipleship: apiData.discipleship || 65,
          innovationScore: apiData.innovationScore || "A+",
        });
      } else {
        // Fallback to local dataStore if API fails
        const members = await dataStore.getMembers();
        const attendanceRecords = await dataStore.getAttendanceRecords();
        const analytics = dataStore.getAnalyticsData();
        const leaderboard = dataStore.getLeaderboardData("weekly");

        // Ensure we have arrays
        const membersArray = Array.isArray(members) ? members : [];
        const attendanceArray = Array.isArray(attendanceRecords)
          ? attendanceRecords
          : [];

        // Calculate statistics from local data
        const totalMembers = membersArray.length;
        const activeMembers = membersArray.filter(
          (m) => m.status !== "Inactive"
        ).length;
        const totalMale = membersArray.filter(
          (m) => m.gender === "Male"
        ).length;
        const totalFemale = membersArray.filter(
          (m) => m.gender === "Female"
        ).length;
        const executiveMembers = membersArray.filter(
          (m) => m.is_executive
        ).length;

        // Get unique congregations
        const congregations = [
          ...new Set(membersArray.map((m) => m.congregation)),
        ];
        const totalCongregations = congregations.length;

        // Calculate attendance statistics
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentWeek = Math.ceil(
          (currentDate.getDate() +
            new Date(currentYear, currentMonth, 1).getDay()) /
            7
        );

        // This week's attendance
        const thisWeekRecords = attendanceArray.filter((r) => {
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
            recordDate.getFullYear() === currentYear &&
            recordDate.getMonth() === currentMonth &&
            recordWeek === currentWeek
          );
        });
        const thisWeekAttendance = thisWeekRecords.reduce(
          (sum, r) => sum + (r.total || 0),
          0
        );

        // This month's attendance
        const thisMonthRecords = attendanceArray.filter((r) => {
          const recordDate = new Date(r.date);
          return (
            recordDate.getFullYear() === currentYear &&
            recordDate.getMonth() === currentMonth
          );
        });
        const thisMonthAttendance = thisMonthRecords.reduce(
          (sum, r) => sum + (r.total || 0),
          0
        );

        // Average attendance
        const averageAttendance =
          attendanceArray.length > 0
            ? attendanceArray.reduce((sum, r) => sum + (r.total || 0), 0) /
              attendanceArray.length
            : 0;

        // Growth rate calculation
        const recentRecords = attendanceArray
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 2);

        let growthRate = 0;
        if (recentRecords.length >= 2) {
          const recent = recentRecords[0].total || 0;
          const previous = recentRecords[1].total || 0;
          growthRate =
            previous > 0 ? ((recent - previous) / previous) * 100 : 0;
        }

        // Mock data for additional metrics (hybrid approach)
        const weeklyQuiz = Math.floor(Math.random() * 50) + 20;
        const totalEvents = Math.floor(Math.random() * 15) + 5;
        const volunteerHours = Math.floor(Math.random() * 1000) + 1500;
        const bibleStudyGroups = Math.floor(Math.random() * 10) + 15;
        const communityOutreach = Math.floor(Math.random() * 100) + 100;
        const prayerRequests = Math.floor(Math.random() * 50) + 30;
        const digitalEngagement = Math.floor(Math.random() * 20) + 80;
        const leadershipTraining = Math.floor(Math.random() * 20) + 25;
        const worshipTeams = Math.floor(Math.random() * 5) + 5;
        const missionTrips = Math.floor(Math.random() * 3) + 2;
        const smallGroups = Math.floor(Math.random() * 10) + 12;
        const discipleship = Math.floor(Math.random() * 30) + 50;

        setRealTimeData({
          totalMembers,
          activeMembers,
          totalMale,
          totalFemale,
          totalCongregations,
          sundayAttendance: Math.round(averageAttendance),
          weeklyQuiz,
          leaderboardTop: leaderboard.slice(0, 3),
          growthRate: Math.round(growthRate),
          averageAttendance: Math.round(averageAttendance),
          executiveMembers,
          thisWeekAttendance,
          thisMonthAttendance,
          totalEvents,
          volunteerHours,
          bibleStudyGroups,
          communityOutreach,
          prayerRequests,
          digitalEngagement,
          leadershipTraining,
          worshipTeams,
          missionTrips,
          smallGroups,
          discipleship,
          innovationScore: "A+",
        });
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);
      // Fallback to mock data if everything fails
      setRealTimeData({
        totalMembers: 0,
        activeMembers: 0,
        totalMale: 0,
        totalFemale: 0,
        totalCongregations: 0,
        sundayAttendance: 0,
        weeklyQuiz: 35,
        leaderboardTop: [],
        growthRate: 0,
        averageAttendance: 0,
        executiveMembers: 0,
        thisWeekAttendance: 0,
        thisMonthAttendance: 0,
        totalEvents: 12,
        volunteerHours: 1850,
        bibleStudyGroups: 18,
        communityOutreach: 150,
        prayerRequests: 45,
        digitalEngagement: 85,
        leadershipTraining: 28,
        worshipTeams: 8,
        missionTrips: 3,
        smallGroups: 15,
        discipleship: 65,
        innovationScore: "A+",
      });
    }
  };

  // Card data for rotation - now using real-time data
  const getCardSets = () => [
    // Set 1 - Core Statistics
    {
      left: [
        {
          title: "Total Members",
          value: realTimeData.totalMembers,
          subtitle: "Active YPG Members",
          icon: "fas fa-users",
          color: "from-blue-500 to-blue-600",
        },
        {
          title: "Sunday Attendance",
          value: realTimeData.sundayAttendance,
          subtitle: "Average Weekly",
          icon: "fas fa-church",
          color: "from-green-500 to-green-600",
        },
        {
          title: "Congregations",
          value: realTimeData.totalCongregations,
          subtitle: "Active Branches",
          icon: "fas fa-building",
          color: "from-purple-500 to-purple-600",
        },
      ],
      right: [
        {
          title: "Executive Members",
          value: realTimeData.executiveMembers,
          subtitle: "Leadership Team",
          icon: "fas fa-star",
          color: "from-yellow-500 to-yellow-600",
        },
        {
          title: "This Week Attendance",
          value: realTimeData.thisWeekAttendance,
          subtitle: "Current Week",
          icon: "fas fa-calendar-week",
          color: "from-red-500 to-red-600",
        },
        {
          title: "Growth Rate",
          value: realTimeData.growthRate,
          subtitle: "Monthly Increase %",
          icon: "fas fa-chart-line",
          color: "from-teal-500 to-teal-600",
        },
      ],
    },
    // Set 2 - Gender & Activity Statistics
    {
      left: [
        {
          title: "Male Members",
          value: realTimeData.totalMale,
          subtitle: "Total Male Count",
          icon: "fas fa-male",
          color: "from-indigo-500 to-indigo-600",
        },
        {
          title: "Female Members",
          value: realTimeData.totalFemale,
          subtitle: "Total Female Count",
          icon: "fas fa-female",
          color: "from-pink-500 to-pink-600",
        },
        {
          title: "Active Members",
          value: realTimeData.activeMembers,
          subtitle: "Currently Active",
          icon: "fas fa-user-check",
          color: "from-emerald-500 to-emerald-600",
        },
      ],
      right: [
        {
          title: "This Month Attendance",
          value: realTimeData.thisMonthAttendance,
          subtitle: "Monthly Total",
          icon: "fas fa-calendar-alt",
          color: "from-cyan-500 to-cyan-600",
        },
        {
          title: "Weekly Quiz",
          value: realTimeData.weeklyQuiz,
          subtitle: "Participants",
          icon: "fas fa-question-circle",
          color: "from-orange-500 to-orange-600",
        },
        {
          title: "Events This Month",
          value: realTimeData.totalEvents,
          subtitle: "Activities Planned",
          icon: "fas fa-calendar",
          color: "from-violet-500 to-violet-600",
        },
      ],
    },
    // Set 3 - Programs & Activities
    {
      left: [
        {
          title: "Bible Study Groups",
          value: realTimeData.bibleStudyGroups,
          subtitle: "Weekly Sessions",
          icon: "fas fa-book-open",
          color: "from-rose-500 to-rose-600",
        },
        {
          title: "Volunteer Hours",
          value: realTimeData.volunteerHours,
          subtitle: "This Quarter",
          icon: "fas fa-clock",
          color: "from-lime-500 to-lime-600",
        },
        {
          title: "Community Outreach",
          value: realTimeData.communityOutreach,
          subtitle: "People Reached",
          icon: "fas fa-hands-helping",
          color: "from-amber-500 to-amber-600",
        },
      ],
      right: [
        {
          title: "Prayer Requests",
          value: realTimeData.prayerRequests,
          subtitle: "This Week",
          icon: "fas fa-pray",
          color: "from-sky-500 to-sky-600",
        },
        {
          title: "Digital Engagement",
          value: realTimeData.digitalEngagement,
          subtitle: "Online Activity %",
          icon: "fas fa-mobile-alt",
          color: "from-fuchsia-500 to-fuchsia-600",
        },
        {
          title: "Leadership Training",
          value: realTimeData.leadershipTraining,
          subtitle: "Sessions Completed",
          icon: "fas fa-graduation-cap",
          color: "from-slate-500 to-slate-600",
        },
      ],
    },
  ];

  // Rotate card positions (climbing effect)
  const rotateCardPositions = () => {
    setCardPositions((prev) => ({
      left: [prev.left[2], prev.left[0], prev.left[1]], // Bottom moves to top, others shift down
      right: [prev.right[2], prev.right[0], prev.right[1]],
    }));
  };

  // Auto-rotate cards every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % getCardSets().length);
      rotateCardPositions();
      setMobileShowRight((prev) => !prev);
    }, 10000);

    return () => clearInterval(interval);
  }, [realTimeData]);

  // Fetch real-time data on component mount and set up periodic updates
  useEffect(() => {
    const loadData = async () => {
      await fetchRealTimeData();
    };

    loadData();

    // Update data every 30 seconds
    const dataInterval = setInterval(async () => {
      await fetchRealTimeData();
    }, 30000);

    return () => clearInterval(dataInterval);
  }, []);

  // Number counting animation
  useEffect(() => {
    const currentCards = getCardSets()[currentCardIndex];
    const allCards = [...currentCards.left, ...currentCards.right];

    allCards.forEach((card, index) => {
      if (typeof card.value === "number") {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = card.value / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= card.value) {
            current = card.value;
            clearInterval(timer);
          }

          setCountingNumbers((prev) => ({
            ...prev,
            [`${currentCardIndex}-${index}`]: Math.floor(current),
          }));
        }, duration / steps);
      }
    });
  }, [currentCardIndex, realTimeData]);

  const currentCards = getCardSets()[currentCardIndex];

  // Get display value for a card
  const getDisplayValue = (card, index) => {
    if (typeof card.value === "string") return card.value;
    const key = `${currentCardIndex}-${index}`;
    return countingNumbers[key] || 0;
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (typeof num === "string") return num;
    return num.toLocaleString();
  };

  // Handle navigation item click
  const handleNavItemClick = (item) => {
    if (item.loginRequired) {
      // Show toast message instead of alert
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(`Please log in to access ${item.name}`, "info", 4000);
      }
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  };

  // Handle tooltip toggle for mobile
  const handleTooltipToggle = (itemId) => {
    if (showTooltip === itemId) {
      setShowTooltip(null);
    } else {
      setShowTooltip(itemId);
    }
  };

  return (
    <div className="min-h-screen h-screen w-full relative overflow-hidden">
      {/* Prevent scrollbars */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
          width: 100%;
          overflow: hidden !important;
        }
      `}</style>
      {/* Background image and overlay - always cover full viewport */}
      <div className="fixed inset-0 w-full h-full z-0">
        <img
          src="/land.jpg"
          alt="Background"
          className="w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#e9d8c3]/60 to-[#bfae9e]/40 pointer-events-none"
          style={{ zIndex: 1 }}
        ></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between w-full">
        {/* Single blue header for the home page */}
        <header className="bg-blue-600 shadow-lg w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between fixed top-0 left-0 z-20">
          <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-6">
            <i className="fas fa-database text-white text-lg sm:text-2xl"></i>
            <span className="text-white text-lg sm:text-2xl font-bold">
              YPG Database
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="px-3 sm:px-6 py-1 sm:py-2 bg-white text-blue-600 hover:bg-blue-100 rounded-lg font-semibold text-xs sm:text-base transition-all duration-300 border border-blue-500 shadow-md hover:shadow-lg transform hover:scale-105"
              onClick={() => (window.location.href = "/login")}
            >
              <i className="fas fa-sign-in-alt mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </button>
            <nav className="hidden sm:flex space-x-2 sm:space-x-3 pr-2 sm:pr-6">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  className="px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-blue-700 text-white shadow-md border-b-2 border-white flex items-center hover:bg-blue-800 transition-colors relative group"
                  onClick={() => handleNavItemClick(item)}
                  onMouseEnter={() => setShowTooltip(item.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <i className={`${item.icon} mr-1`}></i>
                  <span className="hidden lg:inline">{item.name}</span>

                  {/* Tooltip */}
                  {showTooltip === item.id && (
                    <div
                      className={`absolute top-full mt-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg min-w-[280px] max-w-[350px] z-30 ${
                        item.id === "bulk"
                          ? "right-0"
                          : "left-1/2 transform -translate-x-1/2"
                      }`}
                    >
                      <div className="font-semibold mb-2 text-base">
                        {item.name}
                      </div>
                      <div className="text-gray-300 mb-2 leading-relaxed">
                        {item.description}
                      </div>
                      <div className="text-blue-300 text-sm">
                        Click to login and access
                      </div>
                      {/* Arrow */}
                      <div
                        className={`absolute bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 ${
                          item.id === "bulk"
                            ? "right-4"
                            : "left-1/2 transform -translate-x-1/2"
                        }`}
                      ></div>
                    </div>
                  )}
                </button>
              ))}
            </nav>
            {/* Mobile menu button */}
            <button
              className="sm:hidden px-2 py-1 text-white hover:text-blue-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i
                className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-sm`}
              ></i>
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown with overlay */}
        {mobileMenuOpen && (
          <>
            {/* Blur overlay to close menu when clicking outside */}
            <div
              className="fixed inset-0 z-10 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Mobile menu itself */}
            <div className="sm:hidden fixed left-0 right-0 top-[56px] z-20 bg-blue-700 shadow-lg border-t border-blue-600">
              <nav className="flex flex-col py-2 space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    className="mx-2 rounded-md bg-blue-700 text-white shadow-md border-b-2 border-white flex items-center font-medium px-4 py-3 hover:bg-blue-800 transition-colors relative"
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        // On mobile, toggle tooltip first
                        handleTooltipToggle(item.id);
                      } else {
                        // On desktop, go directly to login
                        handleNavItemClick(item);
                      }
                    }}
                    onTouchStart={() => setShowTooltip(item.id)}
                    onTouchEnd={() =>
                      setTimeout(() => setShowTooltip(null), 3000)
                    }
                    onMouseEnter={() => setShowTooltip(item.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <i className={`${item.icon} mr-3`}></i>
                    {item.name}

                    {/* Mobile Tooltip */}
                    {showTooltip === item.id && (
                      <div
                        className={`absolute top-full mt-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg min-w-[280px] max-w-[350px] z-30 ${
                          item.id === "bulk"
                            ? "right-0"
                            : "left-1/2 transform -translate-x-1/2"
                        }`}
                      >
                        <div className="font-semibold mb-2 text-base">
                          {item.name}
                        </div>
                        <div className="text-gray-300 mb-2 leading-relaxed">
                          {item.description}
                        </div>
                        <div className="text-blue-300 text-sm">
                          Tap to login and access
                        </div>
                        {/* Arrow */}
                        <div
                          className={`absolute bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 ${
                            item.id === "bulk"
                              ? "right-4"
                              : "left-1/2 transform -translate-x-1/2"
                          }`}
                        ></div>
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        {/* Welcome message below the header */}
        <div className="text-center mt-10 sm:mt-14 mb-0 p-2 sm:p-0">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg px-2">
            Welcome to Ahinsan District YPG Database Management System
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-blue-100 max-w-2xl mx-auto drop-shadow-md mb-0 px-2">
            Empowering young people through comprehensive data management and
            analytics
          </p>
        </div>

        <main className="flex-1 flex flex-col items-center justify-start p-0 w-full mt-0">
          <div className="w-full max-w-7xl flex flex-col items-center h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8 w-full max-w-7xl mx-auto items-center justify-items-center flex-1 mt-0 overflow-hidden px-4">
              {/* Left column cards with position rotation */}
              {cardPositions.left.map((positionIndex, displayIndex) => {
                const card = currentCards.left[positionIndex];
                const originalIndex = currentCards.left.indexOf(card);
                return (
                  <div
                    key={`left-${positionIndex}-${displayIndex}`}
                    className={`${mobileShowRight ? "hidden" : "flex"} sm:flex bg-[#f5e9da]/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-[#e9d8c3] border-opacity-60 hover:bg-[#f5e9da]/90 transition-all duration-500 transform hover:scale-105 shadow-lg flex-col items-center justify-center w-full min-w-[250px] sm:min-w-[300px] lg:min-w-[350px] min-h-[120px] sm:min-h-[140px] lg:min-h-[180px] max-w-[400px] sm:max-w-[450px] lg:max-w-[500px] max-h-[160px] sm:max-h-[180px] lg:max-h-[220px]`}
                    style={{
                      animationDelay: `${displayIndex * 0.1}s`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <h3 className="text-[#6b4f27] text-xs sm:text-sm lg:text-base font-bold mb-1 drop-shadow-md">
                          {card.title}
                        </h3>
                        <p className="text-[#a68a64] text-xs drop-shadow-sm">
                          {card.subtitle}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center shadow-md ml-2`}
                      >
                        <i
                          className={`${card.icon} text-white text-xs sm:text-sm lg:text-base`}
                        ></i>
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-[#6b4f27] drop-shadow-lg">
                        {formatNumber(getDisplayValue(card, originalIndex))}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Right column cards with position rotation */}
              {cardPositions.right.map((positionIndex, displayIndex) => {
                const card = currentCards.right[positionIndex];
                const originalIndex = currentCards.right.indexOf(card) + 3; // +3 because right cards start after left cards
                return (
                  <div
                    key={`right-${positionIndex}-${displayIndex}`}
                    className={`${mobileShowRight ? "flex" : "hidden"} sm:flex bg-[#f5e9da]/70 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-[#e9d8c3] border-opacity-60 hover:bg-[#f5e9da]/90 transition-all duration-500 transform hover:scale-105 shadow-lg flex-col items-center justify-center w-full min-w-[250px] sm:min-w-[300px] lg:min-w-[350px] min-h-[120px] sm:min-h-[140px] lg:min-h-[180px] max-w-[400px] sm:max-w-[450px] lg:max-w-[500px] max-h-[160px] sm:max-h-[180px] lg:max-h-[220px]`}
                    style={{
                      animationDelay: `${(displayIndex + 3) * 0.1}s`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <h3 className="text-[#6b4f27] text-xs sm:text-sm lg:text-base font-bold mb-1 drop-shadow-md">
                          {card.title}
                        </h3>
                        <p className="text-[#a68a64] text-xs drop-shadow-sm">
                          {card.subtitle}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center shadow-md ml-2`}
                      >
                        <i
                          className={`${card.icon} text-white text-xs sm:text-sm lg:text-base`}
                        ></i>
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-[#6b4f27] drop-shadow-lg">
                        {formatNumber(getDisplayValue(card, originalIndex))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card rotation indicator */}
            <div className="text-center mt-4">
              <div className="flex justify-center space-x-2">
                {getCardSets().map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentCardIndex
                        ? "bg-[#6b4f27]"
                        : "bg-[#6b4f27] bg-opacity-30"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <div className="flex flex-col items-center w-full mb-1">
          <footer className="p-0 text-center w-full">
            <p className="text-[#a68a64] text-xs drop-shadow-sm">
              © 2024 YPG Database System - Empowering Youth Ministry
            </p>
          </footer>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
