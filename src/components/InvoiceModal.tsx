import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Cake, 
  FileText, 
  Receipt,
  Sparkles,
  Share2
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('thermal');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#EDE2E5] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-gradient-to-r from-white to-[#FFF9F5] border-b border-[#EDE2E5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C94F6D]" />
            <h3 className="font-bold text-sm sm:text-base text-[#29252A]">
              Invoice Preview: <span className="text-[#C94F6D]">{invoice.invoiceNumber}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle format */}
            <div className="flex items-center bg-white border border-[#EDE2E5] rounded-xl p-1 text-xs">
              <button
                onClick={() => setPrintMode('thermal')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  printMode === 'thermal' ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                onClick={() => setPrintMode('a4')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  printMode === 'a4' ? 'bg-[#C94F6D] text-white' : 'text-[#756B70]'
                }`}
              >
                A4 Tax Invoice
              </button>
            </div>

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
        <div className="p-4 sm:p-8 max-h-[80vh] overflow-y-auto print-container bg-[#FAFAFA]">
          {printMode === 'thermal' ? (
            /* THERMAL 80mm RECEIPT LAYOUT */
            <div className="max-w-[340px] mx-auto bg-white p-5 border border-[#EDE2E5] shadow-sm rounded-xl font-mono text-xs text-[#29252A]">
              {/* Brand Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#756B70]/40">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center mx-auto mb-1">
                  <Cake className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-base tracking-tight text-[#29252A] font-sans">
                  ROYAL SWEETS & BAKERY
                </h2>
                <p className="text-[10px] text-[#756B70]">
                  42, North Mada St, Mylapore, Chennai - 04
                </p>
                <p className="text-[10px] text-[#756B70]">
                  Tel: +91 44 2498 7654 • GSTIN: 33AAAAA0000A1Z5
                </p>
                <p className="text-[10px] text-[#C94F6D] font-bold">
                  FSSAI Lic No: 12423008000456
                </p>
              </div>

              {/* Bill Details */}
              <div className="py-2.5 space-y-1 border-b border-dashed border-[#756B70]/40 text-[11px]">
                <div className="flex justify-between">
                  <span>Bill No: {invoice.invoiceNumber}</span>
                  <span>{invoice.dateOnly}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier: {invoice.cashierName}</span>
                  <span>{invoice.timeOnly}</span>
                </div>
                {invoice.customerName && invoice.customerName !== 'Counter Customer' && (
                  <div className="text-[10px] text-[#756B70] pt-0.5">
                    Customer: {invoice.customerName} ({invoice.customerPhone})
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-[#756B70]/40 space-y-2">
                <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-[#EDE2E5]">
                  <span>ITEM</span>
                  <span className="text-right">QTY x RATE</span>
                  <span className="text-right">AMT</span>
                </div>
                {invoice.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="pr-1 flex-1">
                      <p className="font-bold text-[#29252A] leading-tight">{it.productName}</p>
                    </div>
                    <div className="text-right whitespace-nowrap text-[#756B70] pr-2">
                      {it.quantity} {it.unit} x {it.price}
                    </div>
                    <div className="text-right font-bold whitespace-nowrap text-[#29252A]">
                      ₹{it.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax & Grand Total */}
              <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-[#756B70]/40">
                <div className="flex justify-between text-[#756B70]">
                  <span>Item Subtotal:</span>
                  <span>₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-[#3FA56B]">
                    <span>Discount:</span>
                    <span>-₹{invoice.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#756B70]">
                  <span>CGST (2.5%):</span>
                  <span>₹{invoice.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#756B70]">
                  <span>SGST (2.5%):</span>
                  <span>₹{invoice.sgst.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2 font-extrabold text-sm text-[#29252A] font-sans">
                  <span>NET PAYABLE:</span>
                  <span className="text-[#C94F6D] text-base">₹{invoice.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment tender info */}
              <div className="py-2 space-y-1 text-[10px] text-[#756B70] border-b border-dashed border-[#756B70]/40">
                <div className="flex justify-between">
                  <span>Paid By: {invoice.paymentMethod}</span>
                  <span>Tendered: ₹{invoice.amountPaid.toLocaleString()}</span>
                </div>
                {invoice.balanceReturn > 0 && (
                  <div className="flex justify-between font-bold text-[#3FA56B]">
                    <span>Change Returned:</span>
                    <span>₹{invoice.balanceReturn.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Footer Blessing */}
              <div className="text-center pt-3 text-[10px] text-[#756B70] space-y-0.5">
                <p className="font-bold text-[#C94F6D]">*** THANK YOU FOR VISITING ***</p>
                <p>Taste the Tradition of Pure Ghee Sweets!</p>
                <p>Have a Sweet Day Ahead!</p>
              </div>
            </div>
          ) : (
            /* A4 TAX INVOICE LAYOUT */
            <div className="max-w-2xl mx-auto bg-white p-8 border border-[#EDE2E5] shadow-sm rounded-xl space-y-6 text-[#29252A]">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#EDE2E5] pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#C94F6D] text-white flex items-center justify-center shadow-sm">
                    <Cake className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-[#29252A] tracking-tight">
                      Royal Sweets & Bakery
                    </h2>
                    <p className="text-xs text-[#756B70]">
                      42, North Mada Street, Mylapore, Chennai - 600004
                    </p>
                    <p className="text-xs text-[#756B70]">
                      Phone: +91 44 2498 7654 • GSTIN: 33AAAAA0000A1Z5
                    </p>
                    <p className="text-[11px] font-semibold text-[#C94F6D]">
                      FSSAI Lic No: 12423008000456
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#FFF0F3] text-[#C94F6D] font-extrabold text-xs uppercase tracking-wider">
                    Tax Invoice
                  </span>
                  <p className="font-mono font-bold text-sm text-[#29252A] mt-2">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-[#756B70]">
                    Date: {invoice.dateOnly} {invoice.timeOnly}
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
                  <p className="text-[#29252A]">Cashier: {invoice.cashierName}</p>
                  <p className="font-semibold text-[#3FA56B]">Status: {invoice.status}</p>
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
                  <div className="flex justify-between text-[#756B70]">
                    <span>CGST (2.5%):</span>
                    <span className="font-semibold text-[#29252A]">₹{invoice.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#756B70]">
                    <span>SGST (2.5%):</span>
                    <span className="font-semibold text-[#29252A]">₹{invoice.sgst.toLocaleString()}</span>
                  </div>
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
