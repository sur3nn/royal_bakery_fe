import React from 'react';
import { Product, LabelPrintOptions } from '../types';

interface BarcodeStickerProps {
  product: Product;
  options: LabelPrintOptions;
  previewScale?: number; // scale multiplier for on-screen preview (e.g. 1.0, 1.4, 1.8)
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
  // Exactly 50mm wide x 25mm high for 2-column thermal label roll
  return (
    <div
      className={`label-sticker-page bg-white text-black box-border flex flex-col justify-between overflow-hidden select-none ${
        isPrint
          ? isA4Sheet
            ? 'border border-neutral-300 rounded-[1mm]'
            : 'border border-transparent'
          : 'relative rounded-[1.5mm] border border-gray-300 shadow-xs'
      } ${className}`}
      style={{
        width: '50mm',
        height: '25mm',
        maxWidth: '50mm',
        maxHeight: '25mm',
        minWidth: '50mm',
        minHeight: '25mm',
        padding: '1.2mm 2mm',
        transform: !isPrint && previewScale !== 1.0 ? `scale(${previewScale})` : undefined,
        transformOrigin: 'top left',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: '#000000',
        backgroundColor: '#ffffff',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* 1. Header: Shop Name */}
      {options.showShopName && (
        <div
          className="w-full flex items-center justify-center leading-none border-b border-black/20 pb-[0.6mm]"
          style={{ borderColor: 'rgba(0,0,0,0.2)' }}
        >
          <span
            className="text-[7.5pt] font-black tracking-wider uppercase text-center truncate text-black"
            style={{ color: '#000000', letterSpacing: '0.03em' }}
          >
            {options.shopName || 'ROYAL SWEETS'}
          </span>
        </div>
      )}

      {/* 2. Center: Large, prominent Product Name */}
      <div className="w-full flex-1 flex items-center justify-center px-[0.5mm] py-[0.5mm] my-auto overflow-hidden">
        <div
          className="text-[13pt] sm:text-[14pt] font-black leading-[1.18] text-center line-clamp-2 break-words text-black"
          style={{ color: '#000000' }}
          title={product.name}
        >
          {product.name}
        </div>
      </div>
    </div>
  );
};

