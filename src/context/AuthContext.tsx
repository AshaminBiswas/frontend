import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthModalView, RegisterPayload, LoginPayload, VerifyOtpPayload, ResetPasswordPayload } from "../types";
import { authService } from "../services/authService";
import { setStoredTokens, clearStoredTokens, getStoredToken, getStoredUser, setStoredUser } from "../services/api";
import { invalidateB2BPricingCache } from "../services/b2bPricingService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalView: AuthModalView;
  pendingEmail: string;
  pendingPassword?: string;
  openAuthModal: (view?: AuthModalView, email?: string) => void;
  closeAuthModal: () => void;
  login: (payload: LoginPayload) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; requiresVerification?: boolean; message?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOtp: () => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user state from persistent local storage
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>("login");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");

  // Check and restore session on page reload
  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();
      const savedUser = getStoredUser();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Keep saved user session active immediately
      if (savedUser) {
        setUser(savedUser);
        if (savedUser.mustChangePassword) {
          setPendingEmail(savedUser.email);
          setAuthModalView("force-change-password");
          setAuthModalOpen(true);
        }
      }

      // Background profile sync
      try {
        const res = await authService.getProfile();
        if (res.success && res.data) {
          setUser(res.data);
          setStoredUser(res.data);
          if (res.data.mustChangePassword) {
            setPendingEmail(res.data.email);
            setAuthModalView("force-change-password");
            setAuthModalOpen(true);
          }
        } else if (res.error?.code === "HTTP_401") {
          clearStoredTokens();
          setUser(null);
        }
      } catch {
        // Keep persistent local session unless explicitly 401
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const openAuthModal = useCallback((view: AuthModalView = "login", email: string = "") => {
    setAuthModalView(view);
    if (email) setPendingEmail(email);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    // If mandatory password change is pending, prevent dismissal
    if (user?.mustChangePassword && authModalView === "force-change-password") {
      return;
    }
    setAuthModalOpen(false);
  }, [user, authModalView]);

  // 1. Login
  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (res.success && res.data) {
      setStoredTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
      setPendingEmail(res.data.user.email);
      setPendingPassword(payload.password);

      if (res.data.user.mustChangePassword) {
        setAuthModalView("force-change-password");
        setAuthModalOpen(true);
        return {
          success: true,
          message: "Welcome! Please set a permanent password for your B2B account to continue.",
        };
      }

      setAuthModalOpen(false);
      return { success: true, message: res.message || "Logged in successfully!" };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Invalid credentials. Please try again.",
    };
  };

  // 2. Register
  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    if (res.success) {
      setPendingEmail(payload.email);
      setPendingPassword(payload.password);
      setAuthModalView("otp");
      return {
        success: true,
        requiresVerification: true,
        message: res.message || "Registration successful! Please enter the 6-digit OTP code sent to your email.",
      };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Registration failed. Please check inputs.",
    };
  };

  // 3. Verify OTP
  const verifyOtp = async (otp: string) => {
    if (!pendingEmail) {
      return { success: false, message: "Email is missing for OTP verification." };
    }

    const res = await authService.verifyOtp({ email: pendingEmail, otp });
    if (!res.success) {
      return {
        success: false,
        message: res.error?.message || res.message || "Invalid or expired OTP code. Please enter the correct code.",
      };
    }

    // OTP Verified — Save session
    if (res.data?.accessToken) {
      setStoredTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
      setAuthModalOpen(false);
      return { success: true, message: res.message || "Email verified! You are now logged in." };
    }

    if (pendingPassword) {
      const loginRes = await authService.login({ email: pendingEmail, password: pendingPassword });
      if (loginRes.success && loginRes.data) {
        setStoredTokens(loginRes.data.accessToken, loginRes.data.refreshToken, loginRes.data.user);
        setUser(loginRes.data.user);
        setAuthModalOpen(false);
        return { success: true, message: "Email verified! You are now logged in." };
      }
    }

    setAuthModalView("login");
    return { success: true, message: "Email verified successfully! Please sign in." };
  };

  // 4. Resend OTP
  const resendOtp = async () => {
    if (!pendingEmail) {
      return { success: false, message: "Email is required to resend OTP." };
    }
    const res = await authService.resendVerification(pendingEmail);
    if (res.success) {
      return { success: true, message: res.message || "Verification OTP resent to your email." };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Failed to resend OTP.",
    };
  };

  // 5. Forgot Password
  const forgotPassword = async (email: string) => {
    const res = await authService.forgotPassword({ email });
    if (res.success) {
      setPendingEmail(email);
      setAuthModalView("reset");
      return { success: true, message: res.message || "Password reset token sent to your email." };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Email not found or request failed.",
    };
  };

  // 6. Reset Password
  const resetPassword = async (payload: ResetPasswordPayload) => {
    const res = await authService.resetPassword(payload);
    if (res.success) {
      setAuthModalView("login");
      return { success: true, message: res.message || "Password reset successfully! Please login." };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Failed to reset password. Invalid or expired token.",
    };
  };

  // 7. Change Password (For forced reset or settings)
  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    const res = await authService.changePassword(currentPassword, newPassword, confirmPassword || newPassword);
    if (res.success) {
      if (user) {
        const updated = { ...user, mustChangePassword: false };
        setUser(updated);
        setStoredUser(updated);
      }
      setAuthModalOpen(false);
      return { success: true, message: "Password updated successfully! Welcome to your wholesale portal." };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Failed to update password. Current temporary password may be incorrect.",
    };
  };

  // 8. Logout
  const logout = async () => {
    if (user?.id) {
      invalidateB2BPricingCache(user.id);
    }
    await authService.logout();
    clearStoredTokens();
    setUser(null);
    setAuthModalOpen(false);
  };

  // 9. Update User Profile
  const updateUser = async (data: Partial<User>) => {
    const res = await authService.updateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
      setStoredUser(res.data);
      return { success: true, message: "Profile updated successfully!" };
    }
    return {
      success: false,
      message: res.error?.message || res.message || "Failed to update profile.",
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authModalOpen,
        authModalView,
        pendingEmail,
        pendingPassword,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        changePassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
