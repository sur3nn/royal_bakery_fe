import React from 'react';
import { Product, LabelPrintOptions } from '../types';

interface BarcodeStickerProps {
  product: Product;
  options: LabelPrintOptions;
  previewScale?: number; // scale multiplier for on-screen preview (e.g. 1.0, 1.5, 2.0)
  className?: string;
  isPrint?: boolean;
  isA4Sheet?: boolean;
}

export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
  product,
  options,
  previewScale = 1.0,
  className = '',
  isPrint = false,
  isA4Sheet = false,
}) => {
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

  // 50mm x 25mm exact dimensions for product box sticker
  return (
    <div
      className={`label-sticker-page bg-white text-black box-border flex flex-col justify-between overflow-hidden select-none ${
        isPrint
          ? isA4Sheet
            ? 'border border-neutral-300 rounded-[1.5mm]'
            : ''
          : 'relative rounded-[2mm] border border-gray-300 shadow-xs'
      } ${className}`}
      style={{
        width: isA4Sheet && isPrint ? '48mm' : '50mm',
        height: isA4Sheet && isPrint ? '24.5mm' : '25mm',
        maxWidth: isA4Sheet && isPrint ? '48mm' : '50mm',
        maxHeight: isA4Sheet && isPrint ? '24.5mm' : '25mm',
        minWidth: isA4Sheet && isPrint ? '48mm' : '50mm',
        minHeight: isA4Sheet && isPrint ? '24.5mm' : '25mm',
        padding: '1.2mm 1.8mm',
        transform: !isPrint && previewScale !== 1.0 ? `scale(${previewScale})` : undefined,
        transformOrigin: 'top left',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Header: Shop Name */}
      {options.showShopName && (
        <div className="w-full flex items-center justify-center leading-none border-b border-black/15 pb-[0.4mm]">
          <span className="text-[7pt] font-black tracking-wider uppercase text-center truncate text-black">
            {options.shopName || 'ROYAL SWEETS'}
          </span>
        </div>
      )}

      {/* 2. Center: Large, prominent Product Name */}
      <div className="w-full flex-1 flex items-center justify-center px-[0.5mm] py-[0.5mm] my-auto overflow-hidden">
        <div
          className="text-[11.5pt] sm:text-[12pt] font-black text-black leading-[1.12] text-center line-clamp-2 break-words"
          title={product.name}
        >
          {product.name}
        </div>
      </div>

      {/* 3. Footer: Price (MRP) & Packed Date */}
      <div className="w-full flex items-end justify-between leading-none pt-[0.4mm] border-t border-black/15">
        {options.showPrice && priceDisplay ? (
          <div className="flex items-baseline gap-[0.5mm]">
            <span className="text-[5.5pt] font-bold text-neutral-600 uppercase">MRP:</span>
            <span className="text-[9pt] font-black text-black tracking-tight">{priceDisplay}</span>
          </div>
        ) : (
          <div className="text-[6pt] font-semibold text-neutral-600">
            {product.unit ? `Unit: ${product.unit}` : ''}
          </div>
        )}

        {options.showPackedDate && formattedDate && (
          <div className="text-[6pt] font-semibold text-neutral-800 tracking-tight text-right ml-auto">
            <span>Pkd: </span>
            <span className="font-bold">{formattedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};
