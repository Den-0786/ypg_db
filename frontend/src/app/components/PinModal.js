"use client";
import { useState, useEffect } from "react";

export default function PinModal({
  isOpen,
  onClose,
  onConfirm,
  onPinSuccess,
  title,
  message,
  description,
  type = "edit",
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPin, setCurrentPin] = useState("1234"); // Default fallback
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch current PIN from server
  useEffect(() => {
    const fetchCurrentPin = async () => {
      try {
        // Get congregation info from localStorage
        const congregationId = localStorage.getItem("congregationId");
        const congregationName = localStorage.getItem("congregationName");

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-current-pin/?congregation_id=${congregationId}&congregation_name=${encodeURIComponent(congregationName || "")}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDebugInfo(data);
            setCurrentPin(data.pin);
          }
        }
      } catch (error) {
        console.error("Error fetching current PIN:", error);
        // Keep default PIN
      }
    };

    if (isOpen) {
      fetchCurrentPin();
    }
  }, [isOpen]);

  const checkCurrentPin = async () => {
    try {
      // Get congregation info from localStorage
      const congregationId = localStorage.getItem("congregationId");
      const congregationName = localStorage.getItem("congregationName");

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-current-pin/?congregation_id=${congregationId}&congregation_name=${encodeURIComponent(congregationName || "")}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      }
    } catch (error) {
      console.error("Error checking current PIN:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Get congregation info from localStorage
      const user = localStorage.getItem("user");
      const congregationId = localStorage.getItem("congregationId");
      const congregationName = localStorage.getItem("congregationName");

      // Validate PIN with server
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/validate-pin/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin: pin,
            congregation_id: congregationId,
            congregation_name: congregationName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        // Clear PIN after successful validation
        setPin("");
        setError("");
        // Support both onConfirm and onPinSuccess for backward compatibility
        if (onPinSuccess) {
          onPinSuccess();
          // Don't close immediately - let the parent handle closing
        } else if (onConfirm) {
          onConfirm();
          handleClose();
        }
      } else {
        setError(data.error || "Incorrect PIN. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error validating PIN:", error);
      setError("Failed to validate PIN. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    setIsLoading(false);
    onClose();
  };

  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setPin(value);
      setError(""); // Clear error when user starts typing
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-[18rem] sm:max-w-sm md:max-w-md w-full">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center">
              <i
                className={`fas ${type === "edit" ? "fa-edit" : type === "delete" ? "fa-trash" : "fa-lock"} text-red-500 mr-2 text-sm`}
              ></i>
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
            {description || message}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                className={`w-full px-2 sm:px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:border-transparent ${
                  error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }`}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                required
                autoFocus
              />
              {error && (
                <p className="mt-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-white rounded-md transition-colors bg-blue-500 hover:bg-blue-700 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoading || !pin}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-1 text-[11px] sm:text-xs"></i>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <i className="fas fa-check mr-1 text-[11px] sm:text-xs"></i>
                    Confirm
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
