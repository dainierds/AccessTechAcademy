"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Boxes, 
  Award, 
  Store, 
  DollarSign, 
  FileText, 
  LogOut, 
  Sun, 
  Moon, 
  Bell, 
  Globe, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Menu,
  X,
  Library,
  Cpu
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/hooks/useI18n';

import LogoFull from '@/components/LogoFull';

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  labelEs?: string;
}

interface DashboardSidebarProps {
  roleTitle: string;
  roleBadgeColor: 'purple' | 'emerald' | 'blue';
  navItems: NavItem[];
  userEmail?: string;
  userName?: string;
}

const SIDEBAR_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  '/admin': { en: 'Dashboard', es: 'Dashboard' },
  '/admin/empresas': { en: 'Companies', es: 'Empresas' },
  '/admin/usuarios': { en: 'Users', es: 'Usuarios' },
  '/admin/biblioteca': { en: 'Library', es: 'Biblioteca' },
  '/admin/escenarios': { en: 'Scenarios', es: 'Escenarios' },
  '/admin/certificaciones': { en: 'Certifications', es: 'Certificaciones' },
  '/marketplace': { en: 'Marketplace', es: 'Marketplace' },
  '/simulador': { en: 'Portal', es: 'Portal' },
  '/simulador/certificacion': { en: 'Certifications', es: 'Certificaciones' },
  '/admin/sandbox': { en: 'Sandbox', es: 'Sandbox' },
  '/admin/components': { en: 'Components IA', es: 'Componentes IA' },
  '/creador': { en: 'Dashboard', es: 'Dashboard' },
  '/creador/escenarios': { en: 'Scenarios', es: 'Escenarios' },
  '/creador/marketplace': { en: 'Publish Marketplace', es: 'Publicar Marketplace' },
  '/creador/ventas': { en: 'My Sales', es: 'Mis Ventas' },
  '/empresa': { en: 'Dashboard', es: 'Dashboard' },
  '/empresa/tecnicos': { en: 'Technicians', es: 'Técnicos' },
  '/empresa/escenarios': { en: 'Scenarios', es: 'Escenarios' },
  '/empresa/reporte': { en: 'Risk Report', es: 'Reporte de Riesgo' },
};

export default function DashboardSidebar({
  roleTitle,
  roleBadgeColor,
  navItems,
  userEmail = 'usuario@accesstech.com',
  userName = 'Usuario'
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { lang, toggleLanguage } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'dashboard': return <LayoutDashboard className="w-5 h-5" />;
      case 'building': return <Building2 className="w-5 h-5" />;
      case 'users': return <Users className="w-5 h-5" />;
      case 'library': return <Library className="w-5 h-5" />;
      case 'boxes': return <Boxes className="w-5 h-5" />;
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'award': return <Award className="w-5 h-5" />;
      case 'store': return <Store className="w-5 h-5" />;
      case 'sales': return <DollarSign className="w-5 h-5" />;
      case 'report': return <FileText className="w-5 h-5" />;
      default: return <LayoutDashboard className="w-5 h-5" />;
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('app_theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const badgeColorClasses = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }[roleBadgeColor];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 shadow-xl"
        aria-label="Toggle Menu"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col justify-between flex-shrink-0
        bg-white dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-slate-800/80
        transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header / Logo */}
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <Link href="/" className="flex items-center overflow-hidden">
              <LogoFull size="sm" isDark={darkMode} />
            </Link>
            
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const translatedLabel = SIDEBAR_TRANSLATIONS[item.href] 
                ? (lang === 'en' ? SIDEBAR_TRANSLATIONS[item.href].en : SIDEBAR_TRANSLATIONS[item.href].es)
                : (lang === 'en' ? (item.labelEs ? item.label : item.label) : (item.labelEs || item.label));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-lg shadow-purple-500/25 scale-[1.02]' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }
                    ${collapsed ? 'justify-center px-2' : ''}
                  `}
                  title={collapsed ? translatedLabel : undefined}
                >
                  <div className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {getIcon(item.iconName)}
                  </div>
                  {!collapsed && <span className="truncate">{translatedLabel}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Settings & User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          
          {/* Quick Utility Actions */}
          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : 'justify-between'} px-2`}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title="Cambiar Modo de Color"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors relative"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            </button>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1 font-mono text-xs font-bold"
              title={`Idioma: ${lang.toUpperCase()}`}
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{lang.toUpperCase()}</span>
            </button>
          </div>

          {/* User Profile Info & Sign Out */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden pl-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{userName}</span>
                  <span className="text-[10px] text-slate-400 truncate">{userEmail}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className={`p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ${collapsed ? 'w-full flex justify-center' : ''}`}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
