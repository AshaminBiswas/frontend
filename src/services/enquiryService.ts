import { fetchApi } from './api';

export interface CreateEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  productId?: string;
}

export const enquiryService = {
  create: (payload: CreateEnquiryPayload) =>
    fetchApi('/enquiries', { method: 'POST', body: JSON.stringify(payload) }),
};
