import { createClient } from '@/lib/supabase/server';
import UsersManagementClient from './UsersManagementClient';

export default async function UsersManagementPage() {
  const supabase = await createClient();

  // 1. Cargar perfiles de usuario
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Cargar lista de empresas para el selector
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name');

  return (
    <UsersManagementClient 
      initialProfiles={profiles || []} 
      companies={companies || []} 
    />
  );
}
