import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
  Camera
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { FetchCategoriesAction, FetchProductsAction } from '../redux/actions/bakeryActions';
import { Product } from '../types';
import { bakeryLabels as t } from '../components/Bakerylabels';

interface ProductsViewProps {
  products?: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickStockAdjust: (productId: string, newStock: number) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products: initialProducts = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickStockAdjust,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { ProductsData, ProductsLoad, ProductsError,CategoriesData } = useSelector((state: RootState) => state.bakery);
useEffect(() => {
  dispatch(FetchProductsAction({}));
  if (!CategoriesData?.length) dispatch(FetchCategoriesAction({}));
}, [dispatch]);
  useEffect(() => {
    dispatch(FetchProductsAction({}));
  }, [dispatch]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');



  // Active product list from Redux
  const effectiveProducts: Product[] = (ProductsData?.length ? ProductsData : initialProducts) as Product[];

  // Filtering
  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(search.toLowerCase());

      const stockNum = Number(p.stock || 0);
      const minStockNum = Number(p.minStock ?? (p as any).min_stock ?? 5);

      let matchStock = true;
      if (stockFilter === 'in-stock') matchStock = stockNum > minStockNum;
      else if (stockFilter === 'low-stock') matchStock = stockNum <= minStockNum && stockNum > 0;
      else if (stockFilter === 'out-of-stock') matchStock = stockNum <= 0;

      return matchCategory && matchSearch && matchStock;
    });
  }, [effectiveProducts, selectedCategory, search, stockFilter]);

  const lowStockTotal = effectiveProducts.filter((p) => Number(p.stock) <= Number(p.minStock ?? (p as any).min_stock ?? 5) && Number(p.stock) > 0).length;
  const outOfStockTotal = effectiveProducts.filter((p) => Number(p.stock) <= 0).length;
