"use client";

import React from 'react';
import { useSupplyChainData } from '@/hooks/useSupplyChainData';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Clock,
  XCircle,
  BarChart3,
  Activity,
  ShoppingCart,
  Warehouse,
  type LucideIcon
} from 'lucide-react';

type SupplyChainDashboardData = NonNullable<
  ReturnType<typeof useSupplyChainData>['data']
>;

type AlertType = 'critical' | 'warning' | 'info';

interface AlertConfig {
  type: AlertType;
  icon: LucideIcon;
  title: string;
  message: string;
  action: string;
  href: string;
}

export function SupplyChainDashboard() {
  const { data, loading, error } = useSupplyChainData();

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
          <XCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="bg-brand-navy rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading mb-2 flex items-center gap-3">
            <Package className="text-brand-gold" size={36} />
            Supply Chain Operations
          </h1>
          <p className="text-slate-400 text-lg">
            Real-time visibility across procurement, inventory, and supplier performance
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-5 rounded-full -mr-16 -mt-16 blur-[80px]"></div>
      </header>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Inventory Value"
          value={`R${(data?.inventory.stockValue || 0).toLocaleString()}`}
          subtitle={`${data?.inventory.totalProducts || 0} products`}
          icon={Warehouse}
          trend={data?.inventory.stockTurnover || 0}
          trendLabel="turnover rate"
          color="blue"
        />
        
        <MetricCard
          title="Active Purchase Orders"
          value={data?.procurement.activePOs || 0}
          subtitle={`R${(data?.procurement.monthlySpend || 0).toLocaleString()} monthly spend`}
          icon={ShoppingCart}
          trend={data?.procurement.avgProcessingTime || 0}
          trendLabel="avg processing days"
          color="green"
        />
        
        <MetricCard
          title="Supplier Performance"
          value={`${Math.round(data?.suppliers.avgPerformanceScore || 0)}/100`}
          subtitle={`${data?.suppliers.totalSuppliers || 0} active suppliers`}
          icon={Users}
          trend={data?.suppliers.riskSuppliers || 0}
          trendLabel="high risk suppliers"
          color="purple"
        />
        
        <MetricCard
          title="Operations Health"
          value={`${Math.round(data?.operations.completionRate || 0)}%`}
          subtitle={`${data?.operations.goodsReceipts || 0} receipts processed`}
          icon={Activity}
          trend={data?.operations.discrepancies || 0}
          trendLabel="discrepancies"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Alerts & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Critical Alerts */}
          <AlertsPanel data={data} />
          
          {/* Recent Activity */}
          <RecentActivityPanel />
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <QuickStatsPanel data={data} />
          
          {/* Pending Approvals */}
          <PendingApprovalsPanel data={data} />
        </div>
      </div>

      {/* Bottom Section - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SpendAnalyticsChart />
        <SupplierPerformanceChart />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend: number;
  trendLabel: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
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
      
      <div className="space-y-2">
        <div className="text-sm text-slate-600">{subtitle}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">{trend}</span>
          <span className="text-slate-400">{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ data }: { data: SupplyChainDashboardData | null }) {
  const alerts: AlertConfig[] = [
    {
      type: 'critical',
      icon: AlertTriangle,
      title: 'Low Stock Alert',
      message: `${data?.inventory.lowStockItems || 0} products below reorder point`,
      action: 'Review Inventory',
      href: '/supply-chain/inventory'
    },
    {
      type: 'warning',
      icon: Clock,
      title: 'Pending Approvals',
      message: `${data?.procurement.pendingApprovals || 0} purchase requisitions awaiting approval`,
      action: 'Review Queue',
      href: '/supply-chain/procurement'
    },
    {
      type: 'info',
      icon: Users,
      title: 'Supplier Risk',
      message: `${data?.suppliers.riskSuppliers || 0} suppliers require attention`,
      action: 'View Suppliers',
      href: '/supply-chain/suppliers'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-orange-500" />
        Critical Alerts & Actions
      </h3>
      
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <AlertItem key={index} {...alert} />
        ))}
      </div>
    </div>
  );
}

function AlertItem({ type, icon: Icon, title, message, action, href }: AlertConfig) {
  const typeColors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${typeColors[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon size={20} />
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm opacity-80">{message}</div>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = href}
          className="text-xs font-medium hover:underline"
        >
          {action} →
        </button>
      </div>
    </div>
  );
}

function RecentActivityPanel() {
  const activities = [
    { time: '2m ago', action: 'PO Created', details: 'PO-2024-001 for Office Supplies', user: 'John Smith' },
    { time: '15m ago', action: 'Goods Received', details: 'GR-2024-045 processed', user: 'Sarah Johnson' },
    { time: '1h ago', action: 'Supplier Updated', details: 'ABC Corp performance score updated', user: 'System' },
    { time: '2h ago', action: 'Stock Adjusted', details: 'Inventory adjustment for Product A', user: 'Mike Wilson' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Activity size={20} className="text-green-500" />
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="w-2 h-2 bg-brand-gold rounded-full mt-2 shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-900">{activity.action}</span>
                <span className="text-xs text-slate-500">{activity.time}</span>
              </div>
              <div className="text-sm text-slate-600">{activity.details}</div>
              <div className="text-xs text-slate-500">by {activity.user}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStatsPanel({ data }: { data: SupplyChainDashboardData | null }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
      
      <div className="space-y-4">
        <StatRow 
          label="Stock Turnover" 
          value={`${data?.inventory.stockTurnover || 0}x`}
          trend="up"
        />
        <StatRow 
          label="Avg PO Processing" 
          value={`${data?.procurement.avgProcessingTime || 0} days`}
          trend="down"
        />
        <StatRow 
          label="Supplier Score" 
          value={`${Math.round(data?.suppliers.avgPerformanceScore || 0)}/100`}
          trend="up"
        />
        <StatRow 
          label="Receipt Accuracy" 
          value={`${Math.round(data?.operations.completionRate || 0)}%`}
          trend="stable"
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'stable' }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-slate-600'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-900">{value}</span>
        <span className={`text-xs ${trendColors[trend]}`}>{trendIcons[trend]}</span>
      </div>
    </div>
  );
}

function PendingApprovalsPanel({ data }: { data: SupplyChainDashboardData | null }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Clock size={20} className="text-orange-500" />
        Pending Approvals
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div>
            <div className="font-medium text-orange-900">Purchase Requisitions</div>
            <div className="text-sm text-orange-700">{data?.procurement.pendingApprovals || 0} awaiting approval</div>
          </div>
          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            Review →
          </button>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div className="font-medium text-blue-900">Supplier Changes</div>
            <div className="text-sm text-blue-700">2 pending reviews</div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Review →
          </button>
        </div>
      </div>
    </div>
  );
}

function SpendAnalyticsChart() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-blue-500" />
        Monthly Spend Analytics
      </h3>
      
      <div className="h-48 flex items-end justify-between gap-2 mb-4">
        {[65, 78, 82, 71, 89, 95].map((height, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-brand-gold rounded-t-lg transition-all duration-1000"
              style={{ height: `${height}%` }}
            ></div>
            <div className="text-xs text-slate-500 mt-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-slate-600">
        <span className="font-medium">R2.4M</span> total spend this quarter
      </div>
    </div>
  );
}

function SupplierPerformanceChart() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-green-500" />
        Supplier Performance Trends
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">On-time Delivery</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium">85%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Quality Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-11/12 h-full bg-blue-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium">92%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Price Competitiveness</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-purple-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium">78%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
