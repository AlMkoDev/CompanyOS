"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Building2, 
  Search, 
  Plus, 
  ChevronLeft,
  Mail,
  Phone,
  X
} from 'lucide-react';
import Link from 'next/link';

interface VendorRecord {
  id: string;
  name: string;
  tier?: string;
  payment_terms?: string;
}

interface VendorCardProps {
  vendor: VendorRecord;
}

export default function VendorsPage() {
  const { isAuthenticated } = useAuthStore();
  const [vendors, setVendors] = React.useState<VendorRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await apiFetch('/ap/vendors');
        if (res.ok) setVendors(await res.json());
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchVendors();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ap" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Vendor Partners</h1>
            <p className="text-slate-500 text-sm">Centralized directory of verified suppliers and service providers.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Onboard New Vendor
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search vendors by name, registration, or tax PIN..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all text-sm font-medium"
        />
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
        {vendors.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[32px] border-dashed">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 size={32} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-heading text-slate-500 mb-2">No vendors found</h3>
             <p className="text-slate-400 text-sm">Start by onboarding your first supply chain partner.</p>
          </div>
        )}
      </div>

      {/* Onboarding Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 backdrop-blur-sm p-6">
           <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-heading text-brand-navy">Vendor Onboarding Intelligence</h2>
                    <p className="text-slate-400 text-sm">Capture essential compliance and financial parameters.</p>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-10">
                 <form className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Legal Entity Name</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold" placeholder="e.g. Agri-Fuel Global Inc." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tax PIN / Registration</label>
                       <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold" placeholder="e.g. TAX-884-299" />
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-8 p-6 bg-brand-navy/5 rounded-3xl border border-brand-navy/10">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-brand-navy tracking-widest">Bank Name</label>
                          <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" placeholder="e.g. First National" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-brand-navy tracking-widest">Account Number</label>
                          <input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" placeholder="e.g. 1044992003" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-brand-navy tracking-widest">Payment Terms</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none">
                             <option>Net 30</option>
                             <option>Due on Receipt</option>
                             <option>Net 60</option>
                          </select>
                       </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-4 mt-4">
                       <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                       <button type="submit" className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-heading text-lg shadow-xl hover:opacity-90 transition-all">
                          Finalize Onboarding
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

function VendorCard({ vendor }: VendorCardProps) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-brand-navy font-bold text-2xl group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
          {vendor.name[0]}
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full mb-2">ACTIVE</span>
           <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{vendor.tier || 'Standard Supplier'}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-heading text-brand-navy mb-4 group-hover:text-brand-gold transition-colors">{vendor.name}</h3>
      
      <div className="space-y-3 mb-8">
         <div className="flex items-center gap-3 text-sm text-slate-500">
            <Mail size={16} className="text-slate-300" />
            <span className="truncate">contact@{vendor.name.toLowerCase().replace(/ /g, '')}.com</span>
         </div>
         <div className="flex items-center gap-3 text-sm text-slate-500">
            <Phone size={16} className="text-slate-300" />
            <span>+27 (0) 11 445 6678</span>
         </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-50">
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Terms</div>
         <div className="text-xs font-bold text-brand-navy">{vendor.payment_terms || 'Net 30'}</div>
      </div>
    </div>
  );
}
