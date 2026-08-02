import { createClient } from '@/lib/supabase/server';
import { DollarSign, Building2, Calendar, ShoppingBag } from 'lucide-react';

export default async function CreatorSalesPage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Cargar ofertas del creador para cruzar compras
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id, scenario:scenarios(title)')
    .eq('creator_id', user?.id || '');

  const listingMap = new Map(listings?.map((l: any) => [l.id, l.scenario?.title]) || []);
  const listingIds = listings?.map((l) => l.id) || [];

  // 3. Obtener compras de sus listados
  let purchases: any[] = [];
  if (listingIds.length > 0) {
    const { data: dbPurchases } = await supabase
      .from('marketplace_purchases')
      .select(`
        id,
        listing_id,
        amount_cents,
        creator_payout_cents,
        purchased_at,
        company:companies (
          name
        )
      `)
      .in('listing_id', listingIds)
      .order('purchased_at', { ascending: false });

    purchases = dbPurchases || [];
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <ShoppingBag className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Historial de Ventas</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Verifica las transacciones de compra de tus escenarios y el detalle de tus cobros a través de Stripe Connect.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Escenario</th>
                <th className="px-6 py-4">Cliente (Empresa)</th>
                <th className="px-6 py-4">Monto Total</th>
                <th className="px-6 py-4">Tu Comisión (Connect)</th>
                <th className="px-6 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {listingMap.get(purchase.listing_id) || 'Escenario Desconocido'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{purchase.company?.name || 'Cliente sin nombre'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-slate-400">${(purchase.amount_cents / 100).toFixed(2)} USD</td>
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(purchase.creator_payout_cents / 100).toFixed(2)} USD
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(purchase.purchased_at).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No has registrado ventas todavía.
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
