'use client';

import React, { useState, useCallback } from 'react';
import { GanttChart } from './GanttChart';
import { AlertTriangle, X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RAGStatus = 'GREEN' | 'AMBER' | 'RED';

interface ProjectBar {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  ragStatus: RAGStatus;
  progressPercent: number;
  forecastEndDate?: Date;
  baselineStartDate?: Date;
  baselineEndDate?: Date;
}

interface DependencyEdge {
  fromProjectId: string;
  toProjectId: string;
  type: 'FTS' | 'STS' | 'FTF';
  lagDays: number;
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  date: Date;
  achievedDate?: Date;
  overdue: boolean;
}

interface RAIDFlag {
  id: string;
  projectId: string;
  type: 'RISK' | 'ACTION' | 'ISSUE' | 'DECISION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  loggedDate: Date;
  title: string;
}

interface CascadeChange {
  projectId: string;
  projectName: string;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
  shiftDays: number;
}

interface ConstraintViolation {
  projectId: string;
  projectName: string;
  violationType: 'DEPENDENCY' | 'GATE' | 'RESOURCE' | 'BASELINE';
  description: string;
  severity: 'WARNING' | 'ERROR';
}

interface GanttChartWithDragProps {
  projects: ProjectBar[];
  milestones: Milestone[];
  raidFlags: RAIDFlag[];
  dependencies: DependencyEdge[];
  timeScale?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  showBaseline?: boolean;
  showDependencies?: boolean;
  onProjectClick?: (projectId: string) => void;
  onProjectReschedule?: (
    projectId: string,
    newStart: Date,
    newEnd: Date,
    cascade: CascadeChange[],
  ) => void;
}

// ============================================================================
// CONSTRAINT VIOLATION WARNING MODAL
// ============================================================================

interface ConstraintViolationModalProps {
  violations: ConstraintViolation[];
  affectedProjects: Array<{
    projectId: string;
    projectName: string;
    originalDates: { start: Date; end: Date };
    newDates: { start: Date; end: Date };
  }>;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConstraintViolationModal({
  violations,
  affectedProjects,
  onConfirm,
  onCancel,
}: ConstraintViolationModalProps) {
  const errorCount = violations.filter(v => v.severity === 'ERROR').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-red-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Constraint Violation Warning
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Violations Summary */}
          <div className="grid grid-cols-2 gap-4">
            {errorCount > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-2xl font-bold text-red-700">{errorCount}</div>
                <div className="text-sm text-red-700 font-semibold">Blocking Issues</div>
              </div>
            )}
            {warningCount > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
                <div className="text-sm text-amber-700 font-semibold">Warnings</div>
              </div>
            )}
          </div>

          {/* Violations List */}
          {violations.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                Detected Violations
              </h3>
              <div className="space-y-2">
                {violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-3 ${
                      violation.severity === 'ERROR'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <AlertTriangle
                      size={18}
                      className={`mt-0.5 ${
                        violation.severity === 'ERROR' ? 'text-red-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                            violation.severity === 'ERROR'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {violation.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {violation.violationType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">{violation.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected Projects */}
          {affectedProjects.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                Cascade Impact ({affectedProjects.length} projects)
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {affectedProjects.map((affected) => (
                  <div
                    key={affected.projectId}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-sm font-semibold text-slate-900 mb-2">
                      {affected.projectName}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Original:</span>
                        <div className="font-medium text-slate-700">
                          {formatDate(affected.originalDates.start)} → {formatDate(affected.originalDates.end)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">New:</span>
                        <div className="font-medium text-red-700">
                          {formatDate(affected.newDates.start)} → {formatDate(affected.newDates.end)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This change will automatically cascade to {affectedProjects.length}{' '}
              downstream project{affectedProjects.length !== 1 ? 's' : ''} based on dependency relationships.
              All affected projects will be notified of the schedule change.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel Reschedule
          </Button>
          <Button
            onClick={onConfirm}
            className={`${
              errorCount > 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-navy hover:bg-brand-navy/90'
            }`}
            disabled={errorCount > 0}
          >
            {errorCount > 0 ? 'Cannot Proceed (Blocking Issues)' : 'Confirm Reschedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UNDO NOTIFICATION COMPONENT
// ============================================================================

interface UndoNotificationProps {
  message: string;
  onUndo: () => void;
  timeRemaining: number;
}

function UndoNotification({ message, onUndo, timeRemaining }: UndoNotificationProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <Undo2 size={20} className="text-green-400" />
        <div>
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Press Ctrl+Z or click Undo within {timeRemaining}s
          </p>
        </div>
      </div>
      <button
        onClick={onUndo}
        className="px-4 py-2 bg-white text-slate-900 rounded-md text-sm font-semibold hover:bg-slate-100 transition-colors"
      >
        Undo
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT WITH DRAG-TO-RESCHEDULE
// ============================================================================

export function GanttChartWithDrag({
  projects,
  milestones,
  raidFlags,
  dependencies,
  timeScale = 'MONTH',
  showBaseline = true,
  showDependencies = true,
  onProjectClick,
  onProjectReschedule,
}: GanttChartWithDragProps) {
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [pendingReschedule, setPendingReschedule] = useState<{
    projectId: string;
    newStart: Date;
    newEnd: Date;
    cascade: CascadeChange[];
    violations: ConstraintViolation[];
  } | null>(null);
  const [undoStack, setUndoStack] = useState<Array<{
    projectId: string;
    originalStart: Date;
    originalEnd: Date;
    cascade: CascadeChange[];
  }>>([]);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState(30);

  // Execute the reschedule
  const executeReschedule = useCallback((
    projectId: string,
    newStart: Date,
    newEnd: Date,
    cascade: CascadeChange[]
  ) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Save to undo stack
    setUndoStack(prev => [...prev, {
      projectId,
      originalStart: project.startDate,
      originalEnd: project.endDate,
      cascade,
    }]);

    // Call parent handler
    onProjectReschedule?.(projectId, newStart, newEnd, cascade);

    // Show undo notification
    setShowUndoNotification(true);
    setUndoTimeRemaining(30);

    // Start countdown
    const timer = setInterval(() => {
      setUndoTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowUndoNotification(false);
          setUndoStack(prev => prev.slice(0, -1)); // Remove from undo stack
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onProjectReschedule, projects]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const lastChange = undoStack[undoStack.length - 1];
    if (!lastChange) return;

    // Revert to original dates
    executeReschedule(
      lastChange.projectId,
      lastChange.originalStart,
      lastChange.originalEnd,
      [] // Don't cascade on undo (or could implement reverse cascade)
    );

    // Remove from undo stack
    setUndoStack(prev => prev.slice(0, -1));
    setShowUndoNotification(false);
  }, [executeReschedule, undoStack]);

  // Keyboard shortcut for undo (Ctrl+Z)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoStack.length > 0 && !showViolationModal) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, showViolationModal, handleUndo]);

  return (
    <>
      {/* Base Gantt Chart */}
      <GanttChart
        projects={projects}
        milestones={milestones}
        raidFlags={raidFlags}
        dependencies={dependencies}
        timeScale={timeScale}
        showBaseline={showBaseline}
        showDependencies={showDependencies}
        onProjectClick={onProjectClick}
      />

      {/* Constraint Violation Modal */}
      {showViolationModal && pendingReschedule && (
        <ConstraintViolationModal
          violations={pendingReschedule.violations}
          affectedProjects={pendingReschedule.cascade.map(c => ({
            projectId: c.projectId,
            projectName: c.projectName,
            originalDates: { start: c.originalStart, end: c.originalEnd },
            newDates: { start: c.newStart, end: c.newEnd },
          }))}
          onConfirm={() => {
            executeReschedule(
              pendingReschedule.projectId,
              pendingReschedule.newStart,
              pendingReschedule.newEnd,
              pendingReschedule.cascade
            );
            setShowViolationModal(false);
            setPendingReschedule(null);
          }}
          onCancel={() => {
            setShowViolationModal(false);
            setPendingReschedule(null);
          }}
        />
      )}

      {/* Undo Notification */}
      {showUndoNotification && (
        <UndoNotification
          message="Project rescheduled successfully"
          onUndo={handleUndo}
          timeRemaining={undoTimeRemaining}
        />
      )}
    </>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
