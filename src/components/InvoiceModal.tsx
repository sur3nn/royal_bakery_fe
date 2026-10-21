import React, { useState } from 'react';
import { X, Printer, Receipt } from 'lucide-react';
import { Invoice } from '../types';
import { LOGO_SRC } from './Header';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

// -> 16/10/26 (works with "2026-10-16", "2026-10-16T00:00:00.000Z", or a Date string)
const getDateText = (value?: string | null) => {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1].slice(-2)}`; // no timezone shift
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
};

const to12h = (h: number, min: number) =>
  `${h % 12 || 12}:${pad(min)} ${h >= 12 ? 'pm' : 'am'}`; // 8:11 am

// -> 8:11 am (works with "08:11:00" or a full date-time string)
const getTimeText = (createdAt?: string | null, timeOnly?: string | null) => {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return to12h(d.getHours(), d.getMinutes());
  }
  const m = String(timeOnly ?? '').match(/^(\d{1,2}):(\d{2})/);
  return m ? to12h(Number(m[1]), Number(m[2])) : String(timeOnly ?? '');
};

// -> 001, 002 ... (uses the id if it's a number)
const getBillNo = (inv: any) => {
  const seq = inv.id;
  return seq != null && /^\d+$/.test(String(seq))
    ? String(seq).padStart(3, '0')
    : inv.id;
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('thermal');

  if (!invoice) return null;

  // Extra fields added by BulkOrdersView / KitchenKotButton for kitchen / packing slips
  const k: any = invoice;
  const isKot = !!k.isKot;
  const isKitchen = k.kotType === 'kitchen';

  const handlePrint = () => {
    window.print();
  };

  // Slips are always thermal
  const isThermal = isKot || printMode === 'thermal';

  // Separate date and time
  const dateText = getDateText(invoice.createdAt ?? invoice.dateOnly);
  const timeText = getTimeText(invoice.createdAt, invoice.timeOnly);

  // For a 58mm roll: change 80mm -> 58mm and 78mm -> 56mm below.
  const printStyles = `
