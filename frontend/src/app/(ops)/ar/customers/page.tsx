"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, 
  Search, 
  Plus, 
  ChevronLeft,
  Mail,
  Phone,
  X,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

interface CustomerRecord {
  id: string;
  name: string;
  industry?: string;
  credit_limit?: number | string;
  status?: string;
  credit_on_hold?: boolean;
  credit_hold_reason?: string | null;
  dispute_count_30d?: number;
  disputed_value_30d?: number;
  has_open_disputes?: boolean;
}

interface CustomerCardProps {
  customer: CustomerRecord;
}

export default function CustomersPage() {
  const { isAuthenticated } = useAuthStore();
  const [customers, setCustomers] = React.useState<CustomerRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
  });

  const fetchCustomers = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchCustomers();
  }, [isAuthenticated, fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/ar/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage('Customer onboarded successfully.');
        setForm({ name: '', email: '', phone: '' });
        setShowForm(false);
        await fetchCustomers();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to onboard customer.');
      }
    } catch {
      setMessage('Connection error while onboarding customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ar" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Customer Directory</h1>
            <p className="text-slate-500 text-sm">Manage client relationships and verify credit worthiness.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Onboard New Client
        </button>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search customers by name, tax PIN, or account executive..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
        {customers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[32px] border-dashed">
            <Users size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-slate-500 font-heading">No customers onboarded</h3>
            <p className="text-slate-400 text-sm">Start by adding your first client to the directory.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 backdrop-blur-sm p-6">
           <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-heading text-brand-navy">Client Onboarding</h2>
                    <p className="text-slate-400 text-sm">Verify details and established credit limits.</p>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-10">
                 <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
                    <div className="space-y-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                       <label>Legal Entity Name</label>
                       <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold text-slate-700 font-medium" placeholder="Global Logistics Inc." required />
                    </div>
                    <div className="space-y-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                       <label>Email</label>
                       <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold text-slate-700 font-medium" placeholder="accounts@client.com" />
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-8 p-6 bg-brand-navy/5 rounded-3xl border border-brand-navy/10">
                       <div className="space-y-2 text-brand-navy font-black uppercase text-[10px] tracking-widest">
                          <label>Phone</label>
                          <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" placeholder="+27..." />
                       </div>
                       <div className="space-y-2 text-brand-navy font-black uppercase text-[10px] tracking-widest">
                          <label>Default Terms</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" defaultValue="Net 30">
                             <option>Net 30</option>
                             <option>Net 60</option>
                             <option>Net 90</option>
                          </select>
                       </div>
                       <div className="space-y-2 text-brand-navy font-black uppercase text-[10px] tracking-widest">
                          <label>Address</label>
                          <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" placeholder="Physical or postal address" />
                       </div>
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">{message}</div>
                    <div className="col-span-2 flex justify-end gap-4 mt-4">
                       <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400">Cancel</button>
                       <button type="submit" disabled={saving} className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-heading text-lg shadow-xl hover:opacity-90 transition-all disabled:opacity-60">
                          {saving ? 'Saving...' : 'Finalize Onboarding'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 bg-brand-navy/5 rounded-[20px] flex items-center justify-center text-brand-navy font-bold text-2xl group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
          {customer.name[0]}
        </div>
        <div className="flex flex-col items-end">
           <span className={`text-[10px] font-black px-3 py-1 rounded-full mb-2 ${
             customer.credit_on_hold
               ? 'bg-rose-50 text-rose-600'
               : customer.has_open_disputes
                 ? 'bg-amber-50 text-amber-700'
                 : 'bg-emerald-50 text-emerald-600'
           }`}>
             {customer.credit_on_hold ? 'CREDIT HOLD' : customer.has_open_disputes ? 'DISPUTE WATCH' : 'VERIFIED'}
           </span>
           <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{customer.industry || 'CLIENT'}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-heading text-brand-navy mb-4 group-hover:text-brand-gold transition-colors">{customer.name}</h3>
      
      <div className="space-y-3 mb-8">
         <div className="flex items-center gap-3 text-sm text-slate-500">
            <Mail size={16} className="text-slate-300" />
            <span className="truncate">accounts@{customer.name.toLowerCase().replace(/ /g, '')}.com</span>
         </div>
         <div className="flex items-center gap-3 text-sm text-slate-500">
            <Phone size={16} className="text-slate-300" />
            <span>+27 (0) 21 889 0012</span>
         </div>
         <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">30-day disputes</span>
              <span>{customer.dispute_count_30d || 0}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Disputed value</span>
              <span>R {Number(customer.disputed_value_30d || 0).toLocaleString()}</span>
            </div>
         </div>
         {customer.credit_hold_reason && (
           <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
             {customer.credit_hold_reason}
           </div>
         )}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-50">
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CreditCard size={12} />
            Limit
         </div>
         <div className="text-right">
           <div className="text-xs font-bold text-brand-navy">R {Number(customer.credit_limit || 0).toLocaleString()}</div>
           <div className="text-[10px] uppercase tracking-widest text-slate-400">{customer.status || 'active'}</div>
         </div>
      </div>
    </div>
  );
}
