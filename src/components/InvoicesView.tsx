import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Calendar, 
  Download,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchSalesAction } from '../redux/actions/bakeryActions';
import { Invoice } from '../types';

interface InvoicesViewProps {
  invoices?: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ 
  invoices: initialInvoices = [], 
  onViewInvoice 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { SalesData, SalesLoad, SalesError } = useSelector((state: RootState) => state.bakery);

  useEffect(() => {
    dispatch(FetchSalesAction({}));
  }, [dispatch]);

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Cash' | 'UPI' | 'Card'>('All');

  const effectiveInvoices: Invoice[] = (SalesData?.length ? SalesData : initialInvoices) as Invoice[];

  const filteredInvoices = useMemo(() => {
    return effectiveInvoices.filter((inv) => {
      const invNum = inv.invoiceNumber || (inv as any).invoice_number || '';
      const custName = inv.customerName || (inv as any).customer_name || '';
      const custPhone = inv.customerPhone || (inv as any).customer_phone || '';
      const payMethod = inv.paymentMethod || (inv as any).payment_method || 'Cash';

      const matchSearch =
        invNum.toLowerCase().includes(search.toLowerCase()) ||
        custName.toLowerCase().includes(search.toLowerCase()) ||
        custPhone.includes(search);

      const matchPayment = paymentFilter === 'All' || payMethod === paymentFilter;

      return matchSearch && matchPayment;
    });
  }, [effectiveInvoices, search, paymentFilter]);

  const totalRevenue = effectiveInvoices.reduce((acc, inv) => acc + Number(inv.grandTotal ?? (inv as any).grand_total ?? 0), 0);
  const upiTotal = effectiveInvoices
    .filter((i: any) => (i.paymentMethod || i.payment_method) === 'UPI')
    .reduce((acc, i: any) => acc + Number(i.grandTotal ?? i.grand_total ?? 0), 0);
  const cashTotal = effectiveInvoices
    .filter((i: any) => (i.paymentMethod || i.payment_method) === 'Cash')
    .reduce((acc, i: any) => acc + Number(i.grandTotal ?? i.grand_total ?? 0), 0);
const normalizeInvoiceForModal = (inv: any) => ({
  invoiceNumber: inv.invoiceNumber || inv.invoice_number,
  dateOnly: inv.dateOnly || inv.sale_date,
  timeOnly: inv.timeOnly || inv.sale_time,
  customerName: inv.customerName || inv.customer_name || 'Counter Customer',
  customerPhone: inv.customerPhone || inv.customer_phone || '',
  cashierName: inv.cashierName || (inv.cashier_id ? `Staff #${inv.cashier_id}` : 'N/A'),
  status: inv.status || 'Completed',
  subtotal: Number(inv.subtotal) || 0,
  discountTotal: Number(inv.discountTotal ?? inv.discount) || 0,
  cgst: Number(inv.cgst) || 0,
  sgst: Number(inv.sgst) || 0,
  grandTotal: Number(inv.grandTotal ?? inv.grand_total) || 0,
  amountPaid: Number(inv.amountPaid ?? inv.amount_paid) || 0,
  balanceReturn: Number(inv.balanceReturn ?? inv.balance_return) || 0,
  paymentMethod: inv.paymentMethod || inv.payment_method,
  items: (inv.items || inv.sale_items || []).map((it: any) => ({
    productName: it.productName || it.product_name_snapshot || it.product_name,
    category: it.category || it.category_name || '',
    unit: it.unit,
    quantity: Number(it.quantity) || 0,
    price: Number(it.price ?? it.price_per_unit) || 0,
    total: Number(it.total) || 0,
  })),
});
  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#29252A] tracking-tight">
          Sales Invoices & Receipts
        </h1>
        <p className="text-xs sm:text-sm text-[#756B70] mt-0.5">
          History of all counter billing slips, GST invoices, and customer transactions (synced with database)
        </p>
      </div>

