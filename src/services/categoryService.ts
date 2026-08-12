import { fetchApi } from "./api";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  position?: number;
  productCount?: number;
  status?: string;
  isVisible?: boolean;
}

export interface ApiCategoryDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parent?: any;
  children?: ApiCategoryDetail[];
  breadcrumbs?: Array<{ name: string; slug: string }>;
  productCount?: number;
  status?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
}

export async function getCategoriesApi(page = 1, limit = 20): Promise<ApiCategory[]> {
  try {
    const res = await fetchApi<ApiCategory[]>(`/categories?page=${page}&limit=${limit}`);
    if (res && res.success && Array.isArray(res.data)) {
      // Filter to ONLY return ACTIVE and visible categories
      return res.data.filter(
        (cat) => cat.status === "ACTIVE" && cat.isVisible !== false
      );
    }
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }
  return [];
}

export async function getCategoryBySlugApi(slug: string): Promise<ApiCategoryDetail | null> {
  if (!slug) return null;
  const endpointsToTry = [
    `/categories/${encodeURIComponent(slug)}`,
    `/categories/slug/${encodeURIComponent(slug)}`,
    `/categories/by-slug/${encodeURIComponent(slug)}`,
  ];

  for (const endpoint of endpointsToTry) {
    try {
      const res = await fetchApi<ApiCategoryDetail>(endpoint);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      // try next silently
    }
  }
  return null;
}
