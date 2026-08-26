import { ApiResponse } from "../types";

export const API_BASE_URL = 
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta.env.PROD 
    ? "https://prc-backend-6sw7.onrender.com/api/v1" 
    : "/api/v1");

const TOKEN_KEY = "prc_access_token";
const REFRESH_TOKEN_KEY = "prc_refresh_token";
const USER_KEY = "prc_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): any | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredTokens(accessToken: string, refreshToken: string, user?: any) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setStoredUser(user: any) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prc_auth_cleared"));
  }
}

export function isTokenExpired(token?: string | null): boolean {
  const t = token || getStoredToken();
  if (!t) return true;
  try {
    const parts = t.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      // Buffer by 15 seconds to refresh before actual expiration
      if (payload.exp && payload.exp * 1000 <= Date.now() + 15000) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

// ─── Proactive Token Refresh Mutex Lock ─────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

export async function getFreshToken(): Promise<string | null> {
  const token = getStoredToken();
  const refreshToken = getStoredRefreshToken();

  // Unauthenticated visitor
  if (!token) return null;

  // Token is still valid
  if (!isTokenExpired(token)) return token;

  // Expired with no refresh token
  if (!refreshToken) {
    clearStoredTokens();
    return null;
  }

  // Deduplicate concurrent callers — all concurrent callers await the same refresh promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (res.ok && data?.success && data?.data?.accessToken) {
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken || refreshToken;
        setStoredTokens(newAccess, newRefresh);
        return newAccess;
      } else {
        clearStoredTokens();
        return null;
      }
    } catch {
      clearStoredTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/refresh-token") ||
    endpoint.includes("/auth/verify-otp") ||
    endpoint.includes("/auth/forgot-password") ||
    endpoint.includes("/auth/reset-password");

  // Proactively ensure fresh access token before firing request
  let activeToken: string | null = null;
  if (!isAuthEndpoint) {
    activeToken = await getFreshToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  // Dynamic timeout controller (25s for auth cold starts, 20s for general requests)
  const timeoutMs = isAuthEndpoint ? 25000 : 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const data: ApiResponse<T> = await response.json();

    // Fallback if token was revoked server-side while in flight
    if (!response.ok && response.status === 401 && !isAuthEndpoint) {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        const newAccess = await getFreshToken();
        if (newAccess) {
          headers["Authorization"] = `Bearer ${newAccess}`;
          const retryCtrl = new AbortController();
          const retryTimeout = setTimeout(() => retryCtrl.abort(), 15000);
          try {
            const retryResponse = await fetch(url, { ...options, headers, signal: retryCtrl.signal });
            clearTimeout(retryTimeout);
            return await retryResponse.json();
          } catch {
            clearTimeout(retryTimeout);
            return { success: false, error: { code: "TIMEOUT", message: "Request timed out" } };
          }
        }
      }
    }

    // Format detailed validation errors if returned by server
    if (!response.ok && data.error?.details && Array.isArray(data.error.details)) {
      const detailMsgs = data.error.details
        .map((d: any) => (typeof d === "string" ? d : `${d.field ? `${d.field}: ` : ""}${d.message || d.code}`))
        .join(". ");
      data.error.message = `${data.error.message || "Validation Error"}: ${detailMsgs}`;
    }

    if (!response.ok && !data.error) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || `Request failed with status ${response.status}`,
        },
      };
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === "AbortError" || error.name === "TimeoutError";
    return {
      success: false,
      error: {
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? `PRC API connection timed out (${Math.round(timeoutMs / 1000)}s).`
          : error.message || "Failed to connect to PRC server. Please check your connection.",
      },
    };
  }
}
