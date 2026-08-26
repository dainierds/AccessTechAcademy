"use client";

import React, { useState } from 'react';
import { Inbox, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { approveAccessRequestAction, rejectAccessRequestAction } from './actions';
import { useI18n } from '@/hooks/useI18n';

export default function SolicitudesClient({ requests }: { requests: any[] }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === 'pending');
  const processed = requests.filter((r) => r.status !== 'pending');

  const runAction = async (formData: FormData, action: (fd: FormData) => Promise<void>) => {
    setError(null);
    try {
      await action(formData);
    } catch (e: any) {
      setError(e?.message || t.creator.saveError);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Inbox className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>{t.admin.accessRequests}</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          {t.admin.accessRequestsDesc}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Solicitudes pendientes */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.admin.pendingRequests} ({pending.length})
          </h3>
        </div>

        {pending.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
            {t.admin.noRequests}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.common.name}</th>
                <th className="px-6 py-4">{t.common.email}</th>
                <th className="px-6 py-4">{t.admin.company}</th>
                <th className="px-6 py-4">{t.common.date}</th>
                <th className="px-6 py-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {pending.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{r.full_name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.email}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.company_name || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={async (fd) => {
                          await runAction(fd, approveAccessRequestAction);
                        }}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="email" value={r.email} />
                        <input type="hidden" name="fullName" value={r.full_name} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {t.common.approve}
                        </button>
                      </form>
                      <form action={rejectAccessRequestAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t.common.reject}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historial procesado */}
      {processed.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.admin.processedRequests}</h3>
          </div>
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">{t.common.name}</th>
                <th className="px-6 py-4">{t.common.email}</th>
                <th className="px-6 py-4">{t.common.status}</th>
                <th className="px-6 py-4">{t.common.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {processed.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{r.full_name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      r.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}>
                      {r.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {r.status === 'approved' ? t.admin.approved : t.admin.rejected}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
