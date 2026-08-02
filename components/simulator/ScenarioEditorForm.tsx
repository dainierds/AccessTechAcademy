"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import SimulatorCanvas from '@/components/simulator/SimulatorCanvas';
import { saveScenarioAction } from '@/app/admin/escenarios/actions';
import { ArrowLeft, Save, Plus, AlertTriangle, Cpu, Wrench, CheckCircle2 } from 'lucide-react';

export default function ScenarioEditorForm({
  scenario,
}: {
  scenario: any | null; // null si es nuevo
}) {
  const { nodes, edges, setMode, addNode, setInitialState } = useSimulatorStore();
  
  const [title, setTitle] = useState(scenario?.title || '');
  const [description, setDescription] = useState(scenario?.description || '');
  const [type, setType] = useState<string>(scenario?.type || 'guided');
  const [difficulty, setDifficulty] = useState<number>(scenario?.difficulty_level || 1);
  
  // Soporte para modo diagnóstico
  const [isFaultMode, setIsFaultMode] = useState(false);
  const [correctEdgesList, setCorrectEdgesList] = useState<any[]>([]);
  const [faultEdgesList, setFaultEdgesList] = useState<any[]>([]);

  // Activar modo edición en el store al montar
  useEffect(() => {
    setMode('edit');
    if (scenario) {
      const initNodes = scenario.hardware_config?.nodes || [];
      const initEdges = scenario.hardware_config?.initial_wiring || [];
      setInitialState(initNodes, initEdges);
    }
  }, [scenario]);

  const [dbComponents, setDbComponents] = useState<any[]>([]);
  const [loadingDbComponents, setLoadingDbComponents] = useState(false);

  // Cargar lista dinámica de componentes desde la BD
  useEffect(() => {
    async function loadHardwareComponents() {
      setLoadingDbComponents(true);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hardware_components')
        .select('*')
        .eq('is_active', true);

      if (!error && data) {
        setDbComponents(data);
      }
      setLoadingDbComponents(false);
    }
    loadHardwareComponents();
  }, []);

  const handleAddHardwareNode = (nodeType: 'powerSupply' | 'electricStrike') => {
    const id = `${nodeType === 'powerSupply' ? 'altronix' : 'hes5000'}-${Date.now()}`;
    addNode({
      id,
      type: nodeType,
      position: { x: 100 + nodes.length * 40, y: 150 },
      data: {},
    });
  };

  const handleAddDbHardwareNode = (comp: any) => {
    const id = `hw_${comp.id}_${Date.now()}`;
    addNode({
      id,
      type: 'powerSupply', // Utiliza el renderizador base actual
      position: { x: 120 + nodes.length * 40, y: 150 },
      data: {
        hardware_component_id: comp.id,
        name: comp.name,
        brand: comp.brand,
        svg_url: comp.svg_url,
        terminals: comp.terminals
      },
    });
  };

  const handleToggleFaultInjectionMode = () => {
    if (!isFaultMode) {
      // Guardar el cableado correcto actual antes de mutar
      setCorrectEdgesList(edges);
      setIsFaultMode(true);
    } else {
      // Guardar el cableado con la falla inyectada y retornar al correcto
      setFaultEdgesList(edges);
      setInitialState(nodes, correctEdgesList);
      setIsFaultMode(false);
    }
  };

  const handleSubmitForm = async (publishedState: boolean) => {
    const nodesData = JSON.stringify(nodes);
    
    // Si estamos guardando en modo diagnóstico, el cableado correcto es el original
    const correctWiringData = JSON.stringify(isFaultMode ? correctEdgesList : edges);
    const faultWiringData = isFaultMode ? JSON.stringify(edges) : JSON.stringify(faultEdgesList);

    const formData = new FormData();
    if (scenario?.id) {
      formData.append('id', scenario.id);
    }
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('difficulty_level', difficulty.toString());
    formData.append('is_published', publishedState.toString());
    formData.append('nodesJson', nodesData);
    formData.append('edgesJson', correctWiringData);
    formData.append('faultWiringJson', faultWiringData);

    try {
      await saveScenarioAction(formData);
    } catch (err: any) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Link href="/admin/escenarios" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Escenarios</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {scenario ? 'Editar Escenario' : 'Nuevo Escenario'}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configura los componentes de hardware y las reglas lógicas del circuito.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmitForm(false)}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
          >
            Guardar Borrador
          </button>
          <button
            type="button"
            onClick={() => handleSubmitForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publicar Escenario</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Formulario lateral */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Parámetros</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Título</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: Cableado HES 5000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Detalla las instrucciones de cableado..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="guided">Guiado</option>
                  <option value="diagnostic">Diagnóstico</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dificultad</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-2.5 py-2 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <option key={lvl} value={lvl}>Lvl {lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selector de Hardware dinámico desde la BD */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Biblioteca de Hardware (BD)</span>
              
              {loadingDbComponents ? (
                <p className="text-xs text-slate-400 font-mono animate-pulse">Cargando catálogo...</p>
              ) : dbComponents.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">No hay componentes personalizados. Usa los base:</p>
                  <button
                    type="button"
                    onClick={() => handleAddHardwareNode('powerSupply')}
                    className="flex items-center justify-center gap-1.5 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Fuente Altronix (Base)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddHardwareNode('electricStrike')}
                    className="flex items-center justify-center gap-1.5 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-500" />
                    <span>Cerradero HES (Base)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dbComponents.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleAddDbHardwareNode(comp)}
                      className="flex items-center gap-2.5 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-left group"
                    >
                      {comp.svg_url ? (
                        <img src={comp.svg_url} alt={comp.name} className="w-7 h-7 object-contain rounded bg-slate-900 p-0.5" />
                      ) : (
                        <Cpu className="w-5 h-5 text-indigo-500" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs">{comp.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">{comp.brand} • {comp.terminals?.length || 0} pines</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Control de inyección de fallas */}
            {type === 'diagnostic' && (
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Inyección de Fallas</span>
                <button
                  type="button"
                  onClick={handleToggleFaultInjectionMode}
                  className={`flex items-center justify-center gap-1.5 w-full text-xs font-bold py-2.5 rounded-xl border transition-colors ${
                    isFaultMode 
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isFaultMode ? '✓ Guardar Falla Inyectada' : 'Definir Falla en Cable'}</span>
                </button>
                {isFaultMode && (
                  <span className="block text-[10px] text-red-500 dark:text-red-400 font-medium leading-relaxed">
                    Conecta un cable incorrecto ahora en el canvas para inyectar el error de diagnóstico.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas del Editor */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 px-4 py-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Wrench className="w-4 h-4 text-indigo-500" />
              <span>Instrucción: {isFaultMode 
                ? 'Modifica un cable de la conexión correcta para simular el daño.' 
                : 'Arrastra y conecta los cables que representan el funcionamiento correcto del circuito.'}
              </span>
            </div>
            {isFaultMode && (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
            )}
          </div>

          <div className="rounded-xl overflow-hidden shadow-md border border-slate-200/60 dark:border-slate-800/60">
            <SimulatorCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}

