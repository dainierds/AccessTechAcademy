import { createClient } from '@/lib/supabase/server';
import AdminScenariosClient from './AdminScenariosClient';

export default async function AdminScenariosPage() {
  const supabase = await createClient();

  // 1. Obtener todos los escenarios
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminScenariosClient scenarios={scenarios || []} />;
}
