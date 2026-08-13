import { fetchApi } from './api';

export interface Review {
  id?: string;
  _id?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  rating: number;
  title: string;
  comment: string;
  status?: 'PENDING' | 'PUBLISHED' | 'REJECTED' | string;
  createdAt?: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  userName?: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export const reviewService = {
  getProductReviews: (productId: string, page = 1, limit = 20) =>
    fetchApi<any>(`/reviews/product/${productId}?page=${page}&limit=${limit}`),
  getMyReviews: () =>
    fetchApi<Review[]>('/users/reviews'),
  createReview: (payload: CreateReviewPayload) =>
    fetchApi<Review>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
};

