"use client";

import React from 'react';
import Link from 'next/link';
import { Boxes, Plus, ExternalLink, Edit3, Calendar } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

export default function AdminScenariosClient({
  scenarios,
}: {
  scenarios: any[];
}) {
  const [lang, setLang] = React.useState<Language>('en');

  React.useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang);
    }

    const handleLangChange = () => {
      const current = localStorage.getItem('app_lang') as Language;
      if (current === 'en' || current === 'es') {
        setLang(current);
      }
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang].dashboard;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Gradient Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.scenariosTitle}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t.scenariosSubtitle}
          </p>
        </div>

        <Link
          href="/admin/escenarios/nuevo"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createScenario}</span>
        </Link>
      </div>

      {/* Styled Table Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.titleCol}</th>
                <th className="px-6 py-4">{t.typeCol}</th>
                <th className="px-6 py-4">{t.difficultyCol}</th>
                <th className="px-6 py-4">{t.statusCol}</th>
                <th className="px-6 py-4">{t.creationDateCol}</th>
                <th className="px-6 py-4 text-right">{t.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {scenarios && scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{scenario.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {scenario.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {scenario.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Level' : 'Nivel'} {scenario.difficulty_level}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        scenario.is_published 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {scenario.is_published ? t.published : t.draft}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(scenario.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/escenarios/${scenario.id}/editar`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t.edit}</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <Link
                          href={`/simulador/${scenario.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t.test}</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No scenarios registered.
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
