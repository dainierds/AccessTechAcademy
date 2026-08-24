"use client";

import Link from 'next/link';
import { Award, Plus, Clock, CheckCircle2, Edit3, Calendar } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function AdminCertificationsClient({
  levels,
}: {
  levels: any[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Gradient Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.dashboard.certificationsTitle}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.certificationsSubtitle}
          </p>
        </div>

        <Link
          href="/admin/certificaciones/nuevo"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>{t.dashboard.createLevel}</span>
        </Link>
      </div>

      {/* Styled Table Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.dashboard.levelCol}</th>
                <th className="px-6 py-4">{t.dashboard.examTitleCol}</th>
                <th className="px-6 py-4">{t.dashboard.timeLimitCol}</th>
                <th className="px-6 py-4">{t.dashboard.passingReqCol}</th>
                <th className="px-6 py-4">{t.dashboard.creationDateCol}</th>
                <th className="px-6 py-4 text-right">{t.dashboard.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {levels && levels.length > 0 ? (
                levels.map((lvl) => (
                  <tr key={lvl.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {t.common.level} {lvl.level_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{lvl.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lvl.time_limit_minutes} {t.dashboard.minutes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lvl.passing_score_percent}% {t.dashboard.minScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(lvl.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/certificaciones/${lvl.id}/editar`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.dashboard.edit}</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {t.admin.noCertLevels}
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
