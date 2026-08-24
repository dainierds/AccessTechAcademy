"use client";

import Link from 'next/link';
import { Building2, Plus, Users, Calendar, ArrowRight } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function CompaniesListClient({
  companies,
  profiles,
}: {
  companies: any[];
  profiles: any[];
}) {
  const { t } = useI18n();

  const getSeatsUsed = (companyId: string) => {
    if (!profiles) return 0;
    return profiles.filter((p) => p.company_id === companyId).length;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Gradient Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboard.companiesTitle}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.companiesSubtitle}
          </p>
        </div>

        <Link
          href="/admin/empresas/nueva"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>{t.dashboard.newCompany}</span>
        </Link>
      </div>

      {/* Styled Table Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.dashboard.companyCol}</th>
                <th className="px-6 py-4">{t.dashboard.currentPlanCol}</th>
                <th className="px-6 py-4">{t.dashboard.seatsUsedCol}</th>
                <th className="px-6 py-4">{t.dashboard.creationDateCol}</th>
                <th className="px-6 py-4 text-right">{t.dashboard.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {companies && companies.length > 0 ? (
                companies.map((company) => {
                  const seatsUsed = getSeatsUsed(company.id);
                  const isFull = seatsUsed >= company.seats_limit;
                  return (
                    <tr key={company.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{company.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {company.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {company.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className={`text-sm font-bold ${isFull ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {seatsUsed} / {company.seats_limit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(company.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/empresas/${company.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                        >
                          <span>{t.dashboard.manage}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    {t.dashboard.noCompanies}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
