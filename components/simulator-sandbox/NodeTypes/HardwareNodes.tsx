"use client";

import React, { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Lock, Cpu, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, TerminalType } from '@/types/hardware';

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

  const isOrphan = data?.isOrphan ?? false;
  const hardwareComponentId = data?.hardware_component_id;

  useEffect(() => {
    if (data?.svg_url && data?.terminals) {
      setComponent({
        id: hardwareComponentId || 'temp',
        name: data.name || 'Componente Sandbox',
        brand: data.brand || 'Sandbox',
        category: data.category || 'other',
        svg_url: data.svg_url,
        default_width: data.default_width || 240,
        default_height: data.default_height || 200,
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

  return (
    <div className={`relative transition-all group ${
      isOrphan ? 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'drop-shadow-xl'
    }`}>
      {/* Tooltip on hover with name and brand */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {name} ({brand})
      </div>

      {isOrphan && (
        <span className="absolute -top-3 -right-3 text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md z-40">
          Pendiente
        </span>
      )}

      {/* The SVG Image standardized to a fixed uniform size */}
      {component?.svg_url ? (
        <div className="w-[280px] h-[360px] relative flex items-center justify-center">
          <img 
            src={component.svg_url} 
            alt={name} 
            className="w-full h-full object-contain pointer-events-none" 
          />
        </div>
      ) : (
        <div className="bg-slate-800/80 border border-slate-700 w-[280px] h-[360px] rounded-xl flex items-center justify-center">
          <Cpu className="w-16 h-16 text-slate-600" />
        </div>
      )}

      {/* Handles overlaid exactly on the SVG points */}
      {component?.terminals && component.terminals.length > 0 && (
        <>
          {component.terminals.map((term, index) => {
            const handleStyle = getHandleStyle(term.type);
            // Si tiene x/y es porcentaje (nuevo formato), sino tratamos position_x como porcentaje por fallback o compatibilidad
            let posX = term.x;
            let posY = term.y;
            
            if (posX === undefined && (term as any).position_x !== undefined) {
               // En el sandbox actual, todos los nuevos usan x/y.
               posX = 50; 
            }
            if (posY === undefined && (term as any).position_y !== undefined) {
               posY = 50;
            }

            // Fallbacks si todo falla
            posX = posX ?? 50;
            posY = posY ?? 50;

            const isLeft = posX < 50;
            const flowPosition = isLeft ? Position.Left : Position.Right;

            return (
              <Handle
                key={term.id || index}
                type="source"
                position={flowPosition}
                id={term.id}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: term.type === 'positive' ? '#10b981' : term.type === 'negative' ? '#1e293b' : '#3b82f6',
                  borderColor: '#fff',
                  borderWidth: '1.5px',
                }}
                className="!w-4 !h-4 !z-30 hover:scale-135 shadow-lg transition-all cursor-crosshair group/handle"
              >
                {/* Show label on hover of the handle */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-6' : 'right-6'} bg-slate-900/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/handle:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow`}>
                  {term.label}
                </div>
              </Handle>
            );
          })}
        </>
      )}
    </div>
  );
}

export function PowerSupplyNode({ data }: { data: any }) {
  return (
    <DynamicHardwareNode 
      data={{
        ...data,
        name: data?.name || 'Altronix AL175',
        brand: data?.brand || 'Altronix',
        svg_url: '/svgs/altronix_al175_v2.svg',
        default_width: 320,
        default_height: 360,
        terminals: data?.terminals || [
          // Los terminales se mapean como porcentajes de posición x/y sobre el SVG
          // La entrada +12VDC se ubica sobre el tornillo 1 (x: 263/320 = 82.1%, y: 100/360 = 27.7%)
          { id: '12v', label: '+12VDC', type: 'positive', x: 82.1, y: 27.7 },
          // GND se ubica sobre el tornillo 2 (x: 263/320 = 82.1%, y: 125/360 = 34.7%)
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
        name: data?.name || 'HES 5000',
        brand: data?.brand || 'HES',
        svg_url: '/svgs/hes_5000_v2.svg',
        default_width: 160,
        default_height: 360,
        terminals: data?.terminals || [
          // POS(+) se ubica sobre el tornillo 1 (x: 103/160 = 64.3%, y: 254/360 = 70.5%)
          { id: 'pos', label: 'POS(+)', type: 'positive', x: 64.3, y: 70.5 },
          // NEG(-) se ubica sobre el tornillo 2 (x: 103/160 = 64.3%, y: 279/360 = 77.5%)
          { id: 'neg', label: 'NEG(-)', type: 'negative', x: 64.3, y: 77.5 },
          // COM se ubica sobre el tornillo 3 (x: 103/160 = 64.3%, y: 304/360 = 84.4%)
          { id: 'com', label: 'COM', type: 'signal', x: 64.3, y: 84.4 },
        ]
      }} 
    />
  );
}

export function MultimeterNode({ data }: { data: any }) {
  return (
    <DynamicHardwareNode 
      data={{
        ...data,
        name: data?.name || 'Multímetro Digital PRO',
        brand: data?.brand || 'Access-Tech',
        svg_url: '/svgs/digital_multimeter_v1.svg',
        default_width: 240,
        default_height: 360,
        terminals: data?.terminals || [
          // Jack COM (Negativo - Punta Negra) x: 120/240 = 50%, y: 304/360 = 84.4%
          { id: 'com', label: 'COM (Punta Negra -)', type: 'negative', x: 50.0, y: 84.4 },
          // Jack V/Ω/mA (Positivo - Punta Roja) x: 184/240 = 76.7%, y: 304/360 = 84.4%
          { id: 'v_ohm_ma', label: 'V/Ω/mA (Punta Roja +)', type: 'positive', x: 76.7, y: 84.4 },
          // Jack 10A High Current x: 56/240 = 23.3%, y: 304/360 = 84.4%
          { id: '10a', label: '10A MAX (Punta Alta Corriente)', type: 'positive', x: 23.3, y: 84.4 },
        ]
      }} 
    />
  );
}

