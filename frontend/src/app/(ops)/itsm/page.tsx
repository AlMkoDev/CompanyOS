'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Ticket,
  Clock,
  CheckCircle2,
  Laptop,
  BookOpen,
  GitPullRequest,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity,
  History,
  Timer
} from 'lucide-react';
import Link from 'next/link';

interface ITTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  category: string;
  sla_deadline: string;
  created_at: string;
  raised_by: { first_name: string; last_name: string };
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string; glow: string }> = {
  P1: { color: 'bg-rose-500', label: 'Critical', glow: 'shadow-rose-500/20' },
  P2: { color: 'bg-orange-500', label: 'High', glow: 'shadow-orange-500/20' },
  P3: { color: 'bg-amber-500', label: 'Medium', glow: 'shadow-amber-500/20' },
  P4: { color: 'bg-slate-400', label: 'Low', glow: 'shadow-slate-400/20' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-blue-100 text-blue-600', label: 'Open' },
  in_progress: { color: 'bg-amber-100 text-amber-600', label: 'In Progress' },
  pending: { color: 'bg-slate-100 text-slate-600', label: 'Pending' },
  resolved: { color: 'bg-emerald-100 text-emerald-600', label: 'Resolved' },
  closed: { color: 'bg-slate-200 text-slate-500', label: 'Closed' },
};

export default function ItsmDashboard() {
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, slaMet: 0 });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/itsm/tickets');
      if (response.ok) {
        const data: ITTicket[] = await response.json();
        setTickets(data);
        const open = data.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed').length;
        const resolved = data.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length;
        setStats({
          total: data.length,
          open,
          resolved,
          slaMet: 94 // Mock value for demo
        });
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const total = Date.parse(deadline) - Date.parse(new Date().toString());
    if (total <= 0) return 'EXPIRED';
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50/20 p-8 space-y-10 pb-32 max-w-[1800px] mx-auto overflow-x-hidden animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3 text-blue-500" />
              IT Infrastructure & Governance
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            IT Service Desk
            <div className="p-3 bg-blue-50 text-blue-600 rounded-3xl backdrop-blur-md border border-blue-100">
              <Timer size={32} className="animate-pulse" />
            </div>
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <Ticket size={20} className="text-slate-300" />
              <span>{stats.open} Active Requests</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 text-emerald-600 font-black text-sm uppercase tracking-widest">
              <CheckCircle2 size={20} />
              <span>{stats.slaMet}% SLA Compliance</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/modules/itsm/knowledge-base">
            <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100/50">
              <BookOpen size={18} className="mr-2 text-slate-400" />
              Knowledge Base
            </Button>
          </Link>
          <Link href="/modules/itsm/tickets/new">
            <Button className="h-14 px-10 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex gap-3 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Stats & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="p-8 border-white/40 shadow-2xl shadow-blue-200/20 rounded-[40px] bg-white/70 backdrop-blur-xl relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <Activity size={16} className="text-blue-500" />
                Service Health
              </div>
              <Badge className="bg-emerald-500 text-white border-0 font-black text-[8px] uppercase tracking-widest">Optimum</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black text-slate-900 tracking-tighter">
                {stats.slaMet}<span className="text-2xl opacity-40">%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Response Excellence</p>
            </div>
            <div className="pt-4 flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[94%]" />
              </div>
            </div>
          </div>
        </Card>

        <Link href="/modules/itsm/cmdb" className="block group">
          <Card className="p-8 h-full border-blue-500/5 shadow-2xl shadow-blue-200/20 rounded-[40px] bg-blue-600 text-white relative overflow-hidden transition-all duration-700 group-hover:scale-[1.02]">
            <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
               <Laptop size={180} />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Asset Inventory</div>
              <div className="space-y-1">
                <div className="text-5xl font-black tracking-tighter">482</div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Managed Devices</p>
              </div>
              <Button className="w-full h-12 bg-white/10 hover:bg-white/20 border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest group-hover:bg-white group-hover:text-blue-600 transition-all duration-500">
                Explore CMDB
              </Button>
            </div>
          </Card>
        </Link>

        {/* Similar cards for Change Requests, Knowledge Base etc. */}
        <Card className="p-8 border-white/40 shadow-2xl shadow-slate-200/40 rounded-[40px] bg-white/70 backdrop-blur-xl relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <GitPullRequest size={16} className="text-purple-500" />
              Change Pipeline
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black text-slate-900 tracking-tighter">14</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending CAB Review</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
               <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100/50">
                  <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Impact: High</div>
                  <div className="text-lg font-black text-purple-900">4</div>
               </div>
               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard</div>
                  <div className="text-lg font-black text-slate-900">10</div>
               </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-white/40 shadow-2xl shadow-slate-200/40 rounded-[40px] bg-white/70 backdrop-blur-xl relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <TrendingUp size={16} className="text-indigo-500" />
              Efficiency KPI
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black text-slate-900 tracking-tighter">3.2<span className="text-2xl font-medium text-slate-300">h</span></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mean Time To Resolve</p>
            </div>
            <div className="pt-4">
              <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                 <TrendingUp size={14} />
                 12% faster than last month
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Queue Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Support Queue</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing critical requests with precedence</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-600 transition-colors" size={16} />
                <input 
                  placeholder="Filter tickets..." 
                  className="w-full h-12 pl-12 rounded-2xl border-slate-100 bg-white/50 focus-visible:ring-blue-500/10 font-medium text-xs shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border outline-none" 
                />
             </div>
             <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-2 border-slate-100 hover:bg-slate-50 transition-all shadow-lg shadow-slate-100/50">
                <Filter size={18} className="text-slate-400" />
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
             [1,2,3,4].map(i => (
                <div key={i} className="h-40 rounded-[40px] bg-slate-100 animate-pulse border border-slate-200/50" />
             ))
          ) : tickets.length === 0 ? (
             <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-30">
                <Ticket size={80} className="text-slate-400" />
                <div className="text-xl font-black uppercase tracking-[0.2em] text-slate-500">Inbox Zero Reached</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All service requests have been satisfied</p>
             </div>
          ) : (
            tickets.map(ticket => (
              <Card key={ticket.id} className="group p-8 border-white/40 shadow-xl shadow-slate-200/30 rounded-[40px] bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-white transition-all duration-700 cursor-pointer overflow-hidden relative">
                {/* Priority Indicator */}
                <div className={`absolute top-0 left-0 w-2 h-full ${PRIORITY_CONFIG[ticket.priority]?.color} ${PRIORITY_CONFIG[ticket.priority]?.glow} shadow-[0_0_20px_2px_rgba(0,0,0,0.1)] transition-all duration-700 group-hover:w-4`}></div>
                
                <div className="flex items-center justify-between gap-12">
                  <div className="flex items-center gap-10 flex-1">
                    <div className="flex flex-col items-center gap-3">
                       <div className={`w-12 h-12 rounded-[22px] ${PRIORITY_CONFIG[ticket.priority]?.color} p-[1px]`}>
                          <div className="w-full h-full rounded-[21px] bg-white flex items-center justify-center">
                             <Ticket size={24} className={PRIORITY_CONFIG[ticket.priority]?.color.replace('bg-', 'text-')} />
                          </div>
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{PRIORITY_CONFIG[ticket.priority]?.label}</span>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <Badge className={`${STATUS_CONFIG[ticket.status]?.color} border-0 font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm`}>
                          {STATUS_CONFIG[ticket.status]?.label}
                        </Badge>
                        <div className="h-1 w-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest">Request Reference # {ticket.id.slice(0,8).toUpperCase()}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <History size={14} className="text-slate-300" />
                          Requested by <span className="text-slate-900 font-black">{ticket.raised_by.first_name} {ticket.raised_by.last_name}</span>
                        </div>
                        <div className="h-3 w-[1px] bg-slate-100" />
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest capitalize">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                          {ticket.category || 'General Support'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right space-y-2 min-w-[140px]">
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center justify-end gap-2">
                        <Clock size={12} />
                        SLA Countdown
                      </div>
                      <div className={`text-2xl font-black tracking-tighter ${getTimeRemaining(ticket.sla_deadline) === 'EXPIRED' ? 'text-rose-500' : 'text-slate-900'} font-mono`}>
                        {getTimeRemaining(ticket.sla_deadline)}
                      </div>
                    </div>

                    <div className="h-16 w-[1px] bg-slate-50" />

                    <div className="p-5 bg-blue-50 text-blue-300 rounded-[24px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-xl shadow-blue-500/20">
                       <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
