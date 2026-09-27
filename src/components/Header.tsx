import React from 'react';
import { 
  Search, 
  Calendar, 
  Receipt, 
  Menu, 
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onNewBill: () => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNewBill,
  onOpenMobileMenu,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  // Format current date matching reference image "Tue, Sep 22, 2026"
  const formattedDate = "Tue, Sep 22, 2026";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EDE2E5] px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile menu trigger & search input */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile hamburger menu button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-[#EDE2E5] text-[#29252A] hover:bg-[#FFF4F6] transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5 text-[#29252A]" />
          </button>

          {/* Desktop sidebar collapse / open toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl border border-[#EDE2E5] text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] hover:border-[#C94F6D]/30 transition-all cursor-pointer shadow-2xs group shrink-0"
            title={isSidebarCollapsed ? "Expand sidebar (Open)" : "Collapse sidebar (Close)"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#756B70] group-hover:text-[#C94F6D] transition-colors" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-[#756B70] group-hover:text-[#C94F6D] transition-colors" />
            )}
          </button>

          {/* Global Search Bar (opens search modal) */}
          <div
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FFF9F5]/70 hover:bg-[#FFF4F6]/50 border border-[#EDE2E5] hover:border-[#C94F6D]/40 rounded-xl text-sm text-[#756B70] cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-[#756B70] group-hover:text-[#C94F6D] transition-colors shrink-0" />
              <span className="truncate text-xs sm:text-sm">Search products, invoices, bulk orders...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-[#756B70] bg-white border border-[#EDE2E5] rounded-md shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section: Date, POS CTA, Cashier Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Date indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EDE2E5] text-xs font-semibold text-[#29252A] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#C94F6D]" />
            <span>{formattedDate}</span>
          </div>

          {/* Primary POS Action (Gold button from reference) */}
          <button
            onClick={onNewBill}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#D9A441] hover:bg-[#C89433] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#D9A441]/25 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span className="hidden xs:inline">New Bill (POS)</span>
            <span className="xs:hidden">POS</span>
          </button>

          {/* Cashier Profile Pill */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="w-9 h-9 rounded-full bg-[#C94F6D] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              AK
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-[#29252A] leading-tight">Anil Kumar</p>
              <p className="text-[11px] text-[#756B70] leading-tight">Head Cashier</p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#756B70]" />
          </div>
        </div>
      </div>
    </header>
  );
};
