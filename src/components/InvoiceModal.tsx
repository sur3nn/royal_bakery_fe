import React, { useState } from 'react';
import { X, Printer, Receipt } from 'lucide-react';
import { Invoice } from '../types';
import { LOGO_SRC } from './Header';
import { formatDateTime } from './Bakerylabels';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('thermal');

  if (!invoice) return null;

  // Extra fields added by BulkOrdersView for kitchen / packing slips
  const k: any = invoice;
  const isKot = !!k.isKot;
  const isKitchen = k.kotType === 'kitchen';

  const handlePrint = () => {
    window.print();
  };

  // Slips are always thermal
  const isThermal = isKot || printMode === 'thermal';

  // Single-line date + time
  const dateTimeText = invoice.createdAt
    ? formatDateTime(invoice.createdAt)
    : `${invoice.dateOnly ?? ''} ${invoice.timeOnly ?? ''}`.trim();

  // For a 58mm roll: change 80mm -> 58mm and 68mm -> 48mm below.
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
    width: 68mm !important;
    max-width: 68mm !important;
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
    font-size: 13px !important;
    border-color: #000 !important;
    box-sizing: border-box;
  }
  .thermal-receipt h2 { font-size: 17px !important; font-weight: 800 !important; }
  .thermal-receipt .grand { font-size: 17px !important; font-weight: 800 !important; }
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
  console.log("invoice", invoice);

  return (
    <div className="print-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <style>{printStyles}</style>

      <div className="print-modal bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#EDE2E5] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-gradient-to-r from-white to-[#FFF9F5] border-b border-[#EDE2E5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C94F6D]" />
            <h3 className="font-bold text-sm sm:text-base text-[#29252A]">
              {isKot ? k.kotTitle : 'Invoice Preview'}:{' '}
              <span className="text-[#C94F6D]">{invoice.invoiceNumber}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle format (not needed for kitchen / packing slips) */}
            {!isKot && (
              <div className="flex items-center bg-white border border-[#EDE2E5] rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPrintMode('thermal')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${isThermal ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                    }`}
                >
                  Thermal (80mm)
                </button>
                <button
                  onClick={() => setPrintMode('a4')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${!isThermal ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                    }`}
                >
                  A4 Tax Invoice
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
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
              <div className="print-area thermal-receipt max-w-[340px] mx-auto bg-white p-5 border border-[#EDE2E5] shadow-sm rounded-xl font-mono text-[13px] text-black">
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
                  <h2 className="font-extrabold text-base tracking-tight text-black font-sans text-center">
                    கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                  </h2>
                  <p className="font-extrabold text-base tracking-wide text-center">{k.kotTitle}</p>
                </div>

                {/* Order info */}
                <div className="py-2.5 space-y-1 border-b border-dashed border-black text-[13px]">
                  <div className="flex justify-between gap-2">
                    <span>Order No</span>
                    <b className="text-right">{invoice.invoiceNumber}</b>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Customer</span>
                    <b className="text-right">{invoice.customerName}</b>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Delivery</span>
                    <b className="text-right">{k.deliveryText}</b>
                  </div>
                  {k.occasion && (
                    <div className="flex justify-between gap-2">
                      <span>Occasion</span>
                      <b className="text-right">{k.occasion}</b>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="py-3 border-b border-dashed border-black space-y-3">
                  <div className="flex justify-between font-bold pb-1 border-b border-black">
                    <span>ITEM</span>
                    <span>{isKitchen ? 'TOTAL TO MAKE' : 'PACKING'}</span>
                  </div>

                  {(k.kotLines || []).map((l: any, i: number) => (
                    <div key={i}>
                      <p className="font-bold leading-tight break-words">{l.name}</p>

                      {isKitchen ? (
                        <div className="flex justify-between pl-2">
                          <span>Make</span>
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
                    <p className="font-bold">Note:</p>
                    <p className="break-words">{k.specialInstructions}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-3 text-[12px]">
                  <p className="font-bold">*** {isKitchen ? 'KITCHEN COPY' : 'PACKING COPY'} ***</p>
                </div>
              </div>
            ) : (
              /* ================= THERMAL 80mm RECEIPT LAYOUT ================= */
              <div className="print-area thermal-receipt max-w-[340px] mx-auto bg-white p-5 border border-[#EDE2E5] shadow-sm rounded-xl font-mono text-[13px] text-black">
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
                  <h2 className="font-extrabold text-base tracking-tight text-black font-sans text-center">
                    கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                  </h2>
                  <p className="text-[12px] text-black text-center">
                    29/14, ஆதிசெல்வன் தெரு, அம்மாப்பேட்டை, சேலம்-3
                  </p>
                  <p className="text-[12px] text-black text-center">
                    PH: 0427-2243676 Cell: 9360013676, 9043013676
                  </p>
                  {/* <p className="text-[12px] text-black font-bold">
                    FSSAI Lic No: 12423008000456
                  </p> */}
                </div>

                {/* Bill Details */}
                <div className="py-2.5 space-y-1 border-b border-dashed border-black text-[13px]">
                  <p className="nowrap whitespace-nowrap">Bill No: {invoice.invoiceNumber}</p>
                  <p className="nowrap whitespace-nowrap">Date: {dateTimeText}</p>
                  {invoice.customerName && invoice.customerName !== 'Counter Customer' ? (
                    <>
                      <p className="font-bold text-black text-sm mt-0.5">{invoice.customerName}</p>
                      <p className="text-black">Phone: {invoice.customerPhone}</p>
                    </>
                  ) : (
                    <p className="font-bold text-black text-sm mt-0.5">Counter Customer</p>
                  )}
                </div>

                {/* Items List (name on its own line, qty x rate and amount below) */}
                <div className="py-3 border-b border-dashed border-black space-y-2">
                  <div className="flex justify-between font-bold text-[13px] pb-1 border-b border-black">
                    <span>ITEM</span>
                    <span>QTY x RATE = AMT</span>
                  </div>
                  {invoice.items.map((it, idx) => (
                    <div key={idx} className="text-[13px]">
                      <p className="font-bold text-black leading-tight break-words">{it.productName}</p>
                      <div className="flex justify-between text-black">
                        <span className="whitespace-nowrap">
                          {it.quantity} {it.unit}
                        </span>
                        <span className="font-bold whitespace-nowrap">
                          ₹{it.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax & Grand Total */}
                <div className="py-2.5 space-y-1 text-[13px] border-b border-dashed border-black">
                  <div className="flex justify-between text-black">
                    <span>Item Subtotal:</span>
                    <span>₹{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-black">
                      <span>Discount:</span>
                      <span>-₹{invoice.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {hasGst && (
                    <>
                      <div className="flex justify-between text-black">
                        <span>CGST (2.5%):</span>
                        <span>₹{invoice.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-black">
                        <span>SGST (2.5%):</span>
                        <span>₹{invoice.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 font-extrabold text-black font-sans">
                    <span className="grand">NET PAYABLE:</span>
                    <span className="grand">₹{invoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment tender info */}
                <div className="py-2 space-y-1 text-[12px] text-black border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>Paid By: {invoice.paymentMethod}</span>
                    <span>Tendered: ₹{invoice.amountPaid.toLocaleString()}</span>
                  </div>
                  {invoice.balanceReturn > 0 && (
                    <div className="flex justify-between font-bold text-black">
                      <span>Change Returned:</span>
                      <span>₹{invoice.balanceReturn.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Footer Blessing */}
                <div className="text-center pt-3 text-[12px] text-black space-y-0.5">
                  <p className="font-bold">*** THANK YOU FOR VISITING ***</p>
                  <p>Taste the Tradition of Pure Ghee Sweets!</p>
                  <p>Have a Sweet Day Ahead!</p>
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
                    <h2 className="font-extrabold text-xl text-[#29252A] tracking-tight">
                      கனகராஜ் கேட்டரிங் & ஸ்வீட்ஸ்
                    </h2>
                    <p className="text-xs text-[#756B70]">
                      29/14, ஆதிசெல்வன் தெரு, அம்மாப்பேட்டை, சேலம்-3
                    </p>
                    <p className="text-xs text-[#756B70]">
                      PH: 0427-2243676 Cell: 9360013676, 9043013676
                    </p>
                    {/* <p className="text-[11px] font-semibold text-[#C94F6D]">
                      FSSAI Lic No: 12423008000456
                    </p> */}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#FFF0F3] text-[#C94F6D] font-extrabold text-xs uppercase tracking-wider">
                    Tax Invoice
                  </span>
                  <p className="font-mono font-bold text-sm text-[#29252A] mt-2">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-[#756B70] whitespace-nowrap">
                    Date : {formatDateTime(invoice.createdAt ?? `${invoice.dateOnly} ${invoice.timeOnly}`)}
                  </p>
                </div>
              </div>

              {/* Customer & Bill Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5] text-xs">
                <div>
                  <p className="font-bold text-[#756B70] uppercase tracking-wider text-[10px]">
                    Billed To:
                  </p>
                  <p className="font-bold text-[#29252A] text-sm mt-0.5">{invoice.customerName}</p>
                  <p className="text-[#756B70]">Phone: {invoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#756B70] uppercase tracking-wider text-[10px]">
                    Billing Details:
                  </p>
                  <p className="text-[#29252A] mt-0.5">Counter: Counter #1 (POS)</p>
                  {/* <p className="text-[#29252A]">Cashier: {invoice.cashierName}</p> */}
                  {/* <p className="font-semibold text-[#3FA56B]">Status: {invoice.status}</p> */}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#EDE2E5] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FFF9F5] border-b border-[#EDE2E5] text-[11px] font-bold text-[#756B70] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
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
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#756B70]">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-[#29252A]">₹{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-[#3FA56B]">
                      <span>Discount:</span>
                      <span className="font-semibold">-₹{invoice.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {hasGst && (
                    <>
                      <div className="flex justify-between text-[#756B70]">
                        <span>CGST (2.5%):</span>
                        <span className="font-semibold text-[#29252A]">₹{invoice.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#756B70]">
                        <span>SGST (2.5%):</span>
                        <span className="font-semibold text-[#29252A]">₹{invoice.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-[#EDE2E5] text-base font-extrabold text-[#29252A]">
                    <span>Grand Total:</span>
                    <span className="text-[#C94F6D] text-lg font-extrabold">
                      ₹{invoice.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#756B70] pt-1">
                    <span>Payment Mode:</span>
                    <span className="font-semibold text-[#29252A]">{invoice.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signature & Terms */}
              <div className="pt-6 border-t border-[#EDE2E5] flex justify-between items-end text-xs text-[#756B70]">
                <div>
                  <p className="font-semibold text-[#29252A]">Terms & Conditions:</p>
                  <p className="text-[11px]">1. Goods once sold will not be taken back or exchanged.</p>
                  <p className="text-[11px]">2. Consume fresh milk sweets within 24 hours.</p>
                </div>
                <div className="text-right">
                  <div className="h-10"></div>
                  <p className="border-t border-[#29252A]/40 pt-1 font-bold text-[#29252A]">
                    Authorized Signatory
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