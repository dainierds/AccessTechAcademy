import { createClient } from '@/lib/supabase/server';
import { assignScenarioAction } from './actions';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function ScenariosAssignmentPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener datos del admin autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 2. Cargar escenarios globales/públicos
  const { data: globalScenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('is_published', true);

  // Cargar accesos a escenarios comprados por esta empresa
  const { data: purchasedAccess } = await supabase
    .from('company_scenario_access')
    .select('scenario:scenarios(*)')
    .eq('company_id', companyId);

  const purchasedScenarios = purchasedAccess?.map((pa: any) => pa.scenario).filter(Boolean) || [];

  // Consolidar catálogo final eliminando duplicados si existieran
  const allScenariosMap = new Map();
  globalScenarios?.forEach((s) => allScenariosMap.set(s.id, s));
  purchasedScenarios.forEach((s) => allScenariosMap.set(s.id, s));
  const scenarios = Array.from(allScenariosMap.values());

  // 3. Cargar técnicos de la empresa
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('company_id', companyId)
    .eq('role', 'technician');

  // 4. Cargar asignaciones activas para visualización
  const { data: assignments } = await supabase
    .from('scenario_assignments')
    .select(`
      id,
      assigned_at,
      due_date,
      scenario:scenarios (
        title
      ),
      technician:profiles (
        full_name,
        email
      )
    `)
    .order('assigned_at', { ascending: false });

  // Filtrar asignaciones que pertenezcan a los técnicos de esta empresa
  const techIds = technicians?.map((t) => t.id) || [];
  const filteredAssignments = assignments?.filter((a: any) => 
    a.technician && techIds.includes(a.technician.id)
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">{t.enterprise.scenarios}</h1>
        <p className="text-sm text-slate-400">{t.enterprise.scenariosDesc}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Panel Asignación */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">{t.enterprise.assignTask}</h3>
          
          {scenarios && scenarios.length > 0 && technicians && technicians.length > 0 ? (
            <form action={assignScenarioAction} className="space-y-4">
              <div>
                <label htmlFor="scenarioId" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.enterprise.selectScenario}
                </label>
                <select
                  id="scenarioId"
                  name="scenarioId"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t.enterprise.selectTechnicians}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-800 p-3 rounded-lg bg-slate-950">
                  {technicians.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        name="technicianIds"
                        value={t.id}
                        className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                      />
                      <span>{t.full_name || t.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.enterprise.dueDateOptional}
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
              >
                {t.enterprise.assignButton}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 font-medium">
              {!scenarios || scenarios.length === 0 
                ? t.enterprise.noPublishedScenarios 
                : t.enterprise.registerTechFirst}
            </div>
          )}
        </div>

        {/* Listado de Asignaciones */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">{t.enterprise.assignedTasks}</h3>

          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">{t.enterprise.technician}</th>
                  <th className="px-6 py-4">{t.enterprise.scenario}</th>
                  <th className="px-6 py-4">{t.enterprise.assignedOn}</th>
                  <th className="px-6 py-4">{t.enterprise.limit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment: any) => (
                    <tr key={assignment.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {assignment.technician?.full_name || assignment.technician?.email}
                      </td>
                      <td className="px-6 py-4">{assignment.scenario?.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-455">
                        {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : t.enterprise.noLimit}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      {t.enterprise.noTasksAssigned}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
