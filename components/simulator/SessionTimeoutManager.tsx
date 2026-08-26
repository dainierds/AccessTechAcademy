"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad

/**
 * Cierra la sesión automáticamente tras 15 minutos sin actividad del usuario
 * (movimiento de mouse, teclado, scroll, toque, etc.) por motivos de seguridad.
 */
export default function SessionTimeoutManager() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let isSigningOut = false;

    const handleTimeout = async () => {
      if (isSigningOut) return;
      isSigningOut = true;
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignora errores de signOut; igual redirigimos
      }
      router.push('/login');
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleTimeout, IDLE_TIMEOUT_MS);
    };

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ];

    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [router]);

  return null;
}
