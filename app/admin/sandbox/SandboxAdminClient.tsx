"use client";

import React, { useState } from 'react';
import { Layers, Sparkles } from 'lucide-react';

export default function SandboxAdminClient() {
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');

  return (
    <div className="w-full h-[calc(100vh-4.5rem)] flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Barra de pestañas para cambiar entre Sandbox V1 y Sandbox V2 */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVersion('v1')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              version === 'v1'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sandbox V1 (Actual)</span>
          </button>

          <button
            onClick={() => setVersion('v2')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              version === 'v2'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sandbox V2 (AccessLab Pro)</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline-block">
          {version === 'v1' ? '⚡ Motor Workbench V1' : '🌟 AccessLab Pro HD V2'}
        </span>
      </div>

      {/* Contenedor de la versión activa */}
      <div className="flex-1 w-full h-full relative">
        {version === 'v1' && (
          <iframe 
            src="/sandbox/index.html" 
            className="w-full h-full border-none" 
            title="AccessControl Lab Sandbox V1"
          />
        )}

        {version === 'v2' && (
          <iframe 
            src="/sandbox-v2/index.html" 
            className="w-full h-full border-none" 
            title="AccessLab Pro Sandbox V2"
          />
        )}
      </div>
    </div>
  );
}

