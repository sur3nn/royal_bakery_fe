import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Receipt, 
  PackagePlus, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Truck, 
  AlertTriangle, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchDashboardAction } from '../redux/actions/bakeryActions';
import { Product, Invoice, BulkOrder, NavigationTab } from '../types';

interface DashboardViewProps {
  products?: Product[];
  invoices?: Invoice[];
  bulkOrders?: BulkOrder[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenNewBill: () => void;
  onOpenAddProduct: () => void;
  onOpenCreateBulkOrder: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products = [],
  invoices = [],
  bulkOrders = [],
  onNavigate,
  onOpenNewBill,
  onOpenAddProduct,
  onOpenCreateBulkOrder,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { DashboardData, DashboardLoad, DashboardError } = useSelector((state: RootState) => state.bakery);

  const [chartView, setChartView] = useState<'today' | 'weekly'>('today');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    dispatch(FetchDashboardAction({}));
  }, [dispatch]);

  // Read live calculations from DashboardData with safe fallbacks
  const todaySales = DashboardData?.todaySales ?? DashboardData?.today_sales ?? 0;
  const todayBillsCount = DashboardData?.todayBills ?? DashboardData?.today_bills ?? 0;
  const avgTicket = DashboardData?.avgTicket ?? DashboardData?.avg_ticket ?? 0;
  const estimatedProfit = DashboardData?.estimatedProfit ?? DashboardData?.estimated_profit ?? 0;

  const pendingDeliveries = DashboardData?.pendingDeliveries || bulkOrders.filter(
    (b: any) => b.status === 'Upcoming' || b.status === 'Preparing' || b.status === 'Ready'
  );

  const lowStockProducts = DashboardData?.lowStockProducts || products.filter(
    (p: any) => Number(p.stock) <= Number(p.minStock ?? p.min_stock ?? 5)
  );

  const topProducts = DashboardData?.topProducts?.length 
    ? DashboardData.topProducts 
    : products.slice(0, 5);

  const hourlyData = DashboardData?.hourlyData || [
    { time: '9 AM', sales: 4200, bills: 4 },
    { time: '11 AM', sales: 7800, bills: 7 },
    { time: '1 PM', sales: 14200, bills: 12 },
    { time: '3 PM', sales: 12100, bills: 9 },
    { time: '5 PM', sales: 21400, bills: 18 },
    { time: '7 PM', sales: 29800, bills: 24 },
    { time: '9 PM', sales: 11500, bills: 8 },
  ];

  const weeklyData = DashboardData?.weeklyData || [
    { time: 'Mon', sales: 42000, bills: 48 },
    { time: 'Tue', sales: 48500, bills: 55 },
    { time: 'Wed', sales: 45000, bills: 52 },
    { time: 'Thu', sales: 52000, bills: 60 },
    { time: 'Fri', sales: 68000, bills: 78 },
    { time: 'Sat', sales: 88500, bills: 98 },
    { time: 'Sun', sales: 94000, bills: 110 },
  ];

  const activeChartData = chartView === 'today' ? hourlyData : weeklyData;
  const maxSale = Math.max(...activeChartData.map((d: any) => d.sales), 1000) * 1.25;

  return (
    <div className="space-y-6 pb-12">
      {/* Loading Skeleton */}
      {DashboardLoad && !DashboardData && (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-white/60 rounded-2xl border border-[#EDE2E5]"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/60 rounded-2xl border border-[#EDE2E5]"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-white/60 rounded-2xl border border-[#EDE2E5]"></div>
            <div className="h-80 bg-white/60 rounded-2xl border border-[#EDE2E5]"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {DashboardError && !DashboardData && (
        <div className="bg-[#FFF0F3] border border-[#C94F6D]/30 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#C94F6D] mx-auto" />
          <h3 className="text-base font-bold text-[#29252A]">Unable to Load Dashboard</h3>
          <p className="text-xs text-[#756B70] max-w-md mx-auto">{String(DashboardError)}</p>
          <button
            onClick={() => dispatch(FetchDashboardAction({}))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C94F6D] text-white text-xs font-semibold rounded-xl hover:bg-[#A83D58] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* 1. STORE HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF0F3] via-[#FFF6F0] to-[#FFF0EB] border border-[#EDE2E5] p-5 sm:p-7 shadow-xs">
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-white/40 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#C94F6D] tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-[#C94F6D]" />
              <span>Store Dashboard & Real-Time Analytics</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29252A] tracking-tight">
              Royal Sweets & Bakery
            </h1>

            <p className="text-xs sm:text-sm text-[#756B70] leading-relaxed">
              Live backend sync active for Counter #1 • Shift Cashier:{' '}
              <span className="font-semibold text-[#C94F6D]">Anil Kumar</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewBill}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Bill (POS)</span>
            </button>

            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 text-[#C94F6D]" />
              <span>Add Product</span>
            </button>

            <button
              onClick={onOpenCreateBulkOrder}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C94F6D]" />
              <span>Create Bulk Order</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-[#C94F6D]" />
              <span>View Products</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS (6 CARDS IN RESPONSIVE GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#C94F6D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Today's Sales</span>
            <div className="w-8 h-8 rounded-full bg-[#FCE7EC] text-[#C94F6D] flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#C94F6D]">
              ₹{todaySales.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#3FA56B] mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Live backend data</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Bills */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#EDE2E5]/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Today's Bills</span>
            <div className="w-8 h-8 rounded-full bg-[#F0EBF8] text-[#8E5EC7] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#29252A]">
              {todayBillsCount} Bills
            </h3>
            <p className="text-[11px] text-[#756B70] mt-1 font-medium">
              Avg ticket ₹{avgTicket.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Profit */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#3FA56B]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Estimated Profit</span>
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#3FA56B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#3FA56B]">
              ₹{estimatedProfit.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#3FA56B] mt-1 font-semibold">
              32.5% Gross Margin
            </p>
          </div>
        </div>

        {/* Card 4: Pending Deliveries */}
        <div 
          onClick={() => onNavigate('delivery-alerts')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#D9A441]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Pending Deliveries</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF3D6] text-[#D9A441] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#9E6B20]">
              {pendingDeliveries.length} Orders
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D9A441] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>View Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 5: Bulk Orders */}
        <div 
          onClick={() => onNavigate('bulk-orders')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#4F86C6]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Bulk Orders</span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3FB] text-[#4F86C6] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#29252A]">
              {DashboardData?.bulkOrdersTotal ?? bulkOrders.length} Total
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4F86C6] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 6: Low Stock Items */}
        <div 
          onClick={() => onNavigate('products')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#D9535F]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">Low Stock Items</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F3] text-[#D9535F] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#D9535F]">
              {lowStockProducts.length} Products
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D9535F] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>Restock Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS AND TOP SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3 width): Today's Sales Trend (Hourly) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#EDE2E5] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#29252A]">
                {chartView === 'today' ? "Today's Sales Trend (Hourly)" : "Weekly Sales Revenue"}
              </h2>
              <p className="text-xs text-[#756B70] mt-0.5">
                {chartView === 'today'
                  ? 'Real-time revenue pattern across peak counter hours.'
                  : 'Seven-day cumulative counter performance analysis.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center p-1 bg-[#FFF9F5] border border-[#EDE2E5] rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setChartView('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartView === 'today'
                    ? 'bg-[#C94F6D] text-white shadow-xs'
                    : 'text-[#756B70] hover:text-[#29252A]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setChartView('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartView === 'weekly'
                    ? 'bg-[#C94F6D] text-white shadow-xs'
                    : 'text-[#756B70] hover:text-[#29252A]'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-64 sm:h-72">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="roseCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C94F6D" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#C94F6D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 60, 120, 180, 240].map((y, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="#EDE2E5"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Compute Smooth Curve Path */}
              {(() => {
                if (!activeChartData || activeChartData.length === 0) return null;
                const points = activeChartData.map((d: any, index: number) => {
                  const x = (index / (activeChartData.length - 1 || 1)) * 700;
                  const y = 220 - (Number(d.sales || 0) / maxSale) * 190;
                  return { x, y, data: d };
                });

                let pathD = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p0 = points[i === 0 ? 0 : i - 1];
                  const p1 = points[i];
                  const p2 = points[i + 1];
                  const p3 = points[i + 2] || p2;

                  const cp1x = p1.x + (p2.x - p0.x) / 6;
                  const cp1y = p1.y + (p2.y - p0.y) / 6;
                  const cp2x = p2.x - (p3.x - p1.x) / 6;
                  const cp2y = p2.y - (p3.y - p1.y) / 6;

                  pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                }

                const areaD = `${pathD} L 700 240 L 0 240 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#roseCurveGradient)" />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#C94F6D"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                    />

                    {/* Interactive Points */}
                    {points.map((p: any, idx: number) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint === idx ? 6 : 4}
                          fill="#FFFFFF"
                          stroke="#C94F6D"
                          strokeWidth="2.5"
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && activeChartData[hoveredPoint] && (
              <div 
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#29252A] text-white px-3 py-1.5 rounded-lg shadow-lg text-xs pointer-events-none flex items-center gap-2"
              >
                <span className="font-semibold text-white">
                  {activeChartData[hoveredPoint].time}:
                </span>
                <span className="text-[#FFF0F3] font-bold">
                  ₹{Number(activeChartData[hoveredPoint].sales || 0).toLocaleString()}
                </span>
                <span className="text-[#EDE2E5] text-[10px]">
                  ({activeChartData[hoveredPoint].bills} bills)
                </span>
              </div>
            )}
          </div>

          {/* X-axis Labels */}
          <div className="flex justify-between items-center pt-3 text-xs font-semibold text-[#756B70] border-t border-[#EDE2E5]/70">
            {activeChartData.map((d: any, i: number) => (
              <span key={i}>{d.time}</span>
            ))}
          </div>
        </div>

        {/* Right (1/3 width): Top Selling Products */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EDE2E5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE2E5]">
              <h2 className="text-base sm:text-lg font-bold text-[#29252A]">
                Top Selling Products
              </h2>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of top selling products */}
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#756B70]">
                No product sales recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#EDE2E5]/70 mt-1">
                {topProducts.map((product: any, index: number) => (
                  <div
                    key={product.id || index}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#FFF9F5]/80 px-1.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#FFF3D6] text-[#D9A441] font-bold text-xs flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>

                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200'}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-[#EDE2E5] shrink-0"
                      />

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#29252A] truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-[#756B70] truncate">
                          {product.category} • {product.stock} {String(product.unit || 'kg').toLowerCase()} stock
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-extrabold text-[#29252A]">
                        ₹{product.sellingPrice || product.selling_price} <span className="text-[10px] text-[#756B70] font-normal">/ {product.unit}</span>
                      </p>
                      {product.isHighDemand || product.is_high_demand ? (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#279A57] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#279A57]/20">
                          High Demand
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[10px] text-[#756B70]">
                          Regular
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenNewBill}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#FFF0F3] hover:bg-[#FCE7EC] text-[#C94F6D] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Open POS Register</span>
          </button>
        </div>
      </div>
    </div>
  );
};
