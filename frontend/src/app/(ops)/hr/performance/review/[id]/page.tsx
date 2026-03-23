"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  ChevronLeft, 
  Send, 
  User, 
  ShieldCheck,
  Target,
  FileText,
  AlertCircle,
  Star
} from 'lucide-react';

interface ReviewPerson {
  first_name: string;
  last_name: string;
  emp_no?: string;
}

interface ReviewSelfAssessment {
  highlights?: string;
  challenges?: string;
}

interface ReviewDetail {
  id: string;
  employee: ReviewPerson;
  manager: ReviewPerson;
  final_rating?: string | number | null;
  self_assessment?: ReviewSelfAssessment | null;
}

interface ReviewCycleDetail {
  reviews: ReviewDetail[];
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReview = useCallback(async () => {
    try {
      // In a real app, we'd have an endpoint to get single review by ID
      // For now, let's fetch my reviews and filter or use a generic detail endpoint
      const res = await fetch(`/api/performance/cycles`); // Placeholder logic
      const cycles: Array<{ id: string }> = await res.json();
      // Simulating getting the first review for now as we don't have getReviewDetail yet
      const cycleRes = await fetch(`/api/performance/cycles/${cycles[0]?.id}`);
      const cycleDetail: ReviewCycleDetail = await cycleRes.json();
      const targetReview = cycleDetail.reviews.find((reviewItem) => reviewItem.id === reviewId) || cycleDetail.reviews[0];
      setReview(targetReview);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  if (loading || !review) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2 bg-brand-navy text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-navy/10">
            <Send size={14} />
            Submit Final Assessment
          </button>
        </div>
      </div>

      {/* Review Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Star size={120} />
        </div>
        
        <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-4 border-slate-50 relative">
          <Image 
            src={`https://ui-avatars.com/api/?name=${review.employee.first_name}+${review.employee.last_name}&background=random`}
            alt="Employee"
            width={96}
            height={96}
            className="w-full h-full rounded-xl object-cover"
            unoptimized
          />
          <div className="absolute -bottom-2 -right-2 p-1.5 bg-brand-gold text-white rounded-lg shadow-lg">
            <ShieldCheck size={16} />
          </div>
        </div>

        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
              {review.employee.first_name} <span className="text-brand-gold font-light italic">{review.employee.last_name}</span>
            </h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-widest">{review.employee.emp_no}</span>
          </div>
          <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
            Operations Dept <span className="w-1 h-1 rounded-full bg-slate-300"></span> Senior Full Stack Developer
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 border-r border-slate-100 pr-4 uppercase tracking-widest">
              Manager: <span className="text-slate-900">{review.manager.first_name} {review.manager.last_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Cycle: <span className="text-slate-900">Annual Review 2026</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px] text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Final Rating</div>
          <div className="text-2xl font-bold text-brand-navy tracking-tight">{review.final_rating || 'Pending'}</div>
        </div>
      </div>

      {/* Main Assessment Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Self Assessment or Comparison Overlay */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User size={18} className="text-indigo-500" />
              Self-Assessment
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 size={12} /> COMPLETED
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Highlights & Successes</label>
                <div className="p-5 rounded-2xl bg-slate-50 text-sm text-slate-600 font-medium italic leading-relaxed">
                  &quot;{review.self_assessment?.highlights || 'No highlights provided'}&quot;
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Challenges & Impediments</label>
                <div className="p-5 rounded-2xl bg-slate-50 text-sm text-slate-600 font-medium leading-relaxed">
                   {review.self_assessment?.challenges || 'No challenges listed'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                 <h4 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <Target size={14} className="text-brand-gold" />
                   Goal Performance
                 </h4>
                 <div className="space-y-4">
                   {[1, 2].map((g) => (
                     <div key={g} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                       <span className="text-xs font-semibold text-slate-700">Deliver ATS Module Architecture</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">100% DONE</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Manager Assessment Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-gold" />
              Manager Evaluation
            </h3>
            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
               IN PROGRESS
            </span>
          </div>

          <div className="bg-brand-navy rounded-3xl shadow-xl shadow-brand-navy/10 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Manager Assessment & Remarks</label>
                <textarea 
                  rows={6}
                  placeholder="Provide detailed feedback on core competencies, leadership behaviors, and technical execution..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Select Rating Profile</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button 
                      key={r}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        r === 4 ? 'bg-brand-gold text-brand-navy' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter px-1">
                  <span>Developing</span>
                  <span>Exceptional</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700/50 flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-xl text-brand-gold">
                  <AlertCircle size={20} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-normal">
                  Ratings will be visible to HR for calibration immediately. Final submission locks the assessment.
                </p>
              </div>
            </div>
            
            <div className="px-8 py-5 bg-black/20 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <FileText size={14} />
                 Auto-saved 2m ago
               </div>
               <button className="text-xs font-bold text-brand-gold hover:underline">
                 Review Calibration Rules
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
