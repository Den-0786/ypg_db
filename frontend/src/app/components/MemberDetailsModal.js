"use client";

import { useState } from "react";

export default function MemberDetailsModal({
  showDetailsModal,
  setShowDetailsModal,
  selectedMember,
  handleEditMember,
  getInitials,
  getInitialsColor,
}) {
  if (!showDetailsModal || !selectedMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-6 border-b border-gray-200 dark:border-gray-700 relative">
          <div className="flex flex-col items-center mb-4">
            {selectedMember.profile_picture ? (
              <img
                src={
                  selectedMember.profile_picture.startsWith("http")
                    ? selectedMember.profile_picture
                    : `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${selectedMember.profile_picture}`
                }
                alt={selectedMember.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg mb-3"
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 ${getInitialsColor(selectedMember.name)} rounded-full flex items-center justify-center mb-3 shadow-lg`}
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {getInitials(selectedMember.name)}
                </span>
              </div>
            )}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
              {selectedMember.name}
            </h3>
            {selectedMember.member_id && (
              <span className="inline-flex px-3 py-1 mt-1 text-xs font-mono font-semibold rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-600">
                {selectedMember.member_id}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Personal & Contact Information */}
            <div className="bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-orange-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-user text-orange-500 dark:text-orange-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          First Name:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.name.split(" ")[0]}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Last Name:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.name.split(" ").slice(1).join(" ")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Date of Birth:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.dateOfBirth}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Gender:
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedMember.gender === "Male"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                          }`}
                        >
                          {selectedMember.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-phone text-green-600 dark:text-green-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Contact Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Phone Number:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Email Address:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.emailAddress}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Relative Contact:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.emergencyContact}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Relative Phone:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.emergencyPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Professional Information */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Address Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-map-marker-alt text-purple-600 dark:text-purple-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Address Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Hometown:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.hometown}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Place of Residence:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.residence}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Residential Address:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.residentialAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-briefcase text-orange-600 dark:text-orange-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Professional Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Profession:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.occupation}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Education:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.education}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Church & Religious Information */}
            <div className="bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-900/20 dark:to-orange-900/20 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Church Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-church text-indigo-600 dark:text-indigo-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Church Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Congregation:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          Emmanuel Congregation Ahinsan
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Position:
                        </label>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedMember.position}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Membership Status:
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedMember.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedMember.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Religious Information */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <i className="fas fa-cross text-red-600 dark:text-red-400 text-sm sm:text-base"></i>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Religious Information
                    </h4>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Confirmation:
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedMember.confirmant === "Yes"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedMember.confirmant}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Baptism:
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedMember.baptism === "Yes"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedMember.baptism}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          Communicant:
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedMember.communicant === "Yes"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedMember.communicant}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 mt-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-tools text-gray-600 dark:text-gray-400 text-sm sm:text-base"></i>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h4>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleEditMember(selectedMember)}
                  className="flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Member
                </button>

                <button
                  onClick={() =>
                    window.open(`tel:${selectedMember.phoneNumber}`, "_blank")
                  }
                  className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Call Member
                </button>

                <button
                  onClick={() =>
                    window.open(`sms:${selectedMember.phoneNumber}`, "_blank")
                  }
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm sm:flex-1"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
