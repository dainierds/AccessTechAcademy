"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Lock } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface HeroSimulatorDemoProps {
  isDarkMode?: boolean;
  lang?: Language;
}

export default function HeroSimulatorDemo({
  isDarkMode = false,
  lang = 'en',
}: HeroSimulatorDemoProps) {
  const t = translations[lang] || translations.en;

  // Referencias para calcular dinámicamente los centros exactos de los círculos terminales
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sourceTerminalRef = useRef<HTMLDivElement>(null);
  const targetTerminalRef = useRef<HTMLDivElement>(null);

  const isInView = useInView(containerRef, { amount: 0.3 });

  // Coordenadas dinámicas relativas dentro del SVG del lienzo
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number }>({
    x1: 120,
    y1: 115,
    x2: 300,
    y2: 115,
  });

  // Detección de preferencia prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Estados del ciclo de animación: 'disconnected' | 'connecting' | 'connected' | 'fading'
  const [animState, setAnimState] = useState<'disconnected' | 'connecting' | 'connected' | 'fading'>('connected');

  // Función para medir la posición relativa exacta de los terminales
  const updateCoordinates = () => {
    if (!canvasRef.current || !sourceTerminalRef.current || !targetTerminalRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const sourceRect = sourceTerminalRef.current.getBoundingClientRect();
    const targetRect = targetTerminalRef.current.getBoundingClientRect();

    // Centro exacto del terminal origen (+12VDC)
    const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;

    // Centro exacto del terminal destino (POS+) compensando 1.5px hacia la derecha para el stroke-linecap
    const x2 = targetRect.left + targetRect.width / 2 - canvasRect.left + 1.5;
    const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

    setCoords({ x1, y1, x2, y2 });
  };

  useLayoutEffect(() => {
    updateCoordinates();
    window.addEventListener('resize', updateCoordinates);
    return () => window.removeEventListener('resize', updateCoordinates);
  }, []);

  useEffect(() => {
    // Verificar si el navegador requiere reducción de movimiento
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimState('connected');
      return;
    }

    if (!isInView) return;

    let timeoutId: NodeJS.Timeout;

    const runAnimationCycle = () => {
      setAnimState('disconnected');

      timeoutId = setTimeout(() => {
        setAnimState('connecting');

        timeoutId = setTimeout(() => {
          setAnimState('connected');

          timeoutId = setTimeout(() => {
            setAnimState('fading');

            timeoutId = setTimeout(() => {
              runAnimationCycle();
            }, 800);

          }, 3000);

        }, 1000);

      }, 800);
    };

    runAnimationCycle();

    return () => clearTimeout(timeoutId);
  }, [isInView, prefersReducedMotion]);

  const isConnected = prefersReducedMotion || animState === 'connected';
  const isConnecting = !prefersReducedMotion && (animState === 'connecting' || animState === 'connected');
  const isFading = !prefersReducedMotion && animState === 'fading';

  // SVG Bézier Path dinámico con caída de gravedad (sag) proporcionales a las coordenadas dinámicas
  const dx = Math.abs(coords.x2 - coords.x1);
  const sagOffset = Math.min(dx * 0.3, 70);
  const pathD = `M ${coords.x1} ${coords.y1} C ${coords.x1 + dx * 0.3} ${coords.y1 + sagOffset}, ${coords.x2 - dx * 0.3} ${coords.y2 + sagOffset}, ${coords.x2} ${coords.y2}`;

  return (
    <div 
      ref={containerRef}
      className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header del Simulador Integrado Demo */}
      <div className={`flex items-center justify-between pb-4 border-b ${
        isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className={`text-xs font-mono font-bold ml-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t.simulatorDemo.header}
          </span>
        </div>
        <div className={`text-[10px] font-mono font-bold border px-2.5 py-1 rounded transition-colors ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
        }`}>
          {isConnected ? 'AUTO-WIRING' : 'READY'}
        </div>
      </div>

      {/* Lienzo Interactivo SVG con Cable Bezier Animado */}
      <div 
        ref={canvasRef}
        className="py-8 relative min-h-[260px] flex items-center justify-between px-2"
      >
        {/* Nodo 1: Fuente de Poder (Altronix AL175) */}
        <div className={`w-32 border rounded-xl p-3 shadow-lg z-10 transition-colors ${
          isDarkMode ? 'bg-[#0b0f19] border-slate-700' : 'bg-slate-50 border-slate-300'
        }`}>
          <div className={`flex items-center gap-1.5 mb-2 border-b pb-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>AL175</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-red-500 font-bold">+12VDC</span>
              <motion.div 
                ref={sourceTerminalRef}
                animate={{
                  scale: isConnected ? [1, 1.25, 1] : 1,
                  boxShadow: isConnected ? "0px 0px 8px #10b981" : "0px 0px 0px transparent"
                }}
                transition={{ duration: 0.4 }}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  isConnected ? 'bg-emerald-500 border-emerald-400' : 'bg-red-950 border-red-500'
                }`} 
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>GND (-)</span>
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
            </div>
          </div>
        </div>

        {/* Cable Bézier Animado con Coordenadas Dinámicas Medidas al Milímetro */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Sombra de profundidad en el lienzo */}
          {isConnecting && (
            <motion.path 
              d={pathD} 
              fill="none" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="6" 
              style={{ filter: 'blur(3px)' }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isFading ? 0 : 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}

          {/* Cable Principal Rojo/Positivo con animación de trazo suave */}
          {isConnecting && (
            <motion.path 
              d={pathD} 
              fill="none" 
              stroke={isConnected ? '#10b981' : '#ef4444'} 
              strokeWidth="4" 
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ 
                pathLength: isFading ? 0 : 1,
                opacity: isFading ? 0 : 1,
                stroke: isConnected ? '#10b981' : '#ef4444'
              }}
              transition={{ 
                pathLength: { duration: prefersReducedMotion ? 0 : 1, ease: 'easeInOut' },
                stroke: { duration: 0.3 },
                opacity: { duration: isFading ? 0.6 : 0.2 }
              }}
            />
          )}

          {/* Animación de Flujo de Tensión cuando el circuito se cierra */}
          {isConnected && !isFading && (
            <motion.path 
              d={pathD} 
              fill="none" 
              stroke="#4ade80" 
              strokeWidth="2" 
              strokeDasharray="8,8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Nodo 2: Cerradero Electrónico (HES 5000) */}
        <div className={`w-32 border rounded-xl p-3 shadow-lg z-10 text-right transition-colors ${
          isDarkMode ? 'bg-[#0b0f19] border-slate-700' : 'bg-slate-50 border-slate-300'
        }`}>
          <div className={`flex items-center justify-end gap-1.5 mb-2 border-b pb-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>HES 5000</span>
            <Lock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <motion.div 
                ref={targetTerminalRef}
                animate={{
                  scale: isConnected ? [1, 1.25, 1] : 1,
                  boxShadow: isConnected ? "0px 0px 8px #10b981" : "0px 0px 0px transparent"
                }}
                transition={{ duration: 0.4 }}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  isConnected ? 'bg-emerald-500 border-emerald-400' : 'bg-red-950 border-red-500'
                }`} 
              />
              <span className="text-red-500 font-bold">POS (+)</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
              <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>NEG (-)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer de Estado de Simulación Animado */}
      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono transition-colors ${
        isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{t.simulatorDemo.statusLabel}</span>
        
        <motion.div
          animate={{ opacity: isConnected ? 1 : 0.6 }}
          transition={{ duration: 0.3 }}
        >
          {isConnected ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {t.simulatorDemo.closedStatus}
            </span>
          ) : (
            <span className="text-amber-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t.simulatorDemo.openStatus}
            </span>
          )}
        </motion.div>
      </div>

    </div>
  );
}
