import DashboardSidebar, { NavItem } from '@/components/simulator/DashboardSidebar';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const navItems: NavItem[] = [
  { label: 'Portal', href: '/simulador', iconName: 'dashboard' },
  { label: 'Certificaciones', href: '/simulador/certificacion', iconName: 'award' },
  { label: 'Marketplace', href: '/marketplace', iconName: 'store' },
];

export default async function SimulatorLayout({
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

  return (
    <div className="flex min-h-screen bg-[#ecf0f1] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <DashboardSidebar 
        roleTitle="Technician" 
        roleBadgeColor="blue" 
        navItems={navItems}
        userEmail={user.email || 'technician@accesstech.com'}
        userName={profile?.full_name || 'Técnico'}
      />

      {/* Área de contenido principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
