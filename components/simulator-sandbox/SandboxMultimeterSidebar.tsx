"use client";

import React, { useState } from 'react';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';
import { useI18n } from '@/hooks/useI18n';
import { 
  Activity, 
  Power, 
  RotateCw, 
  Zap, 
  X, 
  Sliders, 
  CheckCircle2, 
  Volume2,
  Maximize2
} from 'lucide-react';

export default function SandboxMultimeterSidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const { multimeter, updateMultimeter, nodes } = useSimulatorSandboxStore();
  const { t } = useI18n();

  const handlePowerToggle = () => {
    updateMultimeter({ isPowered: !multimeter.isPowered });
  };

  const handleModeChange = (mode: 'DCV' | 'ACV' | 'RES' | 'CONT') => {
    updateMultimeter({ mode });
  };

  const handlePresetVoltage = (val: string) => {
    updateMultimeter({ displayValue: val, isPowered: true });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-900/90 border-l border-slate-800 flex flex-col items-center py-4 gap-4 text-slate-400">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
          title={t.sandbox.toggleMultimeter}
        >
          <Activity className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono font-bold tracking-widest [writing-mode:vertical-lr] text-slate-400 uppercase">
          {t.sandbox.multimeter} LED ({multimeter.displayValue})
        </span>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto p-4 space-y-5 select-none shadow-2xl">
      {/* Header Sidebar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              {t.sandbox.multimeterTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.sandbox.ledScreen}</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title={t.sandbox.toggleMultimeter}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* DISPOSITIVO MULTÍMETRO DIGITAL */}
      <div className="bg-[#101726] border-2 border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 relative">
        {/* Marca & Modelo */}
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <span className="font-extrabold text-xs tracking-wider text-slate-300 font-mono">
            ACCESS<span className="text-emerald-400">TECH</span> DMM-9000
          </span>
          <button
            onClick={handlePowerToggle}
            className={`p-1.5 rounded-full border transition-all ${
              multimeter.isPowered
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={t.sandbox.powerMultimeter}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* PANTALLA LED / 7-SEGMENT DISPLAY */}
        <div className="bg-[#04100c] border-4 border-slate-900 rounded-xl p-3 shadow-inner relative overflow-hidden flex flex-col justify-between h-28">
          {/* Indicadores superiores de pantalla */}
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className={multimeter.isPowered ? 'text-emerald-400/80' : 'text-slate-800'}>
              {multimeter.mode === 'DCV' && 'DC ⎓'}
              {multimeter.mode === 'ACV' && 'AC ~'}
              {multimeter.mode === 'RES' && 'Ω RES'}
              {multimeter.mode === 'CONT' && '))) CONT'}
            </span>
            <span className={multimeter.isPowered ? 'text-emerald-400/80' : 'text-slate-800'}>
              AUTO RANGE
            </span>
          </div>

          {/* Valor de Lectura Digital LED Gran Tamaño */}
          <div className="flex items-baseline justify-end gap-2 pr-2">
            <span
              className={`font-mono text-3xl font-extrabold tracking-widest transition-all ${
                multimeter.isPowered
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                  : 'text-slate-900'
              }`}
            >
              {multimeter.isPowered ? multimeter.displayValue : '88.88'}
            </span>
          </div>

          {/* Barra inferior de estado */}
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-600">
            <span>COM (-) & V/Ω (+)</span>
            <span className={multimeter.isPowered ? 'text-emerald-500 animate-pulse' : ''}>
              {multimeter.isPowered ? 'READY' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Selector de Modo Rótulo / Perilla Giratoria */}
        <div className="space-y-2 pt-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            {t.sandbox.functionSelector}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'DCV', label: 'Voltaje DC (V⎓)' },
              { id: 'ACV', label: 'Voltaje AC (V~)' },
              { id: 'RES', label: 'Resistencia (Ω)' },
              { id: 'CONT', label: 'Continuidad ()))' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id as any)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                  multimeter.mode === m.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-extrabold scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botones Presets Rápidos de Voltaje */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            {t.sandbox.manualVoltage}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['0.00 V', '5.00 V', '12.24 V', '13.80 V', '24.00 V', '48.00 V'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetVoltage(val)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border ${
                  multimeter.displayValue === val && multimeter.isPowered
                    ? 'bg-blue-600 text-white border-blue-400 shadow'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GUÍA DE PUNTAS Y CONEXIÓN */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {t.sandbox.testProbes}
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {t.sandbox.probesDesc}
        </p>

        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300">
            <span className="font-bold block">Punta Positiva (+)</span>
            <span>V / Ω (Roja)</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            <span className="font-bold block">Punta Común (-)</span>
            <span>COM (Negra)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
