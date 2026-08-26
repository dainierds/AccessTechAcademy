import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScenarioSimulationIframe from '@/components/simulator/ScenarioSimulationIframe';

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Traer escenario de Supabase
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (!scenario) {
    notFound();
  }

  return (
    <ScenarioSimulationIframe
      scenario={scenario}
    />
  );
}
