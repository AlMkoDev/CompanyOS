"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const frameworkOptions: Record<string, Array<{ value: string; label: string }>> = {
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

const currencyOptions: Record<string, string[]> = {
  ZA: ['ZAR', 'USD', 'EUR', 'GBP'],
  ZW: ['ZIG', 'USD', 'ZAR', 'GBP'],
};

export default function IdentityStep() {
  const [templateRecommendation, setTemplateRecommendation] = useState<{
    template_code: string;
    template_name: string;
    template_description: string;
    rationale: string;
    modules: Array<{ code: string; name: string; required: boolean; reason: string }>;
    regulatory_packs: Array<{ code: string; name: string; reason: string }>;
    warnings: string[];
  } | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [identity, setIdentity] = useState({
    tagline: '',
    industry: '',
    description: '',
    primaryColor: '#0F172A',
    secondaryColor: '#B8860B',
    primaryJurisdiction: 'ZA',
    operatingJurisdictions: ['ZA'] as string[],
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
  });
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const currentFrameworkOptions = frameworkOptions[identity.primaryJurisdiction] || frameworkOptions.ZA;
  const currentCurrencyOptions = currencyOptions[identity.primaryJurisdiction] || currencyOptions.ZA;

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await apiFetch('/company');
        if (res.ok) {
          const data = await res.json();

          // If setup is already complete but local cache was stale, auto-redirect to dashboard
          if (data.setup && (data.setup.is_complete || data.setup.current_step >= 4)) {
             if (user) {
               setAuth({ ...user, company: data });
             }
             router.push('/dashboard');
             return;
          }

          setIdentity({
            tagline: data.tagline || '',
            industry: data.industry || '',
            description: data.description || '',
            primaryColor: data.brand_colors?.primary || '#0F172A',
            secondaryColor: data.brand_colors?.secondary || '#B8860B',
            primaryJurisdiction: data.accounting_profile?.primary_jurisdiction || 'ZA',
            operatingJurisdictions:
              data.accounting_profile?.operating_jurisdictions?.length
                ? data.accounting_profile.operating_jurisdictions
                : [data.accounting_profile?.primary_jurisdiction || 'ZA'],
            reportingFramework:
              data.accounting_profile?.reporting_framework ||
              (data.accounting_profile?.primary_jurisdiction === 'ZW' ? 'ZW_IFRS_FULL' : 'IFRS_FULL'),
            functionalCurrency:
              data.accounting_profile?.functional_currency ||
              (data.accounting_profile?.primary_jurisdiction === 'ZW' ? 'USD' : 'ZAR'),
            presentationCurrency:
              data.accounting_profile?.presentation_currency ||
              data.accounting_profile?.functional_currency ||
              (data.accounting_profile?.primary_jurisdiction === 'ZW' ? 'USD' : 'ZAR'),
            functionalCurrencyJustification: data.accounting_profile?.functional_currency_justification || '',
            zwIas29Applicable: Boolean(data.accounting_profile?.zw_ias29_applicable),
            zwPriorIas29Application: Boolean(data.accounting_profile?.zw_prior_ias29_application),
            crossBorderOperations: Boolean(data.accounting_profile?.cross_border_operations),
            consolidatesSubsidiaries: Boolean(data.accounting_profile?.consolidates_subsidiaries),
            vatRegistered: Boolean(data.accounting_profile?.vat_registered),
            pfmaEntity: Boolean(data.accounting_profile?.pfma_entity),
            sdlExempt: Boolean(data.accounting_profile?.sdl_exempt),
            annualPayrollEstimate:
              data.accounting_profile?.annual_payroll_estimate !== null &&
              data.accounting_profile?.annual_payroll_estimate !== undefined
                ? String(data.accounting_profile.annual_payroll_estimate)
                : '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch identity:', err);
        router.push('/login');
      }
    };
    fetchIdentity();
  }, [user, setAuth, router]);

  useEffect(() => {
    setIdentity((current) => {
      const allowedFrameworks = frameworkOptions[current.primaryJurisdiction] || frameworkOptions.ZA;
      const allowedCurrencies = currencyOptions[current.primaryJurisdiction] || currencyOptions.ZA;

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
        new Set([current.primaryJurisdiction, ...(current.crossBorderOperations ? current.operatingJurisdictions : [current.primaryJurisdiction])]),
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
  }, [identity.primaryJurisdiction, identity.crossBorderOperations]);

  useEffect(() => {
    let cancelled = false;

    const loadRecommendation = async () => {
      if (identity.primaryJurisdiction === 'ZW' && !identity.functionalCurrencyJustification.trim()) {
        setTemplateRecommendation(null);
        return;
      }

      setRecommendationLoading(true);

      try {
        const response = await apiFetch('/company/accounting-template-recommendation/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accounting_profile: {
              primary_jurisdiction: identity.primaryJurisdiction,
              operating_jurisdictions: Array.from(new Set(identity.operatingJurisdictions)),
              reporting_framework: identity.reportingFramework,
              functional_currency: identity.functionalCurrency,
              presentation_currency: identity.presentationCurrency,
              functional_currency_justification:
                identity.primaryJurisdiction === 'ZW' ? identity.functionalCurrencyJustification : undefined,
              zw_ias29_applicable: identity.primaryJurisdiction === 'ZW' ? identity.zwIas29Applicable : false,
              zw_prior_ias29_application:
                identity.primaryJurisdiction === 'ZW' ? identity.zwPriorIas29Application : false,
              cross_border_operations: identity.crossBorderOperations,
              consolidates_subsidiaries: identity.consolidatesSubsidiaries,
              vat_registered: identity.vatRegistered,
              pfma_entity: identity.primaryJurisdiction === 'ZA' ? identity.pfmaEntity : false,
              sdl_exempt: identity.primaryJurisdiction === 'ZA' ? identity.sdlExempt : false,
              annual_payroll_estimate:
                identity.annualPayrollEstimate.trim().length > 0
                  ? Number(identity.annualPayrollEstimate)
                  : undefined,
            },
          }),
        });

        if (!response.ok) {
          if (!cancelled) {
            setTemplateRecommendation(null);
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setTemplateRecommendation(data.recommendation || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to preview accounting template recommendation:', error);
          setTemplateRecommendation(null);
        }
      } finally {
        if (!cancelled) {
          setRecommendationLoading(false);
        }
      }
    };

    const timeout = window.setTimeout(() => {
      void loadRecommendation();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    identity.primaryJurisdiction,
    identity.operatingJurisdictions,
    identity.reportingFramework,
    identity.functionalCurrency,
    identity.presentationCurrency,
    identity.functionalCurrencyJustification,
    identity.zwIas29Applicable,
    identity.zwPriorIas29Application,
    identity.crossBorderOperations,
    identity.consolidatesSubsidiaries,
    identity.vatRegistered,
    identity.pfmaEntity,
    identity.sdlExempt,
    identity.annualPayrollEstimate,
  ]);

  const toggleOperatingJurisdiction = (jurisdiction: string) => {
    setIdentity((current) => {
      if (jurisdiction === current.primaryJurisdiction) {
        return current;
      }

      const next = current.operatingJurisdictions.includes(jurisdiction)
        ? current.operatingJurisdictions.filter((value) => value !== jurisdiction)
        : [...current.operatingJurisdictions, jurisdiction];

      return {
        ...current,
        operatingJurisdictions: Array.from(new Set([current.primaryJurisdiction, ...next])),
      };
    });
  };

  const handleNext = async () => {
    try {
      await apiFetch('/company', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagline: identity.tagline,
          industry: identity.industry,
          description: identity.description,
          brand_colors: {
            primary: identity.primaryColor,
            secondary: identity.secondaryColor
          },
          accounting_profile: {
            primary_jurisdiction: identity.primaryJurisdiction,
            operating_jurisdictions: Array.from(new Set(identity.operatingJurisdictions)),
            reporting_framework: identity.reportingFramework,
            functional_currency: identity.functionalCurrency,
            presentation_currency: identity.presentationCurrency,
            functional_currency_justification:
              identity.primaryJurisdiction === 'ZW' ? identity.functionalCurrencyJustification : undefined,
            zw_ias29_applicable: identity.primaryJurisdiction === 'ZW' ? identity.zwIas29Applicable : false,
            zw_prior_ias29_application:
              identity.primaryJurisdiction === 'ZW' ? identity.zwPriorIas29Application : false,
            cross_border_operations: identity.crossBorderOperations,
            consolidates_subsidiaries: identity.consolidatesSubsidiaries,
            vat_registered: identity.vatRegistered,
            pfma_entity: identity.primaryJurisdiction === 'ZA' ? identity.pfmaEntity : false,
            sdl_exempt: identity.primaryJurisdiction === 'ZA' ? identity.sdlExempt : false,
            annual_payroll_estimate:
              identity.annualPayrollEstimate.trim().length > 0
                ? Number(identity.annualPayrollEstimate)
                : undefined,
          },
        })
      });
      router.push('/setup/departments');
    } catch (err) {
      console.error('Failed to save identity:', err);
      // Still proceed for UX, but log error
      router.push('/setup/departments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <WizardHeader currentStep={1} />
      
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
        {/* Form Area */}
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h2 className="text-3xl font-heading mb-2">Establish Identity</h2>
            <p className="text-slate-500">Define the visual and strategic soul of your organization.</p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Company Tagline</label>
              <input 
                type="text" 
                placeholder="e.g. Scaling Innovation Globally" 
                className="input-premium"
                value={identity.tagline}
                onChange={(e) => setIdentity({ ...identity, tagline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Industry</label>
              <input
                type="text"
                placeholder="e.g. Agriculture, Financial Services, Logistics"
                className="input-premium"
                value={identity.industry}
                onChange={(e) => setIdentity({ ...identity, industry: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Primary Brand Color</label>
                <div className="flex gap-4 items-center">
                  <input type="color" className="w-12 h-12 rounded cursor-pointer" value={identity.primaryColor} onChange={(e) => setIdentity({ ...identity, primaryColor: e.target.value })} />
                  <span className="text-slate-500 font-mono uppercase">{identity.primaryColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Secondary Accent</label>
                <div className="flex gap-4 items-center">
                  <input type="color" className="w-12 h-12 rounded cursor-pointer" value={identity.secondaryColor} onChange={(e) => setIdentity({ ...identity, secondaryColor: e.target.value })} />
                  <span className="text-slate-500 font-mono uppercase">{identity.secondaryColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Company Description / Mission</label>
              <textarea 
                rows={4} 
                className="input-premium resize-none" 
                placeholder="Briefly describe what your company does..."
                value={identity.description}
                onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
              ></textarea>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Accounting and Jurisdiction Foundation</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Capture the rules that should shape the company&apos;s chart, tax defaults, and reporting posture before we activate the accounting template.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Primary Jurisdiction</label>
                  <select
                    className="input-premium"
                    value={identity.primaryJurisdiction}
                    onChange={(e) => setIdentity({ ...identity, primaryJurisdiction: e.target.value })}
                  >
                    <option value="ZA">South Africa</option>
                    <option value="ZW">Zimbabwe</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Reporting Framework</label>
                  <select
                    className="input-premium"
                    value={identity.reportingFramework}
                    onChange={(e) => setIdentity({ ...identity, reportingFramework: e.target.value })}
                  >
                    {currentFrameworkOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Functional Currency</label>
                  <select
                    className="input-premium"
                    value={identity.functionalCurrency}
                    onChange={(e) => setIdentity({ ...identity, functionalCurrency: e.target.value })}
                  >
                    {currentCurrencyOptions.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Presentation Currency</label>
                  <select
                    className="input-premium"
                    value={identity.presentationCurrency}
                    onChange={(e) => setIdentity({ ...identity, presentationCurrency: e.target.value })}
                  >
                    {currentCurrencyOptions.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={identity.crossBorderOperations}
                    onChange={(e) => setIdentity({ ...identity, crossBorderOperations: e.target.checked })}
                  />
                  Cross-border operations
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={identity.consolidatesSubsidiaries}
                    onChange={(e) => setIdentity({ ...identity, consolidatesSubsidiaries: e.target.checked })}
                  />
                  Consolidates subsidiaries
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={identity.vatRegistered}
                    onChange={(e) => setIdentity({ ...identity, vatRegistered: e.target.checked })}
                  />
                  VAT registered
                </label>
                {identity.primaryJurisdiction === 'ZA' ? (
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={identity.pfmaEntity}
                      onChange={(e) => setIdentity({ ...identity, pfmaEntity: e.target.checked })}
                    />
                    PFMA / public entity
                  </label>
                ) : (
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={identity.zwIas29Applicable}
                      onChange={(e) => setIdentity({ ...identity, zwIas29Applicable: e.target.checked })}
                    />
                    IAS 29 review applicable
                  </label>
                )}
              </div>

              {identity.crossBorderOperations ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Operating Jurisdictions</label>
                  <div className="flex flex-wrap gap-3">
                    {['ZA', 'ZW'].map((jurisdiction) => (
                      <label
                        key={jurisdiction}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={identity.operatingJurisdictions.includes(jurisdiction)}
                          disabled={jurisdiction === identity.primaryJurisdiction}
                          onChange={() => toggleOperatingJurisdiction(jurisdiction)}
                        />
                        {jurisdiction === 'ZA' ? 'South Africa' : 'Zimbabwe'}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {identity.primaryJurisdiction === 'ZA' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Annual Payroll Estimate (ZAR)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="input-premium"
                      placeholder="500000"
                      value={identity.annualPayrollEstimate}
                      onChange={(e) => setIdentity({ ...identity, annualPayrollEstimate: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 mt-7">
                    <input
                      type="checkbox"
                      checked={identity.sdlExempt}
                      onChange={(e) => setIdentity({ ...identity, sdlExempt: e.target.checked })}
                    />
                    SDL exempt
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Functional Currency Justification</label>
                    <textarea
                      rows={3}
                      className="input-premium resize-none"
                      placeholder="Summarize why this is the primary economic environment for the Zimbabwean entity."
                      value={identity.functionalCurrencyJustification}
                      onChange={(e) => setIdentity({ ...identity, functionalCurrencyJustification: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={identity.zwPriorIas29Application}
                      onChange={(e) => setIdentity({ ...identity, zwPriorIas29Application: e.target.checked })}
                    />
                    Prior IAS 29 application exists
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/10 via-white to-white p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-gold">Accounting Template Recommendation</p>
                  <h3 className="mt-2 text-xl font-heading text-brand-navy">
                    {templateRecommendation?.template_name || 'Waiting for profile inputs'}
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  {recommendationLoading ? 'Refreshing' : templateRecommendation?.template_code || 'Preview'}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                {templateRecommendation?.rationale ||
                  (identity.primaryJurisdiction === 'ZW'
                    ? 'Complete the Zimbabwe currency justification and profile choices to unlock the template recommendation.'
                    : 'Choose the accounting profile inputs and we will recommend the best starting chart.' )}
              </p>

              {templateRecommendation ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Recommended Modules</p>
                      <div className="mt-3 space-y-3">
                        {templateRecommendation.modules.map((module) => (
                          <div key={module.code} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{module.name}</p>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${module.required ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {module.required ? 'Required' : 'Recommended'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{module.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Regulatory Packs</p>
                        <div className="mt-3 space-y-3">
                          {templateRecommendation.regulatory_packs.length ? (
                            templateRecommendation.regulatory_packs.map((pack) => (
                              <div key={pack.code} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-sm font-semibold text-slate-900">{pack.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{pack.reason}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No extra regulatory packs are required for this profile yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Wizard Warnings</p>
                        <div className="mt-3 space-y-2">
                          {templateRecommendation.warnings.length ? (
                            templateRecommendation.warnings.map((warning) => (
                              <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                                {warning}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No jurisdiction-driven warnings are currently triggered by this profile.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600">Save Draft</button>
              <button onClick={handleNext} className="btn-premium">Confirm & Continue</button>
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        <aside className="w-full md:w-80 space-y-6 sticky top-10 self-start">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Dashboard Preview</h3>
            </div>
            <div className="p-6">
              <div 
                className="w-full h-32 rounded-xl mb-4 flex items-center justify-center text-white text-center p-4 transition-all duration-500"
                style={{ backgroundColor: identity.primaryColor }}
              >
                <div>
                  <div className="text-sm font-bold mb-1 opacity-80">COMPANY NAME</div>
                  <div className="text-xs font-medium italic opacity-60">&quot;{identity.tagline || 'Your Tagline here'}&quot;</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: identity.secondaryColor }}></div>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounting Foundation</p>
                <p className="text-sm font-semibold text-slate-900">
                  {identity.primaryJurisdiction === 'ZA' ? 'South Africa' : 'Zimbabwe'} · {currentFrameworkOptions.find((option) => option.value === identity.reportingFramework)?.label || identity.reportingFramework}
                </p>
                <p className="text-xs text-slate-500">
                  Functional {identity.functionalCurrency} · Presentation {identity.presentationCurrency}
                </p>
                <p className="text-xs text-slate-500">
                  {identity.crossBorderOperations ? 'Cross-border enabled' : 'Single-jurisdiction'} · {identity.consolidatesSubsidiaries ? 'Consolidation on' : 'No consolidation'}
                </p>
                {identity.primaryJurisdiction === 'ZW' ? (
                  <p className="text-xs text-slate-500">
                    {identity.zwIas29Applicable ? 'IAS 29 review active' : 'IAS 29 review not flagged'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {identity.pfmaEntity ? 'PFMA review needed' : 'Private-sector default'} · {identity.sdlExempt ? 'SDL exempt' : 'SDL active'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
