import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from './redux/store';
import {
  FetchDashboardAction,
  FetchProductsAction,
  FetchCategoriesAction,
  FetchCustomersAction,
  FetchSalesAction,
  CreateSaleAction,
  FetchBulkOrdersAction,
  CreateBulkOrderAction,
  UpdateBulkOrderStatusAction,
  CreateProductAction,
  AdjustInventoryAction,
  FetchSettingsAction,
  UpdateProductAction,
  DeleteProductAction,
  FetchProductByIdAction,
} from './redux/actions/bakeryActions';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BillingView } from './components/BillingView';
import { ProductsView } from './components/ProductsView';
import { ProductFormModal } from './components/ProductFormModal';
import { BulkOrdersView } from './components/BulkOrdersView';
import { BulkOrderFormModal } from './components/BulkOrderFormModal';
import { DeliveryAlertsView } from './components/DeliveryAlertsView';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceModal } from './components/InvoiceModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer } from './components/Toast';

import {
  Product,
  Invoice,
  BulkOrder,
  NavigationTab,
  ToastMessage,
  BulkOrderStatus,
} from './types';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current tab from the URL instead of local state
  const currentTab = (location.pathname.split('/')[1] || 'dashboard') as NavigationTab;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar collapsed state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('royal_sweets_sidebar_collapsed');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('royal_sweets_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Redux Store Data
  const {
    ProductsData,
    SalesData,
    BulkOrdersData,
    DashboardData,
    SelectedProduct,
    CategoriesData,
  } = useSelector((state: RootState) => state.bakery);

  // Fetch all initial data from backend API on mount
  useEffect(() => {
    dispatch(FetchProductsAction({}));
    dispatch(FetchCategoriesAction({}));
    dispatch(FetchCustomersAction({}));
    dispatch(FetchSalesAction({}));
    dispatch(FetchBulkOrdersAction({}));
    dispatch(FetchDashboardAction({}));
    dispatch(FetchSettingsAction({}));
  }, [dispatch]);

  // Modals & Popups
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkOrderModalOpen, setIsBulkOrderModalOpen] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  // Notification Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string = '', type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut for Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Safe entity arrays from Redux
  const products: Product[] = ProductsData || [];
  const invoices: Invoice[] = SalesData || [];
  const bulkOrders: BulkOrder[] = BulkOrdersData || [];

  // Live calculation counts for badges
  const lowStockCount = products.filter(
    (p: any) => Number(p.stock) <= Number(p.minStock ?? p.min_stock ?? 5) && Number(p.stock) > 0
  ).length;

  const bulkOrdersActiveCount = bulkOrders.filter(
    (b: any) => b.status === 'Upcoming' || b.status === 'Preparing'
  ).length;

  const pendingDeliveriesCount = bulkOrders.filter(
    (o: any) => o.status === 'Upcoming' || o.status === 'Preparing' || o.status === 'Ready'
  ).length;

  // Complete Billing Checkout
  const handleCheckoutComplete = (createdInvoice: Invoice) => {
    setSelectedInvoiceForModal(createdInvoice);
  };

  // Product actions via Redux
  const handleEditProduct = (product: Product) => {
    dispatch(FetchProductByIdAction(product.id));
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: Product) => {
    try {
      const matchedCategory = (CategoriesData || []).find((c: any) => c.name === productData.category);
      const payload = {
        name: productData.name,
        category_id: matchedCategory?.id,
        unit: productData.unit,
        selling_price: productData.sellingPrice,
        cost_price: productData.costPrice,
        gst_percent: productData.gstRate,
        current_stock: productData.stock,
        min_stock_threshold: productData.minStock,
        image_url: productData.image,
        is_popular: productData.isHighDemand,
        shelf_life_days: productData.shelfLifeDays ?? null,
      };

      if (editingProduct) {
        await dispatch(UpdateProductAction({ id: productData.id, data: payload })).unwrap();
        addToast('Product Updated', `${productData.name} details saved.`, 'success');
      } else {
        await dispatch(CreateProductAction(payload)).unwrap();
        addToast('Product Added', `${productData.name} added to inventory.`, 'success');
      }

      dispatch(FetchProductsAction({}));
      dispatch(FetchDashboardAction({}));
      setEditingProduct(null);
      setIsProductModalOpen(false);
    } catch (err: any) {
      addToast('Error', err?.message || err || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find((p) => String(p.id) === String(productId));
    if (!prod) return;
    if (window.confirm(`Are you sure you want to remove "${prod.name}" from inventory?`)) {
      try {
        await dispatch(DeleteProductAction(productId)).unwrap();
        dispatch(FetchProductsAction({}));
        dispatch(FetchDashboardAction({}));
        addToast('Product Removed', `${prod.name} has been removed.`, 'info');
      } catch (err: any) {
        addToast('Error', err?.message || err || 'Failed to delete product', 'error');
      }
    }
  };

  const handleQuickStockAdjust = async (productId: string, newStock: number) => {
    try {
      await dispatch(
        AdjustInventoryAction({
          product_id: productId,
          quantity: newStock,
          type: 'AUDIT',
          reason: 'Quick Stock Adjustment from UI',
        })
      ).unwrap();
      dispatch(FetchProductsAction({}));
      dispatch(FetchDashboardAction({}));
      addToast('Stock Adjusted', `Stock level updated to ${newStock}`, 'info');
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to adjust stock', 'error');
    }
  };

  // Bulk Order actions via Redux
  const handleSaveBulkOrder = async (order: BulkOrder) => {
    try {
      const payload = {
        ...order,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail,
        delivery_date: order.deliveryDate,
        delivery_time: order.deliveryTime,
        delivery_address: order.deliveryAddress,
        delivery_type: order.deliveryType,
        special_instructions: order.specialInstructions,
        total_amount: order.totalAmount,
        advance_paid: order.advancePaid,
        remaining_amount: order.remainingAmount,
        items: order.items.map((it) => ({
          product_id: it.productId,
          product_name: it.productName,
          unit: it.unit,
          price: it.price,
          quantity: it.quantity,
          total: it.total,
        })),
      };

      await dispatch(CreateBulkOrderAction(payload)).unwrap();
      dispatch(FetchBulkOrdersAction({}));
      dispatch(FetchDashboardAction({}));
      setIsBulkOrderModalOpen(false);
      addToast(
        'Bulk Order Placed',
        `Order for ${order.customerName} successfully created.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to create bulk order', 'error');
    }
  };

  const handleUpdateBulkOrderStatus = async (orderId: string, newStatus: BulkOrderStatus) => {
    try {
      await dispatch(UpdateBulkOrderStatusAction({ id: orderId, status: newStatus })).unwrap();
      dispatch(FetchBulkOrdersAction({}));
      dispatch(FetchDashboardAction({}));
      addToast('Status Updated', `Order status set to ${newStatus}`, 'info');
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to update order status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col antialiased text-[#29252A] font-sans selection:bg-[#FCE7EC] selection:text-[#C94F6D]">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab: NavigationTab) => {
            navigate(`/${tab}`);
            setMobileMenuOpen(false);
          }}
          onQuickNewBill={() => {
            navigate('/billing');
            setMobileMenuOpen(false);
          }}
          lowStockCount={lowStockCount}
          bulkOrdersCount={bulkOrdersActiveCount}
          dueSoonDeliveriesCount={pendingDeliveriesCount}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
          {/* Top Header */}
          <Header
            onOpenSearch={() => setIsSearchOpen(true)}
            onNewBill={() => navigate('/billing')}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          {/* Routed Page Views */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardView
                    products={products}
                    invoices={invoices}
                    bulkOrders={bulkOrders}
                    onNavigate={(tab: NavigationTab) => navigate(`/${tab}`)}
                    onOpenNewBill={() => navigate('/billing')}
                    onOpenAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                    onOpenCreateBulkOrder={() => setIsBulkOrderModalOpen(true)}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <DashboardView
                    products={products}
                    invoices={invoices}
                    bulkOrders={bulkOrders}
                    onNavigate={(tab: NavigationTab) => navigate(`/${tab}`)}
                    onOpenNewBill={() => navigate('/billing')}
                    onOpenAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                    onOpenCreateBulkOrder={() => setIsBulkOrderModalOpen(true)}
                  />
                }
              />
              <Route
                path="/billing"
                element={
                  <BillingView
                    products={products}
                    onGenerateInvoice={handleCheckoutComplete}
                    onToast={(type, title, message) => addToast(title, message, type)}
                  />
                }
              />
              <Route
                path="/products"
                element={
                  <ProductsView
                    products={products}
                    onAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                    onEditProduct={handleEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onQuickStockAdjust={handleQuickStockAdjust}
                  />
                }
              />
              <Route
                path="/bulk-orders"
                element={
                  <BulkOrdersView
                    bulkOrders={bulkOrders}
                    onCreateOrder={() => setIsBulkOrderModalOpen(true)}
                    onUpdateStatus={handleUpdateBulkOrderStatus}
                  />
                }
              />
              <Route
                path="/delivery-alerts"
                element={
                  <DeliveryAlertsView
                    bulkOrders={bulkOrders}
                    onUpdateStatus={handleUpdateBulkOrderStatus}
                  />
                }
              />
              <Route
                path="/invoices"
                element={
                  <InvoicesView
                    invoices={invoices}
                    onViewInvoice={(inv) => setSelectedInvoiceForModal(inv)}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        invoices={invoices}
        bulkOrders={bulkOrders}
        onSelectProduct={(_p) => {
          navigate('/products');
        }}
        onSelectInvoice={(inv) => {
          setSelectedInvoiceForModal(inv);
        }}
        onSelectBulkOrder={(_bo) => {
          navigate('/bulk-orders');
        }}
        onNavigate={(tab: NavigationTab) => navigate(`/${tab}`)}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        productToEdit={editingProduct ? SelectedProduct : null}
      />

      {/* Bulk Order Create Modal */}
      <BulkOrderFormModal
        isOpen={isBulkOrderModalOpen}
        onClose={() => setIsBulkOrderModalOpen(false)}
        products={products}
        onSave={handleSaveBulkOrder}
      />

      {/* Tax & Thermal Invoice Preview Modal */}
      <InvoiceModal
        invoice={selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
      />
    </div>
  );
}