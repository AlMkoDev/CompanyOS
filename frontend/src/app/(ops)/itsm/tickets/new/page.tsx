'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Send,
  Ticket,
  AlertCircle,
  Laptop,
  CheckCircle2,
  Box,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ITAssetOption {
  id: string;
  asset_tag: string;
  name: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [assets, setAssets] = useState<ITAssetOption[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'P3',
    category: 'Hardware',
    asset_id: ''
  });

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/itsm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/modules/itsm');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50/20 p-8 pb-32 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-6 mb-12">
        <Link href="/modules/itsm">
          <Button variant="ghost" className="h-14 w-14 rounded-[22px] bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50 border border-slate-100 transition-all active:scale-90 p-0">
             <ArrowLeft size={24} className="text-slate-400" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
            Raise Request
            <Ticket className="text-blue-500" size={32} />
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Desk Orchestration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-10 border-white/40 shadow-2xl shadow-blue-200/20 rounded-[44px] bg-white/70 backdrop-blur-xl space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Send size={160} />
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ticket Subject</label>
                  <Input 
                    required
                    placeholder="e.g., VPN Access Issue or Laptop Screen Flickering"
                    className="h-16 rounded-3xl border-slate-100 bg-white shadow-inner px-6 text-sm font-bold placeholder:text-slate-300 focus-visible:ring-blue-500/20"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Detailed Description</label>
                  <Textarea 
                    required
                    placeholder="Please provide steps to reproduce, error codes, or specific requirements..."
                    className="min-h-48 rounded-[32px] border-slate-100 bg-white shadow-inner px-6 py-6 text-sm font-medium placeholder:text-slate-300 focus-visible:ring-blue-500/20 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
             </div>
          </Card>

          <Card className="p-10 border-white/40 shadow-2xl shadow-indigo-200/20 rounded-[44px] bg-white/70 backdrop-blur-xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                   <Laptop size={24} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Linked Assets</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optional: Associate this ticket with a configuration item</p>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Select Primary Asset</label>
                <Select onValueChange={(v) => setFormData({ ...formData, asset_id: v })}>
                  <SelectTrigger className="h-16 rounded-3xl border-slate-100 bg-white shadow-sm px-6 text-sm font-bold">
                    <SelectValue placeholder="Choose an asset from inventory..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id} className="h-12 rounded-xl">
                        {asset.asset_tag} - {asset.name}
                      </SelectItem>
                    ))}
                    {assets.length === 0 && (
                      <SelectItem value="none" disabled className="h-12 text-slate-400">No assets found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
             </div>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="p-10 border-white/40 shadow-2xl shadow-blue-200/20 rounded-[44px] bg-slate-900 text-white space-y-10 relative overflow-hidden group">
             <div className="absolute top-[-40px] right-[-40px] bg-blue-500/10 w-48 h-48 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
             
             <div className="space-y-10 opacity-100 transition-opacity">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <AlertCircle size={14} />
                    Urgency Parameters
                  </div>
                  <Select onValueChange={(v) => setFormData({ ...formData, priority: v })} defaultValue="P3">
                    <SelectTrigger className="h-16 rounded-3xl border-white/10 bg-white/5 shadow-inner px-6 text-sm font-black uppercase tracking-widest outline-none border-none">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white shadow-2xl">
                      <SelectItem value="P1" className="h-12 rounded-xl focus:bg-rose-500/20 text-rose-400 font-black">P1 - CRITICAL (4h)</SelectItem>
                      <SelectItem value="P2" className="h-12 rounded-xl focus:bg-orange-500/20 text-orange-400 font-black">P2 - HIGH (8h)</SelectItem>
                      <SelectItem value="P3" className="h-12 rounded-xl focus:bg-amber-500/20 text-amber-400 font-black">P3 - MEDIUM (24h)</SelectItem>
                      <SelectItem value="P4" className="h-12 rounded-xl focus:bg-blue-500/20 text-blue-400 font-black">P4 - LOW (48h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Layers size={14} />
                    Service Category
                  </div>
                  <Select onValueChange={(v) => setFormData({ ...formData, category: v })} defaultValue="Hardware">
                    <SelectTrigger className="h-16 rounded-3xl border-white/10 bg-white/5 shadow-inner px-6 text-sm font-black uppercase tracking-widest outline-none border-none">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white shadow-2xl">
                      <SelectItem value="Hardware" className="h-12 rounded-xl">Hardware</SelectItem>
                      <SelectItem value="Software" className="h-12 rounded-xl">Software</SelectItem>
                      <SelectItem value="Network" className="h-12 rounded-xl">Network</SelectItem>
                      <SelectItem value="Access" className="h-12 rounded-xl">Access/IAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  disabled={submitting}
                  className="w-full h-20 rounded-[32px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20 group/btn transition-all duration-500"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-4">
                      Submit Request
                      <div className="w-10 h-10 rounded-2xl bg-blue-400/20 flex items-center justify-center group-hover/btn:rotate-12 transition-transform duration-500">
                         <Send size={20} />
                      </div>
                    </div>
                  )}
                </Button>
             </div>
          </Card>

          <div className="px-8 space-y-6">
             <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                   <CheckCircle2 size={16} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Tickets are tracked in real-time against statutory SLA deadlines.</p>
             </div>
             <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                   <Box size={16} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Automatic escalation triggered if resolution exceeds priority threshold.</p>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
