"use client";

import React from 'react';
import { InventoryCatalog } from '@/components/ops/supply-chain/InventoryCatalog';

export default function InventoryPage() {
  return (
    <div className="p-6 md:p-10">
      <InventoryCatalog />
    </div>
  );
}