"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Plus,
  Upload,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  Send
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: Record<string, string>;
}

type FormValue = string | number;

export default function NewContractWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      try {
        const resp = await fetch('/api/clm/templates');
        const data = await resp.json();
        if (isMounted) {
          setTemplates(data);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({}); // Reset form
    setStep(2);
  };

  const handleInputChange = (key: string, value: FormValue) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      const resp = await fetch('/api/clm/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate?.id,
          variables: formData
        }),
      });
      const data = await resp.json();
      router.push(`/strategy/clm/${data.id}`);
    } catch (err) {
      console.error('Error generating contract:', err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header & Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
            New Contract Wizard
          </h1>
          <p className="text-slate-500 mt-1">Generate legally reviewed agreements in seconds.</p>
        </div>
        
        <div className="flex items-center gap-2 px-1 py-1 bg-slate-100 rounded-full w-fit">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>1. Select Template</div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>2. Details</div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 3 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>3. Review</div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Custom Upload Card */}
            <div 
              className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Upload Raw PDF</h3>
                <p className="text-xs text-slate-500 mt-1 px-4">Fast-track by uploading a pre-signed or externally drafted document.</p>
              </div>
            </div>

            {templates.map(template => (
              <div 
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="group bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600">
                    {template.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{template.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">Standard {template.category} template with pre-approved legal language.</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-slate-50">
                  <span className="flex items-center gap-1 group-hover:text-slate-600 transition-colors">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Auto-generation
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-start max-w-2xl mx-auto">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900 underline decoration-indigo-200">Legal Note:</span> Templates are pre-screened by the Legal Department. Any manual modifications to raw content after generation will require a secondary compliance audit.
            </div>
          </div>
        </div>
      )}

      {step === 2 && selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.title}</h2>
                  <p className="text-sm text-slate-500">Please provide the necessary variables to populate the template.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(selectedTemplate.variables).map(([key, type]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                      {key.replace(/_/g, ' ')}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      {type === 'date' ? (
                        <div className="relative">
                          <input 
                            type="date"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all group-hover:border-indigo-300"
                            onChange={(e) => handleInputChange(key, e.target.value)}
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 pointer-events-none" />
                        </div>
                      ) : type === 'number' ? (
                        <input 
                          type="number"
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all group-hover:border-indigo-300"
                          onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                        />
                      ) : type === 'text' ? (
                        <textarea 
                          rows={3}
                          placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all group-hover:border-indigo-300"
                          onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                      ) : (
                        <input 
                          type="text"
                          placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all group-hover:border-indigo-300"
                          onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-50">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={Object.keys(formData).length === 0}
                  className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue to Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
              <ShieldCheck className="absolute top-[-20px] right-[-20px] w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-4">
                <div className="p-3 bg-white/10 rounded-xl w-fit">
                  <Plus className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold">Dynamic Generation</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Our AI-powered engine will inject your variables into the pre-approved legal framework below. No manual drafting required.</p>
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Enforced Approval Hierarchy</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Immutable Audit Logging</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>S3 Encrypted Storage</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
               <h4 className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
                 <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                 Pro Tip
               </h4>
               <p className="text-xs text-amber-800 leading-relaxed leading-relaxed opacity-80">
                 Ensure the <b>Party Name</b> matches the legal entity registered with the Chamber of Commerce to prevent signing errors.
               </p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl space-y-0">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <h2 className="font-bold text-slate-900 truncate max-w-[400px]">Review: {selectedTemplate?.title}</h2>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Edit Information
                </button>
             </div>
             
             <div className="p-8 space-y-8 min-h-[400px]">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">{key.replace(/_/g, ' ')}</span>
                      <span className="text-slate-900 font-medium">{value.toString()}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 bg-indigo-50/30 rounded-xl border border-indigo-100/50 space-y-4">
                  <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Generation Summary
                  </h4>
                  <ul className="text-xs text-indigo-800 space-y-2 opacity-80 list-disc ml-4">
                    <li>This will create a new <b>DRAFT</b> contract in the system.</li>
                    <li>Automatic owner assignment to <b>Current User</b>.</li>
                    <li>The document will be stored in a private <b>S3 Encryption Bucket</b>.</li>
                  </ul>
                </div>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                   onClick={handleSubmit}
                   className="px-10 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Generate Contract
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
