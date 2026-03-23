'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { 
  FileText, 
  History, 
  Shield, 
  Download, 
  ChevronLeft, 
  MoreVertical, 
  Lock, 
  Unlock,
  Trash2,
  Calendar,
  User,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface DocumentDetail {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  status: string;
  classification: string;
  version: number;
  created_at: string;
  updated_at: string;
  folder?: { name: string };
  versions: Array<{
    id: string;
    version_no: number;
    created_at: string;
    change_log?: string;
    download_url?: string;
  }>;
  legal_holds: Array<{
    active: boolean;
  }>;
  retention_policy?: { name: string; duration_years: number };
  file_url?: string;
  download_url?: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdReason, setHoldReason] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchDocDetail(params.id as string);
    }
  }, [params.id]);

  const fetchDocDetail = async (id: string) => {
    try {
      const response = await apiFetch(`/dms/documents/${id}`);
      if (response.ok) {
        setDoc(await response.json());
      }
    } catch (error) {
      console.error('Error fetching document detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHold = async () => {
    if (!doc) return;
    try {
      const response = await apiFetch(`/dms/documents/${doc.id}/legal-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: holdReason }),
      });
      if (response.ok) {
        fetchDocDetail(doc.id);
        setHoldReason('');
      }
    } catch (error) {
      console.error('Error toggling legal hold:', error);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (!confirm('Are you sure you want to permanently delete this document and all its versions?')) return;
    try {
      const response = await apiFetch(`/dms/documents/${doc.id}/delete`, {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/dms');
      } else {
        const err = await response.json();
        alert(err.message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Scanning Secure Vault...</div>;
  if (!doc) return <div className="p-12 text-center text-rose-500 font-black uppercase tracking-widest">Document not found in secure storage.</div>;

  const isLocked = doc.legal_holds.some((hold) => hold.active);
  const currentDownloadUrl = doc.download_url || doc.file_url;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="p-8 md:p-12 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20">
         <div className="flex items-center gap-6">
            <Button 
               variant="ghost" 
               onClick={() => router.back()}
               className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-navy"
            >
               <ChevronLeft size={24} />
            </Button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-heading text-brand-navy font-black tracking-tight">{doc.name}</h1>
                  {isLocked && <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 flex gap-2">
                     <Lock size={12} /> Legal Hold Active
                  </Badge>}
               </div>
               <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">DMS-ID: {doc.id.substring(0,8)}</span>
                  <span className="text-slate-200">/</span>
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">{doc.folder?.name || 'Root'}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
           {currentDownloadUrl ? (
              <Button
                variant="outline"
                className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] flex gap-2 shadow-sm"
                onClick={() => window.open(currentDownloadUrl, '_blank', 'noopener,noreferrer')}
              >
                <Download size={18} /> Download Current
              </Button>
            ) : (
              <Button variant="outline" disabled className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] flex gap-2 shadow-sm">
                <Download size={18} /> Download Current
              </Button>
            )}
            <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-navy">
               <MoreVertical size={20} />
            </Button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            
            {/* Left Column: Metadata & Controls */}
            <div className="lg:col-span-2 space-y-12">
               {/* Document Preview Placeholder */}
               <Card className="aspect-[4/3] rounded-[64px] bg-slate-50 border-none flex flex-col items-center justify-center gap-6 shadow-sm overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent"></div>
                  <FileText size={80} className="text-slate-200 group-hover:text-brand-gold transition-colors duration-700" />
                  <div className="text-center space-y-2 relative">
                     <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Secure Preview Encrypted</p>
                     <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-brand-navy gap-2 hover:bg-white/50 rounded-xl">
                        Open in Internal Viewer <ExternalLink size={14} />
                     </Button>
                  </div>
               </Card>

               {/* Activity Timeline / Comments Placeholder */}
               <div className="space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="h-4 w-1 bg-brand-gold rounded-full"></div>
                     <h3 className="text-sm font-black text-brand-navy uppercase tracking-[0.2em]">Activity Ledger</h3>
                  </div>
                  
                  <div className="space-y-6">
                     {doc.versions.map((v, i) => (
                        <div key={v.id} className="relative pl-12">
                           {i !== doc.versions.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-100"></div>}
                           <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-slate-300">
                              <History size={16} />
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black text-brand-navy">Version {v.version_no} Published</span>
                                 <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase tracking-widest border-slate-100">REV-{v.version_no}</Badge>
                              </div>
                              <p className="text-xs text-slate-400 font-medium">Synced on {new Date(v.created_at).toLocaleDateString()} by System Administrator</p>
                              {v.change_log && <div className="mt-3 p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 font-medium italic border-l-4 border-brand-gold/20 leading-relaxed max-w-xl">
                                 &quot;{v.change_log}&quot;
                              </div>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Governance & Stats */}
            <aside className="space-y-8">
               {/* Quick Stats */}
               <Card className="p-8 rounded-[48px] border-slate-50 bg-slate-50/30 space-y-8">
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest">{doc.status}</Badge>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</span>
                        <span className="text-[10px] font-black text-brand-navy uppercase tracking-widest flex items-center gap-2">
                           <Shield size={12} className="text-brand-gold" /> {doc.classification}
                        </span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention</span>
                        <span className="text-[10px] font-black text-brand-navy uppercase tracking-widest">
                           {doc.retention_policy?.name || 'Standard (7 yrs)'}
                        </span>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                           <User size={18} />
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">Custodian</p>
                           <p className="text-xs font-black text-brand-navy uppercase tracking-tight">System Admin</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                           <Calendar size={18} />
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">Creation Date</p>
                           <p className="text-xs font-black text-brand-navy uppercase tracking-tight">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                  </div>
               </Card>

               {/* Governance Panel */}
               <Card className="p-8 rounded-[48px] border-slate-100 bg-white shadow-xl shadow-brand-navy/[0.02] space-y-6">
                  <div className="flex items-center gap-3">
                     <Lock size={20} className="text-brand-gold" />
                     <h3 className="text-[11px] font-black text-brand-navy uppercase tracking-widest">Governance Suite</h3>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Hold Reason</label>
                        <textarea 
                           className="w-full rounded-2xl bg-slate-50 border-slate-100 text-xs p-4 focus:ring-brand-gold/20 min-h-[100px] font-medium" 
                           placeholder="Explain the hold requirement..."
                           value={holdReason}
                           onChange={(e) => setHoldReason(e.target.value)}
                        />
                     </div>
                     <Button 
                        className={`w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] flex gap-2 ${isLocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-brand-navy text-white shadow-lg shadow-brand-navy/10'}`}
                        onClick={handleToggleHold}
                     >
                        {isLocked ? <><Unlock size={16} /> Relieve Hold</> : <><Shield size={16} /> Apply Legal Hold</>}
                     </Button>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                     <Button 
                        variant="ghost" 
                        disabled={isLocked}
                        className={`w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] flex gap-2 ${isLocked ? 'text-slate-300' : 'text-rose-400 hover:bg-rose-50 hover:text-rose-500'}`}
                        onClick={handleDelete}
                     >
                        <Trash2 size={16} /> Discard & Destroy
                     </Button>
                     {isLocked && <p className="text-[9px] text-center text-rose-400 mt-2 font-black uppercase tracking-widest opacity-60 flex items-center justify-center gap-2">
                        <AlertCircle size={10} /> Deletion Restricted by Hold
                     </p>}
                  </div>
               </Card>
            </aside>
         </div>
      </div>
    </div>
  );
}
