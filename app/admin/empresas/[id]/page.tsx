import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateCompanyDetails } from './actions';
import { ArrowLeft, Save, Building2, Users, Calendar, ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  // 1. Cargar datos de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (!company) {
    notFound();
  }

  // 2. Cargar técnicos asociados a la empresa
  const { data: relations } = await supabase
    .from('company_technicians')
    .select(`
      status,
      invited_at,
      user:profiles (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('company_id', id);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Link href="/admin/empresas" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.admin.backToCompanies}</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {company.name}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Detalles de suscripción y lista de técnicos activos.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>ID: {company.id.substring(0, 8)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Panel de administración del plan */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md space-y-6 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.admin.planAndLimits}</h3>
          </div>
          
          <form action={updateCompanyDetails} className="space-y-4">
            <input type="hidden" name="companyId" value={company.id} />
            
            <div>
              <label htmlFor="plan" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.admin.subscriptionPlan}
              </label>
              <select
                id="plan"
                name="plan"
                defaultValue={company.plan}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
              >
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="seats_limit" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.admin.seatsLimitTechs}
              </label>
              <input
                id="seats_limit"
                name="seats_limit"
                type="number"
                defaultValue={company.seats_limit}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{t.admin.saveChanges}</span>
            </button>
          </form>
        </div>

        {/* Tabla de técnicos de la empresa */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.admin.assignedTechnicians}</h3>
          </div>
          
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">{t.common.name}</th>
                    <th className="px-6 py-4">{t.common.email}</th>
                    <th className="px-6 py-4">{t.admin.role}</th>
                    <th className="px-6 py-4">{t.common.status}</th>
                    <th className="px-6 py-4">{t.admin.invitationDate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {relations && relations.length > 0 ? (
                    relations.map((relation: any) => (
                      <tr key={relation.user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{relation.user.full_name || t.common.noName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{relation.user.email}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-xs font-semibold text-slate-500 dark:text-slate-400">{relation.user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            relation.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : relation.status === 'suspended'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {relation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(relation.invited_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        {t.admin.noTechniciansCompany}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
