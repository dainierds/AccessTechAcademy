"use client";

import React, { useState, useRef } from 'react';
import { HardwareTerminal, TerminalType, TERMINAL_TYPE_LABELS } from '@/types/hardware';
import { Plus, Trash2, Crosshair } from 'lucide-react';

interface TerminalEditorProps {
  svgUrl: string;
  terminals: HardwareTerminal[];
  onChange: (terminals: HardwareTerminal[]) => void;
}

export default function TerminalEditor({ svgUrl, terminals, onChange }: TerminalEditorProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    
    // Calcular porcentaje de posición relativo (0 - 100%)
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100;
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100;

    const newId = `term_${Date.now()}`;
    const newTerminal: HardwareTerminal = {
      id: newId,
      label: `TERM_${terminals.length + 1}`,
      x: xPct,
      y: yPct,
      type: 'signal'
    };

    const updated = [...terminals, newTerminal];
    onChange(updated);
    setSelectedTerminalId(newId);
  };

  const handleRemoveTerminal = (id: string) => {
    const updated = terminals.filter((t) => t.id !== id);
    onChange(updated);
    if (selectedTerminalId === id) setSelectedTerminalId(null);
  };

  const handleUpdateTerminal = (id: string, field: keyof HardwareTerminal, value: any) => {
    const updated = terminals.map((t) => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    });
    onChange(updated);
  };

  const getTerminalBadgeColor = (type: TerminalType) => {
    switch (type) {
      case 'positive': return 'bg-red-500 text-white border-red-600';
      case 'negative': return 'bg-slate-700 text-white border-slate-900';
      case 'signal': return 'bg-blue-500 text-white border-blue-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Columna de Previsualización Interactiva (Visual Pinning Canvas) */}
      <div className="lg:col-span-7 bg-[#0b0f19] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center">
        <div className="flex items-center justify-between w-full pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-emerald-500" />
            Haz clic en el SVG para marcar terminales
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {terminals.length} Terminales marcados
          </span>
        </div>

        {/* Lienzo del SVG */}
        <div className="relative inline-block border border-dashed border-slate-700/50 rounded-xl overflow-hidden max-w-full bg-slate-900/50 p-2">
          {/* Imagen SVG */}
          <img
            ref={imageRef}
            src={svgUrl}
            alt="Component SVG Preview"
            onClick={handleImageClick}
            className="cursor-crosshair max-h-[350px] w-auto object-contain select-none transition-transform hover:opacity-95"
          />

          {/* Renderizado de pines sobre la imagen */}
          {terminals.map((t) => (
            <div
              key={t.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTerminalId(t.id);
              }}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 shadow-lg flex items-center justify-center cursor-pointer transition-all ${getTerminalBadgeColor(t.type)} ${
                selectedTerminalId === t.id ? 'ring-4 ring-emerald-400 scale-125 z-20' : 'z-10 hover:scale-110'
              }`}
              title={`${t.label} (${t.x}%, ${t.y}%)`}
            >
              <span className="text-[9px] font-extrabold font-mono pointer-events-none">
                {t.label.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Columna de Edición de Propiedades de Terminales */}
      <div className="lg:col-span-5 bg-white dark:bg-[#141c2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-800">
          Detalles de los Terminales
        </h3>

        {terminals.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            Haz clic en cualquier punto del SVG a la izquierda para añadir tu primer terminal.
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {terminals.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTerminalId(t.id)}
                className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                  selectedTerminalId === t.id
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => handleUpdateTerminal(t.id, 'label', e.target.value)}
                    className="font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1"
                    placeholder="Nombre terminal"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveTerminal(t.id)}
                    className="flex items-center justify-center bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition-colors shrink-0 shadow-sm"
                    title="Eliminar terminal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium">Tipo</label>
                    <select
                      value={t.type}
                      onChange={(e) => handleUpdateTerminal(t.id, 'type', e.target.value as TerminalType)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="positive">{TERMINAL_TYPE_LABELS.positive}</option>
                      <option value="negative">{TERMINAL_TYPE_LABELS.negative}</option>
                      <option value="signal">{TERMINAL_TYPE_LABELS.signal}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-3 text-[10px] font-mono text-slate-500">
                    <span>X: {t.x}%</span>
                    <span>Y: {t.y}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
