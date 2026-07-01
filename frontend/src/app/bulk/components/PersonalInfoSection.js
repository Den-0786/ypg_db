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
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
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
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            required
          >
            <option value="" className="text-light-text dark:text-dark-text">
              Select Gender
            </option>
            <option
              value="Male"
              className="text-light-text dark:text-dark-text"
            >
              Male
            </option>
            <option
              value="Female"
              className="text-light-text dark:text-dark-text"
            >
              Female
            </option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Email
          </label>
          <input
            type="email"
            value={currentMember.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent"
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
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={currentMember.date_of_birth}
            onChange={(e) => {
              const selectedDate = e.target.value;
              if (selectedDate) {
                const today = new Date();
                const birthDate = new Date(selectedDate);
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                // Adjust age if birthday hasn't occurred this year
                const actualAge =
                  monthDiff < 0 ||
                  (monthDiff === 0 && today.getDate() < birthDate.getDate())
                    ? age - 1
                    : age;

                if (actualAge < 17) {
                  setErrors((prev) => ({
                    ...prev,
                    date_of_birth: "Age cannot be less than 17",
                  }));
                } else if (actualAge > 30) {
                  setErrors((prev) => ({
                    ...prev,
                    date_of_birth: "Age cannot be more than 30",
                  }));
                } else {
                  setErrors((prev) => ({ ...prev, date_of_birth: "" }));
                }
              } else {
                setErrors((prev) => ({ ...prev, date_of_birth: "" }));
              }

              setCurrentMember({
                ...currentMember,
                date_of_birth: selectedDate,
              });
            }}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset ${
              errors.date_of_birth
                ? "border-red-500 focus:ring-red-500"
                : "border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent"
            }`}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.date_of_birth}
            </p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Place of Residence <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.place_of_residence}
            onChange={(e) =>
              handleInputChange("place_of_residence", e.target.value)
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="City/Town"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Residential Address
          </label>
          <input
            type="text"
            value={currentMember.residential_address}
            onChange={(e) =>
              handleInputChange("residential_address", e.target.value)
            }
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="Residential address"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Profession
          </label>
          <input
            type="text"
            value={currentMember.profession}
            onChange={(e) => handleInputChange("profession", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="Student, Teacher, etc."
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Hometown <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={currentMember.hometown}
            onChange={(e) => handleInputChange("hometown", e.target.value)}
            className="w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset"
            placeholder="Hometown"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Relative Contact <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            value={currentMember.relative_contact}
            onChange={(e) => handleRelativeContactChange(e.target.value)}
            className={`w-full max-w-xs lg:max-w-none px-2 py-1.5 lg:px-3 lg:py-2 border rounded-md focus:outline-none focus:ring-2 text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface text-sm lg:text-base neumorphic-light-inset dark:neumorphic-dark-inset ${
              errors.relative_contact
                ? "border-red-500 focus:ring-red-500"
                : "border-light-border dark:border-dark-border focus:ring-light-accent dark:focus:ring-dark-accent"
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
      <div className="border-t border-light-border dark:border-dark-border pt-4 mt-2">
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
          Profile Picture <span className="text-gray-400 text-xs font-normal">(optional — JPG, PNG)</span>
        </label>
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0">
            {currentMember.profile_picture_preview ? (
              <img
                src={currentMember.profile_picture_preview}
                alt="Preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-orange-200 shadow"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center border-2 border-dashed border-orange-300 dark:border-orange-500">
                <i className="fas fa-user text-orange-400 dark:text-orange-300 text-2xl"></i>
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
              className="block w-full text-sm text-light-text-secondary dark:text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-300 cursor-pointer"
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
