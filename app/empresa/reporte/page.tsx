import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function TeamRiskReportPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener datos del admin autenticado y su empresa
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 2. Obtener técnicos de la empresa
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('company_id', companyId)
    .eq('role', 'technician');

  // 3. Obtener certificaciones de los técnicos
  const techIds = technicians?.map((t) => t.id) || [];
  const { data: certifications } = await supabase
    .from('certifications')
    .select('user_id, level')
    .in('user_id', techIds);

  // 4. Obtener todos los intentos de los técnicos
  const { data: attempts } = await supabase
    .from('attempts')
    .select('user_id, is_correct')
    .in('user_id', techIds);

  const getCertificationLevel = (userId: string): { certified: boolean; level?: number } => {
    if (!certifications) return { certified: false };
    const cert = certifications.find((c) => c.user_id === userId);
    return cert ? { certified: true, level: cert.level } : { certified: false };
  };

  const getRiskStatus = (userId: string): { kind: 'noAttempts' | 'low' | 'medium' | 'high'; percent?: string; colorClass: string } => {
    if (!attempts) return { kind: 'noAttempts', colorClass: 'bg-slate-900 border-slate-800 text-slate-400' };

    const userAttempts = attempts.filter((a) => a.user_id === userId);
    if (userAttempts.length === 0) {
      return { kind: 'noAttempts', colorClass: 'bg-slate-900 border-slate-800 text-slate-400' };
    }

    const correctCount = userAttempts.filter((a) => a.is_correct).length;
    const successRate = (correctCount / userAttempts.length) * 100;

    if (successRate > 80) {
      return { kind: 'low', percent: successRate.toFixed(0), colorClass: 'bg-green-950/40 border-green-800 text-green-300' };
    } else if (successRate >= 50) {
      return { kind: 'medium', percent: successRate.toFixed(0), colorClass: 'bg-yellow-950/40 border-yellow-800 text-yellow-300' };
    } else {
      return { kind: 'high', percent: successRate.toFixed(0), colorClass: 'bg-red-950/40 border-red-800 text-red-300' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">{t.enterprise.riskReport}</h1>
        <p className="text-sm text-slate-400">{t.enterprise.riskDesc}</p>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">{t.enterprise.technician}</th>
              <th className="px-6 py-4">{t.common.email}</th>
              <th className="px-6 py-4">{t.enterprise.certification}</th>
              <th className="px-6 py-4">{t.enterprise.successRateRisk}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {technicians && technicians.length > 0 ? (
              technicians.map((tech) => {
                const risk = getRiskStatus(tech.id);
                const cert = getCertificationLevel(tech.id);
                const riskText = risk.kind === 'noAttempts'
                  ? t.enterprise.sinIntentos
                  : `${risk.percent}% (${t.enterprise[risk.kind]})`;
                return (
                  <tr key={tech.id} className="hover:bg-slate-850 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {tech.full_name || t.common.noName}
                    </td>
                    <td className="px-6 py-4">{tech.email}</td>
                    <td className="px-6 py-4">
                      {cert.certified ? `${t.common.level} ${cert.level}` : t.enterprise.uncertified}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${risk.colorClass}`}>
                        {riskText}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {t.enterprise.noTechniciansForRisk}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
