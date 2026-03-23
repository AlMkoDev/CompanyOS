'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  FileText,
  ShieldCheck,
  Download,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EmployeeProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'documents'>('profile');
  
  // Mock data
  const employee = {
    id: params.id,
    emp_no: 'EMP-0001',
    first_name: 'Sarah',
    last_name: 'Verdant',
    email: 'sarah.v@verdantfields.com',
    phone: '+254 712 345 678',
    status: 'active',
    department: 'Executive',
    position: 'Managing Director',
    hire_date: '2022-01-15',
    national_id: 'ID-98765432',
    address: 'Muthaiga, Nairobi, Kenya',
    kra_pin: 'A001234567Z',
    employment_type: 'Full-time'
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-32">
      <div className="flex items-center gap-4">
        <Link href="/hris" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">{employee.first_name} {employee.last_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 font-bold rounded-lg uppercase tracking-tighter text-[10px]">Active</Badge>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{employee.emp_no}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[40px] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <div className="h-32 bg-brand-navy relative">
              <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-[32px] p-1 shadow-xl">
                 <div className="w-full h-full bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300">
                    <Calendar size={32} />
                 </div>
              </div>
            </div>
            <div className="pt-16 p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <Mail size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email</label>
                    <span className="text-sm font-bold text-brand-navy">{employee.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <Phone size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone</label>
                    <span className="text-sm font-bold text-brand-navy">{employee.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Primary Address</label>
                    <span className="text-xs font-bold text-slate-500">{employee.address}</span>
                  </div>
                </div>
              </div>
              <Button className="w-full h-14 bg-brand-navy rounded-2xl font-bold shadow-lg">Edit Profile</Button>
            </div>
          </Card>

          <Card className="rounded-[32px] border-slate-100 p-8 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Employment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">D.O.H</label>
                <div className="text-sm font-bold text-brand-navy">{employee.hire_date}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Type</label>
                <div className="text-sm font-bold text-brand-navy">{employee.employment_type}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 p-2 bg-slate-100/50 rounded-3xl border border-slate-100 self-start">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Job History
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'documents' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Documents
            </button>
          </div>

          <Card className="rounded-[40px] border-slate-100 p-8 md:p-12 min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                <section>
                  <h3 className="text-2xl font-heading font-bold text-brand-navy mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Briefcase size={20} /></div>
                    Current Assignment
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</label>
                      <div className="text-lg font-bold text-slate-700">{employee.department}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Position</label>
                      <div className="text-lg font-bold text-slate-700">{employee.position}</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-heading font-bold text-brand-navy mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><ShieldCheck size={20} /></div>
                    Statutory Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">National ID No.</label>
                      <div className="text-lg font-bold text-slate-700 font-mono tracking-tighter">{employee.national_id}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">KRA PIN</label>
                      <div className="text-lg font-bold text-slate-700 font-mono tracking-tighter">{employee.kra_pin}</div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {[1].map(i => (
                  <div key={i} className="flex gap-6 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-brand-navy shadow-sm relative z-10 font-bold">1</div>
                      <div className="w-0.5 h-20 bg-slate-50 mt-2"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">Promoted to Managing Director</h4>
                      <div className="text-slate-400 text-sm font-bold flex gap-2 items-center italic">
                        <span>Jan 2022</span>
                        <ArrowLeft size={12} className="rotate-180" />
                        <span>Present</span>
                      </div>
                      <p className="mt-2 text-slate-500 text-sm font-medium">Head of overall company operations and strategy.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-heading font-bold text-brand-navy">Vault</h3>
                   <Button variant="outline" className="rounded-xl border-slate-200 flex gap-2 font-bold h-11">
                    <Plus size={16} /> Upload New
                   </Button>
                </div>
                {[
                  { name: 'EmploymentContract_SarahV.pdf', type: 'Contract', date: '2022-01-15' },
                  { name: 'KRA_ComplianceCert.pdf', type: 'Statutory', date: '2024-03-01' },
                ].map((doc, i) => (
                  <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-slate-50 transition-all hover:border-brand-navy/10 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-navy transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-brand-navy mb-0.5">{doc.name}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span className="text-brand-navy/60 bg-brand-navy/5 px-2 rounded-md">{doc.type}</span>
                          <span>Uploaded: {doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-brand-navy hover:bg-white shadow-sm transition-all border border-transparent hover:border-slate-100">
                      <Download size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
