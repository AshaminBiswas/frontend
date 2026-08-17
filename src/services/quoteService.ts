import { fetchApi } from "./api";
import { ApiResponse } from "../types";

export interface QuoteItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  requestedPrice?: number;
}

export interface CreateQuotePayload {
  items: QuoteItemPayload[];
  notes?: string;
}

export interface QuoteItemDetail {
  id: string;
  quoteId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  requestedPrice: number | null;
  offeredPrice: number | null;
  total: number | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug?: string;
    sku?: string;
    price?: number;
    thumbnail?: string;
  };
  variant?: {
    id: string;
    name?: string;
    sku?: string;
    price?: number;
    attributes?: any;
  };
}

export interface QuoteDetail {
  id: string;
  quoteNumber: string;
  userId: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED" | "EXPIRED";
  subtotal: number | null;
  discountTotal: number | null;
  taxTotal: number | null;
  grandTotal: number | null;
  notes?: string | null;
  adminNotes?: string | null;
  validUntil?: string | null;
  convertedOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
  };
  items: QuoteItemDetail[];
}

export const quoteService = {
  async listMyQuotes(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Promise<ApiResponse<QuoteDetail[]>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/quotes?${queryString}` : "/quotes";
    return fetchApi<QuoteDetail[]>(endpoint);
  },

  async getQuoteById(id: string): Promise<ApiResponse<QuoteDetail>> {
    return fetchApi<QuoteDetail>(`/quotes/${id}`);
  },

  async createQuote(payload: CreateQuotePayload): Promise<ApiResponse<QuoteDetail>> {
    return fetchApi<QuoteDetail>("/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateQuote(id: string, payload: CreateQuotePayload): Promise<ApiResponse<QuoteDetail>> {
    return fetchApi<QuoteDetail>(`/quotes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
