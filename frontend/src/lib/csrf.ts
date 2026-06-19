export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function createSecureFetch(baseUrl: string) {
  return async (endpoint: string, options: RequestInit = {}) => {
    const csrfToken = getCsrfToken();
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    } as Record<string, string>;

    if (csrfToken) {
      headers["x-xsrf-token"] = csrfToken;
    }

    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };
}