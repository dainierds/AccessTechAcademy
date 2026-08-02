"use client";

import React, { useState, useEffect } from 'react';
import { CableType, CompositeCableBundle, CableConductor } from '@/types/cable';
import { createClient } from '@/lib/supabase/client';
import { seedCableTypes } from '@/lib/cableSeed';
import { Shield, Disc, Layers, ChevronRight, Check } from 'lucide-react';

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

export default function CablePalette({ onSelectConductor, selectedConductor }: CablePaletteProps) {
  const supabase = createClient();
  const [cableTypes, setCableTypes] = useState<CableType[]>([]);
  const [compositeBundles, setCompositeBundles] = useState<CompositeCableBundle[]>([]);
  const [selectedCableType, setSelectedCableType] = useState<CableType | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CompositeCableBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCables() {
      setLoading(true);
      // Cargar o sembrar los cable_types
      let { data, error } = await supabase.from('cable_types').select('*').order('name');
      
      if (!data || data.length === 0) {
        data = await seedCableTypes();
      }

      if (data) {
        setCableTypes(data as CableType[]);
        // Seleccionar 18/2 por defecto si no hay uno activo
        const default182 = (data as CableType[]).find(c => c.name === '18/2') || data[0];
        if (default182 && !selectedCableType) {
          setSelectedCableType(default182);
          if (default182.conductors && default182.conductors.length > 0 && !selectedConductor) {
            onSelectConductor({
              cableType: default182,
              conductor: default182.conductors[0]
            });
          }
        }
      }

      // Cargar bundles de cable compuesto (banana)
      const { data: bundleData } = await supabase
        .from('composite_cable_bundles')
        .select(`
          id,
          composite_cable_type_id,
          bundled_cable_type_id,
          bundle_jacket_color_name,
          bundle_jacket_color_hex,
          bundled_cable:cable_types!bundled_cable_type_id (*)
        `);

      if (bundleData) {
        setCompositeBundles(bundleData as any);
      }

      setLoading(false);
    }

    loadCables();
  }, []);

  const handleSelectType = (cable: CableType) => {
    setSelectedCableType(cable);
    setSelectedBundle(null);

    if (!cable.is_composite && cable.conductors && cable.conductors.length > 0) {
      onSelectConductor({
        cableType: cable,
        conductor: cable.conductors[0]
      });
    }
  };

  const handleSelectBundle = (bundle: CompositeCableBundle) => {
    setSelectedBundle(bundle);
    const subCable = bundle.bundled_cable;
    if (subCable && subCable.conductors && subCable.conductors.length > 0) {
      onSelectConductor({
        cableType: subCable,
        conductor: subCable.conductors[0],
        bundle
      });
    }
  };

  const handleSelectConductor = (conductor: CableConductor) => {
    if (!selectedCableType) return;
    const targetCable = selectedBundle?.bundled_cable || selectedCableType;

    onSelectConductor({
      cableType: targetCable,
      conductor,
      bundle: selectedBundle || undefined
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 font-mono animate-pulse">
        Cargando paleta de cables...
      </div>
    );
  }

  const currentCable = selectedBundle?.bundled_cable || selectedCableType;
  const availableBundles = selectedCableType?.is_composite 
    ? compositeBundles.filter(b => b.composite_cable_type_id === selectedCableType.id)
    : [];

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white space-y-3 shadow-xl backdrop-blur-md">
      
      {/* 1. Selector de Tipo de Cable Principal */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Disc className="w-3.5 h-3.5 text-indigo-500" />
          <span>Paleta de Cables Disponibles</span>
        </label>
        
        <div className="flex flex-wrap gap-2">
          {cableTypes.map((cable) => {
            const isSelected = selectedCableType?.id === cable.id;
            return (
              <button
                key={cable.id}
                type="button"
                onClick={() => handleSelectType(cable)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30' 
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {cable.is_composite ? (
                    <div className="flex -space-x-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 border border-slate-900" />
                      <span className="w-2 h-2 rounded-full bg-orange-500 border border-slate-900" />
                      <span className="w-2 h-2 rounded-full bg-blue-500 border border-slate-900" />
                    </div>
                  ) : (
                    <div className="flex -space-x-0.5">
                      {cable.conductors.slice(0, 3).map((cond, i) => (
                        <span 
                          key={i} 
                          style={{ backgroundColor: cond.color_hex }}
                          className="w-2 h-2 rounded-full border border-slate-200 dark:border-slate-800"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <span>{cable.name}</span>
                {cable.is_shielded && (
                  <Shield className="w-3 h-3 text-emerald-500 dark:text-emerald-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Si es Cable Compuesto (Banana), Selector de Sub-cables por Jacket Color */}
      {selectedCableType?.is_composite && availableBundles.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 animate-fadeIn">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Sub-cables del Bundle Banana (Chaqueta)</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {availableBundles.map((bundle) => {
              const isBundleSelected = selectedBundle?.id === bundle.id;
              return (
                <button
                  key={bundle.id || bundle.bundle_jacket_color_name}
                  type="button"
                  onClick={() => handleSelectBundle(bundle)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                    isBundleSelected 
                      ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200' 
                      : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      style={{ backgroundColor: bundle.bundle_jacket_color_hex }}
                      className="w-3 h-3 rounded-full border border-slate-900 shadow-sm"
                    />
                    <span className="truncate">{bundle.bundle_jacket_color_name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Selector de Conductor Individual (Color de Hilo para la conexión) */}
      {currentCable && currentCable.conductors && currentCable.conductors.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 animate-fadeIn">
          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Conductor de Hilo Activo</span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">AWG {currentCable.gauge} ({currentCable.conductors.length} hilos)</span>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {currentCable.conductors.map((cond) => {
              const isConductorSelected = selectedConductor?.conductor.position === cond.position &&
                                           selectedConductor?.cableType.id === currentCable.id;
              return (
                <button
                  key={cond.position}
                  type="button"
                  onClick={() => handleSelectConductor(cond)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    isConductorSelected
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <span 
                    style={{ backgroundColor: cond.color_hex }}
                    className="w-2.5 h-2.5 rounded-full border border-slate-950 shadow-sm"
                  />
                  <span>{cond.color_name}</span>
                  {isConductorSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
