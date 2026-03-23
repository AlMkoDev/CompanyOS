'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  AlertCircle,
  Paperclip,
  MessageSquare,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: Date;
  status: TaskStatus;
  priority: Priority;
  completedAt?: Date;
  blockedBy?: string;
  attachments?: number;
  comments?: number;
  cycleTimeDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  wipLimit?: number;
}

export interface KanbanBoardProps {
  tasks: ProjectTask[];
  onTaskClick?: (task: ProjectTask) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: (status: TaskStatus) => void;
  showWipLimits?: boolean;
  allowDragDrop?: boolean;
  compact?: boolean;
}

// ============================================================================
// COLUMN CONFIGURATIONS
// ============================================================================

const COLUMN_CONFIGS: Record<TaskStatus, ColumnConfig> = {
  TODO: {
    id: 'TODO',
    title: 'To Do',
    color: '#64748b',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    icon: <Calendar size={16} />,
    wipLimit: undefined,
  },
  IN_PROGRESS: {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: <TrendingUp size={16} />,
    wipLimit: 6,
  },
  IN_REVIEW: {
    id: 'IN_REVIEW',
    title: 'In Review',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    borderColor: '#c4b5fd',
    icon: <User size={16} />,
    wipLimit: 4,
  },
  BLOCKED: {
    id: 'BLOCKED',
    title: 'Blocked',
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: <AlertCircle size={16} />,
    wipLimit: undefined,
  },
  DONE: {
    id: 'DONE',
    title: 'Done',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: <CheckCircle size={16} />,
    wipLimit: undefined,
  },
};

// ============================================================================
// PRIORITY CONFIGURATION
// ============================================================================

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: '#dc2626', bg: '#fee2e2', label: 'Critical' },
  HIGH: { color: '#ea580c', bg: '#ffedd5', label: 'High' },
  MEDIUM: { color: '#ca8a04', bg: '#fef9c3', label: 'Medium' },
  LOW: { color: '#16a34a', bg: '#dcfce7', label: 'Low' },
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const CARD_ANIMATIONS = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  hover: { scale: 1.02, y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
  dragging: { scale: 1.05, rotate: 2, opacity: 0.8 },
};

