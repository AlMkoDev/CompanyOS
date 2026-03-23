"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department_id: string;
  created_at: string;
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
  const { isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        apiFetch('/tasks'),
        apiFetch('/departments')
      ])
      .then(async ([tasksRes, deptsRes]) => {
        const tasksData = await tasksRes.json();
        const deptsData = await deptsRes.json();
        setTasks(tasksData);
        setDepartments(deptsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      const res = await apiFetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDrop = async (status: string) => {
    if (!draggedTaskId) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status } : t));
    
    try {
      await apiFetch(`/tasks/${draggedTaskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert would go here in a robust app
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-heading text-brand-navy">Operational TaskBoard</h1>
          <p className="text-sm text-slate-500 tracking-wide mt-1">Cross-departmental workflow synchronization</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium shadow-lg shadow-brand-gold/20"
        >
          + New Workflow Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-8">
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-gold/50 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden"
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
    </div>
  );
}
