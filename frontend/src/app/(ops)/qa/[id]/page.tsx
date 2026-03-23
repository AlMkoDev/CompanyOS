'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  ClipboardList,
  UserPlus,
  Edit,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NCR {
  id: string;
  ncr_no: string;
  description: string;
  raised_by: string;
  raised_at: string;
  status: string;
  area?: string;
  severity: string;
  rca?: RCA;
  corrective_actions?: CAR[];
}

interface RCA {
  id: string;
  five_whys: RcaWhyItem[];
  final_root_cause: string;
  conducted_by: string;
}

interface RcaWhyItem {
  why: string;
  answer?: string;
}

interface CAR {
  id: string;
  description: string;
  assignee_id?: string;
  due_date?: string;
  status: string;
  verified_at?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  identified: { color: 'bg-slate-100 text-slate-600', label: 'Identified' },
  RCA: { color: 'bg-blue-100 text-blue-600', label: 'Root Cause Analysis' },
  CAR_open: { color: 'bg-amber-100 text-amber-600', label: 'CAR Open' },
  closed: { color: 'bg-emerald-100 text-emerald-600', label: 'Closed' },
};

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-rose-500', label: 'Critical' },
  high: { color: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-amber-500', label: 'Medium' },
  low: { color: 'bg-slate-400', label: 'Low' },
};

