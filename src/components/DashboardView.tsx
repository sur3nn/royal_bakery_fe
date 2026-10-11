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
import{ dashboardLabel as ta } from '../components/Bakerylabels'

interface DashboardViewProps {
  products?: Product[];
  invoices?: Invoice[];
  bulkOrders?: BulkOrder[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenNewBill: () => void;
  onOpenAddProduct: () => void;
  onOpenCreateBulkOrder: () => void;
}

const REFRESH_MS = 60_000; // dashboard refreshes itself every minute

const toNum = (v: any) => Number(v) || 0;
const money = (v: any) => toNum(v).toLocaleString('en-IN');
const qty = (v: any) => String(+toNum(v).toFixed(2));

// kg -> கிலோ, gm -> கிராம், etc. Unknown units are shown as they come from the DB
const unitTa = (u: any, fallback = 'kg'): string => {
  const raw = String(u || fallback);
  return (ta.units as Record<string, string>)[raw.toLowerCase()] ?? raw;
};

// Name of the logged-in user, if your login code stores it as JSON under "user"
const getStoredUserName = (): string => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? String(JSON.parse(raw)?.name || '') : '';
  } catch {
    return '';
  }
};

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

  // Load on open, then refresh every minute
  useEffect(() => {
    dispatch(FetchDashboardAction({}));
    const timer = setInterval(() => dispatch(FetchDashboardAction({})), REFRESH_MS);
    return () => clearInterval(timer);
  }, [dispatch]);

  const hasData = !!DashboardData;
  const cashierName = getStoredUserName();

  // ---------- KPI values (all come from the API) ----------
  const todaySales = toNum(DashboardData?.todaySales ?? DashboardData?.today_sales);
  const todayBillsCount = toNum(DashboardData?.todayBills ?? DashboardData?.today_bills ?? DashboardData?.todayOrders);
  const avgTicket = toNum(DashboardData?.avgTicket ?? DashboardData?.avg_ticket);
  const estimatedProfit = toNum(DashboardData?.estimatedProfit ?? DashboardData?.estimated_profit);
  const profitMargin = toNum(DashboardData?.profitMargin ?? DashboardData?.profit_margin);

  // Pending deliveries: use the API count; only fall back to the props before data arrives
  const pendingList: any[] = Array.isArray(DashboardData?.pendingDeliveries)
    ? DashboardData.pendingDeliveries
    : hasData
    ? []
    : bulkOrders.filter((b: any) => b.status === 'Upcoming' || b.status === 'Preparing' || b.status === 'Ready');
  const pendingCount = toNum(DashboardData?.pendingDeliveriesCount ?? pendingList.length);

  // Low stock
  const lowStockList: any[] = Array.isArray(DashboardData?.lowStockProducts)
    ? DashboardData.lowStockProducts
    : hasData
    ? []
    : products.filter((p: any) => Number(p.stock) <= Number(p.minStock ?? p.min_stock ?? 5));
  const lowStockCount = toNum(DashboardData?.lowStockCount ?? lowStockList.length);

  const bulkOrdersTotal = toNum(DashboardData?.bulkOrdersTotal ?? bulkOrders.length);

  // Top selling: if the API answered, trust it (an empty list means no sales yet)
  const topProducts: any[] = Array.isArray(DashboardData?.topProducts)
    ? DashboardData.topProducts
    : hasData
    ? []
    : products.slice(0, 5);

  // ---------- Charts ----------
  const hourlyData: any[] = Array.isArray(DashboardData?.hourlyData) ? DashboardData.hourlyData : [];
  const weeklyData: any[] = Array.isArray(DashboardData?.weeklyData) ? DashboardData.weeklyData : [];

  const activeChartData = chartView === 'today' ? hourlyData : weeklyData;
  const chartHasSales = activeChartData.some((d: any) => toNum(d.sales) > 0);
  const maxSale = Math.max(...activeChartData.map((d: any) => toNum(d.sales)), 1000) * 1.25;

  const switchChart = (view: 'today' | 'weekly') => {
    setHoveredPoint(null);
    setChartView(view);
  };

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
          <h3 className="text-base font-bold text-[#29252A]">{ta.dashboard.loadErrorTitle}</h3>
          <p className="text-xs text-[#756B70] max-w-md mx-auto">{String(DashboardError)}</p>
          <button
            onClick={() => dispatch(FetchDashboardAction({}))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C94F6D] text-white text-xs font-semibold rounded-xl hover:bg-[#A83D58] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{ta.dashboard.retry}</span>
          </button>
        </div>
      )}

      {/* 1. STORE HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF0F3] via-[#FFF6F0] to-[#FFF0EB] border border-[#EDE2E5] p-5 sm:p-7 shadow-xs">
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-white/40 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#C94F6D]">
              <Sparkles className="w-4 h-4 text-[#C94F6D]" />
              <span>{ta.dashboard.heroTag}</span>
              <button
                onClick={() => dispatch(FetchDashboardAction({}))}
                title={ta.dashboard.refresh}
                className="ml-1 p-1 rounded-md hover:bg-white/70 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${DashboardLoad ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29252A] tracking-tight">
              {ta.shop.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#756B70] leading-relaxed">
              {ta.dashboard.syncInfo}
              {cashierName && (
                <>
                  {' '}• {ta.dashboard.shiftCashier}: <span className="font-semibold text-[#C94F6D]">{cashierName}</span>
                </>
              )}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewBill}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{ta.actions.newBill}</span>
            </button>

            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 text-[#C94F6D]" />
              <span>{ta.actions.addProduct}</span>
            </button>

            <button
              onClick={onOpenCreateBulkOrder}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C94F6D]" />
              <span>{ta.actions.createBulkOrder}</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF4F6] border border-[#EDE2E5] text-[#29252A] font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-[#C94F6D]" />
              <span>{ta.actions.viewProducts}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS (6 CARDS IN RESPONSIVE GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#C94F6D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.todaySales}</span>
            <div className="w-8 h-8 rounded-full bg-[#FCE7EC] text-[#C94F6D] flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#C94F6D]">
              ₹{money(todaySales)}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#3FA56B] mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{ta.kpi.liveData}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Bills */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#EDE2E5]/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.todayBills}</span>
            <div className="w-8 h-8 rounded-full bg-[#F0EBF8] text-[#8E5EC7] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#29252A]">
              {todayBillsCount} {ta.kpi.bills}
            </h3>
            <p className="text-[11px] text-[#756B70] mt-1 font-medium">
              {ta.kpi.avgTicket} ₹{money(avgTicket)}
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Profit */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#3FA56B]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.estimatedProfit}</span>
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#3FA56B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#3FA56B]">
              ₹{money(estimatedProfit)}
            </h3>
            <p className="text-[11px] text-[#3FA56B] mt-1 font-semibold">
              {profitMargin}% {ta.kpi.grossMargin}
            </p>
          </div>
        </div>

        {/* Card 4: Pending Deliveries */}
        <div
          onClick={() => onNavigate('delivery-alerts')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE2E5] shadow-xs hover:border-[#D9A441]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.pendingDeliveries}</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF3D6] text-[#D9A441] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#9E6B20]">
              {pendingCount} {ta.kpi.orders}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D9A441] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>{ta.kpi.viewAlerts}</span>
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
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.bulkOrders}</span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3FB] text-[#4F86C6] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#29252A]">
              {bulkOrdersTotal} {ta.kpi.total}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4F86C6] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>{ta.kpi.manageOrders}</span>
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
            <span className="text-xs font-semibold text-[#756B70]">{ta.kpi.lowStock}</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F3] text-[#D9535F] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#D9535F]">
              {lowStockCount} {ta.kpi.products}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D9535F] mt-1 group-hover:translate-x-0.5 transition-transform">
              <span>{ta.kpi.restock}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS AND TOP SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3 width): Sales trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#EDE2E5] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#29252A]">
                {chartView === 'today' ? ta.chart.todayTitle : ta.chart.weeklyTitle}
              </h2>
              <p className="text-xs text-[#756B70] mt-0.5">
                {chartView === 'today' ? ta.chart.todaySubtitle : ta.chart.weeklySubtitle}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center p-1 bg-[#FFF9F5] border border-[#EDE2E5] rounded-xl self-start sm:self-auto">
              <button
                onClick={() => switchChart('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartView === 'today'
                    ? 'bg-[#C94F6D] text-white shadow-xs'
                    : 'text-[#756B70] hover:text-[#29252A]'
                }`}
              >
                {ta.chart.today}
              </button>
              <button
                onClick={() => switchChart('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartView === 'weekly'
                    ? 'bg-[#C94F6D] text-white shadow-xs'
                    : 'text-[#756B70] hover:text-[#29252A]'
                }`}
              >
                {ta.chart.weekly}
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
                  const y = 220 - (toNum(d.sales) / maxSale) * 190;
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

            {/* Empty chart message */}
            {hasData && !chartHasSales && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-[#756B70] bg-white/80 px-3 py-1.5 rounded-lg">
                  {chartView === 'today' ? ta.chart.noSalesToday : ta.chart.noSalesWeek}
                </span>
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredPoint !== null && activeChartData[hoveredPoint] && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#29252A] text-white px-3 py-1.5 rounded-lg shadow-lg text-xs pointer-events-none flex items-center gap-2"
              >
                <span className="font-semibold text-white">
                  {activeChartData[hoveredPoint].time}:
                </span>
                <span className="text-[#FFF0F3] font-bold">
                  ₹{money(activeChartData[hoveredPoint].sales)}
                </span>
                <span className="text-[#EDE2E5] text-[10px]">
                  ({toNum(activeChartData[hoveredPoint].bills)} {ta.kpi.bills})
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
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#29252A]">
                  {ta.top.title}
                </h2>
                <p className="text-[11px] text-[#756B70]">{ta.top.last30}</p>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{ta.top.viewAll}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of top selling products */}
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#756B70]">
                {ta.top.empty}
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
                          {product.category} • {ta.top.stock}: {qty(product.stock)} {unitTa(product.unit)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-extrabold text-[#29252A]">
                        ₹{money(product.sellingPrice ?? product.selling_price)} <span className="text-[10px] text-[#756B70] font-normal">/ {unitTa(product.unit)}</span>
                      </p>
                      {product.isHighDemand || product.is_high_demand ? (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#279A57] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#279A57]/20">
                          {ta.top.highDemand}
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[10px] text-[#756B70]">
                          {toNum(product.soldQty) > 0
                            ? `${qty(product.soldQty)} ${unitTa(product.unit, '')} ${ta.top.sold}`
                            : ta.top.regular}
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
            <span>{ta.top.openPos}</span>
          </button>
        </div>
      </div>
    </div>
  );
};