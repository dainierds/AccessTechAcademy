"use client";

import React, { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Lock, Cpu, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, TerminalType } from '@/types/hardware';

// Función para mapear el tipo de terminal al color del Handle
function getHandleStyle(type: TerminalType | string) {
  switch (type) {
    case 'positive':
      return { backgroundColor: '#ef4444', borderColor: '#b91c1c' }; // Rojo (+12VDC/POS)
    case 'negative':
      return { backgroundColor: '#475569', borderColor: '#0f172a' }; // Slate (GND/COM)
    case 'signal':
      return { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' }; // Azul (Señal/Datos)
    default:
      return { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' };
  }
}

// Componente DynamicHardwareNode que renderiza cualquier componente con su SVG y Handles dinámicos
export function DynamicHardwareNode({ data }: { data: any }) {
  const [component, setComponent] = useState<HardwareComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isOrphan = data?.isOrphan ?? false;
  const hardwareComponentId = data?.hardware_component_id;

  useEffect(() => {
    // Si la data del nodo ya trae la info precargada:
    if (data?.svg_url && data?.terminals) {
      setComponent({
        id: hardwareComponentId || 'temp',
        name: data.name || 'Componente PACS',
        brand: data.brand || 'Marca',
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

    // Si tenemos id pero falta data completa, consultar a Supabase DB
    if (hardwareComponentId) {
      const supabase = createClient();
      supabase
        .from('hardware_components')
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

  // 1. Render de Skeleton mientras carga
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

  // 2. Render de Fallback si el componente fue eliminado o no existe
  if (error || (!component && !data?.type)) {
    return (
      <div className="bg-slate-950 border-2 border-red-500/50 rounded-2xl p-4 w-60 shadow-2xl text-white space-y-2">
        <div className="flex items-center gap-2 text-red-400 border-b border-red-500/30 pb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Componente no disponible</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          El componente referenciado en este escenario no fue encontrado o está desactivado.
        </p>
      </div>
    );
  }

  // 3. Render dinámico usando la Biblioteca si existe `component`
  if (component) {
    const width = component.default_width || 240;
    const height = component.default_height || 200;

    return (
      <div 
        style={{ width: `${width}px` }}
        className={`relative bg-[#0f172a] border-2 rounded-2xl p-3 shadow-2xl text-white transition-all duration-300 ${
          isOrphan ? 'border-dashed border-amber-500/60 hover:border-amber-400' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {isOrphan && (
          <span className="absolute -top-3 right-4 bg-amber-600/90 text-amber-100 border border-amber-500 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-lg animate-pulse z-30">
            Pendiente de conexión
          </span>
        )}

        {/* Encabezado del Nodo */}
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <h4 className="text-xs font-extrabold tracking-wide text-slate-100 truncate">{component.name}</h4>
          </div>
          <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-mono flex-shrink-0 border border-slate-800">
            {component.brand}
          </span>
        </div>

        {/* Contenedor del SVG con Posicionamiento Absoluto de Handles */}
        <div 
          style={{ minHeight: `${height}px` }}
          className="relative w-full bg-slate-950/80 rounded-xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden group select-none"
        >
          {/* Imagen SVG del Hardware */}
          <img
            src={component.svg_url}
            alt={component.name}
            className="w-full h-full object-contain max-h-[220px]"
          />

          {/* Renderizado de Handles de React Flow mapeados exactamente sobre las coordenadas relative (x/y) */}
          {component.terminals && component.terminals.map((term) => {
            const handleStyle = getHandleStyle(term.type);
            
            return (
              <div
                key={term.id}
                style={{
                  position: 'absolute',
                  left: `${term.x}%`,
                  top: `${term.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="z-20 flex items-center justify-center group/handle"
                title={`${term.label} (${term.type})`}
              >
                <Handle
                  type="target"
                  position={Position.Top}
                  id={term.id}
                  style={handleStyle}
                  className="!w-3.5 !h-3.5 !border-2 !shadow-md transition-transform group-hover/handle:scale-150 cursor-crosshair"
                />
                
                {/* Tooltip sutil del puerto al hacer hover */}
                <span className="absolute bottom-full mb-1 hidden group-hover/handle:block bg-slate-900 border border-slate-700 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap pointer-events-none">
                  {term.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Fallbacks históricos para compatibilidad con nodos iniciales 'powerSupply' y 'electricStrike'
  if (data?.type === 'electricStrike' || data?.nodeType === 'electricStrike') {
    return <ElectricStrikeNode data={data} />;
  }

  return <PowerSupplyNode data={data} />;
}

// --------------------------------------------------------------------------------
// COMPONENTES HISTÓRICOS COMPATIBLES (PowerSupplyNode & ElectricStrikeNode)
// --------------------------------------------------------------------------------

export function PowerSupplyNode({ data }: any) {
  // Si el nodo incluye hardware_component_id dinámico, redirigir al DynamicHardwareNode
  if (data?.hardware_component_id) {
    return <DynamicHardwareNode data={data} />;
  }

  const isOrphan = data?.isOrphan ?? false;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-xl p-4 shadow-2xl text-white w-64 transition-all duration-300 ${
      isOrphan ? 'border-dashed border-slate-700 hover:border-slate-500' : 'border-slate-800'
    }`}>
      {isOrphan && (
        <span className="absolute -top-3 right-4 bg-yellow-600/90 text-yellow-100 border border-yellow-500 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-lg animate-pulse">
          Pendiente de conexión
        </span>
      )}

      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-orange-400">Fuente de Poder</h4>
        </div>
        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">Altronix AL175</span>
      </div>
      
      {/* Visualización de la fuente */}
      <div className="flex justify-center items-center py-2 bg-slate-950/70 rounded border border-slate-800/80 mb-4 h-16 shadow-inner">
        <div className="w-12 h-12 rounded bg-slate-900 border-2 border-slate-750 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold text-red-500">AC/DC</span>
        </div>
      </div>

      {/* Terminales de conexión */}
      <div className="space-y-3.5 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-950 border border-red-700 relative flex items-center justify-center">
              <Handle
                type="source"
                position={Position.Left}
                id="altronix-12v-out"
                className="!bg-orange-500 !text-orange-500"
              />
            </div>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">+12VDC</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">GND (-)</span>
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <Handle
                type="source"
                position={Position.Right}
                id="altronix-gnd-out"
                className="!bg-slate-500 !text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ElectricStrikeNode({ data }: any) {
  if (data?.hardware_component_id) {
    return <DynamicHardwareNode data={data} />;
  }

  const isOrphan = data?.isOrphan ?? false;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-xl p-4 shadow-2xl text-white w-64 transition-all duration-300 ${
      isOrphan ? 'border-dashed border-slate-700 hover:border-slate-500' : 'border-slate-800'
    }`}>
      {isOrphan && (
        <span className="absolute -top-3 right-4 bg-yellow-600/90 text-yellow-100 border border-yellow-500 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-lg animate-pulse">
          Pendiente de conexión
        </span>
      )}

      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-blue-400">Cerradero</h4>
        </div>
        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">HES 5000</span>
      </div>

      {/* Visualización del herraje */}
      <div className="flex justify-center items-center py-2 bg-slate-950/70 rounded border border-slate-800/80 mb-4 h-16 shadow-inner">
        <div className="w-8 h-12 rounded bg-zinc-700 border border-zinc-650 flex items-center justify-center shadow-inner">
          <div className="w-4 h-6 bg-zinc-800 rounded"></div>
        </div>
      </div>

      {/* Terminales de conexión */}
      <div className="space-y-3.5 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-950 border border-red-700 relative flex items-center justify-center">
              <Handle
                type="target"
                position={Position.Left}
                id="hes5000-pos"
                className="!bg-orange-500 !text-orange-500"
              />
            </div>
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">POS (+)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">NEG (-)</span>
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <Handle
                type="target"
                position={Position.Right}
                id="hes5000-neg"
                className="!bg-slate-500 !text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
