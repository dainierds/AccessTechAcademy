import { createClient } from '@/lib/supabase/client';

export const SEED_CABLE_TYPES = [
  {
    name: '18/2',
    gauge: 18,
    conductor_count: 2,
    is_shielded: false,
    is_composite: false,
    conductors: [
      { position: 1, color_name: 'Red', color_hex: '#dc2626', function: 'positive' },
      { position: 2, color_name: 'Black', color_hex: '#1e1e1e', function: 'negative' }
    ]
  },
  {
    name: '18/4',
    gauge: 18,
    conductor_count: 4,
    is_shielded: false,
    is_composite: false,
    conductors: [
      { position: 1, color_name: 'Red', color_hex: '#dc2626', function: 'positive' },
      { position: 2, color_name: 'Black', color_hex: '#1e1e1e', function: 'negative' },
      { position: 3, color_name: 'Green', color_hex: '#16a34a', function: 'monitor_a' },
      { position: 4, color_name: 'White', color_hex: '#f8fafc', function: 'monitor_b' }
    ]
  },
  {
    name: '22/4',
    gauge: 22,
    conductor_count: 4,
    is_shielded: false,
    is_composite: false,
    conductors: [
      { position: 1, color_name: 'Red', color_hex: '#dc2626', function: 'positive' },
      { position: 2, color_name: 'Black', color_hex: '#1e1e1e', function: 'negative' },
      { position: 3, color_name: 'Yellow', color_hex: '#eab308', function: 'com' },
      { position: 4, color_name: 'Blue', color_hex: '#2563eb', function: 'no' }
    ]
  },
  {
    name: '22/6 Shielded',
    gauge: 22,
    conductor_count: 6,
    is_shielded: true,
    is_composite: false,
    conductors: [
      { position: 1, color_name: 'Red', color_hex: '#dc2626', function: 'positive' },
      { position: 2, color_name: 'Black', color_hex: '#1e1e1e', function: 'negative' },
      { position: 3, color_name: 'Green', color_hex: '#16a34a', function: 'd0' },
      { position: 4, color_name: 'White', color_hex: '#f8fafc', function: 'd1' },
      { position: 5, color_name: 'Orange', color_hex: '#ea580c', function: 'led' },
      { position: 6, color_name: 'Brown', color_hex: '#78350f', function: 'buzzer' }
    ]
  },
  {
    name: 'Banana/Compuesto',
    gauge: 0,
    conductor_count: 0,
    is_shielded: true,
    is_composite: true,
    conductors: []
  }
];

export async function seedCableTypes() {
  const supabase = createClient();

  // Verificar si ya existen cables
  const { data: existing } = await supabase.from('cable_types').select('*');
  if (existing && existing.length > 0) {
    return existing;
  }

  // Insertar cables base
  const { data: insertedCables, error } = await supabase
    .from('cable_types')
    .insert(SEED_CABLE_TYPES)
    .select('*');

  if (error || !insertedCables) {
    console.error('Error seeding cable_types:', error);
    return [];
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

    await supabase.from('composite_cable_bundles').insert(bundles);
  }

  return insertedCables;
}
