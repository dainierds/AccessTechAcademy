import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PRESET_SANDBOX_COMPONENTS, HardwareComponent } from '@/types/hardware';

export async function GET() {
  try {
    const supabase = await createClient();
    let allComps: HardwareComponent[] = [];

    // 1. Cargar desde sandbox_hardware_components
    try {
      const { data: sData } = await supabase
        .from('sandbox_hardware_components')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (sData && sData.length > 0) {
        allComps = [...allComps, ...(sData as HardwareComponent[])];
      }
    } catch (e) {}

    // 2. Cargar desde hardware_components
    try {
      const { data: hData } = await supabase
        .from('hardware_components')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (hData && hData.length > 0) {
        allComps = [...allComps, ...(hData as HardwareComponent[])];
      }
    } catch (e) {}

    // 3. Fusionar con PRESET_SANDBOX_COMPONENTS evitando duplicados
    for (const preset of PRESET_SANDBOX_COMPONENTS) {
      if (!allComps.some(c => c.name === preset.name && c.brand === preset.brand)) {
        allComps.push(preset);
      }
    }

    return NextResponse.json({ success: true, components: allComps });
  } catch (err: any) {
    console.error('Error fetching components:', err);
    return NextResponse.json({ success: true, components: PRESET_SANDBOX_COMPONENTS });
  }
}
