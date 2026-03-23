"use client";

import React from 'react';

export default function NotificationsPage() {
  return (
    <div className="p-10 text-center flex flex-col items-center justify-center gap-6 h-full">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl">🔔</div>
      <h1 className="text-3xl font-heading text-brand-navy">Notification Center</h1>
      <p className="text-slate-500 max-w-md">Real-time alerts for budget approvals, deadline breaches, and compliance updates are coming online.</p>
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-brand-gold rounded-full animate-ping"></div>
      </div>
    </div>
  );
}
