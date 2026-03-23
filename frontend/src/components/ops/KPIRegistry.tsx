import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  TrendingUp, 
  Database, 
  User, 
  RefreshCcw, 
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  description: string;
  formula: string;
  data_source: string;
  owner_role: string;
  frequency: string;
  unit: string;
  target: number;
  current_value: number;
  status: 'on-track' | 'at-risk' | 'off-track';
  last_updated: string;
}

interface KPIRegistryProps {
  departmentId: string;
}

export const KPIRegistry: React.FC<KPIRegistryProps> = ({ departmentId }) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await apiFetch(`/kpis?departmentId=${departmentId}`);
        if (res.ok) {
          const data = await res.json();
          setKpis(data);
          if (data.length > 0) setSelectedKpi(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch KPIs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) fetchKpis();
  }, [departmentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'at-risk': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'off-track': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (kpis.length === 0) return (
    <div className="glass-card p-12 text-center space-y-4">
      <TrendingUp className="mx-auto text-slate-200" size={48} />
      <h3 className="text-xl font-heading text-brand-navy">No Metrics Registered</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        The KPI Library for this department is currently empty. Use the Data Governance module to define mission-critical metrics.
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* KPI List */}
      <div className="lg:col-span-1 space-y-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.id}
            onClick={() => setSelectedKpi(kpi)}
            className={`w-full p-4 rounded-2xl border transition-all text-left group ${
              selectedKpi?.id === kpi.id 
                ? 'bg-brand-navy border-brand-navy shadow-lg shadow-brand-navy/20' 
                : 'bg-white border-slate-100 hover:border-brand-gold/50 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                selectedKpi?.id === kpi.id ? 'bg-white/10 border-white/20 text-white' : getStatusColor(kpi.status)
              }`}>
                {kpi.status}
              </span>
              <TrendingUp size={14} className={selectedKpi?.id === kpi.id ? 'text-brand-gold' : 'text-slate-300'} />
            </div>
            <h4 className={`font-bold text-sm mb-1 ${selectedKpi?.id === kpi.id ? 'text-white' : 'text-slate-800'}`}>
              {kpi.name}
            </h4>
            <div className="flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full overflow-hidden ${selectedKpi?.id === kpi.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                <div 
                  className={`h-full transition-all duration-1000 ${
                    kpi.status === 'on-track' ? 'bg-emerald-500' : kpi.status === 'at-risk' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min((kpi.current_value / kpi.target) * 100, 100)}%` }}
                ></div>
              </div>
              <span className={`text-[10px] font-bold ${selectedKpi?.id === kpi.id ? 'text-white/60' : 'text-slate-400'}`}>
                {Math.round((kpi.current_value / kpi.target) * 100)}%
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* KPI Detail View */}
      <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        {selectedKpi && (
          <>
            {/* Header Card */}
            <div className="glass-card p-10 rounded-3xl bg-white border border-slate-100 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center text-brand-gold shadow-lg shadow-brand-navy/20 text-white">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-heading text-brand-navy">{selectedKpi.name}</h2>
                    <p className="text-slate-500 italic">{selectedKpi.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Value</span>
                    <div className="text-3xl font-heading text-brand-navy">
                      {selectedKpi.current_value}
                      <span className="text-xs text-slate-400 font-bold ml-1 uppercase">{selectedKpi.unit}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</span>
                    <div className="text-3xl font-heading text-brand-gold">
                      {selectedKpi.target}
                      <span className="text-xs text-slate-400 font-bold ml-1 uppercase">{selectedKpi.unit}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                    <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-tighter ${
                      selectedKpi.status === 'on-track' ? 'text-emerald-600' : selectedKpi.status === 'at-risk' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedKpi.status === 'on-track' && <CheckCircle2 size={16} />}
                      {selectedKpi.status === 'at-risk' && <AlertCircle size={16} />}
                      {selectedKpi.status === 'off-track' && <AlertCircle size={16} />}
                      {selectedKpi.status}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
            </div>

            {/* Governance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <Info size={14} className="text-brand-gold" />
                  Calculation Logic
                </h3>
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Formula</div>
                    <div className="p-4 bg-brand-navy rounded-xl font-mono text-sm text-brand-gold/90 border border-white/5">
                      {selectedKpi.formula}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Data Source</div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Database size={18} className="text-slate-300" />
                      <span className="font-bold text-sm">{selectedKpi.data_source}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <User size={14} className="text-brand-gold" />
                  Ownership & Schedule
                </h3>
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Metric Owner</div>
                      <div className="flex items-center gap-3 text-slate-800 font-bold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        {selectedKpi.owner_role}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Reporting Frequency</div>
                      <div className="flex items-center gap-2 text-slate-600 font-bold justify-end">
                        <Clock size={16} className="text-slate-300" />
                        <span className="capitalize">{selectedKpi.frequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Last Sync</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {new Date(selectedKpi.last_updated).toLocaleDateString()} at {new Date(selectedKpi.last_updated).toLocaleTimeString()}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                      <RefreshCcw size={16} className="text-slate-300 group-hover:text-brand-navy transition-colors" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Improvement Plan Call-to-Action */}
            {selectedKpi.status !== 'on-track' && (
              <div className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 rounded-[32px] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Operational Gap Detected</h4>
                    <p className="text-xs text-slate-500 italic">This metric is underperforming against the Strategic Specification.</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-brand-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg group">
                  Initiate Remediation
                  <ArrowRight size={14} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