export default function NCRDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ncr, setNcr] = useState<NCR | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRcaForm, setShowRcaForm] = useState(false);
  const [showCarForm, setShowCarForm] = useState(false);

  const fetchNCR = useCallback(async () => {
    try {
      const response = await fetch(`/api/qa/ncrs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setNcr(data);
      } else {
        router.push('/modules/qa');
      }
    } catch (error) {
      console.error('Error fetching NCR:', error);
      router.push('/modules/qa');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchNCR();
  }, [fetchNCR]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading || !ncr) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-navy font-bold">Loading NCR...</p>
        </div>
      </div>
    );
  }

  const carProgress = ncr.corrective_actions && ncr.corrective_actions.length > 0
    ? Math.round((ncr.corrective_actions.filter(c => c.status === 'closed').length / ncr.corrective_actions.length) * 100)
    : 0;

  return (
    <div className="p-6 md:p-12 flex flex-col gap-8 pb-32 max-w-[1800px] mx-auto overflow-hidden h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-12 w-12 rounded-2xl hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${SEVERITY_CONFIG[ncr.severity]?.color} border-0 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                {SEVERITY_CONFIG[ncr.severity]?.label}
              </Badge>
              <Badge className={`${STATUS_CONFIG[ncr.status]?.color} border-0 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                {STATUS_CONFIG[ncr.status]?.label}
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-400">{ncr.ncr_no}</span>
            </div>
            <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight">
              Non-Conformance Report
            </h1>
            {ncr.area && (
              <p className="text-slate-600 font-medium mt-2">Area: {ncr.area}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!ncr.rca && (
            <Button
              variant="outline"
              onClick={() => setShowRcaForm(!showRcaForm)}
              className="h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest border-2"
            >
              <Edit size={18} className="mr-2" />
              Start RCA
            </Button>
          )}
          <Button
            onClick={() => setShowCarForm(!showCarForm)}
            className="h-12 px-6 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-widest text-xs hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/20 transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Add Corrective Action
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        {/* Timeline */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px]">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Clock size={16} />
                Raised
              </div>
              <div className="text-2xl font-black text-brand-navy">
                {formatDate(ncr.raised_at)}
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Status: <span className="font-bold">{STATUS_CONFIG[ncr.status]?.label}</span>
          </div>
        </Card>

        {/* CAR Progress */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px]">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Target size={16} />
                CAR Progress
              </div>
              <div className="text-4xl font-black text-brand-navy">{carProgress}%</div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <Progress value={carProgress} className="h-2" />
          <div className="mt-2 text-xs font-medium text-slate-600">
            {ncr.corrective_actions?.filter(c => c.status === 'closed').length || 0} of {ncr.corrective_actions?.length || 0} actions completed
          </div>
        </Card>

        {/* Actions Count */}
        <Card className="p-6 border-slate-100 shadow-lg shadow-slate-200/50 rounded-[24px]">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <ClipboardList size={16} />
                Total Actions
              </div>
              <div className="text-4xl font-black text-brand-navy">
                {ncr.corrective_actions?.length || 0}
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Open:</span>
              <span className="font-black text-amber-600">
                {ncr.corrective_actions?.filter(c => c.status !== 'closed').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Closed:</span>
              <span className="font-black text-emerald-600">
                {ncr.corrective_actions?.filter(c => c.status === 'closed').length || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="flex-1 overflow-hidden">
        <TabsList className="h-14 bg-slate-100/50 rounded-[24px] p-2 shrink-0">
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy data-[state=active]:shadow-lg rounded-2xl px-6 font-bold text-xs uppercase tracking-widest transition-all h-full"
          >
            NCR Details
          </TabsTrigger>
          <TabsTrigger
            value="rca"
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy data-[state=active]:shadow-lg rounded-2xl px-6 font-bold text-xs uppercase tracking-widest transition-all h-full"
          >
            Root Cause Analysis
          </TabsTrigger>
          <TabsTrigger
            value="car"
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy data-[state=active]:shadow-lg rounded-2xl px-6 font-bold text-xs uppercase tracking-widest transition-all h-full"
          >
            Corrective Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 overflow-hidden mt-6">
          <NCRDetails ncr={ncr} />
        </TabsContent>

        <TabsContent value="rca" className="flex-1 overflow-hidden mt-6">
          {showRcaForm ? (
            <RcaForm ncrId={ncr.id} onSubmit={() => { setShowRcaForm(false); fetchNCR(); }} />
          ) : ncr.rca ? (
            <RcaDisplay rca={ncr.rca} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <div className="p-6 bg-slate-200 rounded-full mb-4">
                <Target size={48} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                No RCA Conducted Yet
              </span>
              <Button onClick={() => setShowRcaForm(true)} className="mt-4">
                Start Root Cause Analysis
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="car" className="flex-1 overflow-hidden mt-6">
          {showCarForm ? (
            <CarForm ncrId={ncr.id} onSubmit={() => { setShowCarForm(false); fetchNCR(); }} />
          ) : (
            <CarTracker cars={ncr.corrective_actions || []} onUpdate={fetchNCR} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// NCR Details Component
function NCRDetails({ ncr }: { ncr: NCR }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-6">
      <Card className="p-8 border-slate-100 shadow-lg rounded-[24px]">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-black text-brand-navy mb-4">Description</h3>
            <p className="text-lg text-slate-700 font-medium leading-relaxed">{ncr.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Area
              </div>
              <div className="text-lg font-black text-brand-navy">{ncr.area || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Severity
              </div>
              <Badge className={`${SEVERITY_CONFIG[ncr.severity]?.color} border-0 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full`}>
                {SEVERITY_CONFIG[ncr.severity]?.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Raised By
              </div>
              <div className="text-lg font-black text-brand-navy">User ID: {ncr.raised_by}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Raised At
              </div>
              <div className="text-lg font-black text-brand-navy">{formatDate(ncr.raised_at)}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Current Status
            </div>
            <Badge className={`${STATUS_CONFIG[ncr.status]?.color} border-0 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full`}>
              {STATUS_CONFIG[ncr.status]?.label}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

// RCA Form Component (5-Why Template)
function RcaForm({ ncrId, onSubmit }: { ncrId: string; onSubmit: () => void }) {
  const [fiveWhys, setFiveWhys] = useState([
    { why: '', answer: '' },
    { why: '', answer: '' },
    { why: '', answer: '' },
    { why: '', answer: '' },
    { why: '', answer: '' },
  ]);
  const [finalRootCause, setFinalRootCause] = useState('');

  const handleWhyChange = (index: number, value: string) => {
    const updated = [...fiveWhys];
    updated[index].why = value;
    setFiveWhys(updated);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...fiveWhys];
    updated[index].answer = value;
    setFiveWhys(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/qa/ncrs/${ncrId}/rca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        five_whys: fiveWhys,
        final_root_cause: finalRootCause,
      }),
    });
    onSubmit();
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-6">
      <Card className="p-8 border-slate-100 shadow-lg rounded-[24px]">
        <h3 className="text-2xl font-black text-brand-navy mb-6">5-Why Root Cause Analysis</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fiveWhys.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-black text-sm">
                  {index + 1}
                </div>
                <input
                  type="text"
                  placeholder={`Why ${index + 1}?`}
                  value={item.why}
                  onChange={(e) => handleWhyChange(index, e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
                  required={index === 0}
                />
              </div>
              <div className="pl-11">
                <textarea
                  placeholder="Answer..."
                  value={item.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows={2}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
                  required={index === 0}
                />
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Final Root Cause
            </label>
            <textarea
              value={finalRootCause}
              onChange={(e) => setFinalRootCause(e.target.value)}
              rows={4}
              placeholder="Summarize the root cause..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => onSubmit()}>Cancel</Button>
            <Button type="submit" className="bg-brand-navy text-white">Save RCA</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// RCA Display Component
function RcaDisplay({ rca }: { rca: RCA }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-6">
      <Card className="p-8 border-slate-100 shadow-lg rounded-[24px]">
        <h3 className="text-2xl font-black text-brand-navy mb-6">Root Cause Analysis</h3>
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-black text-brand-navy">5-Why Analysis</h4>
            {rca.five_whys.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-brand-navy text-white flex items-center justify-center font-black text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Why {index + 1}
                    </div>
                    <p className="text-brand-navy font-bold">{item.why}</p>
                  </div>
                </div>
                {item.answer && (
                  <div className="pl-9">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Answer
                    </div>
                    <p className="text-slate-700 font-medium">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Final Root Cause
            </div>
            <p className="text-lg text-brand-navy font-bold leading-relaxed">{rca.final_root_cause}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// CAR Form Component
function CarForm({ ncrId, onSubmit }: { ncrId: string; onSubmit: () => void }) {
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/qa/ncrs/${ncrId}/corrective-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        assignee_id: assignee,
        due_date: dueDate,
      }),
    });
    onSubmit();
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-6">
      <Card className="p-8 border-slate-100 shadow-lg rounded-[24px]">
        <h3 className="text-2xl font-black text-brand-navy mb-6">Add Corrective Action</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the corrective action..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Assignee
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="User ID or name"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 font-medium"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => onSubmit()}>Cancel</Button>
            <Button type="submit" className="bg-brand-navy text-white">Add Action</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// CAR Tracker Component
function CarTracker({ cars, onUpdate }: { cars: CAR[]; onUpdate: () => void }) {
  const updateCarStatus = async (carId: string, status: string) => {
    await fetch(`/api/qa/corrective-actions/${carId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-6">
      <div className="space-y-4">
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <div className="p-6 bg-slate-200 rounded-full mb-4">
              <ClipboardList size={48} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              No Corrective Actions
            </span>
          </div>
        ) : (
          cars.map((car) => {
            const daysUntilDue = car.due_date ? getDaysUntilDue(car.due_date) : null;
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

            return (
              <Card key={car.id} className={`p-6 border-l-4 ${car.status === 'closed' ? 'border-emerald-500' : isOverdue ? 'border-rose-500' : 'border-amber-500'} shadow-lg rounded-[24px]`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-lg font-black text-brand-navy mb-2">{car.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {car.assignee_id && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <UserPlus size={16} />
                          <span className="font-medium">{car.assignee_id}</span>
                        </div>
                      )}
                      {car.due_date && (
                        <div className={`flex items-center gap-2 font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                          <Clock size={16} />
                          <span>Due: {formatDate(car.due_date)}</span>
                          {isOverdue && (
                            <Badge className="bg-rose-100 text-rose-600 border-0 text-[10px] font-black">
                              {Math.abs(daysUntilDue)}d Overdue
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${car.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} border-0 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                      {car.status === 'closed' ? 'Closed' : 'Open'}
                    </Badge>
                    {car.status !== 'closed' && (
                      <Button
                        size="sm"
                        onClick={() => updateCarStatus(car.id, 'closed')}
                        className="h-10 px-4 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        Mark Closed
                      </Button>
                    )}
                  </div>
                </div>
                {car.verified_at && (
                  <div className="text-xs text-slate-500 font-medium">
                    Verified: {formatDate(car.verified_at)}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getDaysUntilDue(dueDate?: string) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