      {/* Mini KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs">
          <span className="text-xs font-semibold text-[#756B70]">Total Revenue Recorded</span>
          <p className="text-2xl font-extrabold text-[#C94F6D] mt-1">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-[#756B70]">{effectiveInvoices.length} invoices generated</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs">
          <span className="text-xs font-semibold text-[#756B70]">Cash Register Collection</span>
          <p className="text-2xl font-extrabold text-[#3FA56B] mt-1">
            ₹{cashTotal.toLocaleString()}
          </p>
          <span className="text-[11px] text-[#756B70]">Drawer cash total</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs">
          <span className="text-xs font-semibold text-[#756B70]">Digital UPI / QR Collections</span>
          <p className="text-2xl font-extrabold text-[#4F86C6] mt-1">
            ₹{upiTotal.toLocaleString()}
          </p>
          <span className="text-[11px] text-[#756B70]">Settled to primary bank</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#756B70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FFF9F5]/70 border border-[#EDE2E5] rounded-xl text-xs sm:text-sm text-[#29252A] placeholder-[#756B70] focus:border-[#C94F6D] outline-none"
          />
        </div>

        {/* Payment mode filter */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {(['All', 'Cash', 'UPI', 'Card'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentFilter(method)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                paymentFilter === method
                  ? 'bg-[#29252A] text-white'
                  : 'bg-[#FFF9F5] text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {SalesLoad && !effectiveInvoices.length && (
        <div className="bg-white rounded-2xl p-6 border border-[#EDE2E5] space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#FFF9F5] rounded-xl"></div>
          ))}
        </div>
      )}

      {/* Error state */}
      {SalesError && !effectiveInvoices.length && (
        <div className="bg-[#FFF0F3] border border-[#C94F6D]/30 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#C94F6D] mx-auto" />
          <h3 className="text-base font-bold text-[#29252A]">Failed to Load Sales Invoices</h3>
          <p className="text-xs text-[#756B70]">{String(SalesError)}</p>
          <button
            onClick={() => dispatch(FetchSalesAction({}))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C94F6D] text-white text-xs font-semibold rounded-xl hover:bg-[#A83D58] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Invoices List / Table */}
      <div className="bg-white rounded-2xl border border-[#EDE2E5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FFF9F5] text-[#756B70] font-bold border-b border-[#EDE2E5] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2E5]/70">
              {!SalesLoad && filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#756B70]">
                    <FileText className="w-10 h-10 text-[#EDE2E5] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#29252A]">No invoices found</p>
                    <p className="text-xs text-[#756B70]">Generate a bill from the POS register to see transactions here.</p>
                  </td>
                </tr>
              ) : (
             filteredInvoices.map((inv, idx) => {
  const invNum = inv.invoiceNumber || (inv as any).invoice_number;
  const dateOnly = inv.dateOnly || (inv as any).created_at?.split('T')[0] || 'Today';
  const timeOnly = inv.timeOnly || '';
  const custName = inv.customerName || (inv as any).customer_name;
  const custPhone = inv.customerPhone || (inv as any).customer_phone;
  const payMethod = inv.paymentMethod || (inv as any).payment_method || 'Cash';
  const grndTotal = Number(inv.grandTotal ?? (inv as any).grand_total ?? 0);
  const itemsList = inv.items || [];

  return (
    <tr key={(inv as any).id ?? `sale-${idx}`} className="hover:bg-[#FFF9F5]/70 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-bold text-[#29252A]">
                        {invNum}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[#756B70]">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-[#C94F6D]" />
                          <span>{dateOnly}</span>
                        </div>
                        {timeOnly && <span className="text-[11px]">{timeOnly}</span>}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#29252A]">{custName}</p>
                        <p className="text-[11px] text-[#756B70]">{custPhone}</p>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-[#29252A]">
                          {itemsList.length} item(s)
                        </span>
                        <p className="text-[10px] text-[#756B70] truncate max-w-[140px]">
                          {itemsList.map((i: any) => i.productName || i.product_name).join(', ')}
                        </p>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#29252A] bg-[#FFF9F5] px-2 py-0.5 rounded-md border border-[#EDE2E5]">
                          {payMethod === 'Cash' && <Banknote className="w-3 h-3 text-[#3FA56B]" />}
                          {payMethod === 'UPI' && <QrCode className="w-3 h-3 text-[#4F86C6]" />}
                          {payMethod === 'Card' && <CreditCard className="w-3 h-3 text-[#C94F6D]" />}
                          <span>{payMethod}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 font-extrabold text-sm text-[#C94F6D]">
                        ₹{grndTotal.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3FA56B] bg-[#EAF7EE] px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      </td>

                      {/* Actions */}
                    {/* Actions */}
<td className="py-3 px-4 text-right">
  <div className="flex items-center justify-end gap-1.5">
  <button
 onClick={() => onViewInvoice(normalizeInvoiceForModal(inv) as Invoice)}
  className="p-1.5 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
  title="Preview Invoice"
>
  <Eye className="w-4 h-4" />
</button>
<button
 onClick={() => onViewInvoice(normalizeInvoiceForModal(inv) as Invoice)}
  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFF0F3] hover:bg-[#FCE7EC] text-[#C94F6D] font-bold text-xs transition-colors cursor-pointer"
>
  <Printer className="w-3.5 h-3.5" />
  <span>Print Bill</span>
</button>
  </div>
</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
