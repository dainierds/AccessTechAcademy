"use client";

import React, { useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { 
  PowerSupplyNode, 
  ElectricStrikeNode, 
  DoorControllerNode, 
  MaglockNode,
  PanicBarNode,
  DPSNode,
  REXButtonNode,
  PIRSensorNode,
  DynamicHardwareNode 
} from './NodeTypes/HardwareNodes';
import WireEdge from './EdgeTypes/WireEdge';
import CablePalette from './CablePalette';
import { CableType, CableConductor, CompositeCableBundle } from '@/types/cable';
import SandboxRulesSidebar from './SandboxRulesSidebar';
import SandboxMultimeterSidebar from './SandboxMultimeterSidebar';
import { PRESET_SANDBOX_COMPONENTS } from '@/types/hardware';
import { Maximize2, Minimize2, ChevronUp, ChevronDown, GitBranch, Activity, Layers, RotateCcw, Plus, X, Cpu, Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

const nodeTypes = {
  powerSupply: PowerSupplyNode,
  electricStrike: ElectricStrikeNode,
  doorController: DoorControllerNode,
  maglock: MaglockNode,
  panicBar: PanicBarNode,
  dps: DPSNode,
  rexButton: REXButtonNode,
  pirSensor: PIRSensorNode,
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
    electrical,
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

  const { t } = useI18n();

  const nodesString = JSON.stringify(initialNodes);
  const edgesString = JSON.stringify(initialEdges);
  const rulesString = JSON.stringify(validationRules);

  const [customList, setCustomList] = React.useState<any[]>([]);
  const [hiddenPresetIds, setHiddenPresetIds] = React.useState<string[]>([]);

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

    try {
      const saved = localStorage.getItem('hidden_sandbox_preset_ids');
      if (saved) setHiddenPresetIds(JSON.parse(saved));
    } catch (e) {}

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

  const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isCablePaletteCollapsed, setIsCablePaletteCollapsed] = React.useState(false);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = React.useState(false);

  // Esc key listener to exit Fullscreen mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className={`flex flex-col w-full bg-slate-100 dark:bg-slate-950 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-0' 
        : 'h-[750px] relative'
    }`}>
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 transition-colors select-none">
        <div className="flex items-center gap-3">
          {/* Quick Toggle Buttons for Sidebars */}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isLeftCollapsed
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isLeftCollapsed ? 'Expandir Motor IF/THEN (Izquierda)' : 'Ocultar Motor IF/THEN'}
          >
            <GitBranch className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t.sandbox.rulesIfThen}</span>
          </button>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              {mode === 'edit' ? 'Modo Edición Sandbox' : 'Simulador Sandbox de Pruebas'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">
              {mode === 'edit' 
                ? 'Edita nodos y conexiones de prueba en el entorno sandbox aislado.' 
                : 'Selecciona cables del sandbox para probar circuitos de experimentación.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Botón para Ocultar/Mostrar Paleta de Cables desde Arriba */}
          <button
            onClick={() => setIsCablePaletteCollapsed(!isCablePaletteCollapsed)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isCablePaletteCollapsed
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title={isCablePaletteCollapsed ? 'Mostrar Paleta de Cables (Arriba)' : 'Ocultar Paleta de Cables'}
          >
            {isCablePaletteCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{t.sandbox.cablePalette}</span>
          </button>

          {/* Botón Quick Toggle para Multímetro Derecho */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isRightCollapsed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isRightCollapsed ? 'Expandir Multímetro Digital (Derecha)' : 'Ocultar Multímetro Digital'}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{t.sandbox.multimeter}</span>
          </button>

          {/* Selector dinámico para AGREGAR componentes en modo Play */}
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
                  } else {
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
                <option value="">{t.admin.addComponent}...</option>
                <option value="altronix">Altronix AL175</option>
                <option value="hes">HES 5000</option>
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
                className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs px-3 py-1.5 rounded-lg transition font-medium"
              >
                <option value="">🗑️ Eliminar Componente del Canvas...</option>
                {nodes.map((n) => {
                  const brand = n.data?.brand ? `${n.data.brand} ` : '';
                  const rawName = n.data?.name || n.data?.label || '';
                  
                  let fallbackCategory = '';
                  if (n.type === 'powerSupply') fallbackCategory = 'Fuente de Poder (Altronix)';
                  else if (n.type === 'electricStrike') fallbackCategory = 'Cerradero Eléctrico (HES)';
                  else if (n.type === 'doorController') fallbackCategory = 'Controladora de Puertas';
                  else fallbackCategory = 'Componente Hardware';

                  let displayName = `${brand}${rawName}`.trim();
                  if (!displayName || displayName === 'customNode' || displayName.toLowerCase() === 'sandbox' || displayName === 'Componente Sandbox') {
                    displayName = fallbackCategory;
                  }

                  return (
                    <option key={n.id} value={n.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          <button
            onClick={resetSimulator}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition"
          >
            {t.sandbox.resetCanvas}
          </button>
          
          {/* BOTÓN PANTALLA COMPLETA (FULLSCREEN) */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md'
            }`}
            title={isFullscreen ? 'Salir de Pantalla Completa (Esc)' : 'Pantalla Completa (Full Screen Workspace)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Salir Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Paleta interactiva de tipos de cable sandbox (Plegable desde arriba) */}
      <div className={`transition-all duration-300 ${
        isCablePaletteCollapsed 
          ? 'max-h-0 py-0 opacity-0 overflow-hidden border-b-0' 
          : 'max-h-96 px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 overflow-y-auto'
      }`}>
        <CablePalette
          selectedConductor={selectedConductor}
          onSelectConductor={(conductorSelection) => setSelectedConductor(conductorSelection)}
        />
      </div>

      {/* Área Principal con 3 Columnas: Sidebar Reglas (Izquierda) + ReactFlow Canvas (Centro) + Sidebar Multímetro (Derecha) */}
      <div className="flex-1 flex min-h-0 relative bg-slate-200 dark:bg-slate-950 transition-colors">
        
        {/* BARRA LATERAL IZQUIERDA: Motor de Reglas IF/THEN */}
        <SandboxRulesSidebar 
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
        />

        {/* CANVAS CENTRAL REACTFLOW */}
        <div className="flex-1 relative min-w-0">
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

          {/* BOTÓN FLOTANTE INFERIOR DOCK PARA ABRIR/OCULTAR LA BIBLIOTECA DESDE ABAJO */}
          <button
            onClick={() => setIsBottomDrawerOpen(!isBottomDrawerOpen)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-400 font-extrabold text-xs px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 transition hover:scale-105 active:scale-95"
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isBottomDrawerOpen ? 'rotate-180 text-amber-400' : ''}`} />
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>{isBottomDrawerOpen ? 'Ocultar Biblioteca de Componentes' : 'Biblioteca Componentes (Deslizar desde Abajo)'}</span>
          </button>

          {/* DRAWER / PANEL DESLIZANTE DESDE ABAJO: BIBLIOTECA DE COMPONENTES */}
          {isBottomDrawerOpen && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t-2 border-amber-500/50 backdrop-blur-xl shadow-[0_-15px_40px_rgba(0,0,0,0.9)] p-5 transition-all duration-300 rounded-t-3xl max-h-[340px] overflow-y-auto space-y-4 animate-slideUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      {t.sandbox.componentLibrary}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">Haz clic en cualquier componente para insertarlo directamente al canvas de pruebas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBottomDrawerOpen(false)} 
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                  title="Cerrar panel inferior"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid de Componentes Disponibles (Presets Estandarizados + Componentes Creados) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...PRESET_SANDBOX_COMPONENTS, ...customList]
                  .filter(comp => !hiddenPresetIds.includes(comp.id))
                  .map(comp => (
                    <div key={comp.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl flex flex-col justify-between space-y-2.5 transition group shadow-md relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white truncate max-w-[85px]">{comp.name}</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-400 font-mono font-bold px-1.5 py-0.5 rounded truncate">{comp.brand}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{comp.category}</p>
                      
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar '${comp.brand} ${comp.name}' de la biblioteca?`)) {
                              if (comp.id.startsWith('preset-')) {
                                const next = [...hiddenPresetIds, comp.id];
                                setHiddenPresetIds(next);
                                localStorage.setItem('hidden_sandbox_preset_ids', JSON.stringify(next));
                              } else {
                                const { createClient } = await import('@/lib/supabase/client');
                                const supabase = createClient();
                                const { error } = await supabase
                                  .from('sandbox_hardware_components')
                                  .delete()
                                  .eq('id', comp.id);
                                if (error) {
                                  alert('Error: ' + error.message);
                                } else {
                                  setCustomList(prev => prev.filter(c => c.id !== comp.id));
                                }
                              }
                            }
                          }}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded transition"
                          title="Eliminar de la biblioteca"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            const nodeType = comp.category === 'power_supply' ? 'powerSupply' : comp.category === 'strike' || comp.category === 'electric_strike' ? 'electricStrike' : comp.category === 'controller' ? 'doorController' : 'customNode';
                            addNode({
                              id: `${comp.id}-${Date.now()}`,
                              type: nodeType,
                              position: { x: Math.random() * 200 + 200, y: Math.random() * 100 + 100 },
                              data: { 
                                hardware_component_id: comp.id,
                                name: comp.name,
                                brand: comp.brand,
                                label: `${comp.brand} ${comp.name}`,
                                svg_url: comp.svg_url,
                                terminals: comp.terminals
                              }
                            });
                          }}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] py-1.5 rounded-lg shadow transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.sandbox.add}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {validationResult && (
            <div className={`absolute bottom-6 right-6 p-4 rounded-xl shadow-xl border w-80 transition duration-300 z-30 ${
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

          {/* PANEL DE FALLAS ELÉCTRICAS (cortocircuito / polaridad invertida) — Motor eléctrico real */}
          {electrical && electrical.faults.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] p-3.5 rounded-xl shadow-2xl border bg-red-950/95 border-red-500/60 text-red-200 animate-fadeIn">
              <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{t.sandbox.electricalFaults}</span>
              </h4>
              <ul className="space-y-1">
                {electrical.faults.map((fault, i) => (
                  <li key={i} className="text-[11px] font-mono leading-snug flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">▸</span>
                    <span>{fault}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BARRA LATERAL DERECHA: Multímetro Digital con Pantalla LED */}
        <SandboxMultimeterSidebar 
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
        />
      </div>
    </div>
  );
}
