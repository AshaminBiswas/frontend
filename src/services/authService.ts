import { fetchApi, clearStoredTokens, getStoredRefreshToken } from "./api";
import {
  User,
  ApiResponse,
  RegisterPayload,
  LoginPayload,
  VerifyOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "../types";

export interface LoginResultData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
  user: User;
}

export interface VerifyOtpResultData {
  verified: boolean;
  autoLogin: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  // 1. User Registration
  async register(payload: RegisterPayload): Promise<ApiResponse<{ userId: string; email: string; requiresVerification: boolean }>> {
    return fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 2. User Login
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResultData>> {
    return fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 3. Verify OTP
  async verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResultData>> {
    return fetchApi("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 4. Resend Verification OTP
  async resendVerification(email: string): Promise<ApiResponse> {
    return fetchApi("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // 5. Forgot Password
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse> {
    return fetchApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 6. Reset Password
  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
    return fetchApi("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 7. Get Current User Profile (/auth/me)
  async getProfile(): Promise<ApiResponse<User>> {
    return fetchApi("/auth/me", {
      method: "GET",
    });
  },

  // 8. Logout
  async logout(): Promise<ApiResponse> {
    const refreshToken = getStoredRefreshToken();
    const res = await fetchApi("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: refreshToken || "" }),
    });
    clearStoredTokens();
    return res;
  },

  // 9. Update User Profile (/users/profile)
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return fetchApi("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
