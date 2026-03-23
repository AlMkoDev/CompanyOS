'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Users,
  Search,
  Plus,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Deadline {
  id: string;
  title: string;
  category: string;
  due_date: string;
  status: string;
  reference_no?: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  _count?: {
    proofs: number;
  };
}

interface ComplianceDashboard {
  total: number;
  stats: Record<string, number>;
  upcoming: Deadline[];
}

export default function ComplianceDashboardPage() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Assuming /api proxy maps to backend
      const res = await fetch('/api/compliance/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-brand-gold animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck size={32} className="text-brand-gold animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* Decorative background element */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-8 bg-brand-gold rounded-full"></div>
            <h1 className="text-4xl font-heading font-black text-brand-navy tracking-tight uppercase">
              Compliance <span className="text-slate-400 font-light">Command Center</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
            Statutory tracking, regulatory filing orchestration, and proactive risk mitigation for Verdant Fields.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search obligations..."
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 w-64 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl h-11 px-6 shadow-xl shadow-brand-navy/10 gap-2">
            <Plus size={18} />
            Add Deadline
          </Button>
        </motion.div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Upcoming 30D" 
          value={dashboard?.upcoming.length || 0} 
          icon={Calendar}
          color="gold"
          trend="+2 vs last month"
          delay={0.1}
        />
        <StatCard 
          title="Overdue" 
          value={dashboard?.stats.overdue || 0} 
          icon={AlertTriangle}
          color="rose"
          trend="Immediate Action Required"
          delay={0.2}
        />
        <StatCard 
          title="Pending Filings" 
          value={dashboard?.stats.pending || 0} 
          icon={Clock}
          color="amber"
          trend="Awaiting verification"
          delay={0.3}
        />
        <StatCard 
          title="Filed Successfully" 
          value={dashboard?.stats.filed || 0} 
          icon={CheckCircle2}
          color="emerald"
          trend="100% compliance rate"
          delay={0.4}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Deadline List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold text-brand-navy flex items-center gap-2">
              <Activity size={20} className="text-brand-gold" />
              Upcoming Obligations
            </h2>
            <Link href="/strategy/compliance/calendar" className="text-xs font-bold text-brand-gold hover:text-brand-navy flex items-center gap-1 transition-colors">
              VIEW CALENDAR <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {dashboard?.upcoming.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/50 border border-dashed border-slate-300 rounded-2xl p-12 text-center"
                >
                  <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium">All clear. No pending obligations found.</p>
                </motion.div>
              ) : (
                dashboard?.upcoming.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="p-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-brand-gold/30 transition-all cursor-pointer group shadow-sm hover:shadow-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          item.status === 'overdue' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                        }`}>
                          <FileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-brand-navy truncate">{item.title}</h3>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Calendar size={14} className="text-brand-gold" />
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Users size={14} className="text-slate-400" />
                              {item.assignee?.first_name} {item.assignee?.last_name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={item.status} />
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/strategy/compliance/${item.id}`} className="text-xs font-bold text-brand-gold flex items-center gap-1 ml-auto">
                              FILE NOW <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold text-brand-navy flex items-center gap-2">
            <Zap size={20} className="text-brand-gold" />
            Audit Intelligence
          </h2>

          <Card className="bg-brand-navy p-6 text-white border-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">Risk Factor</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">LOW</span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black">98.4%</div>
                <div className="text-xs text-slate-400 uppercase tracking-tighter">Compliance Health Score</div>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-400">Next Audit: Oct 2026</span>
                <button className="text-brand-gold flex items-center gap-1 hover:underline">
                  DETAILS <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <h3 className="font-bold text-brand-navy mb-4">Regulatory Changes</h3>
            <div className="space-y-4">
              <NewsItem 
                title="New KRA Tax Guidelines for Agri-Business"
                date="Effective July 1st"
                type="Impact: High"
              />
              <NewsItem 
                title="Labour Law Update: Casual Worker Rotas"
                date="Pending Review"
                type="Impact: Medium"
              />
            </div>
          </Card>

          <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between group cursor-pointer hover:bg-brand-gold transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-colors shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-brand-navy group-hover:text-white transition-colors">Compliance Wizard</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold group-hover:text-white/70 transition-colors tracking-widest">Auto-Reminders Enabled</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend,
  delay 
}: { 
  title: string; 
  value: number; 
  icon: LucideIcon; 
  color: 'gold' | 'emerald' | 'rose' | 'amber';
  trend: string;
  delay: number;
}) {
  const colors = {
    gold: 'bg-brand-gold/10 text-brand-gold',
    emerald: 'bg-emerald-50 text-emerald-500',
    rose: 'bg-rose-50 text-rose-500',
    amber: 'bg-amber-50 text-amber-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="p-6 bg-white border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
            <div className="text-4xl font-black text-brand-navy">{value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 group-hover:text-brand-navy transition-colors">
              {trend}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    overdue: 'bg-rose-500 text-white shadow-rose-200',
    pending: 'bg-amber-400 text-white shadow-amber-200',
    filed: 'bg-emerald-500 text-white shadow-emerald-200',
    default: 'bg-slate-400 text-white shadow-slate-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${colors[status] || colors.default}`}>
      {status}
    </span>
  );
}

function NewsItem({ title, date, type }: { title: string; date: string; type: string }) {
  return (
    <div className="group cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 group-hover:scale-150 transition-transform"></div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-brand-navy leading-tight group-hover:text-brand-gold transition-colors">{title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{date}</span>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">{type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
