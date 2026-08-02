import { createClient } from '@/lib/supabase/server';
import { publishToMarketplaceAction, toggleListingStatusAction } from './actions';
import { Store, Tag, Plus, AlertCircle, DollarSign } from 'lucide-react';

export default async function CreatorMarketplacePage() {
  const supabase = await createClient();

  // 1. Obtener datos del creador autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_onboarded')
    .eq('id', user?.id)
    .single();

  const isConnectActive = profile?.stripe_connect_onboarded || false;

  // 2. Traer todos sus escenarios publicados internamente (is_published = true)
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, type')
    .eq('created_by', user?.id || '')
    .eq('is_published', true);

  // 3. Traer listados actuales en el Marketplace
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select(`
      id,
      price_cents,
      is_active,
      scenario:scenarios (
        title,
        type
      )
    `)
    .eq('creator_id', user?.id || '');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Store className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Publicar en Marketplace</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Publica tus simuladores de cableado al catálogo global para empresas asociadas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario de Publicación */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <Tag className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Publicar Escenario</h3>
          </div>
          
          {!isConnectActive ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Debes configurar tu cuenta de pagos de Stripe Connect Express en el Dashboard principal antes de poder listar escenarios en el marketplace.</span>
            </div>
          ) : scenarios && scenarios.length > 0 ? (
            <form action={publishToMarketplaceAction} className="space-y-4">
              <div>
                <label htmlFor="scenarioId" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seleccionar Escenario
                </label>
                <select
                  id="scenarioId"
                  name="scenarioId"
                  required
                  className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title} ({s.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priceDollars" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Precio (USD)
                </label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="priceDollars"
                    id="priceDollars"
                    required
                    min="1.00"
                    step="0.01"
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar en Marketplace</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              No tienes escenarios publicados en tu catálogo. Créalos primero en la pestaña "Escenarios".
            </div>
          )}
        </div>

        {/* Listado en Venta */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tus Ofertas Activas</h3>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Escenario</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {listings && listings.length > 0 ? (
                    listings.map((list: any) => (
                      <tr key={list.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                          {list.scenario?.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-xs font-bold text-slate-500 dark:text-slate-400">{list.scenario?.type}</span>
                        </td>
                        <td className="px-6 py-4 font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          ${(list.price_cents / 100).toFixed(2)} USD
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            list.is_active 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            {list.is_active ? 'Activo' : 'Pausado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={toggleListingStatusAction}>
                            <input type="hidden" name="listingId" value={list.id} />
                            <input type="hidden" name="currentStatus" value={list.is_active.toString()} />
                            <button
                              type="submit"
                              className={`text-xs font-bold hover:underline ${
                                list.is_active ? 'text-red-500' : 'text-emerald-500'
                              }`}
                            >
                              {list.is_active ? 'Pausar' : 'Activar'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No tienes ofertas cargadas en el marketplace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
