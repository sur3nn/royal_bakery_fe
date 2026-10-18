import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChefHat, Package, X, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

// Same API base you use for the other KOT downloads
 //const API = "http://localhost:5000" 
const API = 'https://indigo-kangaroo-864288.hostingersite.com';

type KotKind = 'kitchen' | 'packing';

// ---------- Tamil labels ----------
const COMMON = {
  subtitle: 'தேதி வரம்பை தேர்ந்தெடுக்கவும்',
  from: 'இருந்து',
  to: 'வரை',
  today: 'இன்று',
  tomorrow: 'நாளை',
  next7: 'அடுத்த 7 நாட்கள்',
  thisMonth: 'இந்த மாதம்',
  days: 'நாள்',
  pickStart: 'தொடக்க தேதியை தேர்ந்தெடுக்கவும்',
  pickEnd: 'முடிவு தேதியை தேர்ந்தெடுக்கவும்',
  prepare: 'KOT பார்',
  preparing: 'தயாராகிறது...',
  cancel: 'ரத்து',
  downloadError: 'KOT எடுக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  networkError: 'இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.',
};

const PER_KIND: Record<
  KotKind,
  { button: string; title: string; hint: string; slipTitle: string }
> = {
  kitchen: {
    button: 'சமையலறை KOT',
    title: 'சமையலறை KOT',
    hint: 'தேர்ந்தெடுத்த தேதிகளில் உள்ள எல்லா ஆர்டர்களின் மொத்த அளவும் ஒரே சீட்டில் வரும்.',
    slipTitle: 'சமையலறை சீட்டு',
  },
  packing: {
    button: 'பேக்கிங் KOT',
    title: 'பேக்கிங் KOT',
    hint: 'தேர்ந்தெடுத்த தேதிகளில் உள்ள எல்லா ஆர்டர்களின் பெட்டி விவரமும் ஒரே சீட்டில் வரும்.',
    slipTitle: 'பேக்கிங் சீட்டு',
  },
};

const MONTHS_TA = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்',
];
const WEEKDAYS_TA = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];

// ---------- Tamil quantity formatting (0.25 -> 250 கிராம், 1.5 -> 1.5 கிலோ) ----------
const isKg = (unit?: string) =>
  ['kg', 'kgs', 'kilogram', 'kilograms'].includes(String(unit || '').trim().toLowerCase());

const unitTa = (unit?: string) => {
  const u = String(unit || '').trim().toLowerCase();
  if (isKg(unit)) return 'கிலோ';
  if (['gm', 'g', 'gram', 'grams'].includes(u)) return 'கிராம்';
  if (['l', 'ltr', 'litre', 'liter', 'litres', 'liters'].includes(u)) return 'லிட்டர்';
  if (['pcs', 'pc', 'piece', 'pieces', 'nos'].includes(u)) return 'எண்';
  return unit || '';
};

const fmtTa = (qty: number, unit?: string) => {
  if (!isKg(unit)) return `${+qty.toFixed(3)} ${unitTa(unit)}`.trim();
  return qty < 1 ? `${Math.round(qty * 1000)} கிராம்` : `${+qty.toFixed(3)} கிலோ`;
};

// ---------- Date helpers (local time, no UTC shift) ----------
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const showDate = (s: string | null) => (s ? s.split('-').reverse().join('/') : '—');
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const dayCount = (a: string, b: string) =>
  Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86400000) + 1;

interface KitchenKotButtonProps {
  kind?: KotKind; // 'kitchen' (default) | 'packing'
}

