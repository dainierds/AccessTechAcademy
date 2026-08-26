'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Aprueba una solicitud de acceso: crea el usuario en Supabase Auth y le
 * envía por email un enlace para establecer sus credenciales.
 */
export async function approveAccessRequestAction(formData: FormData) {
  const id = formData.get('id') as string;
  const email = formData.get('email') as string;
  const fullName = formData.get('fullName') as string;

  if (!id || !email) {
    throw new Error('Datos de la solicitud incompletos.');
  }

  const supabase = createAdminClient();

  // Crear el usuario mediante invitación: Supabase envía automáticamente
  // el email con el enlace para definir la contraseña.
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName || '',
      role: 'technician',
    },
    redirectTo: `${APP_URL}/login`,
  });

  if (inviteError) {
    throw new Error(`No se pudo invitar al usuario: ${inviteError.message}`);
  }

  const { error: updateError } = await supabase
    .from('access_requests')
    .update({ status: 'approved' })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Error al actualizar la solicitud: ${updateError.message}`);
  }

  revalidatePath('/admin/solicitudes');
}

/**
 * Rechaza una solicitud de acceso.
 */
export async function rejectAccessRequestAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) throw new Error('Solicitud no válida.');

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('access_requests')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) {
    throw new Error(`Error al rechazar la solicitud: ${error.message}`);
  }

  revalidatePath('/admin/solicitudes');
}
