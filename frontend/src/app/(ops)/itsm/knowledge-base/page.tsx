'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Plus,
  Eye,
  Clock,
  HelpCircle,
  FileText,
  Lightbulb,
  Zap,
  Star as StarIcon
} from 'lucide-react';
import Link from 'next/link';

type CategoryIcon = React.ComponentType<{ size?: number; className?: string }>;

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  created_at: string;
  author: { first_name: string; last_name: string };
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: CategoryIcon }> = {
  Troubleshooting: { color: 'bg-rose-100 text-rose-600', icon: Lightbulb },
  'User Guide': { color: 'bg-indigo-100 text-indigo-600', icon: BookOpen },
  'Policy': { color: 'bg-slate-100 text-slate-600', icon: FileText },
  'Quick Fix': { color: 'bg-amber-100 text-amber-600', icon: Zap },
};

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/itsm/knowledge');
      if (response.ok) {
        setArticles(await response.json());
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50/20 p-8 space-y-10 pb-32 max-w-[1800px] mx-auto overflow-x-hidden animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-6 mb-4">
            <Link href="/modules/itsm">
              <Button variant="ghost" className="h-14 w-14 rounded-[22px] bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50 border border-slate-100 transition-all active:scale-90 p-0">
                 <ArrowLeft size={24} className="text-slate-400" />
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest">
              <BookOpen className="w-3 h-3 text-blue-500" />
              IT Intelligence Repository
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
            Knowledge Base
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <HelpCircle size={20} className="text-slate-300" />
              <span>{articles.length} Solutions available</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 text-blue-600 font-black text-sm uppercase tracking-widest">
              <StarIcon size={20} />
              <span>Community Rated Excellence</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100/50 bg-white">
            Help Center
          </Button>
          <Button className="h-14 px-10 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 flex gap-3">
            <Plus size={20} />
            Create Article
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-[calc(100vh-350px)]">
        {/* Sidebar: List */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-600 transition-colors" size={16} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solutions..." 
                className="w-full h-14 pl-12 rounded-2xl border-slate-100 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all border outline-none text-xs font-bold" 
              />
           </div>

           <div className="space-y-4">
              {loading ? (
                 [1,2,3,4].map(i => (
                    <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
                 ))
              ) : filteredArticles.length === 0 ? (
                 <div className="py-20 text-center opacity-30">
                    <Search size={48} className="mx-auto mb-4" />
                    <div className="text-xs font-black uppercase tracking-widest">No matching articles</div>
                 </div>
              ) : (
                filteredArticles.map(article => (
                  <Card 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    className={`p-6 border-white/40 shadow-xl rounded-3xl cursor-pointer transition-all duration-500 group relative overflow-hidden ${selectedArticle?.id === article.id ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-white/70 hover:bg-white'}`}
                  >
                    <div className="space-y-4 relative z-10">
                       <div className="flex items-center justify-between">
                          <Badge className={`${selectedArticle?.id === article.id ? 'bg-white/20 text-white' : (CATEGORY_CONFIG[article.category]?.color || 'bg-slate-100 text-slate-600')} border-0 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full`}>
                             {article.category}
                          </Badge>
                          <div className={`text-[9px] font-bold flex items-center gap-1 ${selectedArticle?.id === article.id ? 'text-white/60' : 'text-slate-400'}`}>
                             <Eye size={12} /> {article.views} views
                          </div>
                       </div>
                       <h3 className="text-lg font-black leading-tight uppercase tracking-tight">{article.title}</h3>
                       <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${selectedArticle?.id === article.id ? 'text-white/40' : 'text-slate-400'}`}>
                          <Clock size={12} />
                          Updated 2 days ago
                       </div>
                    </div>
                  </Card>
                ))
              )}
           </div>
        </div>

        {/* content View */}
        <div className="lg:col-span-8">
           {selectedArticle ? (
              <Card className="h-full border-white/40 shadow-2xl shadow-slate-200/40 rounded-[44px] bg-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-700">
                 <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">{selectedArticle.title}</h2>
                       <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                {selectedArticle.author.first_name[0]}
                             </div>
                             {selectedArticle.author.first_name} {selectedArticle.author.last_name}
                          </div>
                          <div className="h-3 w-[1px] bg-slate-200" />
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <Clock size={12} />
                             {new Date(selectedArticle.created_at).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button variant="ghost" className="h-12 w-12 rounded-xl border border-slate-100 hover:bg-slate-50">
                          <StarIcon size={18} className="text-slate-300" />
                       </Button>
                       <Button variant="outline" className="h-12 px-6 rounded-xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest">
                          Edit Article
                       </Button>
                    </div>
                 </div>
                 
                 <div className="p-12 overflow-y-auto flex-1 prose prose-slate max-w-none">
                    <div className="space-y-8">
                       <p className="text-slate-600 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                          {selectedArticle.content}
                       </p>
                       
                       <div className="flex flex-wrap gap-2 pt-10 border-t border-slate-100">
                          {selectedArticle.tags.map(tag => (
                             <Badge key={tag} className="bg-slate-100 text-slate-500 border-0 font-bold text-[10px] px-3 py-1 rounded-lg">#{tag}</Badge>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Was this solution helpful?</div>
                    <div className="flex items-center gap-4">
                       <Button variant="outline" className="h-10 px-8 rounded-xl bg-white border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all">Yes, Resolved</Button>
                       <Button variant="outline" className="h-10 px-8 rounded-xl bg-white border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all">No, Need Agent</Button>
                    </div>
                 </div>
              </Card>
           ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30 space-y-6">
                 <div className="w-32 h-32 rounded-[40px] bg-slate-100 flex items-center justify-center border-4 border-dashed border-slate-200">
                    <HelpCircle size={64} className="text-slate-400" />
                 </div>
                 <div className="space-y-2">
                    <div className="text-2xl font-black uppercase tracking-[0.2em] text-slate-500 italic">Select an Intelligence Asset</div>
                    <p className="max-w-md mx-auto text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Choose a troubleshooting guide or technical manual from the list to view its contents and metadata.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
