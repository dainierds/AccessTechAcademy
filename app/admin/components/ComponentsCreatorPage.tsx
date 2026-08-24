"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Cpu, Plus, AlertCircle, Save, FileCode, CheckCircle, HelpCircle, Loader2, Maximize2, Minimize2, X, Wand2, Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function ComponentsCreatorPage() {
  const supabase = createClient();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('power_supply');
  const [prompt, setPrompt] = useState('');
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(null);

  // IA Generated result mockup states
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [generatedTerminals, setGeneratedTerminals] = useState<any[]>([]);
  const [isFullScreenEditor, setIsFullScreenEditor] = useState(false);

  // Helper para obtener el aspect ratio exacto del viewBox del SVG
  const getSvgAspectRatio = (svgString: string | null): number => {
    if (!svgString) return 460 / 380;
    const match = svgString.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
    if (match) {
      const w = parseFloat(match[3]);
      const h = parseFloat(match[4]);
      if (w > 0 && h > 0) return w / h;
    }
    return 460 / 380;
  };

  const svgAspectRatio = getSvgAspectRatio(generatedSvg);

  // Tecla ESC para salir de pantalla completa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreenEditor(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple terminal editor helper state
  const [terminalLabel, setTerminalLabel] = useState('');
  const [terminalType, setTerminalType] = useState('signal');
  const [terminalX, setTerminalX] = useState(50);
  const [terminalY, setTerminalY] = useState(50);
  const [clickMode, setClickMode] = useState<'add' | 'delete'>('add');

  const handleAddTerminal = () => {
    if (!terminalLabel) return;
    const newTerm = {
      id: `term-${Date.now()}`,
      label: terminalLabel,
      type: terminalType,
      x: Number(terminalX),
      y: Number(terminalY)
    };
    setGeneratedTerminals([...generatedTerminals, newTerm]);
    setTerminalLabel('');
  };

  const handleRemoveTerminal = (id: string) => {
    setGeneratedTerminals(prev => prev.filter(t => t.id !== id));
  };

  // 🪄 Auto-rellenar y auto-detección inteligente de todos los tornillos del SVG
  const handleAutoDetectTerminals = () => {
    if (!generatedSvg) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(generatedSvg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return;

      const viewBox = svgEl.getAttribute('viewBox');
      let vbW = 1000, vbH = 800;
      if (viewBox) {
        const parts = viewBox.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          vbW = parts[2];
          vbH = parts[3];
        }
      }

      // Buscar todos los elementos que representen tornillos o terminales
      // 1) Elementos con clase .ps-terminal, .cx-terminal, .x100-term, etc.
      // 2) Elementos <use href="#ps-screw-pin">, <use href="#cx-screw-terminal">, <use href="#x100-term-screw">
      const candidateElements: Array<{ x: number; y: number; label?: string }> = [];

      // Función recursiva para calcular la posición acumulada de transform de un nodo
      const getCumulativeTransform = (node: Element): { x: number; y: number } => {
        let cur: Element | null = node;
        let totalX = 0;
        let totalY = 0;
        while (cur && cur !== svgEl) {
          const transform = cur.getAttribute('transform');
          if (transform) {
            const translateMatch = transform.match(/translate\(\s*([\d.-]+)(?:[\s,]+([\d.-]+))?\s*\)/i);
            if (translateMatch) {
              totalX += parseFloat(translateMatch[1]) || 0;
              totalY += parseFloat(translateMatch[2] || '0') || 0;
            }
          }
          cur = cur.parentElement;
        }
        return { x: totalX, y: totalY };
      };

      // 1. Buscar grupos con clase terminal o data-label o use de tornillos
      const termNodes = doc.querySelectorAll('.ps-terminal, .cx-terminal, .x100-term, .dmm-terminal, [id*="term-"], [data-label], use[href*="screw"], use[href*="pin"]');
      termNodes.forEach((node) => {
        const targetNode = node.tagName.toLowerCase() === 'use' && node.parentElement ? node.parentElement : node;
        const pos = getCumulativeTransform(targetNode);
        const label = targetNode.getAttribute('data-label') || targetNode.getAttribute('id') || `T${candidateElements.length + 1}`;
        
        // Evitar duplicados muy cercanos (menos de 10px de distancia)
        const isDuplicate = candidateElements.some(c => Math.hypot(c.x - pos.x, c.y - pos.y) < 12);
        if (!isDuplicate && pos.x > 0 && pos.y > 0) {
          candidateElements.push({ x: pos.x, y: pos.y, label });
        }
      });

      if (candidateElements.length > 0) {
        const detected = candidateElements.map((c, i) => ({
          id: `term-auto-${Date.now()}-${i}`,
          label: c.label || `Born #${i + 1}`,
          type: 'signal',
          x: Math.round((c.x / vbW) * 1000) / 10,
          y: Math.round((c.y / vbH) * 1000) / 10
        }));
        setGeneratedTerminals(detected);
        setSuccessMsg(`✨ ¡Auto-rellenar completado! Se detectaron y ubicaron ${detected.length} tornillos automáticamente.`);
      } else {
        // Fallback: si no hay etiquetas semánticas, buscar círculos de tornillo (con r entre 6 y 18)
        const circles = doc.querySelectorAll('circle');
        circles.forEach((c) => {
          const r = parseFloat(c.getAttribute('r') || '0');
          if (r >= 8 && r <= 20) {
            const cx = parseFloat(c.getAttribute('cx') || '0');
            const cy = parseFloat(c.getAttribute('cy') || '0');
            const trans = getCumulativeTransform(c);
            const worldX = trans.x + cx;
            const worldY = trans.y + cy;
            const isDup = candidateElements.some(cand => Math.hypot(cand.x - worldX, cand.y - worldY) < 15);
            if (!isDup && worldX > 0 && worldY > 0) {
              candidateElements.push({ x: worldX, y: worldY, label: `Born #${candidateElements.length + 1}` });
            }
          }
        });

        if (candidateElements.length > 0) {
          const detected = candidateElements.map((c, i) => ({
            id: `term-auto-${Date.now()}-${i}`,
            label: c.label || `Born #${i + 1}`,
            type: 'signal',
            x: Math.round((c.x / vbW) * 1000) / 10,
            y: Math.round((c.y / vbH) * 1000) / 10
          }));
          setGeneratedTerminals(detected);
          setSuccessMsg(`✨ ¡Auto-rellenar completado! Se detectaron ${detected.length} tornillos geométricos.`);
        } else {
          setErrorMsg('No se pudieron detectar tornillos automáticos en el SVG. Puedes agregarlos haciendo clic en el lienzo.');
        }
      }
    } catch (e: any) {
      setErrorMsg('Error al analizar tornillos del SVG: ' + e.message);
    }
  };

  // Manejador de click en el lienzo para añadir o borrar punto
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si se estaba arrastrando un terminal, ignorar click
    if ((window as any).__wasDragging) {
      (window as any).__wasDragging = false;
      return;
    }
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
    const clickY = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));

    // Verificar si se hizo click sobre un punto existente para eliminarlo
    const clickedTerm = generatedTerminals.find(t => Math.hypot(t.x - clickX, t.y - clickY) < 3.5);
    if (clickedTerm) {
      handleRemoveTerminal(clickedTerm.id);
      return;
    }

    // Si no hizo click sobre uno existente, agregar un nuevo punto donde se hizo click
    const nextIdx = generatedTerminals.length + 1;
    const newTerm = {
      id: `term-${Date.now()}`,
      label: terminalLabel.trim() || `P${nextIdx}`,
      type: terminalType,
      x: clickX,
      y: clickY
    };
    setGeneratedTerminals(prev => [...prev, newTerm]);
  };

  // 🎨 AccessTech Hardware Component Generator — estilo unificado biblioteca
  const handleGenerateWithIA = async () => {
    if (!name || !brand) {
      setErrorMsg('Por favor completa el Nombre y la Marca del componente.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const p = (prompt + ' ' + name + ' ' + category).toLowerCase();
      const isController  = category === 'controller'  || p.includes('controladora') || p.includes('panel') || p.includes('accentra') || p.includes('assa') || p.includes('controller');
      const isPowerSupply = category === 'power_supply' || p.includes('altronix') || p.includes('fuente') || p.includes('power supply') || p.includes('charger');
      const isReader      = category === 'reader'       || p.includes('lector') || p.includes('reader') || p.includes('rfid') || p.includes('teclado') || p.includes('wiegand') || p.includes('keypad');
      const isStrike      = category === 'electric_strike' || category === 'strike' || p.includes('strike') || p.includes('hes') || p.includes('cerradero') || p.includes('pestillo');
      const isMortiseLock = category === 'mortise_lock'  || p.includes('embutida') || p.includes('mortise');
      const isRexButton   = category === 'rex_button'    || (p.includes('bot') && p.includes('salida')) || p.includes('push to exit');
      const isRexPir      = category === 'rex_pir'       || p.includes('pir') || p.includes('movimiento') || p.includes('motion sensor');
      const isPanicBar    = category === 'panic_bar'     || p.includes('panico') || p.includes('panic') || p.includes('crash bar');
      const isDps         = category === 'dps'           || p.includes('dps') || p.includes('contacto magnetico') || p.includes('magnetic');
      const isPoeSupply   = category === 'poe_supply'    || p.includes('poe') || p.includes('switch poe') || p.includes('ethernet switch');
      const isMaglock     = category === 'maglock'       || p.includes('maglock') || p.includes('electromagn') || p.includes('magloc');
      let svgMarkup = '';
      let baseTerminals: any[] = [];

      if (isController) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 380" width="100%" height="100%">
  <defs>
    <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#cbd5e1" /><stop offset="25%" stop-color="#f8fafc" /><stop offset="50%" stop-color="#e2e8f0" /><stop offset="75%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <linearGradient id="pcbGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#14532d" /><stop offset="50%" stop-color="#064e3b" /><stop offset="100%" stop-color="#022c22" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="20" y="15" width="420" height="350" rx="12" fill="url(#metalPlate)" stroke="#64748b" stroke-width="2" filter="url(#shadow)" />
  <circle cx="40" cy="35" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="35" y1="35" x2="45" y2="35" stroke="#94a3b8" stroke-width="1.5" /><line x1="40" y1="30" x2="40" y2="40" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="420" cy="35" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="415" y1="35" x2="425" y2="35" stroke="#94a3b8" stroke-width="1.5" /><line x1="420" y1="30" x2="420" y2="40" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="40" cy="345" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="35" y1="345" x2="45" y2="345" stroke="#94a3b8" stroke-width="1.5" /><line x1="40" y1="340" x2="40" y2="350" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="420" cy="345" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="415" y1="345" x2="425" y2="345" stroke="#94a3b8" stroke-width="1.5" /><line x1="420" y1="340" x2="420" y2="350" stroke="#94a3b8" stroke-width="1.5" />
  <rect x="30" y="50" width="400" height="50" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <rect x="30" y="50" width="180" height="50" rx="6" fill="#1e3a5f" />
  <text x="48" y="81" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#38bdf8" letter-spacing="1">${brand.toUpperCase()}</text>
  <text x="218" y="77" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#94a3b8">${name.toUpperCase()}</text>
  <text x="218" y="91" font-family="Courier New, monospace" font-size="8" fill="#64748b">ACCESS CONTROLLER</text>
  <rect x="50" y="115" width="360" height="180" rx="6" fill="url(#pcbGreen)" stroke="#14532d" stroke-width="1.5" />
  <line x1="70" y1="130" x2="390" y2="130" stroke="#22c55e" stroke-width="0.5" opacity="0.4" />
  <line x1="70" y1="200" x2="390" y2="200" stroke="#22c55e" stroke-width="0.5" opacity="0.4" />
  <rect x="70" y="155" width="50" height="35" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="95" y="168" font-family="Courier New, monospace" font-size="6" fill="#94a3b8" text-anchor="middle">OMRON</text><text x="95" y="178" font-family="Courier New, monospace" font-size="6" fill="#64748b" text-anchor="middle">K1</text>
  <rect x="135" y="155" width="50" height="35" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="160" y="168" font-family="Courier New, monospace" font-size="6" fill="#94a3b8" text-anchor="middle">OMRON</text><text x="160" y="178" font-family="Courier New, monospace" font-size="6" fill="#64748b" text-anchor="middle">K2</text>
  <circle cx="340" cy="165" r="6" fill="#10b981" stroke="#064e3b" stroke-width="1" /><text x="340" y="180" font-family="Courier New, monospace" font-size="5.5" fill="#4ade80" text-anchor="middle">PWR</text>
  <circle cx="365" cy="165" r="6" fill="#ef4444" stroke="#7f1d1d" stroke-width="1" /><text x="365" y="180" font-family="Courier New, monospace" font-size="5.5" fill="#fca5a5" text-anchor="middle">ALM</text>
  <rect x="220" y="145" width="80" height="60" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="260" y="173" font-family="Courier New, monospace" font-size="7" fill="#38bdf8" text-anchor="middle">CPU</text>
  <rect x="140" y="110" width="180" height="10" rx="2" fill="url(#termGreen)" stroke="#14532d" stroke-width="1" />
  <circle cx="158" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="176" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="194" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="212" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="230" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="248" cy="115" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
  <rect x="25" y="110" width="12" height="180" rx="2" fill="url(#termGreen)" stroke="#14532d" stroke-width="1" />
  <circle cx="31" cy="120" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="133" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="146" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="159" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="172" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="185" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="198" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="31" cy="211" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
  <rect x="423" y="110" width="12" height="180" rx="2" fill="url(#termGreen)" stroke="#14532d" stroke-width="1" />
  <circle cx="429" cy="120" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="429" cy="133" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="429" cy="146" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="429" cy="159" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="429" cy="172" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" /><circle cx="429" cy="185" r="3" fill="#f8fafc" stroke="#475569" stroke-width="0.8" />
  <g font-family="Courier New, monospace" font-size="5.5" fill="#0f172a" font-weight="bold"><text x="42" y="122">PWR+</text><text x="42" y="135">GND</text><text x="42" y="148">D0</text><text x="42" y="161">D1</text><text x="42" y="174">LED</text><text x="42" y="187">BEP</text><text x="42" y="200">NO</text><text x="42" y="213">NC</text></g>
  <text x="50" y="315" font-family="Courier New, monospace" font-size="7.5" fill="#475569">Input: 12-24VDC @ 500mA  |  Wiegand / OSDP  |  4 Relay Outputs</text>
  <text x="50" y="356" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#94a3b8">CE  FCC  UL</text>
</svg>`;
        baseTerminals = [
          { id: 'pwr_pos', label: 'PWR (+)', type: 'positive', x: 4.1, y: 26.0 },
          { id: 'pwr_neg', label: 'GND (-)', type: 'negative', x: 4.1, y: 29.4 },
          { id: 'r1_d0', label: 'D0 / DATA', type: 'signal', x: 4.1, y: 32.8 },
          { id: 'r1_d1', label: 'D1 / CLK', type: 'signal', x: 4.1, y: 36.2 },
          { id: 'r1_led', label: 'LED', type: 'signal', x: 4.1, y: 39.6 },
          { id: 'r1_beep', label: 'BEEPER', type: 'signal', x: 4.1, y: 43.0 },
          { id: 'r1_no', label: 'NO (Lock)', type: 'signal', x: 4.1, y: 46.4 },
          { id: 'r1_nc', label: 'NC (Lock)', type: 'signal', x: 4.1, y: 49.8 },
          { id: 'r2_pwr', label: 'R2 PWR', type: 'positive', x: 95.9, y: 26.0 },
          { id: 'r2_gnd', label: 'R2 GND', type: 'negative', x: 95.9, y: 29.4 },
          { id: 'r2_d0', label: 'R2 D0', type: 'signal', x: 95.9, y: 32.8 },
          { id: 'r2_d1', label: 'R2 D1', type: 'signal', x: 95.9, y: 36.2 },
        ];

      } else if (isPowerSupply) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="100%" height="100%">
  <defs>
    <linearGradient id="metalCase" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94a3b8" /><stop offset="25%" stop-color="#f8fafc" /><stop offset="50%" stop-color="#e2e8f0" /><stop offset="75%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <linearGradient id="bodyDark" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2d2d2d" /><stop offset="100%" stop-color="#181818" /></linearGradient>
    <linearGradient id="brandRed" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444" /><stop offset="100%" stop-color="#991b1b" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="15" y="10" width="290" height="380" rx="10" fill="url(#metalCase)" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)" />
  <rect x="140" y="18" width="40" height="12" rx="6" fill="#0f172a" stroke="#cbd5e1" stroke-width="1" />
  <rect x="140" y="370" width="40" height="12" rx="6" fill="#0f172a" stroke="#cbd5e1" stroke-width="1" />
  <circle cx="28" cy="190" r="8" fill="#0f172a" stroke="#64748b" stroke-width="1" />
  <circle cx="292" cy="190" r="8" fill="#0f172a" stroke="#64748b" stroke-width="1" />
  <rect x="20" y="40" width="245" height="330" rx="8" fill="url(#bodyDark)" stroke="#475569" stroke-width="2" />
  <rect x="30" y="52" width="225" height="68" rx="5" fill="#111" stroke="#333" stroke-width="1" />
  <rect x="35" y="57" width="215" height="28" rx="4" fill="url(#brandRed)" />
  <text x="50" y="76" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" letter-spacing="1">${brand.toUpperCase()}</text>
  <text x="40" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#ffffff">${name.toUpperCase()}</text>
  <text x="40" y="114" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">Power Supply / Charger</text>
  <text x="35" y="148" font-family="Courier New, monospace" font-size="9" fill="#94a3b8">Input: 115VAC 60Hz</text>
  <text x="35" y="163" font-family="Courier New, monospace" font-size="9" fill="#94a3b8">Output: 12VDC / 24VDC</text>
  <text x="35" y="178" font-family="Courier New, monospace" font-size="9" fill="#94a3b8">Current: 1.75A-4A</text>
  <circle cx="222" cy="155" r="8" fill="#10b981" stroke="#064e3b" stroke-width="1.5" />
  <text x="222" y="170" font-family="Courier New, monospace" font-size="6" fill="#4ade80" text-anchor="middle">CHG</text>
  <rect x="245" y="110" width="45" height="220" rx="3" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="251" y="116" width="33" height="208" rx="2" fill="#0f172a" stroke="#020617" stroke-width="1" />
  <circle cx="267" cy="134" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="134" r="4" fill="#7f1d1d" /><line x1="261" y1="134" x2="273" y2="134" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="267" cy="160" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="160" r="4" fill="#020617" /><line x1="261" y1="160" x2="273" y2="160" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="267" cy="186" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="186" r="4" fill="#1e40af" /><line x1="261" y1="186" x2="273" y2="186" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="267" cy="212" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="212" r="4" fill="#1e40af" /><line x1="261" y1="212" x2="273" y2="212" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="267" cy="238" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="238" r="4" fill="#7f1d1d" /><line x1="261" y1="238" x2="273" y2="238" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="267" cy="264" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="267" cy="264" r="4" fill="#020617" /><line x1="261" y1="264" x2="273" y2="264" stroke="#0f172a" stroke-width="1.5" />
  <g font-family="Courier New, monospace" font-size="7" fill="#94a3b8" font-weight="bold" text-anchor="end">
    <text x="242" y="137">+VDC</text><text x="242" y="163">GND</text><text x="242" y="189">AC1</text><text x="242" y="215">AC2</text><text x="242" y="241">BAT+</text><text x="242" y="267">BAT-</text>
  </g>
  <text x="35" y="345" font-family="Arial, sans-serif" font-size="7.5" fill="#64748b">Access Control System Unit - Brooklyn, NY</text>
  <text x="35" y="378" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#64748b">CE  UL</text>
</svg>`;
        baseTerminals = [
          { id: 'dc_pos', label: '+VDC (Output)', type: 'positive', x: 82.0, y: 28.5 },
          { id: 'dc_neg', label: 'GND (Output)', type: 'negative', x: 82.0, y: 35.0 },
          { id: 'ac1', label: 'AC L', type: 'signal', x: 82.0, y: 41.5 },
          { id: 'ac2', label: 'AC N', type: 'signal', x: 82.0, y: 48.0 },
          { id: 'bat_pos', label: 'BAT (+)', type: 'positive', x: 82.0, y: 54.5 },
          { id: 'bat_neg', label: 'BAT (-)', type: 'negative', x: 82.0, y: 61.0 },
        ];

      } else if (isReader) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 340" width="100%" height="100%">
  <defs>
    <linearGradient id="readerFace" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b" /><stop offset="50%" stop-color="#0f172a" /><stop offset="100%" stop-color="#020617" /></linearGradient>
    <linearGradient id="metalEdge" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94a3b8" /><stop offset="50%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="10" y="10" width="160" height="320" rx="12" fill="url(#metalEdge)" stroke="#64748b" stroke-width="2" filter="url(#shadow)" />
  <rect x="18" y="18" width="120" height="304" rx="9" fill="url(#readerFace)" stroke="#334155" stroke-width="1.5" />
  <rect x="40" y="28" width="76" height="6" rx="3" fill="#10b981" />
  <text x="80" y="55" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#38bdf8" text-anchor="middle">${brand.toUpperCase()}</text>
  <text x="80" y="68" font-family="Courier New, monospace" font-size="7.5" fill="#64748b" text-anchor="middle">${name.toUpperCase()}</text>
  <rect x="30" y="80" width="96" height="60" rx="6" fill="#0f172a" stroke="#1e40af" stroke-width="1.5" />
  <rect x="36" y="86" width="84" height="48" rx="4" fill="#0c1220" stroke="#1d4ed8" stroke-width="1" />
  <text x="80" y="116" font-family="Courier New, monospace" font-size="8" fill="#3b82f6" text-anchor="middle">RFID / NFC</text>
  <g transform="translate(30, 155)">
    <rect x="0" y="0" width="96" height="110" rx="4" fill="#0a0f1a" stroke="#334155" stroke-width="1" />
    <rect x="6" y="8" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="18" y="21" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">1</text>
    <rect x="36" y="8" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="48" y="21" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">2</text>
    <rect x="66" y="8" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="78" y="21" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">3</text>
    <rect x="6" y="33" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="18" y="46" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">4</text>
    <rect x="36" y="33" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="48" y="46" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">5</text>
    <rect x="66" y="33" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="78" y="46" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">6</text>
    <rect x="6" y="58" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="18" y="71" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">7</text>
    <rect x="36" y="58" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="48" y="71" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">8</text>
    <rect x="66" y="58" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="78" y="71" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">9</text>
    <rect x="6" y="83" width="24" height="20" rx="3" fill="#7f1d1d" stroke="#ef4444" stroke-width="1" /><text x="18" y="96" font-family="Arial" font-weight="bold" font-size="9" fill="#fca5a5" text-anchor="middle">CLR</text>
    <rect x="36" y="83" width="24" height="20" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1" /><text x="48" y="96" font-family="Arial" font-weight="bold" font-size="10" fill="#e2e8f0" text-anchor="middle">0</text>
    <rect x="66" y="83" width="24" height="20" rx="3" fill="#14532d" stroke="#22c55e" stroke-width="1" /><text x="78" y="96" font-family="Arial" font-weight="bold" font-size="9" fill="#86efac" text-anchor="middle">ENT</text>
  </g>
  <rect x="140" y="90" width="32" height="160" rx="2" fill="url(#termGreen)" stroke="#14532d" stroke-width="1" />
  <rect x="145" y="95" width="22" height="150" rx="2" fill="#0f172a" stroke="#020617" stroke-width="1" />
  <circle cx="156" cy="110" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="110" r="2.5" fill="#7f1d1d" />
  <circle cx="156" cy="130" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="130" r="2.5" fill="#020617" />
  <circle cx="156" cy="150" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="150" r="2.5" fill="#1e40af" />
  <circle cx="156" cy="170" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="170" r="2.5" fill="#1e40af" />
  <circle cx="156" cy="190" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="190" r="2.5" fill="#0f172a" />
  <circle cx="156" cy="210" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="156" cy="210" r="2.5" fill="#0f172a" />
</svg>`;
        baseTerminals = [
          { id: 'pwr', label: '+12V (VIN)', type: 'positive', x: 88.8, y: 28.4 },
          { id: 'gnd', label: 'GND (0V)', type: 'negative', x: 88.8, y: 37.8 },
          { id: 'd0', label: 'D0 (Data 0)', type: 'signal', x: 88.8, y: 47.0 },
          { id: 'd1', label: 'D1 (Data 1)', type: 'signal', x: 88.8, y: 56.4 },
          { id: 'beep', label: 'BEEPER', type: 'signal', x: 88.8, y: 65.8 },
          { id: 'led', label: 'LED Ctrl', type: 'signal', x: 88.8, y: 75.2 },
        ];

      } else if (isStrike) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 380" width="100%" height="100%">
  <defs>
    <linearGradient id="steelBody" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94a3b8" /><stop offset="25%" stop-color="#f8fafc" /><stop offset="50%" stop-color="#e2e8f0" /><stop offset="75%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#64748b" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="20" y="10" width="120" height="360" rx="8" fill="url(#steelBody)" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="40" cy="28" r="6" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="35" y1="28" x2="45" y2="28" stroke="#475569" stroke-width="1.2" /><line x1="40" y1="23" x2="40" y2="33" stroke="#475569" stroke-width="1.2" />
  <circle cx="120" cy="28" r="6" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="115" y1="28" x2="125" y2="28" stroke="#475569" stroke-width="1.2" /><line x1="120" y1="23" x2="120" y2="33" stroke="#475569" stroke-width="1.2" />
  <circle cx="40" cy="352" r="6" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="35" y1="352" x2="45" y2="352" stroke="#475569" stroke-width="1.2" /><line x1="40" y1="347" x2="40" y2="357" stroke="#475569" stroke-width="1.2" />
  <circle cx="120" cy="352" r="6" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="115" y1="352" x2="125" y2="352" stroke="#475569" stroke-width="1.2" /><line x1="120" y1="347" x2="120" y2="357" stroke="#475569" stroke-width="1.2" />
  <text x="80" y="60" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()}</text>
  <text x="80" y="75" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#334155" text-anchor="middle">${name.toUpperCase()}</text>
  <rect x="35" y="90" width="90" height="160" rx="4" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
  <rect x="50" y="110" width="60" height="35" rx="3" fill="url(#steelBody)" stroke="#475569" stroke-width="1" />
  <rect x="62" y="118" width="36" height="20" rx="4" fill="#020617" />
  <rect x="55" y="155" width="50" height="30" rx="3" fill="#334155" stroke="#475569" stroke-width="1" />
  <text x="80" y="174" font-family="Courier New, monospace" font-size="7" fill="#94a3b8" text-anchor="middle">SOLENOID</text>
  <text x="80" y="275" font-family="Courier New, monospace" font-size="7" fill="#475569" text-anchor="middle">12/24VDC  Fail-Secure</text>
  <rect x="93" y="295" width="42" height="65" rx="3" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="98" y="300" width="32" height="55" rx="2" fill="#0f172a" stroke="#020617" stroke-width="1" />
  <circle cx="114" cy="313" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="114" cy="313" r="3" fill="#7f1d1d" /><line x1="108" y1="313" x2="120" y2="313" stroke="#0f172a" stroke-width="1.2" />
  <circle cx="114" cy="332" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="114" cy="332" r="3" fill="#020617" /><line x1="108" y1="332" x2="120" y2="332" stroke="#0f172a" stroke-width="1.2" />
  <circle cx="114" cy="351" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="114" cy="351" r="3" fill="#475569" /><line x1="108" y1="351" x2="120" y2="351" stroke="#0f172a" stroke-width="1.2" />
  <g font-family="Courier New, monospace" font-size="6.5" fill="#0f172a" text-anchor="end" font-weight="bold"><text x="92" y="315">+VDC</text><text x="92" y="334">GND</text><text x="92" y="353">MON</text></g>
</svg>`;
        baseTerminals = [
          { id: 'pos', label: 'POS (+)', type: 'positive', x: 64.0, y: 72.0 },
          { id: 'neg', label: 'NEG (-)', type: 'negative', x: 64.0, y: 79.5 },
          { id: 'mon', label: 'MONITOR', type: 'signal', x: 64.0, y: 87.0 },
        ];

      } else if (isMaglock) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" width="100%" height="100%">
  <defs>
    <linearGradient id="alumBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f8fafc" /><stop offset="15%" stop-color="#e2e8f0" /><stop offset="50%" stop-color="#cbd5e1" /><stop offset="85%" stop-color="#e2e8f0" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.5"/></filter>
  </defs>
  <rect x="10" y="20" width="510" height="120" rx="8" fill="url(#alumBody)" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="30" cy="40" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="25" y1="40" x2="35" y2="40" stroke="#94a3b8" stroke-width="1.2" /><line x1="30" y1="35" x2="30" y2="45" stroke="#94a3b8" stroke-width="1.2" />
  <circle cx="30" cy="120" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="25" y1="120" x2="35" y2="120" stroke="#94a3b8" stroke-width="1.2" /><line x1="30" y1="115" x2="30" y2="125" stroke="#94a3b8" stroke-width="1.2" />
  <text x="60" y="72" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#0f172a">${brand.toUpperCase()}</text>
  <text x="60" y="90" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#334155">${name.toUpperCase()}</text>
  <text x="60" y="106" font-family="Courier New, monospace" font-size="8" fill="#64748b">Electromagnetic Lock - 12/24VDC</text>
  <rect x="180" y="30" width="280" height="100" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
  <rect x="192" y="42" width="30" height="76" rx="2" fill="#475569" /><rect x="234" y="42" width="30" height="76" rx="2" fill="#475569" /><rect x="276" y="42" width="30" height="76" rx="2" fill="#475569" /><rect x="318" y="42" width="30" height="76" rx="2" fill="#475569" /><rect x="360" y="42" width="30" height="76" rx="2" fill="#475569" /><rect x="402" y="42" width="30" height="76" rx="2" fill="#475569" />
  <rect x="524" y="40" width="68" height="80" rx="3" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="530" y="46" width="56" height="68" rx="2" fill="#0f172a" stroke="#020617" stroke-width="1" />
  <circle cx="558" cy="64" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="558" cy="64" r="4" fill="#7f1d1d" /><line x1="552" y1="64" x2="564" y2="64" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="558" cy="96" r="9" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="558" cy="96" r="4" fill="#020617" /><line x1="552" y1="96" x2="564" y2="96" stroke="#0f172a" stroke-width="1.5" />
  <text x="521" y="66" font-family="Courier New, monospace" font-size="6.5" fill="#94a3b8" text-anchor="end" font-weight="bold">+VDC</text>
  <text x="521" y="98" font-family="Courier New, monospace" font-size="6.5" fill="#94a3b8" text-anchor="end" font-weight="bold">GND</text>
</svg>`;
        baseTerminals = [
          { id: 'pos', label: '+ (12/24V)', type: 'positive', x: 91.5, y: 35.0 },
          { id: 'neg', label: '- (GND)', type: 'negative', x: 91.5, y: 65.0 },
        ];

      } else if (isMortiseLock) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 380" width="100%" height="100%">
  <defs>
    <linearGradient id="steelBody" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94a3b8" /><stop offset="30%" stop-color="#f8fafc" /><stop offset="70%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#64748b" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="25" y="10" width="110" height="360" rx="4" fill="url(#steelBody)" stroke="#475569" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="52" cy="24" r="5" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="47" y1="24" x2="57" y2="24" stroke="#475569" stroke-width="1" /><line x1="52" y1="19" x2="52" y2="29" stroke="#475569" stroke-width="1" />
  <circle cx="108" cy="24" r="5" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="103" y1="24" x2="113" y2="24" stroke="#475569" stroke-width="1" /><line x1="108" y1="19" x2="108" y2="29" stroke="#475569" stroke-width="1" />
  <circle cx="52" cy="346" r="5" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="47" y1="346" x2="57" y2="346" stroke="#475569" stroke-width="1" /><line x1="52" y1="341" x2="52" y2="351" stroke="#475569" stroke-width="1" />
  <circle cx="108" cy="346" r="5" fill="url(#steelBody)" stroke="#475569" stroke-width="1" /><line x1="103" y1="346" x2="113" y2="346" stroke="#475569" stroke-width="1" /><line x1="108" y1="341" x2="108" y2="351" stroke="#475569" stroke-width="1" />
  <text x="80" y="52" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()}</text>
  <text x="80" y="65" font-family="Arial, sans-serif" font-size="8" fill="#334155" text-anchor="middle">${name.toUpperCase()}</text>
  <rect x="40" y="80" width="80" height="160" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
  <rect x="55" y="100" width="50" height="35" rx="2" fill="url(#steelBody)" stroke="#475569" stroke-width="1" />
  <rect x="67" y="108" width="26" height="20" rx="3" fill="#020617" />
  <circle cx="80" cy="180" r="12" fill="#020617" stroke="#94a3b8" stroke-width="1.5" />
  <rect x="85" y="250" width="45" height="85" rx="2" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="90" y="255" width="35" height="75" rx="2" fill="#0f172a" />
  <circle cx="107" cy="268" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="107" cy="268" r="2.5" fill="#7f1d1d" />
  <circle cx="107" cy="288" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="107" cy="288" r="2.5" fill="#020617" />
  <circle cx="107" cy="308" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="107" cy="308" r="2.5" fill="#0f172a" />
  <circle cx="107" cy="328" r="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="107" cy="328" r="2.5" fill="#0f172a" />
  <g font-family="Courier New, monospace" font-size="6" fill="#0f172a" text-anchor="end" font-weight="bold"><text x="84" y="270">+VDC</text><text x="84" y="290">GND</text><text x="84" y="310">REX</text><text x="84" y="330">DPS</text></g>
</svg>`;
        baseTerminals = [
          { id: 'v_pos', label: '12/24V (+)', type: 'positive', x: 66.8, y: 68.6 },
          { id: 'v_neg', label: 'GND (-)', type: 'negative', x: 66.8, y: 74.1 },
          { id: 'rex_no', label: 'REX (NO)', type: 'signal', x: 66.8, y: 79.7 },
          { id: 'dps_com', label: 'DOOR MONITOR', type: 'signal', x: 66.8, y: 85.2 },
        ];

      } else if (isRexButton) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 320" width="100%" height="100%">
  <defs>
    <linearGradient id="plateSteel" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#cbd5e1" /><stop offset="50%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="20" y="10" width="140" height="300" rx="10" fill="url(#plateSteel)" stroke="#475569" stroke-width="2" filter="url(#shadow)" />
  <circle cx="90" cy="28" r="5" fill="#0f172a" stroke="#cbd5e1" stroke-width="1" />
  <circle cx="90" cy="292" r="5" fill="#0f172a" stroke="#cbd5e1" stroke-width="1" />
  <text x="90" y="56" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()}</text>
  <text x="90" y="70" font-family="Courier New, monospace" font-size="8" fill="#334155" text-anchor="middle">${name.toUpperCase()}</text>
  <circle cx="90" cy="140" r="50" fill="#10b981" stroke="#047857" stroke-width="4" />
  <circle cx="90" cy="140" r="40" fill="#34d399" />
  <text x="90" y="137" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#ffffff" text-anchor="middle">PUSH TO</text>
  <text x="90" y="150" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#ffffff" text-anchor="middle">EXIT</text>
  <rect x="30" y="208" width="120" height="70" rx="4" fill="#020617" stroke="#1e293b" stroke-width="1.5" />
  <circle cx="55" cy="228" r="5" fill="#f8fafc" stroke="#475569" /><text x="55" y="245" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">COM</text>
  <circle cx="78" cy="228" r="5" fill="#f8fafc" stroke="#475569" /><text x="78" y="245" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">NO</text>
  <circle cx="101" cy="228" r="5" fill="#f8fafc" stroke="#475569" /><text x="101" y="245" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">NC</text>
  <circle cx="124" cy="228" r="5" fill="#f8fafc" stroke="#475569" /><text x="124" y="245" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">+12V</text>
  <circle cx="55" cy="258" r="5" fill="#f8fafc" stroke="#475569" /><text x="55" y="275" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">GND</text>
