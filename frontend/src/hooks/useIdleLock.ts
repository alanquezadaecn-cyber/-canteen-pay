import { useEffect, useRef, useState } from 'react';

// Bloquea el panel tras N ms sin actividad (mouse, teclado, touch). No cierra la
// sesión ni toca los tokens: solo oculta la pantalla hasta que se re-ingrese la
// contraseña. Así el token/refreshToken sigue vivo aunque el cajero esté inactivo,
// y no hay que volver a iniciar sesión completa cada vez.
const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

export function useIdleLock(enabled: boolean) {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(() => setLocked(true), IDLE_TIMEOUT_MS);
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
  }, [enabled, locked]);

  const unlock = () => {
    setLocked(false);
    resetTimer();
  };

  const lockNow = () => setLocked(true);

  return { locked, unlock, lockNow };
}
