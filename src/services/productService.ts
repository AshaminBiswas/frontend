import { fetchApi } from "./api";
import { Product } from "../types";

export interface ApiProductsByCategoryResponse {
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  products?: any[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── High-Speed In-Memory Cache with SWR ─────────────────────────────────────

const MEMORY_PRODUCT_CACHE = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache

/**
 * Normalizes raw API product objects into standard frontend Product structure
 */
function normalizeApiProduct(item: any, categoryFallback: string): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const finalId = item.id !== undefined && item.id !== null ? item.id : (rawId || apiIdStr || "1");

  // Backend model fields:
  // price = Regular / MRP Price
  // salePrice / offerPrice = Sale Price (discounted price)
  const backendRegularPrice = Number(item.price || item.regularPrice || item.mrp || item.originalPrice || 0);
  const backendSalePrice = item.offerPrice ?? item.salePrice;

  let effectiveSalePrice = backendSalePrice !== null && backendSalePrice !== undefined && Number(backendSalePrice) > 0
    ? Number(backendSalePrice)
    : Number(item.price || item.salePrice || 0);

  let effectiveRegularPrice = backendRegularPrice > 0 ? backendRegularPrice : Number(item.originalPrice || item.mrp || effectiveSalePrice);

  if (effectiveRegularPrice <= effectiveSalePrice && item.discount && item.discount > 0) {
    effectiveRegularPrice = Math.round(effectiveSalePrice / (1 - item.discount / 100));
  }

  const calculatedDiscount = effectiveRegularPrice > effectiveSalePrice
    ? Math.round(((effectiveRegularPrice - effectiveSalePrice) / effectiveRegularPrice) * 100)
    : Number(item.discount || 0);

  let image = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop";
  if (typeof item.image === 'string' && item.image.trim()) {
    image = item.image;
  } else if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string') {
    image = item.images[0];
  } else if (item.thumbnail && typeof item.thumbnail === 'string') {
    image = item.thumbnail;
  }

  const categoryName = typeof item.category === 'object' && item.category?.name 
    ? item.category.name 
    : (typeof item.category === 'string' ? item.category : categoryFallback);

  const shortDescText = item.shortDesc || item.shortDescription || (typeof item.description === 'string' ? item.description : "");

  return {
    ...item,
    id: finalId,
    apiId: apiIdStr,
    sku: item.sku,
    slug: item.slug,
    name: item.name || item.title || "Architectural Hardware",
    price: effectiveSalePrice,
    salePrice: effectiveSalePrice,
    offerPrice: Number(item.offerPrice || effectiveSalePrice),
    regularPrice: effectiveRegularPrice,
    originalPrice: effectiveRegularPrice,
    discount: calculatedDiscount,
    image,
    category: categoryName,
    material: item.material || item.specifications?.material || item.finish || "Solid Brass / Stainless Steel",
    shortDesc: shortDescText,
    description: item.description || shortDescText || "",
    b2bPrice: item.b2bPrice !== undefined ? Number(item.b2bPrice) : (item.b2b_price !== undefined ? Number(item.b2b_price) : undefined),
  };
}

/**
 * Requests GET /api/v1/products/category/slug/:slug
 * With 0ms in-memory cache and automatic fallback
 */
export async function getProductsByCategorySlugApi(slug: string): Promise<{ products: Product[]; categoryName?: string; description?: string }> {
  if (!slug) return { products: [] };

  const cacheKey = `cat_${slug.toLowerCase()}`;
  const cached = MEMORY_PRODUCT_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const endpointsToTry = [
    `/products/category/slug/${encodeURIComponent(slug)}`,
    `/products?category=${encodeURIComponent(slug)}`,
    `/products?categorySlug=${encodeURIComponent(slug)}`,
    `/products?categoryName=${encodeURIComponent(slug.replace(/-/g, ' '))}`,
  ];

  for (const endpoint of endpointsToTry) {
    try {
      const res = await fetchApi<any>(endpoint);

      if (res && res.success && res.data) {
        let rawList: any[] = [];
        let catName: string | undefined = undefined;
        let catDesc: string | undefined = undefined;

        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (typeof res.data === 'object') {
          if (Array.isArray(res.data.products)) {
            rawList = res.data.products;
          } else if (Array.isArray(res.data.items)) {
            rawList = res.data.items;
          } else if (Array.isArray(res.data.data)) {
            rawList = res.data.data;
          }

          if (res.data.category) {
            catName = typeof res.data.category === 'object' ? res.data.category.name : String(res.data.category);
            catDesc = typeof res.data.category === 'object' ? res.data.category.description : undefined;
          }
        }

        if (rawList.length > 0) {
          const normalized = rawList.map((item) => normalizeApiProduct(item, slug.replace(/-/g, ' ')));
          const result = { products: normalized, categoryName: catName, description: catDesc };
          MEMORY_PRODUCT_CACHE.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
          return result;
        }
      }
    } catch {
      // try next endpoint silently
    }
  }

  return cached?.data || { products: [] };
}

/**
 * Global product loader: fetches live products from API with instant memory + storage caching
 */
export async function getAllProductsApi(limit = 100): Promise<Product[]> {
  const cacheKey = `all_products_${limit}`;
  const memoryCached = MEMORY_PRODUCT_CACHE.get(cacheKey);
  if (memoryCached && Date.now() < memoryCached.expiresAt) {
    return memoryCached.data;
  }

  try {
    const res = await fetchApi<any>(`/products?limit=${limit}`);
    let rawList: any[] = [];

    if (res && res.success && res.data) {
      if (Array.isArray(res.data.products)) {
        rawList = res.data.products;
      } else if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data.items)) {
        rawList = res.data.items;
      }
    }

    if (rawList.length > 0) {
      const normalized = rawList.map((item) => normalizeApiProduct(item, "Hardware"));
      MEMORY_PRODUCT_CACHE.set(cacheKey, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
      try {
        localStorage.setItem("prc_cached_products_list", JSON.stringify(normalized));
      } catch {}
      return normalized;
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }

  try {
    const cached = localStorage.getItem("prc_cached_products_list");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        MEMORY_PRODUCT_CACHE.set(cacheKey, { data: parsed, expiresAt: Date.now() + 60000 });
        return parsed;
      }
    }
  } catch {}

  return [];
}
