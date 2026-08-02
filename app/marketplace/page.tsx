import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Store, ShoppingCart, CheckCircle2, User, ArrowLeft, Boxes } from 'lucide-react';

export default async function PublicMarketplaceCatalogPage() {
  const supabase = await createClient();

  // 1. Cargar listados de Marketplace activos
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select(`
      id,
      price_cents,
      scenario:scenarios (
        id,
        title,
        description,
        type,
        difficulty_level
      ),
      creator:profiles (
        full_name
      )
    `)
    .eq('is_active', true);

  // 2. Obtener datos de la empresa vinculada al admin actual para verificar compras previas
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';
  const isSuperAdmin = profile?.role === 'super_admin';

  // 3. Traer accesos de escenarios aprobados para esta empresa
  const { data: purchasedAccess } = await supabase
    .from('company_scenario_access')
    .select('scenario_id')
    .eq('company_id', companyId);

  const purchasedScenarioIds = purchasedAccess?.map((a) => a.scenario_id) || [];

  return (
    <div className="min-h-screen bg-[#ecf0f1] dark:bg-[#1a1a1a] p-4 sm:p-8 text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center animate-fadeIn">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* Header Gradient Banner */}
        <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <Link 
              href={isSuperAdmin ? '/admin' : '/empresa'} 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Store className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              <span>Marketplace de Escenarios</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Adquiere escenarios avanzados diseñados por fabricantes e instructores líderes.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            <Boxes className="w-4 h-4 text-purple-500" />
            <span>{listings?.length || 0} Disponibles</span>
          </div>
        </div>

        {/* Listado Catálogo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings && listings.length > 0 ? (
            listings.map((list: any) => {
              const s = list.scenario;
              if (!s) return null;
              const alreadyPurchased = purchasedScenarioIds.includes(s.id);

              return (
                <div key={list.id} className="bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 hover:shadow-lg transition-all duration-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 px-2.5 py-0.5 rounded-full">
                        {s.type}
                      </span>
                      <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        ${(list.price_cents / 100).toFixed(2)} USD
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{s.description || 'Sin descripción disponible.'}</p>
                    
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Creador: <strong className="text-slate-700 dark:text-slate-300">{list.creator?.full_name || 'Instructor Certificado'}</strong></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Dificultad: Nivel {s.difficulty_level}
                    </span>
                    
                    {alreadyPurchased ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Adquirido</span>
                      </span>
                    ) : (
                      <form action={async () => {
                        'use server';
                        // Llamada al route handler de Checkout Marketplace
                        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/checkout/marketplace`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ listingId: list.id, companyId }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          redirect(data.url);
                        }
                      }}>
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Comprar Escenario</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-12 rounded-xl text-center text-sm text-slate-400 font-medium shadow-sm">
              No hay escenarios listados en el marketplace actualmente.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
