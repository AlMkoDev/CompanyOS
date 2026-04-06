"use client";

import React from 'react';
import Link from 'next/link';
import { Building2, Lock, Save, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { canManageAccountingSettings } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

const ACTIVATION_SCOPE_OPTIONS = [
  { value: 'FULL_RECOMMENDED', label: 'Full recommended', description: 'Load the full recommended chart and optional packs.' },
  { value: 'CORE_ONLY', label: 'Core only', description: 'Load only the core baseline accounts.' },
  { value: 'CORE_AND_REGULATORY', label: 'Core + regulatory', description: 'Load the core chart plus regulatory control accounts.' },
  { value: 'MODULE_SELECTED', label: 'Selected modules', description: 'Load the baseline plus only the module packs you choose.' },
] as const;

type ActivationScope = (typeof ACTIVATION_SCOPE_OPTIONS)[number]['value'];

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
  activation_scope?: ActivationScope;
  selected_module_codes?: string[];
  regulatory_packs: Array<{ code: string; name: string; reason: string }>;
  warnings: string[];
  catalog_preview?: {
    total_accounts: number;
    core_accounts: number;
    regulatory_accounts: number;
    optional_accounts: number;
    module_dependent_accounts: number;
    sample_accounts: Array<{
      code: string;
      name: string;
      account_type?: string | null;
      jurisdiction?: string | null;
      module_dependency?: string | null;
      is_core: boolean;
      is_regulatory: boolean;
      is_optional: boolean;
    }>;
  };
};

type ActivationDryRun = {
  template_code: string;
  template_name: string;
  activation_scope?: ActivationScope;
  selected_module_codes?: string[];
  existing_company_accounts: number;
  template_accounts_considered: number;
  accounts_to_create: number;
  collisions: number;
  resolved_collisions?: number;
  skipped_existing_accounts?: number;
  merged_collisions?: number;
  pending_template_adoptions?: number;
  auto_cleared_adoptions?: number;
  governance_warnings: string[];
  to_create_sample: Array<{
    code: string;
    name: string;
    account_type?: string | null;
    jurisdiction?: string | null;
    module_dependency?: string | null;
    is_core: boolean;
    is_regulatory: boolean;
    is_optional: boolean;
  }>;
  collisions_sample: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  resolved_collisions_sample?: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  merged_collisions_sample?: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  pending_template_adoptions_sample?: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  auto_cleared_adoptions_sample?: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
};

type ActivationResult = {
  activated: boolean;
  template_code?: string;
  activation_scope?: ActivationScope;
  message?: string;
  created_count: number;
  created_accounts?: Array<{
    id: string;
    code: string;
    name: string;
    account_type: string;
  }>;
};

type CollisionResolution = {
  code: string;
  existing_id?: string | null;
  resolution: 'KEEP_EXISTING_SKIP_TEMPLATE' | 'ADOPT_TEMPLATE_REMEDIATE_LEGACY' | 'MERGE_INTO_EXISTING_PRESERVE_DATA';
};

type AccountingProfileAudit = {
  id: string;
  action: string;
  change_summary?: string | null;
  created_at: string;
  next_snapshot?: {
    template_code?: string;
    activation_scope?: ActivationScope;
    selected_module_codes?: string[];
    created_count?: number;
    created_codes?: string[];
  } | null;
  actor?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
  } | null;
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

function buildChartActivationHref(options: {
  templateCode?: string;
  activationScope?: ActivationScope;
  createdCodes?: string[];
}) {
  const params = new URLSearchParams();
  params.set("activation", "1");
  if (options.templateCode) params.set("template", options.templateCode);
  if (options.activationScope) params.set("scope", options.activationScope);
  if (options.createdCodes?.length) params.set("created", options.createdCodes.join(","));
  return `/accounting/chart-of-accounts?${params.toString()}`;
}

function buildCollisionReviewHref(code: string) {
  const params = new URLSearchParams();
  params.set('q', code);
  return `/accounting/chart-of-accounts?${params.toString()}`;
}

