import { Product } from '../types';

export function mapApiProductToProduct(raw: any): Product {
  return {
    id: String(raw.id),
    code: raw.code ?? `PR-${raw.id}`,
    name: raw.name ?? '',
    category: raw.category_name ?? '',
    categoryId: raw.category_id ?? undefined,
    sellingPrice: Number(raw.selling_price) || 0,
    costPrice: Number(raw.cost_price) || 0,
    unit: raw.unit ?? '',
    gstRate: Number(raw.gst_percent) || 0,
    stock: Number(raw.current_stock) || 0,
    minStock: Number(raw.min_stock_threshold) || 0,
    image: raw.image_url ?? '',
    hsnCode: raw.hsn_code ?? '',
    shelfLifeDays: raw.shelf_life_days != null ? Number(raw.shelf_life_days) : undefined,
    isHighDemand: !!raw.is_popular,
  };
}

export function mapApiSaleToInvoice(raw: any): any {
  if (!raw) return raw;
  return {
    id: raw.id,
    invoiceNumber: raw.invoice_number,
    dateOnly: raw.sale_date,
    timeOnly: raw.sale_time,
    customerName: raw.customer_name || 'Counter Customer',
    customerPhone: raw.customer_phone || '',
    cashierName: raw.cashier_id ? `Staff #${raw.cashier_id}` : 'N/A', // no join to users for a name currently
    status: raw.status,
    subtotal: Number(raw.subtotal) || 0,
    discountTotal: Number(raw.discount) || 0,
    cgst: Number(raw.cgst) || 0,
    sgst: Number(raw.sgst) || 0,
    grandTotal: Number(raw.grand_total) || 0,
    amountPaid: Number(raw.amount_paid) || 0,
    balanceReturn: Number(raw.balance_return) || 0,
    paymentMethod: raw.payment_method,
    items: (raw.items || raw.sale_items || []).map((it: any) => ({
      productName: it.product_name_snapshot,
      category: it.category_name || '',
      unit: it.unit,
      quantity: Number(it.quantity) || 0,
      price: Number(it.price_per_unit) || 0,
      total: Number(it.total) || 0,
    })),
  };
}