import { createClient } from '@/lib/supabase/server';
import SimulatorCanvas from '@/components/simulator-sandbox/SimulatorCanvas';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function SandboxPracticePage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return (
    <div className="min-h-screen bg-[#ecf0f1] dark:bg-[#0b0f19] p-8 text-slate-900 dark:text-white flex flex-col justify-center items-center transition-colors">
      <div className="w-full max-w-5xl space-y-6">
        <div>
          <Link href="/simulador" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
            &larr; {t.simulator.backToPanel}
          </Link>
          <h1 className="text-2xl font-bold mt-1">{t.simulator.freePractice}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.simulator.sandboxSubtitle}</p>
        </div>

        <SimulatorCanvas mode="play" />
      </div>
    </div>
  );
}
