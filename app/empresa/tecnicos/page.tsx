import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { inviteTechnicianAction, toggleTechnicianStatus } from './actions';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function TechniciansListPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Obtener datos del admin autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 2. Traer info de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  // 3. Traer técnicos asignados a la empresa
  const { data: relations } = await supabase
    .from('company_technicians')
    .select(`
      status,
      invited_at,
      user_id,
      user:profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('company_id', companyId);

  // 4. Traer certificaciones para los IDs de técnicos
  const techIds = relations?.map((r) => r.user_id) || [];
  const { data: certifications } = await supabase
    .from('certifications')
    .select('user_id, level')
    .in('user_id', techIds);

  const getCertificationLevel = (userId: string): { certified: boolean; level?: number } => {
    if (!certifications) return { certified: false };
    const cert = certifications.find((c) => c.user_id === userId);
    return cert ? { certified: true, level: cert.level } : { certified: false };
  };

  const getStatusLabel = (status: string): string => {
    if (status === 'active') return t.common.active;
    if (status === 'invited') return t.enterprise.invited;
    if (status === 'suspended') return t.enterprise.suspended;
    return status;
  };

  const getSeatsCount = () => {
    return relations?.length || 0;
  };

  const isLimitReached = company ? getSeatsCount() >= company.seats_limit : false;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{t.enterprise.technicians}</h1>
          <p className="text-sm text-slate-400">{t.enterprise.techniciansDesc}</p>
        </div>
        <span className="text-sm bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
          {t.enterprise.seats} {getSeatsCount()} / {company?.seats_limit || 0}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario Invitación */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">{t.enterprise.inviteTech}</h3>
          
          {isLimitReached ? (
            <div className="rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-3 text-xs text-yellow-300">
              {t.enterprise.seatsLimitReached}
            </div>
          ) : (
            <form action={inviteTechnicianAction} className="space-y-4">
              <input type="hidden" name="companyId" value={companyId} />
              
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.enterprise.fullName}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej: Pedro Ramos"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.enterprise.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="tecnico@alfa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.enterprise.tempPassword}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
              >
                {t.enterprise.sendInvitation}
              </button>
            </form>
          )}
        </div>

        {/* Tabla Lista Técnicos */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">{t.enterprise.techTeam}</h3>

          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">{t.common.name}</th>
                  <th className="px-6 py-4">{t.common.email}</th>
                  <th className="px-6 py-4">{t.enterprise.certification}</th>
                  <th className="px-6 py-4">{t.common.status}</th>
                  <th className="px-6 py-4">{t.enterprise.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {relations && relations.length > 0 ? (
                  relations.map((relation: any) => {
                    const techUser = relation.user;
                    if (!techUser) return null;
                    const cert = getCertificationLevel(techUser.id);
                    return (
                      <tr key={techUser.id} className="hover:bg-slate-850 transition">
                        <td className="px-6 py-4 font-semibold text-white">
                          <Link href={`/empresa/tecnicos/${techUser.id}`} className="hover:underline text-blue-400">
                            {techUser.full_name || t.common.noName}
                          </Link>
                        </td>
                        <td className="px-6 py-4">{techUser.email}</td>
                        <td className="px-6 py-4">
                          {cert.certified ? `${t.common.level} ${cert.level}` : t.enterprise.uncertified}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                            relation.status === 'active' 
                              ? 'bg-green-950/50 border-green-800 text-green-300' 
                              : 'bg-red-950/50 border-red-800 text-red-300'
                          }`}>
                            {getStatusLabel(relation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <form action={toggleTechnicianStatus}>
                            <input type="hidden" name="companyId" value={companyId} />
                            <input type="hidden" name="userId" value={techUser.id} />
                            <input type="hidden" name="currentStatus" value={relation.status} />
                            <button
                              type="submit"
                              className={`text-xs font-semibold hover:underline ${
                                relation.status === 'active' ? 'text-red-400' : 'text-green-400'
                              }`}
                            >
                              {relation.status === 'active' ? t.enterprise.suspend : t.common.activate}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {t.enterprise.noTechnicians}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
