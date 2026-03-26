"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { useRouter } from 'next/navigation';
import { AppPermissionGuard } from '@/components/common/AppPermissionGuard';
import { UnauthorizedEntry } from '@/components/common/AccessState';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department_id: string;
  created_at: string;
  due_date?: string;
  attachments?: string[] | null;
  assignee?: { first_name: string; last_name: string };
  creator?: { first_name: string; last_name: string };
}

interface Department {
  id: string;
  name: string;
  color: string;
}

type CreateTaskInput = React.ComponentProps<typeof CreateTaskModal>['onSubmit'] extends (
  data: infer T,
) => void
  ? T
  : never;

const COLUMNS = [
  { id: 'open', title: 'Open / Backlog', color: 'border-slate-200' },
  { id: 'in-progress', title: 'In Progress', color: 'border-blue-200' },
  { id: 'review', title: 'Pending Review', color: 'border-amber-200' },
  { id: 'done', title: 'Completed', color: 'border-emerald-200' },
];

export default function TasksPage() {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        apiFetch('/tasks'),
        apiFetch('/departments')
      ])
      .then(async ([tasksRes, deptsRes]) => {
        if (tasksRes.status === 401 || deptsRes.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (tasksRes.status === 403 || deptsRes.status === 403) {
          setError('You do not have permission to access the task workspace.');
          return;
        }

        if (!tasksRes.ok || !deptsRes.ok) {
          throw new Error('Failed to load task workspace.');
        }

        const tasksData = await tasksRes.json();
        const deptsData = await deptsRes.json();
        setTasks(tasksData);
        setDepartments(deptsData);
      })
      .catch((fetchError) => {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load task workspace.');
      })
      .finally(() => setLoading(false));
    }
  }, [isAuthenticated, logout, router]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      const res = await apiFetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (res.status === 403) {
        setError('You do not have permission to create tasks in this workspace.');
        return;
      }

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
      } else {
        throw new Error('Failed to create task.');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setError(error instanceof Error ? error.message : 'Failed to create task.');
    }
  };

  const handleDrop = async (status: string) => {
    if (!draggedTaskId) return;

    const previousTasks = tasks;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status } : t));
    
    try {
      const response = await apiFetch(`/tasks/${draggedTaskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to update this task.');
      }

      if (!response.ok) {
        throw new Error('Failed to update task status.');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      setTasks(previousTasks);
      setError(error instanceof Error ? error.message : 'Failed to update task status.');
    }
    
    setDraggedTaskId(null);
  };

  const getDepartmentColor = (id: string) => {
    const dept = departments.find(d => d.id === id);
    return dept ? (dept.color || 'bg-slate-400') : 'bg-slate-400';
  };
  
  const getDepartmentName = (id: string) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : 'Unknown';
  };

  const isTaskOverdue = (task: Task) =>
    Boolean(task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date());

  const formatTaskDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : 'Not provided');

  const getTaskAttachments = (task: Task) => (Array.isArray(task.attachments) ? task.attachments : []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">Loading Workflows...</p>
        </div>
      </div>
    );
  }

  const overdueCount = tasks.filter((task) => task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()).length;

  return (
    <AppPermissionGuard
      module="tasks"
      fallback={
        <UnauthorizedEntry
          message="You do not have permission to access the task workspace."
          actionLabel="Return to Dashboard"
          onAction={() => router.push('/dashboard')}
        />
      }
    >
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-heading text-brand-navy">Operational TaskBoard</h1>
          <p className="text-sm text-slate-500 tracking-wide mt-1">Cross-departmental workflow synchronization</p>
          <p className="text-xs text-slate-400 mt-2">
            {tasks.length} tasks tracked · {overdueCount} overdue
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium shadow-lg shadow-brand-gold/20"
        >
          + New Workflow Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-6 h-full min-w-max pb-4">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              className={`flex flex-col w-80 bg-slate-100/50 rounded-2xl border-t-4 ${col.color} shrink-0`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleDrop(col.id); }}
            >
              <div className="p-4 flex justify-between items-center shrink-0">
                <h3 className="font-heading text-slate-700">{col.title}</h3>
                <span className="bg-white text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-gold/50 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isTaskOverdue(task) ? 'ring-1 ring-red-200' : ''}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${getDepartmentColor(task.department_id)}`}></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-slate-900 leading-tight mb-2 pl-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 pl-2">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className={`mb-3 pl-2 text-[11px] font-semibold ${isTaskOverdue(task) ? 'text-red-600' : 'text-slate-500'}`}>
                        Due {formatTaskDate(task.due_date)}{isTaskOverdue(task) ? ' · Overdue' : ''}
                      </div>
                    )}
                    {getTaskAttachments(task).length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2 pl-2">
                        {getTaskAttachments(task).slice(0, 3).map((attachment, index) => (
                          <span key={`${task.id}-attachment-${index}`} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                            Attachment {index + 1}
                          </span>
                        ))}
                        {getTaskAttachments(task).length > 3 && (
                          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                            +{getTaskAttachments(task).length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 pl-2">
                      <div className="flex items-center gap-1.5 opacity-60">
                         <div className={`w-2 h-2 rounded-full ${getDepartmentColor(task.department_id)}`}></div>
                         <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                           {getDepartmentName(task.department_id)}
                         </span>
                      </div>
                      
                      {task.creator && (
                        <div className="w-6 h-6 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold shadow-sm" title={`Created by ${task.creator.first_name}`}>
                          {task.creator.first_name[0]}{task.creator.last_name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTask}
        departments={departments}
      />

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/40 px-4 py-6 backdrop-blur-sm">
          <div className="relative my-auto w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Task Details</p>
                <h3 className="mt-2 text-3xl font-heading font-black text-brand-navy">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                className="text-sm font-bold text-slate-400 hover:text-slate-700"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">{selectedTask.status}</div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">{selectedTask.priority}</div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Department</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">{getDepartmentName(selectedTask.department_id)}</div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Due Date</div>
                <div className={`mt-2 text-sm font-semibold ${isTaskOverdue(selectedTask) ? 'text-red-600' : 'text-brand-navy'}`}>
                  {formatTaskDate(selectedTask.due_date)}{isTaskOverdue(selectedTask) ? ' · Overdue' : ''}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Created By</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">
                  {selectedTask.creator ? `${selectedTask.creator.first_name} ${selectedTask.creator.last_name}` : 'Unknown'}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Assignee</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">
                  {selectedTask.assignee ? `${selectedTask.assignee.first_name} ${selectedTask.assignee.last_name}` : 'Unassigned'}
                </div>
              </div>
            </div>

            {selectedTask.description && (
              <div className="mt-6 rounded-[24px] border border-slate-100 bg-white p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Description</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedTask.description}</p>
              </div>
            )}

            <div className="mt-6 rounded-[24px] border border-slate-100 bg-white p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Attachments</div>
              {getTaskAttachments(selectedTask).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {getTaskAttachments(selectedTask).map((attachment, index) => (
                    <span key={`${selectedTask.id}-modal-attachment-${index}`} className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                      {attachment}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No attachments provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </AppPermissionGuard>
  );
}
