// Auto logout utility with inactivity detection
class AutoLogout {
  constructor() {
    this.timeout = null;
    this.warningTimeout = null;
    this.lastActivity = Date.now();
    this.isLoggedIn = false;
    this.warningShown = false;

    // 10 minutes in milliseconds
    this.LOGOUT_TIME = 10 * 60 * 1000;
    // 1 minute warning before logout
    this.WARNING_TIME = 9 * 60 * 1000;

    this.init();
  }

  init() {
    // Check if user is logged in
    this.checkLoginStatus();

    // Set up activity listeners
    this.setupActivityListeners();

    // Start the timer
    this.startTimer();
  }

  checkLoginStatus() {
    // Check if user is logged in by looking for user data
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      const congregationId = localStorage.getItem("congregationId");
      this.isLoggedIn = !!(user && congregationId);
    } else {
      this.isLoggedIn = false;
    }
  }

  setupActivityListeners() {
    if (typeof window === "undefined") return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(
        event,
        () => {
          this.resetTimer();
        },
        true
      );
    });

    // Also listen for visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.resetTimer();
      }
    });
  }

  resetTimer() {
    if (!this.isLoggedIn) return;

    this.lastActivity = Date.now();
    this.warningShown = false;

    // Clear existing timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    // Start new timer
    this.startTimer();
  }

  startTimer() {
    if (!this.isLoggedIn) return;

    // Set warning timeout (9 minutes)
    this.warningTimeout = setTimeout(() => {
      this.showWarning();
    }, this.WARNING_TIME);

    // Set logout timeout (10 minutes)
    this.timeout = setTimeout(() => {
      this.logout();
    }, this.LOGOUT_TIME);
  }

  showWarning() {
    if (!this.isLoggedIn || this.warningShown) return;

    this.warningShown = true;

    // Show toast warning
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(
        "You will be logged out in 1 minute due to inactivity. Click anywhere or press any key to stay logged in.",
        "warning",
        60000 // Show for 1 minute
      );
    }

    // Add visual indicator
    this.addWarningIndicator();
  }

  addWarningIndicator() {
    // Create warning overlay
    const warningDiv = document.createElement("div");
    warningDiv.id = "auto-logout-warning";
    warningDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 193, 7, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      ">
        <div style="
          background: #ffc107;
          color: #000;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 400px;
          margin: 20px;
        ">
          <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
          <h3 style="margin: 0 0 10px 0; font-weight: bold;">Session Timeout Warning</h3>
          <p style="margin: 0; font-size: 14px;">You will be logged out in 1 minute due to inactivity.</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; font-weight: bold;">Click anywhere or press any key to stay logged in.</p>
        </div>
      </div>
    `;

    document.body.appendChild(warningDiv);

    // Remove warning when user interacts
    const removeWarning = () => {
      const warning = document.getElementById("auto-logout-warning");
      if (warning) {
        warning.remove();
      }
      this.warningShown = false;
      this.resetTimer();
    };

    // Add event listeners to remove warning
    document.addEventListener("click", removeWarning, { once: true });
    document.addEventListener("keydown", removeWarning, { once: true });
  }

  logout() {
    // Clear all timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    // Remove warning indicator if present
    if (typeof window !== "undefined") {
      const warning = document.getElementById("auto-logout-warning");
      if (warning) {
        warning.remove();
      }

      // Clear auth data
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("welcomeShown");
    }

    // Show logout toast
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(
        "You have been logged out due to inactivity.",
        "info",
        3000
      );
    }

    // Redirect to home page
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }

  // Method to manually logout (for logout buttons)
  manualLogout() {
    // Clear all timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    // Remove warning indicator if present
    if (typeof window !== "undefined") {
      const warning = document.getElementById("auto-logout-warning");
      if (warning) {
        warning.remove();
      }

      // Clear auth data
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("welcomeShown");
    }

    // Show logout toast
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(
        "You have been logged out successfully.",
        "success",
        3000
      );
    }

    // Redirect to home page
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }

  // Method to update login status
  updateLoginStatus(isLoggedIn) {
    this.isLoggedIn = isLoggedIn;
    if (isLoggedIn) {
      this.resetTimer();
    } else {
      // Clear timeouts if not logged in
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      if (this.warningTimeout) {
        clearTimeout(this.warningTimeout);
      }
    }
  }

  // Method to destroy the instance
  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    if (typeof window !== "undefined") {
      const warning = document.getElementById("auto-logout-warning");
      if (warning) {
        warning.remove();
      }
    }
  }
}

// Create singleton instance
const autoLogout = new AutoLogout();

export default autoLogout;
