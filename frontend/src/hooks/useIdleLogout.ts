import { useEffect, useRef } from 'react';

// Cierra la sesión por completo tras N ms sin actividad. A diferencia de useIdleLock
// (caja: pantalla de bloqueo + re-ingresar contraseña, token sigue vivo), acá se usa
// para el panel master-admin: es la cuenta más sensible del sistema (bloquea/desbloquea
// empresas, ve pagos de todos los clientes) y no es una terminal compartida que deba
// seguir "abierta" — si no hay interacción, mejor cerrar sesión de verdad.
const IDLE_LOGOUT_MS = 5 * 60 * 1000; // 5 minutos

export function useIdleLogout(enabled: boolean, onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onTimeout, IDLE_LOGOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
