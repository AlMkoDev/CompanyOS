'use client';

import React, { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ApprovalPolicy {
  id: string;
  product_category: string;
  auto_approve_limit: string;
  l1_threshold: string;
  l2_threshold: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export default function ApprovalPoliciesPage() {
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/supply-chain/approval-policies'));
      if (!res.ok) throw new Error('Failed to fetch policies');
      const data = await res.json();
      setPolicies(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(apiUrl(`/supply-chain/approval-policies/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: parseFloat(value) }),
      });
      if (!res.ok) throw new Error('Update failed');
      // Update local state instead of full refetch for snappy UI
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <div className="p-8">Loading policies...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Policies</h1>
        <p className="text-muted-foreground mt-2">
          Configure approval thresholds per product category (Auto-Approve, L1 Manager, L2 Director).
        </p>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-xl">{policy.product_category}</CardTitle>
              <CardDescription>Approval configuration for {policy.product_category.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Approve Limit (£)</label>
                <Input
                  type="number"
                  value={policy.auto_approve_limit}
                  onBlur={(e) => handleUpdate(policy.id, 'auto_approve_limit', e.target.value)}
                  onChange={(e) =>
                    setPolicies((prev) =>
                      prev.map((p) => (p.id === policy.id ? { ...p, auto_approve_limit: e.target.value } : p))
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">L1 Manager Threshold (£)</label>
                <Input
                  type="number"
                  value={policy.l1_threshold}
                  onBlur={(e) => handleUpdate(policy.id, 'l1_threshold', e.target.value)}
                  onChange={(e) =>
                    setPolicies((prev) =>
                      prev.map((p) => (p.id === policy.id ? { ...p, l1_threshold: e.target.value } : p))
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">L2 Director Threshold (£)</label>
                <Input
                  type="number"
                  value={policy.l2_threshold}
                  onBlur={(e) => handleUpdate(policy.id, 'l2_threshold', e.target.value)}
                  onChange={(e) =>
                    setPolicies((prev) =>
                      prev.map((p) => (p.id === policy.id ? { ...p, l2_threshold: e.target.value } : p))
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
