/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ToastContainer from "./components/ToastContainer";
import getDataStore from "./utils/dataStore";

export default function HomePage() {
  const [showNavbar, setShowNavbar] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [realTimeData, setRealTimeData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalMale: 0,
    totalFemale: 0,
    totalCongregations: 0,
    sundayAttendance: 0,
    thisWeekAttendance: 0,
    newMembersThisMonth: 0,
    thisMonthAttendance: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showToast = (message, type = "success", duration = 3000) => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), duration);
      };
    }
  }, []);

  // Show navbar on scroll
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setShowNavbar(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setShowNavbar(false);
      }, 2000);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Feature cards with icon letters
  const featureCards = [
    {
      title: "Member Records",
      description: "Detailed directory and profile management for every youth member.",
      icon: "M",
    },
    {
      title: "Financial Tracking",
      description: "Monitor dues, donations, and other budgets with transparent recording.",
      icon: "F",
    },
    {
      title: "Attendance Analytics",
      description: "Visualize guild attendance patterns and engagement levels over time.",
      icon: "A",
    },
    {
      title: "Report Generation",
      description: "Create and export detailed infrastructure reports for district reviews.",
      icon: "R",
    },
  ];

  // Why join us cards with images
  const whyJoinCards = [
    {
      title: "United Community",
      description: "Joining and supporting every member across Ahinsan district guild family.",
      image: "/DocumentNamemypictures_122.JPG",
    },
    {
      title: "Outreach Impact",
      description: "Our youth actively participate in the growth of our community service initiatives.",
      image: "/DocumentNamemypictures_291.jpg",
    },
    {
      title: "Leadership Insights",
      description: "Building leaders with the tools to lead, inspire, and make a difference.",
      image: "/DocumentNamemypictures_96.JPG",
    },
    {
      title: "Rooted in God's Word",
      description: "Grounding our youth in scripture and faith for spiritual growth and maturity.",
      image: "/DocumentNamemypictures_112.JPG",
    },
  ];

  // Fetch real-time data from API and dataStore
  const fetchRealTimeData = async () => {
    const dataStore = getDataStore();

    try {
      const apiData = await dataStore.fetchHomeStats();

      if (apiData) {
        setRealTimeData({
          totalMembers: apiData.totalMembers || 0,
          activeMembers: apiData.activeMembers || 0,
          totalMale: apiData.totalMale || 0,
          totalFemale: apiData.totalFemale || 0,
          totalCongregations: apiData.totalCongregations || 0,
          sundayAttendance: apiData.sundayAttendance || 0,
          thisWeekAttendance: apiData.thisWeekAttendance || 0,
          newMembersThisMonth: apiData.newMembersThisMonth || 0,
          thisMonthAttendance: apiData.thisMonthAttendance || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
    const dataInterval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(dataInterval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Navbar - appears on scroll */}
      <header className={`bg-white shadow-md fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">Ahinsan District YPG</span>
          <div className="flex items-center space-x-3">
            <a
              href="https://ypg-website.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 text-sm font-medium hidden sm:inline"
            >
              Main Website
            </a>
            <Link
              href="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-[70vh] sm:h-[80vh] w-full">
          <img
            src="/DocumentNamemypictures_3.JPG"
            alt="YPG Group Photo"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-1 bg-orange-500 mb-6"></div>
            <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-2">YPG Member Database</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              DATABASE &<br />YOUTH SOLUTIONS
            </h1>
            <p className="text-gray-300 max-w-xl mx-auto mb-8 text-sm sm:text-base">
              Empowering Ahinsan District YPG through modern data management and community building tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-sm"
              >
                Get Started
              </Link>
              <a
                href="https://ypg-website.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition-colors text-sm"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-t-4 border-orange-500"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{card.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why You Should Join Us Section */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase text-center mb-2">What We Offer</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center mb-12">
            WHY YOU SHOULD<br />JOIN US
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyJoinCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-b-4 border-orange-500"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Ahinsan District YPG</h3>
              <p className="text-gray-400 text-sm">Database & Youth Solutions</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-sm mb-3">Visit our main website</p>
              <a
                href="https://ypg-website.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Go to Website
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Ahinsan District YPG Database System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <ToastContainer />
      <ToastContainer
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
