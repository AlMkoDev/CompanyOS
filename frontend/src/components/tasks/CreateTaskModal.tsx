import React, { useState } from 'react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    department_id: string;
    priority: string;
    status: string;
    due_date?: string;
  }) => void;
  departments: { id: string; name: string }[];
}

export const CreateTaskModal = ({ isOpen, onClose, onSubmit, departments }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !departmentId) {
      alert('Please fill out Title and Department');
      return;
    }
    onSubmit({
      title,
      description,
      department_id: departmentId,
      priority,
      status: 'open',
      due_date: dueDate || undefined,
    });
    // Reset
    setTitle('');
    setDescription('');
    setDepartmentId('');
    setPriority('medium');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-heading text-brand-navy mb-6">Create New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task Title *</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              placeholder="e.g. Quarterly Review Prep"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              placeholder="Provide context and deliverables..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Department *</label>
              <select 
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-premium"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
