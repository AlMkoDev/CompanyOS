'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Edit3, Mail, MapPin, Phone, Save, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AppPermissionGuard } from '@/components/common/AppPermissionGuard';
import { UnauthorizedEntry, RestrictedRecord } from '@/components/common/AccessState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createBlankEmployeeProfileData,
  createAvaEmployeeProfileData,
  fileToDataUrl,
  type EmployeeProfileData,
} from '@/lib/hris/profileData';

type EmployeeSummary = {
  id: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  employment_type: string | null;
  salary_grade: string | null;
  hire_date: string;
  status: string;
  avatar_url: string | null;
  department_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  profile_data: EmployeeProfileData | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  manager?: { id: string; first_name: string; last_name: string } | null;
};

type DepartmentOption = { id: string; name: string };
type PositionOption = { id: string; title: string; department_id: string | null };

type FormState = {
  emp_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  national_id: string;
  employment_type: string;
  salary_grade: string;
  hire_date: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  status: string;
  avatar_url: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function humanizeFieldLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bOr\b/g, 'or');
}

function formatProfileValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Not provided';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function cloneProfileData(data: EmployeeProfileData): EmployeeProfileData {
  return JSON.parse(JSON.stringify(data)) as EmployeeProfileData;
}

function getStringSectionValue(profileData: EmployeeProfileData, sectionKey: string, fieldKey: string) {
  const section = profileData[sectionKey];

  if (!isPlainObject(section)) {
    return '';
  }

  const value = section[fieldKey];
  return typeof value === 'string' ? value : '';
}

function setProfileField(
  profileData: EmployeeProfileData,
  sectionKey: string,
  fieldKey: string,
  value: string,
) {
  const next = cloneProfileData(profileData);
  const currentSection = isPlainObject(next[sectionKey]) ? (next[sectionKey] as Record<string, unknown>) : {};
  currentSection[fieldKey] = value;
  next[sectionKey] = currentSection;
  return next;
}

function setProfileFlag(profileData: EmployeeProfileData, sectionKey: string, fieldKey: string, value: boolean) {
  const next = cloneProfileData(profileData);
  const currentSection = isPlainObject(next[sectionKey]) ? (next[sectionKey] as Record<string, unknown>) : {};
  currentSection[fieldKey] = value;
  next[sectionKey] = currentSection;
  return next;
}

function normalizeEmployeeProfileDraft(profileData: EmployeeProfileData, employee: EmployeeSummary | null, avatarUrl: string | null) {
  let next = cloneProfileData(profileData);
  next = setProfileField(next, 'personal_information', 'south_african_id_number', employee?.national_id ?? getStringSectionValue(next, 'personal_information', 'south_african_id_number'));
  next = setProfileField(next, 'personal_information', 'employee_photo', avatarUrl ? 'Uploaded' : 'Not provided');
  next = setProfileFlag(next, 'additional_information', 'employee_photo_uploaded', Boolean(avatarUrl));
  return next;
}

