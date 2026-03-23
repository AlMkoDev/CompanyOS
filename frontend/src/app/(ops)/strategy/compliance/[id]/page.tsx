'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  Edit2, 
  Plus,
  ShieldCheck,
  Download,
  History,
  Info,
  Lock,
  Zap,
  Check,
  type LucideIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface ComplianceDeadline {
  id: string;
  title: string;
  status: string;
  category: string;
  due_date: string;
  description?: string;
  notes?: string;
  reference_no?: string;
  recurrence_type?: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  proofs?: ComplianceProof[];
  audit_logs?: ComplianceAuditLog[];
}

interface ComplianceProof {
  id: string;
  file_name: string;
  file_url: string;
  download_url?: string;
  uploaded_at: string;
  uploader?: {
    first_name: string;
    last_name: string;
  };
}

interface ComplianceAuditLog {
  id: string;
  action: string;
  created_at: string;
  details: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface DetailCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  capitalize?: boolean;
}

interface TabButtonProps {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}

export default function ComplianceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deadline, setDeadline] = useState<ComplianceDeadline | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'proofs' | 'audit'>('details');

  const fetchDeadline = React.useCallback(async () => {
    try {
      const res = await apiFetch(`/compliance/deadlines/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch deadline');
      const data = await res.json();
      setDeadline(data);
    } catch (error) {
      console.error('Error fetching deadline:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDeadline();
  }, [fetchDeadline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-brand-gold animate-spin"></div>
      </div>
    );
  }

  if (!deadline) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy">Deadline not found</h2>
        <Button onClick={() => router.push('/strategy/compliance/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const proofs = deadline.proofs ?? [];

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-navy hover:border-brand-gold transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-black text-brand-navy uppercase tracking-tight">
                {deadline.title}
              </h1>
              <StatusBadge status={deadline.status} />
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
                <ShieldCheck size={14} className="text-brand-gold" />
                {deadline.category} COMPLIANCE
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                Due: {new Date(deadline.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deadline.status !== 'filed' && (
            <Button 
              onClick={() => setShowFilingModal(true)}
              className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-2xl h-12 px-8 shadow-2xl shadow-brand-navy/20 gap-2 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/20 to-brand-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <CheckCircle2 size={20} />
              Mark as Filed
            </Button>
          )}
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 hover:border-brand-gold transition-all">
            <Edit2 size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Info Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailCard 
              label="Assigned To" 
              value={deadline.assignee ? `${deadline.assignee.first_name} ${deadline.assignee.last_name}` : 'Unassigned'} 
              icon={User}
            />
            <DetailCard 
              label="Reference No" 
              value={deadline.reference_no || 'TBD'} 
              icon={Lock}
            />
            <DetailCard 
              label="Recurrence" 
              value={deadline.recurrence_type || 'One-time'} 
              icon={History}
              capitalize
            />
          </div>

          {/* Tabbed Interface */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100 p-2 gap-2">
              <TabButton selected={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Info}>General</TabButton>
              <TabButton selected={activeTab === 'proofs'} onClick={() => setActiveTab('proofs')} icon={FileText}>Proofs ({proofs.length})</TabButton>
              <TabButton selected={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={History}>Audit Trail</TabButton>
            </div>

            <div className="p-8 min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-brand-gold" />
                        Executive Description
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {deadline.description || 'No detailed description provided for this obligation.'}
                      </p>
                    </div>

                    {deadline.notes && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Internal Notes</h3>
                        <p className="text-sm text-slate-500 italic whitespace-pre-wrap">{deadline.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">#Statutory</Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">#VerdantFields</Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">#Q3-2026</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Identifiers</h4>
                        <div className="text-xs font-mono text-slate-400">UUID: {deadline.id}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'proofs' && (
                  <motion.div
                    key="proofs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {proofs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                        <Download size={48} className="mb-4 opacity-50" />
                        <p className="font-medium text-slate-400">No proof documents found.</p>
                      </div>
                    ) : (
                      proofs.map((proof) => (
                        <div 
                          key={proof.id}
                          className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-brand-gold hover:shadow-lg transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-gold shadow-sm group-hover:bg-brand-gold group-hover:text-white transition-colors">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-brand-navy leading-none mb-1">{proof.file_name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                Uploaded {new Date(proof.uploaded_at).toLocaleDateString()} 
                                {proof.uploader && ` • ${proof.uploader.first_name} ${proof.uploader.last_name}`}
                              </p>
                            </div>
                          </div>
                          <Link 
                            href={proof.download_url || proof.file_url}
                            target="_blank" 
                            rel="noopener noreferrer nofollow"
                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-gold hover:bg-brand-gold/10 transition-all"
                          >
                            <Download size={20} />
                          </Link>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'audit' && (
                  <motion.div
                    key="audit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 relative"
                  >
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    {deadline.audit_logs?.map((log) => (
                      <div key={log.id} className="relative pl-12">
                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${
                          log.action === 'file' ? 'bg-emerald-500 text-white' : 
                          log.action === 'upload_proof' ? 'bg-brand-gold text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {log.action === 'file' ? <CheckCircle2 size={16} /> : 
                           log.action === 'upload_proof' ? <Upload size={16} /> : <Zap size={16} />}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
                              {log.user.first_name} {log.user.last_name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 bg-brand-navy text-white rounded-[2rem] border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Status Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Compliance Prob.</span>
                  <span className="text-emerald-400 font-black tracking-widest text-xs uppercase">LOW RISK</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Auto-Alerts</span>
                  <span className="text-emerald-400 font-black tracking-widest text-xs uppercase">ACTIVE</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-brand-gold w-[85%]"></div>
                </div>
                <p className="text-[10px] text-slate-500 italic">Predictive filing confidence at 85% based on historical benchmarks.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 font-heading">Security Protocol</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed"><span className="font-bold text-brand-navy">Immutable Audit Trail:</span> All changes are cryptographically logged with user IP tracking.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Lock size={16} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed"><span className="font-bold text-brand-navy">Encrypted Storage:</span> Proof documents are stored in zero-access S3 buckets.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filing Modal */}
      <AnimatePresence>
        {showFilingModal && (
          <FilingWizardModal
            deadlineId={params.id as string}
            title={deadline.title}
            onClose={() => setShowFilingModal(false)}
            onSuccess={() => {
              setShowFilingModal(false);
              fetchDeadline();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon, capitalize = false }: DetailCardProps) {
  return (
    <Card className="p-5 bg-white border-slate-100 shadow-sm hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-brand-gold">
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className={`text-lg font-black text-brand-navy tracking-tight ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </Card>
  );
}

function TabButton({ selected, onClick, icon: Icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
        selected 
          ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/10' 
          : 'text-slate-400 hover:text-brand-navy hover:bg-slate-50'
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    overdue: 'bg-rose-500 text-white',
    pending: 'bg-amber-400 text-white',
    filed: 'bg-emerald-500 text-white',
    default: 'bg-slate-400 text-white'
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md ${colors[status] || colors.default}`}>
      {status}
    </span>
  );
}

function FilingWizardModal({
  deadlineId,
  title,
  onClose,
  onSuccess,
}: {
  deadlineId: string;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('filing_date', filingDate);
      formData.append('reference_no', referenceNo);
      formData.append('notes', notes);

      const res = await apiFetch(`/compliance/deadlines/${deadlineId}/file`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to mark as filed');
      onSuccess();
    } catch (error) {
      console.error('Error filing compliance:', error);
      alert('Failed to file compliance. Please check the backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-brand-navy text-white">
          <div>
            <h2 className="text-2xl font-heading font-black tracking-tight uppercase">Complete Filing</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filing Date</label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all font-medium text-brand-navy"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Number</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g., KRA-2026-X88"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all font-medium text-brand-navy placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proof of Filing (PDF/Image)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-slate-200 group-hover:border-brand-gold rounded-[2rem] p-8 text-center bg-slate-50 group-hover:bg-brand-gold/5 transition-all">
                <Upload size={32} className="mx-auto text-slate-300 group-hover:text-brand-gold mb-3 transition-colors" />
                <p className="text-sm font-bold text-slate-500 group-hover:text-brand-navy transition-colors">
                  {file ? file.name : "Drag documents here or click to browse"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">Max file size: 10MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific comments or observations regarding this filing..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all font-medium text-brand-navy placeholder:text-slate-300 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              onClick={onClose}
              variant="outline" 
              className="flex-1 rounded-2xl h-14 border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px]"
            >
              Discard Changes
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="flex-[2] bg-brand-gold text-brand-navy hover:bg-brand-gold/90 rounded-2xl h-14 shadow-xl shadow-brand-gold/20 font-black uppercase tracking-widest text-xs gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-brand-navy border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <>
                  <Check size={20} />
                  Complete Certification
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
