import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, FileDown, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchBulkOrdersAction, FetchBulkOrderStatusesAction } from '../redux/actions/bakeryActions';
import { BulkOrder, BulkOrderStatus, Invoice } from '../types';
import { formatDate, formatTime } from '../utils/date_format';
import { downloadPdf } from '../utils/pdf';
import KitchenKotButton from './Kitchenkotbutton';
import { InvoiceModal } from './InvoiceModal'; // adjust the path if your modal lives elsewhere

interface BulkOrdersViewProps {
  bulkOrders?: BulkOrder[];
  onCreateOrder: () => void;
  onUpdateStatus: (orderId: string, newStatus: any) => void;
}

// Make every order look the same (handles camelCase and snake_case from the API)
const simplify = (o: any) => ({
  raw: o, // keep the original so the bill view can use every field
  id: o.id,
  number: o.orderNumber ?? o.order_number ?? '',
  name: o.customerName ?? o.customer_name ?? '',
  phone: o.customerPhone ?? o.customer_phone ?? '',
  date: o.deliveryDate ?? o.delivery_date,
  time: o.deliveryTime ?? o.delivery_time,
  balance: Number(o.remainingAmount ?? o.remaining_amount ?? 0),
  statusId: Number(o.status ?? o.status_id),
  items: (o.products || []).map((i: any) => ({
    name: i.productName ?? i.product_name,
    unit: i.unit,
    size: Number(i.packSize ?? i.pack_size ?? i.quantity),
    boxes: Number(i.packCount ?? i.pack_count ?? 1),
    total: Number(i.quantity),
  })),
});

type SimpleOrder = ReturnType<typeof simplify>;

/* ---------- Tamil quantity formatting ---------- */

const isKg = (unit?: string) =>
  ['kg', 'kgs', 'kilogram', 'kilograms'].includes(String(unit || '').trim().toLowerCase());

const unitTa = (unit?: string) => {
  const u = String(unit || '').trim().toLowerCase();
  if (isKg(unit)) return 'கிலோ';
  if (['gm', 'g', 'gram', 'grams'].includes(u)) return 'கிராம்';
  if (['l', 'ltr', 'litre', 'liter', 'litres', 'liters'].includes(u)) return 'லிட்டர்';
  if (['pcs', 'pc', 'piece', 'pieces', 'nos'].includes(u)) return 'எண்';
  return unit || '';
};

// 0.25 -> "250 கிராம்", 1.5 -> "1.5 கிலோ"; other units translated
const fmtTa = (qty: number, unit?: string) => {
  if (!isKg(unit)) return `${+qty.toFixed(3)} ${unitTa(unit)}`.trim();
  return qty < 1 ? `${Math.round(qty * 1000)} கிராம்` : `${+qty.toFixed(3)} கிலோ`;
};

// Bulk order -> same shape the InvoiceModal already understands
const toInvoice = (o: any): Invoice => {
  const total = Number(o.totalAmount ?? o.total_amount ?? 0);
  const advance = Number(o.advancePaid ?? o.advance_paid ?? 0);
  const balance = Number(o.remainingAmount ?? o.remaining_amount ?? total - advance);
  const delivery = o.deliveryDate ?? o.delivery_date;
  const deliveryTime = o.deliveryTime ?? o.delivery_time;

  return {
    id:o.id ,
    invoiceNumber: o.orderNumber ?? o.order_number ?? '',
    dateOnly: formatDate(delivery),
    timeOnly: formatTime(deliveryTime),
    createdAt: o.createdAt ?? o.created_at,
    customerName: o.customerName ?? o.customer_name ?? 'Customer',
    customerPhone: o.customerPhone ?? o.customer_phone ?? '',
    cashierName: 'N/A',
    status: 'Completed',
    subtotal: total,
    discountTotal: 0,
    cgst: 0,
    sgst: 0,
    grandTotal: total,
    amountPaid: advance,
    balanceReturn: 0,
 // Cash / UPI only (the advance amount is shown separately)
paymentMethod: (() => {
  const m = String(o.paymentMethod ?? o.payment_method ?? '').trim().toLowerCase();
  if (!m) return '';
  return m.includes('upi') ? 'UPI' : 'Cash';
})(),
    items: (o.products || []).map((i: any) => ({
      productName: i.productName ?? i.product_name,
      category: '',
      unit: i.unit,
      quantity: Number(i.quantity) || 0,
      price: Number(i.price ?? i.rate) || 0,
      total: Number(i.total ?? i.amount) || 0,
    })),
    // extra fields used by the modal for bulk orders
    isBulk: true,
    occasion: o.occasion ?? '',
    specialInstructions: o.specialInstructions ?? o.special_instructions ?? '',
    advancePaid: advance,
    balanceDue: balance,
    deliveryText: `${formatDate(delivery)} ${formatTime(deliveryTime)}`,
  } as any;
};

