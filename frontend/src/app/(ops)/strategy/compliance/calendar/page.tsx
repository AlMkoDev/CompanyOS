'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CalendarDeadline {
  id: string;
  title: string;
  category: string;
  due_date: string;
  status: string;
  proof_url?: string;
}

export default function ComplianceCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/compliance/calendar?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch calendar');
      const data = await res.json();
      setDeadlines(data.deadlines);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const changeMonth = (delta: number) => {
    setDirection(delta);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDeadlinesForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return deadlines.filter(d => d.due_date.split('T')[0] === dateStr);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* Decorative background element */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => router.push('/strategy/compliance/dashboard')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-navy hover:border-brand-gold transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-brand-gold rounded-full"></div>
              <h1 className="text-4xl font-heading font-black text-brand-navy tracking-tight uppercase">
                Regulatory <span className="text-slate-400 font-light">Timeline</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium max-w-2xl">
              Monthly orchestration of statutory obligations and compliance filings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl flex p-1 shadow-sm">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-brand-gold transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 flex items-center min-w-[180px] justify-center text-sm font-bold text-brand-navy uppercase tracking-widest">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-brand-gold transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <Button className="bg-brand-navy text-white hover:bg-brand-navy/90 rounded-2xl h-12 px-6 shadow-xl shadow-brand-navy/10 gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Deadline</span>
          </Button>
        </div>
      </header>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent animate-spin rounded-full"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <motion.div 
          key={currentDate.getTime()}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="grid grid-cols-7"
        >
          {days.map((day, idx) => {
            const dayDeadlines = day ? getDeadlinesForDay(day) : [];
            const isToday = day && 
              day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={idx} 
                className={`min-h-[160px] p-4 border-r border-b border-slate-100 transition-colors relative group ${
                  !day ? 'bg-slate-50/30' : 'hover:bg-slate-50/80 cursor-pointer'
                }`}
                onClick={() => day && dayDeadlines.length > 0 && router.push(`/strategy/compliance/${dayDeadlines[0].id}`)}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-base font-black ${
                        isToday ? 'text-brand-gold' : 'text-slate-900'
                      }`}>
                        {day < 10 ? `0${day}` : day}
                      </span>
                      {isToday && (
                        <div className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[8px] font-black uppercase tracking-tighter rounded-full border border-brand-gold/20 shadow-sm">
                          Today
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 overflow-hidden">
                      {dayDeadlines.map((deadline) => (
                        <motion.div 
                          key={deadline.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-2 rounded-xl text-[10px] font-bold border flex items-center gap-2 group/item shadow-sm ${
                            deadline.status === 'filed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            deadline.status === 'overdue' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                            'bg-slate-50 border-slate-100 text-brand-navy'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            deadline.status === 'filed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                            deadline.status === 'overdue' ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]' :
                            'bg-brand-gold shadow-[0_0_8px_rgba(255,184,0,0.5)]'
                          }`} />
                          <span className="truncate flex-1">{deadline.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Legend & Stats Overlay */}
      <footer className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-8 bg-white px-8 py-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 font-bold uppercase tracking-widest text-[10px] text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            <span>Filed Obligations</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-gold"></div>
            <span>Upcoming / Pending</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
            <span>Overdue Alerts</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Card className="bg-brand-navy p-3 px-6 text-white rounded-2xl border-0 flex items-center gap-4 shadow-xl shadow-brand-navy/10 group cursor-pointer hover:bg-brand-navy/90 transition-all">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Audit Intelligence</div>
              <div className="text-xs font-bold flex items-center gap-1">
                98.4% COMPLIANCE <CheckCircle2 size={12} className="text-emerald-400" />
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500 ml-2" />
          </Card>
        </div>
      </footer>
    </div>
  );
}
