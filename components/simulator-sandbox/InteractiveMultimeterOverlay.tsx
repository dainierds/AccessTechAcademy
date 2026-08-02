"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactFlow, Position } from '@xyflow/react';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export interface ProbeState {
  x: number;
  y: number;
  targetCompId: string | null;
  targetTermId: string | null;
  targetTermLabel?: string;
  targetCompName?: string;
}

interface SnapTerminalResult {
  compId: string;
  compName: string;
  termId: string;
  termLabel: string;
  termType: string;
  snapX: number;
  snapY: number;
  dist: number;
  voltagePotential?: number;
}

export default function InteractiveMultimeterOverlay() {
  const { nodes, edges } = useSimulatorSandboxStore();
  const reactFlowInstance = useReactFlow();

  // Posición por defecto del Multímetro (centro del viewport o posición fija)
  const [multimeterPos, setMultimeterPos] = useState({ x: 300, y: 150 });
  const [isDraggingBody, setIsDraggingBody] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialPos: { x: number; y: number } }>({
    x: 0,
    y: 0,
    initialPos: { x: 300, y: 150 }
  });

  // Puntas de Prueba (Probes)
  const [probeRed, setProbeRed] = useState<ProbeState>({
    x: 180,
    y: 420,
    targetCompId: null,
    targetTermId: null
  });

  const [probeBlack, setProbeBlack] = useState<ProbeState>({
    x: 420,
    y: 420,
    targetCompId: null,
    targetTermId: null
  });

  // Puntas siendo arrastradas
  const [draggingProbe, setDraggingProbe] = useState<'red' | 'black' | null>(null);

  // Selector de Función del Multímetro ('DCV' | 'ACV' | 'OHM' | 'OFF')
  const [dialMode, setDialMode] = useState<'DCV' | 'ACV' | 'OHM' | 'OFF'>('DCV');

  // --- 1. DETECCIÓN DE BORNES & MAGNET SNAP (Umbral 25px) ---
  const findSnapTerminal = useCallback((screenX: number, screenY: number): SnapTerminalResult | null => {
    const SNAP_THRESHOLD = 25; // Distancia imán euclidiana en px

    let closestTerminal: SnapTerminalResult | null = null;

    nodes.forEach((node) => {
      // Obtener posición del nodo en coordenadas de pantalla Flow
      const nodePos = node.position;
      const nodeData = node.data || {};
      const compName = String(nodeData.name || nodeData.label || node.type || 'Componente');
      const terminals = (nodeData.terminals as any[]) || [];

      // Terminales predeterminadas para nodos conocidos
      let activeTerminals = terminals;
      if (activeTerminals.length === 0) {
        if (node.type === 'powerSupply') {
          activeTerminals = [
            { id: '12v', label: '+12VDC', type: 'positive', x: 82.1, y: 27.7 },
            { id: 'gnd', label: 'GND (-)', type: 'negative', x: 82.1, y: 34.7 }
          ];
        } else if (node.type === 'electricStrike') {
          activeTerminals = [
            { id: 'pos', label: 'POS(+)', type: 'positive', x: 64.3, y: 70.5 },
            { id: 'neg', label: 'NEG(-)', type: 'negative', x: 64.3, y: 77.5 },
            { id: 'com', label: 'COM', type: 'signal', x: 64.3, y: 84.4 }
          ];
        } else if (node.type === 'multimeter') {
          activeTerminals = [
            { id: 'com', label: 'COM (-)', type: 'negative', x: 50.0, y: 84.4 },
            { id: 'v_ohm_ma', label: 'V/Ω/mA (+)', type: 'positive', x: 76.7, y: 84.4 },
            { id: '10a', label: '10A MAX', type: 'positive', x: 23.3, y: 84.4 }
          ];
        }
      }

      // Convertir cada terminal a coordenadas absolutas del lienzo ReactFlow
      // Las dimensiones estándar de nodos en el lienzo son ~280px x 360px
      const nodeWidth = (nodeData.default_width as number) || 280;
      const nodeHeight = (nodeData.default_height as number) || 360;

      activeTerminals.forEach((term) => {
        const termXPercent = term.x ?? 50;
        const termYPercent = term.y ?? 50;

        const termFlowX = nodePos.x + (nodeWidth * (termXPercent / 100));
        const termFlowY = nodePos.y + (nodeHeight * (termYPercent / 100));

        // Convertir Flow X,Y -> Screen Pixel X,Y usando reactFlowInstance
        const screenPoint = reactFlowInstance.flowToScreenPosition({ x: termFlowX, y: termFlowY });

        // Distancia euclidiana d = sqrt((x2-x1)^2 + (y2-y1)^2)
        const dx = screenPoint.x - screenX;
        const dy = screenPoint.y - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SNAP_THRESHOLD) {
          if (!closestTerminal || dist < closestTerminal.dist) {
            closestTerminal = {
              compId: node.id,
              compName,
              termId: term.id,
              termLabel: term.label || term.id,
              termType: term.type || 'signal',
              snapX: screenPoint.x,
              snapY: screenPoint.y,
              dist
            };
          }
        }
      });
    });

    return closestTerminal;
  }, [nodes, reactFlowInstance]);

  // --- 2. MOTOR DE CÁLCULO DE LECTURA EN TIEMPO REAL ---
  const calculateMultimeterReading = useCallback(() => {
    if (dialMode === 'OFF') return { text: 'OFF', voltage: 0, status: 'off' };

    // Regla 1: Si alguna punta no está conectada a un borne
    if (!probeRed.targetCompId || !probeBlack.targetCompId) {
      return { text: '00.0 V', voltage: 0, status: 'floating' };
    }

    // Identificar el potencial del nodo para cada punta
    const getTerminalVoltagePotential = (compId: string, termId: string) => {
      const node = nodes.find(n => n.id === compId);
      if (!node) return 0;

      // 1. Fuente de alimentación directa
      if (node.type === 'powerSupply') {
        if (termId === '12v') return 12.0;
        if (termId === 'gnd') return 0.0;
      }

      // 2. Si el borne es positivo/negativo de un componente
      if (termId === '12v' || termId.includes('pos')) return 12.0;
      if (termId === 'gnd' || termId.includes('neg')) return 0.0;

      // 3. Evaluar conexiones mediante edges (cables)
      const connectedEdge = edges.find(
        e => (e.source === compId && e.sourceHandle === termId) ||
             (e.target === compId && e.targetHandle === termId)
      );

      if (connectedEdge) {
        // Rastrear el origen del cable
        const otherNodeId = connectedEdge.source === compId ? connectedEdge.target : connectedEdge.source;
        const otherHandle = connectedEdge.source === compId ? connectedEdge.targetHandle : connectedEdge.sourceHandle;
        
        const otherNode = nodes.find(n => n.id === otherNodeId);
        if (otherNode?.type === 'powerSupply') {
          if (otherHandle === '12v') return 12.0;
          if (otherHandle === 'gnd') return 0.0;
        }
        if (otherHandle?.includes('pos') || otherHandle?.includes('12v')) return 12.0;
        if (otherHandle?.includes('neg') || otherHandle?.includes('gnd')) return 0.0;
      }

      return 0.0;
    };

    const V_red = getTerminalVoltagePotential(probeRed.targetCompId, probeRed.targetTermId!);
    const V_black = getTerminalVoltagePotential(probeBlack.targetCompId, probeBlack.targetTermId!);

    // V_dmm = V_nodo_rojo - V_nodo_negro
    const V_dmm = V_red - V_black;

    return {
      text: `${V_dmm >= 0 ? '' : ''}${V_dmm.toFixed(1)} V`,
      voltage: V_dmm,
      status: 'active'
    };
  }, [probeRed, probeBlack, nodes, edges, dialMode]);

  const reading = calculateMultimeterReading();

  // --- 3. EVENTOS DE ARRASTRE DE PUNTAS Y CUERPO ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingBody) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setMultimeterPos({
        x: dragStartRef.current.initialPos.x + dx,
        y: dragStartRef.current.initialPos.y + dy
      });
      return;
    }

    if (draggingProbe) {
      const snapResult = findSnapTerminal(e.clientX, e.clientY);

      if (draggingProbe === 'red') {
        setProbeRed({
          x: snapResult ? snapResult.snapX : e.clientX,
          y: snapResult ? snapResult.snapY : e.clientY,
          targetCompId: snapResult ? snapResult.compId : null,
          targetTermId: snapResult ? snapResult.termId : null,
          targetTermLabel: snapResult ? snapResult.termLabel : undefined,
          targetCompName: snapResult ? snapResult.compName : undefined
        });
      } else if (draggingProbe === 'black') {
        setProbeBlack({
          x: snapResult ? snapResult.snapX : e.clientX,
          y: snapResult ? snapResult.snapY : e.clientY,
          targetCompId: snapResult ? snapResult.compId : null,
          targetTermId: snapResult ? snapResult.termId : null,
          targetTermLabel: snapResult ? snapResult.termLabel : undefined,
          targetCompName: snapResult ? snapResult.compName : undefined
        });
      }
    }
  }, [isDraggingBody, draggingProbe, findSnapTerminal]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingBody(false);
    setDraggingProbe(null);
  }, []);

  useEffect(() => {
    if (isDraggingBody || draggingProbe) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingBody, draggingProbe, handleMouseMove, handleMouseUp]);

  // Puntos de salida de los cables en los jacks del multímetro
  const jackRedPos = { x: multimeterPos.x + 184, y: multimeterPos.y + 274 };
  const jackBlackPos = { x: multimeterPos.x + 120, y: multimeterPos.y + 274 };

  // --- 4. RENDERIZADO BÉZIER FLEXIBLE DEL CABLE COAXIAL ---
  const renderCoaxialCable = (start: { x: number; y: number }, end: { x: number; y: number }, colorHex: string) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const sag = Math.max(80, Math.min(220, Math.sqrt(dx * dx + dy * dy) * 0.4));

    const cp1X = start.x;
    const cp1Y = start.y + sag;
    const cp2X = end.x;
    const cp2Y = end.y + sag;

    const pathData = `M ${start.x},${start.y} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${end.x},${end.y}`;

    return (
      <g>
        {/* Sombra del cable coaxial */}
        <path d={pathData} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={8} style={{ filter: 'blur(4px)' }} />
        {/* Cuerpo del cable coaxial */}
        <path d={pathData} fill="none" stroke={colorHex} strokeWidth={5} strokeLinecap="round" />
        {/* Brillo interno 3D del cable */}
        <path d={pathData} fill="none" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" style={{ opacity: 0.4 }} />
      </g>
    );
  };

  return (
    <>
      {/* Canvas SVG para Cables Coaxiales de las Puntas */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-40">
        {renderCoaxialCable(jackRedPos, { x: probeRed.x, y: probeRed.y }, '#dc2626')}
        {renderCoaxialCable(jackBlackPos, { x: probeBlack.x, y: probeBlack.y }, '#1e293b')}
      </svg>

      {/* 🟢 1. MULTÍMETRO DIGITAL FLOTANTE Y ARRASTRABLE */}
      <div
        style={{ left: `${multimeterPos.x}px`, top: `${multimeterPos.y}px` }}
        className="fixed z-50 select-none drop-shadow-2xl cursor-grab active:cursor-grabbing transition-shadow"
        onMouseDown={(e) => {
          setIsDraggingBody(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialPos: { ...multimeterPos }
          };
        }}
      >
        <div className="w-[240px] h-[320px] bg-slate-900 border-2 border-amber-500 rounded-3xl p-3 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Carcasa Amarilla Fluke Style */}
          <div className="absolute inset-0 border-8 border-amber-500 rounded-3xl pointer-events-none" />

          {/* Encabezado Marca */}
          <div className="text-center pt-2">
            <span className="text-[11px] font-black tracking-widest text-amber-500 block uppercase">ACCESS-TECH</span>
            <span className="text-[8px] font-bold tracking-wider text-slate-400 block uppercase">DMM-2000 PRO</span>
          </div>

          {/* 📺 PANTALLA LCD RETROILUMINADA (Requisito: Fondo #0F172A, LED #22C55E) */}
          <div className="bg-[#0F172A] border-2 border-slate-700 rounded-xl p-3 flex flex-col justify-between h-[75px] shadow-inner relative">
            <div className="flex justify-between items-center text-[9px] font-mono text-emerald-400 font-bold opacity-80">
              <span>AUTO</span>
              <span>{dialMode}</span>
            </div>
            <div className="text-right">
              <span
                className={`font-mono text-3xl font-black tracking-widest ${
                  reading.status === 'off' ? 'text-slate-800' : 'text-[#22C55E]'
                }`}
                style={{ textShadow: reading.status === 'off' ? 'none' : '0 0 10px rgba(34, 197, 94, 0.6)' }}
              >
                {reading.text}
              </span>
            </div>
          </div>

          {/* Selector Giratorio Dial */}
          <div className="flex justify-center my-1 relative">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg">
              <div
                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center cursor-pointer transition-transform duration-300"
                style={{
                  transform: dialMode === 'DCV' ? 'rotate(0deg)' : dialMode === 'ACV' ? 'rotate(45deg)' : dialMode === 'OHM' ? 'rotate(90deg)' : 'rotate(-45deg)'
                }}
                onClick={() => {
                  const modes: ('DCV' | 'ACV' | 'OHM' | 'OFF')[] = ['DCV', 'ACV', 'OHM', 'OFF'];
                  const nextIdx = (modes.indexOf(dialMode) + 1) % modes.length;
                  setDialMode(modes[nextIdx]);
                }}
              >
                <div className="w-1.5 h-5 bg-red-500 rounded-full -translate-y-2" />
              </div>
            </div>
            <span className="absolute top-0 right-8 text-[9px] font-bold text-amber-400">V⎓</span>
            <span className="absolute bottom-1 right-8 text-[9px] font-bold text-sky-400">V~</span>
            <span className="absolute top-0 left-8 text-[9px] font-bold text-red-500">OFF</span>
            <span className="absolute bottom-1 left-8 text-[9px] font-bold text-emerald-400">Ω</span>
          </div>

          {/* Clavijas Jacks de Salida (Posición fijada para los cables) */}
          <div className="flex justify-around items-center pt-1 pb-2 border-t border-slate-800">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-red-500 flex items-center justify-center shadow">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <span className="text-[7px] font-bold text-red-400 mt-0.5">10A</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-500 flex items-center justify-center shadow">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
              <span className="text-[7px] font-bold text-slate-400 mt-0.5">COM (-)</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-red-500 flex items-center justify-center shadow">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <span className="text-[7px] font-bold text-red-400 mt-0.5">V / Ω (+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 2. PUNTA DE PRUEBA POSITIVA / ROJA (`probeRed`) */}
      <div
        style={{ left: `${probeRed.x}px`, top: `${probeRed.y}px` }}
        className="fixed z-50 -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing group"
        onMouseDown={(e) => {
          e.stopPropagation();
          setDraggingProbe('red');
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Tooltip de conexión sobre la punta */}
          {probeRed.targetCompId && (
            <div className="absolute -top-7 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-bounce">
              {probeRed.targetCompName}: {probeRed.targetTermLabel}
            </div>
          )}

          {/* Aguja metálica conductora */}
          <div className="w-1.5 h-6 bg-gradient-to-b from-slate-300 to-slate-100 rounded-t-sm shadow-md" />
          {/* Mango ergonómico rojo de la punta */}
          <div className="w-4 h-16 bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-b-md border border-red-800 shadow-xl flex items-center justify-center">
            <span className="text-white text-[10px] font-bold font-mono">+</span>
          </div>
        </div>
      </div>

      {/* 1. PUNTA DE PRUEBA NEGATIVA / NEGRA (`probeBlack`) */}
      <div
        style={{ left: `${probeBlack.x}px`, top: `${probeBlack.y}px` }}
        className="fixed z-50 -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing group"
        onMouseDown={(e) => {
          e.stopPropagation();
          setDraggingProbe('black');
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Tooltip de conexión sobre la punta */}
          {probeBlack.targetCompId && (
            <div className="absolute -top-7 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-bounce">
              {probeBlack.targetCompName}: {probeBlack.targetTermLabel}
            </div>
          )}

          {/* Aguja metálica conductora */}
          <div className="w-1.5 h-6 bg-gradient-to-b from-slate-300 to-slate-100 rounded-t-sm shadow-md" />
          {/* Mango ergonómico negro de la punta */}
          <div className="w-4 h-16 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-b-md border border-slate-950 shadow-xl flex items-center justify-center">
            <span className="text-white text-[10px] font-bold font-mono">-</span>
          </div>
        </div>
      </div>

      {/* 📊 4. PANEL INSPECTOR DE ESTADO DEL MULTÍMETRO */}
      <div className="fixed bottom-4 left-4 z-40 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 w-72 text-slate-100 shadow-2xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Inspector de Multímetro
          </h4>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
            {reading.text}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Estado Punta Roja */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
              <span className="font-semibold text-[11px]">Punta Positiva (+):</span>
            </div>
            {probeRed.targetCompId ? (
              <span className="text-[10px] font-mono text-emerald-400 font-bold truncate max-w-[110px]">
                {probeRed.targetTermLabel}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Libre</span>
            )}
          </div>

          {/* Estado Punta Negra */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
              <span className="font-semibold text-[11px]">Punta Negativa (-):</span>
            </div>
            {probeBlack.targetCompId ? (
              <span className="text-[10px] font-mono text-emerald-400 font-bold truncate max-w-[110px]">
                {probeBlack.targetTermLabel}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Libre</span>
            )}
          </div>
        </div>

        <div className="pt-1 flex justify-between items-center text-[9px] text-slate-400 font-mono">
          <span>Modo: {dialMode}</span>
          <button
            onClick={() => {
              setProbeRed({ x: 180, y: 420, targetCompId: null, targetTermId: null });
              setProbeBlack({ x: 420, y: 420, targetCompId: null, targetTermId: null });
            }}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Puntas</span>
          </button>
        </div>
      </div>
    </>
  );
}
