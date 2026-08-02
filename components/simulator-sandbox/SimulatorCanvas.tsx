"use client";

import React, { useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { PowerSupplyNode, ElectricStrikeNode, DynamicHardwareNode, MultimeterNode } from './NodeTypes/HardwareNodes';
import WireEdge from './EdgeTypes/WireEdge';
import CablePalette from './CablePalette';
import InteractiveMultimeterOverlay from './InteractiveMultimeterOverlay';
import { CableType, CableConductor, CompositeCableBundle } from '@/types/cable';

const nodeTypes = {
  powerSupply: PowerSupplyNode,
  electricStrike: ElectricStrikeNode,
  multimeter: MultimeterNode,
  customNode: DynamicHardwareNode,
};

const edgeTypes = {
  wire: WireEdge,
};

export default function SimulatorCanvas({
  initialNodes,
  initialEdges = [],
  validationRules,
  mode: initialMode,
}: {
  initialNodes?: any[];
  initialEdges?: any[];
  validationRules?: { correctWiring: any[] };
  mode?: 'play' | 'edit';
}) {
  const {
    nodes,
    edges,
    validationResult,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    validateCircuit,
    resetSimulator,
    setValidationRules,
    setInitialState,
    setMode,
    mode,
  } = useSimulatorSandboxStore();

  const nodesString = JSON.stringify(initialNodes);
  const edgesString = JSON.stringify(initialEdges);
  const rulesString = JSON.stringify(validationRules);

  const [customList, setCustomList] = React.useState<any[]>([]);

  useEffect(() => {
    resetSimulator();
    
    if (initialMode) {
      setMode(initialMode);
    }

    if (validationRules) {
      setValidationRules(validationRules);
    }

    if (initialNodes && initialNodes.length > 0) {
      setInitialState(initialNodes, initialEdges);
    }

    // Cargar componentes sandbox adicionales creados por IA
    const loadCustomComponents = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('sandbox_hardware_components')
        .select('*')
        .eq('is_active', true);
      if (data) {
        setCustomList(data);
      }
    };
    loadCustomComponents();
  }, [nodesString, edgesString, rulesString, initialMode]);

  const [selectedConductor, setSelectedConductor] = React.useState<{
    cableType: CableType;
    conductor: CableConductor;
    bundle?: CompositeCableBundle;
  } | null>(null);

  const handleConnect = (connection: any) => {
    const cableData = selectedConductor ? {
      cable_type_id: selectedConductor.cableType.id,
      cable_name: selectedConductor.cableType.name,
      gauge: selectedConductor.cableType.gauge,
      color_hex: selectedConductor.conductor.color_hex,
      color_name: selectedConductor.conductor.color_name,
      conductor: selectedConductor.conductor,
      bundle: selectedConductor.bundle
    } : {};

    onConnect({
      ...connection,
      data: cableData
    });
  };

  return (
    <div className="flex flex-col h-[650px] w-full bg-slate-100 dark:bg-slate-950 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            {mode === 'edit' ? 'Modo Edición Sandbox' : 'Simulador Sandbox de Pruebas'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'edit' 
              ? 'Edita nodos y conexiones de prueba en el entorno sandbox aislado.' 
              : 'Selecciona cables del sandbox para probar circuitos de experimentación.'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Selector dinámico para AGREGAR componentes en modo Play (práctica) */}
          {mode === 'play' && (
            <div className="flex gap-1.5 max-h-9 overflow-hidden">
              <select
                onChange={async (e) => {
                  const val = e.target.value;
                  if (!val) return;
                  
                  if (val === 'altronix') {
                    addNode({
                      id: `power-${Date.now()}`,
                      type: 'powerSupply',
                      position: { x: 50, y: 100 },
                      data: { label: 'Altronix AL175' }
                    });
                  } else if (val === 'hes') {
                    addNode({
                      id: `strike-${Date.now()}`,
                      type: 'electricStrike',
                      position: { x: 450, y: 100 },
                      data: { label: 'HES 5000' }
                    });
                  } else if (val === 'multimeter') {
                    addNode({
                      id: `multimeter-${Date.now()}`,
                      type: 'multimeter',
                      position: { x: 250, y: 120 },
                      data: { label: 'Multímetro Digital' }
                    });
                  } else {
                    // Cargar dinámicamente de Supabase
                    const { createClient } = await import('@/lib/supabase/client');
                    const supabase = createClient();
                    const { data: comp } = await supabase
                      .from('sandbox_hardware_components')
                      .select('*')
                      .eq('id', val)
                      .single();
                      
                    if (comp) {
                      addNode({
                        id: `custom-${comp.id}-${Date.now()}`,
                        type: 'customNode',
                        position: { x: Math.random() * 200 + 150, y: Math.random() * 100 + 100 },
                        data: { 
                          hardware_component_id: comp.id,
                          name: comp.name,
                          brand: comp.brand,
                          svg_url: comp.svg_url,
                          terminals: comp.terminals
                        }
                      });
                    }
                  }
                  e.target.value = '';
                }}
                className="bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
              >
                <option value="">Agregar Componente...</option>
                <option value="altronix">Altronix AL175</option>
                <option value="hes">HES 5000</option>
                <option value="multimeter">Multímetro Digital PRO</option>
                {/* Cargamos las opciones dinámicas adicionales */}
                {customList.map(c => (
                  <option key={c.id} value={c.id}>{c.brand} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {nodes.length > 0 && (
            <div className="flex gap-1.5 max-h-9 overflow-hidden">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    removeNode(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs px-3 py-1.5 rounded-lg transition"
              >
                <option value="">Eliminar Nodo...</option>
                {nodes.map((n) => {
                  const nodeLabel = typeof n.data?.name === 'string' ? n.data.name : typeof n.data?.label === 'string' ? n.data.label : String(n.type || 'Nodo');
                  return (
                    <option key={n.id} value={n.id}>
                      {String(n.id.split('-')[0])} ({nodeLabel})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          <button
            onClick={resetSimulator}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition"
          >
            Reiniciar Canvas
          </button>
          
          {mode !== 'edit' && (
            <button
              onClick={validateCircuit}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-lg hover:shadow-amber-500/20 transition"
            >
              Verificar Conexión Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Paleta interactiva de tipos de cable sandbox */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <CablePalette
          selectedConductor={selectedConductor}
          onSelectConductor={(conductorSelection) => setSelectedConductor(conductorSelection)}
        />
      </div>

      {/* Área del Canvas Sandbox */}
      <div className="flex-1 relative bg-slate-200 dark:bg-slate-950 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,rgba(2,6,23,0.75)_100%)] pointer-events-none z-10" />

        <ReactFlow
          nodes={nodes.map((node) => {
            const hasConnection = edges.some(
              (edge) => edge.source === node.id || edge.target === node.id
            );
            return {
              ...node,
              data: {
                ...node.data,
                isOrphan: !hasConnection,
              },
            };
          })}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background color="#f59e0b" gap={20} size={1.5} className="dark:hidden" />
          <Background color="#d97706" gap={20} size={1.5} className="hidden dark:block" />
          <Controls className="!bg-white dark:!bg-slate-900 !border-amber-500/40 !text-slate-800 dark:!text-white !shadow-2xl z-20" />
          {nodes.length > 3 && (
            <MiniMap 
              className="!bg-white dark:!bg-slate-900 !border-amber-500/40 !shadow-2xl !rounded-xl overflow-hidden z-20" 
              nodeColor={(node) => {
                if (node.type === 'powerSupply') return '#f97316';
                if (node.type === 'electricStrike') return '#3b82f6';
                return '#94a3b8';
              }} 
              maskColor="rgba(245, 158, 11, 0.2)" 
            />
          )}
        </ReactFlow>

        {validationResult && (
          <div className={`absolute bottom-6 right-6 p-4 rounded-xl shadow-xl border w-80 transition duration-300 ${
            validationResult.isValid 
              ? 'bg-emerald-50 dark:bg-green-950/90 border-emerald-300 dark:border-green-800 text-emerald-900 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-950/90 border-red-300 dark:border-red-800 text-red-300 dark:text-red-200'
          }`}>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
              {validationResult.isValid ? (
                <span>Circuito Sandbox OK</span>
              ) : (
                <span>Error en Circuito Sandbox</span>
              )}
            </h4>
            <p className="text-xs">
              {validationResult.isValid 
                ? 'Validación sandbox completada con éxito.' 
                : validationResult.errors[0]?.message || 'Circuito incompleto.'}
            </p>
          </div>
        )}
      </div>

      {/* Overlay interactivo 2D del Multímetro Digital en el Sandbox */}
      <InteractiveMultimeterOverlay />
    </div>
  );
}
