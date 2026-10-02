import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  FetchDashboardAction,
  FetchProductsAction,
  FetchProductByIdAction,
  CreateProductAction,
  UpdateProductAction,
  DeleteProductAction,
  FetchCategoriesAction,
  CreateCategoryAction,
  UpdateCategoryAction,
  FetchCustomersAction,
  CreateCustomerAction,
  UpdateCustomerAction,
  FetchSalesAction,
  FetchSaleByIdAction,
  CreateSaleAction,
  FetchBulkOrdersAction,
  FetchBulkOrderByIdAction,
  CreateBulkOrderAction,
  UpdateBulkOrderAction,
  UpdateBulkOrderStatusAction,
  FetchInventoryLogsAction,
  FetchLowStockAction,
  AdjustInventoryAction,
  FetchSettingsAction,
  UpdateSettingsAction,
  FetchUnitsAction,
} from '../actions/bakeryActions';
import { mapApiProductToProduct, mapApiSaleToInvoice } from '../../utils/mappers';

export interface BakeryState {
  DashboardData: any;
  DashboardLoad: boolean;
  DashboardError: any;

  ProductsData: any[];
  ProductsLoad: boolean;
  ProductsError: any;

  CategoriesData: any[];
  CategoriesLoad: boolean;
  CategoriesError: any;

  CustomersData: any[];
  CustomersLoad: boolean;
  CustomersError: any;

  SalesData: any[];
  SalesLoad: boolean;
  SalesError: any;

  BulkOrdersData: any[];
  BulkOrdersLoad: boolean;
  BulkOrdersError: any;

  InventoryData: any[];
  InventoryLoad: boolean;
  InventoryError: any;

  LowStockData: any[];
  LowStockLoad: boolean;
  LowStockError: any;

  SettingsData: any;
  SettingsLoad: boolean;
  SettingsError: any;

  // Active or selected items
  SelectedProduct: any;
  SelectedSale: any;
  SelectedBulkOrder: any;
  CreatedSale: any;
  SaleActionLoad: boolean;
  BulkOrderActionLoad: boolean;
  ProductActionLoad: boolean;

  UnitsData : any;
}

const initialState: BakeryState = {
  DashboardData: null,
  DashboardLoad: false,
  DashboardError: null,

  ProductsData: [],
  ProductsLoad: false,
  ProductsError: null,

  CategoriesData: [],
  CategoriesLoad: false,
  CategoriesError: null,

  CustomersData: [],
  CustomersLoad: false,
  CustomersError: null,

  SalesData: [],
  SalesLoad: false,
  SalesError: null,

  BulkOrdersData: [],
  BulkOrdersLoad: false,
  BulkOrdersError: null,

  InventoryData: [],
  InventoryLoad: false,
  InventoryError: null,

  LowStockData: [],
  LowStockLoad: false,
  LowStockError: null,

  SettingsData: null,
  SettingsLoad: false,
  SettingsError: null,

  SelectedProduct: null,
  SelectedSale: null,
  SelectedBulkOrder: null,
  CreatedSale: null,
  SaleActionLoad: false,
  BulkOrderActionLoad: false,
  ProductActionLoad: false,

  UnitsData: [],
};

