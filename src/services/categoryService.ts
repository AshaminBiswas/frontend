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

export const DEFAULT_PUBLIC_CATEGORIES: ApiCategory[] = [
  { id: "cat-1", name: "Cubicles Hardware", slug: "cubicles-hardware", position: 1, status: "ACTIVE", isVisible: true, productCount: 12 },
  { id: "cat-2", name: "Locker Hardware", slug: "locker-hardware", position: 2, status: "ACTIVE", isVisible: true, productCount: 8 },
  { id: "cat-3", name: "Urinal Hardware", slug: "urinal-hardware", position: 3, status: "ACTIVE", isVisible: true, productCount: 6 },
  { id: "cat-4", name: "Shower Room Hardware", slug: "shower-room-hardware", position: 4, status: "ACTIVE", isVisible: true, productCount: 10 },
  { id: "cat-5", name: "Exchange Room Hardware", slug: "exchange-room-hardware", position: 5, status: "ACTIVE", isVisible: true, productCount: 5 },
  { id: "cat-6", name: "Door Hardware", slug: "door-hardware", position: 6, status: "ACTIVE", isVisible: true, productCount: 15 },
  { id: "cat-7", name: "Glass Fittings", slug: "glass-fittings", position: 7, status: "ACTIVE", isVisible: true, productCount: 9 },
];

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
  return cached?.data || DEFAULT_PUBLIC_CATEGORIES;
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

  // Generate fallback category detail from default categories list
  const matched = DEFAULT_PUBLIC_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.replace(/-/g, " ").toLowerCase()
  );

  const formattedName = matched ? matched.name : slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const fallbackDetail: ApiCategoryDetail = {
    id: matched?.id || `cat-${slug}`,
    name: formattedName,
    slug: slug,
    description: `Discover architectural-grade ${formattedName} engineered for modern spaces.`,
    productCount: matched?.productCount || 8,
    status: "ACTIVE",
    breadcrumbs: [
      { name: "Home", slug: "/" },
      { name: "Categories", slug: "/categories" },
      { name: formattedName, slug: `/categories/${slug}` },
    ]
  };

  return cached?.data || fallbackDetail;
}
