"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HardwareComponent, HardwareCategory, CATEGORY_LABELS } from '@/types/hardware';
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
  ChevronUp
} from 'lucide-react';

import { Language, translations } from '@/lib/i18n';

export default function HardwareLibraryPage() {
  const supabase = createClient();
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang);
    }

    const handleLangChange = () => {
      const current = localStorage.getItem('app_lang') as Language;
      if (current === 'en' || current === 'es') {
        setLang(current);
      }
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = translations[lang].dashboard;

  const [components, setComponents] = useState<HardwareComponent[]>([]);
  const [cableTypes, setCableTypes] = useState<CableType[]>([]);
  const [compositeBundles, setCompositeBundles] = useState<CompositeCableBundle[]>([]);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'cables'>('components');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
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
    const { data, error } = await supabase
      .from('hardware_components')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComponents(data as HardwareComponent[]);
    }

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
            {t.libraryTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.librarySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'components' ? (
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addComponent}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCableModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newCableType}</span>
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
          <span>{t.componentsTab} ({components.length})</span>
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
          <span>{t.cablesTab} ({cableTypes.length})</span>
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
                placeholder={t.searchPlaceholder}
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
              <option value="all">{t.allCategories}</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>{label}</option>
              ))}
            </select>
          </div>

          {/* Lista de Componentes */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm font-mono animate-pulse">
              Cargando catálogo de hardware...
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
              <Cpu className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No hay componentes registrados</h3>
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
                      Terminales: <span className="text-emerald-400 font-bold">{comp.terminals?.length || 0}</span> | 
                      Cables permitidos: <span className="text-amber-400 font-bold">{comp.required_cable_type_ids?.length || 0}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(comp)}
                      className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                        comp.is_active ? 'text-slate-500 hover:text-red-500' : 'text-emerald-500 hover:text-emerald-400'
                      }`}
                    >
                      {comp.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{comp.is_active ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
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
                    {cable.is_composite ? 'Cable Compuesto / Banana' : `AWG ${cable.gauge} • ${cable.conductor_count} Conductores`}
                  </p>
                </div>
                {cable.is_shielded && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Shielded
                  </span>
                )}
              </div>

              {/* Condicional: Renderizado de Sub-cables Agrupados cuando es Cable Compuesto (Banana) */}
              {cable.is_composite ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5" />
                    <span>Sub-Cables Incluidos ({compositeBundles.filter(b => b.composite_cable_type_id === cable.id || cable.name.includes('Banana')).length})</span>
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conductores Internos:</label>
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
                {editingId ? 'Editar Componente de Hardware' : 'Agregar Nuevo Componente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre del Componente</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Marca / Fabricante</label>
                  <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoría</label>
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
                  <span>Tipos de Cable Permitidos para este Componente</span>
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Archivo SVG</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    <span>{uploading ? 'Subiendo...' : 'Subir SVG'}</span>
                    <input type="file" accept=".svg" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                  <input type="text" value={svgUrl} onChange={(e) => setSvgUrl(e.target.value)} placeholder="URL del SVG" className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono" />
                </div>
              </div>

              {svgUrl && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <TerminalEditor svgUrl={svgUrl} terminals={terminals} onChange={(updated) => setTerminals(updated)} />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">Cancelar</button>
                <button type="submit" disabled={saving || !svgUrl} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs">
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Componente'}
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
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Crear Nuevo Tipo de Cable</h3>
              <button onClick={() => setIsCableModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCableType} className="space-y-4 text-xs">
              <div>
                <label className="font-bold">Nombre del Cable</label>
                <input type="text" required value={cableName} onChange={(e) => setCableName(e.target.value)} placeholder="ej. 18/2, 22/4" className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold">Calibre (AWG)</label>
                  <input type="number" value={cableGauge} onChange={(e) => setCableGauge(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="font-bold">Num Conductores</label>
                  <input type="number" value={cableConductorCount} onChange={(e) => setCableConductorCount(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={cableIsShielded} onChange={(e) => setCableIsShielded(e.target.checked)} className="rounded" />
                  <span>Apantallado (Shielded)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCableModalOpen(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold">Guardar Cable</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
