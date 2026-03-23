"use client";

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  PermissionGuard, 
  ActionGuard
} from '@/components/common/PermissionGuard';
import { SupplyChainPermission } from '@/hooks/useSupplyChainPermissions';
import { 
  X, 
  Package, 
  MapPin, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Calculator,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';

interface StockLevel {
  id: string;
  quantity: number;
  reorder_point?: number;
  eoq?: number;
  location: {
    id: string;
    name: string;
  };
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: string;
  stock_levels: StockLevel[];
}

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}

type AdjustmentType = 'adjust' | 'transfer' | 'reorder';

interface AdjustmentData {
  type: AdjustmentType;
  location_id: string;
  quantity_change?: number;
  reason_code: string;
  notes?: string;
  // Transfer specific
  from_location_id?: string;
  to_location_id?: string;
  transfer_quantity?: number;
  // Reorder specific
  reorder_point?: number;
  eoq?: number;
}

interface StockAdjustmentModalContentProps {
  product: Product;
  onClose: () => void;
  onSave: () => void;
  isAuthenticated: boolean;
  adjustmentType: AdjustmentType;
  setAdjustmentType: React.Dispatch<React.SetStateAction<AdjustmentType>>;
  adjustmentData: AdjustmentData;
  setAdjustmentData: React.Dispatch<React.SetStateAction<AdjustmentData>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  success: boolean;
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLocation?: StockLevel;
  currentStock: number;
}

