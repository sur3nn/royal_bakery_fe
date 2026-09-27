import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  RotateCcw,
  User,
  Phone,
  Percent,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  CreateSaleAction, 
  FetchProductsAction, 
  FetchSalesAction, 
  FetchDashboardAction, 
  FetchCategoriesAction
} from '../redux/actions/bakeryActions';
import { Product, CartItem, Invoice } from '../types';

interface BillingViewProps {
  products?: Product[];
  onGenerateInvoice: (invoice: Invoice) => void;
  onStockUpdate?: (productId: string, quantitySold: number) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  products: initialProducts = [],
  onGenerateInvoice,
  onToast,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { ProductsData, ProductsLoad, ProductsError, SaleActionLoad,CategoriesData } = useSelector((state: RootState) => state.bakery);
useEffect(() => {
  dispatch(FetchProductsAction({}));
  if (!CategoriesData?.length) dispatch(FetchCategoriesAction({}));
}, [dispatch]);
  useEffect(() => {
    dispatch(FetchProductsAction({}));
  }, [dispatch]);

  // POS States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Split'>('Cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');


const categories = ['All', ...(CategoriesData || []).map((c: any) => c.name).filter((n: string) => !!n)];
  // Active products
  const effectiveProducts: Product[] = (ProductsData?.length ? ProductsData : initialProducts) as Product[];

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((product) => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [effectiveProducts, selectedCategory, searchQuery]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const stockAvailable = Number(product.stock || 0);

    if (existing) {
      if (existing.quantity >= stockAvailable) {
        onToast('warning', 'Stock Limit Reached', `Only ${stockAvailable} ${product.unit} available in stock.`);
        return;
      }
      handleUpdateQuantity(product.id, existing.quantity + 1);
    } else {
      if (stockAvailable <= 0) {
        onToast('error', 'Out of Stock', `${product.name} is currently out of stock.`);
        return;
      }

      const price = Number(product.sellingPrice || (product as any).selling_price || 0);
      const gstRate = Number(product.gstRate || (product as any).gst_rate || 5);
      const discountPercent = 0;
      const discountAmount = 0;
      const itemSubtotal = price * 1;
      const gstAmount = Math.round((itemSubtotal * (gstRate / 100)) * 100) / 100;
      const itemTotal = itemSubtotal + gstAmount;

      const newItem: CartItem = {
        product,
        quantity: 1,
        discountPercent,
        discountAmount,
        itemSubtotal,
        gstAmount,
        itemTotal,
      };

      setCart((prev) => [...prev, newItem]);
    }
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id !== productId) return item;

        const price = Number(item.product.sellingPrice || (item.product as any).selling_price || 0);
        const gstRate = Number(item.product.gstRate || (item.product as any).gst_rate || 5);
        const stockAvailable = Number(item.product.stock || 0);

        if (newQty > stockAvailable) {
          onToast('warning', 'Stock Limit Reached', `Only ${stockAvailable} ${item.product.unit} in inventory.`);
          return item;
        }

        const rawSubtotal = price * newQty;
        const discountAmount = Math.round((rawSubtotal * (item.discountPercent / 100)) * 100) / 100;
        const itemSubtotal = rawSubtotal - discountAmount;
        const gstAmount = Math.round((itemSubtotal * (gstRate / 100)) * 100) / 100;
        const itemTotal = itemSubtotal + gstAmount;

