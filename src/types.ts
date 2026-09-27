export type NavigationTab = 
  | 'dashboard' 
  | 'billing' 
  | 'products' 
  | 'bulk-orders' 
  | 'delivery-alerts' 
  | 'invoices';

export interface Product {
  id: string;              // DB `id` is numeric (int) — confirm your API serializes it as string; if it returns a number, change this to `number` and update all `String(id)` comparisons in App.tsx/ProductsView accordingly
  code: string;             // no matching column in your schema screenshot — confirm this is generated client-side only, not persisted
  name: string;
  category: string;         // was a fixed union; now driven by CategoriesData (product_categories.name) — no longer a compile-time-checkable set
  categoryId?: number;      // optional: keep the resolved category_id around if you want to avoid re-matching by name elsewhere
  sellingPrice: number;
  costPrice: number;
  unit: string;             // plain column on products, not a union — was a fixed 'Kg'|'Box'|'Pcs'|'Pack' list, now free text
  gstRate: number;          // e.g. 5
  stock: number;
  minStock: number;
  image: string;
  hsnCode?: string;         // NOT a real column right now — see note below
  shelfLifeDays?: number;   // real column (shelf_life_days), not currently in your form
  isHighDemand?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number; // e.g. 0% or 5%
  discountAmount: number;
  itemSubtotal: number;
  gstAmount: number;
  itemTotal: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  price: number;
  quantity: number;
  discountPercent: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string; // ISO or formatted date
  dateOnly: string;
  timeOnly: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  cgst: number;
  sgst: number;
  gstTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Split';
  amountPaid: number;
  balanceReturn: number;
  cashierName: string;
  status: 'Paid' | 'Refunded' | 'Cancelled';
}

export type BulkOrderStatus = 'Upcoming' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';

export interface BulkOrderItem {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  total: number;
}

export interface BulkOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryDate: string; // e.g. "2026-09-22"
  deliveryTime: string; // e.g. "16:30"
  deliveryAddress: string;
  deliveryType: 'Home Delivery' | 'Store Pickup';
  items: BulkOrderItem[];
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  status: BulkOrderStatus;
  occasion: 'Wedding' | 'Birthday' | 'Festival' | 'Corporate Event' | 'Poojan / Religious' | 'Other';
  specialInstructions?: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}
