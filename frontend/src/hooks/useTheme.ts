import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

/**
 * Hook para gestionar tema claro/oscuro
 * - Persiste en localStorage vía Zustand
 * - Detecta preferencia del sistema (prefers-color-scheme)
 * - Sincroniza con class en <html>
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeState>({
    mode: 'system',
    isDark: false,
  });
  const [mounted, setMounted] = useState(false);

  // Detectar preferencia del sistema
  const getSystemTheme = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Obtener tema actual (system + preferencia del usuario)
  const getEffectiveTheme = (mode: ThemeMode): boolean => {
    if (mode === 'system') {
      return getSystemTheme();
    }
    return mode === 'dark';
  };

  // Aplicar tema al DOM
  const applyTheme = (isDark: boolean) => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }
  };

  // Inicializar tema al montar
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    // Light por defecto: la identidad wallet de CashFood es clara
    const initialMode: ThemeMode = savedMode || 'light';
    const isDark = getEffectiveTheme(initialMode);

    setTheme({ mode: initialMode, isDark });
    applyTheme(isDark);
    setMounted(true);
  }, []);

  // Escuchar cambios de preferencia del sistema
  useEffect(() => {
    if (theme.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newIsDark = e.matches;
      setTheme(prev => ({ ...prev, isDark: newIsDark }));
      applyTheme(newIsDark);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode]);

  // Cambiar tema
  const setThemeMode = (mode: ThemeMode) => {
    localStorage.setItem('theme-mode', mode);
    const isDark = getEffectiveTheme(mode);
    setTheme({ mode, isDark });
    applyTheme(isDark);
  };

  // Toggle entre light/dark (sin system)
  const toggleTheme = () => {
    const newMode: ThemeMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Volver a system
  const resetToSystem = () => {
    setThemeMode('system');
  };

  return {
    mounted,
    mode: theme.mode,
    isDark: theme.isDark,
    setThemeMode,
    toggleTheme,
    resetToSystem,
  };
};

export default useTheme;
