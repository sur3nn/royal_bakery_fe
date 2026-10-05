import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Plus, Trash2, Clock, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { BulkOrder, BulkOrderStatus, Product } from '../types';
import {
  FetchProductsAction,
  CreateBulkOrderAction,
  FetchBulkOrdersAction,
  FetchDashboardAction,
  FetchBulkOrderStatusesAction,
} from '../redux/actions/bakeryActions';
import { RootState } from '../redux/store';
import { bulkOrderLabels as t } from '../components/Bakerylabels';

interface BulkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// New Tamil labels for the box fields (move these into Bakerylabels if you like)
const box = {
  oneBox: 'ஒரு பெட்டி',
  boxes: 'பெட்டி',
  total: 'மொத்தம்',
  needSize: 'Enter the box size and number of boxes for every item.',
};

const getCurrentDate = (): string => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const getCurrentTime = (): string => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

// One line of the order.
// quantity = packSize x packCount  (kitchen makes this much)
// packSize and packCount           (packing team packs this)
type OrderItem = {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  packSize: number;
  packCount: number;
  quantity: number;
  total: number;
};

const makeItem = (p: Product, packSize = 1, packCount = 1): OrderItem => {
  const price = Number(p.sellingPrice) || 0;
  const quantity = +(packSize * packCount).toFixed(3);
  return {
    productId: String(p.id),
    productName: p.name,
    unit: p.unit,
    price,
    packSize,
    packCount,
    quantity,
    total: +(price * quantity).toFixed(2),
  };
};

const inputBase =
  'w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none';
const labelBase = 'text-sm font-bold text-[#29252A] block mb-2';
const heading = 'text-sm font-bold text-[#C94F6D] flex items-center gap-2';

