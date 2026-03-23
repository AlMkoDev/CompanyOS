"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  PermissionGuard, 
  ConditionalRender 
} from '@/components/common/PermissionGuard';
import { SupplyChainPermission } from '@/hooks/useSupplyChainPermissions';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Search,
  RefreshCw,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  ChevronRight,
  ChevronDown,
  Download,
  type LucideIcon
} from 'lucide-react';

// Utility functions
const getStatusColor = (status: string) => {
  const colors = {
    'DRAFT': 'bg-gray-100 text-gray-800',
    'PENDING_L1': 'bg-orange-100 text-orange-800',
    'PENDING_L2': 'bg-yellow-100 text-yellow-800',
    'APPROVED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status: string) => {
  const icons = {
    'DRAFT': FileText,
    'PENDING_L1': Clock,
    'PENDING_L2': AlertTriangle,
    'APPROVED': CheckCircle,
    'REJECTED': XCircle,
  };
  const Icon = icons[status as keyof typeof icons] || FileText;
  return <Icon size={16} />;
};

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

interface ApprovalFilters {
  level: 'L1' | 'L2';
  status: string;
  search: string;
  dateRange: string;
}

interface ProcurementQueueContentProps {
  isAuthenticated: boolean;
  approvalQueue: PurchaseRequisition[];
  setApprovalQueue: React.Dispatch<React.SetStateAction<PurchaseRequisition[]>>;
  allPRs: PurchaseRequisition[];
  setAllPRs: React.Dispatch<React.SetStateAction<PurchaseRequisition[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  filters: ApprovalFilters;
  setFilters: React.Dispatch<React.SetStateAction<ApprovalFilters>>;
  selectedPR: PurchaseRequisition | null;
  setSelectedPR: React.Dispatch<React.SetStateAction<PurchaseRequisition | null>>;
  showApprovalModal: boolean;
  setShowApprovalModal: React.Dispatch<React.SetStateAction<boolean>>;
  showPRDetails: boolean;
  setShowPRDetails: React.Dispatch<React.SetStateAction<boolean>>;
  expandedPRs: Set<string>;
  setExpandedPRs: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeTab: 'queue' | 'all';
  setActiveTab: React.Dispatch<React.SetStateAction<'queue' | 'all'>>;
}

export function ProcurementQueue() {
  const { isAuthenticated } = useAuthStore();
  const [approvalQueue, setApprovalQueue] = useState<PurchaseRequisition[]>([]);
  const [allPRs, setAllPRs] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApprovalFilters>({
    level: 'L1',
    status: 'pending',
    search: '',
    dateRange: 'all',
  });
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPRDetails, setShowPRDetails] = useState(false);
  const [expandedPRs, setExpandedPRs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');

  // Wrap the entire component with permission guard
  return (
    <PermissionGuard 
      requiredPermissions={[SupplyChainPermission.READ_PR]}
      showLoadingState={true}
      showErrorState={true}
    >
      <ProcurementQueueContent 
        isAuthenticated={isAuthenticated}
        approvalQueue={approvalQueue}
        setApprovalQueue={setApprovalQueue}
        allPRs={allPRs}
        setAllPRs={setAllPRs}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        filters={filters}
        setFilters={setFilters}
        selectedPR={selectedPR}
        setSelectedPR={setSelectedPR}
        showApprovalModal={showApprovalModal}
        setShowApprovalModal={setShowApprovalModal}
        showPRDetails={showPRDetails}
        setShowPRDetails={setShowPRDetails}
        expandedPRs={expandedPRs}
        setExpandedPRs={setExpandedPRs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </PermissionGuard>
  );
}

function ProcurementQueueContent({
  isAuthenticated,
  approvalQueue,
  setApprovalQueue,
  allPRs,
  setAllPRs,
  loading,
  setLoading,
  error,
  setError,
  filters,
  setFilters,
  selectedPR,
  setSelectedPR,
  showApprovalModal,
  setShowApprovalModal,
  showPRDetails,
  setShowPRDetails,
  expandedPRs,
  setExpandedPRs,
  activeTab,
  setActiveTab,
}: ProcurementQueueContentProps) {

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const [queueRes, allPRsRes] = await Promise.all([
        apiFetch(`/supply-chain/procurement-workflow/approval-queue?level=${filters.level}`),
        apiFetch(`/supply-chain/procurement-workflow/requisitions?status=${filters.status}&limit=100`)
      ]);

      if (queueRes.ok) {
        setApprovalQueue(await queueRes.json());
      }

      if (allPRsRes.ok) {
        const allPRsData = await allPRsRes.json();
        setAllPRs(allPRsData.data || []);
      }

    } catch (err) {
      console.error('Failed to fetch procurement data:', err);
      setError('Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  }, [filters.level, filters.status, isAuthenticated, setAllPRs, setApprovalQueue, setError, setLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproval = async (prId: string, approved: boolean, comments?: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiFetch(`/supply-chain/procurement-workflow/requisitions/${prId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved, comments }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setShowApprovalModal(false);
        setSelectedPR(null);
      } else {
        throw new Error('Failed to process approval');
      }
    } catch (err) {
      console.error('Failed to process approval:', err);
      setError('Failed to process approval');
    }
  };

  const togglePRExpansion = (prId: string) => {
    const newExpanded = new Set(expandedPRs);
    if (newExpanded.has(prId)) {
      newExpanded.delete(prId);
    } else {
      newExpanded.add(prId);
    }
    setExpandedPRs(newExpanded);
  };

  const filteredPRs = activeTab === 'queue' ? approvalQueue : allPRs.filter(pr => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return pr.pr_number.toLowerCase().includes(searchLower) ||
             pr.justification?.toLowerCase().includes(searchLower) ||
             pr.lines.some(line => 
               line.product.name.toLowerCase().includes(searchLower) ||
               line.product.sku.toLowerCase().includes(searchLower)
             );
    }
    return true;
  });

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
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-brand-navy rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading mb-2 flex items-center gap-3">
            <ShoppingCart className="text-brand-gold" size={36} />
            Procurement Queue
          </h1>
          <p className="text-slate-400 text-lg">
            Review and approve purchase requisitions
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-5 rounded-full -mr-16 -mt-16 blur-[80px]"></div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Pending L1"
          value={approvalQueue.filter(pr => pr.status === 'PENDING_L1').length}
          subtitle="Awaiting approval"
          icon={Clock}
          color="orange"
        />
        <SummaryCard
          title="Pending L2"
          value={approvalQueue.filter(pr => pr.status === 'PENDING_L2').length}
          subtitle="Senior approval"
          icon={AlertTriangle}
          color="yellow"
        />
        <SummaryCard
          title="Approved Today"
          value={allPRs.filter(pr => 
            pr.status === 'APPROVED' && 
            new Date(pr.updated_at).toDateString() === new Date().toDateString()
          ).length}
          subtitle="Processed today"
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="Total Value"
          value={`R${approvalQueue.reduce((sum, pr) => sum + pr.totalEstimatedCost, 0).toLocaleString()}`}
          subtitle="Pending approval"
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approval Queue ({approvalQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All PRs ({allPRs.length})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search PRs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
            </div>

            {activeTab === 'queue' && (
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as 'L1' | 'L2' }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              >
                <option value="L1">L1 Approvals</option>
                <option value="L2">L2 Approvals</option>
              </select>
            )}

            <button
              onClick={fetchData}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PR List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredPRs.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No purchase requisitions found</h3>
            <p className="text-slate-500">
              {activeTab === 'queue' 
                ? 'No PRs pending approval at this level' 
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredPRs.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                expanded={expandedPRs.has(pr.id)}
                onToggleExpand={() => togglePRExpansion(pr.id)}
                onViewDetails={() => {
                  setSelectedPR(pr);
                  setShowPRDetails(true);
                }}
                onApprove={() => {
                  setSelectedPR(pr);
                  setShowApprovalModal(true);
                }}
                showApprovalActions={activeTab === 'queue'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showApprovalModal && selectedPR && (
        <ApprovalModal
          pr={selectedPR}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedPR(null);
          }}
          onApprove={(approved, comments) => handleApproval(selectedPR.id, approved, comments)}
        />
      )}

      {showPRDetails && selectedPR && (
        <PRDetailsModal
          pr={selectedPR}
          onClose={() => {
            setShowPRDetails(false);
            setSelectedPR(null);
          }}
        />
      )}
    </div>
  );
}
interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'yellow';
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
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
      <div className="text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

