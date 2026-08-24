"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, HardwareCategory, CATEGORY_LABELS, PRESET_SANDBOX_COMPONENTS } from '@/types/hardware';
import { CableType, CompositeCableBundle } from '@/types/cable';
import { seedCableTypes, SEED_CABLE_TYPES } from '@/lib/cableSeed';
import TerminalEditor from '@/components/admin/TerminalEditor';
import { 
  Plus, 
  Upload, 
  Search, 
  Cpu, 
  Zap, 
  Lock, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2,
  FileCode,
  Layers,
  Disc,
  Shield,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Save
} from 'lucide-react';

import { useI18n } from '@/hooks/useI18n';

export default function HardwareLibraryPage() {
  const supabase = createClient();
  const { t } = useI18n();

  const [components, setComponents] = useState<HardwareComponent[]>([]);
  const [cableTypes, setCableTypes] = useState<CableType[]>([]);
  const [compositeBundles, setCompositeBundles] = useState<CompositeCableBundle[]>([]);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'cables'>('components');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // State para edición de puertos en pantalla completa
  const [editingComponent, setEditingComponent] = useState<HardwareComponent | null>(null);
  const [editingTerminals, setEditingTerminals] = useState<any[]>([]);
  const [zoomScale, setZoomScale] = useState<number>(1.5);

  useEffect(() => {
    if (editingComponent) {
      setEditingTerminals(editingComponent.terminals || []);
      setZoomScale(1.5);
    }
  }, [editingComponent]);
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields para hardware_components
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<HardwareCategory>('power_supply');
  const [svgUrl, setSvgUrl] = useState('');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [requiredCableTypeIds, setRequiredCableTypeIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields para nuevo cable_type
  const [isCableModalOpen, setIsCableModalOpen] = useState(false);
  const [cableName, setCableName] = useState('');
  const [cableGauge, setCableGauge] = useState(18);
  const [cableConductorCount, setCableConductorCount] = useState(2);
  const [cableIsShielded, setCableIsShielded] = useState(false);
  const [cableIsComposite, setCableIsComposite] = useState(false);

  const fetchComponents = async () => {
    setLoading(true);
    let allComps: HardwareComponent[] = [];

    // 1. Cargar desde sandbox_hardware_components (Componentes IA / Sandbox)
    try {
      const { data: sData } = await supabase
        .from('sandbox_hardware_components')
        .select('*')
        .order('created_at', { ascending: false });
      if (sData && sData.length > 0) {
        allComps = [...allComps, ...(sData as HardwareComponent[])];
      }
    } catch (e) {}

    // 2. Cargar desde hardware_components
    try {
      const { data: hData } = await supabase
        .from('hardware_components')
        .select('*')
        .order('created_at', { ascending: false });
      if (hData && hData.length > 0) {
        allComps = [...allComps, ...(hData as HardwareComponent[])];
      }
    } catch (e) {}

    // 3. Cargar presets de PRESET_SANDBOX_COMPONENTS evitando duplicados y respetando los eliminados
    let deletedKeys: string[] = [];
    try {
      const savedDeleted = localStorage.getItem('deleted_library_component_ids');
      if (savedDeleted) deletedKeys = JSON.parse(savedDeleted);
    } catch (e) {}

    for (const preset of PRESET_SANDBOX_COMPONENTS) {
      const isDeleted = deletedKeys.includes(preset.id) || deletedKeys.includes(`${preset.brand}_${preset.name}`);
      if (!isDeleted) {
        if (!allComps.some(c => c.name === preset.name && c.brand === preset.brand)) {
          let presetWithSavedTerminals = { ...preset };
          try {
            const savedTerms = localStorage.getItem(`preset_terminals_${preset.id}`);
            if (savedTerms) {
              presetWithSavedTerminals.terminals = JSON.parse(savedTerms);
            }
          } catch (e) {}
          allComps.push(presetWithSavedTerminals as HardwareComponent);
        }
      }
    }

    // Filtrar cualquier componente eliminado de las tablas
    allComps = allComps.filter(c => !deletedKeys.includes(c.id) && !deletedKeys.includes(`${c.brand}_${c.name}`));

    setComponents(allComps);

    // Cargar o sembrar cable_types con fallback seguro en memoria si la tabla aún no existe en Supabase
    try {
      let { data: cables, error: cablesErr } = await supabase.from('cable_types').select('*').order('name');
      if (!cablesErr && cables && cables.length > 0) {
        setCableTypes(cables as CableType[]);
      } else if (!cablesErr) {
        const seeded = await seedCableTypes();
        setCableTypes(seeded as CableType[]);
        cables = seeded;
      } else {
        // Fallback local visual si la tabla Supabase no ha sido migrada aún en producción
        setCableTypes(SEED_CABLE_TYPES.map((c, idx) => ({ ...c, id: `local-${idx+1}`, created_at: new Date().toISOString() })) as any);
      }

      // Cargar los sub-cables de composite_cable_bundles
      const { data: bData } = await supabase
        .from('composite_cable_bundles')
        .select(`
          id,
          composite_cable_type_id,
          bundled_cable_type_id,
          bundle_jacket_color_name,
          bundle_jacket_color_hex,
          bundled_cable:cable_types!bundled_cable_type_id (*)
        `);

      if (bData && bData.length > 0) {
        setCompositeBundles(bData as any[]);
      } else if (cables && cables.length > 0) {
        // Generar bundles dinámicos locales mapeados para la visualización del Banana
        const banana = cables.find((c: any) => c.is_composite || c.name.includes('Banana'));
        if (banana) {
          const findCable = (n: string) => cables.find((c: any) => c.name === n);
          const fallbackBundles: CompositeCableBundle[] = [
            {
              id: 'fb-1',
              composite_cable_type_id: banana.id,
              bundled_cable_type_id: findCable('18/2')?.id || '',
              bundle_jacket_color_name: 'Gris (Poder)',
              bundle_jacket_color_hex: '#64748b',
              bundled_cable: findCable('18/2')
            },
            {
              id: 'fb-2',
              composite_cable_type_id: banana.id,
              bundled_cable_type_id: findCable('22/6 Shielded')?.id || '',
              bundle_jacket_color_name: 'Naranja (Lector)',
              bundle_jacket_color_hex: '#f97316',
              bundled_cable: findCable('22/6 Shielded')
            },
            {
              id: 'fb-3',
              composite_cable_type_id: banana.id,
              bundled_cable_type_id: findCable('18/4')?.id || '',
              bundle_jacket_color_name: 'Blanco (Contacto)',
              bundle_jacket_color_hex: '#f8fafc',
              bundled_cable: findCable('18/4')
            },
            {
              id: 'fb-4',
              composite_cable_type_id: banana.id,
              bundled_cable_type_id: findCable('22/4')?.id || '',
              bundle_jacket_color_name: 'Azul (REX)',
              bundle_jacket_color_hex: '#3b82f6',
              bundled_cable: findCable('22/4')
            }
          ];
          setCompositeBundles(fallbackBundles);
        }
      }
    } catch (e) {
      setCableTypes(SEED_CABLE_TYPES.map((c, idx) => ({ ...c, id: `local-${idx+1}`, created_at: new Date().toISOString() })) as any);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const resetForm = () => {
    setName('');
    setBrand('');
    setCategory('power_supply');
    setSvgUrl('');
    setTerminals([]);
    setRequiredCableTypeIds([]);
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: HardwareComponent) => {
    setEditingId(comp.id);
    setName(comp.name);
    setBrand(comp.brand);
    setCategory(comp.category);
    setSvgUrl(comp.svg_url);
    setTerminals(comp.terminals || []);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `svgs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('hardware-components')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      alert('Error subiendo archivo SVG: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('hardware-components')
      .getPublicUrl(filePath);

    setSvgUrl(publicUrlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand || !svgUrl) {
      alert('Por favor completa todos los campos requeridos y sube un SVG.');
      return;
    }

    setSaving(true);
    const payload = {
      name,
      brand,
      category,
      svg_url: svgUrl,
      terminals,
      required_cable_type_ids: requiredCableTypeIds,
      is_active: true
    };

    if (editingId) {
      const { error } = await supabase
        .from('hardware_components')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert('Error al actualizar componente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchComponents();
      }
    } else {
      const { error } = await supabase
        .from('hardware_components')
        .insert([payload]);

      if (error) {
        alert('Error al crear componente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchComponents();
      }
    }
    setSaving(false);
  };

  const handleSaveCableType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cableName) return;

    // Generar conductores básicos por defecto según número
    const defaultConductors = Array.from({ length: cableConductorCount }).map((_, i) => ({
      position: i + 1,
      color_name: i === 0 ? 'Red' : i === 1 ? 'Black' : i === 2 ? 'Green' : 'White',
      color_hex: i === 0 ? '#dc2626' : i === 1 ? '#1e1e1e' : i === 2 ? '#16a34a' : '#f8fafc',
      function: i === 0 ? 'positive' : i === 1 ? 'negative' : 'signal'
    }));

    const newCableObj = {
      id: `local-${Date.now()}`,
      name: cableName,
      gauge: cableGauge,
      conductor_count: cableConductorCount,
      is_shielded: cableIsShielded,
      is_composite: cableIsComposite,
      conductors: defaultConductors,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('cable_types').insert([{
      name: cableName,
      gauge: cableGauge,
      conductor_count: cableConductorCount,
      is_shielded: cableIsShielded,
      is_composite: cableIsComposite,
      conductors: defaultConductors
    }]);

    if (error) {
      if (error.message.includes("Could not find the table")) {
        // Guardar localmente en el estado actual para no bloquear al usuario en el cliente
        setCableTypes(prev => [...prev, newCableObj as any]);
        setIsCableModalOpen(false);
        setCableName('');
        alert('Nota: La tabla "cable_types" aún requiere la migración SQL en Supabase. El cable fue agregado temporalmente en tu sesión local para pruebas.');
        return;
      }
      alert('Error guardando tipo de cable: ' + error.message);
    } else {
      setIsCableModalOpen(false);
      setCableName('');
      fetchComponents();
    }
  };

  const handleToggleActive = async (comp: HardwareComponent) => {
    const { error } = await supabase
      .from('hardware_components')
      .update({ is_active: !comp.is_active })
      .eq('id', comp.id);

    if (!error) {
      fetchComponents();
    }
  };

  const handleDeleteComponent = async (comp: HardwareComponent) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${comp.name}" de la biblioteca?`);
    if (!confirmDelete) return;

    // Registrar en la lista de eliminados permanentes
    try {
      let deleted: string[] = [];
      const saved = localStorage.getItem('deleted_library_component_ids');
      if (saved) deleted = JSON.parse(saved);
      if (!deleted.includes(comp.id)) deleted.push(comp.id);
      const brandNameKey = `${comp.brand}_${comp.name}`;
      if (!deleted.includes(brandNameKey)) deleted.push(brandNameKey);
      localStorage.setItem('deleted_library_component_ids', JSON.stringify(deleted));
    } catch (e) {}

    // Filtrarlo de inmediato del estado
    setComponents(prev => prev.filter(c => c.id !== comp.id && !(c.name === comp.name && c.brand === comp.brand)));

    // Intentar eliminar de la base de datos Supabase (ambas tablas)
    try {
      await supabase.from('hardware_components').delete().eq('id', comp.id);
      await supabase.from('sandbox_hardware_components').delete().eq('id', comp.id);
    } catch (e) {
      console.warn('Error en delete request:', e);
    }
  };

  const filteredComponents = components.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header de la Biblioteca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="w-8 h-8 text-indigo-500" />
            {t.dashboard.libraryTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.librarySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'components' ? (
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.dashboard.addComponent}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCableModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.dashboard.newCableType}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación (Componentes / Tipos de Cable) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('components')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'components'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{t.dashboard.componentsTab} ({components.length})</span>
          {activeTab === 'components' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('cables')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'cables'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>{t.dashboard.cablesTab} ({cableTypes.length})</span>
          {activeTab === 'cables' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Contenido Principal por Pestaña */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          {/* Controles de Búsqueda y Filtro de Categoría */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.dashboard.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t.dashboard.allCategories}</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>{label}</option>
              ))}
            </select>
          </div>

          {/* Lista de Componentes */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm font-mono animate-pulse">
              {t.common.loading}
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
              <Cpu className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t.admin.noComponents}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComponents.map((comp) => (
                <div 
                  key={comp.id}
                  className={`bg-white dark:bg-[#141c2e] border rounded-2xl p-5 space-y-4 shadow-md transition-all ${
                    comp.is_active ? 'border-slate-200 dark:border-slate-800' : 'border-red-400/40 opacity-75'
                  }`}
                >
                  <div className="h-44 bg-slate-900/90 rounded-xl p-3 flex items-center justify-center relative overflow-hidden border border-slate-800">
                    {comp.svg_url ? (
                      <img src={comp.svg_url} alt={comp.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <FileCode className="w-10 h-10 text-slate-600" />
                    )}
                    <span className="absolute top-2 left-2 text-[10px] font-mono font-bold bg-slate-950/80 px-2 py-0.5 rounded text-emerald-400 border border-slate-800">
                      {comp.brand}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{comp.name}</h3>
                    <p className="text-xs text-indigo-500 font-semibold">{CATEGORY_LABELS[comp.category]}</p>
                    <p className="text-[11px] font-mono text-slate-400 pt-1">
                      {t.dashboard.terminalsLabel}: <span className="text-emerald-400 font-bold">{comp.terminals?.length || 0}</span> | 
                      {t.dashboard.allowedCables}: <span className="text-amber-400 font-bold">{comp.required_cable_type_ids?.length || 0}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDeleteComponent(comp)}
                      className="text-xs font-semibold flex items-center gap-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-500/10"
                      title="Eliminar este componente de la biblioteca"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span>{t.common.delete}</span>
                    </button>

                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => setEditingComponent(comp)}
                        className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        title="Editar puntos de conexión (SVG)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.admin.editPorts}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.dashboard.edit}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIPOS DE CABLE */}
      {activeTab === 'cables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {cableTypes.map((cable) => (
            <div 
              key={cable.id}
              className="bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-md"
            >
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{cable.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {cable.is_composite ? t.admin.compositeCable : `AWG ${cable.gauge} • ${cable.conductor_count} Conductores`}
                  </p>
                </div>
                {cable.is_shielded && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> {t.admin.shielded}
                  </span>
                )}
              </div>

              {/* Condicional: Renderizado de Sub-cables Agrupados cuando es Cable Compuesto (Banana) */}
              {cable.is_composite ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5" />
                    <span>{t.dashboard.includedSubcables} ({compositeBundles.filter(b => b.composite_cable_type_id === cable.id || cable.name.includes('Banana')).length})</span>
                  </label>
                  
                  <div className="space-y-2">
                    {compositeBundles
                      .filter(b => b.composite_cable_type_id === cable.id || cable.name.includes('Banana'))
                      .map((bundle, idx) => {
                        const isExpanded = expandedBundleId === (bundle.id || `bundle-${idx}`);
                        const subCable = bundle.bundled_cable;
                        
                        return (
                          <div 
                            key={bundle.id || idx}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span 
                                  style={{ backgroundColor: bundle.bundle_jacket_color_hex }} 
                                  className="w-3.5 h-3.5 rounded-full border border-slate-900 shadow-sm flex-shrink-0"
                                  title={bundle.bundle_jacket_color_name}
                                />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {bundle.bundle_jacket_color_name}
                                </span>
                                {subCable && (
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    ({subCable.name})
                                  </span>
                                )}
                              </div>

                              {subCable && subCable.conductors && subCable.conductors.length > 0 && (
                                <button
                                  onClick={() => setExpandedBundleId(isExpanded ? null : (bundle.id || `bundle-${idx}`))}
                                  className="text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-colors"
                                  title="Ver conductores internos"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              )}
                            </div>

                            {/* Desglose Expandible de Conductores Internos del Sub-Cable */}
                            {isExpanded && subCable && subCable.conductors && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-1.5 animate-fadeIn">
                                {subCable.conductors.map((c, cIdx) => (
                                  <div 
                                    key={cIdx} 
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-950 border text-[10px] font-mono"
                                  >
                                    <span style={{ backgroundColor: c.color_hex }} className="w-2 h-2 rounded-full border border-slate-900" />
                                    <span className="text-slate-700 dark:text-slate-300 truncate">{c.color_name}</span>
                                    <span className="text-[9px] text-slate-400 font-sans ml-auto">({c.function})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                /* Conductores para Cables Simples */
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.dashboard.internalConductors}:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {cable.conductors && cable.conductors.map((c, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono"
                      >
                        <span style={{ backgroundColor: c.color_hex }} className="w-2.5 h-2.5 rounded-full border border-slate-950" />
                        <span>{c.color_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal / Formulario de Registro o Edición de Componente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {editingId ? t.admin.editHardwareComponent : t.admin.addNewComponent}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.admin.componentName}</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.admin.brandManufacturer}</label>
                  <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.admin.category}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as HardwareCategory)} className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de Tipos de Cable Permitidos (required_cable_type_ids) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.admin.allowedCablesForComponent}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {cableTypes.map((c) => {
                    const isSelected = requiredCableTypeIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRequiredCableTypeIds(requiredCableTypeIds.filter(id => id !== c.id));
                          } else {
                            setRequiredCableTypeIds([...requiredCableTypeIds, c.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carga de SVG */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.admin.svgFile}</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    <span>{uploading ? t.admin.uploading : t.admin.uploadSvg}</span>
                    <input type="file" accept=".svg" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                  <input type="text" value={svgUrl} onChange={(e) => setSvgUrl(e.target.value)} placeholder={t.admin.svgUrl} className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono" />
                </div>
              </div>

              {svgUrl && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <TerminalEditor svgUrl={svgUrl} terminals={terminals} onChange={(updated) => setTerminals(updated)} />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">{t.common.cancel}</button>
                <button type="submit" disabled={saving || !svgUrl} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs">
                  {saving ? t.admin.saving : editingId ? t.admin.saveChanges : t.admin.createComponent}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Cable Type */}
      {isCableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.dashboard.newCableType}</h3>
              <button onClick={() => setIsCableModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCableType} className="space-y-4 text-xs">
              <div>
                <label className="font-bold">{t.admin.cableName}</label>
                <input type="text" required value={cableName} onChange={(e) => setCableName(e.target.value)} placeholder="ej. 18/2, 22/4" className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold">{t.admin.gaugeAwg}</label>
                  <input type="number" value={cableGauge} onChange={(e) => setCableGauge(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="font-bold">{t.admin.conductorCount}</label>
                  <input type="number" value={cableConductorCount} onChange={(e) => setCableConductorCount(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={cableIsShielded} onChange={(e) => setCableIsShielded(e.target.checked)} className="rounded" />
                  <span>{t.admin.shielded}</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCableModalOpen(false)} className="px-4 py-2 rounded-xl border">{t.common.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold">{t.admin.saveCable}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FULLSCREEN EDICIÓN DE PUERTOS SVG EN BIBLIOTECA */}
      {editingComponent && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-6 flex flex-col h-screen w-screen overflow-hidden text-slate-100">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/30">
                <Maximize2 className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-white">{t.admin.fullscreenPortEditor}</h2>
                <p className="text-xs text-slate-400">{editingComponent.brand} {editingComponent.name} • {editingTerminals.length} {t.admin.connectionPorts}</p>
              </div>
            </div>
            
            {/* Controles de Zoom */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400 font-bold mr-1">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(0.8, Math.round((prev - 0.25) * 100) / 100))}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-extrabold flex items-center justify-center text-sm transition"
                title={t.admin.zoomOut}
              >
                −
              </button>
              <span className="text-xs font-mono font-extrabold text-amber-400 w-14 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(3.5, Math.round((prev + 0.25) * 100) / 100))}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-extrabold flex items-center justify-center text-sm transition"
                title={t.admin.zoomIn}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1.0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md ml-1 transition"
                title={t.admin.originalSize}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(2.0)}
                className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold rounded-md transition"
                title="Zoom 200% para detalles"
              >
                200%
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (editingComponent.id.startsWith('preset-')) {
                    localStorage.setItem(`preset_terminals_${editingComponent.id}`, JSON.stringify(editingTerminals));
                  } else {
                    await supabase
                      .from('sandbox_hardware_components')
                      .update({ terminals: editingTerminals })
                      .eq('id', editingComponent.id);

                    await supabase
                      .from('hardware_components')
                      .update({ terminals: editingTerminals })
                      .eq('id', editingComponent.id);
                  }
                  alert('¡Puertos de conexión actualizados correctamente!');
                  setEditingComponent(null);
                  fetchComponents();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition"
              >
                <Save className="w-4 h-4" />
                <span>{t.admin.saveChanges}</span>
              </button>
              <button
                onClick={() => setEditingComponent(null)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                <Minimize2 className="w-4 h-4" />
                <span>{t.common.close}</span>
              </button>
            </div>
          </div>

          {/* Workspace Grid */}
          <div className="grid grid-cols-12 gap-6 flex-1 h-[calc(100vh-120px)] overflow-hidden">
            {/* Gran Lienzo SVG Interactivo con Zoom y Scroll */}
            <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full relative select-none overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800/80 text-[11px] font-mono text-emerald-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Haz clic en los bornes para añadir puertos o arrastra los pines. Usa el zoom si las letras están pequeñas.</span>
                </span>
                <span className="text-slate-400">{t.admin.scale} {Math.round(zoomScale * 100)}%</span>
              </div>
              
              <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-6 bg-slate-950/60 rounded-xl border border-slate-800/50">
                <div 
                  className="relative select-none shadow-2xl block p-0 m-auto cursor-crosshair transition-[width,height] duration-150"
                  style={{ 
                    width: `${(editingComponent.default_width || 600) * zoomScale}px`,
                    maxWidth: 'none',
                    aspectRatio: `${editingComponent.default_width || 600}/${editingComponent.default_height || 750}`
                  }}
                  onClick={(e) => {
                    const container = e.currentTarget;
                    const rect = container.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
                    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
                    const newTerm = {
                      id: `term_${Date.now()}`,
                      label: `TERM_${editingTerminals.length + 1}`,
                      x,
                      y,
                      type: 'signal' as const,
                      color: 'white'
                    };
                    setEditingTerminals(prev => [...prev, newTerm]);
                  }}
                  onMouseMove={(e) => {
                    const draggingId = (window as any).__draggingTerminalId;
                    if (!draggingId) return;
                    const container = e.currentTarget;
                    const rect = container.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
                    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
                    setEditingTerminals(prev => prev.map(t => t.id === draggingId ? { ...t, x, y } : t));
                  }}
                  onMouseUp={() => { (window as any).__draggingTerminalId = null; }}
                  onMouseLeave={() => { (window as any).__draggingTerminalId = null; }}
                >
                  {editingComponent.svg_url ? (
                    <img 
                      src={editingComponent.svg_url} 
                      alt={editingComponent.name} 
                      className="w-full h-full block pointer-events-none p-0 m-0 select-none shadow-2xl rounded" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 rounded flex items-center justify-center text-xs text-slate-400">{t.admin.noSvg}</div>
                  )}
                  {editingTerminals.map(t => (
                    <div
                      key={t.id}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        (window as any).__draggingTerminalId = t.id;
                      }}
                      className={`absolute border-2 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl flex items-center justify-center z-40 cursor-grab active:cursor-grabbing hover:scale-150 transition-all ${
                        t.type === 'positive' ? 'bg-red-500 border-white ring-2 ring-red-500/40' : t.type === 'negative' ? 'bg-slate-900 border-white ring-2 ring-slate-800' : 'bg-emerald-500 border-white ring-2 ring-emerald-500/40'
                      }`}
                      style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        width: `${Math.max(12, 14 * Math.min(1.5, zoomScale))}px`,
                        height: `${Math.max(12, 14 * Math.min(1.5, zoomScale))}px`
                      }}
                      title={`Arrastra para reubicar ${t.label} (Pos: ${t.x}%, ${t.y}%)`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Panel Lateral de Edición de Coordenadas */}
            <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-full overflow-hidden space-y-4 shadow-xl">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                      {t.admin.ports} ({editingTerminals.length})
                    </h4>
                    <span className="text-[10px] text-indigo-400 font-mono">Arrastra o edita coordenadas</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTerm = {
                        id: `term_${Date.now()}`,
                        label: `TERM_${editingTerminals.length + 1}`,
                        x: 50,
                        y: 50,
                        type: 'signal' as const,
                        color: 'white'
                      };
                      setEditingTerminals(prev => [...prev, newTerm]);
                    }}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.admin.addPort}</span>
                  </button>
                </div>
                {editingTerminals.map(term => (
                  <div key={term.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={term.label}
                          placeholder={t.admin.terminalLabel}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            setEditingTerminals(prev => prev.map(t => t.id === term.id ? { ...t, label: newLabel } : t));
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-bold text-white rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                        <select
                          value={term.type || 'signal'}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            setEditingTerminals(prev => prev.map(t => t.id === term.id ? { ...t, type: newType } : t));
                          }}
                          className="bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="signal">{t.admin.signal}</option>
                          <option value="positive">{t.admin.positive}</option>
                          <option value="negative">{t.admin.negative}</option>
                        </select>
                      </div>
                      <div className="flex gap-3 items-center text-[11px] font-mono text-slate-400">
                        <span>X%:</span>
                        <input 
                          type="number" 
                          value={term.x}
                          step="0.1"
                          onChange={(e) => {
                            const newX = Number(e.target.value);
                            setEditingTerminals(prev => prev.map(t => t.id === term.id ? { ...t, x: newX } : t));
                          }}
                          className="w-16 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-bold"
                        />
                        <span>Y%:</span>
                        <input 
                          type="number" 
                          value={term.y}
                          step="0.1"
                          onChange={(e) => {
                            const newY = Number(e.target.value);
                            setEditingTerminals(prev => prev.map(t => t.id === term.id ? { ...t, y: newY } : t));
                          }}
                          className="w-16 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingTerminals(prev => prev.filter(t => t.id !== term.id))}
                      className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="Eliminar puerto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
