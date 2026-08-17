import { fetchApi, API_BASE_URL } from './api';
import { ApiResponse, Product } from '../types';

export interface QuoteItemPayload {
  productId: string;
  variantId?: string | null;
  productNameSnapshot?: string;
  unit?: string;
  quantity: number;
  rate?: number;
}

export interface CreateB2BQuotePayload {
  projectName: string;
  firstName: string;
  lastName: string;
  companyName: string;
  gstNo: string;
  email: string;
  phone: string;
  notes?: string | null;
  termsAccepted: boolean;
  items: QuoteItemPayload[];
}

export interface QuotationItemDetail {
  id: string;
  quoteId: string;
  slNo: number;
  productId: string;
  productNameSnapshot: string;
  variantId?: string | null;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  product?: {
    id: string;
    name: string;
    slug?: string;
    sku?: string;
    price: number;
    salePrice?: number | null;
    thumbnail?: string;
  };
}

export interface QuotationDetail {
  id: string;
  quoteNumber: string;
  referenceNo: string;
  financialYear: string;
  sequenceNo: number;
  projectName: string;
  firstName: string;
  lastName: string;
  companyName: string;
  gstNo: string;
  email: string;
  phone: string;
  userId?: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'EXPIRED';
  statusReason?: string | null;
  basicPrice: number;
  gstAmount: number;
  shippingCost?: number | null;
  grandTotal: number;
  notes?: string | null;
  adminNotes?: string | null;
  termsAccepted: boolean;
  customerResponse: 'pending' | 'accepted' | 'declined';
  customerResponseNotes?: string | null;
  customerResponseAt?: string | null;
  accessToken?: string;
  digitalSignature?: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  qrCodeData?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuotationItemDetail[];
  activityLogs?: Array<{
    id: string;
    changeType: string;
    note?: string | null;
    createdAt: string;
    adminUser?: { firstName?: string; lastName?: string; email?: string };
  }>;
}

export interface TrackedQuotationSummary {
  id: string;
  referenceNo: string;
  financialYear?: string;
  projectName: string;
  companyName: string;
  clientName: string;
  emailMasked: string;
  phoneMasked: string;
  gstNo: string;
  status: string;
  statusReason?: string | null;
  basicPrice: number;
  gstAmount: number;
  shippingCost?: number | null;
  grandTotal: number;
  customerResponse: string;
  hasDigitalSignature: boolean;
  accessToken?: string;
  itemCount: number;
  items: QuotationItemDetail[];
  createdAt: string;
  updatedAt: string;
  activityTimeline: Array<{
    changeType: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export interface VerificationResult {
  isValid: boolean;
  tamperDetected: boolean;
  referenceNo: string;
  companyName: string;
  gstNo: string;
  projectName: string;
  grandTotal: number;
  signedBy: string;
  signedAt: string;
  digitalSignature: string;
  message: string;
}

export const quotationService = {
  /**
   * Submit B2B RFQ Quotation
   */
  async submitQuote(payload: CreateB2BQuotePayload): Promise<ApiResponse<QuotationDetail>> {
    return fetchApi<QuotationDetail>('/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Universal Tracking: Search by Reference No, Email, GSTIN, or Phone
   */
  async trackQuotes(query: string): Promise<ApiResponse<TrackedQuotationSummary[]>> {
    const encoded = encodeURIComponent(query.trim());
    return fetchApi<TrackedQuotationSummary[]>(`/quotes/track?query=${encoded}`);
  },

  /**
   * Customer View by Secure Access Token
   */
  async getQuoteByToken(token: string): Promise<ApiResponse<QuotationDetail>> {
    return fetchApi<QuotationDetail>(`/quotes/public/${token}`);
  },

  /**
   * Customer Respond (Accept / Decline)
   */
  async respondToQuote(
    token: string,
    response: 'accepted' | 'declined',
    notes?: string
  ): Promise<ApiResponse<QuotationDetail>> {
    return fetchApi<QuotationDetail>(`/quotes/public/${token}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, notes }),
    });
  },

  /**
   * Cryptographic Signature & QR Verification
   */
  async verifySignature(referenceNo: string, digitalSignature?: string): Promise<ApiResponse<VerificationResult>> {
    return fetchApi<VerificationResult>('/quotes/verify-signature', {
      method: 'POST',
      body: JSON.stringify({ referenceNo, digitalSignature }),
    });
  },

  /**
   * Live product search filtered by category
   */
  async searchLiveProducts(search = '', categorySlug = ''): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categorySlug) params.append('category', categorySlug);
      params.append('limit', '50');

      const res = await fetchApi<{ items: Product[] } | Product[]>(`/products?${params.toString()}`);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray((res.data as any).items)) return (res.data as any).items;
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Download official Quotation PDF via access token
   */
  async downloadQuotePdfByToken(token: string, referenceNo = 'quote'): Promise<void> {
    const url = `${API_BASE_URL}/quotes/public/${token}/pdf`;
    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Failed to download PDF (HTTP ${response.status})`;
      try {
        const json = JSON.parse(errText);
        if (json?.message) msg = json.message;
      } catch {}
      throw new Error(msg);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const safeRef = String(referenceNo).replace(/[\/\\]/g, '-');
    a.download = `Quotation-${safeRef}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },
};
