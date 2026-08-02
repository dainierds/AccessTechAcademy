"use client";

import React, { useState } from 'react';
import { updateUserRoleAction } from './actions';
import CreateUserModal from '@/components/admin/CreateUserModal';
import { Users, Shield, Building2, UserPlus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Language, translations } from '@/lib/i18n';

export default function UsersManagementClient({
  initialProfiles,
  companies,
}: {
  initialProfiles: any[];
  companies: any[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

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

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Gradient Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.usersTitle}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {t.usersSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Total: {initialProfiles?.length || 0} {t.userCol}s</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.newUser}</span>
          </button>
        </div>
      </div>

      {/* Styled Table Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.userCol}</th>
                <th className="px-6 py-4">{t.emailCol}</th>
                <th className="px-6 py-4">{t.globalRoleCol}</th>
                <th className="px-6 py-4">{t.companyAssignedCol}</th>
                <th className="px-6 py-4 text-right">{t.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {initialProfiles && initialProfiles.length > 0 ? (
                initialProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{profile.full_name || 'Sin nombre'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {profile.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{profile.email}</td>
                    
                    {/* Inline update form */}
                    <td colSpan={3} className="px-6 py-4">
                      <form action={updateUserRoleAction} className="flex items-center justify-end gap-3">
                        <input type="hidden" name="userId" value={profile.id} />
                        
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            name="role"
                            defaultValue={profile.role}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="company_admin">Company Admin</option>
                            <option value="creator">Creator</option>
                            <option value="technician">Technician</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            name="companyId"
                            defaultValue={profile.company_id || 'none'}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white text-xs font-semibold max-w-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="none">Sin Empresa</option>
                            {companies && companies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No hay perfiles registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear nuevo usuario */}
      {isModalOpen && (
        <CreateUserModal
          companies={companies || []}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
