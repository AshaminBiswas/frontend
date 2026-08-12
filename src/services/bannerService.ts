import { fetchApi } from './api';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position?: string;
  order?: number;
  isActive?: boolean;
}

export const bannerService = {
  getPublicBanners: (position?: string) => {
    const qs = position ? `?position=${encodeURIComponent(position)}` : '';
    return fetchApi<Banner[]>(`/banners${qs}`);
  },
  createBanner: (payload: CreateBannerPayload) => {
    return fetchApi<Banner>('/banners', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
