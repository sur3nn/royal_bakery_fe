import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosFile } from '../../services/axiosFile';

// 1. Dashboard
export const FetchDashboardAction: any = createAsyncThunk(
  'FetchDashboardAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getDashboard(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load dashboard'
      );
    }
  }
);

// 2. Products
export const FetchProductsAction: any = createAsyncThunk(
  'FetchProductsAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getProducts(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load products'
      );
    }
  }
);

export const FetchProductByIdAction: any = createAsyncThunk(
  'FetchProductByIdAction',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getProductById(id);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load product'
      );
    }
  }
);

export const CreateProductAction: any = createAsyncThunk(
  'CreateProductAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.createProduct(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Product creation failed'
      );
    }
  }
);

export const UpdateProductAction: any = createAsyncThunk(
  'UpdateProductAction',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateProduct(id, data);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Product update failed'
      );
    }
  }
);

export const DeleteProductAction: any = createAsyncThunk(
  'DeleteProductAction',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.deleteProduct(id);
      const rawData = response?.data?.data;
      return rawData || { id };
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Product deletion failed'
      );
    }
  }
);

// 3. Categories
export const FetchCategoriesAction: any = createAsyncThunk(
  'FetchCategoriesAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getCategories(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load categories'
      );
    }
  }
);

export const CreateCategoryAction: any = createAsyncThunk(
  'CreateCategoryAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.createCategory(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Category creation failed'
      );
    }
  }
);

export const UpdateCategoryAction: any = createAsyncThunk(
  'UpdateCategoryAction',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateCategory(id, data);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Category update failed'
      );
    }
  }
);

// 4. Customers
export const FetchCustomersAction: any = createAsyncThunk(
  'FetchCustomersAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getCustomers(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load customers'
      );
    }
  }
);

export const CreateCustomerAction: any = createAsyncThunk(
  'CreateCustomerAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.createCustomer(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Customer creation failed'
      );
    }
  }
);

export const UpdateCustomerAction: any = createAsyncThunk(
  'UpdateCustomerAction',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateCustomer(id, data);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Customer update failed'
      );
    }
  }
);

// 5. Sales / Billing
export const FetchSalesAction: any = createAsyncThunk(
  'FetchSalesAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getSales(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load sales'
      );
    }
  }
);

export const FetchSaleByIdAction: any = createAsyncThunk(
  'FetchSaleByIdAction',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getSaleById(id);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load sale'
      );
    }
  }
);

export const CreateSaleAction: any = createAsyncThunk(
  'CreateSaleAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.createBill(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Invoice creation failed'
      );
    }
  }
);

// 6. Bulk Orders
export const FetchBulkOrdersAction: any = createAsyncThunk(
  'FetchBulkOrdersAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getBulkOrders(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load bulk orders'
      );
    }
  }
);

export const FetchBulkOrderByIdAction: any = createAsyncThunk(
  'FetchBulkOrderByIdAction',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getBulkOrderById(id);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load bulk order'
      );
    }
  }
);

export const CreateBulkOrderAction: any = createAsyncThunk(
  'CreateBulkOrderAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.createBulkOrder(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Bulk order creation failed'
      );
    }
  }
);

export const UpdateBulkOrderAction: any = createAsyncThunk(
  'UpdateBulkOrderAction',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateBulkOrder(id, data);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Bulk order update failed'
      );
    }
  }
);

export const UpdateBulkOrderStatusAction: any = createAsyncThunk(
  'UpdateBulkOrderStatusAction',
  async ({ id, status }: { id: string | number; status: number }, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateBulkOrderStatus(id, status);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to update order status'
      );
    }
  }
);

export const FetchBulkOrderStatusesAction: any = createAsyncThunk(
  'FetchBulkOrderStatusesAction',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getBulkOrderStatuses();
      return response?.data?.data || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load bulk order statuses'
      );
    }
  }
);

// 7. Inventory
export const FetchInventoryLogsAction: any = createAsyncThunk(
  'FetchInventoryLogsAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getInventoryLogs(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load inventory logs'
      );
    }
  }
);

export const FetchLowStockAction: any = createAsyncThunk(
  'FetchLowStockAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getLowStock(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load low stock'
      );
    }
  }
);

export const AdjustInventoryAction: any = createAsyncThunk(
  'AdjustInventoryAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.adjustStock(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Stock adjustment failed'
      );
    }
  }
);

// 8. Settings
export const FetchSettingsAction: any = createAsyncThunk(
  'FetchSettingsAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getSettings(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load settings'
      );
    }
  }
);

export const UpdateSettingsAction: any = createAsyncThunk(
  'UpdateSettingsAction',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.updateSettings(payload);
      const rawData = response?.data?.data;
      return rawData || null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to update settings'
      );
    }
  }
);

// 3b. Units
export const FetchUnitsAction: any = createAsyncThunk(
  'FetchUnitsAction',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response: any = await axiosFile.getUnits(payload);
      const rawData = response?.data?.data;
      return rawData || [];
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to load units'
      );
    }
  }
);