</svg>`;
        baseTerminals = [
          { id: 'com', label: 'COM', type: 'signal', x: 30.5, y: 68.7 },
          { id: 'no', label: 'NO', type: 'signal', x: 43.3, y: 68.7 },
          { id: 'nc', label: 'NC', type: 'signal', x: 56.1, y: 68.7 },
          { id: 'pwr', label: 'LED +12V', type: 'positive', x: 68.8, y: 68.7 },
          { id: 'gnd', label: 'GND', type: 'negative', x: 30.5, y: 80.6 },
        ];

      } else if (isRexPir) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="100%" height="100%">
  <defs>
    <linearGradient id="pirWhite" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ffffff" /><stop offset="70%" stop-color="#f1f5f9" /><stop offset="100%" stop-color="#cbd5e1" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.5"/></filter>
  </defs>
  <rect x="20" y="15" width="240" height="170" rx="16" fill="url(#pirWhite)" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)" />
  <text x="140" y="35" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()} ${name.toUpperCase()}</text>
  <text x="140" y="48" font-family="Courier New, monospace" font-size="7.5" fill="#64748b" text-anchor="middle">PIR MOTION SENSOR - REX</text>
  <path d="M60,60 Q140,130 220,60 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5" />
  <circle cx="140" cy="120" r="18" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="140" cy="120" r="10" fill="#3b82f6" />
  <circle cx="140" cy="120" r="4" fill="#1d4ed8" />
  <rect x="40" y="145" width="200" height="30" rx="3" fill="#020617" stroke="#1e293b" stroke-width="1" />
  <circle cx="66" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="66" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">12V+</text>
  <circle cx="96" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="96" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">GND</text>
  <circle cx="126" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="126" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">NO</text>
  <circle cx="156" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="156" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">NC</text>
  <circle cx="186" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="186" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">COM</text>
  <circle cx="216" cy="160" r="5" fill="#f8fafc" stroke="#475569" /><text x="216" y="173" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">TAMP</text>
</svg>`;
        baseTerminals = [
          { id: 'v_pos', label: '12V (+)', type: 'positive', x: 23.5, y: 80.0 },
          { id: 'v_neg', label: 'GND (-)', type: 'negative', x: 34.2, y: 80.0 },
          { id: 'rel_no', label: 'NO', type: 'signal', x: 44.9, y: 80.0 },
          { id: 'rel_nc', label: 'NC', type: 'signal', x: 55.6, y: 80.0 },
          { id: 'rel_com', label: 'COM', type: 'signal', x: 66.3, y: 80.0 },
          { id: 'tamper', label: 'TAMPER', type: 'signal', x: 77.0, y: 80.0 },
        ];

      } else if (isPanicBar) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 170" width="100%" height="100%">
  <defs>
    <linearGradient id="barSteel" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#cbd5e1" /><stop offset="50%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#64748b" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <text x="250" y="18" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()} ${name.toUpperCase()}</text>
  <rect x="15" y="28" width="460" height="100" rx="8" fill="url(#barSteel)" stroke="#334155" stroke-width="2" filter="url(#shadow)" />
  <rect x="80" y="45" width="330" height="68" rx="4" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
  <rect x="85" y="50" width="320" height="56" rx="2" fill="#ef4444" />
  <text x="245" y="82" font-family="Arial, sans-serif" font-weight="900" font-size="13" fill="#ffffff" text-anchor="middle">PUSH UNTIL ALARM SOUNDS</text>
  <rect x="18" y="38" width="48" height="80" rx="3" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="23" y="43" width="38" height="70" rx="2" fill="#0f172a" />
  <circle cx="42" cy="60" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="42" cy="60" r="3" fill="#7f1d1d" /><line x1="36" y1="60" x2="48" y2="60" stroke="#0f172a" stroke-width="1.2" />
  <circle cx="42" cy="83" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="42" cy="83" r="3" fill="#020617" /><line x1="36" y1="83" x2="48" y2="83" stroke="#0f172a" stroke-width="1.2" />
  <circle cx="42" cy="106" r="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="42" cy="106" r="3" fill="#475569" /><line x1="36" y1="106" x2="48" y2="106" stroke="#0f172a" stroke-width="1.2" />
  <g font-family="Courier New, monospace" font-size="6" fill="#94a3b8" font-weight="bold" text-anchor="end"><text x="17" y="62">+V</text><text x="17" y="85">GND</text><text x="17" y="108">MON</text></g>
