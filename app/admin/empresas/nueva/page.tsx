import Link from 'next/link';
import { createCompanyAction } from '../actions';
import { ArrowLeft, Building2, UserPlus, Save } from 'lucide-react';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

export default async function NewCompanyPage() {
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <Link href="/admin/empresas" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.admin.backToCompanies}</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.admin.newClientCompany}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Registra una empresa cliente e inicializa su cuenta de usuario administrador.
        </p>
      </div>

      <form action={createCompanyAction} className="space-y-6 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-8 rounded-xl shadow-md">
        {/* Datos de la empresa */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.admin.corporateData}</h3>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.admin.companyName}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Seguridad Alfa S.A."
            />
          </div>

          {/* Plan y asientos autogenerados por Stripe (Trial por defecto) */}
          <input type="hidden" name="plan" value="trial" />
          <input type="hidden" name="seats_limit" value="5" />
        </div>

        {/* Administrador */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <UserPlus className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.admin.companyAdmin}</h3>
          </div>

          <div>
            <label htmlFor="adminFullName" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.login.fullName}
            </label>
            <input
              id="adminFullName"
              name="adminFullName"
              type="text"
              required
              className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Carlos Mendoza"
            />
          </div>

          <div>
            <label htmlFor="adminEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.admin.adminEmail}
            </label>
            <input
              id="adminEmail"
              name="adminEmail"
              type="email"
              required
              className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="carlos@alfa.com"
            />
          </div>

          <div>
            <label htmlFor="adminPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.enterprise.tempPassword}
            </label>
            <input
              id="adminPassword"
              name="adminPassword"
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <Link
            href="/admin/empresas"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {t.common.cancel}
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            <span>{t.admin.createCompanyAndAdmin}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
