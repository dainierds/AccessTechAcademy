import { createClient } from '@/lib/supabase/server';
import AdminCertificationsClient from './AdminCertificationsClient';

export default async function AdminCertificationsPage() {
  const supabase = await createClient();

  // 1. Obtener niveles de certificación
  const { data: levels } = await supabase
    .from('certification_levels')
    .select('*')
    .order('level_number', { ascending: true });

  return <AdminCertificationsClient levels={levels || []} />;
}
