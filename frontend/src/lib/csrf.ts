export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function createSecureFetch(baseUrl: string) {
  const csrfToken = getCsrfToken();

  return async (endpoint: string, options: RequestInit = {}) => {
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