"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import SimulatorCanvas from '@/components/simulator-sandbox/SimulatorCanvas';
import TerminalEditor from '@/components/admin/TerminalEditor';
import { HardwareComponent, HardwareCategory, CATEGORY_LABELS } from '@/types/hardware';
import { CableType } from '@/types/cable';
import { 
  AlertTriangle, 
  RotateCcw, 
  Plus, 
  Cpu, 
  Disc, 
  Layers, 
  Save, 
  FileCode, 
  Trash2,
  Check,
  Shield,
  Search
} from 'lucide-react';
import { seedSandboxCableTypes } from '@/lib/sandboxCableSeed';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';

export default function SandboxAdminClient() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { addNode } = useSimulatorSandboxStore();

  // Datos sandbox
  const [sandboxComponents, setSandboxComponents] = useState<HardwareComponent[]>([]);
  const [sandboxCables, setSandboxCables] = useState<CableType[]>([]);
  const [sandboxScenarios, setSandboxScenarios] = useState<any[]>([]);

  // Pestaña activa de biblioteca sandbox
  const [activeTab, setActiveTab] = useState<'components' | 'cables' | 'scenarios'>('components');

  // Formulario nuevo componente
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<HardwareCategory>('power_supply');
  const [svgUrl, setSvgUrl] = useState('');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Formulario nuevo cable
  const [isCableModalOpen, setIsCableModalOpen] = useState(false);
  const [cableName, setCableName] = useState('');
  const [cableGauge, setCableGauge] = useState(18);
  const [cableConductorCount, setCableConductorCount] = useState(2);
  const [cableIsShielded, setCableIsShielded] = useState(false);

  // Formulario nuevo escenario
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');

  const handleAddComponentToCanvas = (comp: HardwareComponent) => {
    addNode({
      id: `sandbox-${comp.id}-${Date.now()}`,
      type: 'customNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 100 + 100 },
      data: { hardware_component_id: comp.id },
    });
    // Hacer scroll arriba hacia el canvas
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadSandboxData = async () => {

    setLoading(true);

    try {
      // 1. Cargar componentes sandbox
      const { data: comps } = await supabase
        .from('sandbox_hardware_components')
        .select('*')
        .order('created_at', { ascending: false });

      if (comps) setSandboxComponents(comps as HardwareComponent[]);

      // 2. Cargar cables sandbox (si está vacío, sembrar automáticamente)
      let { data: cables } = await supabase
        .from('sandbox_cable_types')
        .select('*')
        .order('name');

      if (!cables || cables.length === 0) {
        cables = await seedSandboxCableTypes();
      }

      if (cables) setSandboxCables(cables as CableType[]);

      // 3. Cargar escenarios sandbox
      const { data: scenarios } = await supabase
        .from('sandbox_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (scenarios) setSandboxScenarios(scenarios);
    } catch (err) {
      console.warn("Entorno Sandbox: Leyendo estado limpio inicial.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSandboxData();
  }, []);

  // Botón Reiniciar Sandbox (Borra todo en tablas sandbox_*)
  const handleResetSandbox = async () => {
    if (!confirm('¿Estás seguro de REINICIAR el Sandbox? Se borrarán todos los componentes, cables y escenarios creados en las tablas sandbox_*.')) {
      return;
    }

    setResetting(true);
    try {
      await supabase.from('sandbox_composite_cable_bundles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sandbox_hardware_components').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sandbox_cable_types').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sandbox_scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setSandboxComponents([]);
      setSandboxCables([]);
      setSandboxScenarios([]);
      alert('Sandbox reiniciado con éxito. Todas las tablas sandbox_* están totalmente vacías.');
    } catch (error: any) {
      alert('Aviso al reiniciar: ' + (error.message || 'Operación realizada'));
    }
    setResetting(false);
  };

  // Upload SVG al bucket exclusivo 'sandbox-hardware-components'
  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `sandbox-${Date.now()}.${fileExt}`;
    const filePath = `svgs/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('sandbox-hardware-components')
      .upload(filePath, file);

    if (uploadErr) {
      alert('Error subiendo SVG al bucket sandbox: ' + uploadErr.message);
    } else {
      const { data } = supabase.storage
        .from('sandbox-hardware-components')
        .getPublicUrl(filePath);
      setSvgUrl(data.publicUrl);
    }
    setUploading(false);
  };

  // Crear componente en sandbox_hardware_components
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand) return;

    const payload = {
      name,
      brand,
      category,
      svg_url: svgUrl,
      terminals,
      is_active: true
    };

    const { error } = await supabase
      .from('sandbox_hardware_components')
      .insert([payload]);

    if (error) {
      alert('Error guardando en sandbox_hardware_components: ' + error.message);
    } else {
      setIsCompModalOpen(false);
      setName('');
      setBrand('');
      setSvgUrl('');
      setTerminals([]);
      loadSandboxData();
    }
  };

  // Crear cable en sandbox_cable_types
  const handleSaveCable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cableName) return;

    const defaultConductors = Array.from({ length: cableConductorCount }).map((_, i) => ({
      position: i + 1,
      color_name: i === 0 ? 'Red' : i === 1 ? 'Black' : i === 2 ? 'Green' : 'White',
      color_hex: i === 0 ? '#dc2626' : i === 1 ? '#1e1e1e' : i === 2 ? '#16a34a' : '#f8fafc',
      function: i === 0 ? 'positive' : i === 1 ? 'negative' : 'signal'
    }));

    const { error } = await supabase
      .from('sandbox_cable_types')
      .insert([{
        name: cableName,
        gauge: cableGauge,
        conductor_count: cableConductorCount,
        is_shielded: cableIsShielded,
        conductors: defaultConductors
      }]);

    if (error) {
      alert('Error guardando en sandbox_cable_types: ' + error.message);
    } else {
      setIsCableModalOpen(false);
      setCableName('');
      loadSandboxData();
    }
  };

  // Crear escenario en sandbox_scenarios
  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioTitle) return;

    const { error } = await supabase
      .from('sandbox_scenarios')
      .insert([{
        title: scenarioTitle,
        description: scenarioDesc,
        difficulty_level: 1,
        type: 'guided',
        is_published: true
      }]);

    if (error) {
      alert('Error guardando en sandbox_scenarios: ' + error.message);
    } else {
      setScenarioTitle('');
      setScenarioDesc('');
      loadSandboxData();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ⚠️ Banner Amarillo de Advertencia Visual */}
      <div className="bg-amber-500/15 border-2 border-amber-500 text-amber-900 dark:text-amber-200 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow font-extrabold flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-wide uppercase">
              ENTORNO DE PRUEBAS — SANDBOX AISLADO
            </h2>
            <p className="text-xs opacity-90 font-medium mt-0.5">
              Los cambios, componentes y cableados realizados aquí leen y escriben exclusivamente en las tablas <code className="font-mono bg-amber-500/20 px-1 rounded">sandbox_*</code>. NO afectan el simulador de producción.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSandbox}
          disabled={resetting}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all flex-shrink-0"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>Reiniciar Sandbox</span>
        </button>
      </div>

      {/* Canvas del Simulador Sandbox (IHS y Componentes Aislados) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Canvas de Experimentos Sandbox
          </h3>
          <span className="text-xs font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
            store: useSimulatorSandboxStore
          </span>
        </div>

        <SimulatorCanvas mode="edit" />
      </div>

      {/* 📚 Biblioteca de Experimentos Aislada (/admin/sandbox) */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-amber-500" />
              Biblioteca de Pruebas Sandbox
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Agrega componentes, cables y escenarios de prueba exclusivos para sandbox_*
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'components' && (
              <>
                <button
                  onClick={() => {
                    addNode({
                      id: `multimeter-${Date.now()}`,
                      type: 'multimeter',
                      position: { x: Math.random() * 200 + 150, y: Math.random() * 100 + 100 },
                      data: { label: 'Multímetro Digital' }
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Multímetro al Canvas</span>
                </button>
                <button
                  onClick={() => setIsCompModalOpen(true)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Componente Sandbox</span>
                </button>
              </>
            )}

            {activeTab === 'cables' && (
              <button
                onClick={() => setIsCableModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Cable Sandbox</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('components')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              activeTab === 'components'
                ? 'bg-amber-500 text-slate-950 font-extrabold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Componentes Sandbox ({sandboxComponents.length})
          </button>
          
          <button
            onClick={() => setActiveTab('cables')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              activeTab === 'cables'
                ? 'bg-emerald-500 text-slate-950 font-extrabold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tipos de Cable Sandbox ({sandboxCables.length})
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              activeTab === 'scenarios'
                ? 'bg-indigo-500 text-white font-extrabold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Escenarios Sandbox ({sandboxScenarios.length})
          </button>
        </div>

        {/* Tab 1: Componentes Sandbox */}
        {activeTab === 'components' && (
          <div>
            {sandboxComponents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No hay componentes en <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">sandbox_hardware_components</code>. ¡Crea el primero!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sandboxComponents.map((comp) => (
                  <div key={comp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{comp.name}</span>
                      <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold">{comp.brand}</span>
                    </div>
                    <p className="text-xs text-slate-500">{CATEGORY_LABELS[comp.category] || comp.category}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Estás seguro de eliminar el componente '${comp.brand} ${comp.name}' de la base de datos de experimentos?`)) {
                              const { error } = await supabase
                                .from('sandbox_hardware_components')
                                .delete()
                                .eq('id', comp.id);
                              if (error) {
                                alert('Error al borrar componente: ' + error.message);
                              } else {
                                loadSandboxData();
                              }
                            }
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                          title="Eliminar de la Base de Datos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddComponentToCanvas(comp)}
                          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded font-bold transition"
                          title="Probar este componente en el Canvas"
                        >
                          Añadir al Canvas
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cables Sandbox */}
        {activeTab === 'cables' && (
          <div>
            {sandboxCables.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No hay cables en <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">sandbox_cable_types</code>. ¡Crea uno de prueba!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sandboxCables.map((cable) => (
                  <div key={cable.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{cable.name}</span>
                      <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">AWG {cable.gauge}</span>
                    </div>
                    <p className="text-xs text-slate-500">{cable.conductor_count} Conductores</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Escenarios Sandbox */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveScenario} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Crear Escenario de Prueba Exclusivo en Sandbox</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Título del escenario de prueba..."
                  value={scenarioTitle}
                  onChange={(e) => setScenarioTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Descripción rápida..."
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Guardar en sandbox_scenarios
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sandboxScenarios.map((sc) => (
                <div key={sc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{sc.title}</h5>
                  <p className="text-xs text-slate-500">{sc.description || 'Sin descripción'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Componente Sandbox */}
      {isCompModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Crear Componente en sandbox_hardware_components</h3>
            <form onSubmit={handleSaveComponent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subir SVG a bucket sandbox-hardware-components</label>
                <input
                  type="file"
                  accept=".svg"
                  onChange={handleSvgUpload}
                  className="w-full text-xs text-slate-500 mt-1"
                />
                {uploading && <span className="text-xs text-amber-500">Subiendo SVG al bucket sandbox...</span>}
              </div>

              <TerminalEditor
                svgUrl={svgUrl}
                terminals={terminals}
                onChange={(updated) => setTerminals(updated)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500"
                >
                  Guardar en Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Cable Sandbox */}
      {isCableModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Crear Tipo de Cable en sandbox_cable_types</h3>
            <form onSubmit={handleSaveCable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre de Cable</label>
                <input
                  type="text"
                  placeholder="Ej. 18/2 Test Sandbox"
                  value={cableName}
                  onChange={(e) => setCableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Calibre AWG</label>
                  <input
                    type="number"
                    value={cableGauge}
                    onChange={(e) => setCableGauge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Números de Hilo</label>
                  <input
                    type="number"
                    value={cableConductorCount}
                    onChange={(e) => setCableConductorCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Guardar en Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
