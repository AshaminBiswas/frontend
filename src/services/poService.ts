import { fetchApi, API_BASE_URL, getStoredToken } from './api';
import { ApiResponse } from '../types';

export interface PoAddress {
  attentionTo: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface CustomerPurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'VALIDATION_FAILED'
    | 'AWAITING_ADVANCE_PAYMENT'
    | 'PAYMENT_RECEIPT_SUBMITTED'
    | 'PAYMENT_ACKNOWLEDGED'
    | 'PAYMENT_VERIFIED'
    | 'PACKING_LIST_GENERATED'
    | 'PI_GENERATED'
    | 'TAX_INVOICE_GENERATED'
    | 'EWAY_BILL_GENERATED'
    | 'DISPATCHED'
    | 'ISSUE_LIST_GENERATED'
    | 'INVOICE_GENERATION_FAILED'
    | 'INVOICED'
    | 'REJECTED'
    | 'CANCELLED';
  customerPoReferenceNumber?: string | null;
  billingAddress: PoAddress;
  deliveryAddress: PoAddress;
  deliveryInstructions?: string | null;
  requestedDeliveryDate?: string | null;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  advancePercentage: number;
  advanceAmount: number;
  balanceAmount: number;
  submittedAt: string;
  validatedAt?: string | null;
  items: Array<{
    id: string;
    slNo: number;
    productId: string;
    productName: string;
    sku?: string | null;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
    taxAmount: number;
    total: number;
  }>;
  receipts?: Array<{
    id: string;
    status: 'PENDING_REVIEW' | 'REJECTED' | 'ACKNOWLEDGED' | 'VERIFIED';
    fileStorageKey: string;
    originalFileName: string;
    fileSizeBytes: number;
    mimeType: string;
    fileHash: string;
    version: number;
    amountReceived?: number | null;
    paymentDate?: string | null;
    paymentReference?: string | null;
    paymentMethod?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
    uploadedAt: string;
    verifiedAt?: string | null;
  }>;
  packingList?: {
    id: string;
    fileStorageKey: string;
    generatedAt: string;
    totalPackages: number;
    totalQuantity: number;
  } | null;
  proformaInvoice?: {
    id: string;
    piNumber: string;
    pdfStorageKeyOrUrl: string;
    grandTotal: number;
    advanceAmountRequired: number;
    balanceDue: number;
    generatedAt: string;
  } | null;
  ewayBill?: {
    id: string;
    ewayBillNumber: string;
    ewayBillDate: string;
    validFrom: string;
    validUntil?: string | null;
    vehicleNumber?: string | null;
    transporterName?: string | null;
    transporterDocNo?: string | null;
    approxDistanceKm?: number | null;
    pdfStorageKeyOrUrl?: string | null;
    status: string;
  } | null;
  issueList?: {
    id: string;
    issueNumber: string;
    issuedAt: string;
    issuedByName?: string | null;
    receivedByName?: string | null;
    carrierName?: string | null;
    vehicleNumber?: string | null;
    totalQuantity: number;
    totalValue: number;
    pdfStorageKeyOrUrl: string;
    notes?: string | null;
  } | null;
  dispatch?: {
    id: string;
    carrierName: string;
    trackingNumber?: string | null;
    dispatchedAt: string;
    dispatchNotes?: string | null;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    quotationNumber: string;
    poNumber: string;
    amountInvoiced: number;
    amountPaidAdvance: number;
    balanceDue: number;
    status: string;
    generatedAt: string;
  } | null;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscOrRoutingNumber: string;
    swiftCode?: string | null;
    branch?: string | null;
  };
  createdAt: string;
}

export interface CreatePoItemPayload {
  productId?: string;
  productName: string;
  sku?: string;
  variantId?: string;
  unit?: string;
  quantity: number;
  rate: number;
}