interface PRCardProps {
  pr: PurchaseRequisition;
  expanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onApprove: () => void;
  showApprovalActions: boolean;
}

function PRCard({ pr, expanded, onToggleExpand, onViewDetails, onApprove, showApprovalActions }: PRCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (totalCost: number) => {
    if (totalCost > 100000) return 'text-red-600';
    if (totalCost > 50000) return 'text-orange-600';
    if (totalCost > 10000) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header Row */}
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <span className="font-semibold text-lg text-slate-900">{pr.pr_number}</span>
            </button>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
              {getStatusIcon(pr.status)}
              {pr.status.replace('_', ' ')}
            </span>

            <span className={`text-sm font-medium ${getUrgencyColor(pr.totalEstimatedCost)}`}>
              R{pr.totalEstimatedCost.toLocaleString()}
            </span>
          </div>

          {/* Summary Row */}
          <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(pr.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package size={14} />
              <span>{pr.lines.length} items</span>
            </div>
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>Requester: {pr.requester_id}</span>
            </div>
          </div>

          {/* Justification */}
          {pr.justification && (
            <div className="mb-3">
              <p className="text-sm text-slate-700 italic">&ldquo;{pr.justification}&rdquo;</p>
            </div>
          )}

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="font-medium text-slate-900 mb-3">Requested Items</h4>
              <div className="space-y-2">
                {pr.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{line.product.name}</div>
                      <div className="text-sm text-slate-600">
                        SKU: {line.product.sku} • Category: {line.product.category || 'General'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900">
                        {line.quantity} {line.product.unit_of_measure}
                      </div>
                      {line.estimated_cost && (
                        <div className="text-sm text-slate-600">
                          R{line.estimated_cost.toLocaleString()} each
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onViewDetails}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>

          {showApprovalActions && (pr.status === 'PENDING_L1' || pr.status === 'PENDING_L2') && (
            <ConditionalRender
              permissions={[
                pr.status === 'PENDING_L1' ? SupplyChainPermission.APPROVE_PR_L1 : SupplyChainPermission.APPROVE_PR_L2
              ]}
            >
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                Review
              </button>
            </ConditionalRender>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApprovalModalProps {
  pr: PurchaseRequisition;
  onClose: () => void;
  onApprove: (approved: boolean, comments?: string) => void;
}

function ApprovalModal({ pr, onClose, onApprove }: ApprovalModalProps) {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (decision) {
      onApprove(decision === 'approve', comments || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Review Purchase Requisition
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* PR Summary */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">PR Number:</span>
              <span className="ml-2 text-slate-900">{pr.pr_number}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Total Value:</span>
              <span className="ml-2 text-slate-900">R{pr.totalEstimatedCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Items:</span>
              <span className="ml-2 text-slate-900">{pr.lines.length}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(pr.status)}`}>
                {pr.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          {pr.justification && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="font-medium text-slate-700">Justification:</span>
              <p className="mt-1 text-slate-900">&ldquo;{pr.justification}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Decision Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Decision</label>
          <div className="flex gap-3">
            <button
              onClick={() => setDecision('approve')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                decision === 'approve'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp size={16} />
              Approve
            </button>
            <button
              onClick={() => setDecision('reject')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                decision === 'reject'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ThumbsDown size={16} />
              Reject
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Comments {decision === 'reject' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={decision === 'approve' ? 'Optional approval comments...' : 'Please provide reason for rejection...'}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || (decision === 'reject' && !comments.trim())}
            className="px-6 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit {decision === 'approve' ? 'Approval' : 'Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PRDetailsModalProps {
  pr: PurchaseRequisition;
  onClose: () => void;
}

function PRDetailsModal({ pr, onClose }: PRDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Purchase Requisition Details
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* PR Header */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">PR Number:</span>
                  <span className="ml-2 font-medium">{pr.pr_number}</span>
                </div>
                <div>
                  <span className="text-slate-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(pr.status)}`}>
                    {pr.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Created:</span>
                  <span className="ml-2">{new Date(pr.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2">Financial</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Total Value:</span>
                  <span className="ml-2 font-medium text-lg">R{pr.totalEstimatedCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-600">Items:</span>
                  <span className="ml-2">{pr.lines.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2">Requester</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">User ID:</span>
                  <span className="ml-2">{pr.requester_id}</span>
                </div>
                {pr.department_id && (
                  <div>
                    <span className="text-slate-600">Department:</span>
                    <span className="ml-2">{pr.department_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {pr.justification && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-medium text-slate-900 mb-2">Justification</h4>
              <p className="text-slate-700">{pr.justification}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h4 className="font-medium text-slate-900 mb-4">Requested Items</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-900">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-900">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-900">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-900">Quantity</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-900">Est. Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pr.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{line.product.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{line.product.sku}</td>
                    <td className="px-4 py-3 text-slate-600">{line.product.category || 'General'}</td>
                    <td className="px-4 py-3 text-right">
                      {line.quantity} {line.product.unit_of_measure}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {line.estimated_cost ? `R${line.estimated_cost.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {line.estimated_cost 
                        ? `R${(line.estimated_cost * line.quantity).toLocaleString()}`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            className="px-6 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
