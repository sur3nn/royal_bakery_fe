import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Info,
  Plus,
  Minus,
  Columns2
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

  // Auto-select products by default when products load so preview & print are ready
  useEffect(() => {
    if (effectiveProducts.length > 0 && selectedProductIds.size === 0) {
      const initialIds = new Set<string>();
      const initialCopies: Record<string, number> = {};
      effectiveProducts.forEach((p) => {
        const idStr = String(p.id);
        initialIds.add(idStr);
        initialCopies[idStr] = 1;
      });
      setSelectedProductIds(initialIds);
      setCopiesMap(initialCopies);
    }
  }, [effectiveProducts.length]);

  // Print Format Layout: 'a4-sheet-2col' (2 columns filling paper height) vs 'thermal-roll-2col' (104x25mm per feed)
  const [printLayout, setPrintLayout] = useState<'a4-sheet-2col' | 'thermal-roll-2col'>('a4-sheet-2col');

  // Sticker Customization Options (Clean Product Label: Shop Name + Product Name)
  const todayIso = new Date().toISOString().split('T')[0];
  const [options, setOptions] = useState<LabelPrintOptions>({
    shopName: ta?.shop?.name || 'கனகராஜ் ஸ்வீட்ஸ்',
    showShopName: true,
    showPrice: false,
    showBarcode: false,
    showSkuText: false,
    showPackedDate: false,
    showWeightUnit: false,
    packedDate: todayIso,
  });

  // UI Views: Zoom, Preview Modes, Modals
  const [previewZoom, setPreviewZoom] = useState<number>(1.25);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  const [showPrinterHelpModal, setShowPrinterHelpModal] = useState(false);

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
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
    if (list.length === 0 && effectiveProducts.length > 0) {
      list.push(effectiveProducts[0]);
    }
    return list;
  }, [selectedItems, effectiveProducts]);

  // Group stickers into 2-column rows for thermal roll printing
  const stickerRows: { col1: Product; col2?: Product }[] = useMemo(() => {
    const rows: { col1: Product; col2?: Product }[] = [];
    for (let i = 0; i < flattenedStickers.length; i += 2) {
      rows.push({
        col1: flattenedStickers[i],
        col2: flattenedStickers[i + 1] || undefined,
      });
    }
    return rows;
  }, [flattenedStickers]);

  // Selection handlers
  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      const idStr = String(productId);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
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
    if (flattenedStickers.length === 0) {
      if (onToast) {
        onToast('warning', 'தேர்வு காலியாக உள்ளது', 'அச்சிட குறைந்தபட்சம் ஒரு பொருளை தேர்வு செய்யவும்');
      }
      return;
    }
    window.print();
  };

  // Preview first pair of products
  const previewCol1 = stickerRows[0]?.col1 || effectiveProducts[0];
  const previewCol2 = stickerRows[0]?.col2 || effectiveProducts[1] || effectiveProducts[0];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#EDE2E5] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#FFF4F6] text-[#C94F6D] border border-[#C94F6D]/20">
              <Columns2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29252A] tracking-tight">
                பொருள் பாக்ஸ் லேபிள் அச்சிடுதல் (2-Column Thermal Roll)
              </h1>
              <p className="text-xs sm:text-sm text-[#756B70] mt-0.5">
                தெர்மல் ரோல் அடிப்படையிலான 2 நெடுவரிசை லேபிள்கள் (2-Up Thermal Label Roll • 50 mm × 25 mm)
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Stats, Layout Selector & Main CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Switcher: 2-Column Thermal Roll vs 2-Column A4 */}
          <div className="flex items-center bg-[#FFF9F5] p-1 rounded-xl border border-[#EDE2E5] text-xs font-bold">
            <button
              type="button"
              onClick={() => setPrintLayout('a4-sheet-2col')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                printLayout === 'a4-sheet-2col'
                  ? 'bg-[#C94F6D] text-white shadow-2xs'
                  : 'text-[#756B70] hover:text-[#C94F6D]'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>A4 தாள் (2 வரிசை • முழு உயரம்)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintLayout('thermal-roll-2col')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                printLayout === 'thermal-roll-2col'
                  ? 'bg-[#C94F6D] text-white shadow-2xs'
                  : 'text-[#756B70] hover:text-[#C94F6D]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>தெர்மல் ரோல் (104mm × 25mm)</span>
            </button>
          </div>

          <button
            onClick={() => setShowPrinterHelpModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDE2E5] text-xs font-semibold text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] transition-colors cursor-pointer"
            title="Printer Settings Guide"
          >
            <HelpCircle className="w-4 h-4 text-[#C94F6D]" />
            <span>வழிகாட்டி</span>
          </button>

          <button
            onClick={() => {
              if (flattenedStickers.length === 0) {
                if (onToast) onToast('warning', 'பொருட்கள் இல்லை', 'முதலில் பொருட்களை தேர்வு செய்யவும்');
                return;
              }
              setShowFullPreviewModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#C94F6D] text-[#C94F6D] font-bold text-sm hover:bg-[#FFF4F6] transition-all cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>முழு ரோல் ({flattenedStickers.length})</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C94F6D] to-[#A83D58] text-white font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>அச்சிடு ({flattenedStickers.length} லேபிள்கள்)</span>
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
                  placeholder="பொருளின் பெயர் அல்லது குறியீட்டைத் தேடுக..."
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
                <span>{flattenedStickers.length} லேபிள்கள் ({stickerRows.length} வரிசைகள்)</span>
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

                        {/* Name, Price, Category */}
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

        {/* Right Column (xl:col-span-5): 2-Column Thermal Roll Preview & Customization Options */}
        <div className="xl:col-span-5 space-y-5 sticky top-20">
          {/* Live 2-Column Thermal Roll Preview Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE2E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE2E5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-extrabold text-[#29252A] uppercase tracking-wider">
                  நேரடி 2-வரிசை ரோல் முன்னோட்டம் (2-Up Roll)
                </h2>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))))}
                  className="p-1 rounded hover:bg-white text-gray-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] text-gray-600 font-mono">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                  className="p-1 rounded hover:bg-white text-gray-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated 2-Column Thermal Label Roll Carrier */}
            <div className="bg-gradient-to-b from-[#FFFDF0] via-[#FFFBEB] to-[#FFFDF0] p-4 sm:p-5 rounded-xl border border-[#E5E0C0] flex flex-col items-center justify-center min-h-[220px] overflow-hidden relative shadow-inner">
              <div className="text-[10px] font-bold text-amber-800/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>← 50 mm (Col 1) →</span>
                <span className="text-amber-500">•</span>
                <span>← 50 mm (Col 2) →</span>
              </div>

              {previewCol1 ? (
                <div className="relative z-10 flex flex-col items-center">
                  {/* Pair of 2 stickers side by side on the thermal roll */}
                  <div
                    style={{
                      transform: `scale(${previewZoom})`,
                      transformOrigin: 'center center',
                    }}
                    className="flex items-center gap-2 transition-all duration-150 drop-shadow-md my-2"
                  >
                    <BarcodeSticker
                      product={previewCol1}
                      options={options}
                      previewScale={1.0}
                      isA4Sheet={false}
                    />
                    <BarcodeSticker
                      product={previewCol2}
                      options={options}
                      previewScale={1.0}
                      isA4Sheet={false}
                    />
                  </div>

                  {/* Physical ruler tag */}
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-gray-700 bg-white/95 px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                    <span>அளவு: 2 நெடுவரிசை • 104 mm × 25 mm ரோல்</span>
                    <span>•</span>
                    <span className="text-[#C94F6D] font-bold">2-Up Thermal Roll</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 relative z-10">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">முன்னோட்டம் பார்க்க பொருளை தேர்வு செய்யவும்</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              ஒவ்வொரு வரிசையிலும் பக்கவாட்டில் 2 லேபிள்கள் அச்சிடப்படும் (2 stickers per feed across the roll).
            </p>
          </div>

          {/* Sticker Customization Options Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#EDE2E5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EDE2E5]">
              <Sliders className="w-4 h-4 text-[#C94F6D]" />
              <h3 className="text-sm font-extrabold text-[#29252A]">
                லேபிள் அமைப்புகள் (Label Options)
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

            {/* Brand Toggle Switch */}
            <div className="pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.showShopName}
                  onChange={(e) => setOptions({ ...options, showShopName: e.target.checked })}
                  className="rounded text-[#C94F6D] focus:ring-[#C94F6D]"
                />
                <span className="font-semibold text-gray-700">கடை பெயர் காட்டுக (Show Brand Header)</span>
              </label>
            </div>

            {/* Clean Label Info Notice */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>சுத்தமான லேபிள் வடிவம்:</b> MRP விலை, பேக்கிங் தேதி மற்றும் எடை அலகு நீக்கப்பட்டு கடையின் பெயர் மற்றும் பெரிய தடிமனான பொருளின் பெயர் மட்டுமே ஸ்டிக்கரில் அச்சிடப்படும்.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fullscreen / Modal Preview of 2-Column Thermal Roll */}
      {showFullPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-[#EDE2E5] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-white to-[#FFF9F5] border-b border-[#EDE2E5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#C94F6D]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#29252A]">
                    2-வரிசை தெர்மல் ரோல் முன்னோட்டம் ({flattenedStickers.length} லேபிள்கள் • {stickerRows.length} வரிசைகள்)
                  </h3>
                  <p className="text-xs text-[#756B70]">
                    2-Up Thermal Label Roll (104 mm × 25 mm Feed • 2 Columns Side-by-Side)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C94F6D] text-white font-bold text-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>அச்சிடு ({flattenedStickers.length})</span>
                </button>
                <button
                  onClick={() => setShowFullPreviewModal(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Realistic 2-Column Continuous Thermal Roll */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-130px)] bg-[#F5F5F0] space-y-4 flex flex-col items-center">
              {/* Roll length estimate box */}
              <div className="w-full max-w-[550px] p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    மொத்த லேபிள்கள்: <b>{flattenedStickers.length}</b> • வரிசைகள்: <b>{stickerRows.length} ரோல் ஃபீட்</b>
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-800">104 mm × 25 mm Roll</span>
              </div>

              {/* Realistic 2-column continuous thermal label backing paper */}
              <div className="w-full max-w-[550px] bg-[#FFFBEB] p-5 sm:p-6 rounded-2xl border-x-4 border-dashed border-[#D6CDA4] shadow-md flex flex-col items-center gap-3">
                <div className="text-[10px] font-bold text-amber-800/50 uppercase tracking-widest pb-1 border-b border-amber-200/60 w-full text-center">
                  2-Up Continuous Thermal Sticker Paper
                </div>

                {stickerRows.map((row, idx) => (
                  <div key={`modal-row-${idx}`} className="flex flex-col items-center w-full">
                    <div className="flex items-center justify-between w-full text-[9px] font-mono text-amber-800/40 px-2 pb-0.5">
                      <span>வரிசை #{idx + 1}</span>
                      <span>25 mm feed</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="drop-shadow-xs">
                        <BarcodeSticker
                          product={row.col1}
                          options={options}
                          previewScale={1.0}
                          isA4Sheet={false}
                        />
                      </div>

                      {row.col2 ? (
                        <div className="drop-shadow-xs">
                          <BarcodeSticker
                            product={row.col2}
                            options={options}
                            previewScale={1.0}
                            isA4Sheet={false}
                          />
                        </div>
                      ) : (
                        <div
                          style={{ width: '50mm', height: '25mm' }}
                          className="border border-dashed border-amber-300 rounded-[1.5mm] flex items-center justify-center text-[10px] text-amber-500/50"
                        >
                          (Empty)
                        </div>
                      )}
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
                  2-வரிசை தெர்மல் பிரிண்டர் அமைப்புகள்
                </h3>
              </div>
              <button
                onClick={() => setShowPrinterHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#29252A]">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                <p className="font-bold">2-நெடுவரிசை தெர்மல் ரோல் (2-Up Thermal Roll • 50 mm × 25 mm):</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>தாள் அகலம் (Paper Width): <b>104 mm</b> (2 labels: 50mm + 50mm + 4mm gap)</li>
                  <li>தாள் உயரம் (Label Height): <b>25 mm</b></li>
                  <li>விளிம்புகள் (Margins): <b>None (0 mm)</b></li>
                  <li>அளவீடு (Scale): <b>100%</b></li>
                  <li>Headers & Footers: <b>Uncheck (டிக் எடுக்கவும்)</b></li>
                </ul>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                இந்த 2-நெடுவரிசை அமைப்பு TSC, Zebra, TVS, Xprinter உள்ளிட்ட அனைத்து 4-அங்குல (4-inch / 104mm)
                தெர்மல் லேபிள் பிரிண்டர்களுடனும் துல்லியமாக பொருந்தும்.
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

      {/* 5. DEDICATED 2-COLUMN PRINT CSS & PORTAL (ZERO HALF-CUT & PAPER-HEIGHT ELIGIBLE) */}
      <style>{`
        @media print {
          /* Remove the whole application layout tree from print */
          #root {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
          }

          #label-print-portal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            text-align: left !important;
          }

          ${
            printLayout === 'a4-sheet-2col'
              ? `
              @page {
                size: A4 portrait !important;
                margin: 5mm 0mm 5mm 0mm !important;
              }

              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                text-align: left !important;
              }

              #label-print-portal {
                width: 100% !important;
                max-width: 110mm !important;
                margin: 0 !important;
                padding: 0 !important;
                text-align: left !important;
              }

              .label-print-row-wrap {
                display: block !important;
                width: auto !important;
                margin: 0 0 2.5mm 0 !important;
                padding: 0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                break-inside: avoid-page !important;
                page-break-after: auto !important;
                break-after: auto !important;
                text-align: left !important;
              }

              .label-print-table {
                width: auto !important;
                border-collapse: collapse !important;
                margin: 0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                break-inside: avoid-page !important;
                text-align: left !important;
              }

              .label-print-table tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                break-inside: avoid-page !important;
                height: 25mm !important;
                text-align: left !important;
              }

              .label-col-cell {
                width: 50mm !important;
                height: 25mm !important;
                padding: 0 3mm 0 0 !important;
                vertical-align: top !important;
                text-align: left !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              .label-sticker-page {
                width: 50mm !important;
                height: 25mm !important;
                max-width: 50mm !important;
                max-height: 25mm !important;
                min-width: 50mm !important;
                min-height: 25mm !important;
                display: block !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                border: 0.5pt solid #d1d5db !important;
                border-radius: 1mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            `
              : `
              @page {
                size: 104mm 25mm !important;
                margin: 0mm !important;
              }

              html, body {
                width: 104mm !important;
                margin: 0 !important;
                padding: 0 !important;
                text-align: left !important;
              }

              #label-print-portal {
                width: 104mm !important;
                margin: 0 !important;
                padding: 0 !important;
                text-align: left !important;
              }

              .label-print-row-wrap {
                display: block !important;
                width: 104mm !important;
                height: 25mm !important;
                max-height: 25mm !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                text-align: left !important;
              }

              .label-print-table {
                width: 104mm !important;
                border-collapse: collapse !important;
                margin: 0 !important;
                text-align: left !important;
              }

              .label-col-cell {
                width: 50mm !important;
                height: 25mm !important;
                padding: 0 2mm 0 0 !important;
                vertical-align: top !important;
                text-align: left !important;
              }

              .label-sticker-page {
                width: 50mm !important;
                height: 25mm !important;
                max-width: 50mm !important;
                max-height: 25mm !important;
                min-width: 50mm !important;
                min-height: 25mm !important;
                display: block !important;
                margin: 0 !important;
                padding: 0.8mm 1.5mm 0.5mm 1.5mm !important;
                box-sizing: border-box !important;
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
            `
          }
        }
      `}</style>

      {/* Render directly to document.body via createPortal: 2 columns per row with table anti-split */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            id="label-print-portal"
            className={`print-only ${printLayout}`}
            style={{ textAlign: 'left', margin: 0, padding: 0 }}
          >
            {stickerRows.map((row, rowIdx) => (
              <div key={`row-${rowIdx}`} className="label-print-row-wrap" style={{ textAlign: 'left', margin: 0 }}>
                <table className="label-print-table" style={{ textAlign: 'left', margin: 0 }}>
                  <tbody>
                    <tr>
                      <td className="label-col-cell" style={{ textAlign: 'left', padding: '0 3mm 0 0' }}>
                        <div style={{ display: 'block', width: '50mm', height: '25mm', margin: 0 }}>
                          <BarcodeSticker
                            product={row.col1}
                            options={options}
                            isPrint={true}
                            isA4Sheet={printLayout === 'a4-sheet-2col'}
                          />
                        </div>
                      </td>
                      <td className="label-col-cell" style={{ textAlign: 'left', padding: 0 }}>
                        {row.col2 ? (
                          <div style={{ display: 'block', width: '50mm', height: '25mm', margin: 0 }}>
                            <BarcodeSticker
                              product={row.col2}
                              options={options}
                              isPrint={true}
                              isA4Sheet={printLayout === 'a4-sheet-2col'}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'block', width: '50mm', height: '25mm', margin: 0 }} />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