</svg>`;
        baseTerminals = [
          { id: 'sol_pos', label: 'SOLENOID (+)', type: 'positive', x: 8.4, y: 35.2 },
          { id: 'sol_neg', label: 'SOLENOID (-)', type: 'negative', x: 8.4, y: 48.8 },
          { id: 'latch_mon', label: 'LATCH MON', type: 'signal', x: 8.4, y: 62.3 },
        ];

      } else if (isDps) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 200" width="100%" height="100%">
  <defs>
    <linearGradient id="dpsMetal" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#cbd5e1" /><stop offset="50%" stop-color="#ffffff" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#020617" flood-opacity="0.5"/></filter>
  </defs>
  <text x="130" y="16" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()} ${name.toUpperCase()} (DPS)</text>
  <rect x="20" y="25" width="90" height="150" rx="8" fill="url(#dpsMetal)" stroke="#475569" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="65" cy="42" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
  <circle cx="65" cy="158" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
  <rect x="35" y="75" width="60" height="50" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="65" y="104" font-family="Courier New, monospace" font-size="6" fill="#64748b" text-anchor="middle">MAGNETIC</text>
  <rect x="148" y="25" width="90" height="150" rx="8" fill="url(#dpsMetal)" stroke="#475569" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="193" cy="42" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
  <circle cx="193" cy="158" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="1" />
  <rect x="163" y="75" width="60" height="50" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="193" y="104" font-family="Courier New, monospace" font-size="6" fill="#64748b" text-anchor="middle">MAGNET</text>
  <line x1="65" y1="175" x2="65" y2="190" stroke="#f8fafc" stroke-width="2" />
  <line x1="80" y1="175" x2="80" y2="190" stroke="#020617" stroke-width="2" />
</svg>`;
        baseTerminals = [
          { id: 'com', label: 'COM', type: 'signal', x: 25.0, y: 37.5 },
          { id: 'nc', label: 'NC (Door Closed)', type: 'signal', x: 25.0, y: 50.0 },
          { id: 'no', label: 'NO (Door Open)', type: 'signal', x: 25.0, y: 62.5 },
        ];

      } else if (isPoeSupply) {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" width="100%" height="100%">
  <defs>
    <linearGradient id="poeBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#334155" /><stop offset="50%" stop-color="#1e293b" /><stop offset="100%" stop-color="#0f172a" /></linearGradient>
    <linearGradient id="portFace" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1e293b" /><stop offset="100%" stop-color="#0f172a" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.5"/></filter>
  </defs>
  <rect x="15" y="15" width="390" height="170" rx="10" fill="url(#poeBody)" stroke="#475569" stroke-width="2" filter="url(#shadow)" />
  <text x="208" y="40" font-family="Arial, sans-serif" font-weight="900" font-size="13" fill="#38bdf8" text-anchor="middle">${brand.toUpperCase()} ${name.toUpperCase()}</text>
  <text x="208" y="55" font-family="Courier New, monospace" font-size="8" fill="#64748b" text-anchor="middle">PoE+ 802.3at/af - Gigabit Industrial Switch</text>
  <circle cx="330" cy="38" r="5" fill="#10b981" /><text x="330" y="50" font-family="Courier New, monospace" font-size="5.5" fill="#4ade80" text-anchor="middle">PWR</text>
  <circle cx="350" cy="38" r="5" fill="#f59e0b" /><text x="350" y="50" font-family="Courier New, monospace" font-size="5.5" fill="#fcd34d" text-anchor="middle">PoE</text>
  <circle cx="370" cy="38" r="5" fill="#3b82f6" /><text x="370" y="50" font-family="Courier New, monospace" font-size="5.5" fill="#93c5fd" text-anchor="middle">LNK</text>
  <g transform="translate(25, 65)"><rect x="0" y="0" width="52" height="40" rx="3" fill="url(#portFace)" stroke="#334155" stroke-width="1.5" /><rect x="5" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><rect x="28" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="26" y="44" font-family="Courier New, monospace" font-size="6" fill="#38bdf8" text-anchor="middle">P1 PoE+</text></g>
  <g transform="translate(88, 65)"><rect x="0" y="0" width="52" height="40" rx="3" fill="url(#portFace)" stroke="#334155" stroke-width="1.5" /><rect x="5" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><rect x="28" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="26" y="44" font-family="Courier New, monospace" font-size="6" fill="#38bdf8" text-anchor="middle">P2 PoE+</text></g>
  <g transform="translate(151, 65)"><rect x="0" y="0" width="52" height="40" rx="3" fill="url(#portFace)" stroke="#334155" stroke-width="1.5" /><rect x="5" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><rect x="28" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="26" y="44" font-family="Courier New, monospace" font-size="6" fill="#38bdf8" text-anchor="middle">P3 PoE+</text></g>
  <g transform="translate(214, 65)"><rect x="0" y="0" width="52" height="40" rx="3" fill="url(#portFace)" stroke="#334155" stroke-width="1.5" /><rect x="5" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><rect x="28" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="26" y="44" font-family="Courier New, monospace" font-size="6" fill="#38bdf8" text-anchor="middle">P4 PoE+</text></g>
  <g transform="translate(278, 65)"><rect x="0" y="0" width="52" height="40" rx="3" fill="url(#portFace)" stroke="#38bdf8" stroke-width="1.5" /><rect x="5" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#38bdf8" stroke-width="1" /><rect x="28" y="5" width="19" height="16" rx="1" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="26" y="44" font-family="Courier New, monospace" font-size="6" fill="#94a3b8" text-anchor="middle">UPLINK</text></g>
  <text x="40" y="140" font-family="Courier New, monospace" font-size="8" fill="#94a3b8">48VDC INPUT</text>
  <rect x="40" y="148" width="80" height="24" rx="3" fill="#0f172a" stroke="#334155" />
  <circle cx="60" cy="160" r="5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="60" cy="160" r="2" fill="#7f1d1d" /><text x="60" y="175" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">48V+</text>
  <circle cx="85" cy="160" r="5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="85" cy="160" r="2" fill="#020617" /><text x="85" y="175" font-family="Courier New, monospace" font-size="5.5" fill="#94a3b8" text-anchor="middle">GND</text>
</svg>`;
        baseTerminals = [
          { id: 'pwr_in_pos', label: '48V (+)', type: 'positive', x: 9.5, y: 80.0 },
          { id: 'pwr_in_neg', label: 'GND', type: 'negative', x: 20.2, y: 80.0 },
          { id: 'port1', label: 'P1 PoE+', type: 'positive', x: 15.4, y: 95.0 },
          { id: 'port2', label: 'P2 PoE+', type: 'positive', x: 30.9, y: 95.0 },
          { id: 'port3', label: 'P3 PoE+', type: 'positive', x: 46.4, y: 95.0 },
          { id: 'port4', label: 'P4 PoE+', type: 'positive', x: 61.9, y: 95.0 },
          { id: 'uplink', label: 'UP-LINK', type: 'signal', x: 77.3, y: 95.0 },
        ];

      } else {
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="100%" height="100%">
  <defs>
    <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#cbd5e1" /><stop offset="25%" stop-color="#f8fafc" /><stop offset="50%" stop-color="#e2e8f0" /><stop offset="75%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#94a3b8" /></linearGradient>
    <linearGradient id="pcbGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#14532d" /><stop offset="50%" stop-color="#064e3b" /><stop offset="100%" stop-color="#022c22" /></linearGradient>
    <linearGradient id="termGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ade80" /><stop offset="30%" stop-color="#16a34a" /><stop offset="80%" stop-color="#15803d" /><stop offset="100%" stop-color="#14532d" /></linearGradient>
    <filter id="shadow"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/></filter>
  </defs>
  <rect x="15" y="10" width="330" height="240" rx="12" fill="url(#metalPlate)" stroke="#64748b" stroke-width="2" filter="url(#shadow)" />
  <circle cx="35" cy="28" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="30" y1="28" x2="40" y2="28" stroke="#94a3b8" stroke-width="1.5" /><line x1="35" y1="23" x2="35" y2="33" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="325" cy="28" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="320" y1="28" x2="330" y2="28" stroke="#94a3b8" stroke-width="1.5" /><line x1="325" y1="23" x2="325" y2="33" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="35" cy="232" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="30" y1="232" x2="40" y2="232" stroke="#94a3b8" stroke-width="1.5" /><line x1="35" y1="227" x2="35" y2="237" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="325" cy="232" r="7" fill="#0f172a" stroke="#94a3b8" stroke-width="1" /><line x1="320" y1="232" x2="330" y2="232" stroke="#94a3b8" stroke-width="1.5" /><line x1="325" y1="227" x2="325" y2="237" stroke="#94a3b8" stroke-width="1.5" />
  <rect x="25" y="42" width="310" height="46" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <rect x="25" y="42" width="130" height="46" rx="6" fill="#1e3a5f" />
  <text x="45" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#38bdf8" letter-spacing="0.5">${brand.toUpperCase()}</text>
  <text x="165" y="66" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#e2e8f0">${name.toUpperCase()}</text>
  <text x="165" y="80" font-family="Courier New, monospace" font-size="8" fill="#64748b">${category.replace(/_/g, ' ').toUpperCase()}</text>
  <rect x="35" y="100" width="230" height="120" rx="5" fill="url(#pcbGreen)" stroke="#14532d" stroke-width="1.5" />
  <line x1="50" y1="115" x2="250" y2="115" stroke="#22c55e" stroke-width="0.5" opacity="0.3" /><line x1="50" y1="135" x2="250" y2="135" stroke="#22c55e" stroke-width="0.5" opacity="0.3" /><line x1="50" y1="155" x2="250" y2="155" stroke="#22c55e" stroke-width="0.5" opacity="0.3" /><line x1="50" y1="175" x2="250" y2="175" stroke="#22c55e" stroke-width="0.5" opacity="0.3" />
  <rect x="130" y="118" width="70" height="52" rx="3" fill="#0f172a" stroke="#475569" stroke-width="1" /><text x="165" y="148" font-family="Courier New, monospace" font-size="8" fill="#38bdf8" text-anchor="middle">MCU</text>
  <circle cx="260" cy="118" r="6" fill="#10b981" stroke="#064e3b" stroke-width="1" /><text x="260" y="132" font-family="Courier New, monospace" font-size="5.5" fill="#4ade80" text-anchor="middle">PWR</text>
  <rect x="275" y="95" width="60" height="135" rx="3" fill="url(#termGreen)" stroke="#14532d" stroke-width="1.5" />
  <rect x="281" y="101" width="48" height="123" rx="2" fill="#0f172a" stroke="#020617" stroke-width="1" />
  <circle cx="305" cy="118" r="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="305" cy="118" r="3.5" fill="#7f1d1d" /><line x1="299" y1="118" x2="311" y2="118" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="305" cy="142" r="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="305" cy="142" r="3.5" fill="#020617" /><line x1="299" y1="142" x2="311" y2="142" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="305" cy="166" r="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="305" cy="166" r="3.5" fill="#1e40af" /><line x1="299" y1="166" x2="311" y2="166" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="305" cy="190" r="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" /><circle cx="305" cy="190" r="3.5" fill="#1e40af" /><line x1="299" y1="190" x2="311" y2="190" stroke="#0f172a" stroke-width="1.5" />
  <g font-family="Courier New, monospace" font-size="6.5" fill="#94a3b8" font-weight="bold" text-anchor="end"><text x="272" y="120">PWR+</text><text x="272" y="144">GND</text><text x="272" y="168">SIG1</text><text x="272" y="192">SIG2</text></g>
</svg>`;
        baseTerminals = [
          { id: 'pwr_pos', label: 'PWR (+)', type: 'positive', x: 84.4, y: 38.2 },
          { id: 'pwr_neg', label: 'GND (-)', type: 'negative', x: 84.4, y: 49.3 },
          { id: 'sig1', label: 'SIGNAL 1', type: 'signal', x: 84.4, y: 60.4 },
          { id: 'sig2', label: 'SIGNAL 2', type: 'signal', x: 84.4, y: 71.5 },
        ];
      }

      setGeneratedSvg(svgMarkup);
      setGeneratedTerminals(baseTerminals);
      setSuccessMsg('Componente generado con el estilo unificado AccessTech. Usa Auto-Detect para los puntos de conexion.');
    } catch (err: any) {
      setErrorMsg('Error al generar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

    // Guardar componente en supabase
  const handleSaveComponent = async () => {
    if (!name || !brand || !generatedSvg) return;
    
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Convertir el marcado SVG generado en un Blob para cargarlo a Supabase Storage
      const svgBlob = new Blob([generatedSvg], { type: 'image/svg+xml' });
      const fileName = `${brand.toLowerCase()}_${name.toLowerCase()}_${Date.now()}.svg`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('sandbox-hardware-components')
        .upload(fileName, svgBlob, {
          contentType: 'image/svg+xml',
          cacheControl: '3600'
        });

      if (uploadErr) throw uploadErr;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('sandbox-hardware-components')
        .getPublicUrl(fileName);

      // 3. Insertar componente sandbox
      const { error: insertErr } = await supabase
        .from('sandbox_hardware_components')
        .insert({
          name: name,
          brand: brand,
          category: category,
          svg_url: publicUrl,
          default_width: 280,
          default_height: 360,
          terminals: generatedTerminals,
          is_active: true
        });

      if (insertErr) throw insertErr;

      setSuccessMsg(t.creator.savedOk);
      
      // Limpiar formulario
      setName('');
      setBrand('');
      setPrompt('');
      setGeneratedSvg(null);
      setGeneratedTerminals([]);
    } catch (err: any) {
      setErrorMsg(t.creator.saveError + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferencePhoto(file);
      setReferencePhotoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-[#ecf0f1] dark:bg-[#0b0f19] p-8 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Cpu className="w-8 h-8" />
            <span>{t.admin.hardwareGenerator}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generador basado en Gemini Nano Banana para crear módulos de hardware PACS listos para simular.
          </p>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-4 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-2.5 text-xs font-semibold shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 text-xs font-semibold shadow-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Prompts */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span>{t.admin.step1}</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">{t.common.name}</label>
                  <input 
                    type="text" 
                    placeholder="AL175, HES-5000"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">{t.admin.brand}</label>
                  <input 
                    type="text" 
                    placeholder="Altronix, HES"
                    value={brand} 
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">{t.admin.category}</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white font-medium"
                >
                  <option value="electric_strike">⚡ Cerraderos Eléctricos / Locks (Estilo HES 5000)</option>
                  <option value="maglock">🧲 Cerraduras Electromagnéticas / Maglocks</option>
                  <option value="power_supply">🔋 Fuentes de Poder / Power Supplies (Estilo Altronix)</option>
                  <option value="reader">💳 Lectores de Tarjetas / RFID / Teclados Wiegand</option>
                  <option value="controller">🎛️ Controladoras PACS / Paneles de Control (Estilo Accentra)</option>
                  <option value="mortise_lock">🔒 Cerradura Eléctrica Embutida (Electrified Mortise Lock)</option>
                  <option value="rex_button">🔴 Botón de Salida (Request-to-Exit / REX Push Button)</option>
                  <option value="rex_pir">👁️ Sensor de Movimiento REX (PIR Sensor)</option>
                  <option value="panic_bar">🚪 Barra de Pánico Eléctrica (Electrified Panic Bar)</option>
                  <option value="dps">🔗 Contacto Magnético de Puerta (Door Position Switch / DPS)</option>
                  <option value="poe_supply">🌐 Fuente / Inyector PoE (Power over Ethernet)</option>
                  <option value="other">⚙️ Otro Dispositivo / Componente Personalizado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase block">{t.admin.referencePhoto}</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100"
                />
                {referencePhotoUrl && (
                  <div className="mt-3 relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                    <img src={referencePhotoUrl} alt="Referencia" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateWithIA}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{loading ? t.admin.generating : t.admin.generateComponent}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: IA SVG Output Viewer */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span>{t.admin.step2}</span>
                {generatedSvg && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoDetectTerminals}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-amber-500/20 transition active:scale-95"
                      title="Escanear y ubicar automáticamente todos los tornillos del hardware"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{t.admin.autoFillTerminals}</span>
                    </button>

                    <button
                      onClick={() => setIsFullScreenEditor(true)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition"
                      title="Abrir en Pantalla Completa para Editar Comodamente"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{t.admin.fullscreen}</span>
                    </button>

                    <button
                      onClick={handleSaveComponent}
                      disabled={loading}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{t.admin.saveAndIncorporate}</span>
                    </button>
                  </div>
                )}
              </h3>

              {generatedSvg ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Vista previa del SVG interactivo */}
                  <div className="md:col-span-7 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center min-h-[380px] h-[440px] relative select-none overflow-hidden">
                    <div className="w-full text-center pb-2 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
                      <span className="text-emerald-400 font-bold">💡 Clic en tornillo vacío:</span> añade punto • <span className="text-red-400 font-bold">Clic en punto verde:</span> lo elimina • <span className="text-amber-400 font-bold">Arrastrar:</span> reubica
                    </div>
                    <div 
                      className="relative select-none flex items-center justify-center shadow-2xl max-w-full max-h-[380px] cursor-crosshair"
                      style={{ 
                        aspectRatio: `${svgAspectRatio}`,
                        height: '100%',
                        width: 'auto',
                        maxHeight: '380px',
                        maxWidth: '100%'
                      }}
                      onClick={handleCanvasClick}
                      onMouseMove={(e) => {
                        const draggingId = (window as any).__draggingTerminalId;
                        if (!draggingId) return;
                        (window as any).__wasDragging = true;
                        
                        const container = e.currentTarget;
                        const rect = container.getBoundingClientRect();
                        
                        const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
                        const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
                        
                        setGeneratedTerminals(prev => 
                          prev.map(t => t.id === draggingId ? { ...t, x, y } : t)
                        );
                      }}
                      onMouseUp={() => { 
                        setTimeout(() => { (window as any).__draggingTerminalId = null; }, 50);
                      }}
                      onMouseLeave={() => { 
                        (window as any).__draggingTerminalId = null; 
                      }}
                    >
                      <div 
                        className="w-full h-full pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: generatedSvg }}
                      />
                      
                      {/* Rendered Handles interactivos de arrastre y click para eliminar */}
                      {generatedTerminals.map(t => (
                        <div
                          key={t.id}
                          style={{ left: `${t.x}%`, top: `${t.y}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            (window as any).__draggingTerminalId = t.id;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTerminal(t.id);
                          }}
                          className="absolute w-5 h-5 bg-emerald-500 hover:bg-red-500 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl flex items-center justify-center text-[10px] text-white z-40 cursor-pointer active:scale-125 transition-transform group"
                          title={`Clic para eliminar ${t.label} • Arrastra para reubicar`}
                        >
                          <span className="group-hover:hidden">•</span>
                          <span className="hidden group-hover:inline text-[9px] font-black">✕</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel de edición de puertos */}
                  <div className="md:col-span-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>{t.admin.ports} ({generatedTerminals.length})</span>
                      <button 
                        onClick={() => setIsFullScreenEditor(true)}
                        className="text-[10px] text-indigo-400 font-bold hover:underline"
                      >
                        {t.admin.expand}
                      </button>
                    </h4>
                    
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {generatedTerminals.map(term => (
                        <div key={term.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2 rounded-lg text-[10px]">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-750 dark:text-slate-200">{term.label}</span>
                            <span className="text-[9px] text-slate-400 font-mono">Pos: {term.x}%, {term.y}%</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveTerminal(term.id)}
                            className="text-red-500 hover:text-red-400 font-bold px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Agregar Puerto Form */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-250 dark:border-slate-850/60 space-y-2">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">{t.admin.addPort}</span>
                      <input 
                        type="text" 
                        placeholder="Label (+12v, GND...)" 
                        value={terminalLabel}
                        onChange={e => setTerminalLabel(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-[10px] rounded focus:outline-none text-slate-800 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input 
                          type="number" 
                          placeholder="X %" 
                          value={terminalX}
                          onChange={e => setTerminalX(Number(e.target.value))}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-[10px] rounded focus:outline-none text-slate-800 dark:text-white"
                        />
                        <input 
                          type="number" 
                          placeholder="Y %" 
                          value={terminalY}
                          onChange={e => setTerminalY(Number(e.target.value))}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-[10px] rounded focus:outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={handleAddTerminal}
                        className="w-full bg-slate-850 hover:bg-slate-800 text-white text-[9px] font-bold py-1.5 rounded transition"
                      >
                        {t.admin.addTerminal}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950/60 border-2 border-dashed border-slate-300 dark:border-slate-800/80 rounded-xl min-h-[380px] flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                  <FileCode className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-xs font-semibold">{t.admin.noComponentGenerated}</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-1">Completa las especificaciones del formulario de la izquierda y haz clic en "Generar Componente" para ver el vector generado.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL MODOS PANTALLA COMPLETA PARA EDICIÓN CÓMODA */}
        {isFullScreenEditor && generatedSvg && (
          <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-6 flex flex-col h-screen w-screen overflow-hidden text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="bg-indigo-500/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/30">
                  <Maximize2 className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Editor de Puertos y Vector SVG (Modo Pantalla Completa)</h2>
                  <p className="text-xs text-slate-400">{brand || t.admin.componentName} {name} • {t.admin.category}: {category} • {generatedTerminals.length} Puertos de Conexión</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoDetectTerminals}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95"
                  title="Escanear y ubicar automáticamente todos los tornillos del hardware"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{t.admin.autoFillTerminals}</span>
                </button>

                <button
                  onClick={handleSaveComponent}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.admin.saveAndIncorporate}</span>
                </button>
                <button
                  onClick={() => setIsFullScreenEditor(false)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Salir de Pantalla Completa (ESC)</span>
                </button>
              </div>
            </div>

            {/* Workspace Grid 12 cols */}
            <div className="grid grid-cols-12 gap-6 flex-1 h-[calc(100vh-120px)] overflow-hidden">
              {/* Gran Lienzo Interactivo Izquierdo (Col-span-8) */}
              <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center h-full relative select-none overflow-hidden shadow-2xl">
                <div className="w-full text-center pb-2 text-xs text-slate-400 font-mono flex items-center justify-center gap-3">
                  <span className="text-emerald-400 font-bold">💡 Clic en tornillo vacío:</span> añade punto • <span className="text-red-400 font-bold">Clic en punto verde:</span> lo elimina • <span className="text-amber-400 font-bold">Arrastrar:</span> reubica
                </div>
                <div 
                  className="relative select-none flex items-center justify-center shadow-2xl max-w-full max-h-[calc(100%-30px)] cursor-crosshair"
                  style={{ 
                    aspectRatio: `${svgAspectRatio}`,
                    height: '100%',
                    width: 'auto',
                    maxHeight: 'calc(100% - 30px)',
                    maxWidth: '100%'
                  }}
                  onClick={handleCanvasClick}
                  onMouseMove={(e) => {
                    const draggingId = (window as any).__draggingTerminalId;
                    if (!draggingId) return;
                    (window as any).__wasDragging = true;
                    const container = e.currentTarget;
                    const rect = container.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
                    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
                    setGeneratedTerminals(prev => prev.map(t => t.id === draggingId ? { ...t, x, y } : t));
                  }}
                  onMouseUp={() => { 
                    setTimeout(() => { (window as any).__draggingTerminalId = null; }, 50);
                  }}
                  onMouseLeave={() => { 
                    (window as any).__draggingTerminalId = null; 
                  }}
                >
                  <div 
                    className="w-full h-full pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: generatedSvg }}
                  />
                  {generatedTerminals.map(t => (
                    <div
                      key={t.id}
                      style={{ left: `${t.x}%`, top: `${t.y}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        (window as any).__draggingTerminalId = t.id;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTerminal(t.id);
                      }}
                      className="absolute w-6 h-6 bg-emerald-500 hover:bg-red-500 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-2xl flex items-center justify-center text-xs text-white font-bold z-40 cursor-pointer active:scale-135 transition-transform group"
                      title={`Clic para eliminar ${t.label} • Arrastra para reubicar`}
                    >
                      <span className="group-hover:hidden">•</span>
                      <span className="hidden group-hover:inline text-[10px] font-black">✕</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel Lateral de Edición Exacta de Puertos (Col-span-4) */}
              <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-full overflow-hidden space-y-4 shadow-xl">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex justify-between items-center">
                    <span>{t.admin.ports} ({generatedTerminals.length})</span>
                    <span className="text-[10px] text-indigo-400 font-mono font-normal">Edita texto o coordenadas</span>
                  </h4>
                  {generatedTerminals.map(term => (
                    <div key={term.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <input 
                          type="text" 
                          value={term.label}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            setGeneratedTerminals(prev => prev.map(t => t.id === term.id ? { ...t, label: newLabel } : t));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-bold text-white rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex gap-3 items-center text-[11px] font-mono text-slate-400">
                          <span>X%:</span>
                          <input 
                            type="number" 
                            value={term.x}
                            step="0.1"
                            onChange={(e) => {
                              const newX = Number(e.target.value);
                              setGeneratedTerminals(prev => prev.map(t => t.id === term.id ? { ...t, x: newX } : t));
                            }}
                            className="w-16 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-bold"
                          />
                          <span>Y%:</span>
                          <input 
                            type="number" 
                            value={term.y}
                            step="0.1"
                            onChange={(e) => {
                              const newY = Number(e.target.value);
                              setGeneratedTerminals(prev => prev.map(t => t.id === term.id ? { ...t, y: newY } : t));
                            }}
                            className="w-16 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-bold"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveTerminal(term.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
                        title="Eliminar este puerto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Formulario Añadir Puerto */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase block">{t.admin.addPort}</span>
                  <input 
                    type="text" 
                    placeholder="Etiqueta (+12V, GND, NO, NC...)" 
                    value={terminalLabel}
                    onChange={e => setTerminalLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      placeholder="Posición X %" 
                      value={terminalX}
                      onChange={e => setTerminalX(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 px-3 py-2 text-xs rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input 
                      type="number" 
                      placeholder="Posición Y %" 
                      value={terminalY}
                      onChange={e => setTerminalY(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 px-3 py-2 text-xs rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleAddTerminal}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.admin.addTerminal}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
