'use client';

import React from 'react';

export default function SimulatorAdminClient() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
      <iframe 
        src="/sandbox/index.html?view=simulator" 
        className="w-full h-full border-none" 
        title="AccessControl Lab Simulador"
      />
    </div>
  );
}
