import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Boxes, Plus, ExternalLink, Edit, CheckCircle2, Clock } from 'lucide-react';

export default async function CreatorScenariosPage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Obtener escenarios creados por este creador
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('created_by', user?.id || '')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Mis Escenarios Diseñados</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Diseña, edita y gestiona las prácticas lógicas de cableado creadas por ti.
          </p>
        </div>

        <Link
          href="/admin/escenarios/nuevo"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Escenario</span>
        </Link>
      </div>

      {/* Tabla de Escenarios */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Dificultad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha Creación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {scenarios && scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{scenario.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 capitalize">
                        {scenario.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs">Nivel {scenario.difficulty_level}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        scenario.is_published 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {scenario.is_published ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{scenario.is_published ? 'Publicado' : 'Borrador'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(scenario.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/escenarios/${scenario.id}/editar`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Link>
                        <Link
                          href={`/simulador/${scenario.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Probar</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Aún no has diseñado ningún escenario. ¡Crea tu primer prototipo!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
