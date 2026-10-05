import React from 'react';

export interface BulkItemInput {
  productId: number;
  productName: string;
  unit: string;       // kg, pcs ...
  packSize: number;   // size of ONE box
  packCount: number;  // number of boxes
  price: number;      // per unit
}

// Use this row inside your "New Bulk Order" form for every product line.
export const BulkItemRow: React.FC<{
  item: BulkItemInput;
  onChange: (item: BulkItemInput) => void;
  onRemove: () => void;
}> = ({ item, onChange, onRemove }) => {
  const total = item.packSize * item.packCount;
  const box = 'w-20 px-2 py-1.5 border border-[#EDE2E5] rounded-lg text-sm focus:border-[#C94F6D] outline-none';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-[#FFF9F5] border border-[#EDE2E5] rounded-xl">
      <p className="font-bold text-sm text-[#29252A] w-40 truncate">{item.productName}</p>

      <label className="text-xs text-[#756B70]">
        One box
        <input type="number" min={0} step="any" value={item.packSize} className={`${box} ml-2`}
          onChange={(e) => onChange({ ...item, packSize: Number(e.target.value) })} />
        <span className="ml-1">{item.unit}</span>
      </label>

      <label className="text-xs text-[#756B70]">
        Boxes
        <input type="number" min={1} step={1} value={item.packCount} className={`${box} ml-2`}
          onChange={(e) => onChange({ ...item, packCount: Math.max(1, Math.floor(Number(e.target.value))) })} />
      </label>

      <p className="text-sm font-bold text-[#C94F6D]">Total: {total} {item.unit}</p>

      <button type="button" onClick={onRemove} className="ml-auto text-xs text-[#D9535F] font-semibold cursor-pointer">
        Remove
      </button>
    </div>
  );
};