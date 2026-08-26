"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function ScenarioSimulationIframe({ scenario }: { scenario: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { t } = useI18n();

  const title = scenario?.title || '';
  const legacy = scenario?.hardware_config?.legacy;

  // Al cargar el iframe, enviamos el escenario del editor legacy a la vista Simulación
  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const sc = legacy || { name: title, devices: [], cables: [] };
    iframe.contentWindow.postMessage(
      {
        type: 'LOAD_SIM_SCENARIO',
        scenario: {
          name: title,
          devices: sc.devices || [],
          cables: sc.cables || [],
        },
      },
      '*'
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-900 overflow-hidden">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/simulador"
            className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.simulator.backToPanel}</span>
          </Link>
          <h1 className="font-bold text-white">{title}</h1>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold">
          ● {t.simulator.wiringSimTitle || 'Simulación'}
        </span>
      </div>

      {/* Sandbox legacy en vista Simulación */}
      <div className="flex-1 w-full h-full relative">
        <iframe
          ref={iframeRef}
          src="/sandbox/index.html?view=simulator"
          className="w-full h-full border-none"
          title="Simulación de Escenario"
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}
