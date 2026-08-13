export interface StockStatus {
  label: "Out of Stock" | "Few Left Only" | "In Stock";
  type: "OUT_OF_STOCK" | "FEW_LEFT" | "IN_STOCK";
  isAvailable: boolean;
  badgeClass: string;
}

/**
 * Reusable utility to evaluate stock status across Product Card, Quick View, and Product Details Page.
 *
 * Logic:
 * - stock <= 0 (or inStock === false) => "Out of Stock" (Red)
 * - stock > 0 && stock <= reorderLevel => "Few Left Only" (Orange / Amber)
 * - stock > reorderLevel              => "In Stock"      (Green)
 */
export function getProductStockStatus(
  stock?: number | null,
  reorderLevel?: number | null,
  inStockFlag?: boolean
): StockStatus {
  // If explicitly flagged inStock: false, treat as Out of Stock
  if (inStockFlag === false) {
    return {
      label: "Out of Stock",
      type: "OUT_OF_STOCK",
      isAvailable: false,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    };
  }

  // Parse stock value safely. If stock key is not present, default to 50
  const numStock = stock !== undefined && stock !== null && !isNaN(Number(stock))
    ? Number(stock)
    : 50;

  const numReorder = reorderLevel !== undefined && reorderLevel !== null && !isNaN(Number(reorderLevel))
    ? Number(reorderLevel)
    : 10;

  if (numStock <= 0) {
    return {
      label: "Out of Stock",
      type: "OUT_OF_STOCK",
      isAvailable: false,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    };
  }
  if (numStock <= numReorder) {
    return {
      label: "Few Left Only",
      type: "FEW_LEFT",
      isAvailable: true,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }
  return {
    label: "In Stock",
    type: "IN_STOCK",
    isAvailable: true,
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  };
}
