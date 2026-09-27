import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Clock, 
  Calendar, 
  Truck, 
  ChefHat, 
  PackageCheck, 
  MapPin, 
  Phone, 
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchBulkOrdersAction } from '../redux/actions/bakeryActions';
import { BulkOrder, BulkOrderStatus } from '../types';

interface DeliveryAlertsViewProps {
  bulkOrders?: BulkOrder[];
  onUpdateStatus: (orderId: string, status: BulkOrderStatus) => void;
}

export const DeliveryAlertsView: React.FC<DeliveryAlertsViewProps> = ({
  bulkOrders: initialOrders = [],
  onUpdateStatus,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { BulkOrdersData, BulkOrdersLoad, BulkOrdersError } = useSelector((state: RootState) => state.bakery);

  useEffect(() => {
    dispatch(FetchBulkOrdersAction({}));
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'preparing' | 'ready'>('all');

  const effectiveOrders: BulkOrder[] = (BulkOrdersData?.length ? BulkOrdersData : initialOrders) as BulkOrder[];

  // Filter orders that need delivery attention (non-delivered, non-cancelled)
  const pendingOrders = effectiveOrders.filter(
    (o) => o.status === 'Upcoming' || o.status === 'Preparing' || o.status === 'Ready'
  );

  const filteredOrders = pendingOrders.filter((o) => {
    const delDate = o.deliveryDate || (o as any).delivery_date;
    if (activeTab === 'today') return delDate === '2026-09-22';
    if (activeTab === 'preparing') return o.status === 'Preparing';
    if (activeTab === 'ready') return o.status === 'Ready';
    return true;
  });

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

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EDE2E5] pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#C94F6D] text-white shadow-2xs'
              : 'bg-white text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
          }`}
        >
          All Urgent ({pendingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-[#C94F6D] text-white shadow-2xs'
              : 'bg-white text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
          }`}
        >
          Due Today
        </button>

        <button
          onClick={() => setActiveTab('preparing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preparing'
              ? 'bg-[#C94F6D] text-white shadow-2xs'
              : 'bg-white text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
          }`}
        >
          Kitchen Preparing
        </button>

        <button
          onClick={() => setActiveTab('ready')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ready'
              ? 'bg-[#C94F6D] text-white shadow-2xs'
              : 'bg-white text-[#756B70] hover:text-[#29252A] border border-[#EDE2E5]'
          }`}
        >
          Ready for Dispatch
        </button>
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
            const itemsList = order.items || [];

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
                        <span className="font-semibold text-[#29252A]">{delDate} • {delTime}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Ready'
                          ? 'bg-[#EAF7EE] text-[#3FA56B]'
                          : order.status === 'Preparing'
                          ? 'bg-[#FFF3D6] text-[#D9A441]'
                          : 'bg-[#FFF0F3] text-[#C94F6D]'
                      }`}
                    >
                      {order.status}
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
                    <p className="line-clamp-2 text-[11px]">
                      {delAddr}
                    </p>
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
                    <span className="font-bold text-[#29252A]">{order.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {order.status !== 'Ready' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'Ready')}
                        className="py-1.5 rounded-lg bg-[#EAF7EE] hover:bg-[#3FA56B] text-[#3FA56B] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateStatus(order.id, 'Delivered')}
                      className={`py-1.5 rounded-lg bg-[#FFF0F3] hover:bg-[#C94F6D] text-[#C94F6D] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        order.status === 'Ready' ? 'col-span-2' : 'col-span-1'
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
