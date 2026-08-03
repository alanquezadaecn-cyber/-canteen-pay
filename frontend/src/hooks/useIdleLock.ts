import { useEffect, useRef, useState } from 'react';

// Bloquea el panel tras N ms sin actividad (mouse, teclado, touch). No cierra la
// sesión ni toca los tokens: solo oculta la pantalla hasta que se re-ingrese la
// contraseña. Así el token/refreshToken sigue vivo aunque el cajero esté inactivo,
// y no hay que volver a iniciar sesión completa cada vez.
const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

// El "locked" se persiste en localStorage (no solo en memoria): si no, con la caja
// bloqueada bastaba con recargar la página (Ctrl+R / F5) para que el componente
// volviera a montar con locked=false y se "desbloqueara" sin pedir contraseña.
function lockKey(storageKey?: string) {
  return `cashfood_idlelock_${storageKey || 'default'}`;
}

export function useIdleLock(enabled: boolean, storageKey?: string) {
  const key = lockKey(storageKey);
  const [locked, setLocked] = useState(() => localStorage.getItem(key) === '1');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(() => {
      localStorage.setItem(key, '1');
      setLocked(true);
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    const onActivity = () => {
      if (!locked) resetTimer();
    };

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locked, key]);

  const unlock = () => {
    localStorage.removeItem(key);
    setLocked(false);
    resetTimer();
  };

  const lockNow = () => {
    localStorage.setItem(key, '1');
    setLocked(true);
  };

  return { locked, unlock, lockNow };
}