        return {
          ...item,
          quantity: newQty,
          discountAmount,
          itemSubtotal,
          gstAmount,
          itemTotal,
        };
      })
    );
  };

  const handleUpdateDiscount = (productId: string, discountPercent: number) => {
    const validDiscount = Math.min(100, Math.max(0, discountPercent));
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id !== productId) return item;

        const price = Number(item.product.sellingPrice || (item.product as any).selling_price || 0);
        const gstRate = Number(item.product.gstRate || (item.product as any).gst_rate || 5);
        const rawSubtotal = price * item.quantity;
        const discountAmount = Math.round((rawSubtotal * (validDiscount / 100)) * 100) / 100;
        const itemSubtotal = rawSubtotal - discountAmount;
        const gstAmount = Math.round((itemSubtotal * (gstRate / 100)) * 100) / 100;
        const itemTotal = itemSubtotal + gstAmount;

        return {
          ...item,
          discountPercent: validDiscount,
          discountAmount,
          itemSubtotal,
          gstAmount,
          itemTotal,
        };
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountPaidInput('');
  };

  // Cart-wide discount state
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');

  // Overall calculations
  const rawCartSubtotal = cart.reduce((acc, item) => {
    const price = Number(item.product.sellingPrice || (item.product as any).selling_price || 0);
    return acc + price * item.quantity;
  }, 0);

  const itemWiseDiscount = cart.reduce((acc, item) => acc + item.discountAmount, 0);

  const billDiscount =
    discountType === 'percent'
      ? (rawCartSubtotal - itemWiseDiscount) * (cartDiscountPercent / 100)
      : Math.min(rawCartSubtotal - itemWiseDiscount, cartDiscountPercent);

  const totalDiscount = itemWiseDiscount + billDiscount;
  const taxableAmount = Math.max(0, rawCartSubtotal - totalDiscount);

  // Compute GST based on weighted rates of items
  const gstTotal = cart.reduce((acc, item) => {
    const ratio = rawCartSubtotal > 0 ? (item.itemSubtotal / (rawCartSubtotal - itemWiseDiscount || 1)) : 0;
    const itemTaxable = taxableAmount * ratio;
    const gstRate = Number(item.product.gstRate || (item.product as any).gst_rate || 5);
    return acc + itemTaxable * (gstRate / 100);
  }, 0);

  const netAmount = taxableAmount + gstTotal;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal / 2) * 100) / 100;
  
  // Grand total
  const unroundedTotal = netAmount;
  const grandTotal = Math.round(unroundedTotal);
  const roundOff = Math.round((grandTotal - unroundedTotal) * 100) / 100;

  // Tendered calculation
  const amountPaidNum = amountPaidInput === '' ? grandTotal : parseFloat(amountPaidInput) || 0;
  const balanceReturn = Math.max(0, amountPaidNum - grandTotal);

  // Quick cash chips
  const handleQuickCash = (amt: number) => {
    setAmountPaidInput(amt.toString());
  };

  // Generate and process invoice via real backend Redux action
  const handleCheckout = async () => {
    if (cart.length === 0) {
      onToast('error', 'Empty Cart', 'Please add products to cart before generating invoice.');
      return;
    }

    if (amountPaidNum < grandTotal && paymentMethod === 'Cash') {
      onToast('warning', 'Insufficient Tender', 'Amount paid is less than grand total.');
      return;
    }

    const salePayload = {
      customer_name: customerName.trim() || 'Counter Customer',
      customer_phone: customerPhone.trim() || 'N/A',
      items: cart.map((c) => ({
        product_id: c.product.id,
        product_name: c.product.name,
        unit: c.product.unit,
        price: Number(c.product.sellingPrice || (c.product as any).selling_price || 0),
        quantity: c.quantity,
        discount_percent: c.discountPercent,
        subtotal: c.itemSubtotal,
        gst_rate: Number(c.product.gstRate || (c.product as any).gst_rate || 5),
        gst_amount: c.gstAmount,
        total: c.itemTotal,
      })),
      subtotal: Math.round((netAmount * 0.952) * 100) / 100,
      discount: Math.round(totalDiscount),
      discount_type: discountType,
      cgst,
      sgst,
      gst_total: Math.round(gstTotal * 100) / 100,
      round_off: roundOff,
      grand_total: grandTotal,
      amount_paid: amountPaidNum,
      balance_return: balanceReturn,
      payment_method: paymentMethod,
      cashier_id: '1',
    };

    try {
      const resultAction = await dispatch(CreateSaleAction(salePayload));
      if (CreateSaleAction.fulfilled.match(resultAction)) {
        const createdSale = resultAction.payload;
        onToast(
          'success',
          'Payment Successful',
          `Invoice ${createdSale.invoiceNumber || createdSale.invoice_number} generated! Total: ₹${createdSale.grandTotal || createdSale.grand_total}`
        );

        // Open Invoice Modal
        onGenerateInvoice(createdSale);

        // Reset UI
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setAmountPaidInput('');
        setCartDiscountPercent(0);

        // Refresh Redux State
        dispatch(FetchProductsAction({}));
        dispatch(FetchSalesAction({}));
        dispatch(FetchDashboardAction({}));
      } else {
        onToast('error', 'Checkout Error', String(resultAction.payload || 'Failed to record sale'));
      }
    } catch (err: any) {
      onToast('error', 'Checkout Error', err?.message || 'Failed to complete sale');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-12 items-start">
      {/* LEFT COLUMN: Product Catalog & Fast Search (col-span-7) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-[#EDE2E5] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#756B70] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sweets by name or product code (e.g. Kaju Katli, LAD-01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9F5]/70 border border-[#EDE2E5] rounded-xl text-xs sm:text-sm text-[#29252A] placeholder-[#756B70] focus:border-[#C94F6D] focus:ring-2 focus:ring-[#FCE7EC] outline-none"
              />
            </div>

            <div className="text-xs text-[#756B70] font-semibold whitespace-nowrap self-end sm:self-center">
              Showing <span className="text-[#C94F6D] font-bold">{filteredProducts.length}</span> items
            </div>
          </div>

          {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#EDE2E5]/70 no-scrollbar">
  {categories.map((cat) => (
    <button
      key={cat}
      onClick={() => setSelectedCategory(cat)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
        selectedCategory === cat
          ? 'bg-[#C94F6D] text-white shadow-2xs'
          : 'bg-[#FFF9F5] text-[#756B70] hover:text-[#29252A] hover:bg-[#FFF0F3]'
      }`}
    >
      {cat}
    </button>
  ))}
</div>
        </div>

        {/* Loading Products */}
        {ProductsLoad && !effectiveProducts.length && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-[#EDE2E5]"></div>
            ))}
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const inCart = cart.find((c) => c.product.id === product.id);
            const stockNum = Number(product.stock || 0);
            const minStockNum = Number(product.minStock ?? (product as any).min_stock ?? 5);
            const isLow = stockNum <= minStockNum && stockNum > 0;
            const isOut = stockNum <= 0;

            return (
              <div
                key={product.id}
                onClick={() => !isOut && handleAddToCart(product)}
                className={`bg-white rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isOut
                    ? 'opacity-60 border-[#EDE2E5] cursor-not-allowed'
                    : inCart
                    ? 'border-[#C94F6D] ring-2 ring-[#FCE7EC] shadow-xs'
                    : 'border-[#EDE2E5] hover:border-[#C94F6D]/50 hover:shadow-xs'
                }`}
              >
                {/* Active in-cart indicator */}
                {inCart && (
                  <div className="absolute top-2 right-2 z-10 bg-[#C94F6D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {inCart.quantity} in cart
                  </div>
                )}

                <div>
                  {/* Image container */}
                  <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2.5 bg-[#FFF9F5]">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200'}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Stock badge */}
                    <div className="absolute bottom-2 left-2">
                      {isOut ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D9535F] text-white">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF3D6] text-[#D9A441]">
                          Low ({stockNum})
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-[#3FA56B] shadow-2xs">
                          {stockNum} {product.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#29252A] group-hover:text-[#C94F6D] transition-colors truncate">
                    {product.name}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#756B70] mt-0.5">
                    <span>{product.code}</span>
                    <span>GST {product.gstRate || (product as any).gst_rate || 5}%</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EDE2E5] flex items-center justify-between">
                  <div className="font-extrabold text-sm text-[#29252A]">
                    ₹{product.sellingPrice || (product as any).selling_price}{' '}
                    <span className="text-[10px] text-[#756B70] font-normal">/{product.unit}</span>
                  </div>

                  <button
                    disabled={isOut}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isOut
                        ? 'bg-[#EDE2E5] text-[#756B70] cursor-not-allowed'
                        : inCart
                        ? 'bg-[#C94F6D] text-white'
                        : 'bg-[#FFF0F3] text-[#C94F6D] hover:bg-[#C94F6D] hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart, Customer Info, Taxes & Sticky Checkout (col-span-5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EDE2E5] shadow-xs p-4 sm:p-5 flex flex-col justify-between sticky top-20">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EDE2E5]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C94F6D]" />
              <h2 className="font-bold text-base text-[#29252A]">Current Cart</h2>
              <span className="bg-[#FFF0F3] text-[#C94F6D] font-bold text-xs px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-[#D9535F] hover:text-[#A83D58] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer info (Optional for fast counter billing) */}
          <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5]/80">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#756B70] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer Name (opt)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#EDE2E5] rounded-lg text-xs text-[#29252A] placeholder-[#756B70] outline-none focus:border-[#C94F6D]"
              />
            </div>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-[#756B70] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="Mobile No (opt)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#EDE2E5] rounded-lg text-xs text-[#29252A] placeholder-[#756B70] outline-none focus:border-[#C94F6D]"
              />
            </div>
          </div>

          {/* Cart Item Rows */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#EDE2E5]/60 pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-[#756B70] space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-[#EDE2E5] stroke-[1.5]" />
                <p className="text-sm font-semibold text-[#29252A]">Register is empty</p>
                <p className="text-xs text-[#756B70]">Click any product on the left to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#29252A] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-[#756B70]">
                      ₹{item.product.sellingPrice || (item.product as any).selling_price} /{item.product.unit} • GST {item.product.gstRate || (item.product as any).gst_rate || 5}%
                    </p>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-[#FFF0F3] hover:bg-[#C94F6D] text-[#C94F6D] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#29252A]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-[#FFF0F3] hover:bg-[#C94F6D] text-[#C94F6D] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="text-right min-w-[70px]">
                    <p className="text-xs font-extrabold text-[#29252A]">
                      ₹{Math.round(item.itemTotal)}
                    </p>
                    {item.discountAmount > 0 && (
                      <p className="text-[10px] text-[#3FA56B]">
                        -₹{Math.round(item.discountAmount)}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="p-1 text-[#756B70] hover:text-[#D9535F] cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Calculation Breakdown */}
        {cart.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#EDE2E5] space-y-2.5">
            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#756B70] font-medium flex items-center gap-1">
                <Percent className="w-3 h-3 text-[#C94F6D]" />
                <span>Bill Discount:</span>
              </span>

              <div className="flex items-center gap-1">
                {[0, 5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCartDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      cartDiscountPercent === d
                        ? 'bg-[#C94F6D] text-white'
                        : 'bg-[#FFF9F5] text-[#756B70] border border-[#EDE2E5]'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations rows */}
            <div className="space-y-1 text-xs text-[#756B70]">
              <div className="flex justify-between">
                <span>Subtotal (items):</span>
                <span className="font-semibold text-[#29252A]">₹{rawCartSubtotal.toLocaleString()}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-[#3FA56B]">
                  <span>Discount:</span>
                  <span>-₹{Math.round(totalDiscount).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>GST (CGST + SGST):</span>
                <span className="font-semibold text-[#29252A]">₹{Math.round(gstTotal).toLocaleString()}</span>
              </div>

              {roundOff !== 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Round off:</span>
                  <span>{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EDE2E5] text-[#29252A]">
              <span className="font-bold text-sm">Grand Total:</span>
              <span className="font-extrabold text-xl text-[#C94F6D]">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-[#756B70] uppercase tracking-wider block">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'UPI', 'Card', 'Split'] as const).map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C94F6D] text-white shadow-xs shadow-[#C94F6D]/20'
                          : 'bg-[#FFF9F5] text-[#29252A] border border-[#EDE2E5] hover:bg-[#FFF0F3]'
                      }`}
                    >
                      {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                      {method === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {method === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      {method === 'Split' && <Percent className="w-3.5 h-3.5" />}
                      <span>{method}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Balance Return */}
            {paymentMethod === 'Cash' && (
              <div className="p-2.5 rounded-xl bg-[#FFF9F5] border border-[#EDE2E5] space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-[#756B70]">Amount Tendered:</span>
                  <div className="flex items-center gap-1 w-28">
                    <span className="text-xs font-bold text-[#29252A]">₹</span>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      placeholder={grandTotal.toString()}
                      className="w-full px-2 py-1 bg-white border border-[#EDE2E5] rounded-md text-xs font-bold text-[#29252A] outline-none focus:border-[#C94F6D]"
                    />
                  </div>
                </div>

                {/* Quick cash denomination chips */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#756B70]">Quick:</span>
                  {[grandTotal, 500, 1000, 2000].map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickCash(amt)}
                      className="px-2 py-0.5 bg-white hover:bg-[#FFF0F3] border border-[#EDE2E5] rounded-md text-[10px] font-bold text-[#29252A] cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Return Change */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EDE2E5]/70">
                  <span className="font-semibold text-[#756B70]">Change Return:</span>
                  <span className="font-extrabold text-[#3FA56B] text-sm">
                    ₹{balanceReturn.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Primary Generate Invoice Button */}
            <button
              disabled={SaleActionLoad}
              onClick={handleCheckout}
              className={`w-full py-3 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-[#C94F6D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                SaleActionLoad ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {SaleActionLoad ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>RECORDING BILL...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 stroke-[2.5]" />
                  <span>GENERATE INVOICE (₹{grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
