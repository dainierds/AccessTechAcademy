import { createClient } from '@/lib/supabase/client';
import { SEED_CABLE_TYPES } from '@/lib/cableSeed';

export async function seedSandboxCableTypes() {
  const supabase = createClient();

  try {
    // 1. Verificar si ya existen cables en sandbox_cable_types
    const { data: existing } = await supabase.from('sandbox_cable_types').select('*');
    if (existing && existing.length > 0) {
      return existing;
    }

    // 2. Insertar cables base en sandbox_cable_types
    const { data: insertedCables, error } = await supabase
      .from('sandbox_cable_types')
      .insert(SEED_CABLE_TYPES)
      .select('*');

    if (error || !insertedCables) {
      // Fallback local en memoria si la tabla de Supabase no ha sido migrada aún
      return SEED_CABLE_TYPES.map((c, idx) => ({ ...c, id: `sandbox-local-${idx+1}`, created_at: new Date().toISOString() }));
    }

    const cableMap = new Map(insertedCables.map((c: any) => [c.name, c.id]));
    const bananaId = cableMap.get('Banana/Compuesto');

    if (bananaId) {
      const bundles = [
        {
          composite_cable_type_id: bananaId,
          bundled_cable_type_id: cableMap.get('18/2'),
          bundle_jacket_color_name: 'Gris (Poder)',
          bundle_jacket_color_hex: '#64748b'
        },
        {
          composite_cable_type_id: bananaId,
          bundled_cable_type_id: cableMap.get('22/6 Shielded'),
          bundle_jacket_color_name: 'Naranja (Lector)',
          bundle_jacket_color_hex: '#f97316'
        },
        {
          composite_cable_type_id: bananaId,
          bundled_cable_type_id: cableMap.get('18/4'),
          bundle_jacket_color_name: 'Blanco (Contacto)',
          bundle_jacket_color_hex: '#f8fafc'
        },
        {
          composite_cable_type_id: bananaId,
          bundled_cable_type_id: cableMap.get('22/4'),
          bundle_jacket_color_name: 'Azul (REX)',
          bundle_jacket_color_hex: '#3b82f6'
        }
      ].filter(b => b.bundled_cable_type_id);

      await supabase.from('sandbox_composite_cable_bundles').insert(bundles);
    }

    return insertedCables;
  } catch (err) {
    return SEED_CABLE_TYPES.map((c, idx) => ({ ...c, id: `sandbox-local-${idx+1}`, created_at: new Date().toISOString() }));
  }
}
