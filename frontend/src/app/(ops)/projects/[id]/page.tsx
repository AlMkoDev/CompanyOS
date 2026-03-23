'use client';

import React, { useState } from 'react';
import { KanbanBoard } from '@/components/ppm/kanban/KanbanBoard';
import { TaskDetailModal } from '@/components/ppm/kanban/TaskDetailModal';
import { BudgetTracking } from '@/components/ppm/budget/BudgetTracking';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MoreVertical, 
  Users, 
  FileText, 
  DollarSign,
  Flag,
  CheckCircle,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface ProjectTask {
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

type BudgetTrackingProps = React.ComponentProps<typeof BudgetTracking>;
type NewSpendEntry = Parameters<NonNullable<BudgetTrackingProps['onAddSpend']>>[0];

// ============================================================================
// SAMPLE DATA
// ============================================================================

const sampleTasks: ProjectTask[] = [
  {
    id: 'task-001',
    projectId: 'proj-001',
    title: 'Define project scope and objectives',
    description: 'Create detailed project charter with stakeholder alignment',
    assigneeName: 'John Doe',
    assigneeAvatar: undefined,
    dueDate: new Date('2026-03-20'),
    status: 'DONE',
    priority: 'HIGH',
    completedAt: new Date('2026-03-18'),
    comments: 5,
    attachments: 2,
    cycleTimeDays: 3,
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-03-18'),
  },
  {
    id: 'task-002',
    projectId: 'proj-001',
    title: 'Design system architecture',
    description: 'Create technical architecture diagram and documentation',
    assigneeName: 'Jane Smith',
    dueDate: new Date('2026-03-25'),
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    comments: 8,
    attachments: 3,
    cycleTimeDays: 5,
    createdAt: new Date('2026-03-16'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'task-003',
    projectId: 'proj-001',
    title: 'Set up development environment',
    assigneeName: 'Mike Johnson',
    dueDate: new Date('2026-03-22'),
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    comments: 2,
    attachments: 1,
    cycleTimeDays: 4,
    createdAt: new Date('2026-03-17'),
    updatedAt: new Date('2026-03-21'),
  },
  {
    id: 'task-004',
    projectId: 'proj-001',
    title: 'Database schema design',
    assigneeName: 'Sarah Williams',
    dueDate: new Date('2026-03-28'),
    status: 'TODO',
    priority: 'HIGH',
    comments: 0,
    attachments: 0,
    createdAt: new Date('2026-03-19'),
    updatedAt: new Date('2026-03-19'),
  },
  {
    id: 'task-005',
    projectId: 'proj-001',
    title: 'API integration with legacy system',
    description: 'Blocked pending API documentation from vendor',
    assigneeName: 'Alex Brown',
    dueDate: new Date('2026-03-30'),
    status: 'BLOCKED',
    priority: 'CRITICAL',
    blockedBy: 'Waiting for vendor API documentation',
    comments: 12,
    attachments: 1,
    cycleTimeDays: 2,
    createdAt: new Date('2026-03-18'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'task-006',
    projectId: 'proj-001',
    title: 'User authentication module',
    assigneeName: 'Emily Davis',
    dueDate: new Date('2026-03-26'),
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    comments: 4,
    attachments: 2,
    cycleTimeDays: 3,
    createdAt: new Date('2026-03-18'),
    updatedAt: new Date('2026-03-21'),
  },
  {
    id: 'task-007',
    projectId: 'proj-001',
    title: 'Frontend component library',
    assigneeName: 'Chris Wilson',
    dueDate: new Date('2026-04-05'),
    status: 'TODO',
    priority: 'MEDIUM',
    comments: 1,
    attachments: 0,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'task-008',
    projectId: 'proj-001',
    title: 'Write unit tests for core modules',
    assigneeName: 'Lisa Anderson',
    dueDate: new Date('2026-04-10'),
    status: 'TODO',
    priority: 'LOW',
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'kanban' | 'raid' | 'budget' | 'files' | 'gates'>('kanban');
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    console.log(`Moving task ${taskId} to ${newStatus}`);
    // TODO: Call API to update task status
    alert(`Task moved to ${newStatus}`);
  };

  const handleAddTask = (status: TaskStatus) => {
    console.log(`Adding new task to ${status}`);
    // TODO: Open task creation modal
    alert(`Add task to ${status} - Modal would open here`);
  };

  const handleAddComment = async (content: string) => {
    console.log('Adding comment:', content);
    // TODO: Call API to add comment
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleUploadAttachment = (file: File) => {
    console.log('Uploading attachment:', file.name);
    // TODO: Call API to upload file
    alert(`Uploading: ${file.name}`);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    console.log('Deleting attachment:', attachmentId);
    // TODO: Call API to delete attachment
    alert('Attachment deleted');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-450 mx-auto px-6 py-4">
          {/* Breadcrumb & Back */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Digital Transformation</h1>
              <p className="text-sm text-slate-600">PROJ-001 • Active</p>
            </div>
          </div>

          {/* Project Stats Bar */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                RAG Status
              </div>
              <div className="text-lg font-bold text-green-800">🟢 GREEN</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">
                Owner
              </div>
              <div className="text-sm font-bold text-blue-800">John Doe</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-1">
                Progress
              </div>
              <div className="text-lg font-bold text-purple-800">45%</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">
                Health Score
              </div>
              <div className="text-lg font-bold text-amber-800">78/100</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-700 font-semibold uppercase tracking-wide mb-1">
                Tasks
              </div>
              <div className="text-lg font-bold text-slate-800">{sampleTasks.length} Total</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'kanban'
                  ? 'border-brand-navy text-brand-navy'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle size={16} />
              Kanban Board
            </button>
            <button
              onClick={() => setActiveTab('raid')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'raid'
                  ? 'border-brand-navy text-brand-navy'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flag size={16} />
              RAID Log
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'budget'
                  ? 'border-brand-navy text-brand-navy'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign size={16} />
              Budget
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'files'
                  ? 'border-brand-navy text-brand-navy'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={16} />
              Files
            </button>
            <button
              onClick={() => setActiveTab('gates')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'gates'
                  ? 'border-brand-navy text-brand-navy'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={16} />
              Gates
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Export
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-450 mx-auto p-6">
        {activeTab === 'kanban' && (
          <div className="h-[calc(100vh-280px)]">
            <KanbanBoard
              tasks={sampleTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onAddTask={handleAddTask}
              showWipLimits={true}
              allowDragDrop={true}
            />
          </div>
        )}

        {activeTab === 'raid' && (
          <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-slate-200">
            <div className="text-center text-slate-500">
              <Flag size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">RAID Log Coming Soon</h3>
              <p className="text-sm">Risks, Actions, Issues, and Decisions will be tracked here</p>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="max-w-350">
            <BudgetTracking
              projectId="proj-001"
              allocatedBudget={500000}
              spendEntries={[
                {
                  id: 'spend-001',
                  projectId: 'proj-001',
                  category: 'Personnel',
                  description: 'Senior Developer - March salary',
                  amount: 15000,
                  planned: false,
                  date: new Date('2026-03-01'),
                  createdBy: 'John Doe',
                },
                {
                  id: 'spend-002',
                  projectId: 'proj-001',
                  category: 'Software',
                  description: 'AWS Cloud Services - Q1',
                  amount: 8500,
                  planned: false,
                  date: new Date('2026-03-05'),
                  receiptUrl: '#',
                  receiptName: 'aws_invoice_q1.pdf',
                  createdBy: 'Jane Smith',
                },
                {
                  id: 'spend-003',
                  projectId: 'proj-001',
                  category: 'Equipment',
                  description: 'Development laptops (3x)',
                  amount: 7500,
                  planned: true,
                  date: new Date('2026-03-10'),
                  createdBy: 'Mike Johnson',
                },
                {
                  id: 'spend-004',
                  projectId: 'proj-001',
                  category: 'Consulting',
                  description: 'Security audit consultation',
                  amount: 12000,
                  planned: false,
                  date: new Date('2026-03-12'),
                  createdBy: 'Sarah Williams',
                },
                {
                  id: 'spend-005',
                  projectId: 'proj-001',
                  category: 'Training',
                  description: 'Team certification program',
                  amount: 5000,
                  planned: true,
                  date: new Date('2026-03-15'),
                  createdBy: 'Alex Brown',
                },
              ]}
              onAddSpend={(entry: NewSpendEntry) => console.log('Adding spend entry:', entry)}
              onDeleteSpend={(entryId: string) => console.log('Deleting entry:', entryId)}
              onUploadReceipt={(entryId: string, file: File) => console.log('Uploading receipt:', file.name)}
              showReceiptUpload={true}
              receiptThreshold={100}
            />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-slate-200">
            <div className="text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Files Coming Soon</h3>
              <p className="text-sm">Project attachments and documents</p>
            </div>
          </div>
        )}

        {activeTab === 'gates' && (
          <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-slate-200">
            <div className="text-center text-slate-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Gate Reviews Coming Soon</h3>
              <p className="text-sm">Phase gate approvals and checkpoints</p>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={(newStatus: TaskStatus) => {
            handleTaskMove(selectedTask.id, newStatus);
            setIsModalOpen(false);
          }}
          onPriorityChange={(newPriority: Priority) => {
            console.log('Changing priority to', newPriority);
            // TODO: Call API
          }}
          onAddComment={handleAddComment}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          allowedTransitions={['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']}
        />
      )}
    </div>
  );
}
