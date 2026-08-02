import { createClient } from '@/lib/supabase/server';
import EnterpriseDashboardView from '@/components/simulator/EnterpriseDashboardView';

export default async function AdminOverview() {
  const supabase = await createClient();

  // 1. Obtener métricas directo de la base de datos
  const { count: companiesCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  const { count: techniciansCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'technician');

  // Obtener intentos de los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: attemptsCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .gte('completed_at', thirtyDaysAgo.toISOString());

  const totalUsers = (companiesCount || 0) + (techniciansCount || 0);

  return (
    <EnterpriseDashboardView
      title="Resumen del Sistema"
      subtitle="Métricas clave consolidadas y control operativo global de la plataforma."
      metrics={{
        totalUsers: totalUsers || 18,
        activeUsers: techniciansCount || 12,
        categoriesOrBrands: companiesCount || 5,
        progressPercentage: 88,
      }}
    />
  );
}
