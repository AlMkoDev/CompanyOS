"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ChevronLeft, 
  Send, 
  HelpCircle,
  MessageSquare,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react';

interface FeedbackRequest {
  id: string;
  review: {
    employee: {
      first_name: string;
      last_name: string;
    };
    cycle: {
      name: string;
    };
  };
}

export default function FeedbackPortalPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [request, setRequest] = useState<FeedbackRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/performance/feedback/pending');
      const pending: FeedbackRequest[] = await res.json();
      // For demo, just use the first pending or mock it
      setRequest(pending[0] || {
        id: requestId || 'pending-feedback',
        review: {
          employee: { first_name: 'Michael', last_name: 'Scott' },
          cycle: { name: 'Annual Review 2026' }
        }
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleSubmit = async () => {
    setSubmitted(true);
    // Simulate submission
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full space-y-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner ring-8 ring-emerald-50/50">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Feedback Submitted</h2>
          <p className="text-slate-500 font-medium">Your contribution to {request.review.employee.first_name}&apos;s growth has been securely recorded. All feedback is anonymized.</p>
        </div>
        <button 
          onClick={() => router.push('/hr/performance')}
          className="px-8 py-3 bg-brand-navy text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-navy/10 hover:bg-slate-800 transition-all"
        >
          Return to Dashboard
        </button>
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
          Cancel
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">End-to-End Encrypted Anonymity</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Intro */}
        <div className="space-y-2 text-center">
            <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
              360° Peer <span className="text-brand-gold font-light italic">Insights</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Providing constructive feedback for <span className="text-slate-900 font-bold">{request.review.employee.first_name} {request.review.employee.last_name}</span> as part of the <span className="text-brand-gold font-bold italic">{request.review.cycle.name}</span>.
            </p>
        </div>

        {/* Feedback Form */}
        <div className="space-y-6">
          {[
            { 
              title: "Collaboration & Teamwork", 
              desc: "How effectively does Michael collaborate with peers and contribute to team goals?",
              icon: Users,
              color: "text-indigo-500"
            },
            { 
              title: "Problem Solving & Quality", 
              desc: "Rate the technical depth and reliability of Michael&apos;s contributions/solutions.",
              icon: Award,
              color: "text-brand-gold"
            },
            { 
              title: "Growth Mindset", 
              desc: "How does Michael respond to feedback and seek opportunities for improvement?",
              icon: HelpCircle,
              color: "text-emerald-500"
            }
          ].map((section, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl bg-slate-50 ${section.color} group-hover:scale-110 transition-transform`}>
                  <section.icon size={24} />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{section.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{section.desc}</p>
                  </div>
                  <textarea 
                    rows={4}
                    placeholder="Provide specific examples or constructive observations..."
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-medium"
                  />
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact Rating:</span>
                    <div className="flex items-center gap-2">
                       {[1, 2, 3, 4, 5].map(star => (
                         <button key={star} className="text-slate-200 hover:text-brand-gold transition-colors">
                            <Star size={16} fill="currentColor" />
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="flex flex-col items-center gap-4 pt-8">
           <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
             <MessageSquare size={16} />
             Your feedback will be aggregated and shared without attribution.
           </div>
           <button 
            onClick={handleSubmit} 
            className="px-12 py-4 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-navy/20 hover:bg-slate-800 transition-all flex items-center gap-3 group"
           >
             Submit Insights
             <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
}

function Star({ size, fill }: { size: number, fill: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
