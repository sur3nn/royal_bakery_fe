import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Clock, User, Pencil, Search, ChevronLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { BulkOrder, BulkOrderStatus, Product } from '../types';
import {
  FetchProductsAction,
  CreateBulkOrderAction,
  FetchBulkOrdersAction,
  FetchDashboardAction,
  FetchBulkOrderStatusesAction,
} from '../redux/actions/bakeryActions';
import { RootState } from '../redux/store';
import { bulkOrderLabels as t } from '../components/Bakerylabels';

interface BulkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Labels for the item popup (move these into Bakerylabels if you like)
const box = {
  boxes: 'பெட்டி',
  total: 'மொத்தம்',
  needSize: 'Add at least one item with a box size.',
  next: 'அடுத்து',
  back: 'பின்',
  add: 'ஆர்டரில் சேர்',
  save: 'சேமி',
  cancel: 'ரத்து',
  pickProduct: 'எந்த பொருள்?',
  pickProductEn: 'Choose the product',
  searchProduct: 'Search product...',
  howManyTitle: (unit: string) => `எத்தனை ${unit} தயாரிக்க வேண்டும்?`,
  howManyEn: 'How much do we need to prepare in total? (type in kg or g)',
  perBoxTitle: (unit: string) => `ஒரு பெட்டியில் எத்தனை ${unit}?`,
  edit: 'மாற்று',
  noItems: 'இன்னும் பொருள் எதுவும் இல்லை',
  noItemsEn: 'Tap to add the first item',
  other: 'மற்றவை',
  otherEn: 'Type',
  typeBoxSize: 'Type the box size',
  remaining: 'மீதம்',
  tapSizes: 'Tap a size to add a box. You can mix sizes.',
  addBox: 'Add',
  mustFill: 'Fill the full weight to save',
  tooBig: 'Larger than the remaining weight',
};

// ---------- Weight (kg) helpers ----------
const WEIGHT_OPTIONS = [
  { label: '250 gm', qty: 0.25 },
  { label: '500 gm', qty: 0.5 },
  { label: '1 kg', qty: 1 },
];
const COUNT_BOX_OPTIONS = [1, 2, 6, 12];

const isKgUnit = (unit?: string) =>
  ['kg', 'kgs', 'kilogram', 'kilograms'].includes(String(unit || '').trim().toLowerCase());

// 0.25 -> "250 gm", 1.5 -> "1.5 kg"; non-kg units are shown as-is
const formatQty = (qty: number, unit?: string) => {
  if (!isKgUnit(unit)) return `${qty} ${unit || ''}`.trim();
  return qty < 1 ? `${Math.round(qty * 1000)} gm` : `${+qty.toFixed(3)} kg`;
};

// Integer grams (avoids floating point surprises, works down to 1 gram)
const grams = (x: number) => Math.round(x * 1000);

const getCurrentDate = (): string => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const getCurrentTime = (): string => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

// One line of the order.
// quantity = packSize x packCount  (kitchen makes this much)
// packSize and packCount           (packing team packs this)
// For kg products packSize is in kg: 0.25 / 0.5 / 1 / any typed value
// A product with several box sizes is saved as several lines (one per box size).
type OrderItem = {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  packSize: number;
  packCount: number;
  quantity: number;
  total: number;
};

const makeItem = (p: Product, packSize = 1, packCount = 1): OrderItem => {
  const price = Number(p.sellingPrice) || 0;
  const quantity = +(packSize * packCount).toFixed(3);
  return {
    productId: String(p.id),
    productName: p.name,
    unit: p.unit,
    price,
    packSize,
    packCount,
    quantity,
    total: +(price * quantity).toFixed(2),
  };
};

const inputBase =
  'w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none';
const labelBase = 'text-sm font-bold text-[#29252A] block mb-2';
const heading = 'text-sm font-bold text-[#C94F6D] flex items-center gap-2';

/* =====================================================================
   WEIGHT INPUT — type a weight in kg OR g (toggle). Value is always kg.
   ===================================================================== */
interface WeightInputProps {
  value: number; // in kg
  onChange: (kg: number) => void;
  big?: boolean;
}

