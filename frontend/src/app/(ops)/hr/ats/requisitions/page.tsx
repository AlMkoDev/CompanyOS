"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  MapPin, 
  Calendar, 
  Filter, 
  Search,
  MoreVertical,
  Plus,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface DepartmentInfo {
  name: string;
}

interface RequisitionApplication {
  id: string;
}

interface AtsRequisition {
  id: string;
  title: string;
  status: string;
  target_hire_date?: string | null;
  department: DepartmentInfo;
  applications: RequisitionApplication[];
}

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<AtsRequisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const res = await fetch('/api/ats/requisitions');
      if (res.ok) setRequisitions(await res.json());
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Strategy & Talent</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight">Job <span className="text-brand-gold font-light italic">Requisitions</span></h1>
          <p className="text-slate-500 font-medium">Orchestrate your workforce expansion and role approvals.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <Filter size={18} />
          </button>
          <button className="px-6 py-2.5 bg-brand-navy text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-navy/10 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            New Requisition
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Time-to-Hire', value: '24 Days', icon: Clock, trend: '-12%', sub: 'vs last quarter', color: 'text-indigo-600' },
          { label: 'Offer Acceptance', value: '92%', icon: TrendingUp, trend: '+4%', sub: 'industry leading', color: 'text-emerald-600' },
          { label: 'Sourcing Cost', value: 'R 8,500', icon: Users, trend: '-8%', sub: 'per hired candidate', color: 'text-brand-gold' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={64} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-indigo-500'} mb-1.5`}>
                <ArrowUpRight size={12} className={stat.trend.startsWith('-') ? 'rotate-90' : ''} />
                {stat.trend}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Active Requisitions</span>
            <span className="px-1.5 py-0.5 bg-brand-navy text-white text-[10px] font-bold rounded shadow-sm">{requisitions.length}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Details</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Applicants</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Date</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requisitions.map((req) => (
              <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                      <Briefcase size={20} className="text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-brand-gold transition-colors tracking-tight">{req.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">{req.department.name}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-900">{req.applications.length}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'open' ? 'bg-emerald-50 text-emerald-600' :
                    req.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    {req.target_hire_date ? new Date(req.target_hire_date).toLocaleDateString() : 'Not Set'}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/hr/ats/pipeline?requisitionId=${req.id}`} className="p-2 text-slate-400 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all">
                      <Users size={18} />
                    </Link>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requisitions.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
              <Briefcase size={32} className="text-slate-300" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 tracking-tight">No Active Requisitions</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Start building your dream team by creating a new job requisition.</p>
            </div>
            <button className="px-6 py-2 bg-brand-navy text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-navy/10">
              Initialize first mandate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
