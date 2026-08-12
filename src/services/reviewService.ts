import { fetchApi } from './api';

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  rating: number;
  title: string;
  comment: string;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  createdAt: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export const reviewService = {
  getProductReviews: (productId: string, page = 1) =>
    fetchApi<{ reviews: Review[]; total: number; averageRating: number }>(`/reviews/product/${productId}?page=${page}&limit=10`),
  getMyReviews: () =>
    fetchApi<Review[]>('/users/reviews'),
  createReview: (payload: CreateReviewPayload) =>
    fetchApi<Review>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
};
