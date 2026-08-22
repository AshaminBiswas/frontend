import { Product } from '../types/index';

export function normalizeRawProduct(item: any): Product {
  const rawId = item._id || item.id || item.apiId;
  const apiIdStr = rawId ? String(rawId) : undefined;
  const finalId = item.id !== undefined && item.id !== null ? item.id : (rawId || apiIdStr || '1');
  const backendRegularPrice = Number(item.price || item.regularPrice || item.mrp || item.originalPrice || 0);
  const backendSalePrice = item.offerPrice ?? item.salePrice;
  let effectiveSalePrice = backendSalePrice !== null && backendSalePrice !== undefined && Number(backendSalePrice) > 0 ? Number(backendSalePrice) : Number(item.price || item.salePrice || 0);
  let effectiveRegularPrice = backendRegularPrice > 0 ? backendRegularPrice : Number(item.originalPrice || item.mrp || effectiveSalePrice);
  if (effectiveRegularPrice <= effectiveSalePrice && item.discount && item.discount > 0) {
    effectiveRegularPrice = Math.round(effectiveSalePrice / (1 - item.discount / 100));
  }
  const calculatedDiscount = effectiveRegularPrice > effectiveSalePrice ? Math.round(((effectiveRegularPrice - effectiveSalePrice) / effectiveRegularPrice) * 100) : Number(item.discount || 0);
  let image = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop';
  if (typeof item.image === 'string' && item.image.trim()) {
    image = item.image;
  } else if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string') {
    image = item.images[0];
  } else if (item.thumbnail && typeof item.thumbnail === 'string') {
    image = item.thumbnail;
  }
  const categoryName = typeof item.category === 'object' && item.category?.name ? item.category.name : (typeof item.category === 'string' ? item.category : 'Hardware');
  const shortDescText = item.shortDesc || item.shortDescription || (typeof item.description === 'string' ? item.description : '');
  return {
    ...item,
    id: finalId,
    apiId: apiIdStr,
    sku: item.sku,
    slug: item.slug,
    name: item.name || item.title || 'Architectural Hardware',
    price: effectiveSalePrice,
    salePrice: effectiveSalePrice,
    offerPrice: Number(item.offerPrice || effectiveSalePrice),
    regularPrice: effectiveRegularPrice,
    originalPrice: effectiveRegularPrice,
    discount: calculatedDiscount,
    image,
    category: categoryName,
    material: item.material || item.specifications?.material || item.finish || 'Solid Brass / Stainless Steel',
    shortDesc: shortDescText,
    description: item.description || shortDescText || '',
    b2bPrice: item.b2bPrice !== undefined ? Number(item.b2bPrice) : (item.b2b_price !== undefined ? Number(item.b2b_price) : undefined),
  };
}

