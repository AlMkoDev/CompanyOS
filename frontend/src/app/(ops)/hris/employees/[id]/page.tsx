'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, Download, FileText, Mail, MapPin, Phone, Plus, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface EmployeeDetail {
  id: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  status: string;
  hire_date?: string;
  termination_date?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  avatar_url?: string | null;
  employment_type?: string | null;
  manager?: { id: string; first_name: string; last_name: string; avatar_url?: string | null } | null;
  employment_history?: Array<{
    id: string;
    start_date: string;
    end_date?: string | null;
    change_reason?: string | null;
    department?: { name: string } | null;
    position?: { title: string } | null;
  }>;
  documents?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    document_type?: string | null;
    created_at?: string;
  }>;
  national_id?: string | null;
  kra_pin?: string | null;
  address?: string | null;
  employment_type_label?: string | null;
}

interface EmployeeSummary {
  id: string;
  first_name: string;
  last_name: string;
  emp_no: string;
  status: string;
}

interface EmployeeEditFormState {
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  status: string;
}

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAuthStore();
  const employeeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'documents'>('profile');
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [managerOptions, setManagerOptions] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeEditFormState>({
    first_name: '',
    last_name: '',
    email: '',
    hire_date: '',
    department_id: '',
    position_id: '',
    manager_id: '',
    status: 'active',
  });

  useEffect(() => {
    if (!employeeId) {
      setError('Employee record not found.');
      setLoading(false);
      return;
    }

    const loadEmployee = async () => {
      setLoading(true);
      setError(null);

      try {
        const [employeeResponse, employeesResponse] = await Promise.all([
          apiFetch(`/hris/employees/${employeeId}`),
          apiFetch('/hris/employees'),
        ]);

        if (employeeResponse.status === 401 || employeesResponse.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (employeeResponse.status === 403 || employeesResponse.status === 403) {
          setError('You do not have permission to view this personnel file.');
          return;
        }

        if (!employeeResponse.ok) {
          throw new Error('Failed to load employee record.');
        }

        const [data, employeeList] = await Promise.all([
          employeeResponse.json(),
          employeesResponse.ok ? employeesResponse.json() : Promise.resolve([]),
        ]);

        setEmployee(data);
        setManagerOptions(
          (employeeList as EmployeeSummary[]).filter(
            (summary) => summary.id !== data.id && summary.status !== 'terminated',
          ),
        );
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? '',
          hire_date: data.hire_date ? new Date(data.hire_date).toISOString().slice(0, 10) : '',
          department_id: data.department?.id ?? '',
          position_id: data.position?.id ?? '',
          manager_id: data.manager?.id ?? '',
          status: data.status ?? 'active',
        });
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load employee record.');
      } finally {
        setLoading(false);
      }
    };

    void loadEmployee();
  }, [employeeId, logout, router]);

  const initials = useMemo(() => {
    if (!employee) return '??';
    return `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase();
  }, [employee]);

  const handleSaveEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!employee) {
      return;
    }

    setEditError(null);
    setIsSaving(true);

    try {
      const response = await apiFetch(`/hris/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          hire_date: form.hire_date,
          department_id: form.department_id || undefined,
          position_id: form.position_id || undefined,
          manager_id: form.manager_id || undefined,
          status: form.status || undefined,
        }),
      });

      if (response.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        setEditError('You do not have permission to update this employee.');
        return;
      }

      if (!response.ok) {
        let message = 'Failed to update employee.';
        try {
          const payload = await response.json();
          if (typeof payload?.message === 'string') {
            message = payload.message;
          } else if (Array.isArray(payload?.message) && payload.message.length > 0) {
            message = payload.message.join(', ');
          }
        } catch {
          // Keep default.
        }
        throw new Error(message);
      }

      const updatedEmployee = (await response.json()) as EmployeeDetail;
      setEmployee(updatedEmployee);
      setIsEditModalOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setEditError(saveError instanceof Error ? saveError.message : 'Failed to update employee.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/50">
          Loading personnel file...
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 md:p-10">
        <Card className="rounded-[40px] border-slate-100 p-10">
          <div className="text-sm font-semibold text-rose-600">{error ?? 'Employee record not found.'}</div>
          <Button className="mt-6" onClick={() => router.push('/hris')}>
            Return to HRIS
          </Button>
        </Card>
      </div>
    );
  }

  const displayEmploymentType = employee.employment_type_label ?? employee.employment_type ?? 'Full-time';
  const displayHireDate = employee.hire_date ? new Date(employee.hire_date).toISOString().slice(0, 10) : 'N/A';
  const displayStatus = employee.status.charAt(0).toUpperCase() + employee.status.slice(1);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-32">
      <div className="flex items-center gap-4">
        <Link href="/hris" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">{employee.first_name} {employee.last_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 font-bold rounded-lg uppercase tracking-tighter text-[10px]">
              {displayStatus}
            </Badge>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{employee.emp_no}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[40px] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <div className="h-32 bg-brand-navy relative">
              <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-[32px] p-1 shadow-xl">
                <div className="w-full h-full bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 text-xl font-black">
                  {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.first_name} className="w-full h-full rounded-[28px] object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </div>
            </div>
            <div className="pt-16 p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <Mail size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email</label>
                    <span className="text-sm font-bold text-brand-navy">{employee.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <Phone size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone</label>
                    <span className="text-sm font-bold text-brand-navy">{employee.phone ?? 'Not provided'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-navy/5 group-hover:text-brand-navy transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Department</label>
                    <span className="text-sm font-bold text-brand-navy">{employee.department?.name ?? 'Unassigned'}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full h-14 bg-brand-navy rounded-2xl font-bold shadow-lg text-white"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Employee
              </Button>
            </div>
          </Card>

          <Card className="rounded-[32px] border-slate-100 p-8 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Employment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">D.O.H</label>
                <div className="text-sm font-bold text-brand-navy">{displayHireDate}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Type</label>
                <div className="text-sm font-bold text-brand-navy">{displayEmploymentType}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 p-2 bg-slate-100/50 rounded-3xl border border-slate-100 self-start">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Job History
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'documents' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Documents
            </button>
          </div>

          <Card className="rounded-[40px] border-slate-100 p-8 md:p-12 min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                <section>
                  <h3 className="text-2xl font-heading font-bold text-brand-navy mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Briefcase size={20} /></div>
                    Current Assignment
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</label>
                      <div className="text-lg font-bold text-slate-700">{employee.department?.name ?? 'Unassigned'}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Position</label>
                      <div className="text-lg font-bold text-slate-700">{employee.position?.title ?? 'No Position'}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Reports To</label>
                      <div className="text-lg font-bold text-slate-700">
                        {employee.manager ? (
                          <Link href={`/hris/employees/${employee.manager.id}`} className="text-brand-navy underline decoration-slate-200 underline-offset-4">
                            {employee.manager.first_name} {employee.manager.last_name}
                          </Link>
                        ) : (
                          'No manager assigned'
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-heading font-bold text-brand-navy mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><ShieldCheck size={20} /></div>
                    Statutory Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">National ID No.</label>
                      <div className="text-lg font-bold text-slate-700 font-mono tracking-tighter">{employee.national_id ?? 'Not provided'}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">KRA PIN</label>
                      <div className="text-lg font-bold text-slate-700 font-mono tracking-tighter">{employee.kra_pin ?? 'Not provided'}</div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {(employee.employment_history?.length ? employee.employment_history : []).map((entry, index) => (
                  <div key={entry.id} className="flex gap-6 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-brand-navy shadow-sm relative z-10 font-bold">{index + 1}</div>
                      <div className="w-0.5 h-20 bg-slate-50 mt-2"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">
                        {entry.position?.title ?? 'Position change'} {entry.department?.name ? `in ${entry.department.name}` : ''}
                      </h4>
                      <div className="text-slate-400 text-sm font-bold flex gap-2 items-center italic">
                        <span>{new Date(entry.start_date).toISOString().slice(0, 10)}</span>
                        <span>→</span>
                        <span>{entry.end_date ? new Date(entry.end_date).toISOString().slice(0, 10) : 'Present'}</span>
                      </div>
                      <p className="mt-2 text-slate-500 text-sm font-medium">{entry.change_reason ?? 'Role history record'}</p>
                    </div>
                  </div>
                ))}
                {(!employee.employment_history || employee.employment_history.length === 0) && (
                  <div className="rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 p-8 text-slate-500">
                    No job history records available yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-heading font-bold text-brand-navy">Vault</h3>
                  <Button variant="outline" className="rounded-xl border-slate-200 flex gap-2 font-bold h-11">
                    <Plus size={16} /> Upload New
                  </Button>
                </div>
                {(employee.documents?.length ? employee.documents : []).map((doc) => (
                  <div key={doc.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-slate-50 transition-all hover:border-brand-navy/10 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-navy transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-brand-navy mb-0.5">{doc.file_name}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span className="text-brand-navy/60 bg-brand-navy/5 px-2 rounded-md">{doc.document_type ?? 'Document'}</span>
                          <span>{doc.created_at ? `Uploaded: ${new Date(doc.created_at).toISOString().slice(0, 10)}` : 'Uploaded recently'}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-brand-navy hover:bg-white shadow-sm transition-all border border-transparent hover:border-slate-100" onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}>
                      <Download size={20} />
                    </Button>
                  </div>
                ))}
                {(!employee.documents || employee.documents.length === 0) && (
                  <div className="rounded-3xl border border-dashed border-slate-100 bg-slate-50/50 p-8 text-slate-500">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-[32px] bg-white p-8 shadow-2xl">
            <button
              type="button"
              className="absolute right-6 top-6 text-sm font-bold text-slate-400 transition-colors hover:text-slate-700"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditError(null);
              }}
            >
              Close
            </button>

            <div className="mb-8 pr-16">
              <h2 className="text-3xl font-heading font-black tracking-tight text-brand-navy">Edit Employee</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Update the personnel record, manager, department, and position.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSaveEmployee}>
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
                  <label className="mb-2 block text-sm font-bold text-slate-700">Manager</label>
                  <select
                    value={form.manager_id}
                    onChange={(event) => setForm((current) => ({ ...current, manager_id: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  >
                    <option value="">No manager assigned</option>
                    {managerOptions.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.first_name} {manager.last_name} ({manager.emp_no})
                      </option>
                    ))}
                  </select>
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

              {editError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl px-6"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditError(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-12 rounded-2xl px-6 text-white" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
