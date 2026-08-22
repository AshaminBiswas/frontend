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
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/refresh-token");

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

    // Token expired (401) — attempt refresh token logic once if refresh token exists
    if (!response.ok && response.status === 401 && endpoint !== "/auth/refresh-token" && endpoint !== "/auth/login") {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed.success && refreshed.data?.accessToken) {
          setStoredTokens(refreshed.data.accessToken, refreshed.data.refreshToken || refreshToken);
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${refreshed.data.accessToken}`;
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
        } else {
          clearStoredTokens();
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

async function refreshAccessToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}
