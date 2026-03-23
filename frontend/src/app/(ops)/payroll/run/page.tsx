'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, CheckCircle, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PayrollRunPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Mock Data
  const employees = [
    { id: '1', name: 'John Doe', gross: 50000, nssf: 1080, nhif: 1200, paye: 7600, net: 40120 },
    { id: '2', name: 'Jane Smith', gross: 85000, nssf: 1080, nhif: 1500, paye: 16800, net: 65620 },
    { id: '3', name: 'Alice Jones', gross: 120000, nssf: 1080, nhif: 1700, paye: 28000, net: 89220 },
  ];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/payroll" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Process Payroll Run</h1>
            <p className="text-slate-500 text-sm mt-1">Calculate statutory deductions, approve, and export bank files.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <Badge variant={step >= 1 ? 'default' : 'outline'} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${step >= 1 ? 'bg-brand-navy text-white hover:bg-brand-navy' : 'bg-slate-50 text-slate-400 border-none'}`}>1. Setup</Badge>
           <ArrowRight className="h-4 w-4 text-slate-300" />
           <Badge variant={step >= 2 ? 'default' : 'outline'} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${step >= 2 ? 'bg-brand-navy text-white hover:bg-brand-navy' : 'bg-slate-50 text-slate-400 border-none'}`}>2. Calculate</Badge>
           <ArrowRight className="h-4 w-4 text-slate-300" />
           <Badge variant={step >= 3 ? 'default' : 'outline'} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${step >= 3 ? 'bg-brand-navy text-white hover:bg-brand-navy' : 'bg-slate-50 text-slate-400 border-none'}`}>3. Approve & Export</Badge>
        </div>
      </div>

      {step === 1 && (
        <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
           <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-xl shadow-brand-navy/5">
              <div className="mb-8 border-b border-slate-50 pb-6">
                <h3 className="text-2xl font-heading text-brand-navy font-bold mb-2">Initialize Run</h3>
                <p className="text-slate-500 text-sm">Select period and jurisdiction for processing</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-brand-navy block">Jurisdiction Engine</label>
                  <Select defaultValue="KE">
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 shadow-sm font-medium">
                      <SelectValue placeholder="Jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KE">Kenya Statutory (PAYE, NSSF, NHIF)</SelectItem>
                      <SelectItem value="ZA">South Africa Statutory (PAYE, UIF)</SelectItem>
                      <SelectItem value="ZW">Zimbabwe Statutory (PAYE, NSSA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-sm font-bold text-brand-navy block">Month</label>
                      <Select defaultValue="3">
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 shadow-sm font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="2">February</SelectItem>
                           <SelectItem value="3">March</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-sm font-bold text-brand-navy block">Year</label>
                      <Select defaultValue="2025">
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-12 shadow-sm font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                <button className="w-full mt-4 bg-brand-gold text-brand-navy font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group" onClick={() => setStep(2)}>
                   <Calculator className="h-5 w-5 group-hover:rotate-12 transition-transform" /> Start Calculation Engine
                </button>
              </div>
           </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-brand-navy/5 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-heading text-brand-navy font-bold mb-2">Calculation Review</h3>
                  <p className="text-slate-500 text-sm">Review calculated deductions before approval</p>
                </div>
                <button 
                  onClick={() => setStep(3)}
                  className="bg-brand-navy text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-brand-navy/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                   <CheckCircle className="h-5 w-5" /> Approve Run
                </button>
              </div>
              <div className="p-4 md:p-8 overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-4 font-bold tracking-wide">Employee</th>
                        <th className="p-4 font-bold tracking-wide text-right">Gross Pay</th>
                        <th className="p-4 font-bold tracking-wide text-right">NSSF</th>
                        <th className="p-4 font-bold tracking-wide text-right">NHIF</th>
                        <th className="p-4 font-bold tracking-wide text-right text-rose-500">PAYE</th>
                        <th className="p-4 font-bold tracking-wide text-right text-emerald-600">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-4 font-bold text-brand-navy">{emp.name}</td>
                           <td className="p-4 text-right font-mono text-slate-700">${emp.gross.toLocaleString()}</td>
                           <td className="p-4 text-right font-mono text-slate-400">-${emp.nssf.toLocaleString()}</td>
                           <td className="p-4 text-right font-mono text-slate-400">-${emp.nhif.toLocaleString()}</td>
                           <td className="p-4 text-right font-mono text-rose-500">-${emp.paye.toLocaleString()}</td>
                           <td className="p-4 text-right font-mono font-black text-emerald-600">${emp.net.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-xl mx-auto w-full animate-in zoom-in-95 duration-500 mt-12 mb-8">
           <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[40px] p-10 text-center shadow-2xl shadow-emerald-900/10">
              <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-emerald-100 relative">
                 <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-20"></div>
                 <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              
              <h2 className="text-4xl font-heading font-black text-emerald-900 mb-4">Payroll Approved</h2>
              <p className="text-emerald-700/80 text-sm mb-10 font-medium">The March 2025 payroll run for Kenya has been approved and securely locked.</p>
              
              <div className="grid grid-cols-2 gap-4 text-left mb-10">
                 <div className="p-6 bg-white rounded-[24px] border border-emerald-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Total Net Pay (Bank File)</div>
                    <div className="text-3xl font-heading font-bold text-emerald-900">${(194960).toLocaleString()}</div>
                 </div>
                 <div className="p-6 bg-white rounded-[24px] border border-emerald-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Total Statutory Remittance</div>
                    <div className="text-3xl font-heading font-bold text-emerald-900">${(60040).toLocaleString()}</div>
                 </div>
              </div>
              
              <Link 
                href="/payroll" 
                className="w-full block bg-white border border-emerald-200 text-emerald-700 font-bold py-4 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-center gap-3 group"
              >
                 <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" /> 
                 Download CSV Bank File
              </Link>
           </div>
        </div>
      )}

    </div>
  );
}