const COLUMN_ANIMATIONS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, staggerChildren: 0.1 },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysUntilDue = (dueDate: Date): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const isOverdue = (dueDate: Date): boolean => {
  return getDaysUntilDue(dueDate) < 0;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TaskCardProps {
  task: ProjectTask;
  onClick: (task: ProjectTask) => void;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  compact = false,
}) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isBlocked = task.status === 'BLOCKED';
  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  if (compact) {
    return (
      <motion.div
        variants={CARD_ANIMATIONS}
        whileHover="hover"
        onClick={() => onClick(task)}
        className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer mb-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-900 truncate">{task.title}</h4>
            {task.assigneeName && (
              <p className="text-xs text-slate-500 mt-1">{task.assigneeName}</p>
            )}
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
            style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}
          >
            {task.priority}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={CARD_ANIMATIONS}
      whileHover="hover"
      onClick={() => onClick(task)}
      className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-pointer mb-3 hover:border-blue-300 transition-colors"
    >
      {/* Header with Priority */}
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs px-2 py-1 rounded-full font-semibold"
          style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}
        >
          {priorityConfig.label}
        </span>
        {task.attachments !== undefined && task.attachments > 0 && (
          <Paperclip size={14} className="text-slate-400" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-2 leading-tight">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer Metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {/* Assignee */}
        {task.assigneeName ? (
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400" />
            <span className="text-xs text-slate-600 truncate max-w-25">
              {task.assigneeName}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <User size={14} />
            <span className="text-xs">Unassigned</span>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1.5 ${
              overdue ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            <Calendar size={14} />
            <span className="text-xs font-medium">
              {formatDate(task.dueDate)}
              {overdue && ' (Overdue)'}
              {daysUntilDue !== null && daysUntilDue >= 0 && !overdue && ` (${daysUntilDue}d)`}
            </span>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {(task.comments !== undefined || task.cycleTimeDays !== undefined) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
          {task.comments !== undefined && task.comments > 0 && (
            <div className="flex items-center gap-1 text-slate-500">
              <MessageSquare size={12} />
              <span className="text-xs">{task.comments}</span>
            </div>
          )}
          {task.cycleTimeDays !== undefined && (
            <div className="flex items-center gap-1 text-slate-500">
              <Clock size={12} />
              <span className="text-xs">{task.cycleTimeDays}d</span>
            </div>
          )}
        </div>
      )}

      {/* Blocked Indicator */}
      {isBlocked && task.blockedBy && (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-700 font-medium">
            Blocked by: {task.blockedBy}
          </p>
        </div>
      )}
    </motion.div>
  );
};

interface KanbanColumnProps {
  config: ColumnConfig;
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask: () => void;
  onTaskDrop?: (taskId: string, newStatus: TaskStatus) => void;
  showWipLimits?: boolean;
  allowDragDrop?: boolean;
  compact?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  config,
  tasks,
  onTaskClick,
  onAddTask,
  onTaskDrop,
  showWipLimits = true,
  allowDragDrop = true,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const taskCount = tasks.length;
  const isAtWipLimit = config.wipLimit && taskCount >= config.wipLimit;
  const isOverLimit = config.wipLimit && taskCount > config.wipLimit;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (allowDragDrop) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (onTaskDrop) {
      const taskId = e.dataTransfer.getData('text/plain');
      onTaskDrop(taskId, config.id);
    }
  };

  return (
    <motion.div
      variants={COLUMN_ANIMATIONS}
      className="shrink-0 w-80 flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className="rounded-t-lg p-3 mb-3 border-b-2"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: config.color }}>{config.icon}</span>
            <h3 className="font-semibold text-sm" style={{ color: config.color }}>
              {config.title}
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
              {taskCount}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {showWipLimits && config.wipLimit && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isOverLimit
                    ? 'bg-red-100 text-red-700'
                    : isAtWipLimit
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-white/50 text-slate-600'
                }`}
              >
                WIP: {taskCount}/{config.wipLimit}
              </span>
            )}
            <button
              onClick={onAddTask}
              className="p-1 hover:bg-white/70 rounded transition-colors"
              title="Add task"
            >
              <Plus size={16} style={{ color: config.color }} />
            </button>
            <button className="p-1 hover:bg-white/70 rounded transition-colors">
              <MoreVertical size={16} style={{ color: config.color }} />
            </button>
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div
        className={`flex-1 overflow-y-auto px-2 py-1 rounded-b-lg transition-colors ${
          isDragOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-transparent'
        }`}
        style={{ minHeight: '400px', maxHeight: 'calc(100vh - 300px)' }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              compact={compact}
            />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No tasks yet</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add first task
            </button>
          </div>
        )}
      </div>

      {/* WIP Limit Warning */}
      {showWipLimits && isOverLimit && config.wipLimit && (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-700 font-medium">
            ⚠️ WIP limit exceeded by {taskCount - config.wipLimit}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskMove,
  onAddTask,
  showWipLimits = true,
  allowDragDrop = true,
  compact = false,
}: KanbanBoardProps) {
  // Group tasks by status using memoization
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, ProjectTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      BLOCKED: [],
      DONE: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort each column by priority and due date
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => {
      grouped[status].sort((a, b) => {
        // Critical tasks first
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Then by due date (earliest first)
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        
        return 0;
      });
    });

    return grouped;
  }, [tasks]);

  const handleTaskDrop = (taskId: string, newStatus: TaskStatus) => {
    if (onTaskMove) {
      onTaskMove(taskId, newStatus);
    }
  };

  const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];

  return (
    <div className="h-full w-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      {/* Board Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Task Board</h2>
            <span className="text-sm text-slate-500">
              {tasks.length} tasks across {columns.length} columns
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddTask?.('TODO')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Board Canvas */}
      <div className="h-full overflow-x-auto p-4">
        <motion.div
          className="flex gap-4 h-full"
          initial="initial"
          animate="animate"
          variants={COLUMN_ANIMATIONS}
        >
          {columns.map((columnId) => {
            const config = COLUMN_CONFIGS[columnId];
            const columnTasks = tasksByStatus[columnId];

            return (
              <KanbanColumn
                key={columnId}
                config={config}
                tasks={columnTasks}
                onTaskClick={onTaskClick || (() => {})}
                onAddTask={() => onAddTask?.(columnId)}
                onTaskDrop={allowDragDrop ? handleTaskDrop : undefined}
                showWipLimits={showWipLimits}
                allowDragDrop={allowDragDrop}
                compact={compact}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="bg-white border-t border-slate-200 px-4 py-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600 font-medium">Priority:</span>
            {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
              <div key={priority} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: config.bg, border: `1px solid ${config.color}` }}
                />
                <span className="text-slate-600">{config.label}</span>
              </div>
            ))}
            
            <div className="ml-auto flex items-center gap-3">
              <span className="text-slate-600 font-medium">Quick Stats:</span>
              <div className="flex items-center gap-1 text-slate-600">
                <TrendingUp size={12} />
                <span>{tasksByStatus.IN_PROGRESS.length} in progress</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <AlertCircle size={12} />
                <span>{tasksByStatus.BLOCKED.length} blocked</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={12} />
                <span>{tasksByStatus.DONE.length} done</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