const categories = ['All', ...(CategoriesData || []).map((c: any) => c.name).filter((n: string) => !!n)];
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29252A] tracking-tight">
            {t.pageTitle}
          </h1>
          <p className="text-sm text-[#756B70] mt-1">
            {t.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-white border-2 border-[#EDE2E5] rounded-xl p-1.5 shadow-2xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#FFF0F3] text-[#C94F6D]' : 'text-[#756B70] hover:text-[#29252A]'
              }`}
              title={t.tableViewTitle}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#FFF0F3] text-[#C94F6D]' : 'text-[#756B70] hover:text-[#29252A]'
              }`}
              title={t.gridViewTitle}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C94F6D] hover:bg-[#A83D58] active:scale-[0.98] text-white font-bold text-sm shadow-sm shadow-[#C94F6D]/25 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{t.addProductBtn}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-5 border-2 border-[#EDE2E5] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-[#756B70] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#FFF9F5]/70 border-2 border-[#EDE2E5] rounded-xl text-sm sm:text-base text-[#29252A] placeholder-[#756B70] focus:border-[#C94F6D] focus:ring-4 focus:ring-[#FCE7EC] outline-none"
            />
          </div>

          {/* Stock status filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                stockFilter === 'all'
                  ? 'bg-[#29252A] text-white'
                  : 'bg-[#FFF9F5] text-[#756B70] hover:text-[#29252A] border-2 border-[#EDE2E5]'
              }`}
            >
              {t.filterAll} ({effectiveProducts.length})
            </button>
            <button
              onClick={() => setStockFilter('in-stock')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                stockFilter === 'in-stock'
                  ? 'bg-[#3FA56B] text-white'
                  : 'bg-[#FFF9F5] text-[#3FA56B] hover:bg-[#EAF7EE] border-2 border-[#EDE2E5]'
              }`}
            >
              {t.filterInStock}
            </button>
            <button
              onClick={() => setStockFilter('low-stock')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                stockFilter === 'low-stock'
                  ? 'bg-[#D9A441] text-white'
                  : 'bg-[#FFF9F5] text-[#D9A441] hover:bg-[#FFF3D6] border-2 border-[#EDE2E5]'
              }`}
            >
              {t.filterLowStock} ({lowStockTotal})
            </button>
            <button
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                stockFilter === 'out-of-stock'
                  ? 'bg-[#D9535F] text-white'
                  : 'bg-[#FFF9F5] text-[#D9535F] hover:bg-[#FFF0F3] border-2 border-[#EDE2E5]'
              }`}
            >
              {t.filterOutOfStock} ({outOfStockTotal})
            </button>
          </div>
        </div>

        {/* Category Pills */}
     <div className="flex items-center gap-2.5 overflow-x-auto pt-3 border-t-2 border-[#EDE2E5]/70 no-scrollbar">
  {categories.map((cat) => (
    <button
      key={cat}
      onClick={() => setSelectedCategory(cat)}
      className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
        selectedCategory === cat
          ? 'bg-[#C94F6D] text-white shadow-2xs'
          : 'bg-[#FFF9F5] text-[#756B70] hover:text-[#29252A] hover:bg-[#FFF0F3]'
      }`}
    >
      {cat === 'All' ? t.categoryAll : cat}
    </button>
  ))}
</div>
      </div>

      {/* Loading Skeleton */}
      {ProductsLoad && !effectiveProducts.length && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#EDE2E5] space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-[#FFF9F5] rounded-xl"></div>
          ))}
        </div>
      )}

      {/* Error State */}
      {ProductsError && !effectiveProducts.length && (
        <div className="bg-[#FFF0F3] border-2 border-[#C94F6D]/30 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#C94F6D] mx-auto" />
          <h3 className="text-lg font-bold text-[#29252A]">{t.failedToLoad}</h3>
          <p className="text-sm text-[#756B70]">{String(ProductsError)}</p>
          <button
            onClick={() => dispatch(FetchProductsAction({}))}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#C94F6D] text-white text-sm font-bold rounded-xl hover:bg-[#A83D58] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t.retryProducts}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!ProductsLoad && filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-[#EDE2E5] shadow-xs space-y-3">
          <Package className="w-14 h-14 text-[#C94F6D]/50 mx-auto" />
          <h3 className="text-lg font-bold text-[#29252A]">{t.noProductsFound}</h3>
          <p className="text-sm text-[#756B70] max-w-sm mx-auto">
            {search || selectedCategory !== 'All' || stockFilter !== 'all'
              ? t.noProductsHintFilter
              : t.noProductsHintEmpty}
          </p>
          <button
            onClick={onAddProduct}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#C94F6D] hover:bg-[#A83D58] text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-5 h-5" />
            <span>{t.addNewProduct}</span>
          </button>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredProducts.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#EDE2E5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FFF9F5] text-[#756B70] font-bold border-b-2 border-[#EDE2E5] uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-4 px-4">{t.colItemDetails}</th>
                  <th className="py-4 px-4">{t.colCategory}</th>
                  <th className="py-4 px-4 text-right">{t.colSellingPrice}</th>
                  <th className="py-4 px-4 text-right">{t.colGstRate}</th>
                  <th className="py-4 px-4 text-center">{t.colStockLevel}</th>
                  <th className="py-4 px-4 text-center">{t.colStatus}</th>
                  <th className="py-4 px-4 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2E5]/70">
                {filteredProducts.map((p) => {
                  const stockNum = Number(p.stock || 0);
                  const minStockNum = Number(p.minStock ?? (p as any).min_stock ?? 5);
                  const isOut = stockNum <= 0;
                  const isLow = stockNum <= minStockNum && stockNum > 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#FFF9F5]/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=100'}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-[#EDE2E5] shrink-0"
                          />
                          <div>
                            <p className="font-bold text-base text-[#29252A]">{p.name}</p>
                            <p className="text-xs text-[#756B70] font-mono mt-0.5">
                              {p.code} • {t.hsnLabel}: {p.hsnCode || (p as any).hsn_code || '1905'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[#756B70] font-semibold">
                        {p.category}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-base text-[#29252A]">
                        ₹{p.sellingPrice || (p as any).selling_price}{' '}
                        <span className="text-xs text-[#756B70] font-normal">/ {p.unit}</span>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-[#756B70]">
                        {p.gstRate || (p as any).gst_rate || 5}%
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-bold text-base ${isOut ? 'text-[#D9535F]' : isLow ? 'text-[#D9A441]' : 'text-[#29252A]'}`}>
                            {p.stock} {p.unit}
                          </span>
                       
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF0F3] text-[#D9535F] border-2 border-[#D9535F]/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t.statusOutOfStock}</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF3D6] text-[#D9A441] border-2 border-[#D9A441]/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t.statusLowStock}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF7EE] text-[#3FA56B] border-2 border-[#3FA56B]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.statusInStock}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-2.5 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                            title={t.editProductTitle}
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-2.5 rounded-lg text-[#756B70] hover:text-[#D9535F] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                            title={t.deleteProductTitle}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const stockNum = Number(p.stock || 0);
            const minStockNum = Number(p.minStock ?? (p as any).min_stock ?? 5);
            const isOut = stockNum <= 0;
            const isLow = stockNum <= minStockNum && stockNum > 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border-2 border-[#EDE2E5] p-5 shadow-xs hover:border-[#C94F6D]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative mb-3.5">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=250'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 rounded-xl object-cover border-2 border-[#EDE2E5]"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      {isOut ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#D9535F] text-white">
                          {t.statusOutOfStock}
                        </span>
                      ) : isLow ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#FFF3D6] text-[#D9A441]">
                          {t.statusLowStock}: {p.stock}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/90 text-[#3FA56B]">
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-[#29252A]">{p.name}</h3>
                  <p className="text-sm text-[#756B70] mt-1">{p.category}</p>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-[#EDE2E5] flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-[#29252A]">
                      ₹{p.sellingPrice || (p as any).selling_price}
                    </span>
                    <span className="text-xs text-[#756B70]"> /{p.unit}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditProduct(p)}
                      className="p-2.5 rounded-lg text-[#756B70] hover:text-[#C94F6D] hover:bg-[#FFF4F6] cursor-pointer"
                      title={t.editProductTitle}
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-2.5 rounded-lg text-[#756B70] hover:text-[#D9535F] hover:bg-[#FFF0F3] cursor-pointer"
                      title={t.deleteProductTitle}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};