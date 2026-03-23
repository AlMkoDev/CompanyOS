'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FileText, 
  Search, 
  Plus, 
  Upload, 
  ChevronRight, 
  Shield, 
  HardDrive,
  Filter,
  ArrowRight,
  History,
  Lock,
  Download,
  Eye,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

interface FolderData {
  id: string;
  name: string;
  _count: {
    documents: number;
    children: number;
  };
}

interface DocumentData {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  status: string;
  classification: string;
  version: number;
  updated_at: string;
  legal_holds: Array<{ id?: string }>;
}

export default function DMSExplorerPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Root Vault'}]);

  const fetchContent = useCallback(async (folderId: string | null) => {
    setLoading(true);
    try {
      const url = folderId ? `/api/dms/explorer/${folderId}` : '/api/dms/explorer';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching DMS content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBreadcrumbs = useCallback((folderId: string | null) => {
    if (!folderId) {
      setBreadcrumbs([{id: null, name: 'Root Vault'}]);
      return;
    }
    // In a real app, you'd fetch the folder path. For now, we'll append to existing if found or reset
    // This is a simplified version for premium "static" feel
    const currentFolder = folders.find(f => f.id === folderId);
    if (currentFolder) {
      setBreadcrumbs(prev => {
        const existingIndex = prev.findIndex(b => b.id === folderId);
        if (existingIndex !== -1) {
          return prev.slice(0, existingIndex + 1);
        }

        // Find the parent folder in breadcrumbs and add the new one.
        // This simplified logic assumes we're always navigating "down" or to root.
        // A more robust solution would involve fetching the full path from the API.
        const lastCrumb = prev[prev.length - 1];
        if (lastCrumb.id === null || folders.some(f => f.id === lastCrumb.id && f.id === folderId)) {
          return [...prev, {id: folderId, name: currentFolder.name}];
        }
        return [{id: null, name: 'Root Vault'}, {id: folderId, name: currentFolder.name}];
      });
    } else {
      // If folder not found in current list, assume it's a direct navigation and reset
      setBreadcrumbs([{id: null, name: 'Root Vault'}, {id: folderId, name: 'Loading...'}]);
    }
  }, [folders]);

  useEffect(() => {
    fetchContent(currentFolderId);
    updateBreadcrumbs(currentFolderId);
  }, [currentFolderId, fetchContent, updateBreadcrumbs]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'secret': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black text-[9px] uppercase tracking-widest px-2">Secret</Badge>;
      case 'confidential': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[9px] uppercase tracking-widest px-2">Confidential</Badge>;
      default: return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black text-[9px] uppercase tracking-widest px-2">Internal</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden animate-in fade-in duration-1000">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200/60 bg-white/80 backdrop-blur-3xl p-8 flex flex-col gap-10 hidden lg:flex relative z-20">
         <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <div className="p-2.5 bg-brand-navy text-white rounded-2xl shadow-xl shadow-brand-navy/20">
                  <HardDrive size={22} className="text-brand-gold" />
               </div>
               <div>
                  <h2 className="text-sm font-black text-brand-navy tracking-tight uppercase">Storage Vault</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Cloud</p>
               </div>
            </div>

            <nav className="space-y-1.5">
               <button 
                onClick={() => setCurrentFolderId(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group ${!currentFolderId ? 'bg-brand-navy text-white shadow-2xl shadow-brand-navy/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
               >
                 <Folder size={18} className={!currentFolderId ? 'text-brand-gold' : 'text-slate-300 group-hover:text-slate-400'} />
                 Root Directory
               </button>
               {/* Quick filters */}
               <div className="pt-4 space-y-1">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] px-4 mb-2">Filters</p>
                  {['Recent', 'Starred', 'Shared', 'Archived'].map(item => (
                    <button key={item} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                       <div className="w-4 h-4 rounded-md border-2 border-slate-200" />
                       {item}
                    </button>
                  ))}
               </div>
            </nav>
         </div>

         <div className="mt-auto p-8 rounded-[40px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 to-brand-navy text-white space-y-6 shadow-2xl shadow-brand-navy/30 relative overflow-hidden group">
            <Shield size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <Lock size={18} className="text-brand-gold" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Security Protocol</span>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed font-medium uppercase tracking-tighter">
                 AES-256 Encrypted at rest. Subject to Verdant Fields retention policy VF-ADM-R01.
              </p>
              <Button className="w-full h-11 bg-brand-gold text-brand-navy hover:bg-white hover:scale-102 border-none rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-gold/10 transition-all">
                 Security Audit
              </Button>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative z-10 shadow-[-40px_0_80px_rgba(0,0,0,0.02)]">
        <header className="p-10 md:px-12 md:py-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 shrink-0 relative bg-white/80 backdrop-blur-md">
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   {breadcrumbs.map((crumb, idx) => (
                     <React.Fragment key={idx}>
                       <button 
                         onClick={() => setCurrentFolderId(crumb.id)}
                         className={`text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-navy transition-colors ${idx === breadcrumbs.length - 1 ? 'text-brand-navy bg-slate-50 px-3 py-1.5 rounded-lg' : 'text-slate-300'}`}
                       >
                         {crumb.name}
                       </button>
                       {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-slate-200" />}
                     </React.Fragment>
                   ))}
                 </div>
              </div>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-brand-navy tracking-tighter uppercase italic">Document Vault</h1>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">Verified Organizational Intelligence Repository</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group w-72">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-navy transition-colors pointer-events-none" size={18} />
                 <input 
                   placeholder="Search secure metadata..." 
                   className="w-full h-14 pl-12 pr-6 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-brand-navy/5 outline-none transition-all font-medium text-xs shadow-inner" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <div className="flex gap-2">
                <Button className="h-14 px-8 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-95 transition-all">
                   <Plus size={20} className="mr-2" /> New Folder
                </Button>
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 bg-white text-brand-navy font-black uppercase tracking-[0.2em] text-[10px] hover:border-brand-navy/20 hover:bg-slate-50 transition-all flex gap-2 active:scale-95 shadow-lg shadow-slate-100/50">
                   <Upload size={18} /> Deploy Record
                </Button>
              </div>
           </div>
        </header>

        <section className="flex-1 p-10 md:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-white to-slate-50/50">
           <div className="max-w-[1600px] mx-auto space-y-12">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-6">
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Directory Explorer</h3>
                    <div className="h-4 w-[1px] bg-slate-100" />
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{folders.length + documents.length} Items Indexed</div>
                 </div>
                 <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-navy shadow-lg shadow-black/5 scale-105' : 'text-slate-300 hover:text-slate-600'}`}
                    >
                       <Filter size={18} />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-navy shadow-lg shadow-black/5 scale-105' : 'text-slate-300 hover:text-slate-600'}`}
                    >
                       <ClipboardList size={18} />
                    </button>
                 </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="h-56 bg-white border border-slate-50 rounded-[48px] animate-pulse"></div>
                   ))}
                </div>
              ) : (
                <div className="space-y-16">
                   {/* Folders Section */}
                   {folders.length > 0 && (
                     <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                           {folders.map(folder => (
                             <button 
                               key={folder.id}
                               onClick={() => setCurrentFolderId(folder.id)}
                               className="group p-8 rounded-[56px] bg-white border border-slate-50 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-2 transition-all duration-700 text-left flex flex-col gap-6 relative overflow-hidden active:scale-95"
                             >
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <ChevronRight size={16} className="text-brand-gold animate-bounce" />
                                </div>
                                <div className="w-16 h-16 bg-brand-gold/5 text-brand-gold rounded-[24px] flex items-center justify-center group-hover:bg-brand-gold group-hover:text-white group-hover:rotate-12 transition-all duration-700 shadow-sm">
                                   <Folder size={32} fill="currentColor" className="opacity-80" />
                                </div>
                                <div>
                                   <div className="text-sm font-black text-brand-navy truncate uppercase tracking-tight leading-none group-hover:text-brand-gold transition-colors">{folder.name}</div>
                                   <div className="text-[9px] font-black text-slate-300 mt-2 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      {folder._count.documents} Records Indexed
                                   </div>
                                </div>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}

                   {/* Documents Section */}
                   <div className="space-y-8">
                      {documents.length > 0 ? (
                        viewMode === 'grid' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                             {documents.map(doc => (
                               <Card key={doc.id} className="p-10 rounded-[64px] border-white/50 bg-white shadow-2xl shadow-slate-200/40 hover:shadow-3xl hover:shadow-brand-navy/10 hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden flex flex-col gap-8">
                                  <div className="flex justify-between items-start relative z-10">
                                     <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-brand-navy group-hover:rotate-[-8deg] transition-all duration-700 shadow-inner">
                                        <FileText size={32} />
                                     </div>
                                     <div className="flex flex-col items-end gap-3">
                                        {getClassificationBadge(doc.classification)}
                                        {doc.legal_holds.length > 0 && (
                                          <div className="bg-rose-500 text-white rounded-full p-2 shadow-lg shadow-rose-200 animate-pulse"><Lock size={12} /></div>
                                        )}
                                     </div>
                                  </div>

                                  <div className="flex-1 space-y-3 relative z-10">
                                     <h4 className="text-lg font-black text-brand-navy leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-brand-gold transition-colors">
                                        {doc.name}
                                     </h4>
                                     <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        <span className="bg-slate-50 px-2 py-1 rounded">.{doc.file_type.split('/')[1] || 'DOC'}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span>{formatSize(doc.size_bytes)}</span>
                                     </div>
                                  </div>

                                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                                     <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                        <History size={14} className="text-slate-200" />
                                        Revision 0{doc.version}
                                     </div>
                                     <div className="flex gap-3">
                                       <Link href={`/dms/${doc.id}`}>
                                         <button className="h-11 w-11 bg-slate-50 text-slate-400 hover:text-brand-navy hover:bg-white hover:shadow-xl hover:shadow-black/5 rounded-2xl flex items-center justify-center transition-all duration-500">
                                           <Eye size={20} />
                                         </button>
                                       </Link>
                                       <button className="h-11 w-11 bg-slate-50 text-slate-400 hover:text-brand-navy hover:bg-white hover:shadow-xl hover:shadow-black/5 rounded-2xl flex items-center justify-center transition-all duration-500">
                                           <Download size={20} />
                                        </button>
                                     </div>
                                  </div>
                               </Card>
                             ))}
                          </div>
                        ) : (
                          <div className="backdrop-blur-xl bg-white/80 rounded-[48px] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
                             <table className="w-full text-left border-collapse">
                               <thead>
                                  <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                     <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Record Integrity</th>
                                     <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Classification</th>
                                     <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Specifications</th>
                                     <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Actions</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {documents.map(doc => (
                                    <tr key={doc.id} className="group hover:bg-indigo-50/30 transition-all cursor-pointer">
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-5">
                                             <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-brand-navy group-hover:bg-white group-hover:shadow-sm transition-all duration-500">
                                                <FileText size={20} />
                                             </div>
                                             <div>
                                                <div className="text-sm font-black text-brand-navy uppercase tracking-tight group-hover:text-brand-gold transition-colors">{doc.name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Archived {new Date(doc.updated_at).toLocaleDateString()}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          {getClassificationBadge(doc.classification)}
                                       </td>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400">
                                             <span className="uppercase">{doc.file_type.split('/')[1] || 'PDF'}</span>
                                             <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                             <span>{formatSize(doc.size_bytes)}</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6 text-right">
                                          <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                             <button className="p-3 bg-white text-slate-300 hover:text-brand-navy hover:shadow-xl hover:shadow-black/5 rounded-xl border border-slate-50 transition-all">
                                                <Eye size={18} />
                                             </button>
                                             <button className="p-3 bg-white text-slate-300 hover:text-brand-navy hover:shadow-xl hover:shadow-black/5 rounded-xl border border-slate-50 transition-all">
                                                <Download size={18} />
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                  ))}
                               </tbody>
                             </table>
                          </div>
                        )
                      ) : (
                        <div className="py-40 text-center bg-slate-50/50 rounded-[80px] border-4 border-dashed border-slate-100/50 flex flex-col items-center justify-center animate-pulse">
                           <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center text-slate-200 mb-8 shadow-xl shadow-slate-200/20">
                              <HardDrive size={40} className="rotate-12" />
                           </div>
                           <h4 className="text-2xl font-black text-brand-navy uppercase tracking-widest italic">Vault Empty</h4>
                           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-4 max-w-sm leading-relaxed">No encrypted records identified in this directory level. Initiate a secure upload to populate.</p>
                           <Button className="mt-10 h-12 px-10 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all">
                              Deploy First Record
                           </Button>
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </section>

        {/* Status Footer */}
        <footer className="flex items-center justify-between pt-6 border-t border-slate-200">
          <div className="text-[10px] text-slate-500">
            Total Documents: {documents.length}
          </div>
          <Button variant="ghost" className="text-[10px] font-black text-brand-gold uppercase tracking-widest gap-2">
            Advanced Permissions <ArrowRight size={14} />
          </Button>
        </footer>
      </main>
    </div>
  );
}
