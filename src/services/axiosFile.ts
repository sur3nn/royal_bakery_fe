import axios from 'axios';

const rawBaseUrl = 'http://localhost:5000';

const API_BASE_URL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const axiosFile = {
  // Dashboard
  getDashboard: (payload?: any) =>
    apiClient.get('/dashboard/summary', { params: payload }),

  getDashboardSummary: (payload?: any) =>
    apiClient.get('/dashboard/summary', { params: payload }),

  // Products
  getProducts: (payload?: any) =>
    apiClient.get('/products', { params: payload }),

  getProductById: (id: string | number) =>
    apiClient.get(`/products/${id}`),

  createProduct: (payload: any) =>
    apiClient.post('/products', payload),

  updateProduct: (id: string | number, payload: any) =>
    apiClient.put(`/products/${id}`, payload),

  deleteProduct: (id: string | number) =>
    apiClient.delete(`/products/${id}`),

  // Categories
  getCategories: (payload?: any) =>
    apiClient.get('/categories', { params: payload }),

  createCategory: (payload: any) =>
    apiClient.post('/categories', payload),

  updateCategory: (id: string | number, payload: any) =>
    apiClient.put(`/categories/${id}`, payload),

  // Customers
  getCustomers: (payload?: any) =>
    apiClient.get('/customers', { params: payload }),

  getCustomerById: (id: string | number) =>
    apiClient.get(`/customers/${id}`),

  createCustomer: (payload: any) =>
    apiClient.post('/customers', payload),

  updateCustomer: (id: string | number, payload: any) =>
    apiClient.put(`/customers/${id}`, payload),

  // Sales / Billing
  getSales: (payload?: any) =>
    apiClient.get('/sales', { params: payload }),

  getSaleById: (id: string | number) =>
    apiClient.get(`/sales/${id}`),

  createBill: (payload: any) =>
    apiClient.post('/sales/bill', payload),

  // Bulk Orders
  getBulkOrders: (payload?: any) =>
    apiClient.get('/bulk-orders', { params: payload }),

  getBulkOrderById: (id: string | number) =>
    apiClient.get(`/bulk-orders/${id}`),

  createBulkOrder: (payload: any) =>
    apiClient.post('/bulk-orders', payload),

  updateBulkOrder: (id: string | number, payload: any) =>
    apiClient.put(`/bulk-orders/${id}`, payload),

  updateBulkOrderStatus: (id: string | number, status: string) =>
    apiClient.patch(`/bulk-orders/${id}/status`, { status }),

  // Inventory
  getInventoryLogs: (payload?: any) =>
    apiClient.get('/inventory/logs', { params: payload }),

  getLowStock: (payload?: any) =>
    apiClient.get('/inventory/low-stock', { params: payload }),

  adjustStock: (payload: any) =>
    apiClient.post('/inventory/adjust', payload),

  // Settings
  getSettings: (payload?: any) =>
    apiClient.get('/settings', { params: payload }),

  updateSettings: (payload: any) =>
    apiClient.post('/settings', payload),
  // Units
  getUnits: (payload?: any) =>
    apiClient.get('/units', { params: payload }),

  createUnit: (payload: any) =>
    apiClient.post('/units', payload),

  updateUnit: (id: string | number, payload: any) =>
    apiClient.put(`/units/${id}`, payload),

  
};

export default axiosFile;