const REASON_CODES = {
  adjust: [
    { value: 'CYCLE_COUNT', label: 'Cycle Count Adjustment' },
    { value: 'DAMAGE', label: 'Damaged Goods' },
    { value: 'THEFT', label: 'Theft/Loss' },
    { value: 'EXPIRY', label: 'Expired Products' },
    { value: 'FOUND', label: 'Found Stock' },
    { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
    { value: 'SYSTEM_CORRECTION', label: 'System Correction' },
  ],
  transfer: [
    { value: 'STOCK_TRANSFER', label: 'Stock Transfer' },
    { value: 'REBALANCING', label: 'Location Rebalancing' },
    { value: 'CONSOLIDATION', label: 'Stock Consolidation' },
  ],
};

export function StockAdjustmentModal({ product, onClose, onSave }: StockAdjustmentModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('adjust');
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData>({
    type: 'adjust',
    location_id: product.stock_levels[0]?.location.id || '',
    reason_code: 'MANUAL_ADJUSTMENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedLocation = product.stock_levels.find(sl => sl.location.id === adjustmentData.location_id);
  const currentStock = selectedLocation?.quantity || 0;

  // Determine required permission based on adjustment type
  const getRequiredPermission = () => {
    switch (adjustmentType) {
      case 'adjust':
        return SupplyChainPermission.ADJUST_INVENTORY;
      case 'transfer':
        return SupplyChainPermission.TRANSFER_INVENTORY;
      case 'reorder':
        return SupplyChainPermission.ADJUST_INVENTORY;
      default:
        return SupplyChainPermission.ADJUST_INVENTORY;
    }
  };

  // Wrap the modal content with permission guard
  return (
    <PermissionGuard 
      requiredPermissions={[getRequiredPermission()]}
      showLoadingState={false}
      showErrorState={false}
      fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Access Denied
            </h3>
            <p className="text-slate-600 mb-4">
              You don&apos;t have permission to perform stock adjustments.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <StockAdjustmentModalContent 
        product={product}
        onClose={onClose}
        onSave={onSave}
        isAuthenticated={isAuthenticated}
        adjustmentType={adjustmentType}
        setAdjustmentType={setAdjustmentType}
        adjustmentData={adjustmentData}
        setAdjustmentData={setAdjustmentData}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        selectedLocation={selectedLocation}
        currentStock={currentStock}
      />
    </PermissionGuard>
  );
}

function StockAdjustmentModalContent({
  product,
  onClose,
  onSave,
  isAuthenticated,
  adjustmentType,
  setAdjustmentType,
  adjustmentData,
  setAdjustmentData,
  loading,
  setLoading,
  error,
  setError,
  success,
  setSuccess,
  selectedLocation,
  currentStock,
}: StockAdjustmentModalContentProps) {

  const handleSubmit = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      let payload = {};

      switch (adjustmentType) {
        case 'adjust':
          endpoint = '/supply-chain/inventory/adjust';
          payload = {
            product_id: product.id,
            location_id: adjustmentData.location_id,
            quantity_change: adjustmentData.quantity_change,
            reason_code: adjustmentData.reason_code,
          };
          break;

        case 'transfer':
          endpoint = '/supply-chain/inventory/transfer';
          payload = {
            product_id: product.id,
            from_location_id: adjustmentData.from_location_id,
            to_location_id: adjustmentData.to_location_id,
            quantity: adjustmentData.transfer_quantity,
            reference_id: `TRANSFER-${Date.now()}`,
          };
          break;

        case 'reorder':
          endpoint = '/supply-chain/inventory/reorder-point';
          payload = {
            product_id: product.id,
            location_id: adjustmentData.location_id,
            reorder_point: adjustmentData.reorder_point,
            eoq: adjustmentData.eoq,
          };
          break;
      }

      const response = await apiFetch(endpoint, {
        method: adjustmentType === 'reorder' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process stock adjustment');
      }

      setSuccess(true);
      setTimeout(() => {
        onSave();
      }, 1500);

    } catch (err) {
      console.error('Stock adjustment failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process stock adjustment');
    } finally {
      setLoading(false);
    }
  };

  const isValidAdjustment = () => {
    switch (adjustmentType) {
      case 'adjust':
        return adjustmentData.quantity_change !== undefined && 
               adjustmentData.quantity_change !== 0 && 
               adjustmentData.location_id && 
               adjustmentData.reason_code;
      
      case 'transfer':
        return adjustmentData.from_location_id && 
               adjustmentData.to_location_id && 
               adjustmentData.from_location_id !== adjustmentData.to_location_id &&
               adjustmentData.transfer_quantity && 
               adjustmentData.transfer_quantity > 0;
      
      case 'reorder':
        return adjustmentData.location_id && 
               adjustmentData.reorder_point !== undefined && 
               adjustmentData.reorder_point >= 0;
      
      default:
        return false;
    }
  };

  const getNewStockLevel = () => {
    if (adjustmentType === 'adjust' && adjustmentData.quantity_change !== undefined) {
      return currentStock + adjustmentData.quantity_change;
    }
    return currentStock;
  };

  const getStockLevelColor = (level: number) => {
    const reorderPoint = selectedLocation?.reorder_point || 0;
    if (level <= 0) return 'text-red-600';
    if (level <= reorderPoint) return 'text-orange-600';
    return 'text-green-600';
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Stock Adjustment Complete
          </h3>
          <p className="text-slate-600">
            {adjustmentType === 'adjust' && 'Stock levels have been updated successfully.'}
            {adjustmentType === 'transfer' && 'Stock transfer has been completed successfully.'}
            {adjustmentType === 'reorder' && 'Reorder settings have been updated successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="text-brand-gold" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Stock Management</h3>
              <p className="text-slate-600">{product.name} ({product.sku})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Current Stock Overview */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Current Stock Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.stock_levels.map((stockLevel: StockLevel) => (
                <div key={stockLevel.id} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-900">{stockLevel.location.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {stockLevel.quantity} {product.unit_of_measure}
                  </div>
                  {stockLevel.reorder_point && (
                    <div className="text-sm text-slate-600">
                      Reorder at: {stockLevel.reorder_point} {product.unit_of_measure}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adjustment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Adjustment Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ActionGuard permission={SupplyChainPermission.ADJUST_INVENTORY}>
                <button
                  onClick={() => {
                    setAdjustmentType('adjust');
                    setAdjustmentData((prev: AdjustmentData) => ({ ...prev, type: 'adjust' }));
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    adjustmentType === 'adjust'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calculator size={20} />
                  <div className="text-left">
                    <div className="font-medium">Stock Adjustment</div>
                    <div className="text-sm opacity-80">Increase or decrease stock</div>
                  </div>
                </button>
              </ActionGuard>

              <ActionGuard permission={SupplyChainPermission.TRANSFER_INVENTORY}>
                <button
                  onClick={() => {
                    setAdjustmentType('transfer');
                    setAdjustmentData((prev: AdjustmentData) => ({ ...prev, type: 'transfer' }));
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    adjustmentType === 'transfer'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowRightLeft size={20} />
                  <div className="text-left">
                    <div className="font-medium">Stock Transfer</div>
                    <div className="text-sm opacity-80">Move between locations</div>
                  </div>
                </button>
              </ActionGuard>

              <ActionGuard permission={SupplyChainPermission.ADJUST_INVENTORY}>
                <button
                  onClick={() => {
                    setAdjustmentType('reorder');
                    setAdjustmentData((prev: AdjustmentData) => ({ ...prev, type: 'reorder' }));
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    adjustmentType === 'reorder'
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw size={20} />
                  <div className="text-left">
                    <div className="font-medium">Reorder Settings</div>
                    <div className="text-sm opacity-80">Update reorder points</div>
                  </div>
                </button>
              </ActionGuard>
            </div>
          </div>

          {/* Adjustment Forms */}
          {adjustmentType === 'adjust' && (
            <AdjustmentForm
              product={product}
              adjustmentData={adjustmentData}
              setAdjustmentData={setAdjustmentData}
              currentStock={currentStock}
              newStockLevel={getNewStockLevel()}
              stockLevelColor={getStockLevelColor(getNewStockLevel())}
            />
          )}

          {adjustmentType === 'transfer' && (
            <TransferForm
              product={product}
              adjustmentData={adjustmentData}
              setAdjustmentData={setAdjustmentData}
            />
          )}

          {adjustmentType === 'reorder' && (
            <ReorderForm
              product={product}
              adjustmentData={adjustmentData}
              setAdjustmentData={setAdjustmentData}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValidAdjustment() || loading}
              className="px-6 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Clock size={16} className="animate-spin" />}
              {adjustmentType === 'adjust' && 'Apply Adjustment'}
              {adjustmentType === 'transfer' && 'Execute Transfer'}
              {adjustmentType === 'reorder' && 'Update Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
interface AdjustmentFormProps {
  product: Product;
  adjustmentData: AdjustmentData;
  setAdjustmentData: (data: AdjustmentData) => void;
  currentStock: number;
  newStockLevel: number;
  stockLevelColor: string;
}

function AdjustmentForm({ 
  product, 
  adjustmentData, 
  setAdjustmentData, 
  currentStock, 
  newStockLevel, 
  stockLevelColor 
}: AdjustmentFormProps) {
  const handleQuantityChange = (change: number) => {
    const newChange = (adjustmentData.quantity_change || 0) + change;
    setAdjustmentData({ ...adjustmentData, quantity_change: newChange });
  };

  const handleDirectQuantityChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    setAdjustmentData({ ...adjustmentData, quantity_change: numValue });
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
        <select
          value={adjustmentData.location_id}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, location_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
        >
          {product.stock_levels.map((stockLevel) => (
            <option key={stockLevel.location.id} value={stockLevel.location.id}>
              {stockLevel.location.name} (Current: {stockLevel.quantity} {product.unit_of_measure})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Adjustment */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Quantity Adjustment</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleQuantityChange(-10)}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <TrendingDown size={16} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="number"
              value={adjustmentData.quantity_change || ''}
              onChange={(e) => handleDirectQuantityChange(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent text-center text-lg font-medium"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              {product.unit_of_measure}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <TrendingUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleQuantityChange(10)}
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Stock Level Preview */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Current Stock:</span>
            <span className="font-medium">{currentStock} {product.unit_of_measure}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600">Adjustment:</span>
            <span className={`font-medium ${
              (adjustmentData.quantity_change || 0) > 0 ? 'text-green-600' : 
              (adjustmentData.quantity_change || 0) < 0 ? 'text-red-600' : 'text-slate-600'
            }`}>
              {(adjustmentData.quantity_change || 0) > 0 ? '+' : ''}{adjustmentData.quantity_change || 0} {product.unit_of_measure}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-slate-200">
            <span className="text-slate-600">New Stock Level:</span>
            <span className={`font-bold ${stockLevelColor}`}>
              {newStockLevel} {product.unit_of_measure}
            </span>
          </div>
        </div>
      </div>

      {/* Reason Code */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
        <select
          value={adjustmentData.reason_code}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, reason_code: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
        >
          {REASON_CODES.adjust.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
        <textarea
          value={adjustmentData.notes || ''}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
          placeholder="Additional notes about this adjustment..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  );
}

interface TransferFormProps {
  product: Product;
  adjustmentData: AdjustmentData;
  setAdjustmentData: (data: AdjustmentData) => void;
}

function TransferForm({ product, adjustmentData, setAdjustmentData }: TransferFormProps) {
  const fromLocation = product.stock_levels.find(sl => sl.location.id === adjustmentData.from_location_id);
  const toLocation = product.stock_levels.find(sl => sl.location.id === adjustmentData.to_location_id);
  
  const maxTransferQuantity = fromLocation?.quantity || 0;
  const isValidTransfer = adjustmentData.transfer_quantity && 
                         adjustmentData.transfer_quantity <= maxTransferQuantity &&
                         adjustmentData.from_location_id !== adjustmentData.to_location_id;

  return (
    <div className="space-y-6">
      {/* From Location */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">From Location</label>
        <select
          value={adjustmentData.from_location_id || ''}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, from_location_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
        >
          <option value="">Select source location</option>
          {product.stock_levels.filter(sl => sl.quantity > 0).map((stockLevel) => (
            <option key={stockLevel.location.id} value={stockLevel.location.id}>
              {stockLevel.location.name} (Available: {stockLevel.quantity} {product.unit_of_measure})
            </option>
          ))}
        </select>
      </div>

      {/* To Location */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">To Location</label>
        <select
          value={adjustmentData.to_location_id || ''}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, to_location_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
        >
          <option value="">Select destination location</option>
          {product.stock_levels
            .filter(sl => sl.location.id !== adjustmentData.from_location_id)
            .map((stockLevel) => (
              <option key={stockLevel.location.id} value={stockLevel.location.id}>
                {stockLevel.location.name} (Current: {stockLevel.quantity} {product.unit_of_measure})
              </option>
            ))}
        </select>
      </div>

      {/* Transfer Quantity */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Quantity</label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max={maxTransferQuantity}
            value={adjustmentData.transfer_quantity || ''}
            onChange={(e) => setAdjustmentData({ 
              ...adjustmentData, 
              transfer_quantity: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="Enter quantity to transfer"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
            {product.unit_of_measure}
          </span>
        </div>
        {fromLocation && (
          <p className="mt-1 text-sm text-slate-600">
            Maximum available: {maxTransferQuantity} {product.unit_of_measure}
          </p>
        )}
      </div>

      {/* Transfer Preview */}
      {isValidTransfer && fromLocation && toLocation && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Transfer Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">{fromLocation.location.name}:</span>
              <span className="font-medium text-blue-900">
                {fromLocation.quantity} → {fromLocation.quantity - (adjustmentData.transfer_quantity || 0)} {product.unit_of_measure}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">{toLocation.location.name}:</span>
              <span className="font-medium text-blue-900">
                {toLocation.quantity} → {toLocation.quantity + (adjustmentData.transfer_quantity || 0)} {product.unit_of_measure}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Notes (Optional)</label>
        <textarea
          value={adjustmentData.notes || ''}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
          placeholder="Reason for transfer, special instructions, etc..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  );
}

interface ReorderFormProps {
  product: Product;
  adjustmentData: AdjustmentData;
  setAdjustmentData: (data: AdjustmentData) => void;
}

function ReorderForm({ product, adjustmentData, setAdjustmentData }: ReorderFormProps) {
  const selectedLocation = product.stock_levels.find(sl => sl.location.id === adjustmentData.location_id);
  const currentReorderPoint = selectedLocation?.reorder_point || 0;
  const currentEOQ = selectedLocation?.eoq || 0;

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
        <select
          value={adjustmentData.location_id}
          onChange={(e) => setAdjustmentData({ ...adjustmentData, location_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
        >
          {product.stock_levels.map((stockLevel) => (
            <option key={stockLevel.location.id} value={stockLevel.location.id}>
              {stockLevel.location.name} (Current Stock: {stockLevel.quantity} {product.unit_of_measure})
            </option>
          ))}
        </select>
      </div>

      {/* Current Settings Display */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-900 mb-3">Current Settings</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Reorder Point:</span>
            <span className="ml-2 font-medium">{currentReorderPoint} {product.unit_of_measure}</span>
          </div>
          <div>
            <span className="text-slate-600">Economic Order Quantity:</span>
            <span className="ml-2 font-medium">{currentEOQ} {product.unit_of_measure}</span>
          </div>
        </div>
      </div>

      {/* Reorder Point */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Reorder Point
          <span className="text-slate-500 font-normal ml-1">(Minimum stock level before reordering)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            value={adjustmentData.reorder_point !== undefined ? adjustmentData.reorder_point : currentReorderPoint}
            onChange={(e) => setAdjustmentData({ 
              ...adjustmentData, 
              reorder_point: e.target.value ? parseInt(e.target.value) : 0 
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
            {product.unit_of_measure}
          </span>
        </div>
      </div>

      {/* Economic Order Quantity */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Economic Order Quantity (EOQ)
          <span className="text-slate-500 font-normal ml-1">(Optimal order quantity)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            value={adjustmentData.eoq !== undefined ? adjustmentData.eoq : currentEOQ}
            onChange={(e) => setAdjustmentData({ 
              ...adjustmentData, 
              eoq: e.target.value ? parseInt(e.target.value) : 0 
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
            {product.unit_of_measure}
          </span>
        </div>
      </div>

      {/* Reorder Settings Preview */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-3">Updated Settings Preview</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-700">Reorder Point:</span>
            <span className="font-medium text-purple-900">
              {adjustmentData.reorder_point !== undefined ? adjustmentData.reorder_point : currentReorderPoint} {product.unit_of_measure}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">EOQ:</span>
            <span className="font-medium text-purple-900">
              {adjustmentData.eoq !== undefined ? adjustmentData.eoq : currentEOQ} {product.unit_of_measure}
            </span>
          </div>
          {selectedLocation && (
            <div className="pt-2 border-t border-purple-200">
              <div className="flex justify-between">
                <span className="text-purple-700">Current Stock:</span>
                <span className={`font-medium ${
                  selectedLocation.quantity <= (adjustmentData.reorder_point !== undefined ? adjustmentData.reorder_point : currentReorderPoint)
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {selectedLocation.quantity} {product.unit_of_measure}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
