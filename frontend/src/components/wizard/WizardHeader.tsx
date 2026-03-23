import React from 'react';

const steps = [
  { id: 1, name: 'Identity' },
  { id: 2, name: 'Departments' },
  { id: 3, name: 'Configuration' },
  { id: 4, name: 'Structure' },
  { id: 5, name: 'Governance' },
];

export function WizardHeader({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-gold z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              currentStep === step.id 
                ? 'bg-brand-navy text-white scale-110 shadow-lg' 
                : currentStep > step.id 
                  ? 'bg-brand-gold text-white' 
                  : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <span className={`text-xs mt-2 font-medium ${currentStep === step.id ? 'text-brand-navy' : 'text-slate-400'}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