const WeightInput: React.FC<WeightInputProps> = ({ value, onChange, big = false }) => {
  const [unit, setUnit] = useState<'kg' | 'g'>('kg');

  const toText = (kg: number, u: 'kg' | 'g') =>
    kg > 0 ? String(u === 'g' ? Math.round(kg * 1000) : +kg.toFixed(3)) : '';
  const toKg = (txt: string, u: 'kg' | 'g') => {
    const n = Number(txt) || 0;
    return u === 'g' ? Math.round(n) / 1000 : Math.round(n * 1000) / 1000;
  };

  const [text, setText] = useState<string>(toText(value, 'kg'));

  // Keep the text in sync when the value is changed from outside (+/- buttons, chips)
  // or when the unit toggle is switched (value stays the same, text is converted).
  useEffect(() => {
    if (toKg(text, unit) !== value) setText(toText(value, unit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, unit]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={unit === 'g' ? 50 : 0.25}
        value={text}
        placeholder="0"
        onChange={(e) => {
          setText(e.target.value);
          onChange(toKg(e.target.value, unit));
        }}
        className={
          big
            ? 'w-28 text-center text-4xl font-extrabold text-[#29252A] bg-white border-b-4 border-[#C94F6D] outline-none py-1'
            : 'w-28 px-3 py-2.5 text-center text-lg font-bold text-[#29252A] bg-white border-2 border-[#EDE2E5] rounded-xl focus:border-[#C94F6D] outline-none'
        }
      />
      <div className="flex rounded-lg overflow-hidden border-2 border-[#EDE2E5]">
        {(['kg', 'g'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`px-3 py-2 text-sm font-bold cursor-pointer transition-colors ${
              unit === u ? 'bg-[#C94F6D] text-white' : 'bg-white text-[#756B70] hover:bg-[#FFF0F3]'
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
};

/* =====================================================================
   ITEM POPUP  —  3 simple steps
   1) choose product
   2) how much (total) to prepare      -> type kg or g
   3) split into boxes                 -> tap sizes, mix as many as you like
                                          until "remaining" reaches 0
   e.g. 3 kg = 1 kg x 2 boxes + 500 gm x 2 boxes
   ===================================================================== */
type Pack = { size: number; count: number };

interface ItemPopupProps {
  products: Product[];
  initial: OrderItem[] | null; // null = new item, otherwise all lines of one product
  onSave: (items: OrderItem[]) => void;
  onClose: () => void;
}

const ItemPopup: React.FC<ItemPopupProps> = ({ products, initial, onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(initial ? 2 : 1);
  const [product, setProduct] = useState<Product | null>(
    initial ? products.find((p) => String(p.id) === initial[0].productId) ?? null : null
  );
  const [total, setTotal] = useState<number>(
    initial ? +initial.reduce((s, it) => s + it.quantity, 0).toFixed(3) : 0
  );
  const [packs, setPacks] = useState<Pack[]>(
    initial ? initial.map((it) => ({ size: it.packSize, count: it.packCount })) : []
  );
  const [showOther, setShowOther] = useState(false);
  const [otherSize, setOtherSize] = useState(0);
  const [search, setSearch] = useState('');

  const kg = product ? isKgUnit(product.unit) : false;
  const unit = product?.unit ?? '';
  const stepSize = kg ? 0.25 : 1;
  const price = Number(product?.sellingPrice) || 0;

  const sizeOptions = kg
    ? WEIGHT_OPTIONS
    : COUNT_BOX_OPTIONS.map((n) => ({ label: `${n} ${unit}`, qty: n }));

  const changeTotal = (n: number) => setTotal(Math.max(0, Math.round(n * 1000) / 1000));

  // kg products: any weight (down to 1 g). Other products: whole numbers.
  const totalValid = kg ? total >= 0.001 : total > 0 && Number.isInteger(total);

  // How much is already put into boxes / how much is left
  const allocatedG = packs.reduce((s, p) => s + grams(p.size) * p.count, 0);
  const remainingG = grams(total) - allocatedG;
  const remaining = remainingG / 1000;
  const canSave = packs.length > 0 && remainingG === 0;
  const amount = Math.round(price * total * 100) / 100;

  const chooseProduct = (p: Product) => {
    // a different product -> start fresh
    if (product && product.id !== p.id) {
      setTotal(0);
      setPacks([]);
      setShowOther(false);
      setOtherSize(0);
    }
    setProduct(p);
    setStep(2);
  };

  const goToStep3 = () => {
    if (!totalValid) return;
    // If the total was reduced below what is already boxed, start the boxes again
    if (allocatedG > grams(total)) setPacks([]);
    setStep(3);
  };

  // Add one more box of this size
  const addPack = (size: number) => {
    if (size <= 0 || grams(size) > remainingG) return;
    setPacks((prev) =>
      prev.some((p) => p.size === size)
        ? prev.map((p) => (p.size === size ? { ...p, count: p.count + 1 } : p))
        : [...prev, { size, count: 1 }]
    );
  };

  const changeCount = (index: number, delta: number) => {
    setPacks((prev) => {
      const p = prev[index];
      if (!p) return prev;
      if (delta > 0 && grams(p.size) > remainingG) return prev;
      const count = p.count + delta;
      return count < 1
        ? prev.filter((_, i) => i !== index)
        : prev.map((x, i) => (i === index ? { ...x, count } : x));
    });
  };

  const removePack = (index: number) => setPacks((prev) => prev.filter((_, i) => i !== index));

  const save = () => {
    if (!product || !canSave) return;
    onSave(packs.map((p) => makeItem(product, p.size, p.count)));
  };

  const quickTotals = kg ? [5, 10, 25, 50] : [10, 50, 100, 200];
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-[#EDE2E5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with step dots */}
        <div className="px-5 py-4 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-[#FFF9F5]">
          <div className="flex items-center gap-2.5 min-w-0">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF0F3] cursor-pointer"
                aria-label={box.back}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="font-bold text-base text-[#29252A] truncate">{product ? product.name : box.pickProduct}</p>
              {product && (
                <p className="text-xs text-[#756B70]">
                  ₹{price.toLocaleString()} / {unit}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`w-2 h-2 rounded-full ${n <= step ? 'bg-[#C94F6D]' : 'bg-[#EDE2E5]'}`} />
              ))}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF0F3] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* STEP 1 — product */}
          {step === 1 && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#29252A]">{box.pickProduct}</h4>
                <p className="text-xs text-[#756B70]">{box.pickProductEn}</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-[#756B70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={box.searchProduct}
                  className={`${inputBase} pl-10`}
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => chooseProduct(p)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-[#EDE2E5] bg-[#FFF9F5] hover:border-[#C94F6D] hover:bg-[#FFF0F3] text-left cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-sm text-[#29252A] truncate">{p.name}</span>
                    <span className="text-xs font-bold text-[#C94F6D] whitespace-nowrap">
                      ₹{Number(p.sellingPrice).toLocaleString()}/{p.unit}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 2 — total quantity to prepare */}
          {step === 2 && product && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#29252A]">{box.howManyTitle(unit)}</h4>
                <p className="text-xs text-[#756B70]">{kg ? box.howManyEn : 'How much do we need to prepare in total?'}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => changeTotal(total - stepSize)}
                  className="w-12 h-12 shrink-0 rounded-xl bg-[#FFF0F3] text-[#C94F6D] hover:bg-[#C94F6D] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Minus className="w-6 h-6" />
                </button>

                {kg ? (
                  <WeightInput big value={total} onChange={changeTotal} />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={total || ''}
                      placeholder="0"
                      onChange={(e) => changeTotal(Math.floor(Number(e.target.value) || 0))}
                      className="w-28 text-center text-4xl font-extrabold text-[#29252A] bg-white border-b-4 border-[#C94F6D] outline-none py-1"
                    />
                    <span className="text-lg font-bold text-[#756B70]">{unit}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => changeTotal(total + stepSize)}
                  className="w-12 h-12 shrink-0 rounded-xl bg-[#FFF0F3] text-[#C94F6D] hover:bg-[#C94F6D] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {quickTotals.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => changeTotal(q)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold cursor-pointer transition-colors ${
                      total === q
                        ? 'bg-[#C94F6D] border-[#C94F6D] text-white'
                        : 'bg-white border-[#EDE2E5] text-[#29252A] hover:bg-[#FFF0F3]'
                    }`}
                  >
                    {q} {unit}
                  </button>
                ))}
              </div>

              {total > 0 && (
                <p className="text-center text-sm font-semibold text-[#756B70]">
                  = <span className="text-[#29252A]">{formatQty(total, unit)}</span>
                </p>
              )}

              <button
                type="button"
                disabled={!totalValid}
                onClick={goToStep3}
                className="w-full py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white font-bold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {box.next}
              </button>
            </>
          )}

          {/* STEP 3 — MULTIPLE box sizes */}
          {step === 3 && product && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#29252A]">{box.perBoxTitle(unit)}</h4>
                <p className="text-xs text-[#756B70]">{box.tapSizes}</p>
              </div>

              {/* Remaining banner */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold ${
                  remainingG === 0
                    ? 'bg-[#E8F6EE] border-[#3FA56B]/40 text-[#3FA56B]'
                    : 'bg-[#FFF0F3] border-[#C94F6D]/30 text-[#C94F6D]'
                }`}
              >
                <span>{box.remaining}</span>
                <span className="text-lg">{formatQty(remaining, unit)}</span>
              </div>

              {/* Size chips: tap to add one more box of that size */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {sizeOptions.map((opt) => {
                  const fits = grams(opt.qty) <= remainingG;
                  return (
                    <button
                      key={opt.qty}
                      type="button"
                      disabled={!fits}
                      onClick={() => addPack(opt.qty)}
                      className={`py-4 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-colors ${
                        fits
                          ? 'bg-[#FFF9F5] border-[#EDE2E5] text-[#29252A] hover:border-[#C94F6D] hover:bg-[#FFF0F3] cursor-pointer'
                          : 'bg-[#EDE2E5]/40 border-[#EDE2E5] text-[#756B70] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-extrabold text-base">{opt.label}</span>
                      <span className="text-xs font-semibold text-[#C94F6D]">
                        ₹{(Math.round(price * opt.qty * 100) / 100).toLocaleString()}
                      </span>
                    </button>
                  );
                })}

                {/* "Other" — typeable box size (kg products only) */}
                {kg && (
                  <button
                    type="button"
                    onClick={() => setShowOther((v) => !v)}
                    className={`py-4 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                      showOther
                        ? 'bg-[#C94F6D] border-[#C94F6D] text-white'
                        : 'bg-[#FFF9F5] border-dashed border-[#C94F6D]/50 text-[#29252A] hover:border-[#C94F6D] hover:bg-[#FFF0F3]'
                    }`}
                  >
                    <span className="font-extrabold text-base">{box.other}</span>
                    <span className={`text-xs font-semibold ${showOther ? 'text-white/90' : 'text-[#C94F6D]'}`}>
                      {box.otherEn}
                    </span>
                  </button>
                )}
              </div>

              {/* Typed custom size in kg or g */}
              {kg && showOther && (
                <div className="p-4 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5] space-y-3">
                  <p className="text-xs font-semibold text-[#756B70]">{box.typeBoxSize}</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <WeightInput value={otherSize} onChange={setOtherSize} />
                    <button
                      type="button"
                      disabled={otherSize <= 0 || grams(otherSize) > remainingG}
                      onClick={() => {
                        addPack(otherSize);
                        setOtherSize(0);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-[#C94F6D] hover:bg-[#A83D58] text-white font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {box.addBox}
                    </button>
                  </div>
                  {otherSize > 0 && grams(otherSize) > remainingG && (
                    <p className="text-xs font-semibold text-[#D9535F] text-center">{box.tooBig}</p>
                  )}
                </div>
              )}

              {/* Boxes chosen so far */}
              {packs.length > 0 && (
                <div className="space-y-2">
                  {packs.map((p, i) => (
                    <div
                      key={p.size}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#29252A]">{formatQty(p.size, unit)}</p>
                        <p className="text-xs text-[#756B70]">= {formatQty(+(p.size * p.count).toFixed(3), unit)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeCount(i, -1)}
                          className="w-8 h-8 rounded-lg bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-14 text-center font-extrabold text-[#29252A]">
                          {p.count} {box.boxes}
                        </span>
                        <button
                          type="button"
                          disabled={grams(p.size) > remainingG}
                          onClick={() => changeCount(i, 1)}
                          className="w-8 h-8 rounded-lg bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePack(i)}
                        className="p-1.5 rounded-lg text-[#756B70] hover:text-[#D9535F] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Live summary */}
              <div className="p-4 rounded-xl bg-[#FFF0F3] border-2 border-[#C94F6D]/20 space-y-1.5 text-sm text-[#29252A]">
                <div className="flex justify-between">
                  <span className="text-[#756B70]">{box.total}</span>
                  <b>{formatQty(total, unit)}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#756B70]">{box.boxes}</span>
                  <b className="text-right">
                    {packs.length > 0 ? packs.map((p) => `${p.count} × ${formatQty(p.size, unit)}`).join(' + ') : '—'}
                  </b>
                </div>
                <div className="flex justify-between pt-1.5 border-t-2 border-[#C94F6D]/20 text-base font-extrabold text-[#C94F6D]">
                  <span>₹</span>
                  <span>{amount.toLocaleString()}</span>
                </div>
              </div>

              {!canSave && packs.length > 0 && (
                <p className="text-xs font-semibold text-[#D9535F] text-center">{box.mustFill}</p>
              )}

              <button
                type="button"
                disabled={!canSave}
                onClick={save}
                className="w-full py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white font-bold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initial ? box.save : box.add}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =====================================================================
   MAIN MODAL
   ===================================================================== */
export const BulkOrderFormModal: React.FC<BulkOrderFormModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const { ProductsData, ProductsLoad, ProductsError, BulkOrderActionLoad, BulkOrderStatusesData } =
    useSelector((state: RootState) => state.bakery);

  const products: Product[] = Array.isArray(ProductsData) ? ProductsData : [];
  const bulkOrderStatuses: BulkOrderStatus[] = Array.isArray(BulkOrderStatusesData) ? BulkOrderStatusesData : [];

  // The status ID is sent to the backend: prefer "Upcoming", else the first one.
  const defaultStatusId: number | null =
    bulkOrderStatuses.find((s) => s.name.toLowerCase() === 'upcoming')?.id ?? bulkOrderStatuses[0]?.id ?? null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(getCurrentDate());
  const [deliveryTime, setDeliveryTime] = useState(getCurrentTime());
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [occasion, setOccasion] = useState<BulkOrder['occasion']>('Wedding');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [formError, setFormError] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Item popup: open = visible, productId = null for a new item, or the product being edited
  const [popup, setPopup] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });

  useEffect(() => {
    if (!isOpen) return;
    dispatch(FetchProductsAction({}));
    dispatch(FetchBulkOrderStatusesAction());
    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());
  }, [isOpen, dispatch]);

  const openAddPopup = () => {
    if (products.length === 0) return;
    setPopup({ open: true, productId: null });
  };

  const openEditPopup = (productId: string) => setPopup({ open: true, productId });

  // New item: append its lines. Edit: replace all lines of that product (keeping its position).
  const handleSaveItem = (items: OrderItem[]) => {
    setOrderItems((prev) => {
      if (popup.productId === null) return [...prev, ...items];
      const firstIdx = prev.findIndex((it) => it.productId === popup.productId);
      const rest = prev.filter((it) => it.productId !== popup.productId);
      rest.splice(firstIdx < 0 ? rest.length : firstIdx, 0, ...items);
      return rest;
    });
    setPopup({ open: false, productId: null });
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  // Group lines by product for display (one card per product, all box sizes inside)
  const groupedItems = orderItems.reduce<Record<string, OrderItem[]>>((acc, it) => {
    (acc[it.productId] ||= []).push(it);
    return acc;
  }, {});

  const totalAmount = orderItems.reduce((sum, it) => sum + it.total, 0);
  const remainingAmount = Math.max(0, totalAmount - (advancePaid || 0));

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());
    setDeliveryAddress('');
    setDeliveryType('Home Delivery');
    setOccasion('Wedding');
    setSpecialInstructions('');
    setAdvancePaid(0);
    setOrderItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) return setFormError('Customer name is required.');
    if (customerPhone.length !== 10) return setFormError('Enter a valid 10-digit phone number.');
    if (orderItems.length === 0) return setFormError('Add at least one order item.');
    if (orderItems.some((it) => it.packSize <= 0 || it.packCount < 1)) return setFormError(box.needSize);
    if (Number(advancePaid) > totalAmount) return setFormError('Advance paid cannot exceed the total order amount.');
    if (defaultStatusId === null) return setFormError('Order statuses are not loaded yet. Please try again.');

    try {
      const newOrder: BulkOrder = {
        id: '',
        orderNumber: '', // assigned by the backend
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: '',
        deliveryDate,
        deliveryTime,
        deliveryAddress: deliveryType === 'Home Delivery' ? deliveryAddress.trim() : '',
        deliveryType,
        // One line per (product, box size): includes packSize, packCount and quantity (kg items use decimals)
        products: orderItems,
        totalAmount,
        advancePaid: Number(advancePaid) || 0,
        remainingAmount,
        status: defaultStatusId,
        occasion,
        specialInstructions: specialInstructions.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await dispatch(CreateBulkOrderAction(newOrder) as any).unwrap();

      dispatch(FetchBulkOrdersAction({}));
      dispatch(FetchDashboardAction({}));
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Create bulk order failed:', error);
      setFormError(error?.message || 'Failed to create bulk order');
    }
  };

  const handleClose = () => {
    if (!BulkOrderActionLoad) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border-2 border-[#EDE2E5] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#29252A]">{t.modalTitle}</h3>
              <p className="text-sm text-[#756B70] mt-0.5">{t.modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={BulkOrderActionLoad}
            aria-label={t.cancel}
            className="p-2.5 rounded-xl text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] cursor-pointer disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-7 max-h-[78vh] overflow-y-auto">
          {/* Customer */}
          <div className="space-y-4">
            <h4 className={heading}>
              <User className="w-4 h-4" />
              <span>{t.customerInfoHeading}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>{t.customerName}</label>
                <input
                  type="text"
                  required
                  placeholder={t.customerNamePlaceholder}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>{t.phoneNumber}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder={t.phonePlaceholder}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">
            <h4 className={heading}>
              <Clock className="w-4 h-4" />
              <span>{t.deliveryScheduleHeading}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelBase}>{t.deliveryDate}</label>
                <input type="date" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>{t.deliveryTime}</label>
                <input type="time" required value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>{t.deliveryMode}</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'Home Delivery' | 'Store Pickup')}
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="Home Delivery">{t.homeDelivery}</option>
                  <option value="Store Pickup">{t.storePickup}</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>{t.occasion}</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as BulkOrder['occasion'])}
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="Wedding">{t.occasionWedding}</option>
                  <option value="Birthday">{t.occasionBirthday}</option>
                  <option value="Festival">{t.occasionFestival}</option>
                  <option value="Corporate Event">{t.occasionCorporate}</option>
                  <option value="Poojan / Religious">{t.occasionReligious}</option>
                  <option value="Other">{t.occasionOther}</option>
                </select>
              </div>
            </div>

            {/* Address only matters for home delivery */}
            {deliveryType === 'Home Delivery' && (
              <div>
                <label className={labelBase}>{t.deliveryAddress}</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t.deliveryAddressPlaceholder}
                  className={inputBase}
                />
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">
            <div className="flex items-center justify-between gap-3">
              <h4 className={heading}>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.orderItemsHeading}</span>
              </h4>
              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={openAddPopup}
                  disabled={ProductsLoad || products.length === 0 || BulkOrderActionLoad}
                  className="text-sm font-bold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-3 py-2 rounded-lg hover:bg-[#FFF0F3]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addItemRow}</span>
                </button>
              )}
            </div>

            {ProductsLoad && <div className="py-6 text-center text-sm text-[#756B70]">{t.loadingProducts}</div>}
            {!ProductsLoad && ProductsError && <div className="py-6 text-center text-sm text-red-500">{t.errorLoadingProducts}</div>}
            {!ProductsLoad && !ProductsError && products.length === 0 && (
              <div className="py-6 text-center text-sm text-[#756B70]">{t.noProductsAvailable}</div>
            )}

            {!ProductsLoad && products.length > 0 && (
              <>
                {/* Empty state: one big friendly button */}
                {orderItems.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddPopup}
                    disabled={BulkOrderActionLoad}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-[#C94F6D]/40 bg-[#FFF9F5] hover:bg-[#FFF0F3] flex flex-col items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="w-12 h-12 rounded-full bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </span>
                    <span className="font-bold text-[#29252A]">{box.noItems}</span>
                    <span className="text-xs text-[#756B70]">{box.noItemsEn}</span>
                  </button>
                )}

                {/* One compact card per product (all its box sizes shown together) */}
                {orderItems.length > 0 && (
                  <div className="space-y-2.5">
                    {Object.entries(groupedItems).map(([productId, lines]) => {
                      const qty = +lines.reduce((s, l) => s + l.quantity, 0).toFixed(3);
                      const sum = lines.reduce((s, l) => s + l.total, 0);
                      return (
                        <div
                          key={productId}
                          className="p-3.5 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5] flex items-center gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-[#29252A] truncate">{lines[0].productName}</p>
                            <p className="text-xs text-[#756B70] mt-0.5">
                              {box.total}: <b className="text-[#29252A]">{formatQty(qty, lines[0].unit)}</b>
                              {'  •  '}
                              {lines.map((l) => `${l.packCount} × ${formatQty(l.packSize, l.unit)}`).join(' + ')}
                            </p>
                          </div>
                          <b className="text-sm text-[#29252A] whitespace-nowrap">₹{sum.toLocaleString()}</b>
                          <button
                            type="button"
                            onClick={() => openEditPopup(productId)}
                            disabled={BulkOrderActionLoad}
                            aria-label={box.edit}
                            className="p-2 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-white cursor-pointer disabled:opacity-40"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(productId)}
                            disabled={BulkOrderActionLoad}
                            className="p-2 rounded-lg text-[#756B70] hover:text-[#D9535F] hover:bg-white cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notes + money */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t-2 border-[#EDE2E5]">
            <div>
              <label className={labelBase}>{t.specialInstructions}</label>
              <textarea
                rows={3}
                value={specialInstructions}
                disabled={BulkOrderActionLoad}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={t.specialInstructionsPlaceholder}
                className={inputBase}
              />
            </div>

            <div className="p-4 rounded-xl bg-[#FFF0F3] border-2 border-[#C94F6D]/20 space-y-2.5 text-sm">
              <div className="flex justify-between font-semibold text-[#29252A]">
                <span>{t.totalOrderAmount}</span>
                <span className="font-bold text-base">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#29252A]">
                <span>{t.advanceReceived}</span>
                <div className="flex items-center gap-1.5 w-32">
                  <span className="font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={advancePaid}
                    disabled={BulkOrderActionLoad}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#3FA56B] text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t-2 border-[#C94F6D]/20 font-extrabold text-[#C94F6D] text-base">
                <span>{t.remainingBalance}</span>
                <span>₹{remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-[#D9535F] bg-[#FFF0F3] border border-[#D9535F]/30 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          <div className="pt-4 border-t border-[#EDE2E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={BulkOrderActionLoad}
              className="px-6 py-3.5 rounded-xl bg-white border-2 border-[#EDE2E5] hover:bg-[#FFF4F6] text-sm font-bold text-[#756B70] cursor-pointer disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              // disabled={ProductsLoad || products.length === 0 || orderItems.length === 0 || defaultStatusId === null || BulkOrderActionLoad}
              className="px-6 py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {BulkOrderActionLoad ? t.saving : t.saveBulkOrder}
            </button>
          </div>
        </form>
      </div>

      {/* Add / edit item popup */}
      {popup.open && (
        <ItemPopup
          key={popup.productId ?? 'new'}
          products={products}
          initial={
            popup.productId === null ? null : orderItems.filter((it) => it.productId === popup.productId)
          }
          onSave={handleSaveItem}
          onClose={() => setPopup({ open: false, productId: null })}
        />
      )}
    </div>
  );
};

export default BulkOrderFormModal;