// Kitchen / Packing slip -> same Invoice shape, so the same modal opens (thermal only, in Tamil)
const toKotInvoice = (o: SimpleOrder, kind: 'kitchen' | 'packing'): Invoice => {
  const base: any = toInvoice(o.raw);

  // group lines by product (one product can have several box sizes)
  const groups: { name: string; unit: string; total: number; packs: string[] }[] = [];
  o.items.forEach((it: any) => {
    let g = groups.find((x) => x.name === it.name && x.unit === it.unit);
    if (!g) {
      g = { name: it.name, unit: it.unit, total: 0, packs: [] };
      groups.push(g);
    }
    g.total += it.total;
    g.packs.push(`${fmtTa(it.size, it.unit)} x ${it.boxes} பெட்டி`);
  });

  return {
    ...base,
    isKot: true,
    kotType: kind, // 'kitchen' | 'packing'
    kotTitle: kind === 'kitchen' ? 'சமையலறை சீட்டு' : 'பேக்கிங் சீட்டு',
    kotLines: groups.map((g) => ({
      name: g.name,
      // kitchen: total to make | packing: each box size x boxes
      total: fmtTa(g.total, g.unit),
      packs: g.packs,
    })),
  } as any;
};

export const BulkOrdersView: React.FC<BulkOrdersViewProps> = ({
  bulkOrders: initialOrders = [],
  onCreateOrder,
  onUpdateStatus,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { BulkOrdersData, BulkOrdersLoad, BulkOrdersError, BulkOrderStatusesData } =
    useSelector((state: RootState) => state.bakery);

  const statuses: BulkOrderStatus[] = Array.isArray(BulkOrderStatusesData) ? BulkOrderStatusesData : [];

  useEffect(() => {
    dispatch(FetchBulkOrdersAction({}));
    dispatch(FetchBulkOrderStatusesAction());
  }, [dispatch]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null); // null = All
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const orders = useMemo(() => {
    const source = (BulkOrdersData?.length ? BulkOrdersData : initialOrders) as BulkOrder[];
    const q = search.toLowerCase();
    return source
      .map(simplify)
      .filter((o) => statusFilter === null || o.statusId === statusFilter)
      .filter(
        (o) =>
          !q ||
          o.number.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.phone.includes(search)
      );
  }, [BulkOrdersData, initialOrders, search, statusFilter]);

  const tab = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
      active
        ? 'bg-[#29252A] text-white'
        : 'bg-[#FFF9F5] text-[#756B70] border border-[#EDE2E5]'
    }`;

  return (
    <div className="space-y-5 pb-12">
      {/* Title + New order */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#29252A]">Bulk Orders</h1>
        <button
          onClick={onCreateOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white font-semibold text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
        <KitchenKotButton />
      </div>

      {/* Search + status buttons */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#756B70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or order number"
            className="w-full pl-9 pr-4 py-2 border border-[#EDE2E5] rounded-xl text-sm focus:border-[#C94F6D] outline-none"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <button className={tab(statusFilter === null)} onClick={() => setStatusFilter(null)}>
            All
          </button>
          {statuses.map((s) => (
            <button key={s.id} className={tab(statusFilter === s.id)} onClick={() => setStatusFilter(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {BulkOrdersLoad && !orders.length && <p className="text-sm text-[#756B70]">Loading orders...</p>}

      {BulkOrdersError && !orders.length && (
        <div className="bg-[#FFF0F3] rounded-2xl p-5 text-center space-y-2">
          <p className="text-sm font-bold text-[#29252A]">Could not load orders</p>
          <p className="text-xs text-[#756B70]">{String(BulkOrdersError)}</p>
          <button
            onClick={() => dispatch(FetchBulkOrdersAction({}))}
            className="px-4 py-2 bg-[#C94F6D] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {!BulkOrdersLoad && !orders.length && !BulkOrdersError && (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#EDE2E5]">
          <p className="text-sm font-bold text-[#29252A]">No orders yet</p>
          <p className="text-xs text-[#756B70] mt-1">Tap "New Order" to add one.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE2E5] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF9F5] text-[#756B70] text-xs border-b border-[#EDE2E5]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">What to make</th>
                <th className="py-3 px-4">Balance to pay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Slips &amp; Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2E5]/70">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#29252A]">{o.name}</p>
                    <p className="text-xs text-[#756B70]">{o.phone}</p>
                    <p className="text-[11px] text-[#756B70]">{o.number}</p>
                  </td>

                  <td className="py-3.5 px-4 text-[#29252A]">
                    <p className="font-semibold">{formatDate(o.date)}</p>
                    <p className="text-xs text-[#756B70]">{formatTime(o.time)}</p>
                  </td>

                  <td className="py-3.5 px-4 space-y-1.5">
                    {o.items.map((i: any, idx: number) => (
                      <p key={idx} className="text-xs text-[#29252A]">
                        <span className="font-bold">{i.name}</span>: {i.total} {i.unit}
                        <span className="text-[#756B70]">
                          {' '}({i.size} {i.unit} x {i.boxes} {i.boxes === 1 ? 'box' : 'boxes'})
                        </span>
                      </p>
                    ))}
                  </td>

                  <td className="py-3.5 px-4">
                    {o.balance > 0 ? (
                      <span className="font-bold text-[#D9535F]">₹{o.balance.toLocaleString()}</span>
                    ) : (
                      <span className="font-bold text-[#3FA56B]">Paid</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={Number.isNaN(o.statusId) ? '' : o.statusId}
                      onChange={(e) => onUpdateStatus(o.id, Number(e.target.value))}
                      className="px-2 py-1 border border-[#EDE2E5] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {Number.isNaN(o.statusId) && (
                        <option value="" disabled>
                          Choose
                        </option>
                      )}
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1.5">
                      {/* Kitchen: eye = view slip, button = download PDF */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewInvoice(toKotInvoice(o, 'kitchen'))}
                          className="p-1.5 rounded-lg text-[#756B70] hover:text-[#8A6414] hover:bg-[#FFF3D6] cursor-pointer"
                          title="View kitchen slip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            downloadPdf(`/api/bulk-orders/${o.id}/kot/kitchen`, `kitchen-kot-${o.number}.pdf`)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF3D6] text-[#8A6414] text-xs font-bold cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Kitchen
                        </button>
                      </div>

                      {/* Packing: eye = view slip, button = download PDF */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewInvoice(toKotInvoice(o, 'packing'))}
                          className="p-1.5 rounded-lg text-[#756B70] hover:text-[#2F5F96] hover:bg-[#EBF3FB] cursor-pointer"
                          title="View packing slip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            downloadPdf(`/api/bulk-orders/${o.id}/kot/packing`, `packing-kot-${o.number}.pdf`)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EBF3FB] text-[#2F5F96] text-xs font-bold cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Packing
                        </button>
                      </div>

                      {/* Bill: eye = open bill view, button = download PDF */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewInvoice(toInvoice(o.raw))}
                          className="p-1.5 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF0F3] cursor-pointer"
                          title="View bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            downloadPdf(`/api/bulk-orders/${o.id}/bill`, `bill-${o.number}.pdf`)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF0F3] text-[#C94F6D] text-xs font-bold cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Bill
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill view and kitchen / packing slips (thermal) */}
      <InvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
    </div>
  );
};