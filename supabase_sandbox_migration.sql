-- ================================================================================
-- MIGRACIÓN SQL: ENTORNO DE EXPERIMENTACIÓN Y SANDBOX PARA SIMULADOR
-- ================================================================================

-- 1. Tabla sandbox_hardware_components
CREATE TABLE IF NOT EXISTS public.sandbox_hardware_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  svg_url TEXT,
  default_width INT DEFAULT 180,
  default_height INT DEFAULT 180,
  terminals JSONB DEFAULT '[]'::jsonb,
  required_cable_type_ids TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla sandbox_cable_types
CREATE TABLE IF NOT EXISTS public.sandbox_cable_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gauge INT NOT NULL DEFAULT 18,
  conductor_count INT NOT NULL DEFAULT 2,
  is_shielded BOOLEAN NOT NULL DEFAULT FALSE,
  is_composite BOOLEAN NOT NULL DEFAULT FALSE,
  conductors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla sandbox_composite_cable_bundles
CREATE TABLE IF NOT EXISTS public.sandbox_composite_cable_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  composite_cable_type_id UUID REFERENCES public.sandbox_cable_types(id) ON DELETE CASCADE,
  bundled_cable_type_id UUID REFERENCES public.sandbox_cable_types(id) ON DELETE CASCADE,
  bundle_jacket_color_name TEXT NOT NULL,
  bundle_jacket_color_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla sandbox_scenarios
CREATE TABLE IF NOT EXISTS public.sandbox_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level INT DEFAULT 1,
  type TEXT DEFAULT 'guided',
  hardware_config JSONB DEFAULT '[]'::jsonb,
  correct_wiring JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS restringido exclusivamente para super_admin
ALTER TABLE public.sandbox_hardware_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_cable_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_composite_cable_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin Sandbox Access sandbox_hardware_components" ON public.sandbox_hardware_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin Sandbox Access sandbox_cable_types" ON public.sandbox_cable_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin Sandbox Access sandbox_composite_cable_bundles" ON public.sandbox_composite_cable_bundles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin Sandbox Access sandbox_scenarios" ON public.sandbox_scenarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- 6. Bucket de Storage 'sandbox-hardware-components'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sandbox-hardware-components', 'sandbox-hardware-components', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "SuperAdmin Storage Access sandbox-hardware-components" ON storage.objects
  FOR ALL USING (
    bucket_id = 'sandbox-hardware-components' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );
