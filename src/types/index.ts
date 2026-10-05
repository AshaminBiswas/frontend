export interface Material {
  id: string;
  name: string;
  slug: string;
  shortName?: string | null;
  gradeBadge?: string | null;
  description?: string | null;
  tagline?: string | null;
  specs?: string[];
  isActive: boolean;
  position: number;
  productCount?: number;
}

export interface Product {
  id: number;
  apiId?: string;
  slug?: string;
  sku?: string;
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
  materialId?: string | null;
  materialObj?: Material | null;
  frequentlyPairedIds?: string[];
  frequentlyPairedProducts?: Product[];
  description?: string;
  shortDesc?: string;
  finish?: 'SS' | 'NA' | 'NYLON' | string | null;
  colour?: string | null;
  colours?: string[];
  dimensions?: {
    height?: number;
    width?: number;
    length?: number;
    unit?: string;
  } | null;
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
  email?: string;
  gstin?: string;
  identifier?: string;
}

export interface VerifyResetOtpPayload {
  identifier: string;
  otp: string;
}

export interface ResetPasswordPayload {
  token?: string;
  identifier?: string;
  otp?: string;
  password: string;
  confirmPassword?: string;
}

export type AuthModalView = 'login' | 'register' | 'otp' | 'forgot' | 'reset' | 'profile' | 'force-change-password';

// ─── Daily Cash Expense Tracker Types ─────────────────────────────────────────

export type ExpensePaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  monthlyBudgetLimit?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseEntry {
  id: string;
  entryNumber: string;
  date: string;
  time: string;
  amount: number;
  categoryId: string;
  subCategory?: string | null;
  paymentMode: ExpensePaymentMode;
  description: string;
  paidTo: string;
  paidBy?: string | null;
  receiptAttachment?: string | null;
  branchId: string;
  departmentId?: string | null;
  employeeId?: string | null;
  status: ExpenseStatus;
  isVoid: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
}

export interface ExpenseDailyLedger {
  id: string;
  branchId: string;
  date: string;
  openingBalance: number;
  cashReceived: number;
  totalExpenses: number;
  closingBalance: number;
  physicalCashCounted?: number | null;
  variance?: number | null;
  isReconciled: boolean;
  reconciledAt?: string | null;
}

export * from './b2bOrder';
