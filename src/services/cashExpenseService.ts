import { fetchApi } from './api';
import type { ExpenseEntry, ExpenseCategory, ExpenseDailyLedger } from '../types';

export const cashExpenseService = {
  /**
   * Get live running cash-in-hand balance for a branch
   */
  async getLiveBalance(branchId: string) {
    return fetchApi<{
      currentBalance: number;
      currentBalanceRupees: number;
      todayOpening: number;
      todayReceived: number;
      todayExpenses: number;
      todayClosing: number;
      isReconciled: boolean;
      pendingApprovalsCount: number;
    }>(`/expenses/live-balance/${branchId}`);
  },

  /**
   * Get expenses list with filters
   */
  async getExpenses(params: Record<string, any> = {}) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        sp.set(k, String(v));
      }
    });
    return fetchApi<{
      entries: ExpenseEntry[];
      nextCursor: string | null;
      hasMore: boolean;
      totalCount: number;
    }>(`/expenses?${sp.toString()}`);
  },

  /**
   * Log an expense
   */
  async createExpense(data: {
    amount: number;
    amountInPaise?: boolean;
    categoryId: string;
    description: string;
    paidTo: string;
    paidBy?: string | null;
    branchId: string;
    paymentMode?: 'CASH' | 'UPI' | 'BANK_TRANSFER';
    receiptAttachment?: string | null;
  }) {
    return fetchApi<{ expense: ExpenseEntry; budgetWarning?: string | null }>(`/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get categories
   */
  async getCategories() {
    return fetchApi<ExpenseCategory[]>(`/expenses/categories`);
  },

  /**
   * Get daily closing ledger
   */
  async getDailyLedger(branchId: string, date: string) {
    return fetchApi<ExpenseDailyLedger>(`/expenses/ledger/daily?branchId=${branchId}&date=${date}`);
  },
};
