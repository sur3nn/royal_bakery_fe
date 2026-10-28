import React from 'react';
import { Product, LabelPrintOptions } from '../types';

// BarTender label setup (all values in mm)
export const LABEL_SPEC = {
  width: 45.5,
  height: 24.0,
  marginTop: 5.0,
  marginBottom: 72.6, // leftover space below the labels on the page
  marginLeft: 5.0,
  marginRight: 5.0,
  gapHorizontal: 3.3,
  gapVertical: 0.0,
  columns: 2,
};

/* -------------------------------------------------------------------------- */
/*  Single sticker                                                            */
/* -------------------------------------------------------------------------- */

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
  const { width, height } = LABEL_SPEC;

  return (
    <div
      className={`label-sticker-page bg-white text-black box-border flex flex-col justify-start overflow-hidden select-none ${
        isPrint
          ? isA4Sheet
            ? 'border border-neutral-300 rounded-[1mm]'
            : 'border border-transparent'
          : 'relative rounded-[1.5mm] border border-gray-300 shadow-xs'
      } ${className}`}
      style={{
        width: `${width}mm`,
        height: `${height}mm`,
        maxWidth: `${width}mm`,
        maxHeight: `${height}mm`,
        minWidth: `${width}mm`,
        minHeight: `${height}mm`,
        padding: '0.8mm 1.5mm 0.5mm 1.5mm',
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
          className="w-full flex items-center justify-center leading-none border-b border-black/20 pb-[0.5mm] shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.2)' }}
        >
          <span
            className="text-[7pt] font-black tracking-wider uppercase text-center truncate text-black"
            style={{ color: '#000000', letterSpacing: '0.03em' }}
          >
            {options.shopName || 'ROYAL SWEETS'}
          </span>
        </div>
      )}

      {/* 2. Center: Product Name */}
      <div
        className="label-product-name-box w-full flex-1 flex items-center justify-center px-[0.5mm] py-0 overflow-hidden text-center"
        style={{ textAlign: 'center', width: '100%' }}
      >
        <div
          className="label-product-name-text text-[12.5pt] font-black leading-[1.15] text-center line-clamp-2 break-words text-black"
          style={{
            color: '#000000',
            textAlign: 'center',
            width: '100%',
            margin: '0 auto',
            display: 'block',
          }}
          title={product.name}
        >
          {product.name}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Print sheet (2-column roll layout with BarTender margins and gaps)        */
/* -------------------------------------------------------------------------- */

interface BarcodeStickerSheetProps {
  products: Product[];
  options: LabelPrintOptions;
  /** Set true for continuous rolls: page height = top margin + one label row */
  continuousRoll?: boolean;
}

export const BarcodeStickerSheet: React.FC<BarcodeStickerSheetProps> = ({
  products,
  options,
  continuousRoll = false,
}) => {
  const L = LABEL_SPEC;

  // 5 + 45.5 + 3.3 + 45.5 + 5 = 104.3mm
  const pageWidth =
    L.marginLeft + L.columns * L.width + (L.columns - 1) * L.gapHorizontal + L.marginRight;
  // 5 + 24 + 72.6 = 101.6mm (4")
  const pageHeight = continuousRoll
    ? L.marginTop + L.height
    : L.marginTop + L.height + L.marginBottom;

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }
          body { margin: 0; }
        }
      `}</style>

      <div
        className="label-sheet"
        style={{
          width: `${pageWidth}mm`,
          boxSizing: 'border-box',
          padding: `${L.marginTop}mm ${L.marginRight}mm 0 ${L.marginLeft}mm`,
          display: 'grid',
          gridTemplateColumns: `repeat(${L.columns}, ${L.width}mm)`,
          columnGap: `${L.gapHorizontal}mm`,
          rowGap: `${L.gapVertical}mm`,
        }}
      >
        {products.map((p) => (
          <BarcodeSticker key={p.id} product={p} options={options} isPrint />
        ))}
      </div>
    </>
  );
};

export default BarcodeSticker;