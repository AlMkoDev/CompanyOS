"use client";

import React from 'react';
import { ProcurementQueue } from '@/components/ops/supply-chain/ProcurementQueue';

export default function ProcurementPage() {
  return (
    <div className="p-6 md:p-10">
      <ProcurementQueue />
    </div>
  );
}