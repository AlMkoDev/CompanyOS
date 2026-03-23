'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Mock data interfaces (will be replaced by API calls)
interface Jurisdiction {
  country_code: string;
  name: string;
}

interface PayrollRun {
  id: string;
  period_month: number;
  period_year: number;
  status: string;
  jurisdiction: string;
  record_count?: number;
  total_amount?: number;
}

const JURISDICTIONS: Jurisdiction[] = [
  { country_code: 'KE', name: 'Kenya' },
  { country_code: 'ZA', name: 'South Africa' },
  { country_code: 'ZW', name: 'Zimbabwe' },
];

const RECENT_RUNS: PayrollRun[] = [
  { id: '1', period_month: 2, period_year: 2025, status: 'approved', jurisdiction: 'KE', record_count: 45, total_amount: 1450000 },
  { id: '2', period_month: 2, period_year: 2025, status: 'draft', jurisdiction: 'ZA', record_count: 12, total_amount: 320000 },
];

export default function PayrollDashboard() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('KE');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'calculated': return <Badge className="bg-blue-100 text-blue-800">Calculated</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">Payroll Engine</h1>
          <p className="text-slate-500 text-sm mt-1">Manage multi-jurisdiction payroll processing and compliance.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedJurisdiction} onValueChange={(value) => setSelectedJurisdiction(value || '')}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl h-12 shadow-sm font-medium">
              <SelectValue placeholder="Select Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map(j => (
                <SelectItem key={j.country_code} value={j.country_code}>
                  {j.name} ({j.country_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link 
            href="/payroll/run" 
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            Start New Run
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500">Last Run Total (All Regions)</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><FileText size={16} /></div>
          </div>
          <div className="text-3xl font-heading font-black text-brand-navy mb-1">$142,500.00</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">January 2025</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500">Next Payroll Due</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><CheckCircle2 size={16} /></div>
          </div>
          <div className="text-3xl font-heading font-black text-brand-navy mb-1">25 {currentMonthName}</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">5 Days Remaining</p>
        </div>

         <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500">Active Employees in {selectedJurisdiction}</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><CheckCircle2 size={16} /></div>
          </div>
          <div className="text-3xl font-heading font-black text-brand-navy mb-1">45</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ready for processing</p>
        </div>
      </div>

      <div>
         <h2 className="text-2xl font-heading text-brand-navy font-bold mb-6">Recent Payroll Runs</h2>
         <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-2">
           <table className="w-full text-sm text-left">
             <thead className="text-slate-500 border-b border-slate-100">
               <tr>
                 <th className="p-6 font-bold tracking-wide">Period</th>
                 <th className="p-6 font-bold tracking-wide">Jurisdiction</th>
                 <th className="p-6 font-bold tracking-wide">Employees</th>
                 <th className="p-6 font-bold tracking-wide">Total Amount</th>
                 <th className="p-6 font-bold tracking-wide">Status</th>
                 <th className="p-6 font-bold tracking-wide text-right flex justify-end">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {RECENT_RUNS.map((run) => (
                 <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="p-6 font-bold text-brand-navy">{new Date(run.period_year, run.period_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                   <td className="p-6"><Badge variant="outline" className="font-bold shadow-none text-slate-500 border-slate-200">{run.jurisdiction}</Badge></td>
                   <td className="p-6 text-slate-600 font-medium">{run.record_count || '-'}</td>
                   <td className="p-6 font-mono text-slate-700 font-bold">{run.total_amount ? `$${run.total_amount.toLocaleString()}` : '-'}</td>
                   <td className="p-6">{getStatusBadge(run.status)}</td>
                   <td className="p-6 flex gap-2 justify-end">
                     <Button variant="ghost" size="sm" className="font-bold text-brand-navy hover:bg-slate-100 rounded-xl px-4">View</Button>
                     {run.status === 'approved' && (
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-xl" title="Download Bank File">
                          <Download className="h-4 w-4" />
                        </Button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
