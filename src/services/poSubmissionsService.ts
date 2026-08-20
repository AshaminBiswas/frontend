/**
 * poSubmissionsService.ts
 *
 * Customer API service for Dual-mode Purchase Order Intake.
 */

import { fetchApi, API_BASE_URL, getStoredToken } from './api';
import { ApiResponse } from '../types';

export type PoSourceType = 'FORM' | 'PDF_UPLOAD';

export type PoSubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'ACKNOWLEDGED'
  | 'FULFILLMENT';

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
  email?: string;
}

export interface PoLineItem {
  id?: string;
  slNo?: number;
  productId?: string | null;
  variantId?: string | null;
  description: string;
  sku?: string | null;
  unit?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  lineTotal?: number;
  source?: 'CUSTOMER_ENTERED' | 'ADMIN_MAPPED';
}

export interface PoAttachment {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface PoLog {
  id: string;
  action: string;
  fromStatus?: PoSubmissionStatus | null;
  toStatus?: PoSubmissionStatus | null;
  comment?: string | null;
  isInternal?: boolean;
  timestamp: string;
}

export interface PoAcknowledgement {
  id: string;
  ackNumber: string;
  issuedByName?: string | null;
  issuedAt: string;
}

export interface PoTrackingStage {
  stage: number;
  code: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ACTION_REQUIRED' | 'REJECTED';
  timestamp?: string;
  actor?: string;
  metadata?: Record<string, any>;
  artifacts?: {
    type: 'ORIGINAL_PDF' | 'ACKNOWLEDGEMENT_PDF' | 'PAYMENT_RECEIPT' | 'PACKING_LIST_PDF' | 'EWAY_BILL' | 'INVOICE_PDF';
    label: string;
    downloadUrl?: string;
    reference?: string;
  }[];
}

export interface PoTrackingData {
  submissionId: string;
  submissionNumber: string;
  customerPoNumber: string;
  sourceType: PoSourceType;
  currentStage: number;
  overallStatus: PoSubmissionStatus;
  b2bPurchaseOrderId?: string;
  masterPoNumber?: string;
  commercials: {
    statedTotal?: number;
    mappedTotal?: number;
    grandTotal: number;
    advancePercentage: number;
    advanceAmount: number;
    balanceAmount: number;
    currency: string;
  };
  stages: PoTrackingStage[];
}

export interface CustomerPoSubmission {
  id: string;
  submissionNumber: string;
  customerId: string;
  sourceType: PoSourceType;
  status: PoSubmissionStatus;
  customerPoNumber: string;
  customerPoDate?: string | null;
  statedTotal?: number | null;
  mappedTotal?: number | null;
  currency: string;
  expectedDeliveryDate?: string | null;
  rejectionReason?: string | null;
  changeRequestReason?: string | null;
  paymentTerms?: string | null;
  customerNote?: string | null;
  billToAddress?: PoAddress | null;
  shipToAddress?: PoAddress | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: PoLineItem[];
  attachments?: PoAttachment[];
  logs?: PoLog[];
  acknowledgement?: PoAcknowledgement | null;
  b2bPurchaseOrder?: {
    id: string;
    poNumber: string;
    status: string;
    advanceAmount?: number;
    balanceAmount?: number;
    receipts?: any[];
    packingList?: any;
    dispatch?: any;
    invoice?: any;
  } | null;
}

export interface CreateFormPoPayload {
  customerPoNumber: string;
  customerPoDate?: string;
  currency?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  customerNote?: string;
  billToAddress: PoAddress;
  shipToAddress: PoAddress;
  lineItems: Array<{
    description: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
}

export interface CreatePdfPoMetadata {
  customerPoNumber: string;
  customerPoDate?: string;
  statedTotal?: number;
  currency?: string;
  expectedDeliveryDate?: string;
  customerNote?: string;
}

export interface CreatePoResponse {
  submission: CustomerPoSubmission;
  duplicateWarning?: boolean;
  duplicateExistingSubmission?: { id: string; submissionNumber: string; status: string } | null;
}

export async function getNextSequentialPoNumberApi(): Promise<
  ApiResponse<{ poNumber: string; financialYear: string; sequenceNo: number }>
> {
  return await fetchApi<{ poNumber: string; financialYear: string; sequenceNo: number }>(
    '/po-submissions/next-po-number'
  );
}

export async function createFormPoSubmissionApi(
  payload: CreateFormPoPayload
): Promise<ApiResponse<CreatePoResponse>> {
  return await fetchApi<CreatePoResponse>('/po-submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPdfPoSubmissionApi(
  file: File,
  metadata: CreatePdfPoMetadata
): Promise<ApiResponse<CreatePoResponse>> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('customerPoNumber', metadata.customerPoNumber);
  if (metadata.customerPoDate) formData.append('customerPoDate', metadata.customerPoDate);
  if (metadata.statedTotal !== undefined && metadata.statedTotal !== null) {
    formData.append('statedTotal', String(metadata.statedTotal));
  }
  if (metadata.currency) formData.append('currency', metadata.currency);
  if (metadata.expectedDeliveryDate) formData.append('expectedDeliveryDate', metadata.expectedDeliveryDate);
  if (metadata.customerNote) formData.append('customerNote', metadata.customerNote);

  try {
    const response = await fetch(`${API_BASE_URL}/po-submissions/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err?.message || 'Network request failed' },
    };
  }
}

export async function getMyPoSubmissionsApi(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<CustomerPoSubmission[]>> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  return await fetchApi<CustomerPoSubmission[]>(`/po-submissions?${query.toString()}`);
}

export async function getPoSubmissionByIdApi(id: string): Promise<ApiResponse<CustomerPoSubmission>> {
  return await fetchApi<CustomerPoSubmission>(`/po-submissions/${id}`);
}

export async function getPoSubmissionTrackingApi(id: string): Promise<ApiResponse<PoTrackingData>> {
  return await fetchApi<PoTrackingData>(`/po-submissions/${id}/tracking`);
}

export async function downloadAcknowledgementApi(id: string, ackNumber: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/po-submissions/${id}/acknowledgement`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Failed to download Acknowledgement document');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PRC_Acknowledgement_${ackNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function deletePoSubmissionApi(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return await fetchApi<{ success: boolean }>(`/po-submissions/${id}`, {
    method: 'DELETE',
  });
}
