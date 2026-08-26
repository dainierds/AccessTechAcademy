import DashboardSidebar, { NavItem } from '@/components/simulator/DashboardSidebar';
import SessionTimeoutManager from '@/components/simulator/SessionTimeoutManager';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { translations, getLanguage } from '@/lib/i18n';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', iconName: 'dashboard' },
  { label: 'Empresas', href: '/admin/empresas', iconName: 'building' },
  { label: 'Usuarios', href: '/admin/usuarios', iconName: 'users' },
  { label: 'Solicitudes', href: '/admin/solicitudes', iconName: 'users' },
  { label: 'Biblioteca', href: '/admin/biblioteca', iconName: 'library' },
  { label: 'Escenarios', href: '/admin/escenarios', iconName: 'boxes' },
  { label: 'Certificaciones', href: '/admin/certificaciones', iconName: 'award' },
  { label: 'Marketplace', href: '/marketplace', iconName: 'store' },
  { label: 'Componentes IA', href: '/admin/components', iconName: 'cpu' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const t = translations[getLanguage(cookieStore.get('app_lang')?.value)];
  
  // Verificación estricta de seguridad server-side
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ecf0f1] dark:bg-[#1a1a1a] p-6 font-sans">
        <div className="text-center p-8 border border-red-500/20 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-2">{t.accessDenied.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.accessDenied.adminOnly}</p>
          <a href="/login" className="mt-4 inline-block bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition">
            {t.common.backToHome}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#ecf0f1] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <DashboardSidebar 
        roleTitle="Super Admin" 
        roleBadgeColor="purple" 
        navItems={navItems}
        userEmail={user.email || 'admin@accesstech.com'}
        userName={profile?.full_name || 'Administrator'}
      />

      {/* Área de contenido principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-8">
        {children}
      </main>
      <SessionTimeoutManager />
    </div>
  );
}
