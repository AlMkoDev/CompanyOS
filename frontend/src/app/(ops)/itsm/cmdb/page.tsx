'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Laptop,
  Server,
  Key,
  Database,
  Search,
  Filter,
  ArrowLeft,
  Plus,
  MoreVertical,
  History,
  ShieldCheck,
  User,
  Monitor,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

type AssetTypeIcon = React.ComponentType<{ size?: number; className?: string }>;

interface ITAsset {
  id: string;
  asset_tag: string;
  name: string;
  type: string;
  status: string;
  serial_no: string;
  model: string;
  assigned_to: { first_name: string; last_name: string } | null;
  specs: Record<string, string | number | boolean | null>;
}

const TYPE_ICONS: Record<string, AssetTypeIcon> = {
  laptop: Laptop,
  server: Server,
  software_license: Key,
  workstation: Monitor,
  default: Database
};

export default function CmdbPage() {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/itsm/assets');
      if (response.ok) {
        setAssets(await response.json());
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50/20 p-8 space-y-10 pb-32 max-w-[1800px] mx-auto overflow-x-hidden animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-6 mb-4">
            <Link href="/modules/itsm">
              <Button variant="ghost" className="h-14 w-14 rounded-[22px] bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50 border border-slate-100 transition-all active:scale-90 p-0">
                 <ArrowLeft size={24} className="text-slate-400" />
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              <Database className="w-3 h-3 text-indigo-500" />
              Configuration Management Database
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
            Asset Inventory
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <HardDrive size={20} className="text-slate-300" />
              <span>{assets.length} Configurations mapped</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 text-indigo-600 font-black text-sm uppercase tracking-widest">
              <ShieldCheck size={20} />
              <span>98.4% Health Index</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100/50 bg-white">
            Export JSON-LD
          </Button>
          <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex gap-3">
            <Plus size={20} />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Asset Grid/Table */}
      <Card className="border-white/40 shadow-2xl shadow-slate-200/40 rounded-[44px] bg-white/70 backdrop-blur-xl overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/50">
           <div className="flex items-center gap-4">
              <div className="relative group w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  placeholder="Scan asset tag or search model..." 
                  className="w-full h-14 pl-12 rounded-2xl border-slate-100 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all border outline-none text-xs font-bold" 
                />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all">
                <Filter size={18} className="text-slate-400" />
              </Button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ownership</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-10 py-12"><div className="h-8 bg-slate-100 rounded-xl w-full" /></td>
                    </tr>
                 ))
              ) : assets.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-10 py-32 text-center opacity-30">
                      <Database size={80} className="mx-auto mb-6 text-slate-400" />
                      <div className="text-xl font-black uppercase tracking-[0.2em]">Repository Empty</div>
                   </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const Icon = TYPE_ICONS[asset.type.toLowerCase()] || TYPE_ICONS.default;
                  return (
                    <tr key={asset.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                              <Icon className="text-indigo-600" size={24} />
                           </div>
                           <div className="space-y-1">
                              <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{asset.name}</div>
                              <div className="text-[10px] font-mono font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                                {asset.asset_tag}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-700">{asset.model || 'Standard Unit'}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <ShieldCheck size={12} className="text-emerald-500" />
                               {asset.serial_no || 'PN-000-XX'}
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         {asset.assigned_to ? (
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                  <User size={14} />
                               </div>
                               <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                                  {asset.assigned_to.first_name} {asset.assigned_to.last_name}
                               </div>
                            </div>
                         ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 font-black text-[9px] uppercase tracking-widest py-1">Unassigned</Badge>
                         )}
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-4">
                            <Badge className={`${asset.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} text-white border-0 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full`}>
                               {asset.status}
                            </Badge>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <History size={12} />
                               Verified 2d ago
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <Button variant="ghost" className="h-10 w-10 rounded-xl p-0 hover:bg-white hover:shadow-xl transition-all">
                            <MoreVertical size={18} className="text-slate-400" />
                         </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
