"use client";

import React from 'react';
import { 
  Users, 
  UserCheck, 
  Building, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  PlusCircle, 
  Bell, 
  BarChart3, 
  Database, 
  Mail, 
  HardDrive, 
  ShieldCheck,
  ArrowUpRight,
  Clock
} from 'lucide-react';

import { Language, translations } from '@/lib/i18n';

interface EnterpriseDashboardViewProps {
  title: string;
  subtitle: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    categoriesOrBrands: number;
    progressPercentage: number;
  };
  recentUsers?: Array<{
    id: string;
    name: string;
    email: string;
    status: 'active' | 'pending' | 'inactive';
    date: string;
  }>;
  pendingRequests?: Array<{
    id: string;
    title: string;
    requester: string;
    type: string;
    date: string;
  }>;
}

export default function EnterpriseDashboardView({
  title,
  subtitle,
  metrics,
  recentUsers = [
    { id: '1', name: 'Carlos Mendoza', email: 'carlos@techaccess.com', status: 'active', date: 'Hace 10 min' },
    { id: '2', name: 'Laura Gómez', email: 'laura@securitycorp.es', status: 'active', date: 'Hace 35 min' },
    { id: '3', name: 'Andrés Ramos', email: 'aramos@pacsinstallers.net', status: 'pending', date: 'Hace 2 horas' },
    { id: '4', name: 'Mariana Silva', email: 'msilva@accesssolutions.io', status: 'active', date: 'Hace 5 horas' },
  ],
  pendingRequests = [
    { id: '101', title: 'Solicitud de Asiento Empresa - Securitas', requester: 'Roberto Fernández', type: 'Asiento', date: 'Hoy' },
    { id: '102', title: 'Aprobación Escenario de Cableado PACS #42', requester: 'Dev Team', type: 'Escenario', date: 'Ayer' },
    { id: '103', title: 'Emisión de Certificado Técnico Nivel 2', requester: 'Elena Rostova', type: 'Certificación', date: 'Ayer' },
  ]
}: EnterpriseDashboardViewProps) {
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
      {/* 🎨 Header Gradient */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.lastSync}</span>
          </div>
        </div>
      </div>

      {/* 📊 Key Metrics Grid (4 columns) with distinct 4px colored left accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Primary Accent */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border-l-4 border-l-indigo-600 border-t border-r border-b border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.totalUsers}</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{metrics.totalUsers}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              +12.5% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Emerald Accent */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border-l-4 border-l-emerald-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.activeUsers}</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{metrics.activeUsers}</span>
            <span className="text-xs font-semibold text-slate-400">{t.activePercent}</span>
          </div>
        </div>

        {/* Card 3: Amber Accent */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.categoriesBrands}</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{metrics.categoriesOrBrands}</span>
            <span className="text-xs font-semibold text-slate-400">{t.integrated}</span>
          </div>
        </div>

        {/* Card 4: Purple Accent */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border-l-4 border-l-purple-600 border-t border-r border-b border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.activityRate}</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{metrics.progressPercentage}%</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{t.excellent}</span>
          </div>
        </div>

      </div>

      {/* ⚡ Quick Actions Bar */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          
          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-200 group">
            <div className="p-3 rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5">{t.addUser}</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-200 group">
            <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5">{t.newScenario}</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all duration-200 group">
            <div className="p-3 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5">{t.notification}</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-200 dark:hover:border-amber-800/50 transition-all duration-200 group">
            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5">{t.viewReports}</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-200 dark:hover:border-cyan-800/50 transition-all duration-200 group col-span-2 sm:col-span-1">
            <div className="p-3 rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5">{t.syncDb}</span>
          </button>

        </div>
      </div>

      {/* 📋 Data Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Activity / Users List */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.recentUsersTitle}</h3>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">{t.viewAll}</span>
            </div>

            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      user.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {user.status === 'active' ? (lang === 'en' ? 'Active' : 'Activo') : (lang === 'en' ? 'Pending' : 'Pendiente')}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">{user.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Requests / Pending Items */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.pendingRequestsTitle}</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {pendingRequests.length} {t.required}
              </span>
            </div>

            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? 'Requested by:' : 'Solicitado por:'} <span className="font-semibold text-slate-600 dark:text-slate-300">{req.requester}</span></p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {req.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'en' ? 'Approve' : 'Aprobar'}
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> {lang === 'en' ? 'Reject' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 🛠️ System Status Bar (4 Cards Operational Indicators) */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-800/60">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          {t.systemInfrastructure}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.database}</p>
                <p className="text-[10px] text-slate-400">PostgreSQL (Supabase)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {t.operational}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.emailServer}</p>
                <p className="text-[10px] text-slate-400">SMTP Auth</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {t.operational}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.storage}</p>
                <p className="text-[10px] text-slate-400">CDN Storage</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {t.operational}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.securitySsl}</p>
                <p className="text-[10px] text-slate-400">{lang === 'en' ? '256-bit Encryption' : 'Encriptación 256-bit'}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {t.protected}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
