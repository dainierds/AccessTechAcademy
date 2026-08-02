import { createClient } from '@/lib/supabase/server';
import SimulatorCanvas from '@/components/simulator-sandbox/SimulatorCanvas';
import Link from 'next/link';

export default async function SandboxPracticePage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return (
    <div className="min-h-screen bg-[#ecf0f1] dark:bg-[#0b0f19] p-8 text-slate-900 dark:text-white flex flex-col justify-center items-center transition-colors">
      <div className="w-full max-w-5xl space-y-6">
        <div>
          <Link href="/simulador" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
            &larr; Volver al Panel
          </Link>
          <h1 className="text-2xl font-bold mt-1">Práctica Libre (Sandbox)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Entorno de simulación libre. Arrastra cables y experimenta sin límites.</p>
        </div>

        <SimulatorCanvas mode="play" />
      </div>
    </div>
  );
}