export const bakerySlice = createSlice({
  name: 'bakery',
  initialState,
  reducers: {
    clearCreatedSale: (state) => {
      state.CreatedSale = null;
    },
    clearSelectedProduct: (state) => {
      state.SelectedProduct = null;
    },
    clearSelectedSale: (state) => {
      state.SelectedSale = null;
    },
    clearSelectedBulkOrder: (state) => {
      state.SelectedBulkOrder = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Dashboard
    builder
      .addCase(FetchDashboardAction.pending, (state) => {
        state.DashboardLoad = true;
        state.DashboardError = null;
      })
      .addCase(FetchDashboardAction.fulfilled, (state, action) => {
        state.DashboardLoad = false;
        state.DashboardData = action.payload;
      })
      .addCase(FetchDashboardAction.rejected, (state, action) => {
        state.DashboardLoad = false;
        state.DashboardError = action.payload;
      });

    // 2. Products
    builder
      .addCase(FetchProductsAction.pending, (state) => {
        state.ProductsLoad = true;
        state.ProductsError = null;
      })
      .addCase(FetchProductsAction.fulfilled, (state, action) => {
  state.ProductsLoad = false;
  state.ProductsData = Array.isArray(action.payload)
    ? action.payload.map(mapApiProductToProduct)
    : [];
})
      .addCase(FetchProductsAction.rejected, (state, action) => {
        state.ProductsLoad = false;
        state.ProductsError = action.payload;
      })
     .addCase(FetchProductByIdAction.fulfilled, (state, action) => {
  state.SelectedProduct = mapApiProductToProduct(action.payload);
})
      .addCase(CreateProductAction.pending, (state) => {
        state.ProductActionLoad = true;
      })
   .addCase(CreateProductAction.fulfilled, (state, action) => {
  state.ProductActionLoad = false;
  if (action.payload) {
    state.ProductsData.unshift(mapApiProductToProduct(action.payload));
  }
})
      .addCase(CreateProductAction.rejected, (state, action) => {
        state.ProductActionLoad = false;
        state.ProductsError = action.payload;
      })
      .addCase(UpdateProductAction.pending, (state) => {
        state.ProductActionLoad = true;
      })
     .addCase(UpdateProductAction.fulfilled, (state, action) => {
  state.ProductActionLoad = false;
  if (action.payload) {
    const mapped = mapApiProductToProduct(action.payload);
    const index = state.ProductsData.findIndex((p) => p.id === mapped.id);
    if (index !== -1) {
      state.ProductsData[index] = mapped;
    }
  }
})
      .addCase(UpdateProductAction.rejected, (state, action) => {
        state.ProductActionLoad = false;
        state.ProductsError = action.payload;
      })
      .addCase(DeleteProductAction.fulfilled, (state, action) => {
        const deletedId = action.payload?.id;
        if (deletedId) {
          state.ProductsData = state.ProductsData.filter((p) => p.id !== deletedId);
        }
      })
      .addCase(FetchUnitsAction.fulfilled, (state, action) => {
  state.UnitsData = action.payload;
});

    // 3. Categories
    builder
      .addCase(FetchCategoriesAction.pending, (state) => {
        state.CategoriesLoad = true;
        state.CategoriesError = null;
      })
      .addCase(FetchCategoriesAction.fulfilled, (state, action) => {
        state.CategoriesLoad = false;
        state.CategoriesData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(FetchCategoriesAction.rejected, (state, action) => {
        state.CategoriesLoad = false;
        state.CategoriesError = action.payload;
      })
      .addCase(CreateCategoryAction.fulfilled, (state, action) => {
        if (action.payload) {
          state.CategoriesData.push(action.payload);
        }
      })
      .addCase(UpdateCategoryAction.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.CategoriesData.findIndex((c) => c.id === action.payload.id);
          if (idx !== -1) state.CategoriesData[idx] = action.payload;
        }
      });

    // 4. Customers
    builder
      .addCase(FetchCustomersAction.pending, (state) => {
        state.CustomersLoad = true;
        state.CustomersError = null;
      })
      .addCase(FetchCustomersAction.fulfilled, (state, action) => {
        state.CustomersLoad = false;
        state.CustomersData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(FetchCustomersAction.rejected, (state, action) => {
        state.CustomersLoad = false;
        state.CustomersError = action.payload;
      })
      .addCase(CreateCustomerAction.fulfilled, (state, action) => {
        if (action.payload) {
          state.CustomersData.push(action.payload);
        }
      })
      .addCase(UpdateCustomerAction.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.CustomersData.findIndex((c) => c.id === action.payload.id);
          if (idx !== -1) state.CustomersData[idx] = action.payload;
        }
      });

    // 5. Sales
    builder
      .addCase(FetchSalesAction.pending, (state) => {
        state.SalesLoad = true;
        state.SalesError = null;
      })
    .addCase(FetchSalesAction.fulfilled, (state, action) => {
  state.SalesLoad = false;
  state.SalesData = Array.isArray(action.payload) ? action.payload.map(mapApiSaleToInvoice) : [];
})
      .addCase(FetchSalesAction.rejected, (state, action) => {
        state.SalesLoad = false;
        state.SalesError = action.payload;
      })
      .addCase(FetchSaleByIdAction.fulfilled, (state, action) => {
        state.SelectedSale = action.payload;
      })
      .addCase(CreateSaleAction.pending, (state) => {
        state.SaleActionLoad = true;
      })
  .addCase(CreateSaleAction.fulfilled, (state, action) => {
  state.SaleActionLoad = false;
  state.CreatedSale = action.payload ? mapApiSaleToInvoice(action.payload) : null;
  if (action.payload) state.SalesData.unshift(mapApiSaleToInvoice(action.payload));
})
      .addCase(CreateSaleAction.rejected, (state, action) => {
        state.SaleActionLoad = false;
        state.SalesError = action.payload;
      });

    // 6. Bulk Orders
    builder
      .addCase(FetchBulkOrdersAction.pending, (state) => {
        state.BulkOrdersLoad = true;
        state.BulkOrdersError = null;
      })
      .addCase(FetchBulkOrdersAction.fulfilled, (state, action) => {
        state.BulkOrdersLoad = false;
        state.BulkOrdersData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(FetchBulkOrdersAction.rejected, (state, action) => {
        state.BulkOrdersLoad = false;
        state.BulkOrdersError = action.payload;
      })
      .addCase(FetchBulkOrderByIdAction.fulfilled, (state, action) => {
        state.SelectedBulkOrder = action.payload;
      })
      .addCase(CreateBulkOrderAction.pending, (state) => {
        state.BulkOrderActionLoad = true;
      })
      .addCase(CreateBulkOrderAction.fulfilled, (state, action) => {
        state.BulkOrderActionLoad = false;
        if (action.payload) {
          state.BulkOrdersData.unshift(action.payload);
        }
      })
      .addCase(CreateBulkOrderAction.rejected, (state, action) => {
        state.BulkOrderActionLoad = false;
        state.BulkOrdersError = action.payload;
      })
      .addCase(UpdateBulkOrderAction.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.BulkOrdersData.findIndex((o) => o.id === action.payload.id);
          if (idx !== -1) state.BulkOrdersData[idx] = action.payload;
        }
      })
      .addCase(UpdateBulkOrderStatusAction.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.BulkOrdersData.findIndex((o) => o.id === action.payload.id);
          if (idx !== -1) {
            state.BulkOrdersData[idx] = action.payload;
          }
        }
      });

    // 7. Inventory
    builder
      .addCase(FetchInventoryLogsAction.pending, (state) => {
        state.InventoryLoad = true;
        state.InventoryError = null;
      })
      .addCase(FetchInventoryLogsAction.fulfilled, (state, action) => {
        state.InventoryLoad = false;
        state.InventoryData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(FetchInventoryLogsAction.rejected, (state, action) => {
        state.InventoryLoad = false;
        state.InventoryError = action.payload;
      })
      .addCase(FetchLowStockAction.pending, (state) => {
        state.LowStockLoad = true;
        state.LowStockError = null;
      })
      .addCase(FetchLowStockAction.fulfilled, (state, action) => {
        state.LowStockLoad = false;
        state.LowStockData = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(FetchLowStockAction.rejected, (state, action) => {
        state.LowStockLoad = false;
        state.LowStockError = action.payload;
      })
      .addCase(AdjustInventoryAction.fulfilled, (state) => {
        // Handled via re-fetch or product stock updates
      });

    // 8. Settings
    builder
      .addCase(FetchSettingsAction.pending, (state) => {
        state.SettingsLoad = true;
        state.SettingsError = null;
      })
      .addCase(FetchSettingsAction.fulfilled, (state, action) => {
        state.SettingsLoad = false;
        state.SettingsData = action.payload;
      })
      .addCase(FetchSettingsAction.rejected, (state, action) => {
        state.SettingsLoad = false;
        state.SettingsError = action.payload;
      })
      .addCase(UpdateSettingsAction.fulfilled, (state, action) => {
        state.SettingsData = action.payload;
      });


  },
});

export const {
  clearCreatedSale,
  clearSelectedProduct,
  clearSelectedSale,
  clearSelectedBulkOrder,
} = bakerySlice.actions;

export default bakerySlice.reducer;
