"use client";

import React, { useState, useEffect } from 'react';
import { CableType, CompositeCableBundle, CableConductor } from '@/types/cable';
import { createClient } from '@/lib/supabase/client';
import { Shield, Disc, Layers, Check, Zap } from 'lucide-react';
import { seedSandboxCableTypes } from '@/lib/sandboxCableSeed';
import { useI18n } from '@/hooks/useI18n';

interface CablePaletteProps {
  onSelectConductor: (conductorSelection: {
    cableType: CableType;
    conductor: CableConductor;
    bundle?: CompositeCableBundle;
  }) => void;
  selectedConductor?: {
    cableType: CableType;
    conductor: CableConductor;
    bundle?: CompositeCableBundle;
  } | null;
}

// Fallback determinista para garantizar que siempre existan hilos seleccionables para cada tipo de cable
export function getConductorsForCable(cable: CableType): CableConductor[] {
  if (cable.conductors && cable.conductors.length > 0) {
    return cable.conductors;
  }
  const name = cable.name.toLowerCase();
  if (name.includes('18/2')) {
    return [
      { position: 1, color_name: 'Red (Rojo +12V)', color_hex: '#e74c3c', function: 'positive' },
      { position: 2, color_name: 'Black (Negro GND)', color_hex: '#1c2128', function: 'negative' }
    ];
  }
  if (name.includes('18/4') || name.includes('22/4')) {
    return [
      { position: 1, color_name: 'Red (Rojo +12V)', color_hex: '#e74c3c', function: 'positive' },
      { position: 2, color_name: 'Black (Negro GND)', color_hex: '#1c2128', function: 'negative' },
      { position: 3, color_name: 'Green (Verde NO/D0)', color_hex: '#2ecc71', function: 'signal' },
      { position: 4, color_name: 'White (Blanco NC/D1)', color_hex: '#ecf0f1', function: 'signal' }
    ];
  }
  if (name.includes('22/6')) {
    return [
      { position: 1, color_name: 'Red (Rojo PWR)', color_hex: '#e74c3c', function: 'positive' },
      { position: 2, color_name: 'Black (Negro GND)', color_hex: '#1c2128', function: 'negative' },
      { position: 3, color_name: 'Green (Verde D0)', color_hex: '#2ecc71', function: 'signal' },
      { position: 4, color_name: 'White (Blanco D1)', color_hex: '#ecf0f1', function: 'signal' },
      { position: 5, color_name: 'Orange (Naranja LED)', color_hex: '#e67e22', function: 'signal' },
      { position: 6, color_name: 'Yellow (Amarillo BUZZER)', color_hex: '#f1c40f', function: 'signal' }
    ];
  }
  return [
    { position: 1, color_name: 'Red (Rojo)', color_hex: '#e74c3c', function: 'positive' },
    { position: 2, color_name: 'Black (Negro)', color_hex: '#1c2128', function: 'negative' }
  ];
}

