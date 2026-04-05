"use client";

import React from 'react';
import Link from 'next/link';
import { Building2, Lock, Save, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { canManageAccountingSettings } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

const FRAMEWORK_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  ZA: [
    { value: 'IFRS_FULL', label: 'IFRS Full' },
    { value: 'IFRS_SME', label: 'IFRS for SMEs' },
    { value: 'SA_GAAP_LEGACY', label: 'SA GAAP (Legacy)' },
  ],
  ZW: [
    { value: 'ZW_IFRS_FULL', label: 'Zimbabwe IFRS Full' },
    { value: 'ZW_IFRS29', label: 'Zimbabwe IFRS + IAS 29' },
  ],
};

const CURRENCY_OPTIONS: Record<string, string[]> = {
  ZA: ['ZAR', 'USD', 'EUR', 'GBP'],
  ZW: ['ZIG', 'USD', 'ZAR', 'GBP'],
};

type Recommendation = {
  template_code: string;
  template_name: string;
  template_description: string;
  rationale: string;
  modules: Array<{ code: string; name: string; required: boolean; reason: string }>;
  regulatory_packs: Array<{ code: string; name: string; reason: string }>;
  warnings: string[];
};

type AccountingProfileForm = {
  primaryJurisdiction: 'ZA' | 'ZW';
  operatingJurisdictions: string[];
  reportingFramework: string;
  functionalCurrency: string;
  presentationCurrency: string;
  functionalCurrencyJustification: string;
  zwIas29Applicable: boolean;
  zwPriorIas29Application: boolean;
  crossBorderOperations: boolean;
  consolidatesSubsidiaries: boolean;
  vatRegistered: boolean;
  pfmaEntity: boolean;
  sdlExempt: boolean;
  annualPayrollEstimate: string;
};

function defaultForm(): AccountingProfileForm {
  return {
    primaryJurisdiction: 'ZA',
    operatingJurisdictions: ['ZA'],
    reportingFramework: 'IFRS_FULL',
    functionalCurrency: 'ZAR',
    presentationCurrency: 'ZAR',
    functionalCurrencyJustification: '',
    zwIas29Applicable: false,
    zwPriorIas29Application: false,
    crossBorderOperations: false,
    consolidatesSubsidiaries: false,
    vatRegistered: false,
    pfmaEntity: false,
    sdlExempt: false,
    annualPayrollEstimate: '',
  };
}

function normalizeProfile(profile: Record<string, any> | null | undefined): AccountingProfileForm {
  const primaryJurisdiction = (profile?.primary_jurisdiction || 'ZA') as 'ZA' | 'ZW';
  return {
    primaryJurisdiction,
    operatingJurisdictions:
      Array.isArray(profile?.operating_jurisdictions) && profile.operating_jurisdictions.length > 0
        ? profile.operating_jurisdictions
        : [primaryJurisdiction],
    reportingFramework:
      profile?.reporting_framework || (primaryJurisdiction === 'ZW' ? 'ZW_IFRS_FULL' : 'IFRS_FULL'),
    functionalCurrency: profile?.functional_currency || (primaryJurisdiction === 'ZW' ? 'USD' : 'ZAR'),
    presentationCurrency:
      profile?.presentation_currency ||
      profile?.functional_currency ||
      (primaryJurisdiction === 'ZW' ? 'USD' : 'ZAR'),
    functionalCurrencyJustification: profile?.functional_currency_justification || '',
    zwIas29Applicable: Boolean(profile?.zw_ias29_applicable),
    zwPriorIas29Application: Boolean(profile?.zw_prior_ias29_application),
    crossBorderOperations: Boolean(profile?.cross_border_operations),
    consolidatesSubsidiaries: Boolean(profile?.consolidates_subsidiaries),
    vatRegistered: Boolean(profile?.vat_registered),
    pfmaEntity: Boolean(profile?.pfma_entity),
    sdlExempt: Boolean(profile?.sdl_exempt),
    annualPayrollEstimate:
      profile?.annual_payroll_estimate !== null && profile?.annual_payroll_estimate !== undefined
        ? String(profile.annual_payroll_estimate)
        : '',
  };
}

