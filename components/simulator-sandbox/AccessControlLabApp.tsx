'use client';

import React from 'react';

export default function AccessControlLabApp() {
  return (
    <div className="w-full h-screen bg-slate-100 dark:bg-slate-900">
      <iframe 
        src="/sandbox/index.html" 
        className="w-full h-full border-none" 
        title="AccessControl Lab Vanilla Simulator"
      />
    </div>
  );
}
