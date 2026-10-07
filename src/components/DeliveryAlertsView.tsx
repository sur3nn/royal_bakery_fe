import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Clock,
  Truck,
  PackageCheck,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchBulkOrdersAction } from '../redux/actions/bakeryActions';
import { BulkOrder } from '../types';

// TODO: make these IDs match your bulk_order_status table.
// Consider moving them to src/constants.ts and importing from there.
export const ORDER_STATUS = {
  Upcoming: 1,
  Preparing: 2,
  Ready: 3,
  Delivered: 4,
  Cancelled: 5,
} as const;

export const ORDER_STATUS_LABEL: Record<number, string> = {
  [ORDER_STATUS.Upcoming]: 'Upcoming',
  [ORDER_STATUS.Preparing]: 'Preparing',
  [ORDER_STATUS.Ready]: 'Ready',
  [ORDER_STATUS.Delivered]: 'Delivered',
  [ORDER_STATUS.Cancelled]: 'Cancelled',
};

interface DeliveryAlertsViewProps {
  bulkOrders?: BulkOrder[];
  onUpdateStatus: (orderId: string, statusId: number) => void;
}

// Works whether the API sends `status` or `status_id`
const getStatusId = (o: BulkOrder): number =>
  Number(o.status ?? (o as any).status_id);

export const DeliveryAlertsView: React.FC<DeliveryAlertsViewProps> = ({
  bulkOrders: initialOrders = [],
  onUpdateStatus,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { BulkOrdersData, BulkOrdersLoad } = useSelector(
    (state: RootState) => state.bakery
  );

  useEffect(() => {
    dispatch(FetchBulkOrdersAction({}));
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'preparing' | 'ready'>('all');

  const effectiveOrders: BulkOrder[] = (
    BulkOrdersData?.length ? BulkOrdersData : initialOrders
  ) as BulkOrder[];

  // Local date as YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Orders that still need delivery attention (not delivered, not cancelled)
  const pendingOrders = effectiveOrders.filter((o) => {
    const s = getStatusId(o);
    return (
      s === ORDER_STATUS.Upcoming ||
      s === ORDER_STATUS.Preparing ||
      s === ORDER_STATUS.Ready
    );
  });

  const filteredOrders = pendingOrders.filter((o) => {
    const s = getStatusId(o);
    const delDate = o.deliveryDate || (o as any).delivery_date;
    if (activeTab === 'today') return delDate === todayStr;
    if (activeTab === 'preparing') return s === ORDER_STATUS.Preparing;
    if (activeTab === 'ready') return s === ORDER_STATUS.Ready;
    return true;
  });

  const tabs: { key: 'all' | 'today' | 'preparing' | 'ready'; label: string }[] = [
    { key: 'all', label: `All Urgent (${pendingOrders.length})` },
    { key: 'today', label: 'Due Today' },
    { key: 'preparing', label: 'Kitchen Preparing' },
    { key: 'ready', label: 'Ready for Dispatch' },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#C94F6D] uppercase tracking-wider">
          <BellRing className="w-4 h-4 text-[#C94F6D]" />
          <span>Dispatch & Counter Fulfillment</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#29252A] tracking-tight mt-1">
          Delivery & Kitchen Alerts
        </h1>
        <p className="text-xs sm:text-sm text-[#756B70] mt-0.5">
          Real-time fulfillment monitor for upcoming wedding batches, pickups, and door deliveries
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EDE2E5] pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === t.key
                ? 'bg-[#C94F6D] text-white shadow-2xs'
                : 'bg-white text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {BulkOrdersLoad && !effectiveOrders.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-[#EDE2E5]"></div>
          ))}
        </div>
      )}

      {/* Orders Grid */}
      {!BulkOrdersLoad && filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EDE2E5] shadow-xs space-y-2">
          <CheckCircle2 className="w-12 h-12 text-[#3FA56B] mx-auto mb-2" />
          <h3 className="font-bold text-base text-[#29252A]">All Clear! No Pending Delivery Alerts</h3>
          <p className="text-xs text-[#756B70] max-w-sm mx-auto">
            All current bulk orders have been completed or there are no urgent kitchen batches due.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const orderNum = order.orderNumber || (order as any).order_number;
            const custName = order.customerName || (order as any).customer_name;
            const custPhone = order.customerPhone || (order as any).customer_phone;
            const delDate = order.deliveryDate || (order as any).delivery_date;
            const delTime = order.deliveryTime || (order as any).delivery_time;
            const delType = order.deliveryType || (order as any).delivery_type;
            const delAddr = order.deliveryAddress || (order as any).delivery_address;
            const itemsList: any[] = order.products || (order as any).items || [];
            const statusId = getStatusId(order);
            const statusLabel = ORDER_STATUS_LABEL[statusId] ?? 'Unknown';
            const isReady = statusId === ORDER_STATUS.Ready;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#EDE2E5] p-5 shadow-xs hover:border-[#C94F6D]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-[#EDE2E5]">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#29252A]">
                        {orderNum}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#756B70] mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#C94F6D]" />
                        <span className="font-semibold text-[#29252A]">
                          {delDate} • {delTime}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isReady
                          ? 'bg-[#EAF7EE] text-[#3FA56B]'
                          : statusId === ORDER_STATUS.Preparing
                            ? 'bg-[#FFF3D6] text-[#D9A441]'
                            : 'bg-[#FFF0F3] text-[#C94F6D]'
                        }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="mt-3">
                    <h3 className="font-bold text-sm text-[#29252A]">{custName}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#756B70]">
                      <span className="font-semibold text-[#C94F6D]">{order.occasion}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {custPhone}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Mode & Location */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5]/80 space-y-1 text-xs text-[#756B70]">
                    <div className="flex items-center gap-1.5 font-bold text-[#29252A]">
                      <Truck className="w-3.5 h-3.5 text-[#C94F6D]" />
                      <span>{delType}</span>
                    </div>
                    <p className="line-clamp-2 text-[11px]">{delAddr}</p>
                  </div>

                  {/* Order Items Summary */}
                  <div className="mt-3 space-y-1">
                    <p className="text-[11px] font-bold text-[#756B70] uppercase tracking-wider">
                      Items to prepare:
                    </p>
                    <ul className="text-xs space-y-1">
                      {itemsList.map((it: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-[#29252A]">
                          <span className="truncate">{it.productName || it.product_name}</span>
                          <span className="font-bold shrink-0 ml-2">
                            {it.quantity} {it.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Status update buttons */}
                <div className="mt-4 pt-3 border-t border-[#EDE2E5] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#756B70]">Status:</span>
                    <span className="font-bold text-[#29252A]">{statusLabel}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {!isReady && (
                      <button
                        onClick={() => onUpdateStatus(order.id, ORDER_STATUS.Ready)}
                        className="py-1.5 rounded-lg bg-[#EAF7EE] hover:bg-[#3FA56B] text-[#3FA56B] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateStatus(order.id, ORDER_STATUS.Delivered)}
                      className={`py-1.5 rounded-lg bg-[#FFF0F3] hover:bg-[#C94F6D] text-[#C94F6D] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 ${isReady ? 'col-span-2' : 'col-span-1'
                        }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};