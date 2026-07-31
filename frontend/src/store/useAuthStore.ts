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
  companySlug?: string | null;
  branchSlug?: string | null;
  employeeNumber?: string;
  phone?: string;
  company?: string;
  subsidyBalance?: string | null;
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

// Deriva panel + empresa/sucursal directamente de una URL jerárquica real:
// /master-admin · /:empresa/admin · /:empresa/:sucursal/caja · /:empresa/:sucursal/user
export function routeKeyFromPath(pathname: string): string {
  if (pathname.startsWith('/master-admin')) return 'master';
  const parts = pathname.split('/').filter(Boolean);
  if (parts[1] === 'admin') return sessionKey('admin', parts[0]);
  if (parts[2] === 'caja' || parts[2] === 'cashier') return sessionKey('cashier', parts[0], parts[1]);
  if (parts[2] === 'user') return sessionKey('user', parts[0], parts[1]);
  return sessionKey('user', parts[0], parts[1]);
}

// Clave de sesión: cada empresa/sucursal tiene su PROPIA sesión, aunque sea el mismo
// tipo de panel. Sin esto, iniciar sesión como admin de la Empresa B pisaba la sesión
// de admin de la Empresa A que ya estaba abierta en otra pestaña.
export function sessionKey(panel: Panel, companySlug?: string | null, branchSlug?: string | null): string {
  if (panel === 'master') return 'master';
  if (panel === 'admin') return `admin:${companySlug || ''}`;
  return `${panel}:${companySlug || ''}:${branchSlug || ''}`;
}

function keyFromUser(u: User): string {
  return sessionKey(panelForUser(u), u.companySlug, u.branchSlug);
}

function panelFromKey(key: string): Panel {
  return (key.split(':')[0] as Panel) || 'user';
}

interface AuthStore {
  // Sesiones independientes por panel + empresa/sucursal — coexisten en el mismo navegador
  sessions: Record<string, Session>;
  activeKey: string | null;
  activePanel: Panel;
  // Vista de la sesión activa (lo que leen los componentes)
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string | null, refreshToken: string | null) => void;
  activateSession: (key: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  patchUser: (patch: Partial<User>) => void;
  logout: () => void;
  setBalance: (balance: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeKey: null,
      activePanel: 'user',
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        const key = keyFromUser(user);
        const session: Session = {
          user,
          accessToken: accessToken || '',
          refreshToken: refreshToken || ''
        };
        set((state) => ({
          sessions: { ...state.sessions, [key]: session },
          activeKey: key,
          activePanel: panelFromKey(key),
          user,
          accessToken,
          refreshToken
        }));
      },

      activateSession: (key) => {
        const s = get().sessions[key];
        set({
          activeKey: key,
          activePanel: panelFromKey(key),
          user: s?.user ?? null,
          accessToken: s?.accessToken ?? null,
          refreshToken: s?.refreshToken ?? null
        });
      },

      updateTokens: (accessToken, refreshToken) => {
        set((state) => {
          const key = state.activeKey;
          const s = key ? state.sessions[key] : undefined;
          return {
            accessToken,
            refreshToken,
            sessions: s && key
              ? { ...state.sessions, [key]: { ...s, accessToken, refreshToken } }
              : state.sessions
          };
        });
      },

      // Actualiza campos del usuario de la sesión activa (ej. backfill de slugs)
      patchUser: (patch) => {
        set((state) => {
          if (!state.user || !state.activeKey) return {};
          const user = { ...state.user, ...patch };
          // Si el patch cambia companySlug/branchSlug, la clave de la sesión también cambia
          const newKey = keyFromUser(user);
          const sessions = { ...state.sessions };
          delete sessions[state.activeKey];
          sessions[newKey] = { user, accessToken: state.accessToken || '', refreshToken: state.refreshToken || '' };
          return { user, sessions, activeKey: newKey, activePanel: panelFromKey(newKey) };
        });
      },

      logout: () => {
        set((state) => {
          if (!state.activeKey) return {};
          const sessions = { ...state.sessions };
          delete sessions[state.activeKey];
          return { sessions, activeKey: null, user: null, accessToken: null, refreshToken: null };
        });
      },

      setBalance: (balance) => {
        set((state) => {
          if (!state.user || !state.activeKey) return {};
          const user = { ...state.user, balance };
          const s = state.sessions[state.activeKey];
          return {
            user,
            sessions: s ? { ...state.sessions, [state.activeKey]: { ...s, user } } : state.sessions
          };
        });
      },

      setHasHydrated: (state) => set({ _hasHydrated: state })
    }),
    {
      name: 'auth-store',
      version: 3,
      partialize: (state) => ({ sessions: state.sessions }),
      migrate: (persisted: any, version) => {
        // v0/v1: una sola sesión suelta. v2: sesiones keyed por Panel. v3: keyed por panel+empresa+sucursal.
        if (persisted?.user && persisted?.accessToken) {
          const key = keyFromUser(persisted.user);
          return { sessions: { [key]: { user: persisted.user, accessToken: persisted.accessToken, refreshToken: persisted.refreshToken || '' } } };
        }
        const oldSessions = persisted?.sessions || {};
        if (version < 3) {
          const migrated: Record<string, Session> = {};
          for (const s of Object.values(oldSessions) as Session[]) {
            if (s?.user) migrated[keyFromUser(s.user)] = s;
          }
          return { sessions: migrated };
        }
        return { sessions: oldSessions };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Activar la sesión que corresponde a la URL actual (empresa/sucursal incluidas)
          state.activateSession(routeKeyFromPath(window.location.pathname));
          state.setHasHydrated(true);
        }
      }
    }
  )
);