@media print {
  @page {
    size: ${isThermal ? '80mm auto' : 'A4'};
    margin: ${isThermal ? '0' : '10mm'};
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    ${isThermal ? 'width: 80mm !important;' : ''}
  }

  /* show only the bill */
  body * { visibility: hidden !important; }
  .print-area, .print-area * { visibility: visible !important; }
  .no-print { display: none !important; }

  /* remove modal limits so the full bill prints */
  .print-overlay {
    position: static !important;
    display: block !important;
    overflow: visible !important;
    background: none !important;
    padding: 0 !important;
    backdrop-filter: none !important;
  }
  .print-modal {
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    max-width: none !important;
    overflow: visible !important;
    margin: 0 !important;
  }
  .print-container {
    max-height: none !important;
    overflow: visible !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .print-area {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* THERMAL receipt: 80mm roll, centred, equal padding on all 4 sides */
  .thermal-receipt {
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    width: 78mm !important;
    max-width: 78mm !important;
    margin: 0 auto !important;
    padding: 3mm !important;
    box-sizing: border-box !important;
    border: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: #fff !important;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    line-height: 1.35;
  }
  .thermal-receipt, .thermal-receipt * {
    color: #000 !important;
    font-size: 14px !important;
    line-height: 1.7 !important; /* Tamil marks need room above and below the line */
    border-color: #000 !important;
    box-sizing: border-box;
  }
  .thermal-receipt h2 { font-size: 18px !important; font-weight: 800 !important; }
  .thermal-receipt .grand { font-size: 16px !important; font-weight: 800 !important; }
  .thermal-receipt .nowrap { white-space: nowrap !important; }

  /* Dark, solid logo (forces light/colored pixels to black) */
  .thermal-receipt img.print-logo {
    height: 60px !important;
    width: auto !important;
    background: #fff !important;
    filter: grayscale(1) brightness(0.6) contrast(10) !important;
    -webkit-filter: grayscale(1) brightness(0.6) contrast(10) !important;
    image-rendering: crisp-edges;
  }
}`;
  const hasGst = (invoice.cgst ?? 0) > 0 || (invoice.sgst ?? 0) > 0;

  return (
    <div className="print-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <style>{printStyles}</style>

      <div className="print-modal bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#EDE2E5] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-gradient-to-r from-white to-[#FFF9F5] border-b border-[#EDE2E5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C94F6D]" />
            <h3 className="font-bold text-sm sm:text-base text-[#29252A]">
              {isKot ? k.kotTitle : 'விலைப்பட்டியல் முன்னோட்டம்'}:{' '}
              <span className="text-[#C94F6D]">{invoice.invoiceNumber}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle format (not needed for kitchen / packing slips) */}
            {!isKot && (
              <div className="flex items-center bg-white border border-[#EDE2E5] rounded-xl p-1 text-[13px]">
                <button
                  onClick={() => setPrintMode('thermal')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${isThermal ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                    }`}
                >
                  தெர்மல் (80mm)
                </button>
                <button
                  onClick={() => setPrintMode('a4')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${!isThermal ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                    }`}
                >
                  A4 வரி விலைப்பட்டியல்
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-[13px] font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>அச்சிடு</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF0F3] hover:text-[#C94F6D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="print-container p-4 sm:p-8 max-h-[80vh] overflow-y-auto bg-[#FAFAFA]">
          {isThermal ? (
            isKot ? (
              /* ================= KITCHEN / PACKING SLIP (80mm) ================= */
              <div className="print-area thermal-receipt max-w-[400px] mx-auto bg-white p-5 border border-[#EDE2E5] shadow-sm rounded-xl font-mono text-[14px] text-black">
                {/* Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
                  <div className="flex items-center justify-center mx-auto mb-1">
                    <img
                      src={LOGO_SRC}
                      alt=""
                      className="print-logo h-14 w-auto object-contain select-none shrink-0"
                      draggable={false}
                    />
                  </div>
                  <h2 className="font-extrabold text-lg tracking-tight text-black font-sans text-center">
                    கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                  </h2>
                  <p className="font-extrabold text-lg tracking-wide text-center">{k.kotTitle}</p>
                </div>

                {/* Order info */}
                <div className="py-2.5 space-y-1 border-b border-dashed border-black text-[14px]">
                  {k.isSummary ? (
                    <>
                      {/* Kitchen KOT summary (date range) */}
                      <div className="flex justify-between gap-2">
                        <span>தேதி</span>
                        <b className="text-right">{k.summaryRange}</b>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>ஆர்டர்கள்</span>
                        <b className="text-right">{k.summaryOrderCount}</b>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Single order slip */}
                      <div className="flex justify-between gap-2">
                        <span>ஆர்டர் எண்</span>
                        <b className="text-right">{invoice.invoiceNumber}</b>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>வாடிக்கையாளர்</span>
                        <b className="text-right">{invoice.customerName}</b>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>டெலிவரி</span>
                        <b className="text-right">{k.deliveryText}</b>
                      </div>
                      {k.occasion && (
                        <div className="flex justify-between gap-2">
                          <span>நிகழ்வு</span>
                          <b className="text-right">{k.occasion}</b>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Items */}
                <div className="py-3 border-b border-dashed border-black space-y-3">
                  <div className="flex justify-between gap-2 font-bold pb-1 border-b border-black">
                    <span>பொருள்</span>
                    <span className="text-right">{isKitchen ? 'செய்ய வேண்டிய மொத்தம்' : 'பேக்கிங்'}</span>
                  </div>

                  {(k.kotLines || []).map((l: any, i: number) => (
                    <div key={i}>
                      <p className="font-bold leading-snug break-words">{l.name}</p>

                      {isKitchen ? (
                        <div className="flex justify-between pl-2">
                          <span>செய்ய</span>
                          <b className="whitespace-nowrap">{l.total}</b>
                        </div>
                      ) : (
                        (l.packs || []).map((p: string, n: number) => (
                          <p key={n} className="pl-2">
                            {p}
                          </p>
                        ))
                      )}
                    </div>
                  ))}
                </div>

                {/* Special instructions */}
                {k.specialInstructions && (
                  <div className="py-2 border-b border-dashed border-black">
                    <p className="font-bold">குறிப்பு:</p>
                    <p className="break-words">{k.specialInstructions}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-3 text-[13px]">
                  <p className="font-bold">*** {isKitchen ? 'சமையலறை நகல்' : 'பேக்கிங் நகல்'} ***</p>
                </div>
              </div>
            ) : (
              /* ================= THERMAL 80mm RECEIPT LAYOUT ================= */
              <div className="print-area thermal-receipt max-w-[400px] mx-auto bg-white p-5 border border-[#EDE2E5] shadow-sm rounded-xl font-mono text-[14px] text-black">
                {/* Brand Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
                  <div className="flex items-center justify-center mx-auto mb-1">
                    <img
                      src={LOGO_SRC}
                      alt=""
                      className="print-logo h-14 w-auto object-contain select-none shrink-0"
                      draggable={false}
                    />
                  </div>
                  <h2 className="font-extrabold text-lg tracking-tight text-black font-sans text-center">
                    கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                  </h2>
                  <p className="text-[13px] text-black text-center">
                    29/14, ஆதிசெல்வன் தெரு, அம்மாப்பேட்டை, சேலம்-3
                  </p>
                  <p className="text-[13px] text-black text-center">
                    தொலைபேசி: 0427-2243676 செல்: 9360013676, 9043013676
                  </p>
                </div>

                {/* Bill Details */}
                <div className="py-2.5 space-y-1 border-b border-dashed border-black text-[14px]">
                  <p className="nowrap whitespace-nowrap">பில் எண்: {getBillNo(invoice)}</p>
                  <p className="nowrap whitespace-nowrap">தேதி: {dateText}</p>
                  <p className="nowrap whitespace-nowrap">நேரம்: {timeText}</p>
                </div>

                {/* Items List */}
                <div className="py-4 border-b border-dashed border-black">
                  {/* Header: 4 columns (item | qty | rate | amount) */}
                  <div className="grid grid-cols-[minmax(0,1fr)_17mm_16mm_17mm] gap-x-1 font-bold pb-2 border-b border-black">
                    <span className="text-left whitespace-nowrap">பொருள்</span>
                    <span className="text-left whitespace-nowrap">அளவு</span>
                    <span className="text-left whitespace-nowrap">விலை</span>
                    <span className="text-left whitespace-nowrap">தொகை</span>
                  </div>

                  {/* Rows: name (wraps to 2+ lines in its column) with qty / rate / amount on the first line */}
                  <div className="space-y-3.5 pt-2.5">
                    {invoice.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-[minmax(0,1fr)_17mm_16mm_17mm] gap-x-1 items-start tabular-nums">
                        <p className="font-bold text-black whitespace-normal break-words">{it.productName}</p>
                        <span className="text-left whitespace-nowrap">
                          {it.quantity} {it.unit}
                        </span>
                        <span className="text-right whitespace-nowrap">
                          ₹{it.price.toLocaleString()}
                        </span>
                        <span className="text-right font-bold whitespace-nowrap">
                          ₹{it.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax & Grand Total */}
                <div className="py-2.5 space-y-1 text-[14px] border-b border-dashed border-black">
                  <div className="flex justify-between text-black">
                    <span>மொத்தம்:</span>
                    <span>₹{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-black">
                      <span>தள்ளுபடி:</span>
                      <span>-₹{invoice.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {hasGst && (
                    <>
                      <div className="flex justify-between text-black">
                        <span>சி.ஜி.எஸ்.டி (2.5%):</span>
                        <span>₹{invoice.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-black">
                        <span>எஸ்.ஜி.எஸ்.டி (2.5%):</span>
                        <span>₹{invoice.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 font-extrabold text-black font-sans">
                    <span className="grand">செலுத்த வேண்டிய தொகை:</span>
                    <span className="grand">₹{invoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div className="py-2 space-y-1 text-[14px] text-black">
                  {invoice.paymentMethod && !k.isBulk && (
                    <div className="flex justify-between">
                      <span>செலுத்தும் முறை:</span>
                      <span>{invoice.paymentMethod}</span>
                    </div>
                  )}

                  {k.isBulk ? (
                    <>
                      {/* Bulk order bill: advance and balance as separate rows */}
                      <div className="flex justify-between">
                        <span>முன்பணம்:</span>
                        <span>₹{Number(k.advancePaid ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>மீதித் தொகை:</span>
                        <span>₹{Number(k.balanceDue ?? 0).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Normal counter bill */}
                      <div className="flex justify-between">
                        <span>கொடுத்தது:</span>
                        <span>₹{invoice.amountPaid.toLocaleString()}</span>
                      </div>
                      {invoice.balanceReturn > 0 && (
                        <div className="flex justify-between font-bold text-black">
                          <span>மீதி திருப்பியது:</span>
                          <span>₹{invoice.balanceReturn.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center pt-3 border-t border-dashed border-black text-[14px]">
                  <p className="font-bold">*** வருகைக்கு நன்றி ***</p>
                </div>
              </div>
            )
          ) : (
            /* ================= A4 TAX INVOICE LAYOUT ================= */
            <div className="print-area max-w-2xl mx-auto bg-white p-8 border border-[#EDE2E5] shadow-sm rounded-xl space-y-6 text-[#29252A]">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#EDE2E5] pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                    <img
                      src={LOGO_SRC}
                      alt=""
                      className="h-11 w-auto object-contain select-none shrink-0"
                      draggable={false}
                    />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-2xl text-[#29252A] tracking-tight">
                      கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                    </h2>
                    <p className="text-[13px] text-[#756B70]">
                      29/14, ஆதிசெல்வன் தெரு, அம்மாப்பேட்டை, சேலம்-3
                    </p>
                    <p className="text-[13px] text-[#756B70]">
                      தொலைபேசி: 0427-2243676 செல்: 9360013676, 9043013676
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#FFF0F3] text-[#C94F6D] font-extrabold text-[13px] tracking-wider">
                    வரி விலைப்பட்டியல்
                  </span>
                  <p className="font-mono font-bold text-[15px] text-[#29252A] mt-2">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-[13px] text-[#756B70] whitespace-nowrap">தேதி : {dateText}</p>
                  <p className="text-[13px] text-[#756B70] whitespace-nowrap">நேரம் : {timeText}</p>
                </div>
              </div>

              {/* Customer & Bill Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5] text-[13px]">
                <div>
                  <p className="font-bold text-[#756B70] tracking-wider text-[11px]">
                    பில் பெறுபவர்:
                  </p>
                  <p className="font-bold text-[#29252A] text-[15px] mt-0.5">{invoice.customerName}</p>
                  <p className="text-[#756B70]">தொலைபேசி: {invoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#756B70] tracking-wider text-[11px]">
                    பில் விவரங்கள்:
                  </p>
                  <p className="text-[#29252A] mt-0.5">கவுண்டர்: கவுண்டர் #1 (POS)</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#EDE2E5] rounded-xl overflow-hidden">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="bg-[#FFF9F5] border-b border-[#EDE2E5] text-xs font-bold text-[#756B70]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">பொருள் விவரம்</th>
                      <th className="py-2.5 px-3">வகை</th>
                      <th className="py-2.5 px-3 text-right">அளவு</th>
                      <th className="py-2.5 px-3 text-right">விலை</th>
                      <th className="py-2.5 px-3 text-right">தொகை</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE2E5]">
                    {invoice.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 text-[#756B70]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-[#29252A]">{it.productName}</td>
                        <td className="py-2.5 px-3 text-[#756B70]">{it.category}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">₹{it.price}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#29252A]">
                          ₹{it.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-80 space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-[#756B70]">
                    <span>வரிக்குட்பட்ட மதிப்பு:</span>
                    <span className="font-semibold text-[#29252A]">₹{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-[#3FA56B]">
                      <span>தள்ளுபடி:</span>
                      <span className="font-semibold">-₹{invoice.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {hasGst && (
                    <>
                      <div className="flex justify-between text-[#756B70]">
                        <span>சி.ஜி.எஸ்.டி (2.5%):</span>
                        <span className="font-semibold text-[#29252A]">₹{invoice.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#756B70]">
                        <span>எஸ்.ஜி.எஸ்.டி (2.5%):</span>
                        <span className="font-semibold text-[#29252A]">₹{invoice.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-[#EDE2E5] text-[17px] font-extrabold text-[#29252A]">
                    <span>மொத்த தொகை:</span>
                    <span className="text-[#C94F6D] text-xl font-extrabold">
                      ₹{invoice.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#756B70] pt-1">
                    <span>செலுத்தும் முறை:</span>
                    <span className="font-semibold text-[#29252A]">{invoice.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signature & Terms */}
              <div className="pt-6 border-t border-[#EDE2E5] flex justify-between items-end text-[13px] text-[#756B70]">
                <div>
                  <p className="font-semibold text-[#29252A]">நிபந்தனைகள்:</p>
                  <p className="text-xs">1. விற்ற பொருட்கள் திரும்பப் பெறப்படவோ மாற்றப்படவோ மாட்டாது.</p>
                  <p className="text-xs">2. பால் இனிப்புகளை 24 மணி நேரத்திற்குள் உண்ணவும்.</p>
                </div>
                <div className="text-right">
                  <div className="h-10"></div>
                  <p className="border-t border-[#29252A]/40 pt-1 font-bold text-[#29252A]">
                    அங்கீகரிக்கப்பட்ட கையொப்பம்
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};