export default function CablePalette({ onSelectConductor, selectedConductor }: CablePaletteProps) {
  const supabase = createClient();
  const { t } = useI18n();
  const [cableTypes, setCableTypes] = useState<CableType[]>([]);
  const [compositeBundles, setCompositeBundles] = useState<CompositeCableBundle[]>([]);
  const [selectedCableType, setSelectedCableType] = useState<CableType | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CompositeCableBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCables() {
      setLoading(true);
      let { data } = await supabase.from('sandbox_cable_types').select('*').order('name');

      if (!data || data.length === 0) {
        data = await seedSandboxCableTypes();
      }

      if (data && data.length > 0) {
        setCableTypes(data as CableType[]);
        const defaultCable = (data as CableType[]).find(c => c.name === '18/2') || (data as CableType[])[0];
        if (defaultCable && !selectedCableType) {
          setSelectedCableType(defaultCable);
          const conductors = getConductorsForCable(defaultCable);
          if (conductors.length > 0 && !selectedConductor) {
            onSelectConductor({
              cableType: defaultCable,
              conductor: conductors[0]
            });
          }
        }
      }

      const { data: bundleData } = await supabase
        .from('sandbox_composite_cable_bundles')
        .select(`
          id,
          composite_cable_type_id,
          bundled_cable_type_id,
          bundle_jacket_color_name,
          bundle_jacket_color_hex,
          bundled_cable:sandbox_cable_types!bundled_cable_type_id (*)
        `);

      if (bundleData) {
        setCompositeBundles(bundleData as any[]);
      }

      setLoading(false);
    }

    loadCables();
  }, []);

  const handleSelectType = (cable: CableType) => {
    setSelectedCableType(cable);
    setSelectedBundle(null);

    const conductors = getConductorsForCable(cable);
    if (!cable.is_composite && conductors.length > 0) {
      onSelectConductor({
        cableType: cable,
        conductor: conductors[0]
      });
    }
  };

  const handleSelectBundle = (bundle: CompositeCableBundle) => {
    setSelectedBundle(bundle);
    const bundledCable = bundle.bundled_cable as CableType;
    if (bundledCable) {
      const conductors = getConductorsForCable(bundledCable);
      if (conductors.length > 0) {
        onSelectConductor({
          cableType: bundledCable,
          conductor: conductors[0],
          bundle
        });
      }
    }
  };

  const handleSelectConductor = (conductor: CableConductor) => {
    const activeCableType = selectedBundle 
      ? (selectedBundle.bundled_cable as CableType) 
      : selectedCableType;

    if (activeCableType) {
      onSelectConductor({
        cableType: activeCableType,
        conductor,
        bundle: selectedBundle || undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 animate-pulse">
        {t.sandbox.loadingCables}
      </div>
    );
  }

  const activeCable = selectedBundle 
    ? (selectedBundle.bundled_cable as CableType) 
    : selectedCableType;

  const activeConductors = activeCable ? getConductorsForCable(activeCable) : [];

  const availableBundles = selectedCableType?.is_composite 
    ? compositeBundles.filter(b => b.composite_cable_type_id === selectedCableType.id) 
    : [];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 text-white space-y-3 shadow-2xl backdrop-blur-md">
      
      {/* 1. Selector de Paleta de Cables Disponibles (Top Row) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Disc className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{t.sandbox.cablePaletteTitle}</span>
        </label>
        
        <div className="flex flex-wrap gap-2">
          {cableTypes.map((cable) => {
            const isSelected = selectedCableType?.id === cable.id;
            const conductors = getConductorsForCable(cable);

            return (
              <button
                key={cable.id}
                type="button"
                onClick={() => handleSelectType(cable)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
                  isSelected 
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/50 shadow-indigo-500/20' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {cable.is_composite ? (
                    <div className="flex -space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-900" />
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-slate-900" />
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-900" />
                    </div>
                  ) : (
                    <div className="flex -space-x-1">
                      {conductors.slice(0, 4).map((cond, i) => (
                        <span 
                          key={i} 
                          style={{ backgroundColor: cond.color_hex }}
                          className="w-2.5 h-2.5 rounded-full border border-slate-950 shadow-sm"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <span>{cable.name}</span>
                {cable.is_shielded && (
                  <Shield className="w-3 h-3 text-emerald-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Si es Cable Compuesto (Banana), Selector de Sub-cables por Chaqueta */}
      {selectedCableType?.is_composite && availableBundles.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{t.sandbox.bananaSubcables}</span>
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {availableBundles.map((bundle) => {
              const isBundleSelected = selectedBundle?.id === bundle.id;
              return (
                <button
                  key={bundle.id || bundle.bundle_jacket_color_name}
                  type="button"
                  onClick={() => handleSelectBundle(bundle)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                    isBundleSelected 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/50' 
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      style={{ backgroundColor: bundle.bundle_jacket_color_hex }}
                      className="w-3 h-3 rounded-full border border-slate-900 shadow-sm"
                    />
                    <span className="truncate text-[11px]">{bundle.bundle_jacket_color_name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sub-Barra SELECCIÓN DE CONDUCTOR DE HILO ACTIVO (Rojo, Negro, Blanco, Verde, etc.) */}
      {activeCable && activeConductors.length > 0 && (
        <div className="pt-2.5 border-t border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.sandbox.activeConductor}</span>
            </label>
            <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {activeCable.name} • AWG {activeCable.gauge || 18} ({activeConductors.length} {t.sandbox.threads})
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeConductors.map((cond) => {
              const isConductorSelected = selectedConductor?.conductor.position === cond.position &&
                                           selectedConductor?.cableType.id === activeCable.id;
              return (
                <button
                  key={cond.position}
                  type="button"
                  onClick={() => handleSelectConductor(cond)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${
                    isConductorSelected
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40 shadow-emerald-500/20 scale-105'
                      : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span 
                    style={{ backgroundColor: cond.color_hex }}
                    className="w-3.5 h-3.5 rounded-full border border-slate-950 shadow-sm ring-1 ring-white/20"
                  />
                  <span>{cond.color_name}</span>
                  {isConductorSelected && (
                    <span className="bg-emerald-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ml-1">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
