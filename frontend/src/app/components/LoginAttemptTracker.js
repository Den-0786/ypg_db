"use client";
import { useState } from "react";
import { useToast } from "./Toast";

const LoginAttemptTracker = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    pin: "",
  });
  const [loginType, setLoginType] = useState("password"); // "password" or "pin"
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        loginType === "password" ? "/api/auth/login/" : "/api/auth/pin-login/";

      const requestBody =
        loginType === "password"
          ? {
              username: loginData.username,
              password: loginData.password,
            }
          : {
              username: loginData.username,
              pin: loginData.pin,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(data.message || "Login successful!");
        // Clear form
        setLoginData({
          username: "",
          password: "",
          pin: "",
        });
        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.congregation);
        }
      } else {
        // Handle different error types
        if (response.status === 429) {
          // Too many attempts - blocked
          showError(
            data.error ||
              "Maximum attempts reached. Please try again in 5 hours."
          );
        } else if (response.status === 401) {
          // Invalid credentials
          showError(data.error || "Invalid credentials.");
        } else {
          // Other errors
          showError(data.error || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      showError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(data.message || "Logout successful!");
        // Clear form
        setLoginData({
          username: "",
          password: "",
          pin: "",
        });
      } else {
        showError(data.error || "Logout failed.");
      }
    } catch (error) {
      showError("Network error during logout.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Login Attempt Tracker Demo
      </h2>

      {/* Login Type Toggle */}
      <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setLoginType("password")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === "password"
              ? "bg-orange-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Password Login
        </button>
        <button
          onClick={() => setLoginType("pin")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === "pin"
              ? "bg-orange-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          PIN Login
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={loginData.username}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter username"
            required
          />
        </div>

        {/* Password/PIN Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {loginType === "password" ? "Password" : "PIN"}
          </label>
          <input
            type={loginType === "password" ? "password" : "text"}
            name={loginType === "password" ? "password" : "pin"}
            value={
              loginType === "password" ? loginData.password : loginData.pin
            }
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={
              loginType === "password" ? "Enter password" : "Enter 4-digit PIN"
            }
            maxLength={loginType === "pin" ? "4" : undefined}
            pattern={loginType === "pin" ? "[0-9]{4}" : undefined}
            required
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Logging in...
            </div>
          ) : (
            `Login with ${loginType === "password" ? "Password" : "PIN"}`
          )}
        </button>
      </form>

      {/* Logout Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
          Login Attempt Tracking
        </h3>
        <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
          <li>
            • After 3 failed attempts, you&apos;ll be blocked for 30 minutes
          </li>
          <li>
            • After 6 failed attempts, you&apos;ll be blocked for 24 hours
          </li>
          <li>• Attempts are tracked by IP address and username</li>
          <li>• Successful login resets the attempt counter</li>
          <li>• Block time is enforced on both password and PIN login</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginAttemptTracker;
