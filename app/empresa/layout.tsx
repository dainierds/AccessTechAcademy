import DashboardSidebar, { NavItem } from '@/components/simulator/DashboardSidebar';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/empresa', iconName: 'dashboard' },
  { label: 'Técnicos', href: '/empresa/tecnicos', iconName: 'users' },
  { label: 'Escenarios', href: '/empresa/escenarios', iconName: 'boxes' },
  { label: 'Reporte de Riesgo', href: '/empresa/reporte', iconName: 'report' },
];

export default async function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
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

  if (profile?.role !== 'company_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ecf0f1] dark:bg-[#1a1a1a] p-6 font-sans">
        <div className="text-center p-8 border border-red-500/20 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Esta sección es exclusiva para administradores de empresas.</p>
          <a href="/login" className="mt-4 inline-block bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#ecf0f1] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <DashboardSidebar 
        roleTitle="Empresa" 
        roleBadgeColor="blue" 
        navItems={navItems}
        userEmail={user.email || 'empresa@accesstech.com'}
        userName={profile?.full_name || 'Admin Empresa'}
      />

      {/* Área de contenido principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
