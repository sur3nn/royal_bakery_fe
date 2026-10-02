import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Clock,
  User,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { BulkOrder, Product } from '../types';

import {
  FetchProductsAction,
  CreateBulkOrderAction,
  FetchBulkOrdersAction,
  FetchDashboardAction,
} from '../redux/actions/bakeryActions';

import { RootState } from '../redux/store';
import { bulkOrderLabels as t } from '../components/Bakerylabels';

interface BulkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* =========================================================
   CURRENT DATE
========================================================= */

const getCurrentDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* =========================================================
   CURRENT TIME
========================================================= */

const getCurrentTime = (): string => {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const BulkOrderFormModal: React.FC<BulkOrderFormModalProps> = ({
  isOpen,
  onClose,
}) => {
  /* =======================================================
     REDUX
  ======================================================= */

  const dispatch = useDispatch();

  const {
    ProductsData,
    ProductsLoad,
    ProductsError,
    BulkOrderActionLoad,
  } = useSelector((state: RootState) => state.bakery);

  const products: Product[] = Array.isArray(ProductsData)
    ? ProductsData
    : [];

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  /* =======================================================
     DELIVERY
  ======================================================= */

  const [deliveryDate, setDeliveryDate] = useState(
    getCurrentDate()
  );

  const [deliveryTime, setDeliveryTime] = useState(
    getCurrentTime()
  );

  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [deliveryType, setDeliveryType] = useState<
    'Home Delivery' | 'Store Pickup'
  >('Home Delivery');

  const [occasion, setOccasion] =
    useState<BulkOrder['occasion']>('Wedding');

  /* =======================================================
     OTHER
  ======================================================= */

  const [specialInstructions, setSpecialInstructions] =
    useState('');

  const [advancePaid, setAdvancePaid] =
    useState<number>(0);

  /* =======================================================
     ORDER ITEMS
  ======================================================= */

  const [orderItems, setOrderItems] = useState<
    Array<{
      productId: string;
      productName: string;
      unit: string;
      price: number;
      quantity: number;
      total: number;
    }>
  >([]);

  /* =======================================================
     FETCH PRODUCTS WHEN MODAL OPENS
  ======================================================= */

  useEffect(() => {
    if (!isOpen) return;

    dispatch(FetchProductsAction({}));
  }, [isOpen, dispatch]);

  /* =======================================================
     SET CURRENT DATE/TIME WHEN MODAL OPENS
  ======================================================= */

  useEffect(() => {
    if (!isOpen) return;

    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());
  }, [isOpen]);

  /* =======================================================
     SET FIRST PRODUCT AFTER PRODUCTS LOAD
  ======================================================= */

  useEffect(() => {
    if (!isOpen) return;

    if (products.length === 0) return;

    if (orderItems.length > 0) return;

    const firstProduct = products[0];

    const price =
      Number(firstProduct.sellingPrice) || 0;

    setOrderItems([
      {
        productId: String(firstProduct.id),
        productName: firstProduct.name,
        unit: firstProduct.unit,
        price,
        quantity: 10,
        total: price * 10,
      },
    ]);
  }, [isOpen, products, orderItems.length]);

  /* =======================================================
     ADD ITEM
  ======================================================= */

  const handleAddItem = () => {
    if (products.length === 0) return;

    const defaultProduct = products[0];

    const price =
      Number(defaultProduct.sellingPrice) || 0;

    setOrderItems((prev) => [
      ...prev,
      {
        productId: String(defaultProduct.id),
        productName: defaultProduct.name,
        unit: defaultProduct.unit,
        price,
        quantity: 5,
        total: price * 5,
      },
    ]);
  };

  /* =======================================================
     CHANGE PRODUCT / QUANTITY
  ======================================================= */

  const handleItemChange = (
    index: number,
    productId: string,
    quantity: number
  ) => {
    const selectedProduct = products.find(
      (product) =>
        String(product.id) === String(productId)
    );

    if (!selectedProduct) return;

    const validQuantity = Math.max(
      1,
      Number(quantity) || 1
    );

    const price =
      Number(selectedProduct.sellingPrice) || 0;

    setOrderItems((prev) => {
      const updated = [...prev];

      updated[index] = {
        productId: String(selectedProduct.id),
        productName: selectedProduct.name,
        unit: selectedProduct.unit,
        price,
        quantity: validQuantity,
        total: price * validQuantity,
      };

      return updated;
    });
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;

    setOrderItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const totalAmount = orderItems.reduce(
    (total, item) => total + item.total,
    0
  );

  const remainingAmount = Math.max(
    0,
    totalAmount - (advancePaid || 0)
  );

  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');

    setDeliveryDate(getCurrentDate());
    setDeliveryTime(getCurrentTime());

    setDeliveryAddress('');
    setDeliveryType('Home Delivery');
    setOccasion('Wedding');

    setSpecialInstructions('');
    setAdvancePaid(0);

    setOrderItems([]);
  };

  /* =======================================================
     SUBMIT BULK ORDER
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!customerName.trim()) {
      return;
    }

    if (!customerPhone.trim()) {
      return;
    }

    if (orderItems.length === 0) {
      return;
    }

    try {
      /* ===================================================
         ORDER OBJECT
      =================================================== */

      const newOrder: BulkOrder = {
        id: `bo-${Date.now()}`,

        orderNumber: `BO-${new Date().getFullYear()}-${Math.floor(
          100 + Math.random() * 900
        )}`,

        customerName:
          customerName.trim(),

        customerPhone:
          customerPhone.trim(),

        customerEmail:
          customerEmail.trim() || '',

        deliveryDate,

        deliveryTime,

        deliveryAddress:
          deliveryAddress.trim() ||
          (deliveryType === 'Store Pickup'
            ? t.addressDefaultPickup
            : t.addressDefaultConfirm),

        deliveryType,

        products: orderItems,

        totalAmount,

        advancePaid:
          Number(advancePaid) || 0,

        remainingAmount,

        status: 'Upcoming',

        occasion,

        specialInstructions:
          specialInstructions.trim() ||
          undefined,

        createdAt:
          new Date().toISOString(),
      };

      

    

      /* ===================================================
         CREATE BULK ORDER
      =================================================== */

      await dispatch(
        CreateBulkOrderAction(newOrder)
      ).unwrap();

      /* ===================================================
         REFRESH BULK ORDERS
      =================================================== */

      dispatch(
        FetchBulkOrdersAction({})
      );

      /* ===================================================
         REFRESH DASHBOARD
      =================================================== */

      dispatch(
        FetchDashboardAction({})
      );

      /* ===================================================
         RESET FORM
      =================================================== */

      resetForm();

      /* ===================================================
         CLOSE MODAL
      =================================================== */

      onClose();

    } catch (error: any) {
      console.error(
        'Create bulk order failed:',
        error
      );

      // If you have a toast function,
      // you can show it here.
      //
      // addToast(
      //   'Error',
      //   error?.message ||
      //     'Failed to create bulk order',
      //   'error'
      // );
    }
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const handleClose = () => {
    if (BulkOrderActionLoad) return;

    onClose();
  };

  /* =======================================================
     MODAL
  ======================================================= */

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">

      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border-2 border-[#EDE2E5] overflow-hidden animate-in fade-in zoom-in-95">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="px-6 py-5 border-b-2 border-[#EDE2E5] flex items-center justify-between bg-gradient-to-r from-white to-[#FFF9F5]">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-xl bg-[#FFF0F3] text-[#C94F6D] flex items-center justify-center shrink-0">

              <ShoppingBag className="w-6 h-6" />

            </div>

            <div>

              <h3 className="font-bold text-xl text-[#29252A]">
                {t.modalTitle}
              </h3>

              <p className="text-sm text-[#756B70] mt-0.5">
                {t.modalSubtitle}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={BulkOrderActionLoad}
            aria-label={t.cancel}
            className="p-2.5 rounded-xl text-[#756B70] hover:bg-[#FFF4F6] hover:text-[#C94F6D] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="w-6 h-6" />
          </button>

        </div>

        {/* =================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-7 max-h-[78vh] overflow-y-auto"
        >

          {/* =================================================
              CUSTOMER INFORMATION
          ================================================== */}

          <div className="space-y-4">

            <h4 className="text-sm font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-2">

              <User className="w-4 h-4" />

              <span>
                {t.customerInfoHeading}
              </span>

            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.customerName}
                </label>

                <input
                  type="text"
                  required
                  placeholder={t.customerNamePlaceholder}
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
                />

              </div>

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.phoneNumber}
                </label>

                <input
                  type="tel"
                  required
                  placeholder={t.phonePlaceholder}
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
                />

              </div>

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.emailOptional}
                </label>

                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={customerEmail}
                  onChange={(e) =>
                    setCustomerEmail(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              DELIVERY & SCHEDULE
          ================================================== */}

          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">

            <h4 className="text-sm font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-2">

              <Clock className="w-4 h-4" />

              <span>
                {t.deliveryScheduleHeading}
              </span>

            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* DATE */}

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.deliveryDate}
                </label>

                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) =>
                    setDeliveryDate(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
                />

              </div>

              {/* TIME */}

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.deliveryTime}
                </label>

                <input
                  type="time"
                  required
                  value={deliveryTime}
                  onChange={(e) =>
                    setDeliveryTime(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
                />

              </div>

              {/* DELIVERY TYPE */}

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.deliveryMode}
                </label>

                <select
                  value={deliveryType}
                  onChange={(e) =>
                    setDeliveryType(
                      e.target.value as
                        | 'Home Delivery'
                        | 'Store Pickup'
                    )
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none cursor-pointer"
                >

                  <option value="Home Delivery">
                    {t.homeDelivery}
                  </option>

                  <option value="Store Pickup">
                    {t.storePickup}
                  </option>

                </select>

              </div>

              {/* OCCASION */}

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.occasion}
                </label>

                <select
                  value={occasion}
                  onChange={(e) =>
                    setOccasion(
                      e.target.value as BulkOrder['occasion']
                    )
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none cursor-pointer"
                >

                  <option value="Wedding">
                    {t.occasionWedding}
                  </option>

                  <option value="Birthday">
                    {t.occasionBirthday}
                  </option>

                  <option value="Festival">
                    {t.occasionFestival}
                  </option>

                  <option value="Corporate Event">
                    {t.occasionCorporate}
                  </option>

                  <option value="Poojan / Religious">
                    {t.occasionReligious}
                  </option>

                  <option value="Other">
                    {t.occasionOther}
                  </option>

                </select>

              </div>

            </div>

            {/* ADDRESS */}

            <div>

              <label className="text-sm font-bold text-[#29252A] block mb-2">
                {t.deliveryAddress}
              </label>

              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) =>
                  setDeliveryAddress(e.target.value)
                }
                placeholder={t.deliveryAddressPlaceholder}
                className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
              />

            </div>

          </div>

          {/* =================================================
              BULK ORDER ITEMS
          ================================================== */}

          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <h4 className="text-sm font-bold text-[#C94F6D] uppercase tracking-wider flex items-center gap-2">

                <ShoppingBag className="w-4 h-4" />

                <span>
                  {t.orderItemsHeading}
                </span>

              </h4>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={
                  ProductsLoad ||
                  products.length === 0 ||
                  BulkOrderActionLoad
                }
                className="text-sm font-bold text-[#C94F6D] hover:text-[#A83D58] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg hover:bg-[#FFF0F3] transition-colors"
              >

                <Plus className="w-4 h-4" />

                <span>
                  {t.addItemRow}
                </span>

              </button>

            </div>

            {/* LOADING */}

            {ProductsLoad && (

              <div className="py-6 text-center text-sm text-[#756B70]">
                {t.loadingProducts}
              </div>

            )}

            {/* ERROR */}

            {!ProductsLoad &&
              ProductsError && (

                <div className="py-6 text-center text-sm text-red-500">
                  {t.errorLoadingProducts}
                </div>

              )}

            {/* EMPTY */}

            {!ProductsLoad &&
              !ProductsError &&
              products.length === 0 && (

                <div className="py-6 text-center text-sm text-[#756B70]">
                  {t.noProductsAvailable}
                </div>

              )}

            {/* PRODUCTS */}

            {!ProductsLoad &&
              products.length > 0 && (

                <div className="space-y-3">

                  {orderItems.map(
                    (item, index) => (

                      <div
                        key={`${item.productId}-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-xl bg-[#FFF9F5] border-2 border-[#EDE2E5]"
                      >

                        {/* PRODUCT */}

                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              e.target.value,
                              item.quantity
                            )
                          }
                          disabled={
                            BulkOrderActionLoad
                          }
                          className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-semibold text-[#29252A] outline-none disabled:opacity-60 cursor-pointer"
                        >

                          {products.map(
                            (product) => (

                              <option
                                key={product.id}
                                value={String(
                                  product.id
                                )}
                              >

                                {product.name}
                                {' '}
                                (₹
                                {Number(
                                  product.sellingPrice
                                ).toLocaleString()}
                                /
                                {product.unit})

                              </option>

                            )
                          )}

                        </select>

                        {/* QUANTITY */}

                        <div className="flex items-center gap-2 w-full sm:w-28">

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            disabled={
                              BulkOrderActionLoad
                            }
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                item.productId,
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="w-20 px-2.5 py-2 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#29252A] text-center disabled:opacity-60"
                          />

                          <span className="text-sm text-[#756B70]">
                            {item.unit}
                          </span>

                        </div>

                        {/* TOTAL */}

                        <div className="w-full sm:w-28 text-right">

                          <span className="text-sm font-bold text-[#29252A]">

                            ₹
                            {item.total.toLocaleString()}

                          </span>

                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          disabled={
                            orderItems.length <= 1 ||
                            BulkOrderActionLoad
                          }
                          onClick={() =>
                            handleRemoveItem(
                              index
                            )
                          }
                          className={`p-2.5 rounded-lg text-[#756B70] hover:text-[#D9535F] hover:bg-white cursor-pointer self-end sm:self-auto ${
                            orderItems.length <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : ''
                          }`}
                        >

                          <Trash2 className="w-5 h-5" />

                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

          </div>

          {/* =================================================
              PAYMENT & INSTRUCTIONS
          ================================================== */}

          <div className="space-y-4 pt-4 border-t-2 border-[#EDE2E5]">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* INSTRUCTIONS */}

              <div>

                <label className="text-sm font-bold text-[#29252A] block mb-2">
                  {t.specialInstructions}
                </label>

                <textarea
                  rows={3}
                  value={specialInstructions}
                  disabled={BulkOrderActionLoad}
                  onChange={(e) =>
                    setSpecialInstructions(
                      e.target.value
                    )
                  }
                  placeholder={t.specialInstructionsPlaceholder}
                  className="w-full px-4 py-3 bg-white border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none disabled:opacity-60"
                />

              </div>

              {/* FINANCIAL SUMMARY */}

              <div className="p-4 rounded-xl bg-[#FFF0F3] border-2 border-[#C94F6D]/20 space-y-2.5 text-sm">

                <div className="flex justify-between font-semibold text-[#29252A]">

                  <span>
                    {t.totalOrderAmount}
                  </span>

                  <span className="font-bold text-base">

                    ₹
                    {totalAmount.toLocaleString()}

                  </span>

                </div>

                <div className="flex justify-between items-center text-[#29252A]">

                  <span>
                    {t.advanceReceived}
                  </span>

                  <div className="flex items-center gap-1.5 w-32">

                    <span className="font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      min={0}
                      value={advancePaid}
                      disabled={
                        BulkOrderActionLoad
                      }
                      onChange={(e) =>
                        setAdvancePaid(
                          Number(
                            e.target.value
                          ) || 0
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-[#EDE2E5] rounded-lg text-sm font-bold text-[#3FA56B] text-right disabled:opacity-60"
                    />

                  </div>

                </div>

                <div className="flex justify-between items-center pt-2.5 border-t-2 border-[#C94F6D]/20 font-extrabold text-[#C94F6D] text-base">

                  <span>
                    {t.remainingBalance}
                  </span>

                  <span>

                    ₹
                    {remainingAmount.toLocaleString()}

                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="pt-5 border-t-2 border-[#EDE2E5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">

            <button
              type="button"
              onClick={handleClose}
              disabled={BulkOrderActionLoad}
              className="px-6 py-3.5 rounded-xl bg-white border-2 border-[#EDE2E5] hover:bg-[#FFF4F6] text-sm font-bold text-[#756B70] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              disabled={
                ProductsLoad ||
                products.length === 0 ||
                orderItems.length === 0 ||
                BulkOrderActionLoad
              }
              className="px-6 py-3.5 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >

              {BulkOrderActionLoad
                ? t.saving
                : t.saveBulkOrder}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default BulkOrderFormModal;