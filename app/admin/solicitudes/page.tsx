import { createClient } from '@/lib/supabase/server';
import SolicitudesClient from './SolicitudesClient';

export default async function SolicitudesPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('access_requests')
    .select('*')
    .order('created_at', { ascending: false });

  return <SolicitudesClient requests={requests || []} />;
}
