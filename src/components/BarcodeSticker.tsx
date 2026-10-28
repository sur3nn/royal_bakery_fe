import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Product, LabelPrintOptions } from '../types';

interface BarcodeStickerProps {
  product: Product;
  options: LabelPrintOptions;
  previewScale?: number; // scale multiplier for on-screen preview (e.g. 1.0, 1.5, 2.0)
  className?: string;
  isPrint?: boolean;
}

export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
  product,
  options,
  previewScale = 1.0,
  className = '',
  isPrint = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Determine the code to encode in CODE128
  // Use product.barcode if set, otherwise product.code, otherwise safe fallback
  const rawCode = (product.barcode || product.code || `PR-${product.id || '0'}`).trim();
  // CODE128 supports ASCII 0-127. Sanitize to prevent non-ASCII barcode rendering crash
  const safeBarcode = rawCode.replace(/[^\x20-\x7E]/g, '') || `PR-${product.id || '0'}`;

  useEffect(() => {
    if (svgRef.current && options.showBarcode) {
      try {
        // Clear previous SVG contents
        while (svgRef.current.firstChild) {
          svgRef.current.removeChild(svgRef.current.firstChild);
        }

        JsBarcode(svgRef.current, safeBarcode, {
          format: 'CODE128',
          width: 1.15,
          height: 24,
          displayValue: false, // We render the human-readable text separately for precise typography
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode render warning for code:', safeBarcode, err);
      }
    }
  }, [safeBarcode, options.showBarcode]);

  // Formatted price display
  const priceDisplay =
    product.sellingPrice != null && Number(product.sellingPrice) > 0
      ? `₹${Number(product.sellingPrice).toFixed(0)}${product.unit ? ` / ${product.unit}` : ''}`
      : null;

  // Formatted date display (DD/MM/YY)
  const formattedDate = (() => {
    if (!options.packedDate) return '';
    try {
      const parts = options.packedDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      }
      return options.packedDate;
    } catch {
      return options.packedDate;
    }
  })();

  // 50mm x 25mm exact dimensions
  return (
    <div
      className={`label-sticker-page bg-white text-black box-border flex flex-col justify-between overflow-hidden select-none ${
        isPrint ? '' : 'relative rounded-[2mm] border border-gray-300 shadow-xs'
      } ${className}`}
      style={{
        width: '50mm',
        height: '25mm',
        maxWidth: '50mm',
        maxHeight: '25mm',
        minWidth: '50mm',
        minHeight: '25mm',
        padding: '1.2mm 1.5mm',
        transform: !isPrint && previewScale !== 1.0 ? `scale(${previewScale})` : undefined,
        transformOrigin: 'top left',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Header Row: Shop brand & Category/Unit */}
      <div className="flex items-center justify-between leading-none w-full border-b border-black/10 pb-[0.3mm]">
        {options.showShopName && (
          <span className="text-[6.5pt] font-black tracking-wider uppercase truncate max-w-[32mm] text-black">
            {options.shopName || 'ROYAL SWEETS'}
          </span>
        )}
        <span className="text-[5.5pt] font-semibold text-neutral-600 truncate ml-auto uppercase tracking-tight">
          {product.category || 'BAKERY'}
        </span>
      </div>

      {/* 2. Product Name: Bold, clear, tight line-height */}
      <div className="w-full my-[0.4mm] px-[0.2mm]">
        <div
          className="text-[8.5pt] font-extrabold text-black leading-[1.08] line-clamp-2 break-words"
          title={product.name}
        >
          {product.name}
        </div>
      </div>

      {/* 3. Barcode & Human Readable Code */}
      {options.showBarcode ? (
        <div className="flex flex-col items-center justify-center w-full my-[0.2mm] overflow-hidden">
          {/* Barcode SVG with quiet zones */}
          <div className="w-full flex items-center justify-center px-[1mm] overflow-hidden">
            <svg
              ref={svgRef}
              className="max-w-full h-[6.5mm] object-contain"
              style={{ display: 'block' }}
            />
          </div>
          {/* Human readable SKU / Barcode text */}
          {options.showSkuText && (
            <div className="text-[6pt] font-mono font-bold tracking-[0.1em] text-neutral-800 leading-none mt-[0.3mm]">
              *{safeBarcode}*
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {options.showSkuText && (
            <div className="text-[7.5pt] font-mono font-bold tracking-wider text-neutral-800">
              SKU: {safeBarcode}
            </div>
          )}
        </div>
      )}

      {/* 4. Footer Row: Price (MRP) and Packed Date / Expiry */}
      <div className="flex items-end justify-between leading-none w-full pt-[0.3mm] border-t border-black/10">
        {options.showPrice && priceDisplay ? (
          <div className="flex items-baseline gap-[0.5mm]">
            <span className="text-[5.5pt] font-bold text-neutral-500 uppercase">MRP:</span>
            <span className="text-[8.5pt] font-black text-black tracking-tight">{priceDisplay}</span>
          </div>
        ) : (
          <div className="text-[6pt] font-semibold text-neutral-600">
            {product.unit ? `Unit: ${product.unit}` : ''}
          </div>
        )}

        {options.showPackedDate && formattedDate && (
          <div className="text-[5.5pt] font-semibold text-neutral-700 tracking-tight text-right ml-auto">
            <span>Pkd: </span>
            <span className="font-bold">{formattedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};
