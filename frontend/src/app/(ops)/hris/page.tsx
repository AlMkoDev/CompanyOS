'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AppPermissionGuard } from '@/components/common/AppPermissionGuard';
import { UnauthorizedEntry } from '@/components/common/AccessState';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus,
  Mail,
  Building2,
  ExternalLink,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface Employee {
  id: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  department: { name: string } | null;
  position: { title: string } | null;
  avatar_url: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  title: string;
  department_id: string | null;
}

interface CreateEmployeeFormState {
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  status: string;
}

export default function EmployeeDirectoryPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateEmployeeFormState>({
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
    const loadDirectoryData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [employeesResponse, departmentsResponse, positionsResponse] = await Promise.all([
          apiFetch('/hris/employees'),
          apiFetch('/departments'),
          apiFetch('/hris/positions'),
        ]);

        if (
          employeesResponse.status === 401 ||
          departmentsResponse.status === 401 ||
          positionsResponse.status === 401
        ) {
          logout();
          router.push('/login');
          return;
        }

        if (
          employeesResponse.status === 403 ||
          departmentsResponse.status === 403 ||
          positionsResponse.status === 403
        ) {
          setError('You do not have permission to access the employee directory.');
          return;
        }

        if (!employeesResponse.ok || !departmentsResponse.ok || !positionsResponse.ok) {
          throw new Error('Failed to load employee directory.');
        }

        const [employeesData, departmentsData, positionsData] = await Promise.all([
          employeesResponse.json(),
          departmentsResponse.json(),
          positionsResponse.json(),
        ]);

        setEmployees(employeesData);
        setDepartments(departmentsData);
        setPositions(positionsData);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load employee directory.');
      } finally {
        setLoading(false);
      }
    };

    void loadDirectoryData();
  }, [logout, router]);

  const resetCreateForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      hire_date: '',
      department_id: '',
      position_id: '',
      manager_id: '',
      status: 'active',
    });
    setCreateError(null);
  };

  const handleCreateEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    if (!form.first_name || !form.last_name || !form.email || !form.hire_date) {
      setCreateError('First name, last name, email, and hire date are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/hris/employees', {
        method: 'POST',
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
        setCreateError('You do not have permission to add employees.');
        return;
      }

      if (!response.ok) {
        let message = 'Failed to create employee.';

        try {
          const payload = await response.json();
          if (typeof payload?.message === 'string') {
            message = payload.message;
          } else if (Array.isArray(payload?.message) && payload.message.length > 0) {
            message = payload.message.join(', ');
          }
        } catch {
          // Keep default message when no JSON payload is returned.
        }

        throw new Error(message);
      }

      const createdEmployee = await response.json();

      setEmployees((current) =>
        [...current, createdEmployee].sort((left, right) =>
          `${left.first_name} ${left.last_name}`.localeCompare(`${right.first_name} ${right.last_name}`),
        ),
      );
      resetCreateForm();
      setIsCreateModalOpen(false);
    } catch (submitError) {
      console.error(submitError);
      setCreateError(submitError instanceof Error ? submitError.message : 'Failed to create employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionsForSelectedDepartment = form.department_id
    ? positions.filter((position) => position.department_id === form.department_id)
    : [];
  const availablePositions = positionsForSelectedDepartment.length > 0
    ? positionsForSelectedDepartment
    : positions;
  const selectedDepartmentName = departments.find((department) => department.id === form.department_id)?.name ?? '';
  const isDepartmentPositionListEmpty = Boolean(form.department_id) && positionsForSelectedDepartment.length === 0;
  const isPositionCatalogEmpty = positions.length === 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Active</Badge>;
      case 'probation': return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Probation</Badge>;
      case 'terminated': return <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-50 border-none px-3 py-1 font-black uppercase tracking-tighter text-[10px] rounded-full shadow-sm">Terminated</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3 py-1 font-black uppercase tracking-tighter text-[10px]">{status}</Badge>;
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.emp_no.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.name.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 bg-brand-gold rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight">Employee Directory</h1>
          </div>
          <p className="text-slate-400 font-medium text-base ml-4">Advanced personnel intelligence and organizational mapping.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-[20px] border-slate-200 font-bold hover:bg-slate-50 transition-all flex gap-3 shadow-sm active:scale-95">
            <Filter size={18} className="text-brand-navy" /> <span className="text-slate-600">Advanced Filters</span>
          </Button>
          <Button
            className="h-14 px-8 rounded-[20px] bg-brand-navy border-none font-bold text-white shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 hover:-translate-y-0.5 transition-all flex gap-3 active:scale-95"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
          >
            <UserPlus size={18} className="text-brand-gold" /> Add New Employee
          </Button>
        </div>
      </div>

      <div className="relative group max-w-4xl">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-brand-navy transition-colors">
          <Search size={22} />
        </div>
        <Input 
          placeholder="Search by name, ID, or department..." 
          className="h-20 pl-16 bg-white border-slate-100 rounded-[30px] shadow-sm text-xl font-medium focus-visible:ring-brand-navy/10 focus-visible:border-brand-navy transition-all placeholder:text-slate-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-[420px] bg-white animate-pulse rounded-[48px] border border-slate-100 shadow-sm"></div>
          ))
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <Card key={emp.id} className="relative group overflow-visible border-slate-100 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-brand-navy/10 transition-all duration-500 border-2 hover:border-brand-navy/5 bg-white">
              <div className="p-10 flex flex-col h-full">
                {/* Header: Avatar and ID */}
                <div className="flex justify-between items-start mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden shadow-inner">
                      {emp.avatar_url ? (
                        <Image src={emp.avatar_url} alt={emp.first_name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <Users size={40} className="text-slate-200" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-md border border-slate-50 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-500 text-brand-navy">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Status</div>
                    {getStatusBadge(emp.status)}
                  </div>
                </div>

                {/* Identity */}
                <div className="mb-8">
                  <h3 className="text-3xl font-heading font-black text-brand-navy mb-2 tracking-tight group-hover:text-brand-gold transition-colors duration-300">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-brand-navy text-white text-[10px] font-black rounded-lg tracking-widest uppercase">
                       {emp.emp_no}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      <Briefcase size={12} className="text-brand-gold" />
                      {emp.position?.title ?? 'No Position'}
                    </div>
                  </div>
                </div>

                {/* Contact & Meta */}
                <div className="space-y-4 mb-10 mt-auto">
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:bg-brand-gold/10 group-hover/item:text-brand-gold transition-colors duration-300">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 truncate group-hover/item:text-brand-navy transition-colors">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:bg-brand-gold/10 group-hover/item:text-brand-gold transition-colors duration-300">
                      <Building2 size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover/item:text-brand-navy transition-colors">{emp.department?.name ?? 'Unassigned'}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-8 border-t border-slate-50">
                  <Link 
                    href={`/hris/employees/${emp.id}`}
                    className="flex items-center justify-between group/btn bg-slate-50 hover:bg-brand-navy p-4 rounded-3xl transition-all duration-300 overflow-hidden relative"
                  >
                    <span className="font-black uppercase tracking-widest text-[11px] text-brand-navy group-hover/btn:text-white transition-colors relative z-10">
                      Access Personnel File
                    </span>
                    <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:bg-brand-gold transition-all duration-300 relative z-10 group-hover/btn:translate-x-1">
                      <ArrowRight size={18} className="text-brand-navy group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-brand-navy translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[64px] border-2 border-dashed border-slate-100 shadow-inner">
             <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-6 shadow-sm">
              <Search size={48} strokeWidth={1.5} />
             </div>
             <h3 className="text-3xl font-heading font-black text-brand-navy mb-2">No personnel found</h3>
             <p className="text-slate-400 font-medium text-lg">Adjust your search parameters or try a clear filter.</p>
             <Button 
                variant="ghost" 
                className="mt-8 font-black uppercase tracking-widest text-brand-gold hover:text-brand-navy"
                onClick={() => setSearch('')}
              >
               Clear Search Results
             </Button>
          </div>
        )}
      </div>
    </div>
    {isCreateModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-6 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl rounded-[32px] bg-white p-8 shadow-2xl">
          <button
            type="button"
            className="absolute right-6 top-6 text-sm font-bold text-slate-400 transition-colors hover:text-slate-700"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetCreateForm();
            }}
          >
            Close
          </button>

          <div className="mb-8 pr-16">
            <h2 className="text-3xl font-heading font-black tracking-tight text-brand-navy">Add New Employee</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Create the employee record and trigger the linked onboarding workflow.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleCreateEmployee}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">First Name *</label>
                <Input
                  value={form.first_name}
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  placeholder="Ava"
                  className="h-12 rounded-2xl border-slate-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Last Name *</label>
                <Input
                  value={form.last_name}
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  placeholder="Ndlovu"
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
                  placeholder="ava.ndlovu@company.com"
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
                  {isPositionCatalogEmpty && (
                    <option value="" disabled>
                      No positions created yet
                    </option>
                  )}
                  {availablePositions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title}
                    </option>
                  ))}
                </select>
                {isDepartmentPositionListEmpty && (
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    No positions are assigned to {selectedDepartmentName || 'this department'} yet. Showing company positions instead.
                  </p>
                )}
                {isPositionCatalogEmpty && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Create a position in the Positions page first, or leave this blank and add it later.
                  </p>
                )}
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
                    .filter((employee) => employee.status !== 'terminated')
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
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

            {createError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl px-6"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-12 rounded-2xl px-6" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </AppPermissionGuard>
  );
}
