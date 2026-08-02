import { createClient } from '@/lib/supabase/server';
import SubscriptionManagerCard from '@/components/simulator/SubscriptionManagerCard';
import EnterpriseDashboardView from '@/components/simulator/EnterpriseDashboardView';

export default async function EmpresaOverview() {
  const supabase = await createClient();

  // 1. Obtener datos del admin autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id;

  // 2. Traer info de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId || '')
    .single();

  // 3. Conteo de técnicos activos
  const { count: techniciansCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId || '')
    .eq('role', 'technician');

  // 4. Promedio de intentos completados por técnico en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Obtener todos los IDs de los técnicos de la empresa
  const { data: companyTechs } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId || '')
    .eq('role', 'technician');

  const techIds = companyTechs?.map((t) => t.id) || [];

  let averageAttempts = 0;
  if (techIds.length > 0) {
    const { count: attemptsCount } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .in('user_id', techIds)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    averageAttempts = parseFloat(((attemptsCount || 0) / techIds.length).toFixed(1));
  }

  return (
    <div className="space-y-6">
      <EnterpriseDashboardView
        title={`Dashboard Corporativo - ${company?.name || 'Empresa'}`}
        subtitle="Resumen operativo, estado de asientos y control de acceso del equipo técnico."
        metrics={{
          totalUsers: company?.seats_limit || 20,
          activeUsers: techniciansCount || 15,
          categoriesOrBrands: 4,
          progressPercentage: Math.round(((techniciansCount || 15) / (company?.seats_limit || 20)) * 100),
        }}
      />

      <div className="pt-2">
        <SubscriptionManagerCard
          plan={company?.plan || 'trial'}
          status={company?.subscription_status || 'trialing'}
          isCompany={true}
          hasSubscription={!!company?.stripe_subscription_id}
        />
      </div>
    </div>
  );
}
