"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Download,
  Share2,
  MessageSquare,
  UserCheck,
  Zap,
  Lock,
  Mail,
  Smartphone,
  Calendar
} from 'lucide-react';

interface ContractMetadata {
  [key: string]: string | number | boolean | null;
}

interface ContractApproval {
  id: string;
  step: number;
  status: string;
  comment?: string;
  approver: {
    first_name: string;
    last_name: string;
  };
}

interface ContractSignature {
  id: string;
}

interface ContractAuditLog {
  id: string;
  action: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface Contract {
  id: string;
  title: string;
  party_name: string;
  category: string;
  status: string;
  value: number | null;
  start_date: string;
  end_date: string | null;
  metadata: ContractMetadata;
  owner: {
    first_name: string;
    last_name: string;
  };
  approvals: ContractApproval[];
  signatures: ContractSignature[];
  auditLogs: ContractAuditLog[];
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);

  const fetchContract = React.useCallback(async () => {
    try {
      const resp = await fetch(`/api/clm/contracts/${id}`);
      const data = await resp.json();
      setContract(data);
    } catch (err) {
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/clm/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });
      fetchContract();
    } catch (err) {
      console.error('Error deciding approval:', err);
    }
  };

  const handleSign = async () => {
    try {
      await fetch(`/api/clm/contracts/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Manager User',
          email: 'manager@verdantfields.com',
          ip: '192.168.1.1',
          userAgent: navigator.userAgent
        }),
      });
      setShowSignModal(false);
      fetchContract();
    } catch (err) {
      console.error('Error signing contract:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'signed':
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'approved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sent':
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-medium">Loading Agreement...</div>;
  if (!contract) return <div className="p-20 text-center text-rose-500 font-bold">Agreement not found.</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/strategy/clm/registry')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Registry
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 bg-white">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white font-semibold text-slate-700 shadow-sm text-sm">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          {contract.status === 'approved' && (
            <button 
              onClick={() => setShowSignModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Sign Agreement
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full">
        {/* Left: Contract Details & Preview */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[800px]">
            {/* Header Info */}
            <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-white sticky top-0 z-10">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">#{contract.id.split('-')[0].toUpperCase()}</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{contract.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                      {contract.owner.first_name[0]}{contract.owner.last_name[0]}
                    </div>
                    <span className="text-slate-600 font-semibold">{contract.owner.first_name} {contract.owner.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>Effective: {new Date(contract.start_date).toLocaleDateString()}</span>
                  </div>
                  {contract.value && (
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <Zap className="w-4 h-4 fill-indigo-100" />
                      <span>Value: ${contract.value.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck className="w-10 h-10 text-emerald-500/20" />
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Compliance State</div>
                  <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    Verified Secure
                  </div>
                </div>
              </div>
            </div>

            {/* Mock PDF Viewer */}
            <div className="flex-1 bg-slate-100 p-12 overflow-y-auto flex justify-center">
              <div className="w-[850px] min-h-[1100px] bg-white shadow-2xl rounded-sm p-16 font-serif text-slate-800 space-y-8 relative">
                {/* Watermark Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center gap-20 p-20 opacity-[0.03] select-none -rotate-12">
                   {[...Array(20)].map((_, i) => (
                     <div key={i} className="text-xl font-bold uppercase tracking-[15px]">STRICTLY CONFIDENTIAL • {contract.owner.first_name} {contract.owner.last_name}</div>
                   ))}
                </div>

                <div className="text-center font-bold text-2xl uppercase underline tracking-widest mb-12 border-b-2 border-slate-900 pb-4">
                  {contract.category.toUpperCase()} AGREEMENT
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                  <p>
                    This agreement is entered into as of <b>{new Date(contract.start_date).toLocaleDateString()}</b> by and between 
                    <b> Verdant Fields</b>, a corporation registered under the laws of the Jurisdiction, and 
                    <b> {contract.party_name}</b> (the &ldquo;Counterparty&rdquo;).
                  </p>

                  <h3 className="font-bold text-base mt-8">1. VARIABLE DEFINITIONS</h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded grid grid-cols-2 gap-4">
                      {Object.entries(contract.metadata || {}).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{key.replace(/_/g, ' ')}</span>
                        <span className="font-bold">{value == null ? '-' : String(value)}</span>
                        </div>
                      ))}
                  </div>

                  <h3 className="font-bold text-base mt-8">2. STANDARD TERMS & CONDITIONS</h3>
                  <p className="opacity-70 italic text-[10px] uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-4 py-1">
                    [LEGAL BLOCK: PRE-APPROVED BY VERDANT FIELDS GENERAL COUNSEL Q3-2026]
                  </p>
                  <p>
                    2.1. Confidentiality: The Counterparty shall maintain strict confidentiality regarding all proprietary information shared during the performance of this agreement. 
                  </p>
                  <p>
                    2.2. Intellectual Property: All deliverables, findings, and optimizations generated during the term of this contract shall remain the sole property of Verdant Fields.
                  </p>
                  <p>
                    2.3. Termination: This contract may be terminated by either party upon thirty (30) days written notice, subject to outstanding deliverables.
                  </p>

                  <div className="grid grid-cols-2 gap-20 mt-20 pt-12 border-t border-slate-200">
                    <div className="space-y-8">
                       <div className="h-12 border-b-2 border-slate-400" />
                       <div className="text-[10px]">
                         <span className="font-bold block uppercase tracking-widest text-slate-500">Authorized Signature</span>
                         <span className="text-slate-900 font-bold">Verdant Fields Engineering / Legal</span>
                       </div>
                    </div>
                    <div className="space-y-8">
                       <div className="h-12 border-b-2 border-slate-400" />
                       <div className="text-[10px]">
                         <span className="font-bold block uppercase tracking-widest text-slate-500">Counterparty Signature</span>
                         <span className="text-slate-900 font-bold uppercase">{contract.party_name}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Timeline & Audit */}
        <div className="space-y-6">
          {/* Approval Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
                <Clock className="w-4 h-4 text-emerald-500" />
                Workflow Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative">
                <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-100" />
                
                {/* Generation Milestone */}
                <div className="relative flex gap-4">
                  <div className="z-10 w-6 h-6 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center text-emerald-600">
                    <Zap className="w-3 h-3 fill-emerald-600" />
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <div className="text-xs font-bold text-slate-900">Document Generated</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(contract.start_date).toLocaleString()}</div>
                  </div>
                </div>

                {/* Approval Steps */}
                {contract.approvals.map((approval) => (
                  <div key={approval.id} className="relative flex gap-4">
                    <div className={`z-10 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center 
                      ${approval.status === 'approved' ? 'bg-emerald-500 text-white' : 
                        approval.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-white text-slate-300'}`}>
                      {approval.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : 
                       approval.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 -mt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900">Step {approval.step}: {approval.approver.first_name} {approval.approver.last_name}</div>
                        {approval.status === 'pending' && (
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Action Required</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 capitalize">{approval.status}</div>
                      {approval.status === 'pending' && (
                        <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                           <textarea 
                             placeholder="Add decision comment..."
                             className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             onChange={(e) => setComment(e.target.value)}
                           />
                           <div className="flex gap-2">
                              <button 
                                onClick={() => handleDecision(approval.id, 'approved')}
                                className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleDecision(approval.id, 'rejected')}
                                className="flex-1 py-1.5 bg-white text-rose-600 border border-rose-200 text-[10px] font-bold rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                Reject
                              </button>
                           </div>
                        </div>
                      )}
                      {approval.comment && (
                        <div className="mt-2 text-[10px] text-slate-600 italic bg-amber-50/50 p-2 rounded border border-amber-100 flex items-start gap-2">
                           <MessageSquare className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                           {approval.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white">
             <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-slate-100 flex items-center gap-2 text-xs uppercase tracking-widest">
                <Lock className="w-3 h-3 text-emerald-500" />
                Immutable Audit Trail
              </h2>
            </div>
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {contract.auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1 group hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{log.action}</span>
                    <span className="text-[9px] text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-200">{log.user.first_name} {log.user.last_name}</div>
                  <div className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">IP Source: 192.168.1.xxx</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal Overlay */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                 <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4 animate-bounce">
                    <ShieldCheck className="w-12 h-12" />
                 </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Execute Digital Signature</h2>
              <p className="text-sm text-slate-500">You are providing a verified internal signature for this agreement. This action is permanently logged to the audit trail.</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-4 text-xs">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">manager@verdantfields.com</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Verified IP: 192.168.1.1</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-2xl">
                 <input type="checkbox" id="consent" className="mt-1 accent-indigo-600 w-4 h-4" />
                 <label htmlFor="consent" className="text-xs text-indigo-900 leading-relaxed font-semibold">
                   I agree that this electronic signature is equivalent to my manual signature and constitutes my legal intent to be bound by the terms of this agreement.
                 </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSign}
                className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
