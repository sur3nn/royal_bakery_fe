import React, { useState, useMemo, useEffect } from 'react';
import { formatDate, formatTime, formatDateTime } from '../utils/date_format';
import {
  Search,
  Plus,
  ShoppingBag,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  Truck,
  ChefHat,
  PackageCheck,
  XCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchBulkOrdersAction, FetchBulkOrderStatusesAction } from '../redux/actions/bakeryActions';
import { BulkOrder, BulkOrderStatus } from '../types';

// The order's status is the status ID. Supports both `status` and `status_id` from the backend.
const getOrderStatusId = (order: any): number =>
  Number(order?.status ?? order?.status_id);

interface BulkOrdersViewProps {
  bulkOrders?: BulkOrder[];
  onCreateOrder: () => void;
  onUpdateStatus: (orderId: string, newStatus: number) => void;
}

export const BulkOrdersView: React.FC<BulkOrdersViewProps> = ({
  bulkOrders: initialOrders = [],
  onCreateOrder,
  onUpdateStatus,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { BulkOrdersData, BulkOrdersLoad, BulkOrdersError, BulkOrderStatusesData } = useSelector((state: RootState) => state.bakery);

  const bulkOrderStatuses: BulkOrderStatus[] = Array.isArray(BulkOrderStatusesData)
    ? BulkOrderStatusesData
    : [];

  useEffect(() => {
    dispatch(FetchBulkOrdersAction({}));
    dispatch(FetchBulkOrderStatusesAction());
  }, [dispatch]);

  const [search, setSearch] = useState('');
  // null = All, otherwise the status ID
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<BulkOrder | null>(null);

  const statusFilters: BulkOrderStatus[] = [
    { id: 0, name: 'All' },
    ...bulkOrderStatuses,
  ];

  const effectiveOrders: BulkOrder[] = (BulkOrdersData?.length ? BulkOrdersData : initialOrders) as BulkOrder[];

  const filteredOrders = useMemo(() => {
    return effectiveOrders.filter((order) => {
      const matchStatus =
        selectedStatus === null ||
        getOrderStatusId(order) === selectedStatus;
      const orderNum = order.orderNumber || (order as any).order_number || '';
      const custName = order.customerName || (order as any).customer_name || '';
      const custPhone = order.customerPhone || (order as any).customer_phone || '';
      const occasion = order.occasion || '';

      const matchSearch =
        orderNum.toLowerCase().includes(search.toLowerCase()) ||
        custName.toLowerCase().includes(search.toLowerCase()) ||
        custPhone.includes(search) ||
        occasion.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [effectiveOrders, selectedStatus, search]);

  // Status name is used for display/styling only; the order stores the status ID.
  const getStatusBadge = (order: BulkOrder) => {
    const statusId = getOrderStatusId(order);
    const statusName =
      bulkOrderStatuses.find((status) => status.id === statusId)?.name || 'Unknown';

    switch (statusName) {
      case 'Preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF3D6] text-[#D9A441] border border-[#D9A441]/30">
            <ChefHat className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBF3FB] text-[#4F86C6] border border-[#4F86C6]/30">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF7EE] text-[#3FA56B] border border-[#3FA56B]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0F3] text-[#D9535F] border border-[#D9535F]/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0F3] text-[#C94F6D] border border-[#C94F6D]/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F0F1] text-[#756B70] border border-[#756B70]/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{statusName}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#29252A] tracking-tight">
            Bulk & Advance Party Orders
          </h1>
          <p className="text-xs sm:text-sm text-[#756B70] mt-0.5">
            Manage large sweet boxes, wedding commitments, and event pre-orders
          </p>
        </div>

        <button
          onClick={onCreateOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Bulk Order</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#756B70] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF9F5]/70 border border-[#EDE2E5] rounded-xl text-xs sm:text-sm text-[#29252A] placeholder-[#756B70] focus:border-[#C94F6D] outline-none"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {statusFilters.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id === 0 ? null : status.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${(selectedStatus ?? 0) === status.id
                    ? 'bg-[#29252A] text-white'
                    : 'bg-[#FFF9F5] text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
                  }`}
              >
                {status.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {BulkOrdersLoad && !effectiveOrders.length && (
        <div className="bg-white rounded-2xl p-6 border border-[#EDE2E5] space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#FFF9F5] rounded-xl"></div>
          ))}
        </div>
      )}

      {/* Error state */}
      {BulkOrdersError && !effectiveOrders.length && (
        <div className="bg-[#FFF0F3] border border-[#C94F6D]/30 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#C94F6D] mx-auto" />
          <h3 className="text-base font-bold text-[#29252A]">Failed to Load Bulk Orders</h3>
          <p className="text-xs text-[#756B70]">{String(BulkOrdersError)}</p>
          <button
            onClick={() => dispatch(FetchBulkOrdersAction({}))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C94F6D] text-white text-xs font-semibold rounded-xl hover:bg-[#A83D58] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Orders Table */}
      {!BulkOrdersLoad && filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EDE2E5] shadow-xs space-y-3">
          <ShoppingBag className="w-12 h-12 text-[#C94F6D]/40 mx-auto" />
          <h3 className="text-base font-bold text-[#29252A]">No bulk orders found</h3>
          <p className="text-xs text-[#756B70] max-w-sm mx-auto">
            {search || selectedStatus !== null
              ? 'Try modifying your search query or status filter.'
              : 'Add customer advance orders for weddings, celebrations, and festive parties.'}
          </p>
          <button
            onClick={onCreateOrder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C94F6D] hover:bg-[#A83D58] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bulk Order</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EDE2E5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FFF9F5] text-[#756B70] font-bold border-b border-[#EDE2E5] uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order & Occasion</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Due</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Payment Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Update</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2E5]/70">
                {filteredOrders.map((order) => {
                  const orderNum = order.orderNumber || (order as any).order_number;
                  const custName = order.customerName || (order as any).customer_name;
                  const custPhone = order.customerPhone || (order as any).customer_phone;
                  const delDate = order.deliveryDate || (order as any).delivery_date;
                  const delTime = order.deliveryTime || (order as any).delivery_time;
                  const totAmt = Number(order.totalAmount ?? (order as any).total_amount ?? 0);
                  const remAmt = Number(order.remainingAmount ?? (order as any).remaining_amount ?? 0);
                  const advPaid = Number(order.advancePaid ?? (order as any).advance_paid ?? 0);
                  const itemsList = order.products || [];

                  const formattedDate = delDate
                    ? new Date(delDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                    : '-';

                  const formattedTime = delTime
                    ? new Date(`1970-01-01T${delTime}`).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    : '-';
                  return (
                    <tr key={order.id} className="hover:bg-[#FFF9F5]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-[#29252A] flex items-center gap-1.5">
                            <span>{orderNum}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF0F3] text-[#C94F6D] border border-[#C94F6D]/20">
                              {order.occasion}
                            </span>
                          </p>
                          <p className="text-[11px] text-[#756B70] mt-0.5 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-[#756B70]" />
                            <span>{order.deliveryType || (order as any).delivery_type || 'Store Pickup'}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-[#29252A]">{custName}</p>
                          <p className="text-[11px] text-[#756B70] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{custPhone}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#29252A]">
                          <Calendar className="w-3.5 h-3.5 text-[#C94F6D]" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#756B70] mt-0.5">
                          <Clock className="w-3 h-3 text-[#756B70]" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="text-xs text-[#29252A] font-medium truncate">
                          {itemsList.map((i: any) => `${i.productName || i.product_name} (${i.quantity} ${i.unit})`).join(', ')}
                        </p>
                        <p className="text-[11px] text-[#756B70]">{itemsList.length} items total</p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <p className="font-extrabold text-[#29252A]">₹{totAmt.toLocaleString()}</p>
                        {remAmt > 0 ? (
                          <p className="text-[11px] font-bold text-[#D9535F]">
                            Bal: ₹{remAmt.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-[11px] font-bold text-[#3FA56B]">Paid in Full</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(order)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={Number.isNaN(getOrderStatusId(order)) ? '' : getOrderStatusId(order)}
                          onChange={(e) => onUpdateStatus(order.id, Number(e.target.value))}
                          className="px-2 py-1 bg-white border border-[#EDE2E5] rounded-lg text-xs font-semibold text-[#29252A] focus:border-[#C94F6D] outline-none cursor-pointer"
                        >
                          {Number.isNaN(getOrderStatusId(order)) && (
                            <option value="" disabled>
                              Select status
                            </option>
                          )}
                          {bulkOrderStatuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-1.5 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF0F3] transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-semibold">View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Order Details */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#EDE2E5] shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#EDE2E5] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#29252A]">
                  Order {selectedOrderDetails.orderNumber || (selectedOrderDetails as any).order_number}
                </h3>
                <p className="text-xs text-[#756B70]">
                  Occasion: {selectedOrderDetails.occasion} • Placed:{' '}
                  {formatDateTime((selectedOrderDetails as any).created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-[#756B70] hover:text-[#29252A] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Delivery Information */}
            <div className="p-3 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5] space-y-1 text-xs">
              <p>
                <strong className="text-[#29252A]">Customer:</strong>{' '}
                {selectedOrderDetails.customerName || (selectedOrderDetails as any).customer_name} (
                {selectedOrderDetails.customerPhone || (selectedOrderDetails as any).customer_phone})
              </p>
              <p>
                <strong className="text-[#29252A]">Delivery Mode:</strong>{' '}
                {selectedOrderDetails.deliveryType || (selectedOrderDetails as any).delivery_type} on{' '}
                {formatDate(
                  selectedOrderDetails.deliveryDate ||
                  (selectedOrderDetails as any).delivery_date
                )}{' '} at{' '}
                {formatTime(
                  selectedOrderDetails.deliveryTime ||
                  (selectedOrderDetails as any).delivery_time
                )}
              </p>
              <p>
                <strong className="text-[#29252A]">Address:</strong>{' '}
                {selectedOrderDetails.deliveryAddress || (selectedOrderDetails as any).delivery_address}
              </p>
              {(selectedOrderDetails.specialInstructions || (selectedOrderDetails as any).special_instructions) && (
                <p className="text-[#C94F6D] font-medium pt-1">
                  <strong className="text-[#29252A]">Instructions:</strong>{' '}
                  {selectedOrderDetails.specialInstructions || (selectedOrderDetails as any).special_instructions}
                </p>
              )}
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-bold text-[#29252A] mb-2 uppercase tracking-wide">
                Ordered Sweets & Confectionery
              </h4>
              <div className="divide-y divide-[#EDE2E5] border border-[#EDE2E5] rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                {(selectedOrderDetails.products || []).map((it: any, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                    <div>
                      <p className="font-bold text-[#29252A]">{it.productName || it.product_name}</p>
                      <p className="text-[11px] text-[#756B70]">
                        {it.quantity} {it.unit} @ ₹{it.price}/{it.unit}
                      </p>
                    </div>
                    <span className="font-bold text-[#29252A]">
                      ₹{Number(it.total || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="pt-2 flex justify-between items-center text-xs font-semibold">
              <span>Total: ₹{Number(selectedOrderDetails.totalAmount ?? (selectedOrderDetails as any).total_amount ?? 0).toLocaleString()}</span>
              <span className="text-[#3FA56B]">
                Advance: ₹{Number(selectedOrderDetails.advancePaid ?? (selectedOrderDetails as any).advance_paid ?? 0).toLocaleString()}
              </span>
              <span className="text-[#D9535F] font-bold">
                Remaining: ₹{Number(selectedOrderDetails.remainingAmount ?? (selectedOrderDetails as any).remaining_amount ?? 0).toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2 bg-[#29252A] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
