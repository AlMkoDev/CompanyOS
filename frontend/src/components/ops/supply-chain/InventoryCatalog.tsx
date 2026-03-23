"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { 
  PermissionGuard, 
  ActionGuard
} from '@/components/common/PermissionGuard';
import { SupplyChainPermission } from '@/hooks/useSupplyChainPermissions';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  AlertTriangle, 
  TrendingDown,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  MapPin,
  Users,
  type LucideIcon
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  abc_class?: string;
  xyz_class?: string;
  suppliers: Array<{
    supplier: {
      id: string;
      name: string;
    };
    unit_cost: number;
    lead_time_days: number;
    is_preferred: boolean;
  }>;
  stock_levels: Array<{
    id: string;
    quantity: number;
    reorder_point?: number;
    eoq?: number;
    location: {
      id: string;
      name: string;
    };
  }>;
}

interface InventoryFilters {
  search: string;
  category: string;
  abc_class: string;
  xyz_class: string;
  low_stock_only: boolean;
  location_id: string;
}

interface InventoryCatalogContentProps {
  isAuthenticated: boolean;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  filters: InventoryFilters;
  setFilters: React.Dispatch<React.SetStateAction<InventoryFilters>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  showProductModal: boolean;
  setShowProductModal: React.Dispatch<React.SetStateAction<boolean>>;
  showStockModal: boolean;
  setShowStockModal: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export function InventoryCatalog() {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: '',
    abc_class: '',
    xyz_class: '',
    low_stock_only: false,
    location_id: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Wrap the entire component with permission guard
  return (
    <PermissionGuard 
      requiredPermissions={[SupplyChainPermission.READ_INVENTORY]}
      showLoadingState={true}
      showErrorState={true}
    >
      <InventoryCatalogContent 
        isAuthenticated={isAuthenticated}
        products={products}
        setProducts={setProducts}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        setCategories={setCategories}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        showStockModal={showStockModal}
        setShowStockModal={setShowStockModal}
      />
    </PermissionGuard>
  );
}

function InventoryCatalogContent({
  isAuthenticated,
  products,
  setProducts,
  loading,
  setLoading,
  error,
  setError,
  filters,
  setFilters,
  categories,
  setCategories,
  showFilters,
  setShowFilters,
  selectedProduct,
  setSelectedProduct,
  showProductModal,
  setShowProductModal,
  showStockModal,
  setShowStockModal,
}: InventoryCatalogContentProps) {

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.abc_class) params.append('abc_class', filters.abc_class);
      if (filters.xyz_class) params.append('xyz_class', filters.xyz_class);

      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch(`/supply-chain/products?${params}`),
        apiFetch('/supply-chain/products/categories')
      ]);

      if (productsRes.ok) {
        let productsData = await productsRes.json();
        
        // Apply client-side filters
        if (filters.low_stock_only) {
          productsData = productsData.filter((product: Product) =>
            product.stock_levels.some(sl => 
              sl.reorder_point && sl.quantity <= sl.reorder_point
            )
          );
        }

        if (filters.location_id) {
          productsData = productsData.filter((product: Product) =>
            product.stock_levels.some(sl => sl.location.id === filters.location_id)
          );
        }

        setProducts(productsData);
      }

      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }

    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated, setCategories, setError, setLoading, setProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (
    key: keyof InventoryFilters,
    value: InventoryFilters[keyof InventoryFilters],
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      abc_class: '',
      xyz_class: '',
      low_stock_only: false,
      location_id: '',
    });
  };

  const getStockStatus = (product: Product) => {
    const lowStockItems = product.stock_levels.filter(sl => 
      sl.reorder_point && sl.quantity <= sl.reorder_point
    );
    
    if (lowStockItems.length > 0) return 'low';
    
    const outOfStockItems = product.stock_levels.filter(sl => sl.quantity === 0);
    if (outOfStockItems.length > 0) return 'out';
    
    return 'normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-brand-navy rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading mb-2 flex items-center gap-3">
            <Package className="text-brand-gold" size={36} />
            Inventory Catalog
          </h1>
          <p className="text-slate-400 text-lg">
            Manage products, stock levels, and inventory operations
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-5 rounded-full -mr-16 -mt-16 blur-[80px]"></div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Products"
          value={products.length}
          subtitle="Active SKUs"
          icon={Package}
          color="blue"
        />
        <SummaryCard
          title="Low Stock Items"
          value={products.filter(p => getStockStatus(p) === 'low').length}
          subtitle="Need reordering"
          icon={AlertTriangle}
          color="orange"
        />
        <SummaryCard
          title="Out of Stock"
          value={products.filter(p => getStockStatus(p) === 'out').length}
          subtitle="Zero inventory"
          icon={TrendingDown}
          color="red"
        />
        <SummaryCard
          title="Categories"
          value={categories.length}
          subtitle="Product groups"
          icon={BarChart3}
          color="green"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-brand-gold text-white border-brand-gold' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            
            <ActionGuard permission={SupplyChainPermission.CREATE_PRODUCT}>
              <button
                onClick={() => setShowProductModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Plus size={16} />
                Add Product
              </button>
            </ActionGuard>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              
              <ActionGuard permission={SupplyChainPermission.EXPORT_DATA}>
                <button
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Export"
                >
                  <Download size={16} />
                </button>
              </ActionGuard>
              
              <ActionGuard permission={SupplyChainPermission.CREATE_PRODUCT}>
                <button
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Import"
                >
                  <Upload size={16} />
                </button>
              </ActionGuard>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ABC Class</label>
                <select
                  value={filters.abc_class}
                  onChange={(e) => handleFilterChange('abc_class', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">XYZ Class</label>
                <select
                  value={filters.xyz_class}
                  onChange={(e) => handleFilterChange('xyz_class', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  <option value="X">Class X</option>
                  <option value="Y">Class Y</option>
                  <option value="Z">Class Z</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.low_stock_only}
                    onChange={(e) => handleFilterChange('low_stock_only', e.target.checked)}
                    className="rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                  />
                  <span className="text-sm text-slate-700">Low stock only</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Product</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Category</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Stock Status</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Total Stock</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Locations</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Suppliers</th>
                <th className="text-left px-6 py-4 font-medium text-slate-900">Classification</th>
                <th className="text-right px-6 py-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onView={() => setSelectedProduct(product)}
                  onEdit={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                  onStockAdjust={() => {
                    setSelectedProduct(product);
                    setShowStockModal(true);
                  }}
                />
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            fetchData();
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showStockModal && selectedProduct && (
        <StockAdjustmentModal
          product={selectedProduct}
          onClose={() => {
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            fetchData();
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red';
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">{title}</div>
        </div>
      </div>
      <div className="text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onStockAdjust: () => void;
}

function ProductRow({ product, onView, onEdit, onStockAdjust }: ProductRowProps) {
  const totalStock = product.stock_levels.reduce((total, sl) => total + sl.quantity, 0);
  const stockStatus = getStockStatus(product);
  const preferredSupplier = product.suppliers.find(s => s.is_preferred) || product.suppliers[0];

  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    low: 'bg-orange-100 text-orange-800',
    out: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    normal: 'Normal',
    low: 'Low Stock',
    out: 'Out of Stock',
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-slate-900">{product.name}</div>
          <div className="text-sm text-slate-500">SKU: {product.sku}</div>
          {product.description && (
            <div className="text-sm text-slate-500 truncate max-w-xs">{product.description}</div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {product.category || 'Uncategorized'}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[stockStatus]}`}>
          {statusLabels[stockStatus]}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <div className="font-medium text-slate-900">{totalStock}</div>
        <div className="text-sm text-slate-500">{product.unit_of_measure}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">{product.stock_levels.length} locations</span>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <Users size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">{product.suppliers.length} suppliers</span>
          {preferredSupplier && (
            <div className="text-xs text-slate-500">
              (Preferred: {preferredSupplier.supplier.name})
            </div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex gap-1">
          {product.abc_class && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {product.abc_class}
            </span>
          )}
          {product.xyz_class && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {product.xyz_class}
            </span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onView}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <ActionGuard permission={SupplyChainPermission.UPDATE_PRODUCT}>
            <button
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Edit Product"
            >
              <Edit size={16} />
            </button>
          </ActionGuard>
          <ActionGuard permission={SupplyChainPermission.ADJUST_INVENTORY}>
            <button
              onClick={onStockAdjust}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Adjust Stock"
            >
              <Settings size={16} />
            </button>
          </ActionGuard>
        </div>
      </td>
    </tr>
  );
}

function getStockStatus(product: Product): 'normal' | 'low' | 'out' {
  const lowStockItems = product.stock_levels.filter(sl => 
    sl.reorder_point && sl.quantity <= sl.reorder_point
  );
  
  if (lowStockItems.length > 0) return 'low';
  
  const outOfStockItems = product.stock_levels.filter(sl => sl.quantity === 0);
  if (outOfStockItems.length > 0) return 'out';
  
  return 'normal';
}

// Placeholder components for modals
function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h3>
        <p className="text-slate-600 mb-4">Product management modal coming soon...</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
