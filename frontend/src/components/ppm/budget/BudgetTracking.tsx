'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Upload,
  FileText,
  Trash2,
  Plus,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface BudgetSpendEntry {
  id: string;
  projectId: string;
  category: string; // Personnel, Equipment, Software, Travel, etc.
  description: string;
  amount: number;
  planned: boolean; // true = planned budget, false = actual spend
  date: Date;
  receiptUrl?: string;
  receiptName?: string;
  createdBy: string;
  createdAt: Date;
}

interface BudgetSummary {
  totalAllocated: number;
  totalPlanned: number;
  totalSpent: number;
  remaining: number;
  varianceAmount: number;
  variancePercent: number;
  status: 'GREEN' | 'AMBER' | 'RED';
  burnRate: number; // Percentage of budget consumed
}

interface BudgetTrackingProps {
  projectId: string;
  allocatedBudget: number;
  spendEntries: BudgetSpendEntry[];
  onAddSpend?: (entry: Omit<BudgetSpendEntry, 'id' | 'createdAt'>) => void;
  onDeleteSpend?: (entryId: string) => void;
  onUploadReceipt?: (entryId: string, file: File) => void;
  showReceiptUpload?: boolean;
  receiptThreshold?: number; // Require receipt above this amount
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const getStatusColor = (status: 'GREEN' | 'AMBER' | 'RED'): string => {
  switch (status) {
    case 'GREEN': return '#10b981';
    case 'AMBER': return '#f59e0b';
    case 'RED': return '#ef4444';
  }
};

const calculateVarianceStatus = (variancePercent: number): 'GREEN' | 'AMBER' | 'RED' => {
  if (variancePercent < 0) return 'GREEN'; // Under budget
  if (variancePercent <= 10) return 'AMBER'; // 5-10% over budget
  return 'RED'; // >10% over budget
};

// ============================================================================
// BUDGET SUMMARY CARD COMPONENT
// ============================================================================

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  allocatedBudget: number;
}

