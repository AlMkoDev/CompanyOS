import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface AccessStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function AccessState({ title, message, actionLabel, onAction }: AccessStateProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-brand-navy">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-3xl font-heading text-brand-navy mb-3">{title}</h2>
        <p className="text-slate-500 leading-relaxed">{message}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-premium mt-8 inline-flex items-center gap-2">
            <Lock size={16} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function UnauthorizedEntry(props: Omit<AccessStateProps, 'title'>) {
  return <AccessState title="Unauthorized Entry" {...props} />;
}

export function RestrictedRecord(props: Omit<AccessStateProps, 'title'>) {
  return <AccessState title="Restricted Record" {...props} />;
}

