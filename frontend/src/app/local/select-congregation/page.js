"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CONGREGATION_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-orange-500",
];

export default function SelectCongregationPage() {
  const router = useRouter();
  const [congregations, setCongregations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCongregation, setSelectedCongregation] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const fetchCongregations = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/congregations/`);
        const data = await res.json();
        if (data.success) {
          const list = data.congregations || [];
          setCongregations(
            list.map((cong, i) => ({
              id: String(cong.id),
              name: cong.name,
              color: CONGREGATION_COLORS[i % CONGREGATION_COLORS.length],
            }))
          );
        }
      } catch (e) {
        console.error("Failed to load congregations", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCongregations();
  }, [baseUrl]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  const handleCongregationSelect = (congregation) => {
    setSelectedCongregation(congregation);

    localStorage.setItem("congregationId", congregation.id);
    localStorage.setItem("congregationName", congregation.name);

    showToast(`${congregation.name} selected successfully!`, "success");

    setTimeout(() => {
      router.push(`/local/congregation/${congregation.id}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Select Your Congregation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose your congregation to access the local dashboard
          </p>
        </div>

        {/* Congregation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading congregations...</p>
            </div>
          ) : congregations.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No congregations available.</p>
            </div>
          ) : (
            congregations.map((congregation) => (
            <div
              key={congregation.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 ${
                selectedCongregation?.id === congregation.id
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
              onClick={() => handleCongregationSelect(congregation)}
            >
              <div
                className={`${congregation.color} rounded-t-lg p-6 text-white`}
              >
                <div className="text-center">
                  <i className="fas fa-church text-3xl mb-2"></i>
                  <h3 className="text-lg font-semibold">{congregation.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Click to access dashboard
                  </p>
                  <button
                    className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                      selectedCongregation?.id === congregation.id
                        ? "bg-blue-500"
                        : congregation.color
                            .replace("bg-", "bg-")
                            .replace("-500", "-600")
                    }`}
                  >
                    <i className="fas fa-arrow-right mr-2"></i>
                    Access Dashboard
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Home
          </Link>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center">
              <i
                className={`fas ${
                  toast.type === "success"
                    ? "fa-check-circle"
                    : "fa-exclamation-circle"
                } mr-2`}
              ></i>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
