import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Receipt,
  Menu,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import {sidebar as ta}  from '../components/Bakerylabels'

interface HeaderProps {
  onOpenSearch?: () => void; // search bar removed – kept optional so existing callers don't break
  onNewBill: () => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const H = ta.header;

// Logo is a static file: put kcs_logo.png in your public/ (static) folder
export const LOGO_SRC = 'assets/image/kcs_logo.png';

// Today's date in Tamil, e.g. "ஞாயிறு, 11 அக்., 2026"
const formatTamilDate = (d: Date) =>
  d.toLocaleDateString('ta-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const Header: React.FC<HeaderProps> = ({
  onNewBill,
  onOpenMobileMenu,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  // Live current date (re-checked every minute, so it rolls over at midnight)
  const [formattedDate, setFormattedDate] = useState(() => formatTamilDate(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setFormattedDate(formatTamilDate(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EDE2E5] px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile menu trigger, sidebar toggle & logo */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile hamburger menu button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-[#EDE2E5] text-[#29252A] hover:bg-[#FFF4F6] transition-colors cursor-pointer"
            aria-label={H.openMenu}
          >
            <Menu className="w-5 h-5 text-[#29252A]" />
          </button>

          {/* Desktop sidebar collapse / open toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl border border-[#EDE2E5] text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] hover:border-[#C94F6D]/30 transition-all cursor-pointer shadow-2xs group shrink-0"
            title={isSidebarCollapsed ? H.expandSidebar : H.collapseSidebar}
            aria-label={isSidebarCollapsed ? H.expandSidebar : H.collapseSidebar}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#756B70] group-hover:text-[#C94F6D] transition-colors" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-[#756B70] group-hover:text-[#C94F6D] transition-colors" />
            )}
          </button>

          {/* Shop logo (replaces the search bar) + bold shop name on its right */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={LOGO_SRC}
              alt={H.logoAlt}
              className="h-11 w-auto object-contain select-none shrink-0"
              draggable={false}
            />
            <h1 className="font-extrabold text-base sm:text-lg text-[#29252A] leading-tight truncate">
              {ta.shop.name}
            </h1>
          </div>
        </div>

        {/* Right Section: Date, POS CTA, Cashier Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Date indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EDE2E5] text-xs font-semibold text-[#29252A] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#C94F6D]" />
            <span>{formattedDate}</span>
          </div>

          {/* Primary POS Action */}
          <button
            onClick={onNewBill}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#D9A441] hover:bg-[#C89433] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#D9A441]/25 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span className="hidden xs:inline">{H.newBill}</span>
            <span className="xs:hidden">{H.newBillShort}</span>
          </button>

          {/* Cashier Profile Pill */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="w-9 h-9 rounded-full bg-[#C94F6D] text-white flex items-center justify-center shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-[11px] text-[#756B70] leading-tight">{H.headCashier}</p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#756B70]" />
          </div>
        </div>
      </div>
    </header>
  );
};