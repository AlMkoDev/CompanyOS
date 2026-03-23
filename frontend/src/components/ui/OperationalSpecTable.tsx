import React from 'react';
import { 
  Package, 
  GitBranch, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Search, 
  Database,
  ArrowRight,
  Activity
} from 'lucide-react';

interface OperationalSpecTableProps {
  title: string;
  icon?: React.ReactNode;
  data: OperationalSpecData;
  type: 'routines' | 'datapack' | 'activities' | 'comms';
}

type RoutineData = Record<string, string[]>;

interface DataPackAsset {
  id: string;
  asset: string;
}

interface ActivitySection {
  name: string;
  detail: string;
}

interface ActivityItem {
  component: string;
  sections: ActivitySection[];
}

interface CommunicationLine {
  from: string;
  to: string;
  content: string;
}

export type OperationalSpecData =
  | RoutineData
  | DataPackAsset[]
  | ActivityItem[]
  | CommunicationLine[];

export const OperationalSpecTable: React.FC<OperationalSpecTableProps> = ({ 
  title, 
  icon, 
  data, 
  type 
}) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-sm italic">No data available for {title.toLowerCase()}.</p>
      </div>
    );
  }

  const renderRoutines = () => {
    const routineIcons: Record<string, React.ReactNode> = {
      daily: <Clock size={14} className="text-brand-gold" />,
      weekly: <Calendar size={14} className="text-brand-accent" />,
      monthly: <Package size={14} className="text-emerald-500" />,
      quarterly: <Search size={14} className="text-brand-navy" />,
      annually: <Search size={14} className="text-slate-400" />,
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data as RoutineData).map(([freq, items]) => (
          <div key={freq} className="p-6 bg-white border border-slate-100 rounded-3xl group hover:shadow-xl hover:border-brand-gold/20 transition-all duration-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-brand-gold/10 transition-colors">
                {routineIcons[freq] || <Clock size={14} />}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{freq} Cycle</span>
            </div>
            <ul className="space-y-3">
              {(items as string[]).map((item, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-medium">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-brand-gold shrink-0"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderDataPack = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data as DataPackAsset[]).map((asset) => (
          <div key={asset.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-gold/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-gold group-hover:text-white transition-all shadow-sm">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Asset ID: {asset.id}</div>
              <div className="text-xs font-bold text-slate-700 leading-tight">{asset.asset}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActivities = () => {
    return (
      <div className="space-y-6">
        {(data as ActivityItem[]).map((activity, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <GitBranch size={16} className="text-brand-gold" />
              <h4 className="font-heading text-brand-navy">{activity.component}</h4>
            </div>
            <div className="divide-y divide-slate-50">
              {activity.sections.map((section, sIdx) => (
                <div key={sIdx} className="p-6 transition-colors hover:bg-slate-50/30">
                  <div className="font-black text-[10px] text-brand-gold uppercase tracking-[0.2em] mb-2">{section.name}</div>
                  <div className="flex items-start gap-3">
                    <p className="text-sm text-slate-600 leading-relaxed italic">{section.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderComms = () => {
    return (
      <div className="space-y-3">
        {(data as CommunicationLine[]).map((line, idx) => (
          <div key={idx} className="flex flex-col md:flex-row items-center gap-4 p-6 bg-white border border-slate-100 rounded-3xl hover:border-brand-accent/30 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3 min-w-[240px]">
              <div className="px-3 py-1 bg-brand-navy text-white text-[10px] font-black uppercase tracking-tighter rounded-lg shadow-sm">
                {line.from}
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-accent transition-colors" />
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tighter rounded-lg border border-slate-200">
                {line.to}
              </div>
            </div>
            <div className="flex-1 text-sm text-slate-500 font-medium italic border-l md:border-l-0 md:bg-slate-50/50 md:p-3 md:rounded-2xl group-hover:bg-slate-50 transition-colors">
              <span className="md:hidden font-bold text-xs uppercase text-slate-400 block mb-1">Content:</span>
              &quot;{line.content}&quot;
            </div>
            <div className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center text-slate-300 group-hover:bg-brand-accent group-hover:text-white transition-all shadow-inner">
              <MessageSquare size={16} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-heading text-brand-navy flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">
             {icon || <Activity size={20} className="text-brand-gold" />}
          </div>
          {title}
        </h3>
        {type === 'datapack' && (
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Registered Assets</span>
        )}
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        {type === 'routines' && renderRoutines()}
        {type === 'datapack' && renderDataPack()}
        {type === 'activities' && renderActivities()}
        {type === 'comms' && renderComms()}
      </div>
    </section>
  );
};
