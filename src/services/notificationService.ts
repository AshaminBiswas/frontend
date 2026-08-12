import { fetchApi } from './api';

export interface Notification {
  id: string;
  type: 'ORDER' | 'PROMO' | 'GENERAL' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return fetchApi<{ notifications: Notification[]; total: number; unreadCount: number }>(`/notifications?${qs}`);
  },
  markRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => fetchApi('/notifications/read-all', { method: 'PATCH' }),
};
