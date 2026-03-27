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
    attachments?: string[];
    assignee_id?: string;
    dependencies?: string[];
    comment?: string;
  }) => void;
  departments: { id: string; name: string }[];
  assignees: { id: string; first_name: string; last_name: string }[];
}

export const CreateTaskModal = ({ isOpen, onClose, onSubmit, departments, assignees }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState('');
  const [dependencies, setDependencies] = useState('');
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

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
      assignee_id: assigneeId || undefined,
      dependencies: dependencies
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      comment: comment.trim() || undefined,
      attachments: attachments
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    });
    // Reset
    setTitle('');
    setDescription('');
    setDepartmentId('');
    setPriority('medium');
    setDueDate('');
    setAttachments('');
    setDependencies('');
    setComment('');
    setAssigneeId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-brand-navy/30 px-4 py-12 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative mt-6 w-full max-w-lg max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
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
            <label className="block text-sm font-bold text-slate-700 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
            >
              <option value="">Unassigned</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </option>
              ))}
            </select>
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Attachments</label>
            <input
              type="text"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              placeholder="Comma-separated links or file references"
            />
            <p className="mt-2 text-xs text-slate-500">
              Example: Google Drive link, document URL, or file reference.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Dependencies</label>
            <input
              type="text"
              value={dependencies}
              onChange={(e) => setDependencies(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              placeholder="Comma-separated task dependencies"
            />
            <p className="mt-2 text-xs text-slate-500">
              Example: Waiting on design approval, Procurement sign-off, Legal review.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Initial Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
              placeholder="Optional initial note for the task"
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
