let patched = false;

export function ensureCredentials() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const originalFetch = window.fetch.bind(window);
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "";

  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : input && input.url;
      const sameApi =
        (apiBase && url && url.startsWith(apiBase)) ||
        (url && url.includes("/api/"));
      if (sameApi) {
        init = { credentials: "include", ...(init || {}) };
      }
    } catch (e) {
      /* fall through with unmodified args */
    }
    return originalFetch(input, init);
  };
}

// Install immediately on import so the patch exists before any
// component fires its first request.
ensureCredentials();