function BudgetSummaryCard({ summary, allocatedBudget }: BudgetSummaryCardProps) {
  const statusColor = getStatusColor(summary.status);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <DollarSign size={20} className="text-green-600" />
          Budget Summary
        </h3>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {summary.status} STATUS
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Allocated Budget */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">
            Allocated Budget
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {formatCurrency(allocatedBudget)}
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-1">
            Total Spent
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {formatCurrency(summary.totalSpent)}
          </div>
        </div>

        {/* Remaining */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
            Remaining
          </div>
          <div className="text-2xl font-bold text-green-800">
            {formatCurrency(summary.remaining)}
          </div>
        </div>

        {/* Variance */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: `${statusColor}10`,
            borderColor: `${statusColor}30`,
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: statusColor }}
          >
            Variance
          </div>
          <div
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: statusColor }}
          >
            {summary.varianceAmount >= 0 ? (
              <TrendingUp size={24} />
            ) : (
              <TrendingDown size={24} />
            )}
            {formatCurrency(Math.abs(summary.varianceAmount))}
          </div>
          <div
            className="text-sm font-semibold mt-1"
            style={{ color: statusColor }}
          >
            {summary.varianceAmount >= 0 ? '+' : ''}{formatPercent(summary.variancePercent)}
          </div>
        </div>
      </div>

      {/* Burn Rate Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Budget Burn Rate</span>
          <span className="text-sm font-bold text-slate-900">{formatPercent(summary.burnRate)}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(summary.burnRate, 100)}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Variance Alert */}
      {summary.status !== 'GREEN' && (
        <div
          className="mt-4 p-4 rounded-lg border flex items-start gap-3"
          style={{
            backgroundColor: `${statusColor}10`,
            borderColor: `${statusColor}30`,
          }}
        >
          <AlertTriangle size={20} className="mt-0.5" style={{ color: statusColor }} />
          <div>
            <div className="font-bold text-slate-900" style={{ color: statusColor }}>
              Budget Variance Alert
            </div>
            <p className="text-sm text-slate-700 mt-1">
              {summary.status === 'AMBER'
                ? `Budget is ${formatPercent(summary.variancePercent)} over planned spend. Monitor closely.`
                : `Budget is critically over by ${formatPercent(summary.variancePercent)}. Immediate action required.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUDGET CHART COMPONENT (Bar Chart - Planned vs Actual)
// ============================================================================

interface BudgetBarChartProps {
  spendEntries: BudgetSpendEntry[];
  categories: string[];
}

function BudgetBarChart({ spendEntries, categories }: BudgetBarChartProps) {
  const chartData = useMemo(() => {
    return categories.map((category) => {
      const categoryEntries = spendEntries.filter((e) => e.category === category);
      const planned = categoryEntries
        .filter((e) => e.planned)
        .reduce((sum, e) => sum + e.amount, 0);
      const actual = categoryEntries
        .filter((e) => !e.planned)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return { category, planned, actual };
    });
  }, [spendEntries, categories]);

  const maxValue = Math.max(...chartData.flatMap((d) => [d.planned, d.actual]));
  const chartHeight = 200;
  const barWidth = 40;
  const groupWidth = 120;
  const padding = 60;
  const chartWidth = categories.length * groupWidth + padding * 2;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Planned vs Actual Spend by Category</h3>
      
      <svg width={chartWidth} height={chartHeight + 80} className="mx-auto">
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <text
              x={padding - 10}
              y={chartHeight * (1 - ratio) + 20}
              fontSize="10"
              textAnchor="end"
              fill="#64748b"
            >
              {formatCurrency(maxValue * ratio)}
            </text>
            <line
              x1={padding}
              y1={chartHeight * (1 - ratio) + 20}
              x2={chartWidth - padding}
              y2={chartHeight * (1 - ratio) + 20}
              stroke="#e2e8f0"
              strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* Bars for each category */}
        {chartData.map((data, index) => {
          const x = padding + index * groupWidth + 10;
          const plannedHeight = (data.planned / maxValue) * chartHeight;
          const actualHeight = (data.actual / maxValue) * chartHeight;

          return (
            <g key={data.category}>
              {/* Planned Bar */}
              <rect
                x={x}
                y={chartHeight - plannedHeight + 20}
                width={barWidth}
                height={plannedHeight}
                fill="#3b82f6"
                rx="4"
                opacity={0.8}
              />

              {/* Actual Bar */}
              <rect
                x={x + barWidth + 5}
                y={chartHeight - actualHeight + 20}
                width={barWidth}
                height={actualHeight}
                fill="#10b981"
                rx="4"
                opacity={0.8}
              />

              {/* Category Label */}
              <text
                x={x + barWidth}
                y={chartHeight + 40}
                fontSize="11"
                textAnchor="middle"
                fill="#475569"
                fontWeight="500"
              >
                {data.category}
              </text>

              {/* Values on top of bars */}
              {data.planned > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - plannedHeight + 15}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#1e40af"
                  fontWeight="600"
                >
                  {formatCurrency(data.planned)}
                </text>
              )}
              {data.actual > 0 && (
                <text
                  x={x + barWidth + 5 + barWidth / 2}
                  y={chartHeight - actualHeight + 15}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#065f46"
                  fontWeight="600"
                >
                  {formatCurrency(data.actual)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded opacity-80" />
          <span className="text-sm text-slate-700 font-medium">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded opacity-80" />
          <span className="text-sm text-slate-700 font-medium">Actual</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SPEND ENTRY LIST COMPONENT
// ============================================================================

interface SpendEntryListProps {
  entries: BudgetSpendEntry[];
  onDeleteEntry: (entryId: string) => void;
  onUploadReceipt: (entryId: string, file: File) => void;
  receiptThreshold: number;
}

function SpendEntryList({ entries, onDeleteEntry, onUploadReceipt, receiptThreshold }: SpendEntryListProps) {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Spend Entries</h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No spend entries yet</p>
          </div>
        ) : (
          sortedEntries.map((entry) => {
            const requiresReceipt = entry.amount >= receiptThreshold && !entry.receiptUrl;
            
            return (
              <div
                key={entry.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        entry.planned
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {entry.planned ? 'PLANNED' : 'ACTUAL'}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{entry.category}</span>
                      {requiresReceipt && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Receipt Required
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {entry.description}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{entry.createdBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {formatCurrency(entry.amount)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {entry.receiptUrl ? (
                        <a
                          href={entry.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText size={12} />
                          View Receipt
                        </a>
                      ) : (
                        <label className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                          <Upload size={12} />
                          Upload Receipt
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onUploadReceipt(entry.id, file);
                            }}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                        </label>
                      )}
                      
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADD SPEND ENTRY MODAL
// ============================================================================

interface AddSpendEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<BudgetSpendEntry, 'id' | 'createdAt'>) => void;
  categories: string[];
}

function AddSpendEntryModal({ isOpen, onClose, onAdd, categories }: AddSpendEntryModalProps) {
  const [category, setCategory] = useState(categories[0] || 'Personnel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      projectId: 'proj-001', // TODO: Get from props
      category,
      description,
      amount: parseFloat(amount),
      planned: isPlanned,
      date: new Date(date),
      createdBy: 'Current User', // TODO: Get from auth
    });
    
    // Reset form
    setCategory(categories[0]);
    setDescription('');
    setAmount('');
    setIsPlanned(false);
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Add Spend Entry</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Entry Type
            </label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="entryType"
                  checked={!isPlanned}
                  onChange={() => setIsPlanned(false)}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border text-center transition-all ${
                  !isPlanned
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-300 text-slate-600'
                }`}>
                  <div className="text-sm font-bold">Actual Spend</div>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="entryType"
                  checked={isPlanned}
                  onChange={() => setIsPlanned(true)}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border text-center transition-all ${
                  isPlanned
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-600'
                }`}>
                  <div className="text-sm font-bold">Planned</div>
                </div>
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy resize-none"
              rows={3}
              placeholder="Describe this spend entry..."
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-brand-navy hover:bg-brand-navy/90">
              Add Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN BUDGET TRACKING COMPONENT
// ============================================================================

export function BudgetTracking({
  allocatedBudget,
  spendEntries: initialSpendEntries,
  onAddSpend,
  onDeleteSpend,
  onUploadReceipt,
  receiptThreshold = 100, // Require receipt for expenses >= $100
}: BudgetTrackingProps) {
  const [spendEntries, setSpendEntries] = useState<BudgetSpendEntry[]>(initialSpendEntries);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Default categories
  const categories = [
    'Personnel',
    'Equipment',
    'Software',
    'Travel',
    'Training',
    'Consulting',
    'Infrastructure',
    'Contingency',
  ];

  // Calculate budget summary
  const summary: BudgetSummary = useMemo(() => {
    const totalPlanned = spendEntries
      .filter((e) => e.planned)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalSpent = spendEntries
      .filter((e) => !e.planned)
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = allocatedBudget - totalSpent;
    const varianceAmount = totalSpent - totalPlanned;
    const variancePercent = totalPlanned > 0 ? (varianceAmount / totalPlanned) * 100 : 0;
    const status = calculateVarianceStatus(variancePercent);
    const burnRate = (totalSpent / allocatedBudget) * 100;

    return {
      totalAllocated: allocatedBudget,
      totalPlanned,
      totalSpent,
      remaining,
      varianceAmount,
      variancePercent,
      status,
      burnRate,
    };
  }, [spendEntries, allocatedBudget]);

  // Handle add spend
  const handleAddSpend = (entry: Omit<BudgetSpendEntry, 'id' | 'createdAt'>) => {
    const newEntry: BudgetSpendEntry = {
      ...entry,
      id: `spend-${Date.now()}`,
      createdAt: new Date(),
    };
    setSpendEntries([...spendEntries, newEntry]);
    onAddSpend?.(entry);
  };

  // Handle delete spend
  const handleDeleteSpend = (entryId: string) => {
    setSpendEntries(spendEntries.filter((e) => e.id !== entryId));
    onDeleteSpend?.(entryId);
  };

  // Handle upload receipt
  const handleUploadReceipt = (entryId: string, file: File) => {
    console.log('Uploading receipt:', file.name);
    // TODO: Implement actual upload
    onUploadReceipt?.(entryId, file);
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary Card */}
      <BudgetSummaryCard summary={summary} allocatedBudget={allocatedBudget} />

      {/* Budget Bar Chart */}
      <BudgetBarChart spendEntries={spendEntries} categories={categories} />

      {/* Add Entry Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Plus size={16} />
          Add Spend Entry
        </Button>
      </div>

      {/* Spend Entry List */}
      <SpendEntryList
        entries={spendEntries}
        onDeleteEntry={handleDeleteSpend}
        onUploadReceipt={handleUploadReceipt}
        receiptThreshold={receiptThreshold}
      />

      {/* Add Entry Modal */}
      <AddSpendEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSpend}
        categories={categories}
      />

      {/* Budget History Timeline (Placeholder) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Budget History Timeline</h3>
        <div className="text-center py-8 text-slate-500">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p>Budget change history coming soon</p>
        </div>
      </div>
    </div>
  );
}
