export interface Product {
  id: number;
  apiId?: string;
  name: string;
  price: number;
  salePrice?: number | null;
  offerPrice?: number | null;
  regularPrice?: number | null;
  originalPrice: number;
  discount: number;
  image: string;
  category: string;
  material?: string;
  description?: string;
  shortDesc?: string;
  [key: string]: any;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  message: string;
  avatar: string;
}

export interface AestheticBannerItem {
  id: number;
  title: string;
  image: string;
  color: string;
}

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

export interface UpcomingSlide {
  id: number;
  image: string;
  title: string;
  sub: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

// ── Auth & User Types ────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  companyName?: string;
  gstin?: string;
  isVerified?: boolean;
  mustChangePassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  phone: string;
  accountType?: 'B2C' | 'B2B';
  companyName?: string;
  gstin?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword?: string;
}

export type AuthModalView = 'login' | 'register' | 'otp' | 'forgot' | 'reset' | 'profile' | 'force-change-password';
