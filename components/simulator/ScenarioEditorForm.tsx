"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { saveScenarioAction } from '@/app/admin/escenarios/actions';
import { useI18n } from '@/hooks/useI18n';
import SimulatorCanvas from '@/components/simulator-sandbox/SimulatorCanvas';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';

export default function ScenarioEditorForm({
  scenario,
}: {
  scenario: any | null; // null si es nuevo
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(scenario?.title || '');
  const [description, setDescription] = useState(scenario?.description || '');
  const [type, setType] = useState<string>(scenario?.type || 'guided');
  const [difficulty, setDifficulty] = useState<number>(scenario?.difficulty_level || 1);
  const [saving, setSaving] = useState(false);

  // Hardware y cableado inicial del escenario (si se está editando)
  const initialNodes = scenario?.hardware_config?.nodes || [];
  const initialEdges =
    scenario?.hardware_config?.initial_wiring || scenario?.fault_injection?.wiring || [];

  const typeLabels: Record<string, string> = {
    guided: t.creator.typeGuided,
    diagnostic: t.creator.typeDiagnostic,
    sandbox: t.creator.typeFree,
  };

  const handleSubmitForm = async (publishedState: boolean) => {
    setSaving(true);
    try {
      // Leer el estado real del canvas (nodos y cableado trazado)
      const { nodes, edges } = useSimulatorSandboxStore.getState();

      const formData = new FormData();
      if (scenario?.id) {
        formData.append('id', scenario.id);
      }
      formData.append('title', title || t.creator.newSandboxScenario);
      formData.append('description', description || t.creator.sandboxTestScenario);
      formData.append('type', type);
      formData.append('difficulty_level', difficulty.toString());
      formData.append('is_published', publishedState.toString());
      formData.append('nodesJson', JSON.stringify(nodes));
      formData.append('edgesJson', JSON.stringify(edges));
      formData.append('faultWiringJson', JSON.stringify([]));

      await saveScenarioAction(formData);
      alert(t.creator.savedOk);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || t.creator.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-900 overflow-hidden">
      {/* Header Compacto del Creador de Escenarios */}
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

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.creator.scenarioDescription}
            className="bg-slate-900 border border-slate-700 text-slate-300 font-medium px-3 py-1.5 rounded-lg text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 hidden lg:block"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 font-semibold px-2 py-1.5 rounded-lg text-xs focus:outline-none hidden md:block"
          >
            {['guided', 'diagnostic', 'sandbox'].map((tp) => (
              <option key={tp} value={tp}>{typeLabels[tp]}</option>
            ))}
          </select>

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

      {/* Editor de escenarios: canvas React Flow (motor eléctrico real) */}
      <div className="flex-1 w-full h-full relative">
        <SimulatorCanvas
          mode="edit"
          initialNodes={initialNodes}
          initialEdges={initialEdges}
        />
      </div>
    </div>
  );
}
