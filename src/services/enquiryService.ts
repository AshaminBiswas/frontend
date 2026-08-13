import { fetchApi } from './api';

export interface CreateEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  subject?: string;
  message: string;
}

export interface EnquiryRecord {
  id: string;
  trackingId?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  subject?: string;
  message: string;
  status: 'OPEN' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNotes?: string;
  notes?: string;
  createdAt?: string;
}

export const enquiryService = {
  // Create / Submit Enquiry (POST /enquiries)
  create: (payload: CreateEnquiryPayload) =>
    fetchApi<EnquiryRecord>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // List Enquiries for Admin (GET /enquiries)
  getEnquiries: (page = 1, limit = 20) =>
    fetchApi(`/enquiries?page=${page}&limit=${limit}`, { method: 'GET' }),

  // Track Enquiry by Ticket Reference / ID or Email (GET /enquiries/track/:id)
  trackEnquiry: (id: string) =>
    fetchApi<EnquiryRecord>(`/enquiries/track/${encodeURIComponent(id)}`, { method: 'GET' }),
};

