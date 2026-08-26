"use client";

import React, { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Lock, Cpu, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, TerminalType } from '@/types/hardware';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { useI18n } from '@/hooks/useI18n';

function getHandleStyle(type: TerminalType | string) {
  switch (type) {
    case 'positive':
      return { backgroundColor: '#ef4444', borderColor: '#b91c1c' };
    case 'negative':
      return { backgroundColor: '#475569', borderColor: '#0f172a' };
    case 'signal':
      return { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' };
    default:
      return { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' };
  }
}

export function DynamicHardwareNode({ data }: { data: any }) {
  const [component, setComponent] = useState<HardwareComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { nodeColorOverrides } = useSimulatorSandboxStore();
  const { t } = useI18n();

  const isOrphan = data?.isOrphan ?? false;
  const hardwareComponentId = data?.hardware_component_id;
  const nodeId = data?.id;

  // Check color override for this node
  const overrideColor = nodeColorOverrides[nodeId] || 
    (hardwareComponentId ? nodeColorOverrides[hardwareComponentId] : undefined) ||
    (nodeId ? nodeColorOverrides[nodeId.split('-')[0]] : undefined);

  useEffect(() => {
    if (data?.svg_url && data?.terminals) {
      setComponent({
        id: hardwareComponentId || 'temp',
        name: data.name || 'Componente Sandbox',
        brand: data.brand || 'Sandbox',
        category: data.category || 'other',
        svg_url: data.svg_url,
        default_width: data.default_width || 460,
        default_height: data.default_height || 380,
        terminals: data.terminals || [],
        is_active: true
      });
      setLoading(false);
      return;
    }

    if (hardwareComponentId) {
      const supabase = createClient();
      supabase
        .from('sandbox_hardware_components')
        .select('*')
        .eq('id', hardwareComponentId)
        .single()
        .then(({ data: dbComp, error: dbErr }) => {
          if (!dbErr && dbComp && dbComp.is_active) {
            setComponent(dbComp as HardwareComponent);
          } else {
            setError(true);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [hardwareComponentId, data]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-60 h-44 flex flex-col justify-between animate-pulse shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
          <div className="h-3 w-12 bg-slate-800 rounded"></div>
        </div>
        <div className="flex-1 my-2 bg-slate-950/60 rounded-xl flex items-center justify-center">
          <Cpu className="w-8 h-8 text-slate-800 animate-spin" />
        </div>
        <div className="h-3 w-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (error || (!component && !data?.type)) {
    return (
      <div className="bg-slate-950 border-2 border-red-500/50 rounded-2xl p-4 w-60 shadow-2xl text-white space-y-2">
        <div className="flex items-center gap-2 text-red-400 border-b border-red-500/30 pb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Componente Sandbox No Disponible</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          El componente referenciado en sandbox_hardware_components no fue encontrado.
        </p>
      </div>
    );
  }

  const name = component?.name || data?.label || 'Componente Sandbox';
  const brand = component?.brand || 'Sandbox';
  const width = component?.default_width || data?.default_width || 460;
  const height = component?.default_height || data?.default_height || 380;

  const glowStyle = overrideColor ? {
    filter: `drop-shadow(0 0 20px ${overrideColor})`,
  } : undefined;

  return (
    <div 
      style={glowStyle}
      className={`relative transition-all group p-0 m-0 bg-transparent border-0 select-none ${
        overrideColor ? 'ring-4 ring-offset-2 ring-offset-slate-950 scale-105' : ''
      } ${
        isOrphan && !overrideColor ? 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'drop-shadow-2xl'
      }`}
    >
      {/* Tooltip on hover with name and brand */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {name} ({brand}) {overrideColor ? '⚡ [ACCIONADA POR REGLA]' : ''}
      </div>

      {isOrphan && !overrideColor && (
        <span className="absolute -top-3 -right-3 text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md z-40">
          {t.common.pending}
        </span>
      )}

      {/* Caja Transparente idéntica al Editor SVG sin gaps de object-contain */}
      <div 
        className="relative select-none overflow-visible block p-0 m-0 bg-transparent border-0"
        style={{
          width: `${width}px`,
          height: 'auto',
          aspectRatio: `${width}/${height}`,
        }}
      >
        {component?.svg_url ? (
          <img 
            src={component.svg_url} 
            alt={name} 
            className="w-full h-full block p-0 m-0 select-none pointer-events-none" 
          />
        ) : (
          <div className="w-full h-full bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-center">
            <Cpu className="w-16 h-16 text-slate-600" />
          </div>
        )}

        {/* Handles colocados EXACTAMENTE dentro de la caja transparente del SVG */}
        {component?.terminals && component.terminals.length > 0 && (
          <>
            {component.terminals.map((term, index) => {
              let posX = term.x ?? 50;
              let posY = term.y ?? 50;

              // Ajuste fino horizontal (mas anchito) para centrar perfectamente sobre los tornillos laterales
              if (posX > 1.5 && posX < 4.0) {
                posX = 1.0;
              } else if (posX > 96.0 && posX < 98.5) {
                posX = 99.0;
              }

              const isLeft = posX < 50;

              return (
                <Handle
                  key={term.id || index}
                  type="source"
                  position={Position.Top}
                  id={term.id}
                  style={{
                    position: 'absolute',
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#ffffff',
                    borderColor: '#334155',
                    borderWidth: '1px',
                  }}
                  className="!w-2.5 !h-2.5 !rounded-full shadow-sm !z-30 hover:scale-140 transition-all cursor-crosshair group/handle !absolute"
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-5' : 'right-5'} bg-slate-900/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/handle:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow`}>
                    {term.label}
                  </div>
                </Handle>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function PowerSupplyNode({ data }: { data: any }) {
  return (
    <DynamicHardwareNode 
      data={{
        ...data,
        name: data?.name || 'Fuente de Poder 12V/24V',
        brand: data?.brand || 'Genérico',
        svg_url: '/svgs/altronix_al175_v2.svg',
        default_width: 320,
        default_height: 360,
        terminals: data?.terminals || [
          { id: '12v', label: '+12VDC', type: 'positive', x: 82.1, y: 27.7 },
          { id: 'gnd', label: 'GND (-)', type: 'negative', x: 82.1, y: 34.7 },
        ]
      }} 
    />
  );
}

export function ElectricStrikeNode({ data }: { data: any }) {
  return (
    <DynamicHardwareNode 
      data={{
        ...data,
        name: data?.name || 'Cerradero Eléctrico',
        brand: data?.brand || 'Genérico',
        svg_url: '/svgs/hes_5000_v2.svg',
        default_width: 160,
        default_height: 380,
        terminals: data?.terminals || [
          { id: 'pos', label: 'POS(+)', type: 'positive', x: 33.0, y: 66.0 },
          { id: 'neg', label: 'NEG(-)', type: 'negative', x: 33.0, y: 73.5 },
          { id: 'com', label: 'COM', type: 'signal', x: 33.0, y: 81.0 },
        ]
      }} 
    />
  );
}

export function DoorControllerNode({ data }: { data: any }) {
  return (
    <DynamicHardwareNode 
      data={{
        ...data,
        name: data?.name || 'Controladora de Puerta',
        brand: data?.brand || 'Genérico',
        svg_url: '/svgs/accentra_controller_v2.svg',
        default_width: 460,
        default_height: 380,
        terminals: data?.terminals || [
          { id: 'pwr_pos', label: '12-24VDC (+)', type: 'positive', x: 74.0, y: 3.5 },
          { id: 'pwr_neg', label: '12-24VDC (-)', type: 'negative', x: 81.0, y: 3.5 },
          { id: 'r1_pwr', label: 'READER 1 PWR', type: 'positive', x: 2.4, y: 15.8 },
          { id: 'r1_gnd', label: 'READER 1 GND', type: 'negative', x: 2.4, y: 19.7 },
          { id: 'r1_d0', label: 'READER 1 D0', type: 'signal', x: 2.4, y: 23.6 },
          { id: 'r1_d1', label: 'READER 1 D1', type: 'signal', x: 2.4, y: 27.6 },
          { id: 'in1_pos', label: 'IN 1 (+)', type: 'signal', x: 2.4, y: 56.5 },
          { id: 'rel1_no', label: 'RELAY 1 NO', type: 'signal', x: 2.4, y: 75.5 },
          { id: 'rel1_c', label: 'RELAY 1 COM', type: 'signal', x: 2.4, y: 78.9 },
          { id: 'rel1_nc', label: 'RELAY 1 NC', type: 'signal', x: 2.4, y: 82.3 },
          { id: 'r2_pwr', label: 'READER 2 PWR', type: 'positive', x: 97.6, y: 15.8 },
          { id: 'r2_gnd', label: 'READER 2 GND', type: 'negative', x: 97.6, y: 19.7 },
          { id: 'r2_d0', label: 'READER 2 D0', type: 'signal', x: 97.6, y: 23.6 },
          { id: 'r2_d1', label: 'READER 2 D1', type: 'signal', x: 97.6, y: 27.6 },
          { id: 'rel3_no', label: 'RELAY 3 NO', type: 'signal', x: 97.6, y: 75.5 },
          { id: 'rel3_c', label: 'RELAY 3 COM', type: 'signal', x: 97.6, y: 78.9 }
        ]
      }} 
    />
  );
}
