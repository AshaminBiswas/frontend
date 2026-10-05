export type B2BOrderStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type B2BOrderSource = 'admin_created' | 'customer_frontend';

export type StockReservationStatus = 'active' | 'released' | 'consumed';

export interface StockReservation {
  id: string;
  orderItemId: string;
  productId: string;
  branchId: string;
  quantity: number;
  status: StockReservationStatus;
  createdAt: string;
  releasedAt?: string | null;
  consumedAt?: string | null;
}

export interface B2BOrderItem {
  id: string;
  orderId?: string;
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
  configuration?: Record<string, any> | null;
  isRemoved?: boolean;
  removedAt?: string | null;
  product?: {
    id: string;
    name: string;
    slug?: string;
    thumbnail?: string;
  };
}

export interface B2BOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  branchId: string;
  source: B2BOrderSource;
  status: B2BOrderStatus;
  sourceQuotationId?: string | null;
  sourcePoId?: string | null;
  paymentStatus: string;
  paymentMethod: string;
  paidAmount: number;
  dueAmount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  clientRequestId: string;
  createdBy: string;
  createdByType: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    companyName?: string | null;
    gstin?: string | null;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
  };
  items?: B2BOrderItem[];
  reservations?: StockReservation[];
}

export interface SubmitB2BOrderItemPayload {
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  taxPercent?: number;
  configuration?: Record<string, any>;
}

export interface SubmitB2BOrderPayload {
  clientRequestId: string;
  branchId: string;
  sourceQuotationId?: string | null;
  sourcePoId?: string | null;
  paymentMethod?: string;
  notes?: string;
  items: SubmitB2BOrderItemPayload[];
}

export interface B2BOrderListResponse {
  items: B2BOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  statusCounts: Record<string, number>;
}

export interface B2BBranch {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  isActive?: boolean;
}
