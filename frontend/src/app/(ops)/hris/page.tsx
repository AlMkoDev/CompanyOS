'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus,
  Mail,
  Building2,
  ExternalLink,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface Employee {
  id: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  department: { name: string } | null;
  position: { title: string } | null;
  avatar_url: string | null;
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setEmployees([
        {
          id: '1',
          emp_no: 'EMP-0001',
          first_name: 'Sarah',
          last_name: 'Verdant',
          email: 'sarah.v@verdantfields.com',
          phone: '+254 712 345 678',
          status: 'active',
          department: { name: 'Executive' },
          position: { title: 'Managing Director' },
          avatar_url: null,
        },
        {
          id: '2',
          emp_no: 'EMP-0002',
          first_name: 'James',
          last_name: 'Makokha',
          email: 'james.m@verdantfields.com',
          phone: '+254 722 987 654',
          status: 'probation',
          department: { name: 'Operations' },
          position: { title: 'Farm Manager' },
          avatar_url: null,
        },
        {
          id: '3',
          emp_no: 'EMP-0003',
          first_name: 'Grace',
          last_name: 'Nyambura',
          email: 'grace.n@verdantfields.com',
          phone: '+254 733 111 222',
          status: 'active',
          department: { name: 'Finance' },
          position: { title: 'Head of Finance' },
          avatar_url: null,
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Active</Badge>;
      case 'probation': return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Probation</Badge>;
      case 'terminated': return <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Terminated</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3 py-1 font-black uppercase tracking-tighter text-[10px]">{status}</Badge>;
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.emp_no.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 bg-brand-gold rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight">Employee Directory</h1>
          </div>
          <p className="text-slate-400 font-medium text-base ml-4">Advanced personnel intelligence and organizational mapping.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-[20px] border-slate-200 font-bold hover:bg-slate-50 transition-all flex gap-3 shadow-sm active:scale-95">
            <Filter size={18} className="text-brand-navy" /> <span className="text-slate-600">Advanced Filters</span>
          </Button>
          <Button className="h-14 px-8 rounded-[20px] bg-brand-navy border-none font-bold text-white shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 hover:-translate-y-0.5 transition-all flex gap-3 active:scale-95">
            <UserPlus size={18} className="text-brand-gold" /> Add New Employee
          </Button>
        </div>
      </div>

      <div className="relative group max-w-4xl">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-brand-navy transition-colors">
          <Search size={22} />
        </div>
        <Input 
          placeholder="Search by name, ID, or department..." 
          className="h-20 pl-16 bg-white border-slate-100 rounded-[30px] shadow-sm text-xl font-medium focus-visible:ring-brand-navy/10 focus-visible:border-brand-navy transition-all placeholder:text-slate-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-[420px] bg-white animate-pulse rounded-[48px] border border-slate-100 shadow-sm"></div>
          ))
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <Card key={emp.id} className="relative group overflow-visible border-slate-100 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-brand-navy/10 transition-all duration-500 border-2 hover:border-brand-navy/5 bg-white">
              <div className="p-10 flex flex-col h-full">
                {/* Header: Avatar and ID */}
                <div className="flex justify-between items-start mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden shadow-inner">
                      {emp.avatar_url ? (
                        <Image src={emp.avatar_url} alt={emp.first_name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <Users size={40} className="text-slate-200" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-md border border-slate-50 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-500 text-brand-navy">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Status</div>
                    {getStatusBadge(emp.status)}
                  </div>
                </div>

                {/* Identity */}
                <div className="mb-8">
                  <h3 className="text-3xl font-heading font-black text-brand-navy mb-2 tracking-tight group-hover:text-brand-gold transition-colors duration-300">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-brand-navy text-white text-[10px] font-black rounded-lg tracking-widest uppercase">
                       {emp.emp_no}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <Briefcase size={12} className="text-brand-gold" />
                      {emp.position?.title ?? 'No Position'}
                    </div>
                  </div>
                </div>

                {/* Contact & Meta */}
                <div className="space-y-4 mb-10 mt-auto">
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:bg-brand-gold/10 group-hover/item:text-brand-gold transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 truncate group-hover/item:text-brand-navy transition-colors">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:bg-brand-gold/10 group-hover/item:text-brand-gold transition-colors duration-300">
                      <Building2 size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover/item:text-brand-navy transition-colors">{emp.department?.name ?? 'Unassigned'}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-8 border-t border-slate-50">
                  <Link 
                    href={`/hris/employees/${emp.id}`}
                    className="flex items-center justify-between group/btn bg-slate-50 hover:bg-brand-navy p-4 rounded-3xl transition-all duration-300 overflow-hidden relative"
                  >
                    <span className="font-black uppercase tracking-widest text-[11px] text-brand-navy group-hover/btn:text-white transition-colors relative z-10">
                      Access Personnel File
                    </span>
                    <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:bg-brand-gold transition-all duration-300 relative z-10 group-hover/btn:translate-x-1">
                      <ArrowRight size={18} className="text-brand-navy group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-brand-navy translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[64px] border-2 border-dashed border-slate-100 shadow-inner">
             <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-6 shadow-sm">
              <Search size={48} strokeWidth={1.5} />
             </div>
             <h3 className="text-3xl font-heading font-black text-brand-navy mb-2">No personnel found</h3>
             <p className="text-slate-400 font-medium text-lg">Adjust your search parameters or try a clear filter.</p>
             <Button 
                variant="ghost" 
                className="mt-8 font-black uppercase tracking-widest text-brand-gold hover:text-brand-navy"
                onClick={() => setSearch('')}
              >
               Clear Search Results
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}
