import { createClient } from '@/lib/supabase/server';
import CompaniesListClient from './CompaniesListClient';

export default async function CompaniesList() {
  const supabase = await createClient();

  // Obtener todas las empresas
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  // Obtener conteo de usuarios por empresa para calcular asientos ocupados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('company_id');

  return (
    <CompaniesListClient
      companies={companies || []}
      profiles={profiles || []}
    />
  );
}
