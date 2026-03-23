import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

type DashboardRecord = Record<string, unknown>;

interface SupplyChainInventoryDashboard extends DashboardRecord {
  totalProducts?: number;
  lowStockItems?: number;
  totalValue?: number;
  turnoverRate?: number;
  recentMovements?: DashboardRecord[];
}

interface SupplyChainProcurementDashboard extends DashboardRecord {
  activePOs?: number;
  pendingApprovals?: number;
  monthlySpend?: number;
  avgProcessingTime?: number;
  recentPOs?: DashboardRecord[];
}

interface SupplyChainSupplierDashboard extends DashboardRecord {
  summary?: {
    totalSuppliers?: number;
    averageScore?: number;
    riskDistribution?: {
      HIGH?: number;
      CRITICAL?: number;
    };
  };
  topPerformers?: DashboardRecord[];
  recentActivity?: DashboardRecord[];
}

interface SupplyChainOperationsDashboard extends DashboardRecord {
  totalGoodsReceipts?: number;
  withDiscrepancies?: number;
  discrepancyRate?: number;
  auditAlerts?: number;
  recentReceipts?: DashboardRecord[];
}

interface SupplyChainDashboardData {
  inventory: SupplyChainInventoryDashboard;
  procurement: SupplyChainProcurementDashboard;
  suppliers: SupplyChainSupplierDashboard;
  operations: SupplyChainOperationsDashboard;
}

interface SupplyChainData {
  inventory: {
    totalProducts: number;
    lowStockItems: number;
    stockValue: number;
    stockTurnover: number;
    recentMovements: DashboardRecord[];
  };
  procurement: {
    activePOs: number;
    pendingApprovals: number;
    monthlySpend: number;
    avgProcessingTime: number;
    recentPOs: DashboardRecord[];
  };
  suppliers: {
    totalSuppliers: number;
    topPerformers: number;
    riskSuppliers: number;
    avgPerformanceScore: number;
    recentActivity: DashboardRecord[];
  };
  operations: {
    goodsReceipts: number;
    discrepancies: number;
    completionRate: number;
    auditAlerts: number;
    recentReceipts: DashboardRecord[];
  };
}

export function useSupplyChainData() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<SupplyChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const endpoints: Array<{
        key: keyof SupplyChainDashboardData;
        url: string;
      }> = [
        { key: 'inventory', url: '/supply-chain/inventory/dashboard' },
        { key: 'procurement', url: '/supply-chain/procurement-workflow/dashboard' },
        { key: 'suppliers', url: '/supply-chain/supplier-performance/dashboard' },
        { key: 'operations', url: '/supply-chain/goods-receipt/stats/discrepancies' },
      ];

      const results = await Promise.allSettled(
        endpoints.map((endpoint) =>
          apiFetch(endpoint.url).then((res) => (res.ok ? res.json() : null)),
        ),
      );

      const processedData: SupplyChainDashboardData = {
        inventory: getDefaultData('inventory'),
        procurement: getDefaultData('procurement'),
        suppliers: getDefaultData('suppliers'),
        operations: getDefaultData('operations'),
      };

      results.forEach((result, index) => {
        const endpoint = endpoints[index];
        if (result.status === 'fulfilled' && result.value) {
          processedData[endpoint.key] = result.value as SupplyChainDashboardData[typeof endpoint.key];
        }
      });

      setData({
        inventory: {
          totalProducts: processedData.inventory.totalProducts || 0,
          lowStockItems: processedData.inventory.lowStockItems || 0,
          stockValue: processedData.inventory.totalValue || 0,
          stockTurnover: processedData.inventory.turnoverRate || 0,
          recentMovements: processedData.inventory.recentMovements || [],
        },
        procurement: {
          activePOs: processedData.procurement.activePOs || 0,
          pendingApprovals: processedData.procurement.pendingApprovals || 0,
          monthlySpend: processedData.procurement.monthlySpend || 0,
          avgProcessingTime: processedData.procurement.avgProcessingTime || 0,
          recentPOs: processedData.procurement.recentPOs || [],
        },
        suppliers: {
          totalSuppliers: processedData.suppliers.summary?.totalSuppliers || 0,
          topPerformers: processedData.suppliers.topPerformers?.length || 0,
          riskSuppliers:
            (processedData.suppliers.summary?.riskDistribution?.HIGH || 0) +
            (processedData.suppliers.summary?.riskDistribution?.CRITICAL || 0),
          avgPerformanceScore: processedData.suppliers.summary?.averageScore || 0,
          recentActivity: processedData.suppliers.recentActivity || [],
        },
        operations: {
          goodsReceipts: processedData.operations.totalGoodsReceipts || 0,
          discrepancies: processedData.operations.withDiscrepancies || 0,
          completionRate: processedData.operations.discrepancyRate
            ? 100 - processedData.operations.discrepancyRate
            : 100,
          auditAlerts: processedData.operations.auditAlerts || 0,
          recentReceipts: processedData.operations.recentReceipts || [],
        },
      });
    } catch (err) {
      console.error('Failed to fetch supply chain data:', err);
      setError('Failed to load supply chain data');
      setData(getFallbackData());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData() };
}

function getDefaultData<Key extends keyof SupplyChainDashboardData>(
  key: Key,
): SupplyChainDashboardData[Key] {
  const defaults = {
    inventory: {
      totalProducts: 0,
      lowStockItems: 0,
      totalValue: 0,
      turnoverRate: 0,
      recentMovements: [],
    },
    procurement: {
      activePOs: 0,
      pendingApprovals: 0,
      monthlySpend: 0,
      avgProcessingTime: 0,
      recentPOs: [],
    },
    suppliers: {
      summary: {
        totalSuppliers: 0,
        averageScore: 0,
        riskDistribution: { HIGH: 0, CRITICAL: 0 },
      },
      topPerformers: [],
      recentActivity: [],
    },
    operations: {
      totalGoodsReceipts: 0,
      withDiscrepancies: 0,
      discrepancyRate: 0,
      auditAlerts: 0,
      recentReceipts: [],
    },
  };

  return defaults[key];
}

function getFallbackData(): SupplyChainData {
  return {
    inventory: {
      totalProducts: 0,
      lowStockItems: 0,
      stockValue: 0,
      stockTurnover: 0,
      recentMovements: [],
    },
    procurement: {
      activePOs: 0,
      pendingApprovals: 0,
      monthlySpend: 0,
      avgProcessingTime: 0,
      recentPOs: [],
    },
    suppliers: {
      totalSuppliers: 0,
      topPerformers: 0,
      riskSuppliers: 0,
      avgPerformanceScore: 0,
      recentActivity: [],
    },
    operations: {
      goodsReceipts: 0,
      discrepancies: 0,
      completionRate: 100,
      auditAlerts: 0,
      recentReceipts: [],
    },
  };
}
