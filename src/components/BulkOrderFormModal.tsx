import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles 
} from 'lucide-react';
import { BulkOrder, Product } from '../types';

interface BulkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSave: (order: BulkOrder) => void;
}

export const BulkOrderFormModal: React.FC<BulkOrderFormModalProps> = ({
  isOpen,
  onClose,
  products,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-23');
  const [deliveryTime, setDeliveryTime] = useState('16:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [occasion, setOccasion] = useState<BulkOrder['occasion']>('Wedding');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Dynamic order items
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    productName: string;
    unit: string;
    price: number;
    quantity: number;
    total: number;
  }>>([
    {
      productId: products[0]?.id || 'prod-1',
      productName: products[0]?.name || 'Special Ghee Laddu',
      unit: products[0]?.unit || 'Kg',
      price: products[0]?.sellingPrice || 580,
      quantity: 10,
      total: (products[0]?.sellingPrice || 580) * 10,
    }
  ]);

  const [advancePaid, setAdvancePaid] = useState<number>(3000);

  if (!isOpen) return null;

  // Add an item row
  const handleAddItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setOrderItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        unit: defaultProd.unit,
        price: defaultProd.sellingPrice,
        quantity: 5,
        total: defaultProd.sellingPrice * 5,
      },
    ]);
  };

  // Update item selection or quantity
  const handleItemChange = (index: number, productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setOrderItems((prev) => {
      const updated = [...prev];
      const validQty = Math.max(1, quantity);
      updated[index] = {
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        price: prod.sellingPrice,
        quantity: validQty,
        total: prod.sellingPrice * validQty,
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalAmount = orderItems.reduce((acc, item) => acc + item.total, 0);
  const remainingAmount = Math.max(0, totalAmount - (advancePaid || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || orderItems.length === 0) return;

    const newOrder: BulkOrder = {
      id: `bo-${Date.now()}`,
      orderNumber: `BO-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      deliveryDate,
      deliveryTime,
      deliveryAddress: deliveryAddress.trim() || (deliveryType === 'Store Pickup' ? 'Counter Pickup (Royal Sweets Store)' : 'To be confirmed'),
      deliveryType,
      items: orderItems,
      totalAmount,
      advancePaid: Number(advancePaid) || 0,
      remainingAmount,
      status: 'Upcoming',
      occasion,
      specialInstructions: specialInstructions.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#EDE2E5] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#29252A]">
                Create Bulk / Catering Order
              </h3>
              <p className="text-xs text-[#756B70]">
                Record weddings, festive gift packs, and bulk event sweets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* 1. Customer Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="98401 23456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery & Occasion */}
          <div className="space-y-3 pt-3 border-t border-[#EDE2E5]">
            <h4 className="text-xs font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Delivery & Schedule</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Delivery Time *
                </label>
                <input
                  type="time"
                  required
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Delivery Mode
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                >
                  <option value="Home Delivery">Doorstep Delivery</option>
                  <option value="Store Pickup">Store Counter Pickup</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday Party</option>
                  <option value="Festival">Festival (Diwali/Pongal)</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Poojan / Religious">Poojan / Religious</option>
                  <option value="Other">Other Occasion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#29252A] block mb-1">
                Delivery Venue / Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Hall name, door no, street name, area..."
                className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
              />
            </div>
          </div>

          {/* 3. Items Selection */}
          <div className="space-y-3 pt-3 border-t border-[#EDE2E5]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bulk Order Items</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5]"
                >
                  {/* Product selector */}
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, e.target.value, item.quantity)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#EDE2E5] rounded-lg text-xs font-semibold text-[#29252A] outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.sellingPrice}/{p.unit})
                      </option>
                    ))}
                  </select>

                  {/* Quantity input */}
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, item.productId, Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-[#EDE2E5] rounded-lg text-xs font-bold text-[#29252A] text-center"
                    />
                    <span className="text-xs text-[#756B70]">{item.unit}</span>
                  </div>

                  {/* Row Total */}
                  <div className="w-24 text-right">
                    <span className="text-xs font-bold text-[#29252A]">
                      ₹{item.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={orderItems.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className={`p-1.5 text-[#756B70] hover:text-[#D9535F] cursor-pointer ${
                      orderItems.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Payment & Instructions */}
          <div className="space-y-3 pt-3 border-t border-[#EDE2E5]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#29252A] block mb-1">
                  Special Instructions / Packing Note
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. 250g individual gift boxes, ribbon packaging, no nuts on cake..."
                  className="w-full px-3 py-1.5 bg-white border border-[#EDE2E5] rounded-xl text-xs text-[#29252A] focus:border-[#C94F6D] outline-none"
                />
              </div>

              {/* Financial summary card */}
              <div className="p-3 rounded-xl bg-[#FFF0F3] border border-[#C94F6D]/20 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-[#29252A]">
                  <span>Total Order Amount:</span>
                  <span className="font-bold text-sm">₹{totalAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-[#29252A]">
                  <span>Advance Received:</span>
                  <div className="flex items-center gap-1 w-28">
                    <span className="font-bold">₹</span>
                    <input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(Number(e.target.value))}
                      className="w-full px-2 py-0.5 bg-white border border-[#EDE2E5] rounded text-xs font-bold text-[#3FA56B] text-right"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-[#C94F6D]/20 font-extrabold text-[#C94F6D] text-sm">
                  <span>Remaining Balance:</span>
                  <span>₹{remainingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#EDE2E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#EDE2E5] hover:bg-[#FFF4F6] text-xs font-semibold text-[#756B70] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-xs font-bold shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer"
            >
              Save Bulk Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