function buildTemplateAdoptionHref(code: string) {
  const params = new URLSearchParams();
  params.set('q', code);
  params.set('legacyCollision', 'adopt-template');
  return `/accounting/chart-of-accounts?${params.toString()}`;
}

export default function AccountingSettingsPage() {
  const { user } = useAuthStore();
  const canEdit = canManageAccountingSettings(user);
  const [companyName, setCompanyName] = React.useState('Company');
  const [form, setForm] = React.useState<AccountingProfileForm>(defaultForm());
  const [savedForm, setSavedForm] = React.useState<AccountingProfileForm>(defaultForm());
  const [templateRecommendation, setTemplateRecommendation] = React.useState<Recommendation | null>(null);
  const [activationDryRun, setActivationDryRun] = React.useState<ActivationDryRun | null>(null);
  const [activationResult, setActivationResult] = React.useState<ActivationResult | null>(null);
  const [activationScope, setActivationScope] = React.useState<ActivationScope>('FULL_RECOMMENDED');
  const [selectedModuleCodes, setSelectedModuleCodes] = React.useState<string[]>([]);
  const [collisionResolutions, setCollisionResolutions] = React.useState<CollisionResolution[]>([]);
  const [showActivationConfirmation, setShowActivationConfirmation] = React.useState(false);
  const [activationConfirmed, setActivationConfirmed] = React.useState(false);
  const [history, setHistory] = React.useState<AccountingProfileAudit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [recommendationLoading, setRecommendationLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const frameworkOptions = FRAMEWORK_OPTIONS[form.primaryJurisdiction] || FRAMEWORK_OPTIONS.ZA;
  const currencyOptions = CURRENCY_OPTIONS[form.primaryJurisdiction] || CURRENCY_OPTIONS.ZA;
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const scopeLabel =
    ACTIVATION_SCOPE_OPTIONS.find((option) => option.value === activationScope)?.label || 'Full recommended';
  const activationHistory = history.filter((item) => item.action === 'template_activation');

  const buildTemplateRequestPayload = React.useCallback(
    (profileForm: AccountingProfileForm) => ({
      accounting_profile: buildPayload(profileForm),
      activation_scope: activationScope,
      selected_module_codes: selectedModuleCodes,
      collision_resolutions: collisionResolutions,
    }),
    [activationScope, selectedModuleCodes, collisionResolutions],
  );

  const loadHistory = React.useCallback(async () => {
    const historyResponse = await apiFetch('/company/accounting-profile/history');
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      setHistory(Array.isArray(historyData) ? historyData : []);
    }
  }, []);

  const refreshTemplateInsights = React.useCallback(async (profileForm: AccountingProfileForm) => {
    if (profileForm.primaryJurisdiction === 'ZW' && !profileForm.functionalCurrencyJustification.trim()) {
      setTemplateRecommendation(null);
      setActivationDryRun(null);
      return;
    }

    setRecommendationLoading(true);
    try {
      const payload = buildTemplateRequestPayload(profileForm);
      const response = await apiFetch('/company/accounting-template-recommendation/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setTemplateRecommendation(null);
        setActivationDryRun(null);
        return;
      }

      const data = await response.json();
      setTemplateRecommendation(data.recommendation || null);

      const dryRunResponse = await apiFetch('/company/accounting-template-activation/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (dryRunResponse.ok) {
        const dryRunData = await dryRunResponse.json();
        setActivationDryRun(dryRunData.dry_run || null);
      } else {
        setActivationDryRun(null);
      }
    } catch (previewError) {
      console.error(previewError);
      setTemplateRecommendation(null);
      setActivationDryRun(null);
    } finally {
      setRecommendationLoading(false);
    }
  }, [buildTemplateRequestPayload]);

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

        await loadHistory();
      } catch (loadError) {
        console.error(loadError);
        setError('We could not load the company accounting profile just now.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadCompany();
  }, [loadHistory]);

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
    const requiredCodes = (templateRecommendation?.modules || [])
      .filter((module) => module.required)
      .map((module) => module.code);
    const availableCodes = new Set((templateRecommendation?.modules || []).map((module) => module.code));

    setSelectedModuleCodes((current) => {
      const retained = current.filter((code) => availableCodes.has(code));
      const merged = Array.from(new Set([...requiredCodes, ...retained]));
      return JSON.stringify(merged) === JSON.stringify(current) ? current : merged;
    });
  }, [templateRecommendation]);

  React.useEffect(() => {
    setCollisionResolutions((current) => {
      if (!activationDryRun) {
        return current.length ? [] : current;
      }

      const liveCodes = new Set([
        ...activationDryRun.collisions_sample.map((item) => item.code.toUpperCase()),
        ...(activationDryRun.resolved_collisions_sample || []).map((item) => item.code.toUpperCase()),
        ...(activationDryRun.merged_collisions_sample || []).map((item) => item.code.toUpperCase()),
        ...(activationDryRun.pending_template_adoptions_sample || []).map((item) => item.code.toUpperCase()),
        ...(activationDryRun.auto_cleared_adoptions_sample || []).map((item) => item.code.toUpperCase()),
      ]);

      const next = current.filter((item) => liveCodes.has(item.code.toUpperCase()));
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [activationDryRun]);

  React.useEffect(() => {
    setActivationResult(null);
    setShowActivationConfirmation(false);
    setActivationConfirmed(false);
  }, [activationScope, selectedModuleCodes, collisionResolutions, form]);

  const setCollisionResolution = React.useCallback((
    code: string,
    resolution: CollisionResolution['resolution'] | null,
    existingId?: string | null,
  ) => {
    const normalizedCode = code.trim().toUpperCase();
    setCollisionResolutions((current) => {
      const remaining = current.filter((item) => item.code.toUpperCase() !== normalizedCode);
      if (!resolution) {
        return remaining;
      }

      return [...remaining, { code: normalizedCode, existing_id: existingId || null, resolution }];
    });
  }, []);

  React.useEffect(() => {
    const loadRecommendation = async () => {
      await refreshTemplateInsights(form);
    };

    const timeout = window.setTimeout(() => void loadRecommendation(), 250);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [form, refreshTemplateInsights]);

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
      setActivationResult(null);
      setMessage('Accounting settings updated. The jurisdiction and reporting foundation is now saved.');
      await loadHistory();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the accounting profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivation = async () => {
    if (!canEdit) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    setActivationResult(null);
    try {
      const response = await apiFetch('/company/accounting-template-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildTemplateRequestPayload(form)),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Unable to activate the recommended chart.');
      }
      const data = await response.json();
      const result = data as ActivationResult;
      setActivationResult(result);
      setMessage(
        result.activated
          ? `Recommended chart activated. ${result.created_count} account${result.created_count === 1 ? '' : 's'} created.`
          : result.message || 'No new template accounts were created.',
      );
      setShowActivationConfirmation(false);
      setActivationConfirmed(false);
      await Promise.all([refreshTemplateInsights(form), loadHistory()]);
    } catch (activationError) {
      console.error(activationError);
      setError(activationError instanceof Error ? activationError.message : 'Unable to activate the recommended chart.');
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
                {templateRecommendation.catalog_preview ? (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Chart activation preview</div>
                    <div className="mt-2 text-sm text-slate-500">
                      Scope: <span className="font-semibold text-brand-navy">{ACTIVATION_SCOPE_OPTIONS.find((option) => option.value === activationScope)?.label || 'Full recommended'}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <SummaryMetric label="Total" value={`${templateRecommendation.catalog_preview.total_accounts}`} />
                      <SummaryMetric label="Core" value={`${templateRecommendation.catalog_preview.core_accounts}`} />
                      <SummaryMetric label="Regulatory" value={`${templateRecommendation.catalog_preview.regulatory_accounts}`} />
                      <SummaryMetric label="Optional" value={`${templateRecommendation.catalog_preview.optional_accounts}`} />
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Sample accounts that would load</div>
                      <div className="mt-3 space-y-2">
                        {templateRecommendation.catalog_preview.sample_accounts.map((account) => (
                          <div key={account.code} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3">
                            <div>
                              <div className="text-sm font-semibold text-brand-navy">{account.code} · {account.name}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {account.jurisdiction ? `${account.jurisdiction} specific` : 'Global core'}
                                {account.module_dependency ? ` · ${account.module_dependency}` : ''}
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1">
                              {account.account_type ? <AccountTypeBadge accountType={account.account_type} /> : null}
                              {account.is_core ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">Core</span> : null}
                              {account.is_regulatory ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">Reg</span> : null}
                              {account.is_optional ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Optional</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Recommendation guidance will appear once the accounting profile is complete enough to evaluate.</div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activation readiness</div>
            <h2 className="mt-2 text-xl font-heading text-brand-navy">COA Activation Dry-Run</h2>
            {recommendationLoading ? (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Refreshing activation preview...</div>
            ) : activationDryRun ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Activation scope</div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {ACTIVATION_SCOPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setActivationScope(option.value)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          activationScope === option.value
                            ? 'border-brand-navy bg-brand-navy text-white'
                            : 'border-slate-200 bg-white text-slate-700'
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div className={`mt-1 text-xs ${activationScope === option.value ? 'text-white/80' : 'text-slate-500'}`}>
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  {activationScope === 'MODULE_SELECTED' && templateRecommendation?.modules?.length ? (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-brand-navy">Module packs</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {templateRecommendation.modules.map((module) => {
                          const selected = selectedModuleCodes.includes(module.code);
                          return (
                            <button
                              key={module.code}
                              type="button"
                              disabled={!canEdit || module.required}
                              onClick={() =>
                                setSelectedModuleCodes((current) =>
                                  current.includes(module.code)
                                    ? current.filter((code) => code !== module.code)
                                    : [...current, module.code],
                                )
                              }
                              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                                selected
                                  ? 'border-brand-navy bg-brand-navy text-white'
                                  : 'border-slate-200 bg-white text-slate-600'
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              {module.code}
                              {module.required ? ' · Required' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivationConfirmation(true);
                      setActivationConfirmed(false);
                    }}
                    disabled={!canEdit || isSaving || activationDryRun.collisions > 0 || activationDryRun.accounts_to_create === 0}
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Review Activation Summary
                  </button>
                  {activationDryRun.collisions > 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Activation is blocked until code collisions are resolved in the current chart.
                    </div>
                  ) : null}
                </div>

                {showActivationConfirmation ? (
                  <div className="rounded-2xl border border-brand-navy/15 bg-brand-navy/5 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pre-activation confirmation</div>
                    <h3 className="mt-2 text-lg font-heading text-brand-navy">Final admin confirmation</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Review this activation one more time before we write accounts into the company chart.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                      <SummaryMetric label="Scope" value={scopeLabel} />
                      <SummaryMetric label="To create" value={`${activationDryRun.accounts_to_create}`} />
                      <SummaryMetric label="Collisions" value={`${activationDryRun.collisions}`} />
                      <SummaryMetric label="Legacy kept" value={`${activationDryRun.resolved_collisions ?? 0}`} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                      <div className="font-semibold text-brand-navy">Activation summary</div>
                      <div className="mt-3 grid gap-2">
                        <div>
                          <span className="font-semibold text-brand-navy">Template:</span> {activationDryRun.template_name} ({activationDryRun.template_code})
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Scope:</span> {scopeLabel}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Selected modules:</span>{' '}
                          {selectedModuleCodes.length > 0 ? selectedModuleCodes.join(', ') : 'No additional module packs selected'}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Accounts to create:</span> {activationDryRun.accounts_to_create}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Code collisions:</span> {activationDryRun.collisions}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Legacy accounts kept:</span> {activationDryRun.resolved_collisions ?? 0}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Merged into existing:</span> {activationDryRun.merged_collisions ?? 0}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-navy">Pending template adoptions:</span> {activationDryRun.pending_template_adoptions ?? 0}
                        </div>
                      </div>
                    </div>

                    <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={activationConfirmed}
                        onChange={(event) => setActivationConfirmed(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                      />
                      <span>
                        I confirm that I have reviewed the scope, module selection, account counts, and collision posture for this chart activation.
                      </span>
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleActivation}
                        disabled={!activationConfirmed || isSaving || activationDryRun.collisions > 0 || activationDryRun.accounts_to_create === 0}
                        className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isSaving ? 'Activating...' : 'Confirm And Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowActivationConfirmation(false);
                          setActivationConfirmed(false);
                        }}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 text-center">
                  <SummaryMetric label="Existing" value={`${activationDryRun.existing_company_accounts}`} />
                  <SummaryMetric label="Template" value={`${activationDryRun.template_accounts_considered}`} />
                  <SummaryMetric label="To create" value={`${activationDryRun.accounts_to_create}`} />
                  <SummaryMetric label="Collisions" value={`${activationDryRun.collisions}`} />
                </div>

                {(activationDryRun.resolved_collisions ?? 0) > 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    <div className="font-semibold">
                      {activationDryRun.resolved_collisions} legacy collision{activationDryRun.resolved_collisions === 1 ? '' : 's'} marked to keep the existing operational account.
                    </div>
                    <div className="mt-2 text-emerald-700/90">
                      The matching queued template accounts will be skipped during activation, while the rest of the recommended chart can still proceed.
                    </div>
                  </div>
                ) : null}

                {(activationDryRun.merged_collisions ?? 0) > 0 ? (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                    <div className="font-semibold">
                      {activationDryRun.merged_collisions} collision{activationDryRun.merged_collisions === 1 ? '' : 's'} marked to merge into the existing operational account.
                    </div>
                    <div className="mt-2 text-sky-800/90">
                      Historical data stays on the legacy account. The queued template duplicate is skipped, and the existing account is treated as the live operational line for that code.
                    </div>
                  </div>
                ) : null}

                {(activationDryRun.pending_template_adoptions ?? 0) > 0 ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    <div className="font-semibold">
                      {activationDryRun.pending_template_adoptions} collision{activationDryRun.pending_template_adoptions === 1 ? '' : 's'} marked for template adoption still need legacy-account remediation.
                    </div>
                    <div className="mt-2 text-amber-800/90">
                      Activation stays blocked for these codes until the legacy account is reclassified, deactivated, or otherwise remediated in the live Chart of Accounts.
                    </div>
                  </div>
                ) : null}

                {(activationDryRun.auto_cleared_adoptions ?? 0) > 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    <div className="font-semibold">
                      {activationDryRun.auto_cleared_adoptions} pending template adoption{activationDryRun.auto_cleared_adoptions === 1 ? '' : 's'} cleared automatically.
                    </div>
                    <div className="mt-2 text-emerald-700/90">
                      The legacy account no longer blocks that code, so the queued template account is now ready to create on the next activation.
                    </div>
                  </div>
                ) : null}

                {activationResult ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    <div className="font-semibold">
                      {activationResult.activated
                        ? `${activationResult.created_count} account${activationResult.created_count === 1 ? '' : 's'} created from ${activationResult.template_code}.`
                        : activationResult.message || 'No new template accounts were created.'}
                    </div>
                    {activationResult.created_accounts?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activationResult.created_accounts.slice(0, 8).map((account) => (
                          <span key={account.id} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            {account.code} · {account.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {activationResult.activated ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-slate-700">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Post-activation working set</div>
                        <div className="mt-2 text-sm font-semibold text-brand-navy">Continue in Chart of Accounts</div>
                        <div className="mt-2 text-sm text-slate-600">
                          Open the company chart to review the newly created account set, validate hierarchy, and continue account-level governance work.
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={buildChartActivationHref({
                              templateCode: activationResult.template_code,
                              activationScope: activationResult.activation_scope,
                              createdCodes: activationResult.created_accounts?.map((account) => account.code) || [],
                            })}
                            className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90"
                          >
                            Open Chart Of Accounts
                          </Link>
                          <span className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {activationResult.created_count} newly created
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <RecommendationList
                  title="Governance Warnings"
                  items={activationDryRun.governance_warnings.map((warning, index) => ({
                    key: `${index}-${warning}`,
                    label: warning,
                  }))}
                  emptyState="No additional dry-run governance warnings were raised."
                />

                <RecommendationList
                  title="Accounts That Would Be Created"
                  items={activationDryRun.to_create_sample.map((account) => ({
                    key: account.code,
                    label: `${account.code} · ${account.name}`,
                    detail: `${account.jurisdiction ? `${account.jurisdiction} specific` : 'Global baseline'}${account.module_dependency ? ` · ${account.module_dependency}` : ''}`,
                    badge: account.account_type ? prettifyAccountType(account.account_type) : account.is_regulatory ? 'Reg' : account.is_core ? 'Core' : account.is_optional ? 'Optional' : undefined,
                  }))}
                  emptyState="The current company chart already covers this template sample."
                />

                <CollisionComparisonList
                  collisions={activationDryRun.collisions_sample}
                  resolvedCollisions={activationDryRun.resolved_collisions_sample || []}
                  mergedCollisions={activationDryRun.merged_collisions_sample || []}
                  pendingTemplateAdoptions={activationDryRun.pending_template_adoptions_sample || []}
                  autoClearedAdoptions={activationDryRun.auto_cleared_adoptions_sample || []}
                  onResolve={setCollisionResolution}
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Dry-run activation preview will appear once the accounting profile is complete enough to evaluate.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activation history</div>
            <h2 className="mt-2 text-xl font-heading text-brand-navy">Recent Chart Activations</h2>
            <div className="mt-5 space-y-3">
              {activationHistory.length > 0 ? activationHistory.map((item) => {
                const snapshot = item.next_snapshot || {};
                const historyScopeLabel = snapshot.activation_scope
                  ? ACTIVATION_SCOPE_OPTIONS.find((option) => option.value === snapshot.activation_scope)?.label || snapshot.activation_scope
                  : 'Full recommended';
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-brand-navy">
                        {item.change_summary || 'Chart activation recorded.'}
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Activated
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <div>
                        <span className="font-semibold text-brand-navy">Template:</span>{' '}
                        {snapshot.template_code || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-semibold text-brand-navy">Scope:</span>{' '}
                        {historyScopeLabel}
                      </div>
                      <div>
                        <span className="font-semibold text-brand-navy">Accounts created:</span>{' '}
                        {snapshot.created_count ?? 0}
                      </div>
                      <div>
                        <span className="font-semibold text-brand-navy">Modules:</span>{' '}
                        {snapshot.selected_module_codes?.length
                          ? snapshot.selected_module_codes.join(', ')
                          : 'No additional module packs recorded'}
                      </div>
                    </div>
                    {snapshot.created_codes?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {snapshot.created_codes.slice(0, 8).map((code) => (
                          <span key={code} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 text-sm text-slate-500">
                      {item.actor ? `${item.actor.first_name} ${item.actor.last_name}` : 'System or legacy actor'}
                      {' · '}
                      {new Date(item.created_at).toLocaleString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="mt-3">
                      <Link
                        href={buildChartActivationHref({
                          templateCode: snapshot.template_code,
                          activationScope: snapshot.activation_scope,
                          createdCodes: snapshot.created_codes || [],
                        })}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy transition hover:bg-slate-50"
                      >
                        Open Chart Of Accounts
                      </Link>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Chart activation history will appear here after the first governed template activation is completed.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Governance history</div>
            <h2 className="mt-2 text-xl font-heading text-brand-navy">Recent Accounting Profile Changes</h2>
            <div className="mt-5 space-y-3">
              {history.length > 0 ? history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-brand-navy">
                      {item.change_summary || 'Accounting profile change recorded.'}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {item.action}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.actor ? `${item.actor.first_name} ${item.actor.last_name}` : 'System or legacy actor'}
                    {' · '}
                    {new Date(item.created_at).toLocaleString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Accounting profile audit history will appear here after the first governed change is saved.
                </div>
              )}
            </div>
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

function CollisionComparisonList({
  collisions,
  resolvedCollisions,
  mergedCollisions,
  pendingTemplateAdoptions,
  autoClearedAdoptions,
  onResolve,
}: {
  collisions: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
  }>;
  resolvedCollisions: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
  }>;
  mergedCollisions: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
  }>;
  pendingTemplateAdoptions: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  autoClearedAdoptions: Array<{
    code: string;
    template_name: string;
    template_account_type?: string | null;
    existing_name?: string | null;
    existing_type?: string | null;
    existing_id?: string | null;
    existing_active?: boolean | null;
    resolution?: string | null;
    remediation_status?: string | null;
    remediation_note?: string | null;
  }>;
  onResolve: (code: string, resolution: CollisionResolution['resolution'] | null, existingId?: string | null) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Queued vs existing COA collisions</div>
      <div className="mt-2 text-sm text-slate-600">
        Where a legacy account already uses the same code, choose whether to keep it, merge the template intent into it while preserving historical data, or adopt the template only after the legacy account is remediated.
      </div>
      <div className="mt-3 space-y-3">
        {collisions.length > 0 ? collisions.map((collision) => (
          <div key={collision.code} className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-brand-navy">Code {collision.code} is already in use</div>
              <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">
                Collision
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Queued for deployment</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">
                  {collision.code} · {collision.template_name}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {collision.template_account_type ? <AccountTypeBadge accountType={collision.template_account_type} /> : null}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Template account
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Existing operational COA</div>
                <div className="mt-2 text-sm font-semibold text-brand-navy">
                  {collision.code} · {collision.existing_name || 'Unknown account'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {collision.existing_type ? <AccountTypeBadge accountType={collision.existing_type} /> : null}
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      collision.existing_active === false
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {collision.existing_active === false ? 'Inactive existing account' : 'Active existing account'}
                  </span>
                </div>
                {collision.existing_id ? (
                  <div className="mt-2 text-xs text-slate-500">Operational account ID: {collision.existing_id}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onResolve(collision.code, 'KEEP_EXISTING_SKIP_TEMPLATE', collision.existing_id)}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90"
              >
                Keep existing and skip queued account
              </button>
              <Link
                href={buildCollisionReviewHref(collision.code)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy transition hover:bg-slate-50"
              >
                Review existing account in COA
              </Link>
              <button
                type="button"
                onClick={() => onResolve(collision.code, 'ADOPT_TEMPLATE_REMEDIATE_LEGACY', collision.existing_id)}
                className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
              >
                Adopt template and remediate legacy account
              </button>
              <button
                type="button"
                onClick={() => onResolve(collision.code, 'MERGE_INTO_EXISTING_PRESERVE_DATA', collision.existing_id)}
                className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-100"
              >
                Merge into existing and preserve legacy data
              </button>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No code collisions were detected in the dry-run sample.
          </div>
        )}
      </div>

      {resolvedCollisions.length > 0 ? (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Resolved legacy collisions</div>
          <div className="mt-2 text-sm text-slate-600">
            These queued template accounts are now marked to be skipped while the existing operational account is kept.
          </div>
          <div className="mt-3 space-y-3">
            {resolvedCollisions.map((collision) => (
              <div key={`resolved-${collision.code}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-navy">Code {collision.code} will keep the existing operational account</div>
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    Resolved
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-brand-navy">Queued template account:</span> {collision.template_name}
                  </div>
                  <div>
                    <span className="font-semibold text-brand-navy">Existing operational account:</span> {collision.existing_name || 'Unknown account'}
                    {collision.existing_active === false ? ' (inactive)' : ' (active)'}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onResolve(collision.code, null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reopen collision
                  </button>
                  <Link
                    href={buildCollisionReviewHref(collision.code)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy transition hover:bg-slate-50"
                  >
                    Open in COA
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mergedCollisions.length > 0 ? (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Merged with existing account</div>
          <div className="mt-2 text-sm text-slate-600">
            These codes will use the existing operational account as the live line while preserving all historical data already posted there.
          </div>
          <div className="mt-3 space-y-3">
            {mergedCollisions.map((collision) => (
              <div key={`merged-${collision.code}`} className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-navy">Code {collision.code} will merge into the existing operational account</div>
                  <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                    Data preserved
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-brand-navy">Queued template account:</span> {collision.template_name}
                  </div>
                  <div>
                    <span className="font-semibold text-brand-navy">Existing operational account retained:</span> {collision.existing_name || 'Unknown account'}
                    {collision.existing_active === false ? ' (inactive)' : ' (active)'}
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  No historical postings are moved or deleted. The queued duplicate is skipped and the existing account remains the live operational record for this code.
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onResolve(collision.code, null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reopen collision
                  </button>
                  <Link
                    href={buildCollisionReviewHref(collision.code)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy transition hover:bg-slate-50"
                  >
                    Open in COA
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pendingTemplateAdoptions.length > 0 ? (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pending template adoption</div>
          <div className="mt-2 text-sm text-slate-600">
            These codes are marked to adopt the template account, but the current legacy account still needs remediation in the live company chart before activation can continue. Once the legacy account no longer occupies that code, the next dry-run will clear the block automatically.
          </div>
          <div className="mt-3 space-y-3">
            {pendingTemplateAdoptions.map((collision) => (
              <div key={`pending-${collision.code}`} className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-navy">Code {collision.code} is queued for template adoption</div>
                  <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                    Pending remediation
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-brand-navy">Template account to adopt:</span> {collision.template_name}
                  </div>
                  <div>
                    <span className="font-semibold text-brand-navy">Legacy account to remediate:</span> {collision.existing_name || 'Unknown account'}
                    {collision.existing_active === false ? ' (inactive)' : ' (active)'}
                  </div>
                  <div>
                    <span className="font-semibold text-brand-navy">Remediation status:</span> {prettifyRemediationStatus(collision.remediation_status)}
                  </div>
                </div>
                {collision.remediation_note ? (
                  <div className="mt-2 text-sm text-slate-600">{collision.remediation_note}</div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildTemplateAdoptionHref(collision.code)}
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90"
                  >
                    Open legacy remediation workflow
                  </Link>
                  <button
                    type="button"
                    onClick={() => onResolve(collision.code, null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reopen collision
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {autoClearedAdoptions.length > 0 ? (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pending adoption cleared</div>
          <div className="mt-2 text-sm text-slate-600">
            These template adoptions no longer collide with the live company chart and are now ready to create during activation.
          </div>
          <div className="mt-3 space-y-3">
            {autoClearedAdoptions.map((collision) => (
              <div key={`cleared-${collision.code}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-navy">Code {collision.code} is now ready for template creation</div>
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    Cleared
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-brand-navy">Template account now ready:</span> {collision.template_name}
                  </div>
                  <div>
                    <span className="font-semibold text-brand-navy">Legacy remediation outcome:</span> {prettifyRemediationStatus(collision.remediation_status)}
                  </div>
                </div>
                {collision.remediation_note ? (
                  <div className="mt-2 text-sm text-slate-600">{collision.remediation_note}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function prettifyAccountType(accountType: string) {
  const normalized = accountType.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function prettifyRemediationStatus(status?: string | null) {
  if (!status) return 'Active';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function AccountTypeBadge({ accountType }: { accountType: string }) {
  return (
    <span className="rounded-full bg-brand-navy/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy">
      {prettifyAccountType(accountType)}
    </span>
  );
}
