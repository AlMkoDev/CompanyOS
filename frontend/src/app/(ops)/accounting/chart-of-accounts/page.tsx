"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Layers3,
  Plus,
  Save,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

interface AccountOwner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category?: string | null;
  subtype?: string | null;
  parent_id?: string | null;
  description?: string | null;
  normal_balance?: string | null;
  sensitivity_tier?: string | null;
  fs_placement?: string | null;
  tax_treatment?: string | null;
  account_owner_id?: string | null;
  is_header?: boolean;
  is_contra?: boolean;
  budget_enabled?: boolean;
  is_active: boolean;
  level?: number | null;
  full_path?: string | null;
  owner?: AccountOwner | null;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface GovernanceUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AccountChangeRequest {
  id: string;
  request_type: string;
  status: string;
  title: string;
  rationale?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  account?: {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    is_active: boolean;
    sunset_candidate?: boolean;
  } | null;
  requester?: GovernanceUser | null;
  reviewer?: GovernanceUser | null;
}

interface AccountAuditEntry {
  id: string;
  action: string;
  reason?: string | null;
  change_summary?: string | null;
  created_at: string;
  actor?: GovernanceUser | null;
  account?: {
    id: string;
    code: string;
    name: string;
  } | null;
  change_request?: {
    id: string;
    request_type: string;
    status: string;
    title: string;
  } | null;
}

interface AccountFormState {
  code: string;
  name: string;
  type: AccountType;
  category: string;
  subtype: string;
  parent_id: string;
  description: string;
  normal_balance: string;
  sensitivity_tier: string;
  fs_placement: string;
  tax_treatment: string;
  account_owner_id: string;
  is_header: boolean;
  is_contra: boolean;
  budget_enabled: boolean;
  is_active: boolean;
}

const DEFAULT_FORM: AccountFormState = {
  code: "",
  name: "",
  type: "asset",
  category: "",
  subtype: "",
  parent_id: "",
  description: "",
  normal_balance: "DR",
  sensitivity_tier: "T3",
  fs_placement: "",
  tax_treatment: "",
  account_owner_id: "",
  is_header: false,
  is_contra: false,
  budget_enabled: false,
  is_active: true,
};

const ACCOUNT_TYPES: { value: AccountType; label: string; range: string }[] = [
  { value: "asset", label: "Assets", range: "1000-1999" },
  { value: "liability", label: "Liabilities", range: "2000-2999" },
  { value: "equity", label: "Equity", range: "3000-3999" },
  { value: "revenue", label: "Revenue", range: "4000-4999" },
  { value: "expense", label: "Expenses", range: "5000-8999" },
];

const NORMAL_BALANCE_OPTIONS = [
  { value: "DR", label: "Debit (DR)" },
  { value: "CR", label: "Credit (CR)" },
];

const SENSITIVITY_OPTIONS = [
  { value: "T1", label: "T1 - Highly restricted" },
  { value: "T2", label: "T2 - Controlled" },
  { value: "T3", label: "T3 - Standard" },
];

const FS_PLACEMENT_OPTIONS = [
  "Current Assets",
  "Non-current Assets",
  "Current Liabilities",
  "Non-current Liabilities",
  "Equity",
  "Revenue",
  "Cost of Sales",
  "Operating Expenses",
  "Other Income",
  "Other Expense",
  "Tax",
];

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function formatOwner(owner?: AccountOwner | null) {
  if (!owner) return "Unassigned";
  return `${owner.first_name} ${owner.last_name}`;
}

function getDefaultNormalBalance(type: AccountType) {
  return ["asset", "expense"].includes(type) ? "DR" : "CR";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPerson(person?: GovernanceUser | null) {
  if (!person) return "System";
  return `${person.first_name} ${person.last_name}`;
}

function buildPayload(form: AccountFormState) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    type: form.type,
    category: emptyToUndefined(form.category),
    subtype: emptyToUndefined(form.subtype),
    parent_id: emptyToUndefined(form.parent_id),
    description: emptyToUndefined(form.description),
    normal_balance: emptyToUndefined(form.normal_balance),
    sensitivity_tier: emptyToUndefined(form.sensitivity_tier),
    fs_placement: emptyToUndefined(form.fs_placement),
    tax_treatment: emptyToUndefined(form.tax_treatment),
    account_owner_id: emptyToUndefined(form.account_owner_id),
    is_header: form.is_header,
    is_contra: form.is_contra,
    budget_enabled: form.budget_enabled,
    is_active: form.is_active,
  };
}

