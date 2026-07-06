import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: string;
  qrCode: string;
  branchId: string;
  companyId?: string;
  employeeNumber?: string;
  phone?: string;
  company?: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string | null, refreshToken: string | null) => void;
  logout: () => void;
  setBalance: (balance: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      setBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance } : null
        }))
    }),
    { name: 'auth-store' }
  )
);