function buildPayload(form: AccountingProfileForm) {
  return {
    primary_jurisdiction: form.primaryJurisdiction,
    operating_jurisdictions: Array.from(new Set(form.operatingJurisdictions)),
    reporting_framework: form.reportingFramework,
    functional_currency: form.functionalCurrency,
    presentation_currency: form.presentationCurrency,
    functional_currency_justification:
      form.primaryJurisdiction === 'ZW' ? form.functionalCurrencyJustification : undefined,
    zw_ias29_applicable: form.primaryJurisdiction === 'ZW' ? form.zwIas29Applicable : false,
    zw_prior_ias29_application: form.primaryJurisdiction === 'ZW' ? form.zwPriorIas29Application : false,
    cross_border_operations: form.crossBorderOperations,
    consolidates_subsidiaries: form.consolidatesSubsidiaries,
    vat_registered: form.vatRegistered,
    pfma_entity: form.primaryJurisdiction === 'ZA' ? form.pfmaEntity : false,
    sdl_exempt: form.primaryJurisdiction === 'ZA' ? form.sdlExempt : false,
    annual_payroll_estimate: form.annualPayrollEstimate.trim() ? Number(form.annualPayrollEstimate) : undefined,
  };
}

export default function AccountingSettingsPage() {
  const { user } = useAuthStore();
  const canEdit = canManageAccountingSettings(user);
  const [companyName, setCompanyName] = React.useState('Company');
  const [form, setForm] = React.useState<AccountingProfileForm>(defaultForm());
  const [savedForm, setSavedForm] = React.useState<AccountingProfileForm>(defaultForm());
  const [templateRecommendation, setTemplateRecommendation] = React.useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [recommendationLoading, setRecommendationLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const frameworkOptions = FRAMEWORK_OPTIONS[form.primaryJurisdiction] || FRAMEWORK_OPTIONS.ZA;
  const currencyOptions = CURRENCY_OPTIONS[form.primaryJurisdiction] || CURRENCY_OPTIONS.ZA;
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  React.useEffect(() => {
    const loadCompany = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch('/company');
        if (!response.ok) throw new Error('Unable to load the company accounting profile.');
        const data = await response.json();
        const nextForm = normalizeProfile(data.accounting_profile);
        setCompanyName(data.name || 'Company');
        setForm(nextForm);
        setSavedForm(nextForm);
      } catch (loadError) {
        console.error(loadError);
        setError('We could not load the company accounting profile just now.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadCompany();
  }, []);

  React.useEffect(() => {
    setForm((current) => {
      const allowedFrameworks = FRAMEWORK_OPTIONS[current.primaryJurisdiction] || FRAMEWORK_OPTIONS.ZA;
      const allowedCurrencies = CURRENCY_OPTIONS[current.primaryJurisdiction] || CURRENCY_OPTIONS.ZA;
      const nextFramework = allowedFrameworks.some((option) => option.value === current.reportingFramework)
        ? current.reportingFramework
        : allowedFrameworks[0]?.value || 'IFRS_FULL';
      const nextFunctionalCurrency = allowedCurrencies.includes(current.functionalCurrency)
        ? current.functionalCurrency
        : allowedCurrencies[0] || 'ZAR';
      const nextPresentationCurrency = allowedCurrencies.includes(current.presentationCurrency)
        ? current.presentationCurrency
        : nextFunctionalCurrency;
      const nextOperatingJurisdictions = Array.from(
        new Set([
          current.primaryJurisdiction,
          ...(current.crossBorderOperations ? current.operatingJurisdictions : [current.primaryJurisdiction]),
        ]),
      );

      return {
        ...current,
        reportingFramework: nextFramework,
        functionalCurrency: nextFunctionalCurrency,
        presentationCurrency: nextPresentationCurrency,
        operatingJurisdictions: nextOperatingJurisdictions,
        zwIas29Applicable: current.primaryJurisdiction === 'ZW' ? current.zwIas29Applicable : false,
        zwPriorIas29Application: current.primaryJurisdiction === 'ZW' ? current.zwPriorIas29Application : false,
        pfmaEntity: current.primaryJurisdiction === 'ZA' ? current.pfmaEntity : false,
        sdlExempt: current.primaryJurisdiction === 'ZA' ? current.sdlExempt : false,
      };
    });
  }, [form.primaryJurisdiction, form.crossBorderOperations]);

  React.useEffect(() => {
    let cancelled = false;
    const loadRecommendation = async () => {
      if (form.primaryJurisdiction === 'ZW' && !form.functionalCurrencyJustification.trim()) {
        setTemplateRecommendation(null);
        return;
      }

      setRecommendationLoading(true);
      try {
        const response = await apiFetch('/company/accounting-template-recommendation/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounting_profile: buildPayload(form) }),
        });
        if (!response.ok) {
          if (!cancelled) setTemplateRecommendation(null);
          return;
        }
        const data = await response.json();
        if (!cancelled) setTemplateRecommendation(data.recommendation || null);
      } catch (previewError) {
        if (!cancelled) {
          console.error(previewError);
          setTemplateRecommendation(null);
        }
      } finally {
        if (!cancelled) setRecommendationLoading(false);
      }
    };

    const timeout = window.setTimeout(() => void loadRecommendation(), 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form]);

  const toggleOperatingJurisdiction = (jurisdiction: 'ZA' | 'ZW') => {
    setForm((current) => {
      if (jurisdiction === current.primaryJurisdiction) return current;
      const next = current.operatingJurisdictions.includes(jurisdiction)
        ? current.operatingJurisdictions.filter((value) => value !== jurisdiction)
        : [...current.operatingJurisdictions, jurisdiction];
      return {
        ...current,
        operatingJurisdictions: Array.from(new Set([current.primaryJurisdiction, ...next])),
      };
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch('/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounting_profile: buildPayload(form) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Unable to save the accounting profile.');
      }
      const data = await response.json();
      const nextForm = normalizeProfile(data.accounting_profile);
      setForm(nextForm);
      setSavedForm(nextForm);
      setMessage('Accounting settings updated. The jurisdiction and reporting foundation is now saved.');
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the accounting profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Accounting Settings</div>
          <h1 className="mt-2 text-3xl font-heading text-brand-navy">Accounting Profile</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Maintain the jurisdiction, framework, and currency foundation that shapes {companyName}&apos;s template recommendation and future COA activation path.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/accounting" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-brand-navy transition hover:bg-slate-50">
            Back to Accounting
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || !isDirty || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Accounting Settings'}
          </button>
        </div>
      </div>

      <div className={`rounded-[28px] border px-6 py-5 shadow-sm ${canEdit ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-3">{canEdit ? <ShieldCheck size={22} /> : <Lock size={22} />}</div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em]">{canEdit ? 'Admin editing enabled' : 'Read-only access'}</div>
            <div className="mt-2 text-sm font-medium">
              {canEdit
                ? 'Only administrators can change these accounting settings, and this page is now the ongoing maintenance surface for them after setup.'
                : 'Only administrators can change these accounting settings. You can review them here, but the fields stay locked for non-admin users.'}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Jurisdiction and framework</div>
          <h2 className="mt-2 text-xl font-heading text-brand-navy">Accounting and Jurisdiction Foundation</h2>
          <p className="mt-2 text-sm text-slate-500">
            This mirrors the setup-side accounting fields for existing companies, but in an operational admin surface instead of the onboarding flow.
          </p>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading the current accounting profile...</div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Primary Jurisdiction">
                  <select value={form.primaryJurisdiction} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, primaryJurisdiction: event.target.value as 'ZA' | 'ZW' }))} className="input-premium disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="ZA">South Africa</option>
                    <option value="ZW">Zimbabwe</option>
                  </select>
                </Field>
                <Field label="Reporting Framework">
                  <select value={form.reportingFramework} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, reportingFramework: event.target.value }))} className="input-premium disabled:bg-slate-50 disabled:text-slate-500">
                    {frameworkOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Field>
                <Field label="Functional Currency">
                  <select value={form.functionalCurrency} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, functionalCurrency: event.target.value }))} className="input-premium disabled:bg-slate-50 disabled:text-slate-500">
                    {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                  </select>
                </Field>
                <Field label="Presentation Currency">
                  <select value={form.presentationCurrency} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, presentationCurrency: event.target.value }))} className="input-premium disabled:bg-slate-50 disabled:text-slate-500">
                    {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                  </select>
                </Field>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-brand-navy">Operating footprint</div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Toggle label="Cross-border operations" checked={form.crossBorderOperations} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, crossBorderOperations: checked }))} />
                  <Toggle label="Consolidates subsidiaries" checked={form.consolidatesSubsidiaries} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, consolidatesSubsidiaries: checked }))} />
                </div>
                {form.crossBorderOperations ? (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-brand-navy">Operating jurisdictions</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['ZA', 'ZW'] as const).map((jurisdiction) => {
                        const selected = form.operatingJurisdictions.includes(jurisdiction);
                        return (
                          <button key={jurisdiction} type="button" disabled={!canEdit || jurisdiction === form.primaryJurisdiction} onClick={() => toggleOperatingJurisdiction(jurisdiction)} className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${selected ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-200 bg-white text-slate-600'} disabled:cursor-not-allowed disabled:opacity-70`}>
                            {jurisdiction}{jurisdiction === form.primaryJurisdiction ? ' (Primary)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-brand-navy">Regulatory posture</div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Toggle label="VAT registered" checked={form.vatRegistered} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, vatRegistered: checked }))} />
                  {form.primaryJurisdiction === 'ZA' ? (
                    <>
                      <Toggle label="PFMA / public entity" checked={form.pfmaEntity} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, pfmaEntity: checked }))} />
                      <Toggle label="SDL exempt" checked={form.sdlExempt} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, sdlExempt: checked }))} />
                      <Field label="Annual Payroll Estimate (ZAR)">
                        <input type="number" value={form.annualPayrollEstimate} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, annualPayrollEstimate: event.target.value }))} className="input-premium disabled:bg-slate-50 disabled:text-slate-500" placeholder="0.00" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Toggle label="IAS 29 review applicable" checked={form.zwIas29Applicable} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, zwIas29Applicable: checked }))} />
                      <Toggle label="Prior IAS 29 application exists" checked={form.zwPriorIas29Application} disabled={!canEdit} onChange={(checked) => setForm((current) => ({ ...current, zwPriorIas29Application: checked }))} />
                      <div className="md:col-span-2">
                        <Field label="Functional Currency Justification">
                          <textarea rows={4} value={form.functionalCurrencyJustification} disabled={!canEdit} onChange={(event) => setForm((current) => ({ ...current, functionalCurrencyJustification: event.target.value }))} className="input-premium resize-none disabled:bg-slate-50 disabled:text-slate-500" placeholder="Document the IAS 21 rationale for the functional currency choice." />
                        </Field>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current posture</div>
                <h2 className="mt-2 text-xl font-heading text-brand-navy">Accounting Foundation Summary</h2>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3"><Building2 className="text-brand-gold" /></div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <SummaryRow label="Primary jurisdiction" value={form.primaryJurisdiction === 'ZA' ? 'South Africa' : 'Zimbabwe'} />
              <SummaryRow label="Framework" value={frameworkOptions.find((option) => option.value === form.reportingFramework)?.label || form.reportingFramework} />
              <SummaryRow label="Functional currency" value={form.functionalCurrency} />
              <SummaryRow label="Presentation currency" value={form.presentationCurrency} />
              <SummaryRow label="Operating footprint" value={form.operatingJurisdictions.join(', ')} />
              <SummaryRow label="Controls posture" value={form.crossBorderOperations || form.consolidatesSubsidiaries ? 'Cross-border / consolidation aware' : 'Single-jurisdiction baseline'} />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Template guidance</div>
            <h2 className="mt-2 text-xl font-heading text-brand-navy">Accounting Template Recommendation</h2>
            {recommendationLoading ? (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Refreshing template recommendation...</div>
            ) : templateRecommendation ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-brand-navy">{templateRecommendation.template_name}</div>
                      <div className="mt-1 text-sm text-slate-500">{templateRecommendation.template_description}</div>
                    </div>
                    <span className="rounded-full bg-brand-navy px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">{templateRecommendation.template_code}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{templateRecommendation.rationale}</p>
                </div>
                <RecommendationList title="Recommended Modules" items={templateRecommendation.modules.map((module) => ({ key: module.code, label: module.name, detail: module.reason, badge: module.required ? 'Required' : 'Optional' }))} emptyState="No modules are currently recommended for this profile." />
                <RecommendationList title="Regulatory Packs" items={templateRecommendation.regulatory_packs.map((pack) => ({ key: pack.code, label: pack.name, detail: pack.reason }))} emptyState="No additional regulatory packs are currently suggested." />
                <RecommendationList title="Wizard Warnings" items={templateRecommendation.warnings.map((warning, index) => ({ key: `${index}-${warning}`, label: warning }))} emptyState="No extra jurisdiction warnings are currently raised for this profile." />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Recommendation guidance will appear once the accounting profile is complete enough to evaluate.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm ${disabled ? 'opacity-80' : ''}`}>
      <span className="font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy" />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-slate-500">{label}</div>
      <div className="text-right font-medium text-brand-navy">{value}</div>
    </div>
  );
}

function RecommendationList({ title, items, emptyState }: { title: string; items: Array<{ key: string; label: string; detail?: string; badge?: string }>; emptyState: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</div>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? items.map((item) => (
          <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-brand-navy">{item.label}</div>
              {item.badge ? <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{item.badge}</span> : null}
            </div>
            {item.detail ? <div className="mt-2 text-sm text-slate-600">{item.detail}</div> : null}
          </div>
        )) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">{emptyState}</div>
        )}
      </div>
    </div>
  );
}
