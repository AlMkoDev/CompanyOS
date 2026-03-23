import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch, apiUrl } from '@/lib/api';

interface StockLevel {
  id: string;
  quantity: number;
  reorder_point?: number;
  eoq?: number;
  location: {
    id: string;
    name: string;
  };
}

interface Supplier {
  supplier: {
    id: string;
    name: string;
  };
  unit_cost: number;
  lead_time_days: number;
  is_preferred: boolean;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  abc_class?: string;
  xyz_class?: string;
  suppliers: Supplier[];
  stock_levels: StockLevel[];
}

interface InventoryFilters {
  search?: string;
  category?: string;
  abc_class?: string;
  xyz_class?: string;
  low_stock_only?: boolean;
  location_id?: string;
}

type MutationPayload = Record<string, unknown>;
type StockLevelRecord = Record<string, unknown>;

export function useInventoryData(filters?: InventoryFilters) {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.abc_class) params.append('abc_class', filters.abc_class);
      if (filters?.xyz_class) params.append('xyz_class', filters.xyz_class);

      const response = await apiFetch(`${apiUrl('/supply-chain/products')}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      let productsData = await response.json();
      
      // Apply client-side filters
      if (filters?.low_stock_only) {
        productsData = productsData.filter((product: Product) =>
          product.stock_levels.some(sl => 
            sl.reorder_point && sl.quantity <= sl.reorder_point
          )
        );
      }

      if (filters?.location_id) {
        productsData = productsData.filter((product: Product) =>
          product.stock_levels.some(sl => sl.location.id === filters.location_id)
        );
      }

      setProducts(productsData);

    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated]);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiFetch('/supply-chain/products/categories');

      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchCategories, fetchProducts]);

  const refetch = () => {
    fetchProducts();
    fetchCategories();
  };

  return { 
    products, 
    categories, 
    loading, 
    error, 
    refetch 
  };
}

export function useProductDetails(productId: string) {
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isAuthenticated || !productId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/supply-chain/products/${productId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }

        setProduct(await response.json());

      } catch (err) {
        console.error('Failed to fetch product details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isAuthenticated, productId]);

  return { product, loading, error };
}

export function useStockLevels(filters?: { product_id?: string; location_id?: string; low_stock_only?: boolean }) {
  const { isAuthenticated } = useAuthStore();
  const [stockLevels, setStockLevels] = useState<StockLevelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockLevels = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (filters?.product_id) params.append('product_id', filters.product_id);
        if (filters?.location_id) params.append('location_id', filters.location_id);
        if (filters?.low_stock_only) params.append('low_stock_only', 'true');

        const response = await apiFetch(`${apiUrl('/supply-chain/inventory/stock-levels')}?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch stock levels');
        }

        setStockLevels(await response.json());

      } catch (err) {
        console.error('Failed to fetch stock levels:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stock levels');
      } finally {
        setLoading(false);
      }
    };

    fetchStockLevels();
  }, [isAuthenticated, filters]);

  return { stockLevels, loading, error };
}

// Product management functions
export function useProductMutations() {
  const { isAuthenticated } = useAuthStore();

  const createProduct = async (productData: MutationPayload) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }

    return response.json();
  };

  const updateProduct = async (productId: string, productData: MutationPayload) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch(`/supply-chain/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }

    return response.json();
  };

  const deleteProduct = async (productId: string) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch(`/supply-chain/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }

    return response.json();
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

// Stock adjustment functions
export function useStockMutations() {
  const { isAuthenticated } = useAuthStore();

  const adjustStock = async (adjustmentData: {
    product_id: string;
    location_id: string;
    quantity_change: number;
    reason_code?: string;
  }) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/inventory/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adjustmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to adjust stock');
    }

    return response.json();
  };

  const transferStock = async (transferData: {
    product_id: string;
    from_location_id: string;
    to_location_id: string;
    quantity: number;
    reference_id?: string;
  }) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/inventory/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to transfer stock');
    }

    return response.json();
  };

  const updateReorderPoint = async (
    productId: string, 
    locationId: string, 
    reorderPoint: number, 
    eoq?: number
  ) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/inventory/reorder-point', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        location_id: locationId,
        reorder_point: reorderPoint,
        eoq,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update reorder point');
    }

    return response.json();
  };

  return {
    adjustStock,
    transferStock,
    updateReorderPoint,
  };
}
