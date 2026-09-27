import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  ShoppingBag, 
  BellRing, 
  FileText, 
  PlusCircle, 
  ChevronRight,
  ChevronLeft,
  Cake,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onQuickNewBill: () => void;
  lowStockCount: number;
  bulkOrdersCount: number;
  dueSoonDeliveriesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onQuickNewBill,
  lowStockCount,
  bulkOrdersCount,
  dueSoonDeliveriesCount,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'billing' as NavigationTab,
      label: 'Billing (POS)',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'products' as NavigationTab,
      label: 'Products',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeType: 'warning',
    },
    {
      id: 'bulk-orders' as NavigationTab,
      label: 'Bulk Orders',
      icon: ShoppingBag,
      badge: bulkOrdersCount > 0 ? `${bulkOrdersCount}` : null,
      badgeType: 'rose',
    },
    {
      id: 'delivery-alerts' as NavigationTab,
      label: 'Delivery Alerts',
      icon: BellRing,
      badge: dueSoonDeliveriesCount > 0 ? 'Due Soon' : null,
      badgeType: 'danger',
    },
    {
      id: 'invoices' as NavigationTab,
      label: 'Invoices',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-45 bg-white border-r border-[#EDE2E5] flex flex-col transition-[width,transform] duration-300 ease-in-out shrink-0 h-screen ${
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${
          isOpenMobile ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div 
          className={`py-4 border-b border-[#EDE2E5]/70 flex items-center transition-all ${
            isCollapsed 
              ? 'px-2 justify-center flex-col gap-2' 
              : 'px-4 justify-between'
          }`}
        >
          {isCollapsed ? (
            <>
              {/* Compact Logo when collapsed */}
              <button
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-xl bg-[#C94F6D] text-white flex items-center justify-center shadow-sm shadow-[#C94F6D]/30 hover:bg-[#A83D58] transition-colors cursor-pointer"
                title="Royal Sweets - Click to expand (Open)"
                aria-label="Expand sidebar"
              >
                <Cake className="w-5 h-5 stroke-[2.2]" />
              </button>
              {/* Expand button under logo */}
              <button 
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] transition-colors cursor-pointer"
                title="Open / Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#C94F6D] text-white flex items-center justify-center shadow-sm shadow-[#C94F6D]/30 shrink-0">
                  <Cake className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-base text-[#29252A] tracking-tight leading-tight truncate">
                    Royal Sweets
                  </h1>
                  <p className="text-[10px] font-semibold text-[#756B70] tracking-wider uppercase truncate">
                    Bakery ERP & POS
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Desktop Collapse button */}
                <button 
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] transition-colors cursor-pointer"
                  title="Close / Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Mobile close button */}
                <button 
                  onClick={onCloseMobile} 
                  className="lg:hidden p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick New Bill Action Button */}
        <div className={`transition-all ${isCollapsed ? 'p-2' : 'p-4 pb-2'}`}>
          <button
            onClick={() => {
              onQuickNewBill();
              onCloseMobile();
            }}
            className={`group relative w-full flex items-center justify-center rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.99] text-white font-semibold shadow-sm shadow-[#C94F6D]/25 transition-all duration-150 cursor-pointer ${
              isCollapsed ? 'p-3' : 'px-4 py-3 gap-2.5 text-sm'
            }`}
            title={isCollapsed ? "Quick New Bill (POS)" : undefined}
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            {!isCollapsed && <span>Quick New Bill</span>}

            {/* Tooltip for collapsed view */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#29252A] text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                Quick New Bill (POS)
              </div>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 py-2 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group relative w-full flex items-center rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#FFF0F3] text-[#C94F6D] font-semibold shadow-xs'
                    : 'text-[#29252A] hover:bg-[#FFF4F6] hover:text-[#C94F6D]'
                }`}
                aria-label={item.label}
              >
                <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon
                    className={`w-5 h-5 transition-colors shrink-0 ${
                      isActive ? 'text-[#C94F6D] stroke-[2.2]' : 'text-[#756B70]'
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}

                  {/* Dot indicator when collapsed */}
                  {isCollapsed && item.badge && (
                    <span
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        item.badgeType === 'warning'
                          ? 'bg-[#D9A441]'
                          : 'bg-[#C94F6D]'
                      }`}
                    />
                  )}
                </div>

                {/* Expanded Badges */}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeType === 'warning'
                        ? 'bg-[#FFF3D6] text-[#D9A441] border border-[#D9A441]/30'
                        : item.badgeType === 'danger'
                        ? 'bg-[#FFF0F3] text-[#C94F6D] border border-[#C94F6D]/30'
                        : 'bg-[#FCE7EC] text-[#C94F6D]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#29252A] text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#C94F6D] text-white font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Collapse Toggle Button for Desktop */}
        <div className="hidden lg:block px-3 py-2 border-t border-[#EDE2E5]/70">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            }`}
            title={isCollapsed ? "Open sidebar (Expand)" : "Close sidebar (Collapse)"}
            aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {!isCollapsed && (
              <span className="flex items-center gap-2">
                <PanelLeftClose className="w-4 h-4 text-[#756B70]" />
                <span>Collapse sidebar</span>
              </span>
            )}
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#756B70]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#756B70]" />
            )}
          </button>
        </div>

        {/* Decorative faint bakery watermark & Cashier info */}
        <div className="p-3 border-t border-[#EDE2E5]/80 relative overflow-hidden bg-gradient-to-b from-white to-[#FFF9F5]">
          {!isCollapsed ? (
            <div className="relative z-10 flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-[#EDE2E5]/80 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#C94F6D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  AK
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#29252A] truncate">
                    Anil Kumar
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#3FA56B] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3FA56B] animate-pulse"></span>
                    <span className="truncate">Counter #1 Active</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#756B70] shrink-0" />
            </div>
          ) : (
            <div className="group relative flex justify-center py-1">
              <div className="relative cursor-pointer" onClick={onToggleCollapse}>
                <div className="w-9 h-9 rounded-full bg-[#C94F6D] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AK
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3FA56B] ring-2 ring-white"></span>
              </div>
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#29252A] text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                Anil Kumar • Counter #1 Active
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
