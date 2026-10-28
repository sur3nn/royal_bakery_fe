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

// TEST MODE: true = always print the static English text below.
// Set to false once printing works to use real product / shop names again.
const USE_STATIC_ENGLISH = true;
const STATIC_SHOP_NAME = 'ROYAL SWEETS';
const STATIC_PRODUCT_NAME = 'ALMOND CAKE';

export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
  product,
  options,
  previewScale = 1.0,
  className = '',
  isPrint = false,
  isA4Sheet = false,
}) => {
  const shopName = USE_STATIC_ENGLISH ? STATIC_SHOP_NAME : options.shopName || 'ROYAL SWEETS';
  const productName = USE_STATIC_ENGLISH ? STATIC_PRODUCT_NAME : product.name;
  const showShop = USE_STATIC_ENGLISH ? true : options.showShopName;

  // Exactly 50mm wide x 25mm high. All print-critical styles are inline
  // (no Tailwind breakpoints, no truncate, no letter-spacing, no line-clamp).
  return (
    <div
      className={`label-sticker-page ${className}`}
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        width: '50mm',
        height: '25mm',
        maxWidth: '50mm',
        maxHeight: '25mm',
        minWidth: '50mm',
        minHeight: '25mm',
        padding: '0.8mm 1.5mm 0.5mm 1.5mm',
        position: 'relative',
        transform: !isPrint && previewScale !== 1.0 ? `scale(${previewScale})` : undefined,
        transformOrigin: 'top left',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000000',
        backgroundColor: '#ffffff',
        border: isPrint
          ? isA4Sheet
            ? '0.2mm solid #d4d4d4'
            : 'none'
          : '1px solid #d1d5db',
        borderRadius: isPrint && !isA4Sheet ? 0 : '1mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* 1. Header: Shop Name */}
      {showShop && (
        <div
          style={{
            width: '100%',
            height: '5mm',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '0.2mm solid #000000',
            paddingBottom: '0.5mm',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: '7.5pt',
              fontWeight: 900,
              lineHeight: 1,
              textTransform: 'uppercase',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              color: '#000000',
            }}
          >
            {shopName}
          </span>
        </div>
      )}

      {/* 2. Center: Product Name */}
      <div
        className="label-product-name-box"
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <div
          className="label-product-name-text"
          style={{
            width: '100%',
            fontSize: '13pt', // fixed: same on screen and in print
            fontWeight: 900,
            lineHeight: 1.15,
            textAlign: 'center',
            wordBreak: 'break-word',
            color: '#000000',
          }}
          title={productName}
        >
          {productName}
        </div>
      </div>
    </div>
  );
};