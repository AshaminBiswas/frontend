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

// ─── High-Speed In-Memory Cache ───────────────────────────────────────────────

const CATEGORY_CACHE = new Map<string, { data: any; expiresAt: number }>();
const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes fresh cache

export const DEFAULT_PUBLIC_CATEGORIES: ApiCategory[] = [];

export async function getCategoriesApi(page = 1, limit = 20): Promise<ApiCategory[]> {
  const cacheKey = `categories_${page}_${limit}`;
  const cached = CATEGORY_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const res = await fetchApi<any>(`/categories?page=${page}&limit=${limit}`);
    if (res && res.success) {
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.categories)
        ? (res.data as any).categories
        : Array.isArray(res)
        ? res
        : [];

      if (rawList.length > 0) {
        // Filter to ONLY return ACTIVE and visible categories
        const activeOnly = rawList.filter(
          (cat: any) => (cat.status === "ACTIVE" || cat.status === "active") && cat.isVisible !== false
        );
        CATEGORY_CACHE.set(cacheKey, { data: activeOnly, expiresAt: Date.now() + CATEGORY_CACHE_TTL });
        return activeOnly;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch categories:", err);
  }
  return cached?.data || [];
}

export async function getCategoryBySlugApi(slug: string): Promise<ApiCategoryDetail | null> {
  if (!slug) return null;

  const cacheKey = `cat_slug_${slug.toLowerCase()}`;
  const cached = CATEGORY_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const endpointsToTry = [
    `/categories/${encodeURIComponent(slug)}`,
    `/categories/slug/${encodeURIComponent(slug)}`,
    `/categories/by-slug/${encodeURIComponent(slug)}`,
  ];

  for (const endpoint of endpointsToTry) {
    try {
      const res = await fetchApi<ApiCategoryDetail>(endpoint);
      if (res && res.success && res.data) {
        CATEGORY_CACHE.set(cacheKey, { data: res.data, expiresAt: Date.now() + CATEGORY_CACHE_TTL });
        return res.data;
      }
    } catch {
      // try next silently
    }
  }

  return cached?.data || null;
}
