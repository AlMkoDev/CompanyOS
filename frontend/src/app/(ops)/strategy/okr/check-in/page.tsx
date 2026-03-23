"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  BarChart3,
  Star,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CheckInKeyResult {
  id: string;
  title: string;
  unit: string;
  current_value: number;
  target_value: number;
  initial_value?: number;
  objective: {
    title: string;
  };
}

export default function CheckInWizardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [krs, setKrs] = useState<CheckInKeyResult[]>([]);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});

  useEffect(() => {
    // In a real app, fetch KRs assigned to the current user
    // For demo, we'll fetch all or mock
    fetchKrs();
  }, []);

  const fetchKrs = async () => {
    try {
      // Mocking the KRs for the current user for demo purposes
      // In production, this would be an endpoint like /api/okr/my-krs
      setKrs([
        { 
          id: 'kr-1', 
          title: 'Deploy to 50 pilot farms', 
          unit: 'farms', 
          current_value: 30, 
          target_value: 50,
          objective: { title: 'Roll Out Next-Gen Fertigation AI Module' }
        },
        { 
          id: 'kr-2', 
          title: 'Achieve 99.9% uptime for Fertigation Cloud', 
          unit: 'percentage', 
          current_value: 98.5, 
          target_value: 99.9,
          objective: { title: 'Roll Out Next-Gen Fertigation AI Module' }
        }
      ]);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (step < krs.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate multiple check-ins
      for (const kr of krs) {
        await fetch(`/api/okr/key-results/${kr.id}/check-in`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: progress[kr.id] || kr.current_value,
            confidence: confidence[kr.id] || 5,
            comment: comment[kr.id] || ''
          })
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center animate-pulse">
        Synchronizing Alignment Data...
      </p>
    </div>
  );

  if (submitted) return (
    <div className="p-8 flex flex-col items-center justify-center h-full space-y-6 text-center max-w-md mx-auto min-h-[600px]">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center shadow-inner rotate-3 ring-8 ring-emerald-50/50">
        <CheckCircle2 size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Check-in Complete!</h2>
        <p className="text-slate-500 font-medium">Your progress updates have been aggregated into the Global Health Score.</p>
      </div>
      <button 
        onClick={() => router.push('/strategy/okr/explorer')}
        className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-navy/20 hover:bg-slate-800 transition-all flex items-center gap-3 group"
      >
        Return to Explorer
        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const currentKr = krs[step];

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Exit Wizard
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
               <Zap size={16} className="text-brand-gold animate-pulse" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step {step + 1} of {krs.length}</span>
            </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
          <div className="p-10 space-y-10">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <ShieldCheck size={16} className="text-indigo-500" />
                 <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{currentKr.objective.title}</span>
              </div>
              <h1 className="text-3xl font-heading font-bold text-slate-900 leading-tight">
                {currentKr.title}
              </h1>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                 <span className="flex items-center gap-1"><BarChart3 size={14} /> Current: {currentKr.current_value} {currentKr.unit}</span>
                 <span className="h-1 w-1 bg-slate-200 rounded-full" />
                 <span>Target: {currentKr.target_value} {currentKr.unit}</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-12">
               {/* Progress Slider */}
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">What is the current value?</label>
                    <span className="text-2xl font-bold text-brand-gold">{progress[currentKr.id] || currentKr.current_value} <span className="text-sm text-slate-400 font-medium">{currentKr.unit}</span></span>
                 </div>
                 <input 
                   type="range"
                   min={currentKr.initial_value || 0}
                   max={currentKr.target_value * 1.2} // Allow a bit of overachieving
                   step={currentKr.unit === 'percentage' ? 0.1 : 1}
                   value={progress[currentKr.id] || currentKr.current_value}
                   onChange={(e) => setProgress({ ...progress, [currentKr.id]: Number(e.target.value) })}
                   className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-gold"
                 />
                 <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                   <span>Start: {currentKr.initial_value || 0}</span>
                   <span>End Goal: {currentKr.target_value}</span>
                 </div>
               </div>

               {/* Confidence Star Rating */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    Weekly Confidence Score
                    <AlertCircle size={14} className="text-slate-300" />
                  </label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setConfidence({ ...confidence, [currentKr.id]: star })}
                        className={`p-2 transition-all rounded-xl ${
                          (confidence[currentKr.id] || 0) >= star 
                            ? 'bg-amber-50 text-brand-gold scale-110 shadow-sm' 
                            : 'bg-slate-50 text-slate-200 opacity-50'
                        }`}
                      >
                        <Star size={16} fill={(confidence[currentKr.id] || 0) >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 italic">How confident are you that we will hit the target by end of quarter?</p>
               </div>

               {/* Commments/Blockers */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    Observations & Blockers
                    <MessageSquare size={14} className="text-slate-300" />
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Shared specific wins, roadblocks, or context for the team..."
                    value={comment[currentKr.id] || ''}
                    onChange={(e) => setComment({ ...comment, [currentKr.id]: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                  />
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
             <button 
              onClick={() => step > 0 && setStep(step - 1)}
              disabled={step === 0}
              className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
             >
               Back
             </button>
             <button 
               onClick={handleNext}
               className="px-8 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-navy/10 hover:bg-slate-800 transition-all flex items-center gap-3 group"
             >
               {step === krs.length - 1 ? 'Finish Check-in' : 'Next Progress Point'}
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
