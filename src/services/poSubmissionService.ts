import { API_BASE_URL, getStoredToken } from './api';

export interface CustomerPoItem {
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  targetRate: number;
  totalPrice: number;
  specifications?: string;
}

export interface CustomerPoSubmissionPayload {
  source: 'QUOTATION' | 'PO_FORM' | 'CUSTOM_PDF_UPLOAD';
  customerName: string;
  companyName?: string;
  customerEmail: string;
  customerPhone?: string;
  customerPoNumber?: string;
  quoteId?: string;
  quoteNumber?: string;
  subject?: string;
  notes?: string;
  billingAddress?: string;
  shippingAddress?: string;
  gstin?: string;
  deliveryTimeline?: string;
  paymentTerms?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lineItems?: CustomerPoItem[];
  files?: File[];
}

export interface PoSubmissionResponse {
  success: boolean;
  message: string;
  poSubmissionId: string;
  id: string;
  po?: any;
}

export const poSubmissionService = {
  /**
   * Submit Purchase Order to Backend (supports Quotation-linked, Custom Form, Direct File Upload)
   */
  async submitCustomerPo(payload: CustomerPoSubmissionPayload): Promise<PoSubmissionResponse> {
    const formData = new FormData();

    formData.append('source', payload.source);
    formData.append('customerName', payload.customerName);
    formData.append('customerEmail', payload.customerEmail);

    if (payload.companyName) formData.append('companyName', payload.companyName);
    if (payload.customerPhone) formData.append('customerPhone', payload.customerPhone);
    if (payload.customerPoNumber) formData.append('customerPoNumber', payload.customerPoNumber);
    if (payload.quoteId) formData.append('quoteId', payload.quoteId);
    if (payload.quoteNumber) formData.append('quoteNumber', payload.quoteNumber);
    if (payload.subject) formData.append('subject', payload.subject);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.billingAddress) formData.append('billingAddress', payload.billingAddress);
    if (payload.shippingAddress) formData.append('shippingAddress', payload.shippingAddress);
    if (payload.gstin) formData.append('gstin', payload.gstin);
    if (payload.deliveryTimeline) formData.append('deliveryTimeline', payload.deliveryTimeline);
    if (payload.paymentTerms) formData.append('paymentTerms', payload.paymentTerms);
    if (payload.priority) formData.append('priority', payload.priority);

    if (payload.lineItems && payload.lineItems.length > 0) {
      formData.append('lineItems', JSON.stringify(payload.lineItems));
    }

    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const headers: Record<string, string> = {};
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/po-management/customer-submit`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to submit Purchase Order');
    }

    return {
      success: true,
      message: data.message || 'Purchase Order submitted successfully!',
      poSubmissionId: data.data?.poSubmissionId || data.poSubmissionId,
      id: data.data?.id || data.id,
      po: data.data?.po || data.po,
    };
  },
};
