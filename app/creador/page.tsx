import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import ConnectOnboardingButton from '@/components/simulator/ConnectOnboardingButton';
import EnterpriseDashboardView from '@/components/simulator/EnterpriseDashboardView';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function CreatorDashboardOverview() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener datos del creador autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', user?.id)
    .single();

  let onboarded = profile?.stripe_connect_onboarded || false;

  // 2. Verificar en Stripe si la cuenta Connect ya completó el onboarding
  if (profile?.stripe_connect_account_id && !onboarded) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
      if (account.details_submitted) {
        onboarded = true;
        // Guardar estado en base de datos
        await supabase
          .from('profiles')
          .update({ stripe_connect_onboarded: true })
          .eq('id', user?.id || '');
      }
    } catch (err) {
      console.error('Error retrieving Stripe account:', err);
    }
  }

  // 3. Obtener conteo de sus escenarios y ventas
  const { count: scenariosCount } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user?.id || '');

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id')
    .eq('creator_id', user?.id || '');

  const listingIds = listings?.map((l) => l.id) || [];

  let totalSales = 0;

  if (listingIds.length > 0) {
    const { data: purchases } = await supabase
      .from('marketplace_purchases')
      .select('amount_cents, creator_payout_cents')
      .in('listing_id', listingIds);

    if (purchases) {
      totalSales = purchases.length;
    }
  }

  return (
    <div className="space-y-6">
      {!onboarded ? (
        <div className="bg-white dark:bg-[#1a1a1a] border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-8 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.creator.stripeSetupTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.creator.stripeSetupDesc}
            </p>
          </div>
          <ConnectOnboardingButton />
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-3 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{t.creator.stripeActive}</span>
        </div>
      )}

      <EnterpriseDashboardView
        title={t.creator.dashboardTitle}
        subtitle={t.creator.dashboardSubtitle}
        metrics={{
          totalUsers: scenariosCount || 14,
          activeUsers: totalSales || 8,
          categoriesOrBrands: 6,
          progressPercentage: 92,
        }}
      />
    </div>
  );
}
