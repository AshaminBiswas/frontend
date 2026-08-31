import { fetchApi, API_BASE_URL } from './api';
import { ApiResponse } from '../types';

export interface ProformaInvoiceVerificationResult {
  isValid: boolean;
  tamperDetected: boolean;
  piNumber: string;
  financialYear: string;
  customerName: string;
  companyName: string;
  gstin: string;
  grandTotal: number;
  advanceAmount: number;
  balanceDue: number;
  advancePercentage: number;
  signedBy: string;
  signedAt: string;
  digitalSignature: string;
  verificationId: string;
  documentHash: string;
  verificationToken: string;
  status: string;
  issuedAt: string;
  validUntil: string;
  itemsCount: number;
  message: string;
}

export interface ProformaInvoiceDetail {
  id: string;
  piNumber: string;
  financialYear: string;
  status: string;
  customerName: string;
  companyName?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  gstin?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  placeOfSupply?: string | null;
  subtotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount?: number;
  shippingCost?: number;
  roundOff?: number;
  grandTotal: number;
  advancePercentage: number;
  advanceAmount: number;
  balanceDue: number;
  paymentTerms?: string | null;
  deliveryTimeline?: string | null;
  validUntil?: string | null;
  verificationToken: string;
  verificationId: string;
  documentHash: string;
  digitalSignature?: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  qrCodeDataUrl?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  bankDetails?: Record<string, any> | null;
  createdAt: string;
  items?: Array<{
    id: string;
    sku: string;
    productName: string;
    description?: string | null;
    hsnCode?: string | null;
    quantity: number;
    unit: string;
    unitRate: number;
    discountPercent?: number;
    taxableAmount: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    lineTotal: number;
  }>;
}

export interface ProformaFeedbackPayload {
  action: 'ACCEPT' | 'REQUEST_CHANGE' | 'QUERY' | 'PAYMENT_SUBMITTED';
  feedbackComments: string;
  advancePaymentRef?: string | null;
  paymentReceiptUrl?: string | null;
  contactPhone?: string | null;
  customerName?: string | null;
}

export const proformaInvoiceService = {
  /**
   * Public: Verify QR code scan token
   */
  verifyToken: async (token: string): Promise<ApiResponse<ProformaInvoiceVerificationResult>> => {
    return fetchApi<ProformaInvoiceVerificationResult>(`/proforma-invoices/verify/${encodeURIComponent(token)}`);
  },

  /**
   * Public: Get Proforma Invoice by access token
   */
  getByToken: async (token: string): Promise<ApiResponse<ProformaInvoiceDetail>> => {
    return fetchApi<ProformaInvoiceDetail>(`/proforma-invoices/public/${encodeURIComponent(token)}`);
  },

  /**
   * Public: Submit Customer Feedback / Commercial Acceptance / Advance Payment Reference
   */
  submitFeedback: async (
    token: string,
    payload: ProformaFeedbackPayload
  ): Promise<ApiResponse<ProformaInvoiceDetail>> => {
    return fetchApi<ProformaInvoiceDetail>(`/proforma-invoices/public/${encodeURIComponent(token)}/feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Public: Download Proforma Invoice PDF directly as a binary blob
   */
  downloadPdfByToken: async (token: string, piNumber?: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/proforma-invoices/public/${encodeURIComponent(token)}/pdf`);
    if (!res.ok) {
      throw new Error('Failed to download Proforma Invoice PDF from secure server.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (piNumber || 'Proforma-Invoice').replace(/[\/\\]/g, '-');
    a.download = `${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Public: Download Proforma Invoice PDF Direct URL
   */
  getPdfDownloadUrl: (token: string): string => {
    return `${API_BASE_URL}/proforma-invoices/public/${encodeURIComponent(token)}/pdf`;
  },
};
