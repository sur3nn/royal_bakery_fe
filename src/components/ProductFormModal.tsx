import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PackagePlus, 
  Image as ImageIcon, 
  Upload, 
  Camera, 
  Link as LinkIcon, 
  Check, 
  Trash2, 
  Sparkles,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Product } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchCategoriesAction, FetchUnitsAction } from '../redux/actions/bakeryActions';
import { bakeryLabels as t } from '../components/Bakerylabels';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

// Curated high-resolution bakery and Indian confectionery presets
const BAKERY_IMAGE_PRESETS = [
  {
    name: 'Ghee Laddu',
    category: 'Fresh Sweets',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kaju Katli',
    category: 'Dry Fruit Sweets',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mysore Pak',
    category: 'Fresh Sweets',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gulab Jamun',
    category: 'Fresh Sweets',
    url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Dutch Truffle Cake',
    category: 'Cakes & Pastries',
    url: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Strawberry Cake',
    category: 'Cakes & Pastries',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Butter Murukku',
    category: 'Savories & Snacks',
    url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Crispy Samosa',
    category: 'Savories & Snacks',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kesar Peda',
    category: 'Milk Sweets',
    url: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Badam Milk / Drink',
    category: 'Beverages & Chaat',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Confectionery Gift Box',
    category: 'Fresh Sweets',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fresh Oven Pastry',
    category: 'Cakes & Pastries',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
  }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Product['category']>('Fresh Sweets');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [unit, setUnit] = useState<Product['unit']>('Kg');
  const [gstRate, setGstRate] = useState<number>(5);
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [image, setImage] = useState('');
  const [hsnCode, setHsnCode] = useState('21069099');
  const [isHighDemand, setIsHighDemand] = useState(false);

  // Image mode tabs: 'presets' | 'upload' | 'url'
  const [imageTab, setImageTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();
const { CategoriesData, UnitsData } = useSelector((state: RootState) => state.bakery);
useEffect(() => {
  if (!isOpen) return;
  if (!CategoriesData?.length) dispatch(FetchCategoriesAction({}));
  if (!UnitsData?.length) dispatch(FetchUnitsAction({}));
}, [isOpen, dispatch]);

useEffect(() => {
  if (productToEdit) {
    setName(productToEdit.name);
    setCode(productToEdit.code);
    setCategory(productToEdit.category);
    setSellingPrice(productToEdit.sellingPrice);
    setCostPrice(productToEdit.costPrice);
    setUnit(productToEdit.unit);
    setGstRate(productToEdit.gstRate);
    setStock(productToEdit.stock);
    setMinStock(productToEdit.minStock);
    setImage(productToEdit.image);
    setHsnCode(productToEdit.hsnCode ?? '');
    setIsHighDemand(!!productToEdit.isHighDemand);
    setImageError(false);
  } else {
    setName('');
    setCode(`PR-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(CategoriesData?.[0]?.name ?? '');
    setSellingPrice(0);
    setCostPrice(0);
    setUnit(UnitsData?.[0]?.shortCode ?? '');
    setGstRate(5);
    setStock(0);
    setMinStock(0);
    setImage('');
    setHsnCode('');
    setIsHighDemand(false);
    setImageError(false);
  }
}, [productToEdit, isOpen, CategoriesData, UnitsData]);

  if (!isOpen) return null;

  // Process uploaded image file with automatic compression for fast local storage
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setImage(compressed);
        } else {
          setImage(dataUrl);
        }
        setImageError(false);
      };
      img.onerror = () => {
        setImage(dataUrl);
        setImageError(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newOrUpdated: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      code: code || `SW-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      unit,
      gstRate: Number(gstRate),
      stock: Number(stock),
      minStock: Number(minStock),
      image: image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
      hsnCode: hsnCode || '21069099',
      isHighDemand,
    };

    onSave(newOrUpdated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border-2 border-[#EDE2E5] overflow-hidden animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center shrink-0">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#29252A]">
                {productToEdit ? t.editProduct : t.addProduct}
              </h3>
              <p className="text-sm text-[#756B70] mt-0.5">
                {t.formSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.cancel}
            className="p-2.5 rounded-xl text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-7 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* PRODUCT IMAGE STUDIO (Upload, Presets, URL, & Live Preview) */}
          {/* ========================================================= */}
          <div className="bg-[#FFF9F5]/70 rounded-2xl p-5 border-2 border-[#EDE2E5]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-[#C94F6D]" />
                <span className="text-base font-bold text-[#29252A]">{t.imageSectionTitle}</span>
              </div>

              {/* Image method switch pills */}
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border-2 border-[#EDE2E5] text-sm">
                <button
                  type="button"
                  onClick={() => setImageTab('presets')}
                  className={`px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    imageTab === 'presets'
                      ? 'bg-[#FFF0F3] text-[#C94F6D]'
                      : 'text-[#756B70] hover:text-[#29252A]'
                  }`}
                >
                  {t.tabPresets}
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    imageTab === 'upload'
                      ? 'bg-[#FFF0F3] text-[#C94F6D]'
                      : 'text-[#756B70] hover:text-[#29252A]'
                  }`}
                >
                  {t.tabUpload}
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    imageTab === 'url'
                      ? 'bg-[#FFF0F3] text-[#C94F6D]'
                      : 'text-[#756B70] hover:text-[#29252A]'
                  }`}
                >
                  {t.tabUrl}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Image Preview Box */}
              <div className="sm:col-span-4 flex flex-col items-center">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative w-44 h-44 rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center bg-white shadow-sm group ${
                    isDragging 
                      ? 'border-[#C94F6D] ring-4 ring-[#FCE7EC] scale-102' 
                      : 'border-[#EDE2E5]'
                  }`}
                >
                  {image && !imageError ? (
                    <>
                      <img
                        src={image}
                        alt={t.productPreviewAlt}
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 rounded-xl bg-white/90 text-[#29252A] hover:bg-[#C94F6D] hover:text-white transition-colors shadow-xs"
                          title={t.uploadNewImage}
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImage('');
                            setImageError(false);
                          }}
                          className="p-3 rounded-xl bg-white/90 text-[#D9535F] hover:bg-[#D9535F] hover:text-white transition-colors shadow-xs"
                          title={t.removeImage}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 text-center cursor-pointer flex flex-col items-center gap-2 text-[#756B70] hover:text-[#C94F6D]"
                    >
                      <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-sm font-bold leading-snug">{t.clickOrDrop}</span>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-[#756B70] mt-2 font-semibold text-center">
                  {t.livePreview}
                </span>
              </div>

              {/* Dynamic Image Input Controls */}
              <div className="sm:col-span-8 space-y-3">
                {/* 1. Presets Mode */}
                {imageTab === 'presets' && (
                  <div>
                    <p className="text-sm font-semibold text-[#756B70] mb-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D9A441]" />
                      <span>{t.choosePreset}</span>
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                      {BAKERY_IMAGE_PRESETS.map((preset, idx) => {
                        const isSelected = image === preset.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImage(preset.url);
                              setImageError(false);
                            }}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left flex flex-col items-center p-1.5 bg-white cursor-pointer ${
                              isSelected
                                ? 'border-[#C94F6D] ring-2 ring-[#FCE7EC] shadow-xs'
                                : 'border-[#EDE2E5] hover:border-[#C94F6D]/50'
                            }`}
                            title={preset.name}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <span className="text-[11px] font-semibold text-[#29252A] mt-1 truncate w-full text-center leading-tight">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C94F6D] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. File Upload Mode */}
                {imageTab === 'upload' && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#756B70]">
                      {t.uploadInstruction}
                    </p>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#EDE2E5] hover:border-[#C94F6D] rounded-xl p-6 text-center bg-white cursor-pointer transition-colors"
                    >
                      <Upload className="w-8 h-8 text-[#C94F6D] mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#29252A]">
                        {t.clickToSelect}
                      </p>
                      <p className="text-xs text-[#756B70] mt-1">
                        {t.autoCompress}
                      </p>
                    </div>
                    {image.startsWith('data:') && (
                      <p className="text-sm font-semibold text-[#3FA56B] flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> {t.uploadSuccess}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Direct URL Mode */}
                {imageTab === 'url' && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold text-[#756B70]">
                      {t.pasteUrl}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-5 h-5 text-[#756B70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => {
                            setImage(e.target.value);
                            setImageError(false);
                          }}
                          placeholder={t.urlPlaceholder}
                          className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] outline-none"
                        />
                      </div>
                      {image && (
                        <button
                          type="button"
                          onClick={() => {
                            setImage('');
                            setImageError(false);
                          }}
                          className="p-3 text-[#756B70] hover:text-[#D9535F] hover:bg-white rounded-xl border-2 border-[#EDE2E5] cursor-pointer"
                          title={t.clearLink}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {imageError && (
                      <p className="text-sm text-[#D9535F]">
                        {t.urlError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Standard Product Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.productName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.productNamePlaceholder}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.productCode}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.productCodePlaceholder}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>
          </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
  <div>
    <label className="text-sm font-bold text-[#29252A] block mb-2">
      {t.category}
    </label>
    <div className="relative">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as Product['category'])}
        className="w-full appearance-none px-4 py-3.5 pr-10 bg-[#FFF9F5] border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base font-semibold text-[#29252A] hover:border-[#F3C6D1] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none transition-all cursor-pointer"
      >
        {(CategoriesData || []).map((c: any) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 text-[#C94F6D] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>

  <div>
    <label className="text-sm font-bold text-[#29252A] block mb-2">
      {t.unit}
    </label>
    <div className="relative">
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as Product['unit'])}
        className="w-full appearance-none px-4 py-3.5 pr-10 bg-[#FFF9F5] border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base font-semibold text-[#29252A] hover:border-[#F3C6D1] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none transition-all cursor-pointer"
      >
        {(UnitsData || []).map((u: any) => (
          <option key={u.id} value={u.shortCode}>{u.displayLabel}</option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 text-[#C94F6D] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>
</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.sellingPrice}
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] font-semibold focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.costPrice}
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.gstRate}
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none cursor-pointer"
              >
                <option value={0}>{t.gstNil}</option>
                <option value={5}>{t.gstStandard}</option>
                <option value={12}>{t.gstConfectionery}</option>
                <option value={18}>{t.gstLuxury}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.currentStock} ({unit}) *
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.lowStockLimit} ({unit})
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />
            </div>
          </div>

          <label
            htmlFor="highDemandCheck"
            className="flex items-center gap-3.5 p-4 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5] cursor-pointer"
          >
            <input
              type="checkbox"
              id="highDemandCheck"
              checked={isHighDemand}
              onChange={(e) => setIsHighDemand(e.target.checked)}
              className="w-6 h-6 rounded text-[#C94F6D] focus:ring-[#C94F6D] border-[#EDE2E5] cursor-pointer shrink-0"
            />
            <span className="text-sm font-semibold text-[#29252A]">
              {t.highDemand}
            </span>
          </label>

          {/* Footer actions */}
          <div className="pt-5 border-t-2 border-[#EDE2E5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-xl bg-white border-2 border-[#EDE2E5] hover:bg-[#FFF4F6] text-sm font-bold text-[#756B70] transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer"
            >
              {productToEdit ? t.saveChanges : t.addToInventory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};