"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  party_name: string;
  category: string;
  status: string;
  value: number | null;
  start_date: string;
  end_date: string | null;
  owner: {
    first_name: string;
    last_name: string;
  };
}

export default function ContractRegistryPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/clm/contracts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'signed':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'approved':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'sent':
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'expired':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'signed':
      case 'active':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'sent':
      case 'pending':
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'expired':
        return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50/30 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              <ShieldCheck className="w-3 h-3" />
              Legal Operations & Compliance
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Contract Registry
            </h1>
            <p className="text-slate-500 text-sm font-medium">Streamlined lifecycle management for high-stakes agreements.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm active:scale-95 text-sm"
              suppressHydrationWarning
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => window.location.href = '/strategy/clm/new'}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 font-black uppercase tracking-widest text-[10px]"
              suppressHydrationWarning
            >
              <Plus className="w-4 h-4" />
              New Agreement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="backdrop-blur-xl bg-white/70 p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/40 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search contracts, parties, or categories..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              <select 
                className="px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-bold text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                suppressHydrationWarning
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
              <button className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all"
                suppressHydrationWarning
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Data Table */}
            <div className="backdrop-blur-xl bg-white/80 rounded-[32px] shadow-2xl shadow-slate-200/60 border border-white/60 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agreement Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Valuation</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 relative">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-8 py-10 h-24 bg-slate-50/30" />
                      </tr>
                    ))
                  ) : (
                    (Array.isArray(contracts) ? contracts : []).map((contract) => (
                      <tr key={contract.id} className="hover:bg-indigo-50/30 transition-all group cursor-pointer relative">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{contract.title}</div>
                              <div className="text-xs text-slate-500 mt-1 font-bold flex items-center gap-2">
                                <span className="text-slate-400">PARTNER:</span> {contract.party_name}
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-slate-400">DEPT:</span> {contract.category}
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(contract.start_date).toLocaleDateString()}
                                </span>
                                {contract.end_date && (
                                  <span className="text-[10px] font-black px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    {new Date(contract.end_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(contract.status)} shadow-sm shadow-black/5`}>
                            {getStatusIcon(contract.status)}
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="text-sm font-black text-slate-900 tracking-tighter">
                            {contract.value ? `$${contract.value.toLocaleString()}` : '--'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Value</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button 
                              onClick={() => window.location.href = `/strategy/clm/${contract.id}`}
                              className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 rounded-2xl border border-slate-100 transition-all font-bold"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-3 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {!loading && contracts.length === 0 && (
                <div className="py-32 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-50 rounded-[40px] text-slate-200 mb-2">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Agreement Records</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Start the legal lifecycle by generating your first document from our library.</p>
                  <button 
                    onClick={() => window.location.href = '/strategy/clm/new'}
                    className="mt-6 px-8 py-3 bg-brand-navy text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-brand-navy/90 transition-all active:scale-95 shadow-xl shadow-brand-navy/20"
                  >
                    Initiate First Contract
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Renewal Watchlist */}
            <div className="backdrop-blur-xl bg-slate-900/90 rounded-[32px] shadow-2xl overflow-hidden border border-white/10">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-black text-white flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Renewal Watch
                </h2>
                <div className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  Critical
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {contracts.filter(c => c.end_date && (c.status === 'signed' || c.status === 'active')).slice(0, 3).map(contract => (
                  <div key={contract.id} className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-black text-white group-hover:text-indigo-400 truncate max-w-[140px] uppercase tracking-wider">{contract.party_name}</div>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded">Action Req.</span>
                    </div>
                    <div className="text-[10px] text-white/40 mb-4 truncate font-medium uppercase tracking-tight">{contract.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
                        <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Expires: 14 Days</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
                {contracts.filter(c => c.end_date && (c.status === 'signed' || c.status === 'active')).length === 0 && (
                  <div className="p-12 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                    Operational Balance
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[32px] p-8 text-white shadow-3xl shadow-indigo-200 relative overflow-hidden group">
              <TrendingUp className="absolute top-[-20px] right-[-20px] w-48 h-48 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <ShieldCheck className="w-6 h-6 text-indigo-200" />
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Cycle Metrics</div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tighter">12.4<span className="text-xl opacity-50">%</span></div>
                  <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    Faster Execution vs Q2
                  </p>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 w-3/4 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Compliance Score */}
            <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
               <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Compliance Score
                  </h3>
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-5xl font-black text-slate-900 tracking-tighter">98.2</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5 text-emerald-500 font-black text-xs">
                      <ArrowUpRight className="w-3 h-3" />
                      +2.4
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audited Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
