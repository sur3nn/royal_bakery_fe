import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Package, 
  FileText, 
  ShoppingBag, 
  ChevronRight, 
  ArrowRight
} from 'lucide-react';
import { Product, Invoice, BulkOrder, NavigationTab } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  invoices: Invoice[];
  bulkOrders: BulkOrder[];
  onSelectProduct: (product: Product) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onSelectBulkOrder: (order: BulkOrder) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  invoices,
  bulkOrders,
  onSelectProduct,
  onSelectInvoice,
  onSelectBulkOrder,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K or Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // toggle will be handled by App root
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search across products
  const matchingProducts = products
    .filter((p) => p.name.toLowerCase().includes(trimmed) || p.code.toLowerCase().includes(trimmed) || p.category.toLowerCase().includes(trimmed))
    .slice(0, 4);

  // Search across invoices
  const matchingInvoices = invoices
    .filter((i) => i.invoiceNumber.toLowerCase().includes(trimmed) || i.customerName.toLowerCase().includes(trimmed) || i.customerPhone.includes(trimmed))
    .slice(0, 4);

  // Search across bulk orders
  const matchingBulkOrders = bulkOrders
    .filter((b) => b.orderNumber.toLowerCase().includes(trimmed) || b.customerName.toLowerCase().includes(trimmed) || b.occasion.toLowerCase().includes(trimmed))
    .slice(0, 4);

  const hasResults =
    matchingProducts.length > 0 || matchingInvoices.length > 0 || matchingBulkOrders.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#EDE2E5] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EDE2E5]">
          <Search className="w-5 h-5 text-[#C94F6D] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, invoices, bulk orders, customers..."
            className="w-full text-sm text-[#29252A] placeholder-[#756B70] outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#756B70] hover:text-[#29252A] hover:bg-[#FFF4F6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          {!hasResults ? (
            <div className="py-8 text-center text-[#756B70]">
              <p className="font-semibold text-sm text-[#29252A]">No matches found</p>
              <p className="text-xs mt-1">Try searching for "laddu", "mysore", "INV", or customer names</p>
            </div>
          ) : (
            <>
              {/* Products section */}
              {matchingProducts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-bold text-[#756B70] uppercase tracking-wider">
                    <span>Products & Sweets ({matchingProducts.length})</span>
                    <button
                      onClick={() => {
                        onNavigate('products');
                        onClose();
                      }}
                      className="text-[#C94F6D] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {matchingProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF9F5] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-[#EDE2E5]"
                          />
                          <div>
                            <p className="font-bold text-[#29252A] group-hover:text-[#C94F6D] transition-colors">
                              {p.name}
                            </p>
                            <span className="text-[10px] text-[#756B70]">
                              {p.category} • {p.stock} {p.unit} in stock
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-extrabold text-[#29252A]">
                            ₹{p.sellingPrice} /{p.unit}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#756B70] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices section */}
              {matchingInvoices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-bold text-[#756B70] uppercase tracking-wider">
                    <span>Sales Invoices ({matchingInvoices.length})</span>
                    <button
                      onClick={() => {
                        onNavigate('invoices');
                        onClose();
                      }}
                      className="text-[#C94F6D] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {matchingInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          onSelectInvoice(inv);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF9F5] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-[#29252A] group-hover:text-[#C94F6D]">
                              {inv.invoiceNumber}
                            </p>
                            <span className="text-[10px] text-[#756B70]">
                              {inv.customerName} • {inv.dateOnly}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-extrabold text-[#C94F6D]">
                            ₹{inv.grandTotal.toLocaleString()}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#756B70]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk orders section */}
              {matchingBulkOrders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-bold text-[#756B70] uppercase tracking-wider">
                    <span>Bulk Orders ({matchingBulkOrders.length})</span>
                    <button
                      onClick={() => {
                        onNavigate('bulk-orders');
                        onClose();
                      }}
                      className="text-[#C94F6D] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {matchingBulkOrders.map((bo) => (
                      <div
                        key={bo.id}
                        onClick={() => {
                          onSelectBulkOrder(bo);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF9F5] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#FFF3D6] text-[#D9A441] flex items-center justify-center font-bold">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-[#29252A] group-hover:text-[#C94F6D]">
                              {bo.orderNumber} ({bo.occasion})
                            </p>
                            <span className="text-[10px] text-[#756B70]">
                              {bo.customerName} • Due: {bo.deliveryDate}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-bold text-[#29252A]">
                            ₹{bo.totalAmount.toLocaleString()}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#756B70]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#FFF9F5] border-t border-[#EDE2E5] flex justify-between items-center text-[11px] text-[#756B70]">
          <span>Navigation Quick Jump</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-[#EDE2E5] rounded text-[10px]">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
