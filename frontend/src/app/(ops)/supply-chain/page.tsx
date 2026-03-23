"use client";

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { SupplyChainDashboard } from '@/components/ops/supply-chain/SupplyChainDashboard';

export default function SupplyChainPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 md:p-10">
      <SupplyChainDashboard />
    </div>
  );
}
