"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { saveCertificationLevelAction } from '@/app/admin/certificaciones/actions';
import { ArrowLeft, Save, Award, CheckSquare, Layers, ArrowUp, ArrowDown } from 'lucide-react';

export default function CertificationLevelEditorForm({
  level,
  scenarios,
  associatedScenarios,
}: {
  level: any | null; // null si es nuevo
  scenarios: any[];
  associatedScenarios: any[];
}) {
  const [levelNumber, setLevelNumber] = useState<number>(level?.level_number || 1);
  const [title, setTitle] = useState(level?.title || '');
  const [description, setDescription] = useState(level?.description || '');
  const [timeLimit, setTimeLimit] = useState<number>(level?.time_limit_minutes || 60);
  const [passingScore, setPassingScore] = useState<number>(level?.passing_score_percent || 80);
  
  // Lista ordenada de escenarios asignados
  const [selectedScenarios, setSelectedScenarios] = useState<any[]>(
    associatedScenarios.sort((a, b) => a.order_index - b.order_index).map((s) => s.scenario_id) || []
  );

  const handleToggleScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedScenarios];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setSelectedScenarios(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedScenarios.length - 1) return;
    const newOrder = [...selectedScenarios];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setSelectedScenarios(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScenarios.length === 0) {
      alert('Debes seleccionar al menos un escenario para este nivel.');
      return;
    }

    const formData = new FormData();
    if (level?.id) {
      formData.append('id', level.id);
    }
    formData.append('level_number', levelNumber.toString());
    formData.append('title', title);
    formData.append('description', description);
    formData.append('time_limit_minutes', timeLimit.toString());
    formData.append('passing_score_percent', passingScore.toString());
    formData.append('scenariosJson', JSON.stringify(selectedScenarios));

    try {
      await saveCertificationLevelAction(formData);
    } catch (err: any) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  const getScenarioTitle = (id: string) => {
    return scenarios.find((s) => s.id === id)?.title || 'Escenario Desconocido';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <Link href="/admin/certificaciones" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Certificaciones</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {level ? 'Editar Nivel de Certificación' : 'Nuevo Nivel de Certificación'}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configura los parámetros del examen y los escenarios que componen la evaluación.
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario Izquierdo: Configuración Básica */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <Award className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Configuración Básica</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Número de Nivel</label>
              <input
                type="number"
                required
                min={1}
                value={levelNumber}
                onChange={(e) => setLevelNumber(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: 1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Título del Examen</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: Cableado PACS Básico"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Detalla qué habilidades evalúa este examen..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiempo Límite (min)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aprobación (%)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel Selección Escenarios */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Listado disponible */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <CheckSquare className="w-5 h-5 text-purple-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Escenarios Disponibles</h3>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {scenarios.map((s) => {
                const isChecked = selectedScenarios.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{s.title}</span>
                      <span className="block text-[10px] text-slate-400 font-mono capitalize">{s.type} - Lvl {s.difficulty_level}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleScenario(s.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Listado asignado y orden */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Layers className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Orden de Examen</h3>
            </div>
            
            {selectedScenarios.length > 0 ? (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {selectedScenarios.map((sid, idx) => (
                  <div key={sid} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                    <div className="space-y-0.5">
                      <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">Paso {idx + 1}</span>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[140px] truncate">{getScenarioTitle(sid)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedScenarios.length - 1}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-slate-400 font-medium">
                Selecciona escenarios de la lista para agregarlos al orden del examen.
              </div>
            )}
          </div>

        </div>
      </div>
    </form>
  );
}

