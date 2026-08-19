"use client";
import { useState } from "react";

export default function PersonalInfoSection({
  currentMember,
  setCurrentMember,
  onNext,
}) {
  const [errors, setErrors] = useState({});

  // Function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Handle input change with capitalization
  const handleInputChange = (field, value) => {
    const capitalizedValue = capitalizeWords(value);
    setCurrentMember({
      ...currentMember,
      [field]: capitalizedValue,
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validation functions
  const validatePhoneNumber = (phone) => {
    if (!phone) return "";

    // Check if it starts with 0
    if (phone.length > 0 && phone[0] !== "0") {
      return "Phone number must start with zero";
    }

    // Check if it's exactly 10 digits
    if (phone.length > 0 && phone.length !== 10) {
      return "Phone number must be 10 digits";
    }

    // Final validation for complete format
    const phoneRegex = /^0[0-9]{9}$/;
    if (phone.length === 10 && !phoneRegex.test(phone)) {
      return "Phone number must be 10 digits";
    }

    return "";
  };

  const validateEmail = (email) => {
    if (!email) return ""; // Email is optional
    if (!email.includes("@")) {
      return "Email must include @ sign";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Enter valid email";
    }
    return "";
  };

  const validateRelativeContact = (contact) => {
    if (!contact) return "";

    // Check if it starts with 0
    if (contact.length > 0 && contact[0] !== "0") {
      return "Contact must start with 0";
    }

    // Check if it's exactly 10 digits
    if (contact.length > 0 && contact.length !== 10) {
      return "Contact must be 10 digits";
    }

    // Final validation for complete format
    const phoneRegex = /^0[0-9]{9}$/;
    if (contact.length === 10 && !phoneRegex.test(contact)) {
      return "Contact must be 10 digits";
    }

    return "";
  };

  // Handle phone number change with validation
  const handlePhoneChange = (value) => {
    setCurrentMember({
      ...currentMember,
      phone_number: value,
    });
    const error = validatePhoneNumber(value);
    setErrors((prev) => ({ ...prev, phone_number: error }));
  };

  // Handle email change with validation
  const handleEmailChange = (value) => {
    setCurrentMember({
      ...currentMember,
      email: value,
    });
    const error = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: error }));
  };

  // Handle relative contact change with validation
  const handleRelativeContactChange = (value) => {
    setCurrentMember({
      ...currentMember,
      relative_contact: value,
    });
    const error = validateRelativeContact(value);
    setErrors((prev) => ({ ...prev, relative_contact: error }));
  };

  // Validate all fields before proceeding
  const handleNextClick = () => {
    const phoneError = validatePhoneNumber(currentMember.phone_number);
    const emailError = validateEmail(currentMember.email);
    const relativeError = validateRelativeContact(
      currentMember.relative_contact
    );

    const newErrors = {
      phone_number: phoneError,
      email: emailError,
      relative_contact: relativeError,
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      onNext();
    }
  };

  return (
    <div className="space-y-4 neumorphic-light dark:neumorphic-dark p-6">
      <h4 className="text-md font-semibold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-2">
        Section A: Personal Information
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            First Name <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="First Name"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Last Name <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.last_name}
            onChange={(e) => handleInputChange("last_name", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="Last Name"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Phone Number <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            value={currentMember.phone_number}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset ${
              errors.phone_number
                ? "border-red-500 focus:ring-red-500"
                : "border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent"
            }`}
            placeholder="0XXXXXXXXX"
          />
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.phone_number}
            </p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={currentMember.gender}
            onChange={(e) =>
              setCurrentMember({
                ...currentMember,
                gender: e.target.value,
              })
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            required
          >
            <option value="" className="text-gray-800 dark:text-white">
              Select Gender
            </option>
            <option value="Male" className="text-gray-800 dark:text-white">
              Male
            </option>
            <option value="Female" className="text-gray-800 dark:text-white">
              Female
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={currentMember.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            }`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth <span className="text-gray-400 text-xs font-normal">(Month & Day only)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={currentMember.dob_month || ""}
              onChange={(e) => {
                const month = e.target.value;
                setCurrentMember((prev) => {
                  const day = prev.dob_day || "";
                  return {
                    ...prev,
                    dob_month: month,
                    date_of_birth: month && day ? `${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "",
                  };
                });
              }}
              className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="">Month</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
            <select
              value={currentMember.dob_day || ""}
              onChange={(e) => {
                const day = e.target.value;
                setCurrentMember((prev) => {
                  const month = prev.dob_month || "";
                  return {
                    ...prev,
                    dob_day: day,
                    date_of_birth: month && day ? `${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "",
                  };
                });
              }}
              className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Place of Residence <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.place_of_residence}
            onChange={(e) =>
              handleInputChange("place_of_residence", e.target.value)
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            placeholder="City/Town"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Residential Address
          </label>
          <input
            type="text"
            value={currentMember.residential_address}
            onChange={(e) =>
              handleInputChange("residential_address", e.target.value)
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            placeholder="Residential address"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profession
          </label>
          <input
            type="text"
            value={currentMember.profession}
            onChange={(e) => handleInputChange("profession", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            placeholder="Student, Teacher, etc."
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hometown <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.hometown}
            onChange={(e) => handleInputChange("hometown", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base"
            placeholder="Hometown"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Relative Contact <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            value={currentMember.relative_contact}
            onChange={(e) => handleRelativeContactChange(e.target.value)}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm lg:text-base ${
              errors.relative_contact
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            }`}
            placeholder="0XXXXXXXXX"
            required
          />
          {errors.relative_contact && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.relative_contact}
            </p>
          )}
        </div>
      </div>

      {/* Profile Picture Upload */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Profile Picture <span className="text-gray-400 text-xs font-normal">(optional — JPG, PNG)</span>
        </label>
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0">
            {currentMember.profile_picture_preview ? (
              <img
                src={currentMember.profile_picture_preview}
                alt="Preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-blue-200 shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-500">
                <i className="fas fa-user text-blue-400 dark:text-blue-300 text-2xl"></i>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setCurrentMember({
                    ...currentMember,
                    profile_picture: file,
                    profile_picture_preview: URL.createObjectURL(file),
                  });
                }
              }}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">Max 5MB. Leave empty to skip.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNextClick}
          className="px-6 py-2 bg-light-accent hover:bg-light-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2 transition-all duration-200 flex items-center hover:shadow-lg"
        >
          <span>Next Section</span>
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
}
