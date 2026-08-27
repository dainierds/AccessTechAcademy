"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Save, Cpu, Layers } from 'lucide-react';
import { saveScenarioAction } from '@/app/admin/escenarios/actions';
import { useI18n } from '@/hooks/useI18n';

export default function ScenarioEditorForm({
  scenario,
}: {
  scenario: any | null; // null si es nuevo
}) {
  const { t } = useI18n();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [title, setTitle] = useState(scenario?.title || t.creator.newSandboxScenario);
  const [description, setDescription] = useState(scenario?.description || t.creator.sandboxTestScenario);
  const [type, setType] = useState<string>(scenario?.type || 'guided');
  const [difficulty, setDifficulty] = useState<number>(scenario?.difficulty_level || 1);
  const [saving, setSaving] = useState(false);

  // Escenario guardado (devices + cables) para cargarlo al editar
  const legacy = scenario?.hardware_config?.legacy;

  // Al cargar el iframe, inyectamos el escenario guardado en el editor legacy
  const handleIframeLoad = () => {
    if (!scenario?.id || !legacy) return; // solo al editar un escenario existente con datos
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: 'LOAD_EDITOR_SCENARIO',
        scenario: {
          name: title,
          devices: legacy.devices || [],
          cables: legacy.cables || [],
        },
      },
      '*'
    );
  };

  // Captura el escenario actual del editor legacy (mismo origen) para guardarlo
  const captureLegacyScenario = () => {
    try {
      const anyWin = iframeRef.current?.contentWindow as any;
      const editor = anyWin?.editor;
      if (editor && typeof editor.scenario === 'object' && editor.scenario) {
        return {
          name: editor.scenario.name || '',
          devices: editor.scenario.devices || [],
          cables: editor.scenario.cables || [],
        };
      }
    } catch (e) {}
    return null;
  };

  const handleSubmitForm = async (publishedState: boolean) => {
    setSaving(true);
    try {
      const legacy = captureLegacyScenario();
      const formData = new FormData();
      if (scenario?.id) {
        formData.append('id', scenario.id);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('difficulty_level', difficulty.toString());
      formData.append('is_published', publishedState.toString());
      formData.append('nodesJson', JSON.stringify([]));
      formData.append('edgesJson', JSON.stringify([]));
      formData.append('faultWiringJson', JSON.stringify([]));
      formData.append('legacyScenarioJson', JSON.stringify(legacy || {}));

      await saveScenarioAction(formData);
      alert(t.creator.savedOk);
    } catch (e: any) {
      console.error(e);
      alert(t.creator.savedLocally);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-900 overflow-hidden">
      {/* Header Compacto del Editor de Escenarios */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs shrink-0 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <Link
            href="/admin/escenarios"
            className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.sidebar.scenarios}</span>
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.creator.scenarioTitlePlaceholder}
            className="bg-slate-900 border border-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
            className="bg-slate-900 border border-slate-700 text-slate-300 font-semibold px-2 py-1.5 rounded-lg text-xs focus:outline-none hidden md:block"
          >
            {[1, 2, 3, 4, 5].map((lvl) => (
              <option key={lvl} value={lvl}>{t.common.level} {lvl}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmitForm(false)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.common.draft}</span>
          </button>
          
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmitForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.common.publish}</span>
          </button>
        </div>
      </div>

      {/* Editor Sandbox V1 en Pantalla Completa (Imagen 2) */}
      <div className="flex-1 w-full h-full relative">
        <iframe
          ref={iframeRef}
          src="/sandbox/index.html"
          className="w-full h-full border-none"
          title="Sandbox Workspace"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
