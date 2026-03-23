'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  Paperclip, 
  MessageSquare, 
  Plus,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectTask, TaskStatus, Priority } from './KanbanBoard';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TaskDetailModalProps {
  task: ProjectTask;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: TaskStatus) => void;
  onPriorityChange: (newPriority: Priority) => void;
  onAddComment?: (comment: string) => void;
  onUploadAttachment?: (file: File) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  allowedTransitions?: TaskStatus[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  filesize: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const MODAL_ANIMATIONS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const CONTENT_ANIMATIONS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
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
// CONFIGURATION
// ============================================================================

const STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string; label: string }> = {
  TODO: { color: '#64748b', bg: '#f1f5f9', label: 'To Do' },
  IN_PROGRESS: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
  IN_REVIEW: { color: '#8b5cf6', bg: '#ede9fe', label: 'In Review' },
  BLOCKED: { color: '#ef4444', bg: '#fee2e2', label: 'Blocked' },
  DONE: { color: '#10b981', bg: '#d1fae5', label: 'Done' },
};

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: '#dc2626', bg: '#fee2e2', label: 'Critical' },
  HIGH: { color: '#ea580c', bg: '#ffedd5', label: 'High' },
  MEDIUM: { color: '#ca8a04', bg: '#fef9c3', label: 'Medium' },
  LOW: { color: '#16a34a', bg: '#dcfce7', label: 'Low' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatusBadgeProps {
  status: TaskStatus;
  onChange?: (status: TaskStatus) => void;
  allowedTransitions?: TaskStatus[];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  onChange,
  allowedTransitions 
}) => {
  const config = STATUS_CONFIG[status];
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (onChange && (!allowedTransitions || allowedTransitions.includes(newStatus))) {
      onChange(newStatus);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-37.5"
            >
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
                const sConfig = STATUS_CONFIG[s];
                const isAllowed = !allowedTransitions || allowedTransitions.includes(s);
                
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusSelect(s)}
                    disabled={!isAllowed}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                      !isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sConfig.color }}
                    />
                    <span style={{ color: sConfig.color }}>{sConfig.label}</span>
                    {!isAllowed && <AlertCircle size={12} className="ml-auto" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface PriorityBadgeProps {
  priority: Priority;
  onChange?: (priority: Priority) => void;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, onChange }) => {
  const config = PRIORITY_CONFIG[priority];
  const [isOpen, setIsOpen] = useState(false);

  const handlePrioritySelect = (newPriority: Priority) => {
    onChange?.(newPriority);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-30"
            >
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => {
                const pConfig = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    onClick={() => handlePrioritySelect(p)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pConfig.color }}
                    />
                    <span style={{ color: pConfig.color }}>{pConfig.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CommentSectionProps {
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: Date }>;
  onAddComment: (content: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments = [],
  onAddComment,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <MessageSquare size={16} />
        Comments ({comments.length})
      </h3>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" size="sm" disabled={!newComment.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-slate-50 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-700">
                  {comment.authorName}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-slate-700">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
};

interface AttachmentSectionProps {
  attachments?: Array<{ id: string; filename: string; filesize: number }>;
  onUpload: (file: File) => void;
  onDelete: (attachmentId: string) => void;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  attachments = [],
  onUpload,
  onDelete,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Paperclip size={16} />
        Attachments ({attachments.length})
      </h3>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="w-full mb-3"
      >
        <Plus size={16} className="mr-2" />
        Upload File
      </Button>

      {/* Attachments List */}
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between bg-slate-50 rounded-md p-2"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Paperclip size={14} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {attachment.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(attachment.filesize)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onDelete(attachment.id)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} className="text-red-600" />
            </button>
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No attachments yet
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onStatusChange,
  onPriorityChange,
  onAddComment,
  onUploadAttachment,
  onDeleteAttachment,
  allowedTransitions,
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  // Sample data for demonstration
  const sampleComments = [
    {
      id: 'comment-1',
      authorName: 'John Doe',
      content: 'Starting work on this task now. Will update progress shortly.',
      createdAt: new Date('2026-03-14T10:30:00'),
    },
    {
      id: 'comment-2',
      authorName: 'Jane Smith',
      content: 'Please review the attached documents before proceeding.',
      createdAt: new Date('2026-03-14T14:15:00'),
    },
  ];

  const sampleAttachments = [
    {
      id: 'attach-1',
      filename: 'requirements.pdf',
      filesize: 2048576,
    },
    {
      id: 'attach-2',
      filename: 'design-mockup.png',
      filesize: 1048576,
    },
  ];

  if (!isOpen) return null;

  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            variants={MODAL_ANIMATIONS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={CONTENT_ANIMATIONS}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge
                      status={task.status}
                      onChange={onStatusChange}
                      allowedTransitions={allowedTransitions}
                    />
                    <PriorityBadge
                      priority={task.priority}
                      onChange={onPriorityChange}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {task.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'details' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={CONTENT_ANIMATIONS}
                  >
                    {/* Description */}
                    {task.description && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">
                          Description
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Assignee */}
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Assignee</p>
                          <p className="text-sm font-medium text-slate-900">
                            {task.assigneeName || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Due Date</p>
                          <p
                            className={`text-sm font-medium ${
                              overdue
                                ? 'text-red-600'
                                : daysUntilDue !== null && daysUntilDue <= 3
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.dueDate
                              ? `${formatDate(task.dueDate)} ${
                                  overdue
                                    ? `(Overdue by ${Math.abs(daysUntilDue!)}d)`
                                    : daysUntilDue !== null
                                    ? `(${daysUntilDue}d left)`
                                    : ''
                                }`
                              : 'Not set'}
                          </p>
                        </div>
                      </div>

                      {/* Cycle Time */}
                      {task.cycleTimeDays !== undefined && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Cycle Time</p>
                            <p className="text-sm font-medium text-slate-900">
                              {task.cycleTimeDays} days
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Blocked By */}
                      {task.blockedBy && (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-500" />
                          <div>
                            <p className="text-xs text-slate-500">Blocked By</p>
                            <p className="text-sm font-medium text-red-600">
                              {task.blockedBy}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-blue-700 font-semibold mb-1">
                          Comments
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          {task.comments || 0}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-xs text-purple-700 font-semibold mb-1">
                          Attachments
                        </div>
                        <div className="text-lg font-bold text-purple-900">
                          {task.attachments || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-xs text-green-700 font-semibold mb-1">
                          Progress
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {task.status === 'DONE' ? '100' : task.status === 'IN_PROGRESS' ? '50' : '0'}%
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {onAddComment && (
                      <CommentSection
                        comments={sampleComments}
                        onAddComment={onAddComment}
                      />
                    )}

                    {/* Attachments Section */}
                    {onUploadAttachment && onDeleteAttachment && (
                      <AttachmentSection
                        attachments={sampleAttachments}
                        onUpload={onUploadAttachment}
                        onDelete={onDeleteAttachment}
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={CONTENT_ANIMATIONS}
                    className="text-center py-12"
                  >
                    <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Activity Log
                    </h3>
                    <p className="text-sm text-slate-500">
                      Task activity and history will appear here
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {task.status !== 'DONE' && (
                  <Button
                    onClick={() => {
                      onStatusChange('DONE');
                      onClose();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
