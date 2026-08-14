import { Product } from "../types";

const SHARED_PRODUCTS_KEY = "prc_shared_products_list";
const ADMIN_PRODUCTS_KEY = "prc_admin_products_list";

/**
 * Merges static storefront catalog items with real-time admin updates stored in localStorage.
 */
export function getLiveCatalog(staticCatalog: Product[]): Product[] {
  try {
    const rawShared = localStorage.getItem(SHARED_PRODUCTS_KEY);
    const rawAdmin = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    const rawData = rawShared || rawAdmin;

    if (!rawData) return staticCatalog;
    const adminList: any[] = JSON.parse(rawData);

    if (!Array.isArray(adminList) || adminList.length === 0) return staticCatalog;

    const isMatch = (staticItem: any, adminItem: any) => {
      if (!adminItem) return false;
      const sId = String(staticItem.id);
      const aId = adminItem.id !== undefined ? String(adminItem.id) : (adminItem.apiId ? String(adminItem.apiId) : null);
      if (aId && sId === aId) return true;
      if (staticItem.apiId && adminItem.apiId && String(staticItem.apiId) === String(adminItem.apiId)) return true;
      if (staticItem.apiId && aId && String(staticItem.apiId) === aId) return true;

      const sSku = staticItem.sku ? String(staticItem.sku).trim().toLowerCase() : null;
      const aSku = adminItem.sku ? String(adminItem.sku).trim().toLowerCase() : null;
      if (sSku && aSku && sSku === aSku) return true;

      return false;
    };

    // Merge baseline static catalog
    const mergedList: Product[] = staticCatalog.map((staticItem) => {
      const adminMatch = adminList.find((adminItem) => isMatch(staticItem, adminItem));
      if (!adminMatch) return staticItem;

      // Extract updated prices and properties
      const backendRegular = Number(adminMatch.price || adminMatch.regularPrice || adminMatch.originalPrice || staticItem.originalPrice || staticItem.price || 0);
      const backendSale = adminMatch.offerPrice ?? adminMatch.salesPrice ?? adminMatch.salePrice;

      const effectiveSalePrice = backendSale !== null && backendSale !== undefined && Number(backendSale) > 0
        ? Number(backendSale)
        : Number(adminMatch.price || staticItem.price || 0);

      const effectiveRegularPrice = backendRegular > effectiveSalePrice ? backendRegular : Math.max(effectiveSalePrice, staticItem.originalPrice || effectiveSalePrice);

      const calculatedDiscount = effectiveRegularPrice > effectiveSalePrice
        ? Math.round(((effectiveRegularPrice - effectiveSalePrice) / effectiveRegularPrice) * 100)
        : Number(adminMatch.discount || staticItem.discount || 0);

      const updatedImage = adminMatch.image || adminMatch.thumbnail || (Array.isArray(adminMatch.images) && adminMatch.images[0]) || staticItem.image;

      return {
        ...staticItem,
        name: adminMatch.name || staticItem.name,
        price: effectiveSalePrice,
        salePrice: effectiveSalePrice,
        offerPrice: Number(adminMatch.offerPrice || effectiveSalePrice),
        regularPrice: effectiveRegularPrice,
        originalPrice: effectiveRegularPrice,
        discount: calculatedDiscount,
        image: updatedImage,
        category: typeof adminMatch.category === "object" ? adminMatch.category.name : (adminMatch.category || staticItem.category),
        material: adminMatch.material || staticItem.material,
        shortDesc: adminMatch.shortDesc || staticItem.shortDesc,
        description: adminMatch.description || staticItem.description,
        stock: adminMatch.stock !== undefined ? Number(adminMatch.stock) : staticItem.stock,
        status: adminMatch.status || (staticItem as any).status
      };
    });

    // Append newly created admin products that aren't in the static catalog
    adminList.forEach((adminItem) => {
      const exists = mergedList.some((p) => isMatch(p, adminItem));
      if (!exists && adminItem && adminItem.name) {
        const adminIdStr = String(adminItem.id || adminItem.apiId || `ADM-${Date.now()}`);
        const finalId = adminItem.id !== undefined && adminItem.id !== null ? adminItem.id : adminIdStr;
        const regPrice = Number(adminItem.price || adminItem.originalPrice || 999);
        const salePrice = Number(adminItem.salesPrice || adminItem.offerPrice || adminItem.salePrice || regPrice);
        const disc = regPrice > salePrice ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0;

        mergedList.unshift({
          id: finalId,
          apiId: adminIdStr,
          name: adminItem.name,
          price: salePrice,
          salePrice: salePrice,
          offerPrice: salePrice,
          regularPrice: regPrice,
          originalPrice: regPrice,
          discount: disc,
          image: adminItem.image || adminItem.thumbnail || (Array.isArray(adminItem.images) && adminItem.images[0]) || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
          category: typeof adminItem.category === "object" ? adminItem.category.name : (adminItem.category || "Hardware"),
          material: adminItem.material || "Solid Brass / Stainless Steel",
          shortDesc: adminItem.shortDesc || "",
          description: adminItem.description || "",
          stock: adminItem.stock !== undefined ? Number(adminItem.stock) : 100,
          status: adminItem.status || "ACTIVE"
        });
      }
    });

    return mergedList;
  } catch {
    return staticCatalog;
  }
}

/**
 * Subscribes to real-time BroadcastChannel & Storage events for instant storefront re-rendering.
 */
export function subscribeToProductSync(onUpdateCallback: () => void): () => void {
  const handleStorageEvent = (event: StorageEvent | CustomEvent) => {
    onUpdateCallback();
  };

  window.addEventListener("storage", handleStorageEvent as EventListener);
  window.addEventListener("prc_products_updated" as any, handleStorageEvent as EventListener);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel("prc_products_channel");
      channel.onmessage = () => {
        onUpdateCallback();
      };
    } catch {}
  }

  return () => {
    window.removeEventListener("storage", handleStorageEvent as EventListener);
    window.removeEventListener("prc_products_updated" as any, handleStorageEvent as EventListener);
    if (channel) {
      channel.close();
    }
  };
}
