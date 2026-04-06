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
import { getNormalizedRoles } from "@/lib/permissions";
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
  dormant_since?: string | null;
  sunset_candidate?: boolean;
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
  requested_by?: string | null;
  requested_payload?: Record<string, unknown> | null;
  current_snapshot?: Record<string, unknown> | null;
  account?: {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    is_active: boolean;
    sunset_candidate?: boolean;
    sensitivity_tier?: string | null;
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

interface RemediationState {
  id: string;
  issue_type: "restricted-owner" | "owner" | "invalid-mapping" | "unmapped" | "lifecycle" | string;
  status: "open" | "reviewed" | "cleared" | string;
  first_seen_at: string;
  last_seen_at: string;
  reviewed_at?: string | null;
  cleared_at?: string | null;
  review_notes?: string | null;
  cleared_reason?: string | null;
  reviewer?: GovernanceUser | null;
  clearer?: GovernanceUser | null;
  account?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface ActivationContext {
  templateCode: string | null;
  scope: string | null;
  createdCodes: string[];
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

interface ChangeRequestFormState {
  account_id: string;
  request_type: string;
  title: string;
  rationale: string;
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

const DEFAULT_CHANGE_REQUEST_FORM: ChangeRequestFormState = {
  account_id: "",
  request_type: "update",
  title: "",
  rationale: "",
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

const FS_ALLOWED_BY_TYPE: Record<AccountType, string[]> = {
  asset: ["Current Assets", "Non-current Assets"],
  liability: ["Current Liabilities", "Non-current Liabilities"],
  equity: ["Equity"],
  revenue: ["Revenue", "Other Income"],
  expense: ["Cost of Sales", "Operating Expenses", "Other Expense", "Tax"],
};

const CHANGE_REQUEST_TYPES = [
  { value: "update", label: "Metadata update" },
  { value: "reclassify", label: "Reclassify account" },
  { value: "deactivate", label: "Deactivate account" },
  { value: "reactivate", label: "Reactivate account" },
  { value: "sunset", label: "Mark sunset candidate" },
  { value: "restore", label: "Remove sunset flag" },
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

const T1_DIRECT_EDIT_ROLES = new Set(["super_admin", "system_admin", "system_administrator"]);
const T2_DIRECT_EDIT_ROLES = new Set([
  "super_admin",
  "system_admin",
  "system_administrator",
  "finance_manager",
  "controller",
  "chief_financial_officer",
  "cfo",
]);

function canDirectlyMaintainTier(tier: string | null | undefined, normalizedRoles: string[]) {
  if (!tier || tier === "T3") return true;
  if (tier === "T1") {
    return normalizedRoles.some((role) => T1_DIRECT_EDIT_ROLES.has(role));
  }
  if (tier === "T2") {
    return normalizedRoles.some((role) => T2_DIRECT_EDIT_ROLES.has(role));
  }
  return true;
}

function getTierRestrictionMessage(tier: string | null | undefined) {
  if (tier === "T1") {
    return "T1 accounts require system-administrator approval for direct edits. Use a change request if your role is not elevated.";
  }
  if (tier === "T2") {
    return "T2 accounts require finance leadership or system-administrator access for direct edits. Use a change request if needed.";
  }
  return null;
}

function isProtectedTier(tier: string | null | undefined) {
  return tier === "T1" || tier === "T2";
}

function getProtectedChangeFields(editing: GLAccount | null, form: AccountFormState) {
  if (!editing || !isProtectedTier(editing.sensitivity_tier)) {
    return [];
  }

  const changedFields: string[] = [];
  if (editing.code !== form.code) changedFields.push("code");
  if (editing.type !== form.type) changedFields.push("type");
  if ((editing.parent_id ?? "") !== form.parent_id) changedFields.push("parent");
  if ((editing.sensitivity_tier ?? "T3") !== form.sensitivity_tier) changedFields.push("sensitivity");
  if ((editing.account_owner_id ?? "") !== form.account_owner_id) changedFields.push("owner");
  if (Boolean(editing.is_header) !== form.is_header) changedFields.push("header");
  if (Boolean(editing.is_contra) !== form.is_contra) changedFields.push("contra");
  if (Boolean(editing.is_active) !== form.is_active) changedFields.push("active status");

  return changedFields;
}

function getMandatoryRequestMessage(editing: GLAccount | null, form: AccountFormState) {
  if (!editing && isProtectedTier(form.sensitivity_tier)) {
    return "Protected T1/T2 accounts must enter the chart through a governed create request rather than direct creation.";
  }

  const protectedFields = getProtectedChangeFields(editing, form);
  if (protectedFields.length > 0) {
    return `This protected ${editing?.sensitivity_tier ?? "T2"} account has structural changes (${protectedFields.join(", ")}). Raise a governed request instead of saving directly.`;
  }

  return null;
}

function hasValidFsPlacement(account: GLAccount) {
  if (!account.fs_placement) return false;
  return FS_ALLOWED_BY_TYPE[account.type]?.includes(account.fs_placement) ?? false;
}

function getRecommendedReconciliationCadence(account: GLAccount) {
  if (account.sensitivity_tier === "T1") return "Daily";
  if (account.fs_placement === "Current Assets" && /bank|cash|treasury/i.test(`${account.name} ${account.code}`)) {
    return "Daily";
  }
  if (account.fs_placement === "Current Assets" || account.fs_placement === "Current Liabilities") {
    return "Weekly";
  }
  if (account.type === "revenue" || account.type === "expense") {
    return "Monthly";
  }
  if (account.fs_placement === "Non-current Assets" || account.fs_placement === "Non-current Liabilities" || account.type === "equity") {
    return "Quarterly";
  }
  return "Monthly";
}

function prettifyActivationScope(scope?: string | null) {
  if (!scope) return "Full recommended";
  return scope
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDormancyAgeDays(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getPendingLifecycleRequest(accountId: string, changeRequests: AccountChangeRequest[]) {
  return changeRequests.find(
    (request) =>
      request.status === "pending" &&
      request.account?.id === accountId &&
      ["deactivate", "reactivate", "sunset", "restore"].includes(request.request_type),
  );
}

function getPendingRequestForAccount(accountId: string, changeRequests: AccountChangeRequest[]) {
  return changeRequests.find(
    (request) => request.status === "pending" && request.account?.id === accountId,
  );
}

function getRemediationState(
  accountId: string,
  issueType: "restricted-owner" | "invalid-mapping" | "unmapped" | "lifecycle",
  remediationStates: RemediationState[],
) {
  return remediationStates.find((state) => state.account?.id === accountId && state.issue_type === issueType);
}

function getIssueAgeMeta(
  account: GLAccount,
  category: "restricted-owner" | "invalid-mapping" | "unmapped" | "lifecycle",
  changeRequests: AccountChangeRequest[],
  remediationStates: RemediationState[],
) {
  const remediationState = getRemediationState(account.id, category, remediationStates);
  const firstSeenDate = remediationState?.first_seen_at ? new Date(remediationState.first_seen_at) : null;
  const pendingRequest = getPendingRequestForAccount(account.id, changeRequests);
  const pendingRequestDate = pendingRequest?.created_at ? new Date(pendingRequest.created_at) : null;
  const dormantDate = account.dormant_since ? new Date(account.dormant_since) : null;

  const dateSource =
    firstSeenDate && !Number.isNaN(firstSeenDate.getTime())
      ? firstSeenDate
      : pendingRequestDate && !Number.isNaN(pendingRequestDate.getTime())
      ? pendingRequestDate
      : dormantDate && !Number.isNaN(dormantDate.getTime())
        ? dormantDate
        : null;

  if (!dateSource) {
    return {
      label: "Current posture",
      tone: "slate" as const,
      detail:
        category === "lifecycle"
          ? "This lifecycle issue is visible in the current chart posture."
          : "This issue is visible in the current chart posture.",
      ageDays: null as number | null,
    };
  }

  const ageDays = Math.max(0, Math.floor((Date.now() - dateSource.getTime()) / (1000 * 60 * 60 * 24)));
  if (ageDays <= 7) {
    return {
      label: "New",
      tone: "emerald" as const,
      detail: `${ageDays} day${ageDays === 1 ? "" : "s"} in queue`,
      ageDays,
    };
  }
  if (ageDays <= 30) {
    return {
      label: "Aging",
      tone: "amber" as const,
      detail: `${ageDays} day${ageDays === 1 ? "" : "s"} unresolved`,
      ageDays,
    };
  }
  return {
    label: "Long-standing",
    tone: "rose" as const,
    detail: `${ageDays} day${ageDays === 1 ? "" : "s"} unresolved`,
    ageDays,
  };
}

function getLifecycleState(account: GLAccount, changeRequests: AccountChangeRequest[]) {
  const pendingRequest = getPendingLifecycleRequest(account.id, changeRequests);
  const dormantDays = getDormancyAgeDays(account.dormant_since);

  if (pendingRequest) {
    return {
      tone: "amber" as const,
      label: `${pendingRequest.request_type} pending`,
      recommendation: "Await governance review before changing lifecycle state.",
      dormantDays,
    };
  }

  if (!account.is_active && account.sunset_candidate) {
    return {
      tone: "rose" as const,
      label: "sunset candidate",
      recommendation: "Review for archive or restore decision.",
      dormantDays,
    };
  }

  if (!account.is_active) {
    return {
      tone: "amber" as const,
      label: "inactive",
      recommendation: "Assess whether this account should be reactivated or prepared for sunset.",
      dormantDays,
    };
  }

  if (account.sunset_candidate) {
    return {
      tone: "rose" as const,
      label: "sunset review",
      recommendation: "Confirm whether this active account should be retired from the chart.",
      dormantDays,
    };
  }

  if (dormantDays !== null && dormantDays >= 90) {
    return {
      tone: "rose" as const,
      label: `${dormantDays}d dormant`,
      recommendation: "Raise a sunset request or document why the account should stay active.",
      dormantDays,
    };
  }

  if (dormantDays !== null && dormantDays >= 30) {
    return {
      tone: "amber" as const,
      label: `${dormantDays}d dormant`,
      recommendation: "Review for deactivation if the account is no longer needed operationally.",
      dormantDays,
    };
  }

  return {
    tone: "emerald" as const,
    label: "active",
    recommendation: "No lifecycle intervention needed right now.",
    dormantDays,
  };
}

function getRequestSensitivityTier(request: AccountChangeRequest) {
  const requestedTier = request.requested_payload && typeof request.requested_payload === "object"
    ? request.requested_payload["sensitivity_tier"]
    : null;
  if (typeof requestedTier === "string" && requestedTier.trim()) {
    return requestedTier.trim().toUpperCase();
  }

  if (request.account?.sensitivity_tier) {
    return request.account.sensitivity_tier;
  }

  const snapshotTier = request.current_snapshot && typeof request.current_snapshot === "object"
    ? request.current_snapshot["sensitivity_tier"]
    : null;
  if (typeof snapshotTier === "string" && snapshotTier.trim()) {
    return snapshotTier.trim().toUpperCase();
  }

  return "T3";
}

function canReviewRequest(request: AccountChangeRequest, normalizedRoles: string[], currentUserId?: string | null) {
  if (request.requested_by && currentUserId && request.requested_by === currentUserId) {
    return false;
  }

  const tier = getRequestSensitivityTier(request);
  if (tier === "T1") {
    return normalizedRoles.some((role) => T1_DIRECT_EDIT_ROLES.has(role));
  }
  if (tier === "T2") {
    return normalizedRoles.some((role) => T2_DIRECT_EDIT_ROLES.has(role));
  }
  return true;
}

function getRequestReviewerLabel(request: AccountChangeRequest) {
  const tier = getRequestSensitivityTier(request);
  if (tier === "T1") return "System-admin review";
  if (tier === "T2") return "Finance leadership review";
  return "Standard review";
}

function getRequestRestrictionMessage(request: AccountChangeRequest, currentUserId?: string | null) {
  if (request.requested_by && currentUserId && request.requested_by === currentUserId) {
    return "Another reviewer must decide this request.";
  }

  const tier = getRequestSensitivityTier(request);
  if (tier === "T1") {
    return "Only system administrators can review T1 account requests.";
  }
  if (tier === "T2") {
    return "Only finance leadership or system administrators can review T2 account requests.";
  }
  return null;
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
  const { isAuthenticated, user } = useAuthStore();
  const normalizedRoles = React.useMemo(() => getNormalizedRoles(user), [user]);
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [ownerLoading, setOwnerLoading] = React.useState(true);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [auditLoading, setAuditLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [backlogFilter, setBacklogFilter] = React.useState<"all" | "restricted-owner" | "invalid-mapping" | "unmapped" | "lifecycle">("all");
  const [backlogStatusFilter, setBacklogStatusFilter] = React.useState<"all" | "open" | "reviewed" | "cleared">("all");
  const [backlogAgeFilter, setBacklogAgeFilter] = React.useState<"all" | "new" | "aging" | "long-standing">("all");
  const [backlogActionFeedback, setBacklogActionFeedback] = React.useState<string | null>(null);
  const [activationContext, setActivationContext] = React.useState<ActivationContext | null>(null);
  const [showActivationWorkingSetOnly, setShowActivationWorkingSetOnly] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | AccountType>("all");
  const [form, setForm] = React.useState<AccountFormState>(DEFAULT_FORM);
  const [changeRequestForm, setChangeRequestForm] = React.useState<ChangeRequestFormState>(DEFAULT_CHANGE_REQUEST_FORM);
  const [editing, setEditing] = React.useState<GLAccount | null>(null);
  const [changeRequests, setChangeRequests] = React.useState<AccountChangeRequest[]>([]);
  const [auditEntries, setAuditEntries] = React.useState<AccountAuditEntry[]>([]);
  const [remediationStates, setRemediationStates] = React.useState<RemediationState[]>([]);
  const [requestSubmitting, setRequestSubmitting] = React.useState(false);
  const [reviewingRequestId, setReviewingRequestId] = React.useState<string | null>(null);
  const [reviewingRemediationId, setReviewingRemediationId] = React.useState<string | null>(null);

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
        const [requestsRes, auditRes, remediationRes] = await Promise.all([
          apiFetch("/accounting/account-change-requests"),
          apiFetch(accountId ? `/accounting/accounts/audit?accountId=${accountId}` : "/accounting/accounts/audit"),
          apiFetch("/accounting/accounts/remediation"),
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

        if (remediationRes.ok) {
          const remediationData = (await remediationRes.json()) as RemediationState[];
          setRemediationStates(Array.isArray(remediationData) ? remediationData : []);
        } else {
          setRemediationStates([]);
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

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const age = params.get("age");
    const activation = params.get("activation");
    const template = params.get("template");
    const scope = params.get("scope");
    const created = params.get("created");

    if (status === "reviewed" || status === "open" || status === "cleared") {
      setBacklogStatusFilter(status);
    } else {
      setBacklogStatusFilter("all");
    }

    if (age === "new" || age === "aging" || age === "long-standing") {
      setBacklogAgeFilter(age);
    } else {
      setBacklogAgeFilter("all");
    }

    if (activation === "1") {
      const createdCodes = created
        ? created
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
      setActivationContext({
        templateCode: template,
        scope,
        createdCodes,
      });
      setShowActivationWorkingSetOnly(createdCodes.length > 0);
    } else {
      setActivationContext(null);
      setShowActivationWorkingSetOnly(false);
    }
  }, []);

  const groupedAccounts = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = accounts.filter((account) => {
      if (
        showActivationWorkingSetOnly &&
        activationContext?.createdCodes.length &&
        !activationContext.createdCodes.includes(account.code)
      ) {
        return false;
      }
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
  }, [accounts, search, typeFilter, showActivationWorkingSetOnly, activationContext]);

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

  const currentSensitivityTier = editing?.sensitivity_tier ?? form.sensitivity_tier ?? "T3";
  const canDirectlyMaintainCurrentTier = canDirectlyMaintainTier(currentSensitivityTier, normalizedRoles);
  const currentTierRestrictionMessage = getTierRestrictionMessage(currentSensitivityTier);
  const mandatoryRequestMessage = React.useMemo(
    () => getMandatoryRequestMessage(editing, form),
    [editing, form],
  );
  const mustUseRequestWorkflow = Boolean(mandatoryRequestMessage);
  const elevatedPendingRequests = React.useMemo(
    () =>
      changeRequests.filter(
        (request) =>
          request.status === "pending" && ["T1", "T2"].includes(getRequestSensitivityTier(request)),
      ).length,
    [changeRequests],
  );
  const lifecycleQueue = React.useMemo(() => {
    return accounts
      .map((account) => ({
        account,
        lifecycle: getLifecycleState(account, changeRequests),
        pendingRequest: getPendingLifecycleRequest(account.id, changeRequests),
      }))
      .filter(({ account, lifecycle, pendingRequest }) => {
        return Boolean(
          pendingRequest ||
            account.dormant_since ||
            account.sunset_candidate ||
            account.is_active === false ||
            lifecycle.dormantDays !== null,
        );
      })
      .sort((left, right) => {
        const toneRank = { rose: 0, amber: 1, emerald: 2 } as const;
        const toneDelta = toneRank[left.lifecycle.tone] - toneRank[right.lifecycle.tone];
        if (toneDelta !== 0) return toneDelta;
        return (right.lifecycle.dormantDays ?? 0) - (left.lifecycle.dormantDays ?? 0);
      })
      .slice(0, 6);
  }, [accounts, changeRequests]);
  const activationWorkingSetAccounts = React.useMemo(() => {
    if (!activationContext?.createdCodes.length) return [];
    const createdSet = new Set(activationContext.createdCodes);
    return accounts.filter((account) => createdSet.has(account.code));
  }, [accounts, activationContext]);
  const activationReviewChecklist = React.useMemo(() => {
    const workingSet = activationWorkingSetAccounts;
    const postingAccounts = workingSet.filter((account) => !account.is_header);
    const missingOwners = postingAccounts.filter((account) => !account.account_owner_id);
    const missingFsPlacement = postingAccounts.filter((account) => !account.fs_placement);
    const invalidFsPlacement = postingAccounts.filter(
      (account) => account.fs_placement && !hasValidFsPlacement(account),
    );
    const hierarchyAttention = workingSet.filter(
      (account) => !account.is_header && !account.parent_id,
    );
    const restrictedAccounts = workingSet.filter((account) =>
      ["T1", "T2"].includes(account.sensitivity_tier ?? ""),
    );

    return [
      {
        id: "owners",
        label: "Assign owners",
        count: missingOwners.length,
        tone: missingOwners.length > 0 ? "amber" : "emerald",
        detail:
          missingOwners.length > 0
            ? `${missingOwners.length} new posting account${missingOwners.length === 1 ? "" : "s"} still need ownership.`
            : "All newly created posting accounts have owners assigned.",
      },
      {
        id: "mapping",
        label: "Validate FS placement",
        count: missingFsPlacement.length + invalidFsPlacement.length,
        tone: missingFsPlacement.length + invalidFsPlacement.length > 0 ? "rose" : "emerald",
        detail:
          missingFsPlacement.length + invalidFsPlacement.length > 0
            ? `${missingFsPlacement.length} missing and ${invalidFsPlacement.length} invalid statement placement issue${missingFsPlacement.length + invalidFsPlacement.length === 1 ? "" : "s"} need review.`
            : "Statement placement looks clean for the newly created set.",
      },
      {
        id: "hierarchy",
        label: "Confirm headers and parents",
        count: hierarchyAttention.length,
        tone: hierarchyAttention.length > 0 ? "amber" : "emerald",
        detail:
          hierarchyAttention.length > 0
            ? `${hierarchyAttention.length} posting account${hierarchyAttention.length === 1 ? "" : "s"} should be checked for parent/header alignment.`
            : "Parent-child structure looks consistent for the newly created set.",
      },
      {
        id: "restricted",
        label: "Review restricted accounts",
        count: restrictedAccounts.length,
        tone: restrictedAccounts.length > 0 ? "rose" : "emerald",
        detail:
          restrictedAccounts.length > 0
            ? `${restrictedAccounts.length} newly created account${restrictedAccounts.length === 1 ? "" : "s"} carry T1/T2 sensitivity and should be reviewed first.`
            : "No newly created accounts were seeded into restricted T1/T2 tiers.",
      },
    ] as const;
  }, [activationWorkingSetAccounts]);
  const reportingReadiness = React.useMemo(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const mapped = postingAccounts.filter((account) => hasValidFsPlacement(account));
    const unmapped = postingAccounts.filter((account) => !account.fs_placement);
    const invalid = postingAccounts.filter((account) => account.fs_placement && !hasValidFsPlacement(account));

    return {
      postingCount: postingAccounts.length,
      mappedCount: mapped.length,
      unmappedCount: unmapped.length,
      invalidCount: invalid.length,
      coveragePercent: postingAccounts.length ? Math.round((mapped.length / postingAccounts.length) * 100) : 0,
      invalidAccounts: invalid.slice(0, 5),
      unmappedAccounts: unmapped.slice(0, 5),
    };
  }, [accounts]);
  const ownerAccountability = React.useMemo(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const unassigned = postingAccounts.filter((account) => !account.account_owner_id);
    const restrictedWithoutOwner = postingAccounts.filter(
      (account) => ["T1", "T2"].includes(account.sensitivity_tier ?? "") && !account.account_owner_id,
    );

    const cadenceBuckets = postingAccounts.reduce<Record<string, number>>((acc, account) => {
      const cadence = getRecommendedReconciliationCadence(account);
      acc[cadence] = (acc[cadence] || 0) + 1;
      return acc;
    }, {});

    return {
      postingCount: postingAccounts.length,
      ownerCoveragePercent: postingAccounts.length
        ? Math.round(((postingAccounts.length - unassigned.length) / postingAccounts.length) * 100)
        : 0,
      unassignedCount: unassigned.length,
      restrictedWithoutOwnerCount: restrictedWithoutOwner.length,
      unassignedAccounts: unassigned.slice(0, 5),
      cadenceBuckets,
      };
    }, [accounts]);

  const recommendedRemediation = React.useMemo(() => {
    const firstRestrictedNoOwner = ownerAccountability.unassignedAccounts.find((account) =>
      ["T1", "T2"].includes(account.sensitivity_tier ?? ""),
    );
    if (firstRestrictedNoOwner) {
      return {
        title: `Assign owner to ${firstRestrictedNoOwner.code} · ${firstRestrictedNoOwner.name}`,
        detail: "Restricted accounts without named owners are the most material accountability gap in the chart.",
        tone: "bg-rose-50 text-rose-700 border-rose-100",
        primaryAction: {
          label: "Open account for ownership review",
          mode: "edit" as const,
          account: firstRestrictedNoOwner,
        },
        secondaryActions: [
          "Review all T1 and T2 accounts for ownership coverage",
          "Confirm cadence accountability after owner assignment",
        ],
      };
    }

    if (reportingReadiness.invalidAccounts.length > 0) {
      const account = reportingReadiness.invalidAccounts[0];
      return {
        title: `Correct statement mapping on ${account.code} · ${account.name}`,
        detail: `${account.fs_placement} is not valid for ${account.type} accounts and weakens COA-driven reporting.`,
        tone: "bg-rose-50 text-rose-700 border-rose-100",
        primaryAction: {
          label: "Open account for mapping correction",
          mode: "edit" as const,
          account,
        },
        secondaryActions: [
          "Review the invalid placement list below",
          "Refresh report readiness after the mapping fix",
        ],
      };
    }

    if (reportingReadiness.unmappedAccounts.length > 0) {
      const account = reportingReadiness.unmappedAccounts[0];
      return {
        title: `Map ${account.code} · ${account.name} to a statement family`,
        detail: "Posting accounts without an FS placement remain visible blockers for reporting readiness.",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
        primaryAction: {
          label: "Open account for FS mapping",
          mode: "edit" as const,
          account,
        },
        secondaryActions: [
          "Work through remaining unmapped posting accounts",
          "Recheck the reporting posture section afterward",
        ],
      };
    }

    const firstLifecyclePriority = lifecycleQueue[0];
    if (firstLifecyclePriority) {
      const { account } = firstLifecyclePriority;
      const requestType = account.is_active
        ? account.sunset_candidate
          ? "restore"
          : "sunset"
        : "reactivate";
      const title = account.is_active
        ? account.sunset_candidate
          ? `Restore ${account.code} · ${account.name}`
          : `Mark sunset ${account.code} · ${account.name}`
        : `Reactivate ${account.code} · ${account.name}`;

      return {
        title: `${account.code} · ${account.name} needs lifecycle review`,
        detail: firstLifecyclePriority.lifecycle.recommendation,
        tone:
          firstLifecyclePriority.lifecycle.tone === "rose"
            ? "bg-rose-50 text-rose-700 border-rose-100"
            : firstLifecyclePriority.lifecycle.tone === "amber"
              ? "bg-amber-50 text-amber-700 border-amber-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100",
        primaryAction: {
          label: account.is_active
            ? account.sunset_candidate
              ? "Draft restore request"
              : "Draft sunset request"
            : "Draft reactivation request",
          mode: "request" as const,
          account,
          requestType,
          requestTitle: title,
        },
        secondaryActions: [
          "Review the dormant and sunset queue beneath this panel",
          "Confirm whether a governance request is already pending",
        ],
      };
    }

    return {
      title: "COA posture is healthy",
      detail: "The chart currently has no high-priority ownership, mapping, or lifecycle remediation actions waiting.",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      primaryAction: {
        label: "Review governance queue",
        mode: "link" as const,
        href: "#governance-queue",
      },
      secondaryActions: [
        "Spot-check recent account change requests",
        "Review close and reporting posture from Accounting",
      ],
    };
  }, [lifecycleQueue, ownerAccountability, reportingReadiness]);

  const remediationBacklog = React.useMemo(() => {
    const restrictedOwnerItems = ownerAccountability.unassignedAccounts
      .filter((account) => ["T1", "T2"].includes(account.sensitivity_tier ?? ""))
      .slice(0, 4)
      .map((account) => ({
        id: `restricted-owner-${account.id}`,
        title: `${account.code} · ${account.name}`,
        detail: `${account.sensitivity_tier || "T3"} account has no assigned owner.`,
        ageMeta: getIssueAgeMeta(account, "restricted-owner", changeRequests, remediationStates),
        state: getRemediationState(account.id, "restricted-owner", remediationStates),
        actionLabel: "Open for ownership review",
        onAction: () => startEdit(account),
      }));

    const invalidMappingItems = reportingReadiness.invalidAccounts.slice(0, 4).map((account) => ({
      id: `invalid-mapping-${account.id}`,
      title: `${account.code} · ${account.name}`,
      detail: `${account.fs_placement} is not valid for ${account.type} accounts.`,
      ageMeta: getIssueAgeMeta(account, "invalid-mapping", changeRequests, remediationStates),
      state: getRemediationState(account.id, "invalid-mapping", remediationStates),
      actionLabel: "Correct mapping",
      onAction: () => startEdit(account),
    }));

    const unmappedItems = reportingReadiness.unmappedAccounts.slice(0, 4).map((account) => ({
      id: `unmapped-${account.id}`,
      title: `${account.code} · ${account.name}`,
      detail: "Posting account is still missing a statement placement.",
      ageMeta: getIssueAgeMeta(account, "unmapped", changeRequests, remediationStates),
      state: getRemediationState(account.id, "unmapped", remediationStates),
      actionLabel: "Add FS placement",
      onAction: () => startEdit(account),
    }));

    const lifecycleItems = lifecycleQueue.slice(0, 4).map(({ account }) => {
      const requestType = account.is_active
        ? account.sunset_candidate
          ? "restore"
          : "sunset"
        : "reactivate";
      const requestTitle = account.is_active
        ? account.sunset_candidate
          ? `Restore ${account.code} · ${account.name}`
          : `Mark sunset ${account.code} · ${account.name}`
        : `Reactivate ${account.code} · ${account.name}`;

      return {
        id: `lifecycle-${account.id}`,
        title: `${account.code} · ${account.name}`,
        detail: getLifecycleState(account, changeRequests).recommendation,
        ageMeta: getIssueAgeMeta(account, "lifecycle", changeRequests, remediationStates),
        state: getRemediationState(account.id, "lifecycle", remediationStates),
        actionLabel: account.is_active
          ? account.sunset_candidate
            ? "Draft restore"
            : "Draft sunset"
          : "Draft reactivate",
        onAction: () => startChangeRequest(account, requestType, requestTitle),
      };
    });

    return [
      {
        key: "restricted-owner",
        label: "Restricted ownership",
        tone: "rose" as const,
        count: ownerAccountability.restrictedWithoutOwnerCount,
        emptyState: "No restricted-owner gaps are waiting right now.",
        items: restrictedOwnerItems,
      },
      {
        key: "invalid-mapping",
        label: "Invalid mapping",
        tone: "rose" as const,
        count: reportingReadiness.invalidCount,
        emptyState: "No invalid statement placements are currently blocking the chart.",
        items: invalidMappingItems,
      },
      {
        key: "unmapped",
        label: "Unmapped posting",
        tone: "amber" as const,
        count: reportingReadiness.unmappedCount,
        emptyState: "All posting accounts currently have a statement family.",
        items: unmappedItems,
      },
      {
        key: "lifecycle",
        label: "Lifecycle review",
        tone: "amber" as const,
        count: lifecycleQueue.length,
        emptyState: "No dormant or sunset review actions are waiting right now.",
        items: lifecycleItems,
      },
    ];
  }, [changeRequests, lifecycleQueue, ownerAccountability, remediationStates, reportingReadiness]);

  const visibleBacklogGroups = React.useMemo(() => {
    const categoryFiltered =
      backlogFilter === "all"
        ? remediationBacklog
        : remediationBacklog.filter((group) => group.key === backlogFilter);

    return categoryFiltered
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const statusMatches =
            backlogStatusFilter === "all"
              ? true
              : backlogStatusFilter === "open"
                ? item.state?.status !== "reviewed"
                : backlogStatusFilter === "reviewed"
                  ? item.state?.status === "reviewed"
                  : false;

          const ageMatches =
            backlogAgeFilter === "all"
              ? true
              : backlogAgeFilter === "new"
                ? item.ageMeta.label === "New"
                : backlogAgeFilter === "aging"
                  ? item.ageMeta.label === "Aging"
                  : item.ageMeta.label === "Long-standing";

          return statusMatches && ageMatches;
        }),
      }))
      .filter((group) => group.items.length > 0 || group.count > 0);
  }, [backlogAgeFilter, backlogFilter, backlogStatusFilter, remediationBacklog]);

  const backlogSummary = React.useMemo(() => {
    const totalOpen = remediationBacklog.reduce((sum, group) => sum + group.count, 0);
    const criticalOpen = remediationBacklog
      .filter((group) => group.tone === "rose")
      .reduce((sum, group) => sum + group.count, 0);
    const activeGroups = remediationBacklog.filter((group) => group.count > 0).length;
    const surfacedItems = remediationBacklog.flatMap((group) => group.items);
    const agingCount = surfacedItems.filter((item) => item.ageMeta?.tone === "amber").length;
    const longStandingCount = surfacedItems.filter((item) => item.ageMeta?.tone === "rose").length;
    const acknowledgedCount = surfacedItems.filter((item) => item.state?.status === "reviewed").length;
    const clearedRecentlyCount = remediationStates.filter((state) => {
      if (state.status !== "cleared" || !state.cleared_at) return false;
      const clearedAt = new Date(state.cleared_at);
      if (Number.isNaN(clearedAt.getTime())) return false;
      return Date.now() - clearedAt.getTime() <= 1000 * 60 * 60 * 24 * 14;
    }).length;

    return {
      totalOpen,
      criticalOpen,
      activeGroups,
      agingCount,
      longStandingCount,
      acknowledgedCount,
      clearedRecentlyCount,
    };
  }, [remediationBacklog, remediationStates]);

  const recentlyClearedRemediation = React.useMemo(() => {
    return remediationStates
      .filter((state) => state.status === "cleared" && state.cleared_at)
      .sort((left, right) => new Date(right.cleared_at || 0).getTime() - new Date(left.cleared_at || 0).getTime())
      .slice(0, 4);
  }, [remediationStates]);

  const remediationTrend = React.useMemo(() => {
    const now = Date.now();
    const fourteenDays = 1000 * 60 * 60 * 24 * 14;

    const introduced = remediationStates.filter((state) => {
      const firstSeen = new Date(state.first_seen_at);
      return !Number.isNaN(firstSeen.getTime()) && now - firstSeen.getTime() <= fourteenDays;
    }).length;

    const reviewed = remediationStates.filter((state) => {
      if (state.status !== "reviewed" || !state.reviewed_at) return false;
      const reviewedAt = new Date(state.reviewed_at);
      return !Number.isNaN(reviewedAt.getTime()) && now - reviewedAt.getTime() <= fourteenDays;
    }).length;

    const cleared = remediationStates.filter((state) => {
      if (state.status !== "cleared" || !state.cleared_at) return false;
      const clearedAt = new Date(state.cleared_at);
      return !Number.isNaN(clearedAt.getTime()) && now - clearedAt.getTime() <= fourteenDays;
    }).length;

    const oldestOpen = remediationStates
      .filter((state) => state.status === "open" || state.status === "reviewed")
      .map((state) => {
        const firstSeen = new Date(state.first_seen_at);
        return Number.isNaN(firstSeen.getTime()) ? 0 : Math.floor((now - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      })
      .sort((a, b) => b - a)[0] ?? 0;

    return { introduced, reviewed, cleared, oldestOpen };
  }, [remediationStates]);

  const resetForm = React.useCallback(() => {
    setForm(DEFAULT_FORM);
    setEditing(null);
  }, []);

  const resetChangeRequestForm = React.useCallback(() => {
    setChangeRequestForm(DEFAULT_CHANGE_REQUEST_FORM);
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
    setChangeRequestForm((current) => ({
      ...current,
      account_id: account.id,
      title: current.title || `Update ${account.code} · ${account.name}`,
    }));
    setMessage(null);
    setError(null);
    setBacklogActionFeedback(`Opened ${account.code} · ${account.name} for direct remediation.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startChangeRequest = React.useCallback((account: GLAccount, requestType: string, title: string) => {
    setChangeRequestForm({
      account_id: account.id,
      request_type: requestType,
      title,
      rationale: "",
    });
    setMessage(null);
    setError(null);
    setBacklogActionFeedback(`Drafted a ${requestType} request for ${account.code} · ${account.name}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReviewRemediation = React.useCallback(
    async (stateId: string, decision: "reviewed" | "reopen") => {
      setReviewingRemediationId(stateId);
      setMessage(null);
      setError(null);
      try {
        const res = await apiFetch(`/accounting/accounts/remediation/${stateId}/review`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        });

        if (!res.ok) {
          throw new Error((await res.text()) || "Failed to update remediation state.");
        }

        await loadGovernance(editing?.id);
        setMessage(
          decision === "reviewed"
            ? "Remediation item marked as reviewed."
            : "Remediation item reopened for active follow-up.",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update remediation state.");
      } finally {
        setReviewingRemediationId(null);
      }
    },
    [editing?.id, loadGovernance],
  );

  const routeCurrentFormToChangeRequest = React.useCallback(() => {
    const requestType = !editing
      ? "create"
      : getProtectedChangeFields(editing, form).some((field) => ["code", "type", "parent"].includes(field))
        ? "reclassify"
        : "update";
    const title = !editing
      ? `Create ${form.code || "new"} · ${form.name || "ledger account"}`
      : `${requestType === "reclassify" ? "Reclassify" : "Update"} ${editing.code} · ${editing.name}`;

    setChangeRequestForm({
      account_id: editing?.id ?? "",
      request_type: requestType,
      title,
      rationale: mandatoryRequestMessage ?? "",
    });
    setMessage("Governed request drafted from the account form.");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editing, form, mandatoryRequestMessage]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (mustUseRequestWorkflow) {
        throw new Error(mandatoryRequestMessage || "This change must go through a governed request.");
      }

      if (!canDirectlyMaintainCurrentTier) {
        throw new Error(currentTierRestrictionMessage || "Your role cannot directly maintain this account tier.");
      }

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

  const handleCreateChangeRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiFetch("/accounting/account-change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: emptyToUndefined(changeRequestForm.account_id),
          request_type: changeRequestForm.request_type,
          title: changeRequestForm.title.trim(),
          rationale: emptyToUndefined(changeRequestForm.rationale),
          proposed_changes:
            ((!editing && changeRequestForm.request_type === "create") ||
              (editing && changeRequestForm.account_id === editing.id))
              ? buildPayload(form)
              : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to create account change request.");
      }

      await loadGovernance(editing?.id);
      setMessage("Account change request submitted.");
      resetChangeRequestForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account change request.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleReviewRequest = async (requestId: string, decision: "approved" | "rejected") => {
    setReviewingRequestId(requestId);
    setMessage(null);
    setError(null);

    try {
      const res = await apiFetch(`/accounting/account-change-requests/${requestId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          review_notes:
            decision === "approved"
              ? "Approved from the COA governance workspace."
              : "Rejected from the COA governance workspace.",
        }),
      });

      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to review account change request.");
      }

      await Promise.all([loadAccounts(), loadGovernance(editing?.id)]);
      setMessage(decision === "approved" ? "Account change request approved." : "Account change request rejected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review account change request.");
    } finally {
      setReviewingRequestId(null);
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

            {!canDirectlyMaintainCurrentTier && currentTierRestrictionMessage ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <div className="font-semibold text-brand-navy">Restricted sensitivity tier</div>
                <div className="mt-2">{currentTierRestrictionMessage}</div>
              </div>
            ) : null}

            {mustUseRequestWorkflow ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <div className="font-semibold text-rose-800">Governed workflow required</div>
                <div className="mt-2">{mandatoryRequestMessage}</div>
                <button
                  type="button"
                  onClick={routeCurrentFormToChangeRequest}
                  className="mt-4 rounded-2xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Draft governed request
                </button>
              </div>
            ) : null}

            <button type="submit" disabled={saving || !canDirectlyMaintainCurrentTier || mustUseRequestWorkflow} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {editing ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "Saving…" : editing ? "Save account" : "Create account"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
            {activationContext ? (
              <div className="mb-6 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Activation handoff</div>
                    <div className="mt-2 font-semibold text-brand-navy">
                      Recently activated chart accounts are ready for review.
                    </div>
                    <div className="mt-2 text-sm text-emerald-800/90">
                      Template: {activationContext.templateCode || "Unknown"}
                      {activationContext.scope ? ` · Scope: ${prettifyActivationScope(activationContext.scope)}` : ""}
                      {activationContext.createdCodes.length ? ` · ${activationContext.createdCodes.length} created account${activationContext.createdCodes.length === 1 ? "" : "s"}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowActivationWorkingSetOnly((current) => !current)}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        showActivationWorkingSetOnly
                          ? "border-emerald-300 bg-white text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {showActivationWorkingSetOnly ? "Show full chart" : "Show newly created only"}
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {activationReviewChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border px-4 py-4 ${
                        item.tone === "rose"
                          ? "border-rose-200 bg-rose-50 text-rose-800"
                          : item.tone === "amber"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-emerald-200 bg-white text-emerald-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-brand-navy">{item.label}</div>
                        <StatusPill
                          label={item.count === 0 ? "Clear" : `${item.count} review`}
                          tone={item.tone === "rose" ? "rose" : item.tone === "amber" ? "amber" : "emerald"}
                        />
                      </div>
                      <div className="mt-2 text-sm">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Governed change path</div>
                <h3 className="mt-2 text-2xl font-heading text-brand-navy">Raise account change request</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Route reclassifications, deactivations, reactivations, and sunset decisions through a visible review path.
                </p>
              </div>

              <form onSubmit={handleCreateChangeRequest} className="mt-5 grid grid-cols-1 gap-4">
                <Field label="Account">
                  <div className="relative">
                    <select
                      value={changeRequestForm.account_id}
                      onChange={(event) => setChangeRequestForm((current) => ({ ...current, account_id: event.target.value }))}
                      className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold"
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} · {account.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Request type">
                    <div className="relative">
                      <select
                        value={changeRequestForm.request_type}
                        onChange={(event) => setChangeRequestForm((current) => ({ ...current, request_type: event.target.value }))}
                        className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold"
                      >
                        {CHANGE_REQUEST_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </Field>
                  <Field label="Title">
                    <input
                      value={changeRequestForm.title}
                      onChange={(event) => setChangeRequestForm((current) => ({ ...current, title: event.target.value }))}
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold"
                      placeholder="Deactivate dormant utilities account"
                      required
                    />
                  </Field>
                </div>

                <Field label="Rationale">
                  <textarea
                    value={changeRequestForm.rationale}
                    onChange={(event) => setChangeRequestForm((current) => ({ ...current, rationale: event.target.value }))}
                    className="min-h-[110px] rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-gold"
                    placeholder="Why this account should change, what controls are impacted, and what reviewers should verify."
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {requestSubmitting ? "Submitting…" : "Submit change request"}
                  </button>
                  <button
                    type="button"
                    onClick={resetChangeRequestForm}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Control posture</div>
                <h3 className="mt-2 text-2xl font-heading text-brand-navy">Sensitivity and lifecycle cues</h3>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard icon={<ShieldCheck size={18} />} label="T1 restricted" value={String(accounts.filter((account) => account.sensitivity_tier === "T1").length)} />
                <MetricCard icon={<AlertCircle size={18} />} label="Dormant" value={String(accounts.filter((account) => account.dormant_since).length)} />
                <MetricCard icon={<BookOpen size={18} />} label="Sunset candidates" value={String(accounts.filter((account) => account.sunset_candidate).length)} />
                <MetricCard icon={<UserRound size={18} />} label="Pending review" value={String(changeRequests.filter((request) => request.status === "pending").length)} />
                <MetricCard icon={<ShieldCheck size={18} />} label="Elevated review" value={String(elevatedPendingRequests)} />
                <MetricCard icon={<AlertCircle size={18} />} label="Lifecycle queue" value={String(lifecycleQueue.length)} />
              </div>
              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <div className="font-semibold text-brand-navy">Segregation of duties</div>
                <ul className="mt-3 space-y-2">
                  <li>Requesters cannot approve their own account changes.</li>
                  <li>Lifecycle actions should flow through requests for dormant, reactivation, and sunset decisions.</li>
                  <li>T1 requests require system-administrator review, while T2 requests route to finance leadership or system administrators.</li>
                </ul>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Recommended next action</div>
                  <h3 className="mt-2 text-2xl font-heading text-brand-navy">{recommendedRemediation.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm text-slate-500">{recommendedRemediation.detail}</p>
                </div>
                {recommendedRemediation.primaryAction.mode === "link" ? (
                  <Link
                    href={recommendedRemediation.primaryAction.href}
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-navy/90"
                  >
                    {recommendedRemediation.primaryAction.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (recommendedRemediation.primaryAction.mode === "edit" && recommendedRemediation.primaryAction.account) {
                        startEdit(recommendedRemediation.primaryAction.account);
                      }
                      if (
                        recommendedRemediation.primaryAction.mode === "request" &&
                        recommendedRemediation.primaryAction.account &&
                        recommendedRemediation.primaryAction.requestType &&
                        recommendedRemediation.primaryAction.requestTitle
                      ) {
                        startChangeRequest(
                          recommendedRemediation.primaryAction.account,
                          recommendedRemediation.primaryAction.requestType,
                          recommendedRemediation.primaryAction.requestTitle,
                        );
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-navy/90"
                  >
                    {recommendedRemediation.primaryAction.label}
                  </button>
                )}
              </div>

              <div className={`mt-5 rounded-[24px] border px-4 py-4 ${recommendedRemediation.tone}`}>
                <div className="text-[10px] font-black uppercase tracking-[0.18em]">Then</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendedRemediation.secondaryActions.map((action) => (
                    <span
                      key={action}
                      className="rounded-full border border-current/15 px-3 py-1 text-xs font-semibold"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Remediation backlog</div>
                  <h3 className="mt-2 text-2xl font-heading text-brand-navy">Systematic COA cleanup queue</h3>
                </div>
                <StatusPill
                  label={`${remediationBacklog.reduce((sum, group) => sum + group.count, 0)} open items`}
                  tone={remediationBacklog.some((group) => group.tone === "rose" && group.count > 0) ? "rose" : "amber"}
                />
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Work through ownership, mapping, and lifecycle issues by category instead of only following one recommendation at a time.
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <MetricCard icon={<AlertCircle size={18} />} label="Open backlog" value={String(backlogSummary.totalOpen)} />
                <MetricCard icon={<ShieldCheck size={18} />} label="Critical issues" value={String(backlogSummary.criticalOpen)} />
                <MetricCard icon={<Layers3 size={18} />} label="Acknowledged" value={String(backlogSummary.acknowledgedCount)} />
                <MetricCard icon={<BookOpen size={18} />} label="Long-standing" value={String(backlogSummary.longStandingCount)} />
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-brand-navy">Backlog trend</div>
                    <div className="mt-1 text-xs text-slate-500">14-day movement across newly surfaced, acknowledged, and cleared COA issues.</div>
                  </div>
                  <StatusPill label={`${remediationTrend.oldestOpen}d oldest open`} tone={remediationTrend.oldestOpen >= 30 ? "rose" : remediationTrend.oldestOpen >= 14 ? "amber" : "emerald"} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <MetricCard icon={<Plus size={18} />} label="Newly introduced" value={String(remediationTrend.introduced)} />
                  <MetricCard icon={<ShieldCheck size={18} />} label="Reviewed" value={String(remediationTrend.reviewed)} />
                  <MetricCard icon={<BookOpen size={18} />} label="Cleared" value={String(remediationTrend.cleared)} />
                  <MetricCard icon={<Layers3 size={18} />} label="Oldest open" value={`${remediationTrend.oldestOpen}d`} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "restricted-owner", label: "Ownership" },
                  { value: "invalid-mapping", label: "Invalid mapping" },
                  { value: "unmapped", label: "Unmapped" },
                  { value: "lifecycle", label: "Lifecycle" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBacklogFilter(option.value as typeof backlogFilter)}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                      backlogFilter === option.value
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All status" },
                  { value: "open", label: "Open" },
                  { value: "reviewed", label: "Acknowledged" },
                  { value: "cleared", label: "Cleared recently" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBacklogStatusFilter(option.value as typeof backlogStatusFilter)}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                      backlogStatusFilter === option.value
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All age" },
                  { value: "new", label: "New" },
                  { value: "aging", label: "Aging" },
                  { value: "long-standing", label: "Long-standing" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBacklogAgeFilter(option.value as typeof backlogAgeFilter)}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                      backlogAgeFilter === option.value
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {backlogActionFeedback ? (
                <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                  <div className="font-semibold">Action launched</div>
                  <div className="mt-1">{backlogActionFeedback}</div>
                </div>
              ) : null}

              {backlogStatusFilter !== "cleared" ? (
              <div className="mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-2">
                {visibleBacklogGroups.map((group) => (
                  <div key={group.key} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-brand-navy">{group.label}</div>
                      <StatusPill
                        label={`${group.items.length} visible`}
                        tone={group.tone}
                      />
                    </div>
                    <div className="mt-3 space-y-3">
                      {group.items.length === 0 ? (
                        <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-500">{group.emptyState}</div>
                      ) : (
                        group.items.map((item) => (
                          <div key={item.id} className="rounded-2xl bg-white px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-medium text-brand-navy">{item.title}</div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {item.state?.status === "reviewed" ? <StatusPill label="Acknowledged" tone="navy" /> : null}
                                <StatusPill label={item.ageMeta.label} tone={item.ageMeta.tone} />
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
                            <div className="mt-2 text-xs text-slate-400">{item.ageMeta.detail}</div>
                            {item.state?.status === "reviewed" && (item.state.review_notes || item.state.reviewed_at || item.state.reviewer) ? (
                              <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Review memory</div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {item.state.review_notes || "This remediation issue has been acknowledged and is being tracked."}
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                  {item.state.reviewer ? `Reviewed by ${formatPerson(item.state.reviewer)}` : "Reviewed"}
                                  {item.state.reviewed_at ? ` · ${formatDateTime(item.state.reviewed_at)}` : ""}
                                </div>
                              </div>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={item.onAction}
                                className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-navy transition hover:bg-slate-50"
                              >
                                {item.actionLabel}
                              </button>
                              {item.state?.status !== "reviewed" ? (
                                <button
                                  type="button"
                                  disabled={reviewingRemediationId === item.state?.id}
                                  onClick={() => item.state?.id && handleReviewRemediation(item.state.id, "reviewed")}
                                  className="inline-flex items-center rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {reviewingRemediationId === item.state?.id ? "Working…" : "Mark reviewed"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={reviewingRemediationId === item.state?.id}
                                  onClick={() => item.state?.id && handleReviewRemediation(item.state.id, "reopen")}
                                  className="inline-flex items-center rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {reviewingRemediationId === item.state?.id ? "Working…" : "Reopen"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
              ) : null}

              {backlogStatusFilter === "cleared" || backlogStatusFilter === "all" ? (
              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-navy">Recently cleared</div>
                  <StatusPill label={`${backlogSummary.clearedRecentlyCount} in 14d`} tone="emerald" />
                </div>
                <div className="mt-3 space-y-3">
                  {recentlyClearedRemediation.length === 0 ? (
                    <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-500">
                      No remediation items have cleared recently.
                    </div>
                  ) : (
                    recentlyClearedRemediation.map((state) => (
                      <div key={state.id} className="rounded-2xl bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-brand-navy">
                              {state.account ? `${state.account.code} · ${state.account.name}` : "Unknown account"}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              {state.issue_type.replace(/-/g, " ")} cleared
                            </div>
                          </div>
                          <StatusPill label="Cleared" tone="emerald" />
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {state.cleared_reason || "Issue no longer appears in the live COA posture."}
                          {state.cleared_at ? ` · ${formatDateTime(state.cleared_at)}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              ) : null}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
            <section id="governance-queue" className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
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
                          label={getRequestReviewerLabel(request)}
                          tone={getRequestSensitivityTier(request) === "T1" ? "rose" : getRequestSensitivityTier(request) === "T2" ? "amber" : "slate"}
                        />
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
                      {request.status === "pending" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={reviewingRequestId === request.id || !canReviewRequest(request, normalizedRoles, user?.id)}
                            onClick={() => handleReviewRequest(request.id, "approved")}
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {reviewingRequestId === request.id ? "Working…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={reviewingRequestId === request.id || !canReviewRequest(request, normalizedRoles, user?.id)}
                            onClick={() => handleReviewRequest(request.id, "rejected")}
                            className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {!canReviewRequest(request, normalizedRoles, user?.id) && getRequestRestrictionMessage(request, user?.id) ? (
                            <span className="self-center text-xs text-slate-400">{getRequestRestrictionMessage(request, user?.id)}</span>
                          ) : null}
                        </div>
                      ) : null}
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

          <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Lifecycle queue</div>
                <h3 className="mt-2 text-2xl font-heading text-brand-navy">Dormant and sunset reviews</h3>
              </div>
              <StatusPill label={`${lifecycleQueue.length} queued`} tone="amber" />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Surface dormant, inactive, and sunset-candidate accounts that need a governance decision instead of leaving lifecycle state buried in the chart.
            </div>
            <div className="mt-5 space-y-3">
              {lifecycleQueue.length === 0 ? (
                <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No dormant or sunset review actions are waiting right now.
                </div>
              ) : (
                lifecycleQueue.map(({ account, lifecycle, pendingRequest }) => (
                  <div key={account.id} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label={lifecycle.label} tone={lifecycle.tone} />
                          <StatusPill label={`${account.code} · ${account.name}`} tone="navy" />
                          {pendingRequest ? <StatusPill label="Request waiting" tone="amber" /> : null}
                        </div>
                        <div className="mt-3 text-sm text-slate-600">{lifecycle.recommendation}</div>
                        <div className="mt-2 text-xs text-slate-400">
                          {account.dormant_since
                            ? `Dormant since ${formatDateTime(account.dormant_since).split(",")[0]}`
                            : account.is_active
                              ? "Active in chart"
                              : "Currently inactive"}
                          {account.sunset_candidate ? " · Marked for sunset review" : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!pendingRequest && account.is_active ? (
                          <button
                            type="button"
                            onClick={() => startChangeRequest(account, "deactivate", `Deactivate ${account.code} · ${account.name}`)}
                            className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Draft deactivate
                          </button>
                        ) : null}
                        {!pendingRequest ? (
                          <button
                            type="button"
                            onClick={() =>
                              startChangeRequest(
                                account,
                                account.sunset_candidate ? "restore" : "sunset",
                                `${account.sunset_candidate ? "Restore" : "Mark sunset"} ${account.code} · ${account.name}`,
                              )
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {account.sunset_candidate ? "Draft restore" : "Draft sunset"}
                          </button>
                        ) : null}
                        {!pendingRequest && !account.is_active ? (
                          <button
                            type="button"
                            onClick={() => startChangeRequest(account, "reactivate", `Reactivate ${account.code} · ${account.name}`)}
                            className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Draft reactivate
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Statement readiness</div>
                <h3 className="mt-2 text-2xl font-heading text-brand-navy">Financial statement mapping posture</h3>
              </div>
              <StatusPill
                label={`${reportingReadiness.coveragePercent}% mapped`}
                tone={reportingReadiness.invalidCount > 0 ? "rose" : reportingReadiness.coveragePercent >= 90 ? "emerald" : "amber"}
              />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Measure how completely the chart can support balance sheet and income statement reporting from COA structure rather than ad hoc assumptions.
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={<BookOpen size={18} />} label="Posting accounts" value={String(reportingReadiness.postingCount)} />
              <MetricCard icon={<ShieldCheck size={18} />} label="Mapped" value={String(reportingReadiness.mappedCount)} />
              <MetricCard icon={<AlertCircle size={18} />} label="Unmapped" value={String(reportingReadiness.unmappedCount)} />
              <MetricCard icon={<AlertCircle size={18} />} label="Invalid mapping" value={String(reportingReadiness.invalidCount)} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-sm font-semibold text-brand-navy">Unmapped posting accounts</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {reportingReadiness.unmappedAccounts.length === 0 ? (
                    <div className="text-slate-500">All posting accounts currently have a statement placement.</div>
                  ) : (
                    reportingReadiness.unmappedAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                        <span className="font-medium text-brand-navy">{account.code} · {account.name}</span>
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{account.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-sm font-semibold text-brand-navy">Invalid statement placements</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {reportingReadiness.invalidAccounts.length === 0 ? (
                    <div className="text-slate-500">No account mappings currently conflict with their major account type.</div>
                  ) : (
                    reportingReadiness.invalidAccounts.map((account) => (
                      <div key={account.id} className="rounded-2xl bg-white px-3 py-3">
                        <div className="font-medium text-brand-navy">{account.code} · {account.name}</div>
                        <div className="mt-1 text-xs text-rose-600">
                          {account.fs_placement} is not valid for {account.type} accounts.
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Owner accountability</div>
                <h3 className="mt-2 text-2xl font-heading text-brand-navy">Reconciliation ownership posture</h3>
              </div>
              <StatusPill
                label={`${ownerAccountability.ownerCoveragePercent}% owned`}
                tone={ownerAccountability.restrictedWithoutOwnerCount > 0 ? "rose" : ownerAccountability.ownerCoveragePercent >= 90 ? "emerald" : "amber"}
              />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Track whether posting accounts have clear owners and how often they should be reconciled to support close discipline and operational accountability.
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={<UserRound size={18} />} label="Owned posting" value={String(ownerAccountability.postingCount - ownerAccountability.unassignedCount)} />
              <MetricCard icon={<AlertCircle size={18} />} label="Unassigned" value={String(ownerAccountability.unassignedCount)} />
              <MetricCard icon={<ShieldCheck size={18} />} label="Restricted no owner" value={String(ownerAccountability.restrictedWithoutOwnerCount)} />
              <MetricCard icon={<BookOpen size={18} />} label="Daily cadence" value={String(ownerAccountability.cadenceBuckets["Daily"] || 0)} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-sm font-semibold text-brand-navy">Accounts missing owners</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {ownerAccountability.unassignedAccounts.length === 0 ? (
                    <div className="text-slate-500">All posting accounts currently have an owner assigned.</div>
                  ) : (
                    ownerAccountability.unassignedAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                        <span className="font-medium text-brand-navy">{account.code} · {account.name}</span>
                        <span className="text-xs uppercase tracking-[0.16em] text-amber-600">{account.sensitivity_tier || "T3"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-sm font-semibold text-brand-navy">Recommended reconciliation cadence</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Daily</div>
                    <div className="mt-1 text-lg font-semibold text-brand-navy">{ownerAccountability.cadenceBuckets["Daily"] || 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Weekly</div>
                    <div className="mt-1 text-lg font-semibold text-brand-navy">{ownerAccountability.cadenceBuckets["Weekly"] || 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Monthly</div>
                    <div className="mt-1 text-lg font-semibold text-brand-navy">{ownerAccountability.cadenceBuckets["Monthly"] || 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quarterly</div>
                    <div className="mt-1 text-lg font-semibold text-brand-navy">{ownerAccountability.cadenceBuckets["Quarterly"] || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

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
                            {account.dormant_since ? <MetaChip icon={<AlertCircle size={14} />} label={`Dormant since ${formatDateTime(account.dormant_since).split(",")[0]}`} /> : null}
                            {account.sunset_candidate ? <MetaChip icon={<AlertCircle size={14} />} label="Sunset candidate" /> : null}
                            {getLifecycleState(account, changeRequests).dormantDays !== null ? (
                              <MetaChip icon={<AlertCircle size={14} />} label={`${getLifecycleState(account, changeRequests).dormantDays} days dormant`} />
                            ) : null}
                          </div>
                          {!canDirectlyMaintainTier(account.sensitivity_tier, normalizedRoles) && getTierRestrictionMessage(account.sensitivity_tier) ? (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                              {getTierRestrictionMessage(account.sensitivity_tier)}
                            </div>
                          ) : null}
                          {account.fs_placement && !hasValidFsPlacement(account) ? (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                              {account.fs_placement} is not valid for {account.type} accounts and should be corrected before relying on COA-driven reporting.
                            </div>
                          ) : null}
                          {!account.is_header && !account.fs_placement ? (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                              This posting account is still missing a financial statement placement.
                            </div>
                          ) : null}
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                            <div className="font-semibold text-brand-navy">Lifecycle posture</div>
                            <div className="mt-2">{getLifecycleState(account, changeRequests).recommendation}</div>
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
                          <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                            <div className="font-semibold text-slate-700">Reconciliation cadence</div>
                            <div className="mt-1 break-words">{getRecommendedReconciliationCadence(account)}</div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={!canDirectlyMaintainTier(account.sensitivity_tier, normalizedRoles)}
                                onClick={() => startEdit(account)}
                                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit account
                              </button>
                              {account.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => startChangeRequest(account, "deactivate", `Deactivate ${account.code} · ${account.name}`)}
                                  className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  Request deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startChangeRequest(account, "reactivate", `Reactivate ${account.code} · ${account.name}`)}
                                  className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                  Request reactivate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  startChangeRequest(
                                    account,
                                    account.sunset_candidate ? "restore" : "sunset",
                                    `${account.sunset_candidate ? "Restore" : "Mark sunset"} ${account.code} · ${account.name}`,
                                  )
                                }
                                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {account.sunset_candidate ? "Request restore" : "Request sunset"}
                              </button>
                            </div>
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
