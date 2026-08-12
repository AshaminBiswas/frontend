import React, { useState, useEffect } from "react";
import { X, Lock, Mail, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Info, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AuthModal() {
  const {
    authModalOpen,
    authModalView,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    pendingEmail,
    user,
    logout,
  } = useAuth();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2c");

  // Reset form errors on view change
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, [authModalView]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Prevent background scrolling when auth modal is active
  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [authModalOpen]);

  if (!authModalOpen) return null;
  // Profile view is handled by UserProfilePage at App level
  if (authModalView === "profile") return null;

  // Handler: Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const res = await login({ email: email.trim(), password });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || "Invalid login credentials.");
    }
  };

  // Handler: Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    if (!phone.trim()) {
      setErrorMsg("Phone number is mandatory for account creation.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (accountType === "b2b" && gstin.trim() && gstin.trim().length !== 15) {
      setErrorMsg("GSTIN number must be exactly 15 characters long.");
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      email: email.trim(),
      password,
      confirmPassword: confirmPassword || password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      companyName: companyName.trim() ? companyName.trim() : undefined,
      gstin: gstin.trim() ? gstin.trim() : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || "Account registered successfully! Enter 6-digit OTP.");
      setResendCooldown(60);
    } else {
      setErrorMsg(res.message || "Registration failed. Please check your entries.");
    }
  };

  // Handler: OTP Input Change & Auto Submit
  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (newOtp.every((d) => d !== "") && val) {
      const fullOtp = newOtp.join("");
      triggerOtpVerification(fullOtp);
    }
  };

  const triggerOtpVerification = async (fullOtp: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    const res = await verifyOtp(fullOtp);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || "Invalid OTP code. Please enter the correct code.");
      setOtp(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("otp-input-0");
      firstInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    setSuccessMsg("");
    const res = await resendOtp();
    if (res.success) {
      setSuccessMsg(res.message || "Verification OTP resent to your email.");
      setResendCooldown(60);
    } else {
      setErrorMsg(res.message || "Failed to resend OTP.");
    }
  };

  // Handler: Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || "Reset token generated! Check your email.");
    } else {
      setErrorMsg(res.message || "Email address not found.");
    }
  };

  // Handler: Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !password.trim()) {
      setErrorMsg("Please enter the reset token and your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword({ token: resetToken.trim(), password });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || "Password reset successfully! Log in now.");
    } else {
      setErrorMsg(res.message || "Failed to reset password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34150F]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#2a0e08] border border-[#EACEAA]/20 rounded-tr-3xl rounded-bl-3xl shadow-2xl overflow-hidden p-6 md:p-8 animate-in zoom-in-95 duration-200 text-[#EACEAA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-[#EACEAA]/60 hover:text-[#D39858] transition-colors p-1.5 rounded-full hover:bg-[#EACEAA]/10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-tr-2xl rounded-bl-2xl bg-[#D39858]/20 text-[#D39858] mb-3 border border-[#D39858]/30">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-2xl font-bold text-[#EACEAA]" style={{ fontFamily: "'Gilda Display', serif" }}>
            {authModalView === "login" && "Welcome Back to PRC"}
            {authModalView === "register" && "Create PRC Account"}
            {authModalView === "otp" && "Verify Email OTP"}
            {authModalView === "forgot" && "Reset Password"}
            {authModalView === "reset" && "Set New Password"}
            {authModalView === "profile" && "Account Profile"}
          </h3>
          <p className="text-xs text-[#EACEAA]/60 mt-1">
            {authModalView === "login" && "Access your account, track orders & exclusive pricing"}
            {authModalView === "register" && "Register for B2C shopping or B2B hardware wholesale pricing"}
            {authModalView === "otp" && `Enter 6-digit OTP code sent to ${pendingEmail || "your email"}`}
            {authModalView === "forgot" && "We'll send a password reset code to your email"}
            {authModalView === "reset" && "Enter token and create your new secure password"}
            {authModalView === "profile" && "Manage your PRC account details & orders"}
          </p>
        </div>

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-tr-xl rounded-bl-xl bg-red-900/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-tr-xl rounded-bl-xl bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── VIEW 1: LOGIN ── */}
        {authModalView === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => openAuthModal("forgot", email)}
                  className="text-xs text-[#D39858] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 pl-10 pr-10 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EACEAA]/50 hover:text-[#D39858]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D39858] text-[#34150F] font-bold py-3 px-4 rounded-tr-2xl rounded-bl-2xl hover:bg-[#EACEAA] transition-all duration-300 shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-[#EACEAA]/10 text-center text-xs text-[#EACEAA]/70">
              Don't have a PRC account yet?{" "}
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="text-[#D39858] font-bold hover:underline"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ── VIEW 2: REGISTER (MANDATORY PHONE & OTP TRIGGER) ── */}
        {authModalView === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-hide">
            {/* B2C vs B2B Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EACEAA]/10 rounded-tr-xl rounded-bl-xl mb-2">
              <button
                type="button"
                onClick={() => setAccountType("b2c")}
                className={`py-1.5 text-xs font-bold rounded-tr-lg rounded-bl-lg transition-all ${
                  accountType === "b2c" ? "bg-[#D39858] text-[#34150F]" : "text-[#EACEAA]/70 hover:text-[#EACEAA]"
                }`}
              >
                Personal (B2C)
              </button>
              <button
                type="button"
                onClick={() => setAccountType("b2b")}
                className={`py-1.5 text-xs font-bold rounded-tr-lg rounded-bl-lg transition-all ${
                  accountType === "b2b" ? "bg-[#D39858] text-[#34150F]" : "text-[#EACEAA]/70 hover:text-[#EACEAA]"
                }`}
              >
                Business (B2B / GST)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Phone Number (Mandatory) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 pl-9 pr-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D39858]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  required
                />
              </div>
            </div>

            {/* B2B Fields */}
            {accountType === "b2b" && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Hardware Pvt Ltd"
                    className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                    GSTIN Number (15 Digits)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D39858] text-[#34150F] font-bold py-2.5 px-4 rounded-tr-2xl rounded-bl-2xl hover:bg-[#EACEAA] transition-all duration-300 shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-3"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Creating Account...</span>
              ) : (
                <>
                  <span>Create Account & Verify OTP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-[#EACEAA]/10 text-center text-xs text-[#EACEAA]/70">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="text-[#D39858] font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── VIEW 3: OTP VERIFICATION ── */}
        {authModalView === "otp" && (
          <div className="space-y-4">
            <div className="p-3 bg-[#D39858]/15 border border-[#D39858]/30 rounded-tr-xl rounded-bl-xl text-xs text-[#EACEAA] flex items-start gap-2">
              <Info size={16} className="text-[#D39858] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#D39858]">Email OTP Verification</p>
                <p className="text-[11px] text-[#EACEAA]/80 mt-0.5">
                  Enter 6-digit OTP code sent to <strong>{pendingEmail}</strong>. (Check Inbox & Spam folder).
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-input-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                  className="w-11 h-12 text-center text-xl font-bold bg-[#EACEAA]/15 text-[#EACEAA] border border-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl focus:outline-none focus:border-[#D39858]"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => triggerOtpVerification(otp.join(""))}
              disabled={isSubmitting || otp.some((d) => d === "")}
              className="w-full bg-[#D39858] text-[#34150F] font-bold py-3 px-4 rounded-tr-2xl rounded-bl-2xl hover:bg-[#EACEAA] transition-all duration-300 shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP Code & Sign In"}
            </button>

            <div className="text-center text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#D39858] hover:underline font-semibold disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP Code"}
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 4: FORGOT PASSWORD ── */}
        {authModalView === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Your Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 pl-4 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D39858] text-[#34150F] font-bold py-3 px-4 rounded-tr-2xl rounded-bl-2xl hover:bg-[#EACEAA] transition-all duration-300 shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Password Reset Link"}
            </button>

            <div className="text-center text-xs pt-2">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="text-[#EACEAA]/70 hover:text-[#D39858]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── VIEW 5: RESET PASSWORD ── */}
        {authModalView === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Reset Token / Code *
              </label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="raw-reset-token-string"
                className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="NewPassword123!"
                className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D39858] mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="NewPassword123!"
                className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D39858] text-[#34150F] font-bold py-3 px-4 rounded-tr-2xl rounded-bl-2xl hover:bg-[#EACEAA] transition-all duration-300 shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Resetting..." : "Reset Password & Login"}
            </button>
          </form>
        )}

        {/* ── VIEW 6: USER PROFILE ── */}
        {authModalView === "profile" && user && (
          <div className="space-y-4">
            <div className="p-4 bg-[#EACEAA]/10 border border-[#EACEAA]/15 rounded-tr-2xl rounded-bl-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#EACEAA]">
                  {user.firstName || "Customer"} {user.lastName || ""}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D39858] text-[#34150F] px-2 py-0.5 rounded-full">
                  {user.role || "Customer"}
                </span>
              </div>
              <p className="text-xs text-[#EACEAA]/70">{user.email}</p>
              {user.phone && <p className="text-xs text-[#D39858]">Phone: {user.phone}</p>}
              {user.companyName && (
                <p className="text-xs text-[#EACEAA]/80">
                  Company: <span className="font-semibold">{user.companyName}</span>
                </p>
              )}
              {user.gstin && (
                <p className="text-xs text-[#EACEAA]/80">
                  GSTIN: <span className="font-mono text-[#D39858]">{user.gstin}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full bg-red-800/80 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-tr-xl rounded-bl-xl transition-all duration-200 text-sm shadow-md"
            >
              Sign Out of Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
