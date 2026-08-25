import Link from 'next/link';
import SubscriptionManagerCard from '@/components/simulator/SubscriptionManagerCard';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function TechnicianOverviewPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener datos del técnico autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // 2. Traer asignaciones de escenarios para el técnico actual
  const { data: assignments } = await supabase
    .from('scenario_assignments')
    .select(`
      id,
      assigned_at,
      due_date,
      scenario:scenarios (
        id,
        title,
        description,
        type,
        difficulty_level
      )
    `)
    .eq('technician_id', userId);

  // 3. Traer intentos del técnico para verificar si ya los completó
  const { data: attempts } = await supabase
    .from('attempts')
    .select('scenario_id, is_correct')
    .eq('user_id', userId);

  // 4. Traer certificaciones aprobadas del usuario para mostrar su nivel máximo
  const { data: certifications } = await supabase
    .from('certifications')
    .select('level')
    .eq('user_id', userId)
    .order('level', { ascending: false });

  const maxLevel = certifications && certifications.length > 0 ? certifications[0].level : 0;

  const getScenarioStatus = (scenarioId: string): 'pending' | 'completed' | 'attempted' => {
    if (!attempts) return 'pending';
    const attemptsForScenario = attempts.filter((a) => a.scenario_id === scenarioId);
    if (attemptsForScenario.length === 0) return 'pending';
    const hasSuccess = attemptsForScenario.some((a) => a.is_correct);
    return hasSuccess ? 'completed' : 'attempted';
  };

  // 5. Traer datos de suscripción del técnico
  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', userId)
    .single();

  return (
    <div className="w-full max-w-5xl space-y-8 mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{t.simulator.portalTitle}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              maxLevel > 0 
                ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500'
            }`}>
              {maxLevel > 0 ? `${t.simulator.certifiedLvl} ${maxLevel}` : t.simulator.uncertified}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{t.simulator.portalSubtitle}</p>
        </div>
      </div>

        {/* Listado de Tareas Asignadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.simulator.assignedTasks}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments && assignments.length > 0 ? (
              assignments.map((assignment: any) => {
                const s = assignment.scenario;
                if (!s) return null;
                const status = getScenarioStatus(s.id);
                const statusLabel = status === 'completed' ? t.simulator.statusCompleted : status === 'pending' ? t.simulator.statusPending : t.simulator.statusAttempted;
                return (
                  <div key={assignment.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-350 dark:hover:border-slate-700 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                          s.type === 'diagnostic' 
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400' 
                            : s.type === 'guided' 
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400' 
                            : 'bg-zinc-100 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300'
                        }`}>
                          {s.type}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          status === 'completed' 
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                            : status === 'pending'
                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{s.description || t.simulator.noDescription}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {t.simulator.dueDate} {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : t.simulator.noDeadline}
                      </span>
                      <Link
                        href={`/simulador/${s.id}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                      >
                        {t.simulator.start}
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-8 rounded-xl text-center text-sm text-slate-500 font-medium shadow-sm">
                {t.simulator.noTasks}
              </div>
            )}
          </div>
        </div>

        <SubscriptionManagerCard
          plan={dbProfile?.stripe_subscription_id ? 'Pro' : 'Free Sandbox'}
          status={dbProfile?.subscription_status || 'trialing'}
          isCompany={false}
          hasSubscription={!!dbProfile?.stripe_subscription_id}
        />

    </div>
  );
}
