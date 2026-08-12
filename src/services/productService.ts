import { fetchApi } from "./api";
import { Product } from "../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../data/products";

const STATIC_CATALOG: Product[] = [...SUPER_SAVER_PRODUCTS, ...VALUE_MONEY_PRODUCTS, ...BEST_SELLER_PRODUCTS];

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

/**
 * Normalizes raw API product objects into standard frontend Product structure
 */
function normalizeApiProduct(item: any, categoryFallback: string): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const numId = typeof item.id === 'number'
    ? item.id
    : (apiIdStr ? parseInt(apiIdStr.replace(/\D/g, ''), 10) || Math.floor(Math.random() * 900000) + 100000 : Math.floor(Math.random() * 900000) + 100000);

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
    id: numId,
    apiId: apiIdStr,
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
    description: item.description || shortDescText || ""
  };
}

/**
 * Requests GET /api/v1/products/category/slug/:slug
 * Fallback to GET /api/v1/products?category=:slug
 */
export async function getProductsByCategorySlugApi(slug: string): Promise<{ products: Product[]; categoryName?: string; description?: string }> {
  if (!slug) return { products: [] };

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
          return { products: normalized, categoryName: catName, description: catDesc };
        }
      }
    } catch (err) {
      // try next endpoint silently
    }
  }

  // Fallback: Filter local static catalog if API is offline or returns 0 results
  const term = slug.replace(/-/g, ' ').toLowerCase();
  const fallbackList = STATIC_CATALOG.filter((p) => {
    const pCat = (p.category || "").toLowerCase();
    const cleanSlug = slug.toLowerCase();
    return (
      pCat.includes(term) ||
      term.includes(pCat) ||
      pCat.replace(/\s+/g, '-').includes(cleanSlug) ||
      cleanSlug.includes(pCat.replace(/\s+/g, '-'))
    );
  });

  return { products: fallbackList };
}
