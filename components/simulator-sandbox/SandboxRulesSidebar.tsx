"use client";

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  useSimulatorSandboxStore, 
  SandboxRule, 
  SandboxRuleCondition, 
  SandboxRuleAction 
} from '@/hooks/useSimulatorSandboxStore';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Volume2, 
  Activity, 
  Palette, 
  Check, 
  X, 
  Sliders, 
  Zap,
  HelpCircle
} from 'lucide-react';

export default function SandboxRulesSidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const { nodes, rules, addRule, removeRule, toggleRule } = useSimulatorSandboxStore();
  const { t } = useI18n();

  // New Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [sourceHandleId, setSourceHandleId] = useState('');
  const [relation, setRelation] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [targetHandleId, setTargetHandleId] = useState('');

  const [actionType, setActionType] = useState<'CHANGE_COLOR' | 'PLAY_SOUND' | 'SET_VOLTAGE'>('CHANGE_COLOR');
  const [actionTargetNodeId, setActionTargetNodeId] = useState('');
  const [colorHex, setColorHex] = useState('#ef4444');
  const [soundType, setSoundType] = useState<'beep' | 'click' | 'alarm'>('beep');
  const [voltageValue, setVoltageValue] = useState('12.24 V');

  // Selected source node terminals helper
  const selectedSourceNode = nodes.find((n) => n.id === sourceNodeId);
  const sourceTerminals: any[] = Array.isArray(selectedSourceNode?.data?.terminals) ? selectedSourceNode.data.terminals : [];

  // Selected target node terminals helper
  const selectedTargetNode = nodes.find((n) => n.id === targetNodeId);
  const targetTerminals: any[] = Array.isArray(selectedTargetNode?.data?.terminals) ? selectedTargetNode.data.terminals : [];

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceNodeId || !targetNodeId) {
      alert('Por favor selecciona los componentes origen y destino para la regla.');
      return;
    }

    const condition: SandboxRuleCondition = {
      sourceNodeId,
      sourceHandleId,
      relation,
      targetNodeId,
      targetHandleId,
    };

    const action: SandboxRuleAction = {
      targetNodeId: actionTargetNodeId || targetNodeId,
      actionType,
      colorHex: actionType === 'CHANGE_COLOR' ? colorHex : undefined,
      soundType: actionType === 'PLAY_SOUND' ? soundType : undefined,
      voltageValue: actionType === 'SET_VOLTAGE' ? voltageValue : undefined,
    };

    const sourceName = typeof selectedSourceNode?.data?.name === 'string' ? selectedSourceNode.data.name : 'Nodo A';
    const targetName = typeof selectedTargetNode?.data?.name === 'string' ? selectedTargetNode.data.name : 'Nodo B';
    const generatedName = ruleName || `Regla ${rules.length + 1}: SI ${sourceName} ${relation === 'CONNECTED' ? 'CONECTA A' : 'SE DESCONECTA DE'} ${targetName}`;

    addRule({
      name: generatedName,
      isActive: true,
      condition,
      action,
    });

    // Reset form
    setRuleName('');
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-900/90 border-r border-slate-800 flex flex-col items-center py-4 gap-4 text-slate-400">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
          title="Expandir Motor de Reglas"
        >
          <GitBranch className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono font-bold tracking-widest [writing-mode:vertical-lr] text-slate-400 uppercase">
          {t.sandbox.rulesIfThen} ({rules.length})
        </span>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto p-4 space-y-5 select-none shadow-2xl">
      {/* Header Sidebar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              {t.sandbox.rulesEngine}
            </h3>
            <p className="text-[10px] text-slate-400">Condicionales lógicas en tiempo real</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="Colapsar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulario de creación de Regla IF/THEN */}
      <form onSubmit={handleCreateRule} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t.sandbox.newRule}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Circuit Engine</span>
        </div>

        {/* IF Section */}
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-400">
            <span>IF (CONDICIÓN)</span>
          </div>

          {/* Componente Origen */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.componentA}</label>
            <select
              value={sourceNodeId}
              onChange={(e) => {
                setSourceNodeId(e.target.value);
                setSourceHandleId('');
              }}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">Seleccionar Componente A...</option>
              {nodes.map((n) => {
                const labelStr = typeof n.data?.name === 'string' ? n.data.name : typeof n.data?.label === 'string' ? n.data.label : String(n.id);
                return (
                  <option key={n.id} value={n.id}>
                    {labelStr} ({n.id.split('-')[0]})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Terminal Origen */}
          {sourceTerminals.length > 0 && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.terminalA}</label>
              <select
                value={sourceHandleId}
                onChange={(e) => setSourceHandleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">Cualquier Terminal</option>
                {sourceTerminals.map((t: any) => (
                  <option key={t.id || t.label} value={t.id || t.label}>
                    {String(t.label || t.id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Relación */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.wiringCondition}</label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="CONNECTED">ESTÁ CONECTADO A</option>
              <option value="DISCONNECTED">ESTÁ DESCONECTADO DE</option>
            </select>
          </div>

          {/* Componente Destino */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Componente B (Destino)</label>
            <select
              value={targetNodeId}
              onChange={(e) => {
                setTargetNodeId(e.target.value);
                setTargetHandleId('');
              }}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">Seleccionar Componente B...</option>
              {nodes
                .filter((n) => n.id !== sourceNodeId)
                .map((n) => {
                  const labelStr = typeof n.data?.name === 'string' ? n.data.name : typeof n.data?.label === 'string' ? n.data.label : String(n.id);
                  return (
                    <option key={n.id} value={n.id}>
                      {labelStr} ({n.id.split('-')[0]})
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Terminal Destino */}
          {targetTerminals.length > 0 && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.terminalB}</label>
              <select
                value={targetHandleId}
                onChange={(e) => setTargetHandleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">Cualquier Terminal</option>
                {targetTerminals.map((t: any) => (
                  <option key={t.id || t.label} value={t.id || t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* THEN Section */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-400">
            <span>THEN (ACCIÓN EJECUTABLE)</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.actionType}</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="CHANGE_COLOR">Cambiar Color de Componente</option>
              <option value="PLAY_SOUND">Reproducir Efecto de Sonido</option>
              <option value="SET_VOLTAGE">Establecer Voltaje de Multímetro</option>
            </select>
          </div>

          {/* Selector de Color */}
          {actionType === 'CHANGE_COLOR' && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">{t.sandbox.colorToApply}</label>
              <div className="flex items-center gap-2">
                {[
                  { hex: '#ef4444', label: 'Rojo' },
                  { hex: '#10b981', label: 'Verde' },
                  { hex: '#f59e0b', label: 'Ámbar' },
                  { hex: '#3b82f6', label: 'Azul' },
                  { hex: '#8b5cf6', label: 'Morado' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColorHex(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      colorHex === c.hex ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-80'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selector de Sonido */}
          {actionType === 'PLAY_SOUND' && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.audioEffect}</label>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="beep">Beep Alarma (880 Hz)</option>
                <option value="click">Clic Relé Mecánico</option>
                <option value="alarm">Sirena Ascendente</option>
              </select>
            </div>
          )}

          {/* Selector de Voltaje */}
          {actionType === 'SET_VOLTAGE' && (
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">{t.sandbox.voltageValue}</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={voltageValue}
                  onChange={(e) => setVoltageValue(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                  placeholder="ej. 12.24 V"
                />
                <button
                  type="button"
                  onClick={() => setVoltageValue('12.24 V')}
                  className="text-[10px] bg-slate-800 text-slate-300 px-2 rounded hover:bg-slate-700"
                >
                  12V
                </button>
                <button
                  type="button"
                  onClick={() => setVoltageValue('24.00 V')}
                  className="text-[10px] bg-slate-800 text-slate-300 px-2 rounded hover:bg-slate-700"
                >
                  24V
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t.sandbox.addRule}</span>
        </button>
      </form>

      {/* Lista de Reglas Creadas */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>{t.sandbox.activeRules} ({rules.length})</span>
        </h4>

        {rules.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No hay reglas configuradas. Selecciona componentes arriba para crear tu primera regla IF/THEN.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3 rounded-xl border transition-all text-xs space-y-2 relative ${
                  rule.isActive
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-lg'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-[11px] truncate flex-1">{rule.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                        rule.isActive ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                      title={rule.isActive ? 'Desactivar regla' : 'Activar regla'}
                    >
                      <span
                        className={`w-3 h-3 rounded-full bg-slate-950 transition-transform ${
                          rule.isActive ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/30 transition"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-mono space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                  <div className="text-blue-300">
                    <span className="text-amber-400 font-bold">IF:</span> {rule.condition.relation === 'CONNECTED' ? 'Conexión' : 'Desconexión'} de handles
                  </div>
                  <div className="text-emerald-400">
                    <span className="text-amber-400 font-bold">THEN:</span>{' '}
                    {rule.action.actionType === 'CHANGE_COLOR' && `Cambia color nodo a ${rule.action.colorHex}`}
                    {rule.action.actionType === 'PLAY_SOUND' && `Sonido (${rule.action.soundType})`}
                    {rule.action.actionType === 'SET_VOLTAGE' && `Voltaje = ${rule.action.voltageValue}`}
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
