'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Target,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  rag_status: string;
  budget?: number;
  tasks?: Array<Record<string, unknown>>;
  raid_items?: Array<Record<string, unknown>>;
}

interface RagDashboard {
  total: number;
  byStatus: Record<string, number>;
  byRag: Record<string, number>;
  onTimeDelivery: {
    onTime: number;
    atRisk: number;
    delayed: number;
    percentage: number;
  };
  budgetHealth: {
    totalAllocated: number;
    totalSpent: number;
    variance: number;
  };
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  planned: { color: 'bg-slate-100 text-slate-600', label: 'Planned' },
  active: { color: 'bg-emerald-100 text-emerald-600', label: 'Active' },
  'on-hold': { color: 'bg-amber-100 text-amber-600', label: 'On Hold' },
  completed: { color: 'bg-blue-100 text-blue-600', label: 'Completed' },
  cancelled: { color: 'bg-rose-100 text-rose-600', label: 'Cancelled' },
};

const RAG_CONFIG: Record<string, { color: string; label: string; icon: LucideIcon }> = {
  G: { color: 'bg-emerald-500', label: 'Green', icon: CheckCircle2 },
  A: { color: 'bg-amber-500', label: 'Amber', icon: AlertCircle },
  R: { color: 'bg-rose-500', label: 'Red', icon: AlertCircle },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboard, setDashboard] = useState<RagDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const { isAuthenticated } = useAuthStore();

  const fetchProjects = useCallback(async () => {
    try {
      const response = await apiFetch('/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await apiFetch('/projects/dashboard/rag');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchDashboard();
    }
  }, [isAuthenticated, fetchProjects, fetchDashboard]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter || p.rag_status === filter);

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1800px] mx-auto overflow-hidden h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-brand-navy rounded-full"></div>
            <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight flex items-center gap-3">
              Project Portfolio
              <div className="p-2 bg-brand-navy/5 text-brand-gold rounded-2xl">
                <BarChart3 size={24} />
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400 font-medium text-base">
              <Target size={18} />
              <span>{dashboard?.total || 0} Active Projects</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
              <TrendingUp size={18} />
              <span>
                {dashboard ? formatCurrency(dashboard.budgetHealth.totalAllocated || 0) : 'R 0,00'}{' '}
                Total Budget
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden lg:block">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-navy transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search projects..."
              className="h-14 w-80 pl-12 pr-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-navy/5 focus:border-brand-navy/20 transition-all font-medium"
            />
          </div>
          <Button className="h-14 px-8 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-widest text-xs hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/20 transition-all active:scale-95 flex gap-3">
            <Plus size={18} />
            New Project
          </Button>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* On-Time Delivery Gauge */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px] bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Clock size={16} />
                On-Time Delivery
              </div>
              <div className="text-4xl font-black text-brand-navy">
                {dashboard?.onTimeDelivery.percentage || 0}%
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <Progress value={dashboard?.onTimeDelivery.percentage || 0} className="h-2" />
          <div className="mt-4 flex items-center gap-4 text-[10px] font-mono">
            <span className="text-emerald-600 font-black">
              ✓ {dashboard?.onTimeDelivery.onTime || 0} On Time
            </span>
            <span className="text-amber-600 font-black">
              ! {dashboard?.onTimeDelivery.atRisk || 0} At Risk
            </span>
            <span className="text-rose-600 font-black">
              ✗ {dashboard?.onTimeDelivery.delayed || 0} Delayed
            </span>
          </div>
        </Card>

        {/* RAG Status Distribution */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px] bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Activity size={16} />
                Health Status
              </div>
              <div className="text-4xl font-black text-brand-navy">
                {dashboard?.byRag.G || 0}
                <span className="text-lg text-slate-400 font-medium">/{dashboard?.total || 0}</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-600">Green</span>
              </div>
              <span className="text-sm font-black text-emerald-600">{dashboard?.byRag.G || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-slate-600">Amber</span>
              </div>
              <span className="text-sm font-black text-amber-600">{dashboard?.byRag.A || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-xs font-bold text-slate-600">Red</span>
              </div>
              <span className="text-sm font-black text-rose-600">{dashboard?.byRag.R || 0}</span>
            </div>
          </div>
        </Card>

        {/* Budget Overview */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px] bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <DollarSign size={16} />
                Budget Health
              </div>
              <div className="text-2xl font-black text-brand-navy">
                {dashboard && dashboard.budgetHealth ? (dashboard.budgetHealth.variance >= 0 ? '+' : '') : ''}
                {dashboard && dashboard.budgetHealth ? formatCurrency(dashboard.budgetHealth.variance) : 'R 0,00'}
              </div>
            </div>
            <div
              className={`p-3 rounded-2xl ${
                dashboard && dashboard.budgetHealth && dashboard.budgetHealth.variance >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {dashboard && dashboard.budgetHealth && dashboard.budgetHealth.variance >= 0 ? (
                <ArrowUpRight size={24} />
              ) : (
                <ArrowDownRight size={24} />
              )}
            </div>
          </div>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Allocated:</span>
              <span className="font-bold">
                {dashboard && dashboard.budgetHealth ? formatCurrency(dashboard.budgetHealth.totalAllocated || 0) : 'R 0,00'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Spent:</span>
              <span className="font-bold">
                {dashboard && dashboard.budgetHealth ? formatCurrency(dashboard.budgetHealth.totalSpent || 0) : 'R 0,00'}
              </span>
            </div>
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px] bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <FileText size={16} />
                By Status
              </div>
              <div className="text-4xl font-black text-brand-navy">
                {dashboard?.byStatus.active || 0}
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(dashboard?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status]?.color.split(' ')[0]}`}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 capitalize">
                    {status.replace('-', ' ')}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 custom-scrollbar">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className={`rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
            filter === 'all'
              ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Projects
        </Button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'ghost'}
            onClick={() => setFilter(status)}
            className={`rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
              filter === status
                ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {config.label}
          </Button>
        ))}
        {Object.entries(RAG_CONFIG).map(([rag]) => (
          <Button
            key={rag}
            variant={filter === rag ? 'default' : 'ghost'}
            onClick={() => setFilter(rag)}
            className={`rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
              filter === rag
                ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {rag === 'G' ? 'Green' : rag === 'A' ? 'Amber' : 'Red'}
          </Button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-32 custom-scrollbar">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="h-64 rounded-[24px] bg-white/50 animate-pulse border border-slate-100"
            ></Card>
          ))
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-20">
            <div className="p-6 bg-slate-200 rounded-full mb-4">
              <BarChart3 size={48} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              No Projects Found
            </span>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const daysUntilDue = getDaysUntilDue(project.end_date);
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
            const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px] bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl hover:shadow-brand-navy/10 transition-all duration-500 cursor-pointer h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${STATUS_CONFIG[project.status]?.color} border-0 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full`}
                        >
                          {STATUS_CONFIG[project.status]?.label}
                        </Badge>
                        <div
                          className={`w-3 h-3 rounded-full ${RAG_CONFIG[project.rag_status]?.color} animate-pulse`}
                          title={`${RAG_CONFIG[project.rag_status]?.label} Status`}
                        ></div>
                      </div>
                      <h3 className="text-xl font-black text-brand-navy group-hover:text-brand-gold transition-colors line-clamp-2">
                        {project.name}
                      </h3>
                    </div>
                    <ExternalLink
                      size={18}
                      className="text-slate-300 group-hover:text-brand-navy transition-colors opacity-0 group-hover:opacity-100"
                    />
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-slate-600 font-medium line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Tasks
                      </div>
                      <div className="text-lg font-black text-brand-navy">
                        {project.tasks?.length || 0}
                        <span className="text-slate-400 font-medium text-sm"> total</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        RAID Items
                      </div>
                      <div className="text-lg font-black text-brand-navy">
                        {project.raid_items?.length || 0}
                        <span className="text-slate-400 font-medium text-sm"> open</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {project.budget && (
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Budget
                        </div>
                        <div className="text-sm font-black text-brand-navy">
                          {formatCurrency(project.budget)}
                        </div>
                      </div>
                    )}
                    {project.end_date && (
                      <div
                        className={`flex items-center gap-2 text-xs font-bold ${
                          isOverdue
                            ? 'text-rose-600'
                            : isDueSoon
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }`}
                      >
                        <Calendar size={14} />
                        <span>
                          Due {formatDate(project.end_date)}
                          {isOverdue && ` (${Math.abs(daysUntilDue || 0)}d overdue)`}
                          {isDueSoon && ` (${daysUntilDue}d left)`}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
