-- ================================================================================
-- MIGRACIÓN SQL: MÓDULO DE TIPOS DE CABLE Y NÚCLEOS EN SUPABASE
-- Ejecutar este script en el Editor SQL del Dashboard de Supabase (SQL Editor)
-- ================================================================================

-- 1. Tabla de Tipos de Cable (cable_types)
CREATE TABLE IF NOT EXISTS public.cable_types (
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

-- 2. Tabla para Cables Compuestos / Mangueras Banana (composite_cable_bundles)
CREATE TABLE IF NOT EXISTS public.composite_cable_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  composite_cable_type_id UUID REFERENCES public.cable_types(id) ON DELETE CASCADE,
  bundled_cable_type_id UUID REFERENCES public.cable_types(id) ON DELETE CASCADE,
  bundle_jacket_color_name TEXT NOT NULL,
  bundle_jacket_color_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modificación a hardware_components para vincular tipos de cable requeridos
ALTER TABLE public.hardware_components 
ADD COLUMN IF NOT EXISTS required_cable_type_ids TEXT[] DEFAULT '{}';

-- 4. Habilitar RLS y políticas públicas para la biblioteca de cables
ALTER TABLE public.cable_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composite_cable_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de cable_types" ON public.cable_types FOR SELECT USING (true);
CREATE POLICY "Inserción pública de cable_types" ON public.cable_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Edición pública de cable_types" ON public.cable_types FOR UPDATE USING (true);

CREATE POLICY "Lectura pública de composite_cable_bundles" ON public.composite_cable_bundles FOR SELECT USING (true);
CREATE POLICY "Inserción pública de composite_cable_bundles" ON public.composite_cable_bundles FOR INSERT WITH CHECK (true);
