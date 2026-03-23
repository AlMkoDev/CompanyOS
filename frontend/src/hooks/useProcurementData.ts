import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch, apiUrl } from '@/lib/api';

type ProcurementRecord = Record<string, unknown>;

interface PRLine {
  id: string;
  product_id: string;
  quantity: number;
  estimated_cost?: number;
  product: {
    id: string;
    sku: string;
    name: string;
    category?: string;
    unit_of_measure: string;
  };
}

interface PurchaseRequisition {
  id: string;
  pr_number: string;
  status: 'DRAFT' | 'PENDING_L1' | 'PENDING_L2' | 'APPROVED' | 'REJECTED';
  requester_id: string;
  justification?: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
  lines: PRLine[];
  totalEstimatedCost: number;
}

interface ProcurementDashboard {
  totalPRs: number;
  pendingApprovals: number;
  pendingL1: number;
  pendingL2: number;
  approvedPRs: number;
  activePOs: number;
  monthlySpend: number;
  avgProcessingTime: number;
  recentPRs: PurchaseRequisition[];
  recentPOs: ProcurementRecord[];
}

export function useProcurementQueue(level: 'L1' | 'L2' = 'L1') {
  const { isAuthenticated } = useAuthStore();
  const [queue, setQueue] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`${apiUrl('/supply-chain/procurement-workflow/approval-queue')}?level=${level}`);

      if (!response.ok) {
        throw new Error('Failed to fetch approval queue');
      }

      setQueue(await response.json());

    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  }, [level, isAuthenticated]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return { queue, loading, error, refetch: fetchQueue };
}

export function useProcurementRequisitions(filters?: {
  status?: string;
  requesterId?: string;
  limit?: number;
  offset?: number;
}) {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<{
    data: PurchaseRequisition[];
    total: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.requesterId) params.append('requester', filters.requesterId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiFetch(`${apiUrl('/supply-chain/procurement-workflow/requisitions')}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch purchase requisitions');
      }

      setData(await response.json());

    } catch (err) {
      console.error('Failed to fetch purchase requisitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load purchase requisitions');
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  return { data, loading, error, refetch: fetchPRs };
}

export function useProcurementDashboard() {
  const { isAuthenticated } = useAuthStore();
  const [dashboard, setDashboard] = useState<ProcurementDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/supply-chain/procurement-workflow/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch procurement dashboard');
      }

      setDashboard(await response.json());

    } catch (err) {
      console.error('Failed to fetch procurement dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load procurement dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

export function useProcurementMutations() {
  const { isAuthenticated } = useAuthStore();

  const createPR = async (prData: {
    requesterNote?: string;
    justification?: string;
    departmentId?: string;
    items: {
      productId: string;
      quantity: number;
      estimatedCost?: number;
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      businessJustification?: string;
    }[];
  }) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/procurement-workflow/requisitions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create purchase requisition');
    }

    return response.json();
  };

  const approvePR = async (prId: string, approved: boolean, comments?: string) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch(`/supply-chain/procurement-workflow/requisitions/${prId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved, comments }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process approval');
    }

    return response.json();
  };

  const createPOFromPR = async (poData: {
    prId: string;
    supplierId: string;
    items: {
      prLineId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }[];
    deliveryDate?: Date;
    paymentTerms?: string;
    specialInstructions?: string;
  }) => {
    if (!isAuthenticated) throw new Error('No authenticated session');

    const response = await apiFetch('/supply-chain/procurement-workflow/purchase-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(poData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create purchase order');
    }

    return response.json();
  };

  return {
    createPR,
    approvePR,
    createPOFromPR,
  };
}

export function usePRDetails(prId: string) {
  const { isAuthenticated } = useAuthStore();
  const [pr, setPR] = useState<PurchaseRequisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPR = async () => {
      if (!isAuthenticated || !prId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/supply-chain/procurement-workflow/requisitions/${prId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch PR details');
        }

        setPR(await response.json());

      } catch (err) {
        console.error('Failed to fetch PR details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PR details');
      } finally {
        setLoading(false);
      }
    };

    fetchPR();
  }, [isAuthenticated, prId]);

  return { pr, loading, error };
}
