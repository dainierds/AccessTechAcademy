"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Lock, Cpu, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, TerminalType } from '@/types/hardware';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { SANDBOX_DEVICES, DeviceDef } from '@/lib/sandboxEngine';

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

// 1. COMPONENTE RENDERIZADO POR CANVAS VECTORIAL EDUCATIVO (Clonado exactamente de devices.js)
export function CanvasDeviceNode({ data, typeOverride }: { data: any; typeOverride?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawType = typeOverride || data?.type || 'power-supply';
  
  // Normalizar nombre de tipo para mapear con SANDBOX_DEVICES
  let devKey = 'power-supply';
  if (rawType === 'powerSupply' || rawType === 'power-supply') devKey = 'power-supply';
  else if (rawType === 'doorController' || rawType === 'door-controller' || rawType === 'controller') devKey = 'door-controller';
  else if (rawType === 'electricStrike' || rawType === 'door-strike' || rawType === 'strike') devKey = 'door-strike';
  else if (rawType === 'maglock') devKey = 'maglock';
  else if (rawType === 'panicBar' || rawType === 'crashbar') devKey = 'crashbar';
  else if (rawType === 'dps' || rawType === 'door-position') devKey = 'door-position';
  else if (rawType === 'rexButton' || rawType === 'push-to-exit') devKey = 'push-to-exit';
  else if (rawType === 'pirSensor' || rawType === 'motion-sensor') devKey = 'motion-sensor';

  const def: DeviceDef = SANDBOX_DEVICES[devKey] || SANDBOX_DEVICES['power-supply'];

  const [simState, setSimState] = useState<any>(() => {
    const st: any = {};
    if (def.action && def.action.def !== undefined) {
      st[def.action.stateKey] = def.action.def;
    }
    if (devKey === 'maglock') st.energized = true;
    if (devKey === 'door-controller') { st.pwrLed = true; st.relay = true; }
    if (devKey === 'motion-sensor') { st.powered = true; st.motion = false; }
    return st;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, def.w, def.h);
    ctx.save();
    def.draw(ctx, { id: data.id || 'dev', type: devKey }, simState);
    ctx.restore();
  }, [devKey, simState, def, data.id]);

  const handleToggle = () => {
    if (def.action) {
      const k = def.action.stateKey;
      setSimState((prev: any) => ({ ...prev, [k]: !prev[k] }));
    }
  };

  return (
    <div
      className="relative group select-none"
      style={{ width: def.w, height: def.h }}
    >
      <div 
        onClick={handleToggle}
        className="cursor-pointer transition-transform active:scale-98 w-full h-full"
        title={`Haz clic para accionar ${def.name}`}
      >
        <canvas 
          ref={canvasRef} 
          width={def.w} 
          height={def.h} 
          className="block select-none pointer-events-none drop-shadow-2xl"
          style={{ width: def.w, height: def.h }}
        />
      </div>

      {/* Bornes de Conexión en Posiciones Exactas — Usa left/top% respecto al div wrapper dimensionado */}
      {def.terminals.map((term) => {
        const posX = (term.x / def.w) * 100;
        const posY = (term.y / def.h) * 100;
        return (
          <Handle
            key={term.id}
            type="source"
            position={Position.Left}
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
            <div className="absolute top-1/2 -translate-y-1/2 left-5 bg-slate-900/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/handle:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow">
              {term.label}
            </div>
          </Handle>
        );
      })}
    </div>
  );
}

// 2. COMPONENTE BASE DINÁMICO (DynamicHardwareNode)
export function DynamicHardwareNode({ data }: { data: any }) {
  const [component, setComponent] = useState<HardwareComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { nodeColorOverrides } = useSimulatorSandboxStore();

  const isOrphan = data?.isOrphan ?? false;
  const hardwareComponentId = data?.hardware_component_id;
  const nodeId = data?.id;

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
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {name} ({brand}) {overrideColor ? '⚡ [ACCIONADA POR REGLA]' : ''}
      </div>

      <div 
        className="relative select-none overflow-visible block p-0 m-0 bg-transparent border-0"
        style={{
          width: `${width}px`,
          height: `${height}px`,
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

        {component?.terminals && component.terminals.length > 0 && (
          <>
            {component.terminals.map((term, index) => {
              let posX = term.x ?? 50;
              let posY = term.y ?? 50;

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
                  position={Position.Left}
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

// Exportar Nodos Específicos Usando la Renderización Vectorial Directa Canvas
export function PowerSupplyNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="power-supply" />;
}

export function DoorControllerNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="door-controller" />;
}

export function ElectricStrikeNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="door-strike" />;
}

export function MaglockNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="maglock" />;
}

export function PanicBarNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="crashbar" />;
}

export function DPSNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="door-position" />;
}

export function REXButtonNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="push-to-exit" />;
}

export function PIRSensorNode({ data }: { data: any }) {
  return <CanvasDeviceNode data={data} typeOverride="motion-sensor" />;
}
