// Centralized data store for managing data flow between local and district pages
class DataStore {
  constructor() {
    // Check if we're in the browser environment
    this.isClient = typeof window !== "undefined";

    this.attendanceRecords = this.loadFromStorage("attendanceRecords") || [];
    this.membersData = this.loadFromStorage("membersData") || [];
    this.analyticsData = this.loadFromStorage("analyticsData") || {};
    this.leaderboardData = this.loadFromStorage("leaderboardData") || {};

    // Initialize with some mock data if no data exists
    if (this.membersData.length === 0) {
      this.initializeMockData();
    }
  }

  // Initialize with mock data for demonstration
  initializeMockData() {
    this.membersData = [];
    this.saveToStorage("membersData", this.membersData);
  }

  // Storage utilities
  loadFromStorage(key) {
    if (!this.isClient) {
      return null;
    }

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
      return null;
    }
  }

  saveToStorage(key, data) {
    if (!this.isClient) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }

  // Attendance Records Management
  async addAttendanceRecord(record) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/log/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: record.date,
            male_count: record.male,
            female_count: record.female,
            congregation: record.congregation,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Also add to local storage for immediate UI updates
        const newRecord = {
          id: data.attendance_id,
          timestamp: new Date().toISOString(),
          ...record,
        };
        this.attendanceRecords.push(newRecord);
        this.saveToStorage("attendanceRecords", this.attendanceRecords);
        this.updateAnalytics();
        this.updateLeaderboard();
        return newRecord;
      } else {
        throw new Error(data.error || "Failed to log attendance");
      }
    } catch (error) {
      console.error("Error logging attendance:", error);
      throw error;
    }
  }

  async getAttendanceRecords(filters = {}) {
    try {
      // Try to get from API first
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/records/`;
      const params = new URLSearchParams();

      if (filters.congregation) {
        params.append("congregation", filters.congregation);
      }
      if (filters.date_from) {
        params.append("date_from", filters.date_from);
      }
      if (filters.date_to) {
        params.append("date_to", filters.date_to);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `Attendance records API request failed with status ${response.status}, using local data`
        );
        return this.getLocalAttendanceRecords(filters);
      }

      const data = await response.json();

      if (data.success && data.records && Array.isArray(data.records)) {
        // Update local storage with API data
        this.attendanceRecords = data.records.map((record) => ({
          id: record.id,
          date: record.date,
          male: record.male_count,
          female: record.female_count,
          total: record.total_count,
          congregation: record.congregation,
          timestamp: record.created_at || new Date().toISOString(),
        }));
        this.saveToStorage("attendanceRecords", this.attendanceRecords);
        return this.attendanceRecords;
      } else {
        // Fallback to local storage
        console.warn(
          "API returned invalid data, using local data:",
          data.error
        );
        return this.getLocalAttendanceRecords(filters);
      }
    } catch (error) {
      console.warn(
        "Error fetching attendance records from API, using local data:",
        error.message
      );
      // Fallback to local storage
      return this.getLocalAttendanceRecords(filters);
    }
  }

  getLocalAttendanceRecords(filters = {}) {
    let records = [...this.attendanceRecords];

    if (filters.congregation) {
      records = records.filter((r) => r.congregation === filters.congregation);
    }

    if (filters.date) {
      records = records.filter((r) => r.date === filters.date);
    }

    if (filters.week) {
      records = records.filter((r) => r.week === filters.week);
    }

    if (filters.month) {
      records = records.filter((r) => r.month === filters.month);
    }

    if (filters.year) {
      records = records.filter((r) => r.year === filters.year);
    }

    return records;
  }

  // Members Data Management
  async addMember(member) {
    try {
      const requestData = {
        first_name: member.name.split(" ")[0],
        last_name: member.name.split(" ").slice(1).join(" ") || "",
        phone_number: member.phone_number || member.phone,
        email: member.email || "",
        gender: member.gender,
        congregation: member.congregation,
        membership_status:
          member.membership_status || member.status || "Active",
        is_executive: member.is_executive || false,
        executive_position: member.is_executive
          ? member.executive_position || member.position || ""
          : "",
        executive_level: member.is_executive
          ? member.executive_level || "local"
          : "",
        local_executive_position: member.is_executive
          ? member.local_executive_position || ""
          : "",
        district_executive_position: member.is_executive
          ? member.district_executive_position || ""
          : "",
        date_of_birth: member.date_of_birth || "1990-01-01",
        place_of_residence: member.place_of_residence || "Accra",
        residential_address:
          member.residential_address || "123 Main Street, Accra",
        hometown: member.hometown || "Accra",
        relative_contact: member.relative_contact || "Not provided",
        is_baptized:
          member.is_baptized !== undefined ? member.is_baptized : true,
        is_confirmed:
          member.is_confirmed !== undefined ? member.is_confirmed : true,
        is_communicant:
          member.is_communicant !== undefined ? member.is_communicant : true,
      };

      // Enforce unique positions before API call
      const existingMembers = await this.getMembers();
      const isLocalPositionTaken = !!existingMembers.find(
        (m) =>
          (m.congregation === member.congregation ||
            m.congregation?.name === member.congregation) &&
          (m.executive_position || m.local_executive_position || "")
            .toString()
            .trim()
            .toLowerCase() ===
            (member.executive_position || "").toString().trim().toLowerCase()
      );
      if (
        member.is_executive &&
        member.executive_position &&
        isLocalPositionTaken
      ) {
        throw new Error(
          `Position already assigned in ${member.congregation}. Choose another.`
        );
      }

      const isDistrictPositionTaken = !!existingMembers.find(
        (m) =>
          (m.district_executive_position || "")
            .toString()
            .trim()
            .toLowerCase() ===
          (member.district_executive_position || "")
            .toString()
            .trim()
            .toLowerCase()
      );
      if (
        member.is_executive &&
        member.district_executive_position &&
        isDistrictPositionTaken
      ) {
        throw new Error(`District position already assigned. Choose another.`);
      }

      let fetchOptions;
      if (member.profile_picture instanceof File) {
        const formData = new FormData();
        Object.entries(requestData).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, v);
        });
        formData.append("profile_picture", member.profile_picture);
        fetchOptions = { method: "POST", body: formData };
      } else {
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        };
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/add/`,
        fetchOptions
      );

      const data = await response.json();

      if (data.success) {
        // Also add to local storage for immediate UI updates
        const newMember = {
          id: data.member_id,
          timestamp: new Date().toISOString(),
          ...member,
        };
        this.membersData.push(newMember);
        this.saveToStorage("membersData", this.membersData);
        this.updateAnalytics();
        return newMember;
      } else {
        // API Error occurred - normalize error message
        const errorMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.errors === "string"
              ? data.errors
              : data?.errors
                ? JSON.stringify(data.errors)
                : "Failed to add member";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(
        "Error adding member via API, falling back to local storage:",
        error
      );

      // If the error is due to duplicate position, rethrow so UI can notify
      if (
        typeof error?.message === "string" &&
        (error.message.includes("Position already assigned") ||
          error.message.includes("District position already assigned"))
      ) {
        throw error;
      }

      // Fallback to local storage if API fails
      const newMember = {
        id: Date.now(), // Generate a temporary ID
        timestamp: new Date().toISOString(),
        ...member,
      };
      this.membersData.push(newMember);
      this.saveToStorage("membersData", this.membersData);
      this.updateAnalytics();
      return newMember;
    }
  }

  async getMembers(filters = {}) {
    try {
      // Try to get from API first
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/`;
      const params = new URLSearchParams();

      // API expects congregation_id, so we need to convert congregation name to ID
      if (filters.congregation) {
        // If congregation is a number (ID), use it directly
        if (!isNaN(filters.congregation)) {
          params.append("congregation", filters.congregation);
        } else {
          // If congregation is a name, we need to get the ID first
          // For now, get all members and filter on frontend
          console.warn("Congregation name provided, filtering on frontend");
        }
      }

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `API request failed with status ${response.status}, falling back to local data`
        );
        return this.getLocalMembers(filters);
      }

      const data = await response.json();

      if (data.members && Array.isArray(data.members)) {
        // Update local storage with API data
        let members = data.members.map((member) => ({
          id: member.id,
          name:
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            "Unknown",
          first_name: member.first_name || "",
          last_name: member.last_name || "",
          phone: member.phone_number || "",
          phone_number: member.phone_number || "",
          email: member.email || "",
          gender: member.gender || "Male",
          congregation: member.congregation,
          status: member.membership_status || "Active",
          membership_status: member.membership_status || "Active",
          date_of_birth: member.date_of_birth || "",
          place_of_residence: member.place_of_residence || "",
          residential_address: member.residential_address || "",
          hometown: member.hometown || "",
          relative_contact: member.relative_contact || "",
          profession: member.profession || "",
          position: member.position || "",
          is_executive: member.is_executive === true,
          executive_position: member.executive_position || "",
          executive_level: member.executive_level || "",
          local_executive_position: member.local_executive_position || "",
          district_executive_position: member.district_executive_position || "",
          // Map boolean fields to string fields for frontend compatibility
          baptism: member.is_baptized === true ? "Yes" : "No",
          confirmation: member.is_confirmed === true ? "Yes" : "No",
          communicant: member.is_communicant === true ? "Yes" : "No",
          confirmant: member.is_confirmed === true ? "Yes" : "No", // Alternative name
          // Keep boolean fields for backend compatibility
          is_baptized: member.is_baptized,
          is_confirmed: member.is_confirmed,
          is_communicant: member.is_communicant,
          member_id: member.member_id || "",
          profile_picture: member.profile_picture || null,
          timestamp: new Date().toISOString(),
        }));

        // Filter by congregation name on the frontend (only if congregation name was provided, not ID)
        if (filters.congregation && isNaN(filters.congregation)) {
          members = members.filter(
            (m) => m.congregation === filters.congregation
          );
        }

        this.membersData = members;
        this.saveToStorage("membersData", this.membersData);
        return this.membersData;
      } else {
        // Fallback to local storage
        console.warn("API returned invalid data, using local data");
        return this.getLocalMembers(filters);
      }
    } catch (error) {
      console.warn(
        "Error fetching members from API, using local data:",
        error.message
      );
      // Fallback to local storage
      return this.getLocalMembers(filters);
    }
  }

  getLocalMembers(filters = {}) {
    let members = [...this.membersData];

    if (filters.congregation) {
      // If congregation is a number (ID), we can't filter by name in local data
      // This should only happen when API fails and we fall back to local data
      if (isNaN(filters.congregation)) {
        members = members.filter(
          (m) => m.congregation === filters.congregation
        );
      }
    }

    if (filters.gender) {
      members = members.filter((m) => m.gender === filters.gender);
    }

    if (filters.isExecutive !== undefined) {
      members = members.filter((m) => m.is_executive === filters.isExecutive);
    }

    return members;
  }

  // Update member data
  async updateMember(memberId, updatedData) {
    try {
      // Preserve existing values for fields not being edited
      const existingMember =
        this.membersData.find((m) => m.id === memberId) || {};

      const isExecutive =
        updatedData.is_executive !== undefined
          ? updatedData.is_executive
          : existingMember.is_executive === true;

      // Prepare data for API
      const requestData = {
        first_name:
          updatedData.first_name ??
          existingMember.first_name ??
          updatedData.name?.split(" ")[0] ??
          "",
        last_name:
          updatedData.last_name ??
          existingMember.last_name ??
          updatedData.name?.split(" ").slice(1).join(" ") ??
          "",
        phone_number:
          updatedData.phone_number ??
          existingMember.phone_number ??
          updatedData.phone ??
          "",
        email: updatedData.email ?? existingMember.email ?? "",
        gender: updatedData.gender ?? existingMember.gender ?? "Male",
        congregation:
          updatedData.congregation ?? existingMember.congregation ?? "",
        membership_status:
          updatedData.membership_status ??
          existingMember.membership_status ??
          updatedData.status ??
          "Active",
        is_executive: isExecutive,
        executive_position: isExecutive
          ? (updatedData.executive_position ??
            updatedData.position ??
            existingMember.executive_position ??
            "")
          : "",
        executive_level: isExecutive
          ? (updatedData.executive_level ??
            existingMember.executive_level ??
            "local")
          : "",
        local_executive_position: isExecutive
          ? (updatedData.local_executive_position ??
            existingMember.local_executive_position ??
            "")
          : "",
        district_executive_position: isExecutive
          ? (updatedData.district_executive_position ??
            existingMember.district_executive_position ??
            "")
          : "",
        date_of_birth:
          updatedData.date_of_birth ??
          existingMember.date_of_birth ??
          updatedData.dateOfBirth ??
          "1990-01-01",
        place_of_residence:
          updatedData.place_of_residence ??
          existingMember.place_of_residence ??
          updatedData.residence ??
          "Accra",
        residential_address:
          updatedData.residential_address ??
          existingMember.residential_address ??
          updatedData.residentialAddress ??
          "123 Main Street, Accra",
        hometown: updatedData.hometown ?? existingMember.hometown ?? "Accra",
        relative_contact:
          updatedData.relative_contact ??
          existingMember.relative_contact ??
          updatedData.emergencyPhone ??
          "Not provided",
        is_baptized:
          updatedData.is_baptized !== undefined
            ? updatedData.is_baptized
            : updatedData.baptism !== undefined
              ? updatedData.baptism === "Yes"
              : (existingMember.is_baptized ?? false),
        is_confirmed:
          updatedData.is_confirmed !== undefined
            ? updatedData.is_confirmed
            : updatedData.confirmation !== undefined
              ? updatedData.confirmation === "Yes"
              : (existingMember.is_confirmed ?? false),
        is_communicant:
          updatedData.is_communicant !== undefined
            ? updatedData.is_communicant
            : updatedData.communicant !== undefined
              ? updatedData.communicant === "Yes"
              : (existingMember.is_communicant ?? false),
      };

      // Enforce unique executive positions before API call
      try {
        const existingMembers = await this.getMembers();

        // Check local position uniqueness within the same congregation
        const normalizedRequestedLocalPosition = (
          requestData.executive_position ||
          requestData.local_executive_position ||
          ""
        )
          .toString()
          .trim()
          .toLowerCase();

        const isLocalPositionTaken =
          isExecutive &&
          normalizedRequestedLocalPosition !== "" &&
          !!existingMembers.find(
            (m) =>
              m.id !== memberId &&
              (m.congregation === requestData.congregation ||
                m.congregation?.name === requestData.congregation) &&
              (m.executive_position || m.local_executive_position || "")
                .toString()
                .trim()
                .toLowerCase() === normalizedRequestedLocalPosition
          );

        if (isLocalPositionTaken) {
          throw new Error(
            `Position already assigned in ${requestData.congregation}. Choose another.`
          );
        }

        // Check district position uniqueness across district
        const normalizedRequestedDistrictPosition = (
          requestData.district_executive_position || ""
        )
          .toString()
          .trim()
          .toLowerCase();

        const isDistrictPositionTaken =
          isExecutive &&
          normalizedRequestedDistrictPosition !== "" &&
          !!existingMembers.find(
            (m) =>
              m.id !== memberId &&
              (m.district_executive_position || "")
                .toString()
                .trim()
                .toLowerCase() === normalizedRequestedDistrictPosition
          );

        if (isDistrictPositionTaken) {
          throw new Error(
            `District position already assigned. Choose another.`
          );
        }
      } catch (precheckError) {
        // Surface pre-validation errors to UI
        throw precheckError;
      }

      let fetchOptions;
      if (updatedData.profile_picture instanceof File) {
        const formData = new FormData();
        Object.entries(requestData).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, v);
        });
        formData.append("profile_picture", updatedData.profile_picture);
        fetchOptions = { method: "POST", body: formData };
      } else {
        fetchOptions = {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        };
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/update/${memberId}/`,
        fetchOptions
      );

      const data = await response.json();

      if (data.success) {
        // Update local storage
        const memberIndex = this.membersData.findIndex(
          (m) => m.id === memberId
        );
        if (memberIndex !== -1) {
          this.membersData[memberIndex] = {
            ...this.membersData[memberIndex],
            ...updatedData,
            name: `${requestData.first_name} ${requestData.last_name}`.trim(),
            phone: requestData.phone_number,
            timestamp: new Date().toISOString(),
          };
          this.saveToStorage("membersData", this.membersData);
          this.updateAnalytics();
        }
        return this.membersData[memberIndex];
      } else {
        const errorMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.errors === "string"
              ? data.errors
              : data?.errors
                ? JSON.stringify(data.errors)
                : "Failed to update member";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating member via API:", error);
      // Do not update local storage on failure; surface the error to the UI
      throw error;
    }
  }

  async deleteMember(memberId) {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
      const response = await fetch(`${base}/api/members/${memberId}/delete/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete member");
      this.membersData = this.membersData.filter((m) => m.id !== memberId);
      this.saveToStorage("membersData", this.membersData);
      this.updateAnalytics();
      return true;
    } catch (e) {
      // Local fallback
      this.membersData = this.membersData.filter((m) => m.id !== memberId);
      this.saveToStorage("membersData", this.membersData);
      this.updateAnalytics();
      return true;
    }
  }

  // Analytics Data Management
  updateAnalytics() {
    const analytics = {
      sundayAttendance: this.calculateAttendanceAnalytics(),
      membersDatabase: this.calculateMembersAnalytics(),
      leaderboard: this.calculateLeaderboardData(),
    };

    this.analyticsData = analytics;
    this.saveToStorage("analyticsData", this.analyticsData);
  }

  updateLeaderboard() {
    // Update leaderboard data when attendance records change
    // This could trigger re-computation of leaderboard rankings
    console.log("Leaderboard updated");
  }

  calculateAttendanceAnalytics() {
    const records = this.attendanceRecords;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Filter current year records
    const yearRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getFullYear() === currentYear;
    });

    // Calculate totals
    const totalAttendance = yearRecords.reduce(
      (sum, r) => sum + (r.total || 0),
      0
    );
    const totalMale = yearRecords.reduce((sum, r) => sum + (r.male || 0), 0);
    const totalFemale = yearRecords.reduce(
      (sum, r) => sum + (r.female || 0),
      0
    );

    // Group by congregation
    const congregations = {};
    yearRecords.forEach((record) => {
      if (!congregations[record.congregation]) {
        congregations[record.congregation] = {
          total: 0,
          male: 0,
          female: 0,
          records: [],
        };
      }
      congregations[record.congregation].total += record.total || 0;
      congregations[record.congregation].male += record.male || 0;
      congregations[record.congregation].female += record.female || 0;
      congregations[record.congregation].records.push(record);
    });

    // Weekly trends
    const weeklyTrend = yearRecords
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-8) // Last 8 weeks
      .map((record) => ({
        date: record.date,
        male: record.male || 0,
        female: record.female || 0,
        total: record.total || 0,
        congregation: record.congregation,
      }));

    // Monthly trends
    const monthlyTrend = [];
    for (let month = 0; month < 12; month++) {
      const monthRecords = yearRecords.filter((r) => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === month;
      });

      const monthTotal = monthRecords.reduce(
        (sum, r) => sum + (r.total || 0),
        0
      );
      const monthMale = monthRecords.reduce((sum, r) => sum + (r.male || 0), 0);
      const monthFemale = monthRecords.reduce(
        (sum, r) => sum + (r.female || 0),
        0
      );

      monthlyTrend.push({
        month: new Date(currentYear, month).toLocaleString("default", {
          month: "short",
        }),
        male: monthMale,
        female: monthFemale,
        total: monthTotal,
      });
    }

    return {
      totalAttendance,
      averageAttendance:
        yearRecords.length > 0 ? totalAttendance / yearRecords.length : 0,
      congregationsCount: Object.keys(congregations).length,
      growth: this.calculateGrowth(yearRecords),
      weeklyTrend,
      monthlyTrend,
      yearlyTrend: [
        {
          year: currentYear.toString(),
          male: totalMale,
          female: totalFemale,
          total: totalAttendance,
        },
      ],
    };
  }

  calculateMembersAnalytics() {
    const members = this.membersData;

    // Group by congregation
    const congregations = {};
    members.forEach((member) => {
      if (!congregations[member.congregation]) {
        congregations[member.congregation] = {
          count: 0,
          male: 0,
          female: 0,
          executives: 0,
        };
      }
      congregations[member.congregation].count++;
      if (member.gender === "Male") congregations[member.congregation].male++;
      if (member.gender === "Female")
        congregations[member.congregation].female++;
      if (member.is_executive) congregations[member.congregation].executives++;
    });

    // Gender distribution
    const genderDistribution = [];
    Object.keys(congregations).forEach((congregation) => {
      genderDistribution.push({
        congregation,
        male: congregations[congregation].male,
        female: congregations[congregation].female,
      });
    });

    return {
      totalMembers: members.length,
      congregations: Object.keys(congregations).map((name) => ({
        name,
        count: congregations[name].count,
        color: this.getCongregationColor(name),
      })),
      genderDistribution,
    };
  }

  calculateLeaderboardData() {
    const records = this.attendanceRecords;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentWeek = this.getWeekOfMonth(currentDate);

    // Weekly leaderboard
    const weeklyRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      const recordWeek = this.getWeekOfMonth(recordDate);
      return (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() === currentMonth &&
        recordWeek === currentWeek
      );
    });

    // Monthly leaderboard
    const monthlyRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() === currentMonth
      );
    });

    // Group by congregation and calculate totals
    const weeklyLeaderboard = this.calculateLeaderboard(weeklyRecords);
    const monthlyLeaderboard = this.calculateLeaderboard(monthlyRecords);

    return {
      weekly: weeklyLeaderboard,
      monthly: monthlyLeaderboard,
    };
  }

  calculateLeaderboard(records) {
    const congregations = {};

    records.forEach((record) => {
      if (!congregations[record.congregation]) {
        congregations[record.congregation] = {
          male_count: 0,
          female_count: 0,
          total_count: 0,
        };
      }
      congregations[record.congregation].male_count += record.male || 0;
      congregations[record.congregation].female_count += record.female || 0;
      congregations[record.congregation].total_count += record.total || 0;
    });

    // Sort by total count and add ranks
    return Object.keys(congregations)
      .map((congregation) => ({
        congregation,
        ...congregations[congregation],
      }))
      .sort((a, b) => b.total_count - a.total_count)
      .slice(0, 3)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }

  calculateGrowth(records) {
    if (records.length < 2) return 0;

    const sortedRecords = records.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const recent = sortedRecords.slice(-1)[0];
    const previous = sortedRecords.slice(-2)[0];

    if (!recent || !previous) return 0;

    const recentTotal = recent.total || 0;
    const previousTotal = previous.total || 0;

    if (previousTotal === 0) return 0;

    return ((recentTotal - previousTotal) / previousTotal) * 100;
  }

  getWeekOfMonth(date) {
    const d = new Date(date);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    return Math.ceil((d.getDate() + firstDay.getDay()) / 7);
  }

  getCongregationColor(congregationName) {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#F97316",
      "#EC4899",
    ];
    const index = congregationName.length % colors.length;
    return colors[index];
  }

  // Get analytics data
  getAnalyticsData() {
    return this.analyticsData;
  }

  // Get leaderboard data
  getLeaderboardData(type = "weekly") {
    return this.analyticsData.leaderboard?.[type] || [];
  }

  // Fetch real data from API for home page
  async fetchHomeStats() {
    if (!this.isClient) {
      return null;
    }

    try {
      // Use the Django backend URL directly
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/";
      const response = await fetch(`${base}/api/home-stats/`);

      if (!response.ok) {
        console.warn(
          `Home stats API request failed with status ${response.status}`
        );
        return null;
      }

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        console.warn("Home stats API returned invalid data");
        return null;
      }
    } catch (error) {
      console.warn("Error fetching home stats from API:", error.message);
      return null;
    }
  }

  // Clear all data (for testing)
  clearAllData() {
    this.attendanceRecords = [];
    this.membersData = [];
    this.analyticsData = {};
    this.leaderboardData = {};
    localStorage.clear();
  }
}

// Create singleton instance with lazy initialization
let dataStoreInstance = null;

const getDataStore = () => {
  if (typeof window === "undefined") {
    // Return a mock instance for SSR
    return {
      attendanceRecords: [],
      membersData: [],
      analyticsData: {},
      leaderboardData: {},
      getMembers: () => [],
      getAttendanceRecords: () => [],
      getAnalyticsData: () => ({}),
      getLeaderboardData: () => ({}),
      addAttendanceRecord: () => {},
      addMember: () => {},
      updateMember: async () => {},
      deleteMember: () => {},
      updateAnalytics: () => {},
      clearAllData: () => {},
    };
  }

  if (!dataStoreInstance) {
    dataStoreInstance = new DataStore();
  }

  return dataStoreInstance;
};

// Export a function that returns the dataStore instance
export default getDataStore;