function mapAccountToForm(account: GLAccount): AccountFormState {
  return {
    code: account.code,
    name: account.name,
    type: account.type,
    category: account.category ?? "",
    subtype: account.subtype ?? "",
    parent_id: account.parent_id ?? "",
    description: account.description ?? "",
    normal_balance: account.normal_balance ?? getDefaultNormalBalance(account.type),
    sensitivity_tier: account.sensitivity_tier ?? "T3",
    fs_placement: account.fs_placement ?? "",
    tax_treatment: account.tax_treatment ?? "",
    account_owner_id: account.account_owner_id ?? "",
    is_header: Boolean(account.is_header),
    is_contra: Boolean(account.is_contra),
    budget_enabled: Boolean(account.budget_enabled),
    is_active: Boolean(account.is_active),
  };
}

function StatusPill({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "emerald" | "amber" | "slate" | "rose" | "navy";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "rose"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : tone === "navy"
            ? "bg-slate-100 text-brand-navy border-slate-200"
            : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${toneClass}`}>
      {label}
    </span>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export default function ChartOfAccountsPage() {
  const { isAuthenticated } = useAuthStore();
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [ownerLoading, setOwnerLoading] = React.useState(true);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [auditLoading, setAuditLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | AccountType>("all");
  const [form, setForm] = React.useState<AccountFormState>(DEFAULT_FORM);
  const [editing, setEditing] = React.useState<GLAccount | null>(null);
  const [changeRequests, setChangeRequests] = React.useState<AccountChangeRequest[]>([]);
  const [auditEntries, setAuditEntries] = React.useState<AccountAuditEntry[]>([]);

  const loadAccounts = React.useCallback(async () => {
    const res = await apiFetch("/accounting/accounts");
    if (!res.ok) {
      throw new Error((await res.text()) || "Failed to load chart of accounts.");
    }

    const data = (await res.json()) as GLAccount[];
    setAccounts(Array.isArray(data) ? data : []);
  }, []);

  const loadOwners = React.useCallback(async () => {
    try {
      const res = await apiFetch("/hris/employees");
      if (!res.ok) {
        setEmployees([]);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.employees) ? data.employees : [];
      setEmployees(list);
    } catch {
      setEmployees([]);
    } finally {
      setOwnerLoading(false);
    }
  }, []);

  const loadGovernance = React.useCallback(
    async (accountId?: string) => {
      setRequestsLoading(true);
      setAuditLoading(true);
      try {
        const [requestsRes, auditRes] = await Promise.all([
          apiFetch("/accounting/account-change-requests"),
          apiFetch(accountId ? `/accounting/accounts/audit?accountId=${accountId}` : "/accounting/accounts/audit"),
        ]);

        if (requestsRes.ok) {
          const requestData = (await requestsRes.json()) as AccountChangeRequest[];
          setChangeRequests(Array.isArray(requestData) ? requestData : []);
        } else {
          setChangeRequests([]);
        }

        if (auditRes.ok) {
          const auditData = (await auditRes.json()) as AccountAuditEntry[];
          setAuditEntries(Array.isArray(auditData) ? auditData : []);
        } else {
          setAuditEntries([]);
        }
      } finally {
        setRequestsLoading(false);
        setAuditLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadAccounts(), loadOwners()]);
        await loadGovernance(editing?.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart of accounts.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isAuthenticated, loadAccounts, loadGovernance, loadOwners, editing?.id]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    loadGovernance(editing?.id);
  }, [editing?.id, isAuthenticated, loadGovernance]);

  const groupedAccounts = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = accounts.filter((account) => {
      if (typeFilter !== "all" && account.type !== typeFilter) return false;
      if (!query) return true;

      return [
        account.code,
        account.name,
        account.category,
        account.subtype,
        account.fs_placement,
        account.full_path,
        account.owner?.first_name,
        account.owner?.last_name,
        account.owner?.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return ACCOUNT_TYPES.map((type) => ({
      ...type,
      accounts: filtered.filter((account) => account.type === type.value),
    })).filter((group) => group.accounts.length > 0);
  }, [accounts, search, typeFilter]);

  const availableParents = React.useMemo(() => {
    const currentId = editing?.id;
    return accounts.filter(
      (account) =>
        account.is_header &&
        account.is_active &&
        account.id !== currentId &&
        account.type === form.type,
    );
  }, [accounts, editing?.id, form.type]);

  const resetForm = React.useCallback(() => {
    setForm(DEFAULT_FORM);
    setEditing(null);
  }, []);

  const handleFormChange = <K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => {
    setForm((current) => {
      if (key === "type") {
        const nextType = value as AccountType;
        return {
          ...current,
          type: nextType,
          parent_id: "",
          normal_balance: getDefaultNormalBalance(nextType),
        };
      }
      return { ...current, [key]: value };
    });
  };

  const startEdit = (account: GLAccount) => {
    setEditing(account);
    setForm(mapAccountToForm(account));
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiFetch(
        editing ? `/accounting/accounts/${editing.id}` : "/accounting/accounts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(form)),
        },
      );

      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to save account.");
      }

      await loadAccounts();
      setMessage(editing ? "Ledger account updated." : "Ledger account created.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link href="/accounting" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-navy">
            <ArrowLeft size={16} />
            Back to Accounting
          </Link>
          <h1 className="text-3xl font-heading text-brand-navy">Chart of Accounts</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Govern the general ledger with structured hierarchy, ownership, posting controls, and statement mapping.
          </p>
        </div>
        <div className="hidden rounded-[28px] border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800 xl:block">
          <div className="font-bold">COA foundation hardening</div>
          <div className="mt-1 text-amber-700">
            Header accounts block postings, codes follow major ranges, and every account can carry ownership and statement metadata.
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-3xl border px-5 py-4 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{editing ? "Update account" : "Create account"}</div>
                <h2 className="mt-2 text-2xl font-heading text-brand-navy">{editing ? editing.name : "New ledger account"}</h2>
              </div>
              <div className="flex items-center gap-2">
                {editing ? <StatusPill label={editing.is_active ? "Active" : "Inactive"} tone={editing.is_active ? "emerald" : "rose"} /> : null}
                {editing ? (
                  <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Account code" hint="Use the 4-digit standard with an optional suffix, for example 6110-OPS.">
                <input value={form.code} onChange={(event) => handleFormChange("code", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="1100" required />
              </Field>
              <Field label="Account type" hint={ACCOUNT_TYPES.find((type) => type.value === form.type)?.range}>
                <div className="relative">
                  <select value={form.type} onChange={(event) => handleFormChange("type", event.target.value as AccountType)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </Field>
            </div>

            <Field label="Account name">
              <input value={form.name} onChange={(event) => handleFormChange("name", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Main Bank Account" required />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Category">
                <input value={form.category} onChange={(event) => handleFormChange("category", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Current Assets" />
              </Field>
              <Field label="Subtype">
                <input value={form.subtype} onChange={(event) => handleFormChange("subtype", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Cash and Cash Equivalents" />
              </Field>
            </div>

            <Field label="Parent account" hint="Only active header accounts of the same major type can be used as parents.">
              <div className="relative">
                <select value={form.parent_id} onChange={(event) => handleFormChange("parent_id", event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                  <option value="">No parent (top-level header)</option>
                  {availableParents.map((account) => (
                    <option key={account.id} value={account.id}>{account.code} · {account.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={(event) => handleFormChange("description", event.target.value)} className="min-h-[96px] rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Purpose, posting boundaries, or reconciliation notes for this account." />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Normal balance">
                <div className="relative">
                  <select value={form.normal_balance} onChange={(event) => handleFormChange("normal_balance", event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                    {NORMAL_BALANCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </Field>
              <Field label="Sensitivity tier" hint="Use tighter tiers for treasury, tax, payroll, and other sensitive accounts.">
                <div className="relative">
                  <select value={form.sensitivity_tier} onChange={(event) => handleFormChange("sensitivity_tier", event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                    {SENSITIVITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Financial statement placement">
                <div className="relative">
                  <select value={form.fs_placement} onChange={(event) => handleFormChange("fs_placement", event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                    <option value="">Select placement</option>
                    {FS_PLACEMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </Field>
              <Field label="Tax treatment">
                <input value={form.tax_treatment} onChange={(event) => handleFormChange("tax_treatment", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Standard rated VAT" />
              </Field>
            </div>

            <Field label="Account owner" hint={ownerLoading ? "Loading HRIS directory…" : "Ownership helps with reconciliation discipline and governance."}>
              <div className="relative">
                <select value={form.account_owner_id} onChange={(event) => handleFormChange("account_owner_id", event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} · {employee.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ToggleRow label="Header account" description="Headers organize child accounts and should not accept journal postings." checked={form.is_header} onChange={(checked) => handleFormChange("is_header", checked)} />
              <ToggleRow label="Contra account" description="Use this for offsetting balances like accumulated depreciation or discounts." checked={form.is_contra} onChange={(checked) => handleFormChange("is_contra", checked)} />
              <ToggleRow label="Budget enabled" description="Mark accounts intended for budgeting, monitoring, and variance tracking." checked={form.budget_enabled} onChange={(checked) => handleFormChange("budget_enabled", checked)} />
              <ToggleRow label="Active" description="Inactive accounts remain visible historically but should not be used operationally." checked={form.is_active} onChange={(checked) => handleFormChange("is_active", checked)} />
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-brand-navy">
                <AlertCircle size={16} className="text-brand-gold" />
                Posting guardrails
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>Header accounts cannot receive journal postings.</li>
                <li>Top-level accounts must be headers.</li>
                <li>Parents and children must stay within the same major account type.</li>
                <li>Codes ending in <span className="font-semibold">00</span> are reserved for headers and <span className="font-semibold">90</span> for contra accounts.</li>
              </ul>
            </div>

            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {editing ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "Saving…" : editing ? "Save account" : "Create account"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Ledger structure</div>
                <h2 className="mt-2 text-2xl font-heading text-brand-navy">Controlled account hierarchy</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold" placeholder="Search code, name, owner, or path…" />
                <div className="relative">
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | AccountType)} className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold">
                    <option value="all">All major types</option>
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard icon={<BookOpen size={18} />} label="Accounts" value={String(accounts.length)} />
              <MetricCard icon={<Layers3 size={18} />} label="Header accounts" value={String(accounts.filter((account) => account.is_header).length)} />
              <MetricCard icon={<ShieldCheck size={18} />} label="Sensitive tiers" value={String(accounts.filter((account) => ["T1", "T2"].includes(account.sensitivity_tier ?? "")).length)} />
              <MetricCard icon={<UserRound size={18} />} label="Owned accounts" value={String(accounts.filter((account) => account.account_owner_id).length)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Governance queue</div>
                  <h3 className="mt-2 text-2xl font-heading text-brand-navy">Account change requests</h3>
                </div>
                <StatusPill label={`${changeRequests.filter((request) => request.status === "pending").length} pending`} tone="amber" />
              </div>
              <div className="mt-5 space-y-3">
                {requestsLoading ? (
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Loading governance queue…</div>
                ) : changeRequests.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">No account change requests have been raised yet.</div>
                ) : (
                  changeRequests.slice(0, 6).map((request) => (
                    <div key={request.id} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={request.request_type} tone="navy" />
                        <StatusPill
                          label={request.status}
                          tone={
                            request.status === "implemented"
                              ? "emerald"
                              : request.status === "rejected"
                                ? "rose"
                                : request.status === "approved"
                                  ? "amber"
                                  : "slate"
                          }
                        />
                      </div>
                      <div className="mt-3 text-lg font-semibold text-brand-navy">{request.title}</div>
                      <div className="mt-2 text-sm text-slate-500">
                        {(request.account ? `${request.account.code} · ${request.account.name}` : "New account request")} · Raised by {formatPerson(request.requester)}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Raised {formatDateTime(request.created_at)}
                        {request.reviewed_at ? ` · Reviewed ${formatDateTime(request.reviewed_at)}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Immutable history</div>
                  <h3 className="mt-2 text-2xl font-heading text-brand-navy">
                    {editing ? `${editing.code} audit trail` : "Recent COA audit"}
                  </h3>
                </div>
                <StatusPill label={editing ? "Selected account" : "All accounts"} tone="navy" />
              </div>
              <div className="mt-5 space-y-3">
                {auditLoading ? (
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Loading audit history…</div>
                ) : auditEntries.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">Select an account to inspect its lifecycle history, approvals, and governance changes.</div>
                ) : (
                  auditEntries.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={entry.action.replaceAll("_", " ")} tone="amber" />
                        {entry.change_request ? <StatusPill label={entry.change_request.status} tone="navy" /> : null}
                      </div>
                      <div className="mt-3 text-sm font-semibold text-brand-navy">{entry.change_summary || "Governance event recorded"}</div>
                      <div className="mt-2 text-sm text-slate-500">
                        {(entry.account ? `${entry.account.code} · ${entry.account.name}` : "Account event")} · {formatPerson(entry.actor)}
                      </div>
                      {entry.reason ? <div className="mt-2 text-sm text-slate-500">{entry.reason}</div> : null}
                      <div className="mt-2 text-xs text-slate-400">{formatDateTime(entry.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {loading ? (
            <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">Loading chart of accounts…</div>
          ) : groupedAccounts.length === 0 ? (
            <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">No ledger accounts match the current filter.</div>
          ) : (
            groupedAccounts.map((group) => (
              <section key={group.value} className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{group.range}</div>
                    <h3 className="mt-2 text-2xl font-heading text-brand-navy">{group.label}</h3>
                  </div>
                  <StatusPill label={`${group.accounts.length} accounts`} tone="navy" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {group.accounts.map((account) => (
                    <article key={account.id} className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-5 transition hover:border-slate-200 hover:bg-white">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-500">{account.code}</span>
                            <StatusPill label={account.is_header ? "Header" : "Posting"} tone={account.is_header ? "amber" : "emerald"} />
                            {!account.is_active ? <StatusPill label="Inactive" tone="rose" /> : null}
                            {account.is_contra ? <StatusPill label="Contra" tone="navy" /> : null}
                          </div>
                          <h4 className="mt-3 text-xl font-heading text-brand-navy">{account.name}</h4>
                          {account.description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{account.description}</p> : null}

                          <div className="mt-4 flex flex-wrap gap-3">
                            <MetaChip icon={<Tag size={14} />} label={account.category || "Uncategorized"} />
                            <MetaChip icon={<BriefcaseBusiness size={14} />} label={account.subtype || "No subtype"} />
                            <MetaChip icon={<ShieldCheck size={14} />} label={`${account.sensitivity_tier || "T3"} sensitivity`} />
                            <MetaChip icon={<BookOpen size={14} />} label={`${account.normal_balance || getDefaultNormalBalance(account.type)} normal`} />
                            <MetaChip icon={<UserRound size={14} />} label={formatOwner(account.owner)} />
                          </div>
                        </div>

                        <div className="min-w-[280px] rounded-[24px] border border-slate-100 bg-white px-4 py-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoPair label="FS placement" value={account.fs_placement || "Pending mapping"} />
                            <InfoPair label="Level" value={String(account.level || 1)} />
                            <InfoPair label="Tax treatment" value={account.tax_treatment || "Standard"} />
                            <InfoPair label="Budget" value={account.budget_enabled ? "Enabled" : "Off"} />
                          </div>
                          <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                            <div className="font-semibold text-slate-700">Hierarchy path</div>
                            <div className="mt-1 break-words">{account.full_path || account.code}</div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button type="button" onClick={() => startEdit(account)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                              Edit account
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500">{icon}</div>
      <div className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
      {icon}
      {label}
    </span>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex items-start justify-between gap-4 rounded-[24px] border px-4 py-4 text-left transition ${checked ? "border-brand-gold bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
      <div>
        <div className="font-semibold text-brand-navy">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      </div>
      <div className={`mt-1 h-6 w-11 rounded-full p-1 transition ${checked ? "bg-brand-gold" : "bg-slate-200"}`}>
        <div className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );
}