export interface CreatePoPayload {
  quotationId?: string;
  items?: CreatePoItemPayload[];
  advancePercentage?: number;
  customerPoReferenceNumber?: string;
  billingAddress: PoAddress;
  deliveryAddress?: PoAddress;
  sameAsBilling?: boolean;
  deliveryInstructions?: string;
  requestedDeliveryDate?: string;
  saveBillingAddress?: boolean;
  saveDeliveryAddress?: boolean;
  billingAddressLabel?: string;
  deliveryAddressLabel?: string;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function getEligibleQuotationsApi(): Promise<any[]> {
  const res = await fetchApi<any[]>('/purchase-orders/eligible-quotations');
  return res.success && res.data ? res.data : [];
}

export async function getQuotationForPoApi(quotationId: string): Promise<any> {
  const res = await fetchApi<any>(`/purchase-orders/quotation/${quotationId}`);
  if (!res.success) {
    throw new Error(res.error?.message || 'Failed to fetch quotation details');
  }
  return res.data;
}

export async function createPurchaseOrderApi(payload: CreatePoPayload): Promise<CustomerPurchaseOrder> {
  const res = await fetchApi<CustomerPurchaseOrder>('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to create Purchase Order');
  }
  return res.data;
}

export async function getCustomerPurchaseOrdersApi(params?: { status?: string; page?: number; limit?: number }): Promise<{ items: CustomerPurchaseOrder[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const res = await fetchApi<CustomerPurchaseOrder[]>(`/purchase-orders${qs ? `?${qs}` : ''}`);
  return {
    items: res.data || [],
    total: (res as any).pagination?.totalItems || (res.data ? res.data.length : 0),
  };
}

export async function getCustomerPurchaseOrderByIdApi(id: string): Promise<CustomerPurchaseOrder> {
  const res = await fetchApi<CustomerPurchaseOrder>(`/purchase-orders/${id}`);
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to fetch Purchase Order details');
  }
  return res.data;
}

export async function uploadPaymentReceiptApi(poId: string, file: File): Promise<any> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/payment-receipt`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const json: ApiResponse<any> = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to upload payment receipt');
  }
  return json.data;
}

export async function downloadPoPdf(poId: string, poNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/download`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Purchase Order PDF not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PRC_PurchaseOrder_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadPackingListPdf(poId: string, poNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/packing-list`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Packing list not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PackingList_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function getPoInvoiceApi(poId: string): Promise<any> {
  const res = await fetchApi<any>(`/purchase-orders/${poId}/invoice`);
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to fetch Invoice details');
  }
  return res.data;
}

export async function downloadPoInvoicePdf(poId: string, invoiceNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/invoice/download`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Invoice PDF not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TaxInvoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function getSavedAddressesApi(): Promise<any[]> {
  const res = await fetchApi<any[]>('/purchase-orders/addresses/all');
  return res.success && res.data ? res.data : [];
}

export async function saveAddressApi(address: PoAddress & { label?: string; isDefaultBilling?: boolean; isDefaultDelivery?: boolean }): Promise<any> {
  const res = await fetchApi('/purchase-orders/addresses/save', {
    method: 'POST',
    body: JSON.stringify(address),
  });
  return res.data;
}

export async function downloadPaymentReceiptFile(poId: string, poNumber: string, inline = false): Promise<void> {
  const token = getStoredToken();
  const endpoint = inline
    ? `${API_BASE_URL}/purchase-orders/${poId}/payment-receipt/view`
    : `${API_BASE_URL}/purchase-orders/${poId}/payment-receipt/download`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Payment receipt not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  if (inline) {
    window.open(url, '_blank');
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaymentReceipt_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export async function deletePurchaseOrderApi(poId: string): Promise<any> {
  const res = await fetchApi<any>(`/purchase-orders/${poId}`, {
    method: 'DELETE',
  });
  if (!res.success) {
    throw new Error(res.error?.message || 'Failed to delete Purchase Order');
  }
  return res.data;
}

export async function downloadCustomerProformaInvoicePdf(poId: string, piNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/proforma-invoice/download`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Proforma Invoice PDF not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ProformaInvoice_${piNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadCustomerEwayBillPdf(poId: string, ewbNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/eway-bill/download`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'E-Way Bill PDF not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EWayBill_${ewbNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadCustomerProductIssueListPdf(poId: string, issueNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/issue-list/download`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Product Issue List PDF not available for download');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ProductIssueSlip_${issueNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