export const KitchenKotButton: React.FC<KitchenKotButtonProps> = ({ kind = 'kitchen' }) => {
  const L = { ...COMMON, ...PER_KIND[kind] };
  const Icon = kind === 'packing' ? Package : ChefHat;

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slip, setSlip] = useState<any>(null);

  const todayIso = toIso(new Date());

  const openPopup = () => {
    setError('');
    setOpen(true);
  };
  const closePopup = () => {
    if (!loading) setOpen(false);
  };

  // ----- calendar grid for the visible month -----
  const cells = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const offset = new Date(y, m, 1).getDay();
    const count = new Date(y, m + 1, 0).getDate();
    const arr: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= count; d++) arr.push(`${y}-${pad(m + 1)}-${pad(d)}`);
    return arr;
  }, [viewMonth]);

  const handleDayClick = (iso: string) => {
    setError('');
    if (!start || (start && end)) {
      setStart(iso);
      setEnd(null);
    } else if (iso < start) {
      setStart(iso);
    } else {
      setEnd(iso);
    }
  };

  const applyPreset = (a: Date, b: Date) => {
    setError('');
    setStart(toIso(a));
    setEnd(toIso(b));
    setViewMonth(new Date(a.getFullYear(), a.getMonth(), 1));
  };

  const presets = [
    { label: L.today, run: () => applyPreset(new Date(), new Date()) },
    { label: L.tomorrow, run: () => applyPreset(addDays(new Date(), 1), addDays(new Date(), 1)) },
    { label: L.next7, run: () => applyPreset(new Date(), addDays(new Date(), 6)) },
    {
      label: L.thisMonth,
      run: () => {
        const n = new Date();
        applyPreset(new Date(n.getFullYear(), n.getMonth(), 1), new Date(n.getFullYear(), n.getMonth() + 1, 0));
      },
    },
  ];

  // range used for highlighting (supports hover preview while picking the end date)
  const rangeEnd = end ?? (start && hover && hover >= start ? hover : null);

  const effectiveTo = end ?? start;

  const handlePrepare = async () => {
    if (!start || !effectiveTo) return;
    setLoading(true);
    setError('');

    try {
      const url =
        kind === 'kitchen'
          ? `${API}/api/bulk-orders/kot/kitchen-summary?from=${start}&to=${effectiveTo}&format=json`
          : `${API}/api/bulk-orders/kot/packing-summary?from=${start}&to=${effectiveTo}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const j = await res.json().catch(() => null);

      if (!res.ok || !j?.success) {
        setError(j?.message || L.downloadError); // Tamil message from the API (e.g. no orders)
        return;
      }

      const { rows, orderCount } = j.data;
      const range = `${showDate(start)} - ${showDate(effectiveTo)}`;

      // Same shape the InvoiceModal already understands
      setSlip({
        id: 0,
        invoiceNumber: range,
        customerName: '',
        customerPhone: '',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        cgst: 0,
        sgst: 0,
        grandTotal: 0,
        amountPaid: 0,
        balanceReturn: 0,
        paymentMethod: '',
        isKot: true,
        kotType: kind, // 'kitchen' | 'packing'
        isSummary: true, // modal shows the date range and order count
        summaryRange: range,
        summaryOrderCount: orderCount,
        kotTitle: L.slipTitle,
        kotLines: rows.map((r: any) => ({
          name: r.productName,
          // kitchen: total to make | packing: each box size x boxes
          total: fmtTa(Number(r.totalQuantity), r.unit),
          packs:
            kind === 'packing'
              ? (r.packs || []).map(
                  (p: any) => `${fmtTa(Number(p.packSize), r.unit)} x ${p.packCount} பெட்டி`
                )
              : [],
        })),
      });

      setOpen(false);
    } catch {
      setError(L.networkError);
    } finally {
      setLoading(false);
    }
  };

  const monthLabel = `${MONTHS_TA[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  const popup = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" onClick={closePopup}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border-2 border-[#EDE2E5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#29252A] leading-tight">{L.title}</h3>
              <p className="text-xs text-[#756B70]">{L.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePopup}
            disabled={loading}
            className="p-2 rounded-xl text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* From / To cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: L.from, value: start, active: !start || !!end },
              { label: L.to, value: end, active: !!start && !end },
            ].map((c, i) => (
              <div
                key={i}
                className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                  c.active ? 'border-[#C94F6D] bg-[#FFF0F3]' : 'border-[#EDE2E5] bg-[#FFF9F5]'
                }`}
              >
                <p className="text-[11px] font-bold text-[#756B70]">{c.label}</p>
                <p className="text-base font-extrabold text-[#29252A] mt-0.5">{showDate(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.run}
                className="px-3.5 py-2 rounded-lg bg-[#FFF9F5] border-2 border-[#EDE2E5] text-xs font-bold text-[#29252A] whitespace-nowrap hover:bg-[#FFF0F3] hover:border-[#C94F6D]/50 cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="rounded-xl border-2 border-[#EDE2E5] p-3">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg text-[#756B70] hover:bg-[#FFF0F3] hover:text-[#C94F6D] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-sm text-[#29252A]">{monthLabel}</span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg text-[#756B70] hover:bg-[#FFF0F3] hover:text-[#C94F6D] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-1">
              {WEEKDAYS_TA.map((w) => (
                <span key={w} className="text-[11px] font-bold text-[#756B70] py-1">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
              {cells.map((iso, idx) => {
                if (!iso) return <span key={`e-${idx}`} />;

                const isStart = iso === start;
                const isEnd = iso === (end ?? (rangeEnd && rangeEnd !== start ? rangeEnd : null));
                const inRange = !!start && !!rangeEnd && iso > start && iso < rangeEnd;
                const isToday = iso === todayIso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleDayClick(iso)}
                    onMouseEnter={() => start && !end && setHover(iso)}
                    className={`h-10 text-sm font-semibold cursor-pointer transition-colors ${
                      isStart || isEnd
                        ? 'bg-[#C94F6D] text-white rounded-lg'
                        : inRange
                        ? 'bg-[#FFF0F3] text-[#C94F6D]'
                        : 'text-[#29252A] hover:bg-[#FFF0F3] rounded-lg'
                    } ${isToday && !isStart && !isEnd ? 'ring-2 ring-[#C94F6D]/40 rounded-lg' : ''}`}
                  >
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection summary / hint */}
          <p className="text-xs text-[#756B70] text-center">
            {!start ? (
              L.pickStart
            ) : !end ? (
              L.pickEnd
            ) : (
              <>
                <b className="text-[#29252A]">
                  {showDate(start)} – {showDate(end)}
                </b>{' '}
                ({dayCount(start, end)} {L.days})
              </>
            )}
          </p>
          <p className="text-[11px] text-[#756B70] text-center -mt-2">{L.hint}</p>

          {error && (
            <p className="text-xs font-semibold text-[#D9535F] bg-[#FFF0F3] border border-[#D9535F]/30 rounded-xl px-3 py-2 text-center">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={closePopup}
              disabled={loading}
              className="px-5 py-3.5 rounded-xl bg-white border-2 border-[#EDE2E5] hover:bg-[#FFF4F6] text-sm font-bold text-[#756B70] cursor-pointer disabled:opacity-50"
            >
              {L.cancel}
            </button>
            <button
              type="button"
              onClick={handlePrepare}
              disabled={!start || loading}
              className="flex-1 py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{L.preparing}</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{L.prepare}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openPopup}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors whitespace-nowrap ${
          kind === 'packing'
            ? 'bg-[#EBF3FB] hover:bg-[#2F5F96] text-[#2F5F96] hover:text-white'
            : 'bg-[#FFF0F3] hover:bg-[#C94F6D] text-[#C94F6D] hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{L.button}</span>
      </button>

      {/* Portals so neither popup is clipped by the header */}
      {open && createPortal(popup, document.body)}
      {slip && createPortal(<InvoiceModal invoice={slip} onClose={() => setSlip(null)} />, document.body)}
    </>
  );
};

export default KitchenKotButton;