export const BulkOrderFormModal: React.FC<BulkOrderFormModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const { ProductsData, ProductsLoad, ProductsError, BulkOrderActionLoad, BulkOrderStatusesData } =
    useSelector((state: RootState) => state.bakery);

  const products: Product[] = Array.isArray(ProductsData) ? ProductsData : [];
  const bulkOrderStatuses: BulkOrderStatus[] = Array.isArray(BulkOrderStatusesData) ? BulkOrderStatusesData : [];

  // The status ID is sent to the backend: prefer "Upcoming", else the first one.
  const defaultStatusId: number | null =
    bulkOrderStatuses.find((s) => s.name.toLowerCase() === 'upcoming')?.id ?? bulkOrderStatuses[0]?.id ?? null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(getCurrentDate());
  const [deliveryTime, setDeliveryTime] = useState(getCurrentTime());
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [occasion, setOccasion] = useState<BulkOrder['occasion']>('Wedding');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [formError, setFormError] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(FetchProductsAction({}));
    dispatch(FetchBulkOrderStatusesAction());
    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());
  }, [isOpen, dispatch]);

  // First line is added automatically once products are loaded
  useEffect(() => {
    if (!isOpen || products.length === 0 || orderItems.length > 0) return;
    setOrderItems([makeItem(products[0])]);
  }, [isOpen, products, orderItems.length]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setOrderItems((prev) => [...prev, makeItem(products[0])]);
  };

  // Change product, box size or number of boxes for one line
  const handleItemChange = (index: number, productId: string, packSize: number, packCount: number) => {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;
    setOrderItems((prev) => prev.map((it, i) => (i === index ? makeItem(product, packSize, packCount) : it)));
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = orderItems.reduce((sum, it) => sum + it.total, 0);
  const remainingAmount = Math.max(0, totalAmount - (advancePaid || 0));

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());
    setDeliveryAddress('');
    setDeliveryType('Home Delivery');
    setOccasion('Wedding');
    setSpecialInstructions('');
    setAdvancePaid(0);
    setOrderItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) return setFormError('Customer name is required.');
    if (customerPhone.length !== 10) return setFormError('Enter a valid 10-digit phone number.');
    if (orderItems.length === 0) return setFormError('Add at least one order item.');
    if (orderItems.some((it) => it.packSize <= 0 || it.packCount < 1)) return setFormError(box.needSize);
    if (Number(advancePaid) > totalAmount) return setFormError('Advance paid cannot exceed the total order amount.');
    if (defaultStatusId === null) return setFormError('Order statuses are not loaded yet. Please try again.');

    try {
      const newOrder: BulkOrder = {
        id: '',
        orderNumber: '', // assigned by the backend
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: '',
        deliveryDate,
        deliveryTime,
        deliveryAddress: deliveryType === 'Home Delivery' ? deliveryAddress.trim() : '',
        deliveryType,
        products: orderItems, // includes packSize, packCount and quantity
        totalAmount,
        advancePaid: Number(advancePaid) || 0,
        remainingAmount,
        status: defaultStatusId,
        occasion,
        specialInstructions: specialInstructions.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await dispatch(CreateBulkOrderAction(newOrder) as any).unwrap();

      dispatch(FetchBulkOrdersAction({}));
      dispatch(FetchDashboardAction({}));
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Create bulk order failed:', error);
      setFormError(error?.message || 'Failed to create bulk order');
    }
  };

  const handleClose = () => {
    if (!BulkOrderActionLoad) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border-2 border-[#EDE2E5] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#29252A]">{t.modalTitle}</h3>
              <p className="text-sm text-[#756B70] mt-0.5">{t.modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={BulkOrderActionLoad}
            aria-label={t.cancel}
            className="p-2.5 rounded-xl text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] cursor-pointer disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-7 max-h-[78vh] overflow-y-auto">
          {/* Customer */}
          <div className="space-y-4">
            <h4 className={heading}>
              <User className="w-4 h-4" />
              <span>{t.customerInfoHeading}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>{t.customerName}</label>
                <input
                  type="text"
                  required
                  placeholder={t.customerNamePlaceholder}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>{t.phoneNumber}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder={t.phonePlaceholder}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">
            <h4 className={heading}>
              <Clock className="w-4 h-4" />
              <span>{t.deliveryScheduleHeading}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelBase}>{t.deliveryDate}</label>
                <input type="date" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>{t.deliveryTime}</label>
                <input type="time" required value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelBase}>{t.deliveryMode}</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'Home Delivery' | 'Store Pickup')}
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="Home Delivery">{t.homeDelivery}</option>
                  <option value="Store Pickup">{t.storePickup}</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>{t.occasion}</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as BulkOrder['occasion'])}
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="Wedding">{t.occasionWedding}</option>
                  <option value="Birthday">{t.occasionBirthday}</option>
                  <option value="Festival">{t.occasionFestival}</option>
                  <option value="Corporate Event">{t.occasionCorporate}</option>
                  <option value="Poojan / Religious">{t.occasionReligious}</option>
                  <option value="Other">{t.occasionOther}</option>
                </select>
              </div>
            </div>

            {/* Address only matters for home delivery */}
            {deliveryType === 'Home Delivery' && (
              <div>
                <label className={labelBase}>{t.deliveryAddress}</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t.deliveryAddressPlaceholder}
                  className={inputBase}
                />
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">
            <div className="flex items-center justify-between gap-3">
              <h4 className={heading}>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.orderItemsHeading}</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={ProductsLoad || products.length === 0 || BulkOrderActionLoad}
                className="text-sm font-bold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-3 py-2 rounded-lg hover:bg-[#FFF0F3]"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addItemRow}</span>
              </button>
            </div>

            {ProductsLoad && <div className="py-6 text-center text-sm text-[#756B70]">{t.loadingProducts}</div>}
            {!ProductsLoad && ProductsError && <div className="py-6 text-center text-sm text-red-500">{t.errorLoadingProducts}</div>}
            {!ProductsLoad && !ProductsError && products.length === 0 && (
              <div className="py-6 text-center text-sm text-[#756B70]">{t.noProductsAvailable}</div>
            )}

            {!ProductsLoad && products.length > 0 && (
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="p-3 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5] space-y-2.5">
                    {/* Row 1: product + delete */}
                    <div className="flex items-center gap-2.5">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, e.target.value, item.packSize, item.packCount)}
                        disabled={BulkOrderActionLoad}
                        className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-semibold text-[#29252A] cursor-pointer"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name} (₹{Number(p.sellingPrice).toLocaleString()}/{p.unit})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={orderItems.length <= 1 || BulkOrderActionLoad}
                        onClick={() => handleRemoveItem(index)}
                        className="p-2.5 rounded-lg text-[#756B70] hover:text-[#D9535F] hover:bg-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Row 2: one box = [size] unit  x  [boxes] boxes  = total */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#756B70]">
                      <span>{box.oneBox}</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.packSize}
                        disabled={BulkOrderActionLoad}
                        onChange={(e) => handleItemChange(index, item.productId, Number(e.target.value) || 0, item.packCount)}
                        className="w-20 px-2.5 py-2 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#29252A] text-center"
                      />
                      <span>{item.unit}</span>

                      <span className="font-bold text-[#29252A]">×</span>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.packCount}
                        disabled={BulkOrderActionLoad}
                        onChange={(e) =>
                          handleItemChange(index, item.productId, item.packSize, Math.max(1, Math.floor(Number(e.target.value)) || 1))
                        }
                        className="w-20 px-2.5 py-2 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#29252A] text-center"
                      />
                      <span>{box.boxes}</span>

                      <span className="ml-auto text-[#29252A]">
                        {box.total}: <b>{item.quantity} {item.unit}</b>
                      </span>
                      <b className="w-24 text-right text-[#29252A]">₹{item.total.toLocaleString()}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes + money */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t-2 border-[#EDE2E5]">
            <div>
              <label className={labelBase}>{t.specialInstructions}</label>
              <textarea
                rows={3}
                value={specialInstructions}
                disabled={BulkOrderActionLoad}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={t.specialInstructionsPlaceholder}
                className={inputBase}
              />
            </div>

            <div className="p-4 rounded-xl bg-[#FFF0F3] border-2 border-[#C94F6D]/20 space-y-2.5 text-sm">
              <div className="flex justify-between font-semibold text-[#29252A]">
                <span>{t.totalOrderAmount}</span>
                <span className="font-bold text-base">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#29252A]">
                <span>{t.advanceReceived}</span>
                <div className="flex items-center gap-1.5 w-32">
                  <span className="font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={advancePaid}
                    disabled={BulkOrderActionLoad}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#3FA56B] text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t-2 border-[#C94F6D]/20 font-extrabold text-[#C94F6D] text-base">
                <span>{t.remainingBalance}</span>
                <span>₹{remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-[#D9535F] bg-[#FFF0F3] border border-[#D9535F]/30 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          <div className="pt-4 border-t border-[#EDE2E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={BulkOrderActionLoad}
              className="px-6 py-3.5 rounded-xl bg-white border-2 border-[#EDE2E5] hover:bg-[#FFF4F6] text-sm font-bold text-[#756B70] cursor-pointer disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              // disabled={ProductsLoad || products.length === 0 || orderItems.length === 0 || defaultStatusId === null || BulkOrderActionLoad}
              className="px-6 py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {BulkOrderActionLoad ? t.saving : t.saveBulkOrder}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkOrderFormModal;