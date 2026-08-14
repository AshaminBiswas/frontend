import { fetchApi } from './api';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  desktopImage?: string;
  tabletImage?: string;
  mobileImage?: string;
  image: string;
  linkUrl?: string | null;
  link?: string | null;
  ctaText?: string;
  position: string;
  order?: number;
  displayOrder?: number;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  badgeText?: string;
  desktopImage?: string;
  tabletImage?: string;
  mobileImage?: string;
  image?: string;
  linkUrl?: string;
  link?: string;
  ctaText?: string;
  position?: string;
  order?: number;
  isActive?: boolean;
}

export const bannerService = {
  getPublicBanners: async (position?: string): Promise<Banner[]> => {
    try {
      const qs = position ? `?position=${encodeURIComponent(position)}` : '';
      const res = await fetchApi<any>(`/banners${qs}`);
      if (res && res.success !== false) {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        return list;
      }
      return [];
    } catch (e) {
      console.warn('Failed to fetch banners:', e);
      return [];
    }
  },
  createBanner: (payload: CreateBannerPayload) => {
    return fetchApi<Banner>('/banners', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
