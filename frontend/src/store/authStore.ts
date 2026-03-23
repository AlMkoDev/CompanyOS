import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CompanySetup {
  is_complete?: boolean;
  current_step?: number;
  completed_steps?: string[];
}

interface CompanySummary {
  name?: string;
  setup?: CompanySetup;
  [key: string]: unknown;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  roles: string[];
  mfaEnabled?: boolean;
  company?: CompanySummary;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setup: {
    selectedDepartments: string[];
    completedDepartments: string[];
    templateSelections: Record<string, boolean>;
  };
  setAuth: (user: User) => void;
  setDepartments: (depts: string[]) => void;
  setTemplatePreference: (deptId: string, enabled: boolean) => void;
  markDeptComplete: (deptId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setup: {
        selectedDepartments: [],
        completedDepartments: [],
        templateSelections: {},
      },
      setAuth: (user) => set({ user, isAuthenticated: true }),
      setDepartments: (depts) => set((state) => ({
        setup: {
          ...state.setup,
          selectedDepartments: depts,
          completedDepartments: state.setup.completedDepartments.filter((deptId) => depts.includes(deptId)),
          templateSelections: Object.fromEntries(
            Object.entries(state.setup.templateSelections).filter(([deptId]) => depts.includes(deptId)),
          ),
        }
      })),
      setTemplatePreference: (deptId, enabled) => set((state) => ({
        setup: {
          ...state.setup,
          templateSelections: {
            ...state.setup.templateSelections,
            [deptId]: enabled,
          },
        },
      })),
      markDeptComplete: (deptId) => set((state) => ({
        setup: { 
          ...state.setup, 
          completedDepartments: Array.from(new Set([...state.setup.completedDepartments, deptId])) 
        }
      })),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        setup: { selectedDepartments: [], completedDepartments: [], templateSelections: {} }
      }),
    }),
    {
      name: 'companyos-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