function getProfileData(employee: EmployeeSummary | null) {
  if (employee?.profile_data && Object.keys(employee.profile_data).length > 0) {
    return employee.profile_data;
  }

  if (`${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`.trim().toLowerCase() === 'ava ndlovu') {
    return createAvaEmployeeProfileData();
  }

  return createBlankEmployeeProfileData();
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const employeeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { logout } = useAuthStore();

  const [employee, setEmployee] = useState<EmployeeSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<EmployeeProfileData>(createBlankEmployeeProfileData());
  const [form, setForm] = useState<FormState>({
    emp_no: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    employment_type: '',
    salary_grade: '',
    hire_date: '',
    department_id: '',
    position_id: '',
    manager_id: '',
    status: 'active',
    avatar_url: '',
  });

  const loadEmployee = async () => {
    if (!employeeId) {
      setError('Missing employee id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [employeeResponse, employeesResponse, departmentsResponse, positionsResponse] = await Promise.all([
        apiFetch(`/hris/employees/${employeeId}`),
        apiFetch('/hris/employees'),
        apiFetch('/departments'),
        apiFetch('/hris/positions'),
      ]);

      if (
        employeeResponse.status === 401 ||
        employeesResponse.status === 401 ||
        departmentsResponse.status === 401 ||
        positionsResponse.status === 401
      ) {
        logout();
        router.push('/login');
        return;
      }

      if (
        employeeResponse.status === 403 ||
        employeesResponse.status === 403 ||
        departmentsResponse.status === 403 ||
        positionsResponse.status === 403
      ) {
        setError('You do not have permission to access this employee profile.');
        return;
      }

      if (!employeeResponse.ok || !employeesResponse.ok || !departmentsResponse.ok || !positionsResponse.ok) {
        throw new Error('Failed to load employee profile.');
      }

      const [employeeData, employeesData, departmentsData, positionsData] = await Promise.all([
        employeeResponse.json(),
        employeesResponse.json(),
        departmentsResponse.json(),
        positionsResponse.json(),
      ]);

      setEmployee(employeeData);
      setEmployees(employeesData);
      setDepartments(departmentsData);
      setPositions(positionsData);
      setAvatarPreview(employeeData.avatar_url ?? null);
      setProfileDraft(cloneProfileData(getProfileData(employeeData)));
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const availablePositions = useMemo(() => {
    if (!form.department_id) {
      return positions;
    }

    const departmentPositions = positions.filter((position) => position.department_id === form.department_id);
    return departmentPositions.length > 0 ? departmentPositions : positions;
  }, [form.department_id, positions]);

  const reportsTo = (() => {
    const details = (employee ? getProfileData(employee).employment_details : null) as Record<string, unknown> | null;
    return (details?.reports_to as string) || 'Not provided';
  })();

  const managerName = employee?.manager
    ? `${employee.manager.first_name} ${employee.manager.last_name}`
    : reportsTo;
  const profileData = employee ? getProfileData(employee) : createBlankEmployeeProfileData();
  const getProfileSection = (sectionKey: string) =>
    (isPlainObject(profileData[sectionKey]) ? (profileData[sectionKey] as Record<string, unknown>) : {});
  const profileSections = Object.entries(profileData).filter(([, sectionValue]) => isPlainObject(sectionValue));

  const renderFieldRow = (label: string, value: unknown) => (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold leading-6 text-brand-navy">{formatProfileValue(value)}</div>
    </div>
  );

  const renderSectionValue = (sectionKey: string, value: unknown) => {
    if (!isPlainObject(value)) {
      return null;
    }

    const entries = Object.entries(value);
    const listItems = entries.filter(([, itemValue]) => Array.isArray(itemValue));
    const textItems = entries.filter(([, itemValue]) => !Array.isArray(itemValue) && itemValue !== '' && itemValue !== null && itemValue !== undefined);

    return (
      <Card key={sectionKey} className="rounded-[32px] border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-heading font-black text-brand-navy">{humanizeFieldLabel(sectionKey)}</h3>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{entries.length} fields</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {textItems.map(([fieldKey, fieldValue]) => renderFieldRow(humanizeFieldLabel(fieldKey), fieldValue))}
        </div>

        {listItems.length > 0 && (
          <div className="mt-5 space-y-5">
            {listItems.map(([fieldKey, fieldValue]) => (
              <div key={fieldKey} className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{humanizeFieldLabel(fieldKey)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Array.isArray(fieldValue) ? fieldValue : []).map((item) => (
                    <span
                      key={String(item)}
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {String(item)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const updateProfileDraft = (sectionKey: string, fieldKey: string, value: string) => {
    setProfileDraft((current) => setProfileField(current, sectionKey, fieldKey, value));
  };

  const beginEdit = () => {
    if (!employee) return;
    const initialProfileDraft = normalizeEmployeeProfileDraft(
      cloneProfileData(getProfileData(employee)),
      employee,
      employee.avatar_url ?? null,
    );

    setForm({
      emp_no: employee.emp_no ?? '',
      first_name: employee.first_name ?? '',
      last_name: employee.last_name ?? '',
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      national_id: employee.national_id ?? '',
      employment_type: employee.employment_type ?? '',
      salary_grade: employee.salary_grade ?? '',
      hire_date: employee.hire_date ? employee.hire_date.slice(0, 10) : '',
      department_id: employee.department_id ?? '',
      position_id: employee.position_id ?? '',
      manager_id: employee.manager_id ?? '',
      status: employee.status ?? 'active',
      avatar_url: employee.avatar_url ?? '',
    });
    setAvatarPreview(employee.avatar_url ?? null);
    setProfileDraft(initialProfileDraft);
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setAvatarPreview(dataUrl);
    setForm((current) => ({ ...current, avatar_url: dataUrl }));
    setProfileDraft((current) =>
      normalizeEmployeeProfileDraft(current, employee, dataUrl),
    );
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      const normalizedProfileDraft = normalizeEmployeeProfileDraft(profileDraft, employee, form.avatar_url.trim() || null);
      const response = await apiFetch(`/hris/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_no: form.emp_no.trim() || undefined,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          national_id: form.national_id.trim() || undefined,
          employment_type: form.employment_type.trim() || undefined,
          salary_grade: form.salary_grade.trim() || undefined,
          avatar_url: form.avatar_url.trim() || undefined,
          hire_date: form.hire_date || undefined,
          department_id: form.department_id || undefined,
          position_id: form.position_id || undefined,
          manager_id: form.manager_id || undefined,
          status: form.status || undefined,
          profile_data: normalizedProfileDraft ?? undefined,
        }),
      });

      if (response.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        setSaveError('You do not have permission to edit this employee.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save employee profile.');
      }

      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setAvatarPreview(updatedEmployee.avatar_url ?? null);
      setProfileDraft(
        normalizeEmployeeProfileDraft(
          cloneProfileData(updatedEmployee.profile_data ?? createAvaEmployeeProfileData()),
          updatedEmployee,
          updatedEmployee.avatar_url ?? null,
        ),
      );
      setIsEditModalOpen(false);
    } catch (submitError) {
      console.error(submitError);
      setSaveError(submitError instanceof Error ? submitError.message : 'Failed to save employee profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!employeeId) {
    return (
      <RestrictedRecord
        message="This employee profile is missing its route id."
        actionLabel="Back to HRIS"
        onAction={() => router.push('/hris')}
      />
    );
  }

  return (
    <AppPermissionGuard
      module="hris"
      fallback={
        <UnauthorizedEntry
          message="You do not have permission to access HRIS."
          actionLabel="Return to Dashboard"
          onAction={() => router.push('/dashboard')}
        />
      }
    >
      <div className="min-h-[calc(100vh-100px)] bg-gradient-to-b from-slate-50 via-white to-white p-6 md:p-10">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Loading personnel file</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-2xl py-24">
            <Card className="rounded-[32px] border-red-100 bg-red-50 p-8 text-center shadow-sm">
              <h1 className="text-3xl font-heading font-black text-red-700">Could not load employee profile</h1>
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
              <div className="mt-8 flex justify-center gap-3">
                <Button variant="outline" className="rounded-2xl px-6" onClick={() => router.push('/hris')}>
                  Back to HRIS
                </Button>
                <Button className="rounded-2xl px-6" onClick={() => void loadEmployee()}>
                  Retry
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-4" onClick={() => router.push('/hris')}>
                  <ArrowLeft size={16} />
                </Button>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Employee Profile</p>
                  <h1 className="text-4xl font-heading font-black text-brand-navy">
                    {employee?.first_name} {employee?.last_name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Personnel file, reporting line, and editable profile data.
                  </p>
                </div>
              </div>
              <Button className="h-12 rounded-2xl bg-brand-navy px-6 font-bold text-white" onClick={beginEdit}>
                <Edit3 size={16} className="mr-2 text-brand-gold" />
                Edit Employee
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-[360px,1fr]">
              <Card className="overflow-hidden rounded-[36px] border-slate-100 bg-white shadow-sm">
                <div className="h-40 bg-brand-navy" />
                <div className="px-8 pb-8">
                  <div className="-mt-16 flex items-end justify-between">
                    <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border-4 border-white bg-slate-50 shadow-xl">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt={`${employee?.first_name} ${employee?.last_name}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <User size={44} />
                        </div>
                      )}
                    </div>
                    <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-50">
                      {employee?.status}
                    </Badge>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h2 className="text-4xl font-heading font-black text-brand-navy">
                      {employee?.first_name} {employee?.last_name}
                    </h2>
                    <div className="inline-flex rounded-xl bg-brand-navy px-3 py-2 text-xs font-black tracking-[0.2em] text-white">
                      {employee?.emp_no}
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
                      {employee?.position?.title ?? 'No Position'}
                    </p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <Mail size={16} className="text-slate-400" />
                      <span>{employee?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <Phone size={16} className="text-slate-400" />
                      <span>{employee?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <Building2 size={16} className="text-slate-400" />
                      <span>{employee?.department?.name ?? 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{getProfileSection('employment_details').work_location || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Manager</div>
                    <div className="mt-2 text-lg font-heading font-black text-brand-navy">{managerName || 'No manager assigned'}</div>
                    {employee?.manager ? (
                      <Link
                        href={`/hris/employees/${employee.manager.id}`}
                        className="mt-3 inline-flex text-sm font-bold text-brand-navy underline decoration-brand-gold/50 underline-offset-4"
                      >
                        View manager profile
                      </Link>
                    ) : reportsTo ? (
                      <div className="mt-3 text-sm font-medium text-slate-500">
                        Reporting line is set in the personnel file, but no manager record is linked yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>

              <div className="space-y-8">
                <Card className="rounded-[36px] border-slate-100 bg-white p-8 shadow-sm">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Reports To</div>
                      <div className="mt-2 text-lg font-heading font-black text-brand-navy">{reportsTo}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Department</div>
                      <div className="mt-2 text-lg font-heading font-black text-brand-navy">
                        {employee?.department?.name ?? 'Unassigned'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Position</div>
                      <div className="mt-2 text-lg font-heading font-black text-brand-navy">
                        {employee?.position?.title ?? 'No Position'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Hire Date</div>
                      <div className="mt-2 text-lg font-heading font-black text-brand-navy">
                        {employee?.hire_date?.slice(0, 10) ?? 'Not provided'}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-8 xl:grid-cols-2">
                  <Card className="rounded-[36px] border-slate-100 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-brand-navy">
                        <Building2 size={18} />
                      </div>
                      <h3 className="text-2xl font-heading font-black text-brand-navy">Personnel Details</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {renderFieldRow('Employee ID', employee?.emp_no)}
                      {renderFieldRow('Email', employee?.email)}
                      {renderFieldRow('Phone', employee?.phone)}
                      {renderFieldRow('Start Date', getProfileSection('employment_details').start_date)}
                      {renderFieldRow('Department', employee?.department?.name ?? 'Unassigned')}
                      {renderFieldRow('Position', employee?.position?.title ?? 'No Position')}
                      {renderFieldRow('Reports To', reportsTo)}
                      {renderFieldRow('Manager', managerName)}
                      {renderFieldRow('Hire Date', employee?.hire_date?.slice(0, 10) ?? 'Not provided')}
                      {renderFieldRow('Employment Type', getProfileSection('employment_details').employment_type)}
                      {renderFieldRow('Status', getProfileSection('employment_details').status ?? employee?.status)}
                      {renderFieldRow('Basic Salary', getProfileSection('compensation').basic_salary)}
                      {renderFieldRow('Work Location', getProfileSection('employment_details').work_location)}
                      {renderFieldRow('Physical Address', getProfileSection('personal_information').physical_address)}
                      {renderFieldRow('Postal Address', getProfileSection('personal_information').postal_address)}
                      {renderFieldRow('Primary Contact', getProfileSection('emergency_contact').primary_contact_name)}
                      {renderFieldRow('Secondary Contact', getProfileSection('emergency_contact').secondary_contact_name)}
                      {renderFieldRow('Secondary Phone', getProfileSection('emergency_contact').secondary_phone)}
                      {renderFieldRow('Secondary Email', getProfileSection('emergency_contact').secondary_email)}
                    </div>
                  </Card>

                  <Card className="rounded-[36px] border-slate-100 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-brand-navy">
                        <User size={18} />
                      </div>
                      <h3 className="text-2xl font-heading font-black text-brand-navy">Profile Fields</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {renderFieldRow('Gender', getProfileSection('personal_information').gender)}
                      {renderFieldRow('Date of Birth', getProfileSection('personal_information').date_of_birth)}
                      {renderFieldRow('South African ID', employee?.national_id ?? getProfileSection('personal_information').south_african_id_number)}
                      {renderFieldRow('Passport Photo', employee?.avatar_url ? 'Uploaded' : 'Not provided')}
                      {renderFieldRow('Tax Number', getProfileSection('tax_and_statutory').tax_number)}
                      {renderFieldRow('PAYE Reference', getProfileSection('tax_and_statutory').paye_reference)}
                      {renderFieldRow('Bank Name', getProfileSection('compensation').bank_name)}
                      {renderFieldRow('Account Type', getProfileSection('compensation').account_type)}
                    </div>
                  </Card>
                </div>

                <Card className="rounded-[36px] border-slate-100 bg-brand-navy px-8 py-6 text-white shadow-2xl shadow-brand-navy/20">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-[28px] bg-white/10 px-6 py-5 text-left transition-colors hover:bg-white/15"
                    onClick={beginEdit}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-gold">Personnel File</div>
                      <div className="mt-2 text-xl font-heading font-black">Edit Employee</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-brand-navy">
                      <ArrowLeft size={20} className="rotate-180" />
                    </div>
                  </button>
                </Card>

                {profileSections.length > 0 ? (
                  <div className="space-y-8">
                    {profileSections.map(([sectionKey, sectionValue]) => renderSectionValue(sectionKey, sectionValue))}
                  </div>
                ) : null}
              </div>
            </div>

            {isEditModalOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/40 px-6 py-6 backdrop-blur-sm">
                <div className="relative my-auto max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
                  <button
                    type="button"
                    className="absolute right-6 top-6 text-sm font-bold text-slate-400 transition-colors hover:text-slate-700"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Close
                  </button>

                  <div className="mb-8">
                    <h2 className="text-4xl font-heading font-black text-brand-navy">Edit Employee</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Update the personnel record, manager, department, position, and passport photo.
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSave}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Employee ID</label>
                        <Input
                          value={form.emp_no}
                          onChange={(event) => setForm((current) => ({ ...current, emp_no: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Status</label>
                        <select
                          value={form.status}
                          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                        >
                          <option value="active">Active</option>
                          <option value="probation">Probation</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">First Name *</label>
                        <Input
                          value={form.first_name}
                          onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Last Name *</label>
                        <Input
                          value={form.last_name}
                          onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Email *</label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Hire Date *</label>
                        <Input
                          type="date"
                          value={form.hire_date}
                          onChange={(event) => setForm((current) => ({ ...current, hire_date: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Phone</label>
                        <Input
                          value={form.phone}
                          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">National ID</label>
                        <Input
                          value={form.national_id}
                          onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({ ...current, national_id: value }));
                            setProfileDraft((current) =>
                              setProfileField(current, 'personal_information', 'south_african_id_number', value),
                            );
                          }}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Employment Type</label>
                        <Input
                          value={form.employment_type}
                          onChange={(event) => setForm((current) => ({ ...current, employment_type: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Salary Grade</label>
                        <Input
                          value={form.salary_grade}
                          onChange={(event) => setForm((current) => ({ ...current, salary_grade: event.target.value }))}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Start Date</label>
                        <Input
                          type="date"
                          value={getStringSectionValue(profileDraft, 'employment_details', 'start_date')}
                          onChange={(event) => updateProfileDraft('employment_details', 'start_date', event.target.value)}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Reports To</label>
                        <Input
                          value={getStringSectionValue(profileDraft, 'employment_details', 'reports_to')}
                          onChange={(event) => updateProfileDraft('employment_details', 'reports_to', event.target.value)}
                          className="h-12 rounded-2xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[160px,1fr] items-start">
                      <div className="space-y-3">
                        <div className="h-36 w-36 overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50 shadow-sm">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Passport preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-slate-300">
                              No photo
                            </div>
                          )}
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-brand-navy hover:bg-slate-50">
                          Upload Passport Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              void handleAvatarUpload(event.target.files?.[0] ?? null);
                            }}
                          />
                        </label>
                      </div>
                      <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Personnel Profile</div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Update the richer personnel details here without exposing raw JSON.
                        </p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Gender</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'personal_information', 'gender')}
                              onChange={(event) => updateProfileDraft('personal_information', 'gender', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Date of Birth</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'personal_information', 'date_of_birth')}
                              onChange={(event) => updateProfileDraft('personal_information', 'date_of_birth', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Job Title</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'employment_details', 'job_title')}
                              onChange={(event) => updateProfileDraft('employment_details', 'job_title', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Work Location</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'employment_details', 'work_location')}
                              onChange={(event) => updateProfileDraft('employment_details', 'work_location', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic Salary</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'compensation', 'basic_salary')}
                              onChange={(event) => updateProfileDraft('compensation', 'basic_salary', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Bank Name</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'compensation', 'bank_name')}
                              onChange={(event) => updateProfileDraft('compensation', 'bank_name', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tax Number</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'tax_and_statutory', 'tax_number')}
                              onChange={(event) => updateProfileDraft('tax_and_statutory', 'tax_number', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Primary Contact</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'emergency_contact', 'primary_contact_name')}
                              onChange={(event) => updateProfileDraft('emergency_contact', 'primary_contact_name', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Physical Address</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'personal_information', 'physical_address')}
                              onChange={(event) => updateProfileDraft('personal_information', 'physical_address', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Postal Address</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'personal_information', 'postal_address')}
                              onChange={(event) => updateProfileDraft('personal_information', 'postal_address', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Secondary Contact</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'emergency_contact', 'secondary_contact_name')}
                              onChange={(event) => updateProfileDraft('emergency_contact', 'secondary_contact_name', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Secondary Phone</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'emergency_contact', 'secondary_phone')}
                              onChange={(event) => updateProfileDraft('emergency_contact', 'secondary_phone', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Secondary Email</label>
                            <Input
                              value={getStringSectionValue(profileDraft, 'emergency_contact', 'secondary_email')}
                              onChange={(event) => updateProfileDraft('emergency_contact', 'secondary_email', event.target.value)}
                              className="h-11 rounded-2xl border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Department</label>
                        <select
                          value={form.department_id}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              department_id: event.target.value,
                              position_id:
                                current.position_id &&
                                positions.some(
                                  (position) =>
                                    position.id === current.position_id &&
                                    position.department_id === event.target.value,
                                )
                                  ? current.position_id
                                  : '',
                            }))
                          }
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                        >
                          <option value="">Select department</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Position</label>
                        <select
                          value={form.position_id}
                          onChange={(event) => setForm((current) => ({ ...current, position_id: event.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                        >
                          <option value="">Select position</option>
                          {availablePositions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Manager</label>
                        <select
                          value={form.manager_id}
                          onChange={(event) => setForm((current) => ({ ...current, manager_id: event.target.value }))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                        >
                          <option value="">Select manager</option>
                          {employees
                            .filter((item) => item.id !== employee?.id && item.status !== 'terminated')
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.first_name} {item.last_name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Current Position</label>
                        <Input value={employee?.position?.title ?? ''} readOnly className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                      </div>
                    </div>

                    {saveError && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {saveError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 rounded-2xl px-6"
                        onClick={() => setIsEditModalOpen(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="h-12 rounded-2xl px-6" disabled={isSaving}>
                        <Save size={16} className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Employee'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppPermissionGuard>
  );
}
