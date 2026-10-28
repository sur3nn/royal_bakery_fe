import React, { useState, useMemo, useEffect } from 'react';
import {
  Tag,
  Search,
  Printer,
  Sparkles,
  CheckSquare,
  Square,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  X,
  Package,
  Calendar,
  DollarSign,
  Barcode as BarcodeIcon,
  Check,
  Info,
  Flame,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchProductsAction, FetchCategoriesAction } from '../redux/actions/bakeryActions';
import { Product, LabelPrintOptions, LabelPrintItem } from '../types';
import { BarcodeSticker } from './BarcodeSticker';
import { sidebar as ta } from './Bakerylabels';

interface ProductLabelPrintingViewProps {
  products?: Product[];
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ProductLabelPrintingView: React.FC<ProductLabelPrintingViewProps> = ({
  products: initialProducts = [],
  onToast,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { ProductsData, ProductsLoad, CategoriesData } = useSelector((state: RootState) => state.bakery);

  useEffect(() => {
    if (!ProductsData?.length) {
      dispatch(FetchProductsAction({}));
    }
    if (!CategoriesData?.length) {
      dispatch(FetchCategoriesAction({}));
    }
  }, [dispatch, ProductsData?.length, CategoriesData?.length]);

  const effectiveProducts: Product[] = (ProductsData?.length ? ProductsData : initialProducts) as Product[];

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Multi-select & Copy counts
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>({});
  const [bulkCopyCount, setBulkCopyCount] = useState<number>(2);

  // Sticker Customization Options
  const todayIso = new Date().toISOString().split('T')[0];
  const [options, setOptions] = useState<LabelPrintOptions>({
    shopName: ta?.shop?.name || 'கனகராஜ் ஸ்வீட்ஸ்',
    showShopName: true,
    showPrice: true,
    showBarcode: true,
    showSkuText: true,
    showPackedDate: true,
    showWeightUnit: true,
    packedDate: todayIso,
  });

  // UI Views: Zoom, Preview Modes, Modals
  const [previewZoom, setPreviewZoom] = useState<number>(1.5); // 1.5x on screen makes 50x25mm comfortable to read
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  const [showPrinterHelpModal, setShowPrinterHelpModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'single' | 'roll'>('single');

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [effectiveProducts, selectedCategory, searchTerm]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    effectiveProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [effectiveProducts]);

  // Selected Products with Copies
  const selectedItems: LabelPrintItem[] = useMemo(() => {
    return effectiveProducts
      .filter((p) => selectedProductIds.has(String(p.id)))
      .map((product) => ({
        product,
        copies: Math.max(1, copiesMap[String(product.id)] ?? 1),
      }));
  }, [effectiveProducts, selectedProductIds, copiesMap]);

  // Total label stickers count
  const totalStickersCount = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.copies, 0);
  }, [selectedItems]);

  // Flattened array of all stickers to print (with copies expanded)
  const flattenedStickers: Product[] = useMemo(() => {
    const list: Product[] = [];
    selectedItems.forEach((item) => {
      for (let i = 0; i < item.copies; i++) {
        list.push(item.product);
      }
    });
    return list;
  }, [selectedItems]);

  // Keep preview index in bounds
  useEffect(() => {
    if (previewIndex >= selectedItems.length) {
      setPreviewIndex(Math.max(0, selectedItems.length - 1));
    }
  }, [selectedItems.length, previewIndex]);

  // Selection handlers
  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      const idStr = String(productId);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
        // Default to 1 copy if not set
        if (!copiesMap[idStr]) {
          setCopiesMap((m) => ({ ...m, [idStr]: 1 }));
        }
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      const newCopies = { ...copiesMap };
      filteredProducts.forEach((p) => {
        const idStr = String(p.id);
        next.add(idStr);
        if (!newCopies[idStr]) newCopies[idStr] = 1;
      });
      setCopiesMap(newCopies);
      return next;
    });
    if (onToast) {
      onToast('info', 'பொருட்கள் தேர்ந்தெடுக்கப்பட்டன', `${filteredProducts.length} பொருட்கள் லேபிள்களுக்கு சேர்க்கப்பட்டன`);
    }
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
    if (onToast) {
      onToast('info', 'தேர்வு நீக்கப்பட்டது', 'அனைத்து லேபிள் தேர்வுகளும் அழிக்கப்பட்டன');
    }
  };

  const handleSetCopyCount = (productId: string, val: number) => {
    const safeVal = Math.max(1, Math.min(999, Math.floor(val) || 1));
    setCopiesMap((prev) => ({
      ...prev,
      [String(productId)]: safeVal,
    }));
  };

  const handleApplyBulkCopies = () => {
    if (selectedProductIds.size === 0) {
      if (onToast) onToast('warning', 'பொருட்கள் இல்லை', 'முதலில் லேபிள் அச்சிட பொருட்களை தேர்வு செய்யவும்.');
      return;
    }
    const safeCopies = Math.max(1, bulkCopyCount);
    const updated = { ...copiesMap };
    selectedProductIds.forEach((id) => {
      updated[id] = safeCopies;
    });
    setCopiesMap(updated);
    if (onToast) {
      onToast('success', 'பிரதிகள் மாற்றப்பட்டன', `தேர்ந்தெடுக்கப்பட்ட அனைத்து பொருட்களுக்கும் ${safeCopies} பிரதிகள் நிர்ணயிக்கப்பட்டன`);
    }
  };

  // Trigger Print Function
  const handlePrint = () => {
    if (totalStickersCount === 0) {
      if (onToast) {
        onToast('warning', 'தேர்வு காலியாக உள்ளது', 'அச்சிட குறைந்தபட்சம் ஒரு பொருளை தேர்வு செய்யவும்');
      }
      return;
    }
    window.print();
  };

  // Preview current product sticker
  const activePreviewProduct = selectedItems[previewIndex]?.product || effectiveProducts[0];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE2E5] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#FFF4F6] text-[#C94F6D] border border-[#C94F6D]/20">
              <Tag className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29252A] tracking-tight">
                பொருள் பாக்ஸ் லேபிள் அச்சிடுதல் (Product Sticker Printing)
              </h1>
              <p className="text-xs sm:text-sm text-[#756B70] mt-0.5">
                50 mm × 25 mm தரநிலையான வெப்ப லேபிள்கள் (CODE128 பார்கோடு, பெயர், விலை, தேதி)
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Stats & Main CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPrinterHelpModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDE2E5] text-xs font-semibold text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] transition-colors cursor-pointer"
            title="Thermal Printer Settings & Size Setup"
          >
            <HelpCircle className="w-4 h-4 text-[#C94F6D]" />
            <span>பிரிண்டர் வழிகாட்டி (50×25mm)</span>
          </button>

          <button
            onClick={() => {
              if (totalStickersCount === 0) {
                if (onToast) onToast('warning', 'பொருட்கள் இல்லை', 'முதலில் பொருட்களை தேர்வு செய்யவும்');
                return;
              }
              setShowFullPreviewModal(true);
            }}
            disabled={totalStickersCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#C94F6D] text-[#C94F6D] font-bold text-sm hover:bg-[#FFF4F6] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>முழு முன்னோட்டம் ({totalStickersCount})</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={totalStickersCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C94F6D] to-[#A83D58] text-white font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>அச்சிடு ({totalStickersCount} லேபிள்கள்)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (xl:col-span-7): Product Selection, Search & Copies */}
        <div className="xl:col-span-7 space-y-4">
          {/* Search, Category & Batch Actions Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EDE2E5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#756B70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="பொருளின் பெயர், குறியீடு அல்லது பார்கோடைத் தேடுக..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EDE2E5] text-sm text-[#29252A] placeholder-[#756B70]/60 focus:outline-none focus:border-[#C94F6D] focus:ring-2 focus:ring-[#C94F6D]/15 bg-[#FFF9F5]/40"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Selection Summary Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF4F6] border border-[#C94F6D]/20 text-xs font-bold text-[#C94F6D] shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>{selectedProductIds.size} பொருட்கள் தேர்வு</span>
                <span className="text-gray-300">|</span>
                <span>{totalStickersCount} லேபிள்கள்</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#C94F6D] text-white shadow-2xs'
                      : 'bg-white border border-[#EDE2E5] text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D]'
                  }`}
                >
                  {cat === 'All' ? 'அனைத்து வகைகள்' : cat}
                </button>
              ))}
            </div>

            {/* Batch Selection & Copy Quick-Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EDE2E5]/70 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDE2E5] text-[#29252A] hover:bg-neutral-50 font-medium cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#C94F6D]" />
                  <span>அனைத்தும் தேர்வு ({filteredProducts.length})</span>
                </button>
                {selectedProductIds.size > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDE2E5] text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>நீக்கு</span>
                  </button>
                )}
              </div>

              {/* Quick Set Copies for Selected */}
              <div className="flex items-center gap-2">
                <span className="text-[#756B70] font-medium hidden sm:inline">தேர்வுக்கு பிரதிகள்:</span>
                <div className="flex items-center border border-[#EDE2E5] rounded-lg overflow-hidden bg-white">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={bulkCopyCount}
                    onChange={(e) => setBulkCopyCount(Number(e.target.value) || 1)}
                    className="w-12 text-center text-xs font-bold py-1 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyBulkCopies}
                    className="px-2.5 py-1 bg-[#C94F6D] text-white font-bold hover:brightness-105 cursor-pointer text-xs"
                  >
                    அமை
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setBulkCopyCount(num);
                        const updated = { ...copiesMap };
                        selectedProductIds.forEach((id) => (updated[id] = num));
                        setCopiesMap(updated);
                      }}
                      className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer text-xs"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Items Table / Cards */}
          <div className="bg-white rounded-2xl border border-[#EDE2E5] shadow-xs overflow-hidden">
            {ProductsLoad ? (
              <div className="py-16 text-center text-[#756B70] space-y-2">
                <div className="inline-block w-8 h-8 border-3 border-[#C94F6D] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">பொருட்கள் ஏற்றப்படுகின்றன...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-[#756B70] space-y-3 px-4">
                <Package className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-base font-semibold text-[#29252A]">பொருட்கள் எதுவும் கிடைக்கவில்லை</p>
                <p className="text-xs text-gray-500">வேறு பெயர் அல்லது வகையைத் தேர்ந்தெடுத்து முயற்சிக்கவும்.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDE2E5]/70 max-h-[620px] overflow-y-auto">
                {filteredProducts.map((p) => {
                  const idStr = String(p.id);
                  const isSelected = selectedProductIds.has(idStr);
                  const copies = copiesMap[idStr] ?? 1;
                  const barcodeVal = p.barcode || p.code || `PR-${p.id}`;

                  return (
                    <div
                      key={idStr}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 transition-colors ${
                        isSelected ? 'bg-[#FFF4F6]/50' : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {/* Left: Checkbox + Product Info */}
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                        onClick={() => handleToggleSelectProduct(idStr)}
                      >
                        <button
                          type="button"
                          className="text-[#C94F6D] shrink-0 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectProduct(idStr);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 fill-[#C94F6D] text-white" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-[#EDE2E5] overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Name, SKU, Category */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#29252A] truncate">
                              {p.name}
                            </span>
                            {p.isHighDemand && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#756B70]">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-medium text-gray-700">
                              {barcodeVal}
                            </span>
                            <span>•</span>
                            <span>{p.category || 'Bakery'}</span>
                            <span>•</span>
                            <span className="font-bold text-[#29252A]">
                              ₹{Number(p.sellingPrice).toFixed(0)} {p.unit ? `/${p.unit}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Copy Count Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                        <span className="text-xs text-[#756B70] sm:hidden">பிரதிகள் (Copies):</span>
                        <div className="flex items-center gap-1.5">
                          {/* Decrement */}
                          <button
                            type="button"
                            disabled={!isSelected || copies <= 1}
                            onClick={() => handleSetCopyCount(idStr, copies - 1)}
                            className="p-1 rounded-lg border border-[#EDE2E5] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Numeric input */}
                          <input
                            type="number"
                            min="1"
                            max="999"
                            disabled={!isSelected}
                            value={copies}
                            onChange={(e) => handleSetCopyCount(idStr, Number(e.target.value))}
                            className="w-12 py-1 text-center font-bold text-xs rounded-lg border border-[#EDE2E5] bg-white focus:outline-none focus:border-[#C94F6D] disabled:opacity-40"
                          />

                          {/* Increment */}
                          <button
                            type="button"
                            disabled={!isSelected}
                            onClick={() => handleSetCopyCount(idStr, copies + 1)}
                            className="p-1 rounded-lg border border-[#EDE2E5] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="hidden md:flex items-center gap-1">
                          {[2, 5, 10].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              disabled={!isSelected}
                              onClick={() => handleSetCopyCount(idStr, preset)}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                copies === preset
                                  ? 'bg-[#C94F6D] text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (xl:col-span-5): Sticker Preview & Customization Options */}
        <div className="xl:col-span-5 space-y-5 sticky top-20">
          {/* Live Thermal Sticker Preview Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE2E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE2E5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-extrabold text-[#29252A] uppercase tracking-wider">
                  நேரடி முன்னோட்டம் (50 × 25 mm)
                </h2>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(1.0, Number((z - 0.25).toFixed(2))))}
                  className="p-1 rounded hover:bg-white text-gray-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] text-gray-600 font-mono">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                  className="p-1 rounded hover:bg-white text-gray-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sticker Preview Mount Area */}
            <div className="bg-gradient-to-br from-[#FAEDE4]/50 via-white to-[#FFF4F6]/50 p-6 rounded-xl border border-dashed border-[#C94F6D]/30 flex flex-col items-center justify-center min-h-[220px] overflow-hidden relative">
              {/* Thermal label paper roll backdrop effect */}
              <div className="absolute inset-x-8 top-0 bottom-0 bg-yellow-50/70 border-x border-yellow-200/50 -z-0 pointer-events-none" />

              {activePreviewProduct ? (
                <div className="relative z-10 flex flex-col items-center">
                  {/* Single Sticker Card */}
                  <div
                    style={{
                      width: `${50 * previewZoom}mm`,
                      height: `${25 * previewZoom}mm`,
                    }}
                    className="transition-all duration-150 drop-shadow-md"
                  >
                    <BarcodeSticker
                      product={activePreviewProduct}
                      options={options}
                      previewScale={previewZoom}
                    />
                  </div>

                  {/* Physical ruler tag */}
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-white/90 px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
                    <span>அளவு: 50.0 mm × 25.0 mm (2" × 1")</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">CODE128 Scalable Vector</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 relative z-10">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">முன்னோட்டம் பார்க்க பொருளை தேர்வு செய்யவும்</p>
                </div>
              )}
            </div>

            {/* Carousel navigation if multiple products selected */}
            {selectedItems.length > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-[#756B70]">
                <button
                  onClick={() => setPreviewIndex((i) => (i > 0 ? i - 1 : selectedItems.length - 1))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>முந்தையது</span>
                </button>
                <span className="font-semibold text-[#29252A]">
                  பொருள் {previewIndex + 1} / {selectedItems.length}
                </span>
                <button
                  onClick={() => setPreviewIndex((i) => (i < selectedItems.length - 1 ? i + 1 : 0))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer font-medium"
                >
                  <span>அடுத்தது</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sticker Customization Options Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE2E5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EDE2E5]">
              <Sliders className="w-4 h-4 text-[#C94F6D]" />
              <h3 className="text-sm font-extrabold text-[#29252A]">
                லேபிள் அமைப்புகள் & விபரங்கள் (Label Options)
              </h3>
            </div>

            {/* Shop Brand Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">கடையின் பெயர் (Header Brand):</label>
              <input
                type="text"
                value={options.shopName}
                onChange={(e) => setOptions({ ...options, shopName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EDE2E5] text-[#29252A] focus:outline-none focus:border-[#C94F6D]"
                placeholder="எ.கா. கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்"
              />
            </div>

            {/* Packing Date Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">பேக் செய்த தேதி (Packed Date):</label>
              <input
                type="date"
                value={options.packedDate}
                onChange={(e) => setOptions({ ...options, packedDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EDE2E5] text-[#29252A] focus:outline-none focus:border-[#C94F6D]"
              />
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showShopName}
                  onChange={(e) => setOptions({ ...options, showShopName: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">கடை பெயர்</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showBarcode}
                  onChange={(e) => setOptions({ ...options, showBarcode: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">CODE128 பார்கோடு</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showSkuText}
                  onChange={(e) => setOptions({ ...options, showSkuText: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">SKU / குறியீடு எழுத்து</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showPrice}
                  onChange={(e) => setOptions({ ...options, showPrice: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">விற்பனை விலை (MRP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showPackedDate}
                  onChange={(e) => setOptions({ ...options, showPackedDate: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">பேக்கிங் தேதி (Pkd)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showWeightUnit}
                  onChange={(e) => setOptions({ ...options, showWeightUnit: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">அளவீட்டு அலகு (Kg/Pcs)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fullscreen / Modal Preview of all generated stickers */}
      {showFullPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#EDE2E5] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-white to-[#FFF9F5] border-b border-[#EDE2E5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#C94F6D]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#29252A]">
                    லேபிள் முன்னோட்டம் & அச்சுப் பட்டியல் ({totalStickersCount} லேபிள்கள்)
                  </h3>
                  <p className="text-xs text-[#756B70]">
                    50 × 25 mm தொடர் தெர்மல் லேபிள் தாள் முன்னோட்டம் (WYSIWYG Print Preview)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C94F6D] text-white font-bold text-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>அச்சிடு ({totalStickersCount})</span>
                </button>
                <button
                  onClick={() => setShowFullPreviewModal(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Multi-Sticker Grid / Roll */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] bg-[#FAFAFA] space-y-6">
              {/* Roll length estimate box */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    மொத்த லேபிள்கள்: <b>{totalStickersCount} எண்ணிக்கை</b> • ரோல் நீளம்:{' '}
                    <b>{(totalStickersCount * 2.8).toFixed(1)} செ.மீ (தோராயமாக)</b>
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-700">50 mm × 25 mm Paper</span>
              </div>

              {/* Grid of 50mm x 25mm stickers with realistic visual gap */}
              <div className="flex flex-wrap gap-4 justify-center items-start">
                {flattenedStickers.map((product, idx) => (
                  <div key={`${product.id}-${idx}`} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                    <div
                      style={{
                        width: '50mm',
                        height: '25mm',
                      }}
                      className="drop-shadow-sm transition-transform hover:scale-105"
                    >
                      <BarcodeSticker
                        product={product}
                        options={options}
                        previewScale={1.0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Thermal Printer Setup Help Modal */}
      {showPrinterHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#EDE2E5] overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#C94F6D]" />
                <h3 className="font-extrabold text-base text-[#29252A]">
                  தெர்மல் பிரிண்டர் அமைப்புகள் (Thermal Printer Settings)
                </h3>
              </div>
              <button
                onClick={() => setShowPrinterHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#29252A]">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold">முக்கியமான பிரிண்ட் அமைப்பு விதிகள்:</p>
                <p>
                  பிரவுசர் பிரிண்ட் விண்டோவில் (Ctrl + P) பின்வரும் அமைப்புகளை தேர்வு செய்வதை உறுதி செய்யவும்:
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-[#C94F6D] pl-3 py-1">
                <div className="flex justify-between">
                  <span className="font-bold">தாள் அளவு (Paper Size):</span>
                  <span className="font-mono font-bold text-[#C94F6D]">50 mm × 25 mm (2" × 1")</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">விளிம்பு (Margins):</span>
                  <span className="font-mono text-gray-700">None (0 mm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">அளவீடு (Scale):</span>
                  <span className="font-mono text-gray-700">100% அல்லது Fit to Paper</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Headers & Footers:</span>
                  <span className="font-mono text-red-600">Uncheck (டிக் எடுக்கவும்)</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                இந்த லேபிள் மாட்யூல் TSC, Zebra, TVS, Xprinter, Citizen உள்ளிட்ட அனைத்து தரநிலையான 203/300
                DPI தெர்மல் பார்கோடு லேபிள் பிரிண்டர்களுடனும் இணக்கமானது.
              </p>
            </div>

            <button
              onClick={() => setShowPrinterHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#C94F6D] text-white font-bold text-xs hover:brightness-105 cursor-pointer"
            >
              புரிந்தது (Close)
            </button>
          </div>
        </div>
      )}

      {/* 5. DEDICATED PRINT PORTAL & SCOPED PRINT CSS FOR 50x25mm THERMAL LABELS */}
      <style>{`
        @media print {
          @page {
            size: 50mm 25mm !important;
            margin: 0mm !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 50mm !important;
            height: 25mm !important;
          }

          /* Hide all normal UI during print */
          body > * {
            visibility: hidden !important;
          }

          /* Show only the label print container */
          #label-print-portal,
          #label-print-portal * {
            visibility: visible !important;
          }

          #label-print-portal {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 50mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }

          .label-sticker-page {
            width: 50mm !important;
            height: 25mm !important;
            max-width: 50mm !important;
            max-height: 25mm !important;
            min-width: 50mm !important;
            min-height: 25mm !important;
            margin: 0 !important;
            padding: 1.2mm 1.5mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* This element is hidden on screen and exclusively rendered on @media print */}
      <div id="label-print-portal" className="print-only">
        {flattenedStickers.map((product, idx) => (
          <BarcodeSticker
            key={`print-${product.id}-${idx}`}
            product={product}
            options={options}
            isPrint={true}
          />
        ))}
      </div>
    </div>
  );
};
