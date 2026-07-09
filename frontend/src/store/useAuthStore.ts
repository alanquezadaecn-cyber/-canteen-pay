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

export type Panel = 'master' | 'admin' | 'cashier' | 'user';

interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const MASTER_EMAIL = 'alejandro.qt92@gmail.com';

export function panelForUser(u: User): Panel {
  if (u.role === 'MASTER_ADMIN' || u.email === MASTER_EMAIL) return 'master';
  if (u.role === 'ADMIN') return 'admin';
  if (u.role === 'CASHIER') return 'cashier';
  return 'user';
}

export function panelFromPath(pathname: string): Panel {
  if (pathname.startsWith('/master-admin')) return 'master';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/caja') || pathname.startsWith('/cashier')) return 'cashier';
  return 'user';
}

interface AuthStore {
  // Sesiones independientes por panel — coexisten en el mismo navegador
  sessions: Partial<Record<Panel, Session>>;
  activePanel: Panel;
  // Vista de la sesión activa (lo que leen los componentes)
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string | null, refreshToken: string | null) => void;
  activatePanel: (panel: Panel) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setBalance: (balance: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activePanel: 'user',
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        const panel = panelForUser(user);
        const session: Session = {
          user,
          accessToken: accessToken || '',
          refreshToken: refreshToken || ''
        };
        set((state) => ({
          sessions: { ...state.sessions, [panel]: session },
          activePanel: panel,
          user,
          accessToken,
          refreshToken
        }));
      },

      activatePanel: (panel) => {
        const s = get().sessions[panel];
        set({
          activePanel: panel,
          user: s?.user ?? null,
          accessToken: s?.accessToken ?? null,
          refreshToken: s?.refreshToken ?? null
        });
      },

      updateTokens: (accessToken, refreshToken) => {
        set((state) => {
          const panel = state.activePanel;
          const s = state.sessions[panel];
          return {
            accessToken,
            refreshToken,
            sessions: s
              ? { ...state.sessions, [panel]: { ...s, accessToken, refreshToken } }
              : state.sessions
          };
        });
      },

      logout: () => {
        set((state) => {
          const sessions = { ...state.sessions };
          delete sessions[state.activePanel];
          return { sessions, user: null, accessToken: null, refreshToken: null };
        });
      },

      setBalance: (balance) => {
        set((state) => {
          if (!state.user) return {};
          const user = { ...state.user, balance };
          const panel = state.activePanel;
          const s = state.sessions[panel];
          return {
            user,
            sessions: s ? { ...state.sessions, [panel]: { ...s, user } } : state.sessions
          };
        });
      },

      setHasHydrated: (state) => set({ _hasHydrated: state })
    }),
    {
      name: 'auth-store',
      version: 2,
      partialize: (state) => ({ sessions: state.sessions }),
      migrate: (persisted: any) => {
        // Migrar formato viejo (una sola sesión) al nuevo (multi-sesión)
        if (persisted?.user && persisted?.accessToken) {
          const panel = panelForUser(persisted.user);
          return {
            sessions: {
              [panel]: {
                user: persisted.user,
                accessToken: persisted.accessToken,
                refreshToken: persisted.refreshToken || ''
              }
            }
          };
        }
        return { sessions: persisted?.sessions || {} };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Activar la sesión que corresponde a la URL actual
          state.activatePanel(panelFromPath(window.location.pathname));
          state.setHasHydrated(true);
        }
      }
    }
  )
);
