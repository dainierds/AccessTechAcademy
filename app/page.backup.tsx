/*
================================================================================
MINI SISTEMA DE DISEÑO - ACCESSTECH ACADEMY
================================================================================
1. PALETA DE COLORES (Fundamentada en el Dominio del Cableado PACS):
   - Dominio / Fondo: #0b0f19 (Obsidiana / Azulejo de Panel de Control)
   - Dominio / Superficie: #141c2e (Gris Azulado de Gabinete Industrial)
   - Cable Positivo (+12VDC/24VDC): #ef4444 / #f97316 (Rojo de Tensión / Naranja de Alimentación)
   - Cable Negativo / Tierra (GND/COM): #334155 (Gris Slate de Tierra de Chasis)
   - Cable Datos / Señal (Wiegand/RS485/Relé): #3b82f6 (Azul Eléctrico)
   - Estado Validado / Correcto: #10b981 (Verde de Relé Activado / LED de Cierre)
   - Acento Gradiente: from-[#10b981] via-[#3b82f6] to-[#f97316] (Flujo Eléctrico de Señal a Carga)

2. TIPOGRAFÍA & JERARQUÍA:
   - Display / Headlines: Font Sans Semibold/Extrabold con tracking ajustado (Font Outfit/Space Grotesk feel).
   - Datos Técnicos / Terminales / Códigos: Font Monospace (`font-mono`) para voltajes (+12VDC, GND, NO, NC, COM), códigos de verificación de certificado y esquemas.
   - Cuerpo de Texto: System UI / Inter limpio con alto contraste de legibilidad.

3. ELEMENTO FIRMA DE MARCA:
   - "Live Wire Interactive Hero Demo": Canvas interactivo simplificado en HTML5/SVG que simula una terminal Altronix conectándose a una cerradura HES 5000 mediante una curva de Bézier física (con caída de gravedad / sag), resplandor verde animado y pulso de flujo de corriente en tiempo real al hacer clic en "Probar Conexión".
================================================================================
*/

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ShieldCheck, 
  Building2, 
  Users, 
  Award, 
  Store, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Cpu, 
  Lock, 
  Wrench, 
  Check, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileCheck
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'technicians' | 'companies'>('technicians');
  const [heroWireConnected, setHeroWireConnected] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* ------------------ NAVIGATION HEADER ------------------ */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-auto overflow-hidden rounded-lg border border-slate-800 p-1 bg-slate-900 shadow-md">
              <img 
                src="/logo-banner.png" 
                alt="AccessTech Academy" 
                className="h-full object-contain"
              />
            </div>
          </Link>

          {/* Links principales */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="#demo" className="hover:text-emerald-400 transition-colors">Simulador</a>
            <a href="#soluciones" className="hover:text-emerald-400 transition-colors">Soluciones</a>
            <a href="#marketplace" className="hover:text-emerald-400 transition-colors">Marketplace</a>
            <a href="#precios" className="hover:text-emerald-400 transition-colors">Precios</a>
            <Link href="/verificar/demo" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verificar Certificado</span>
            </Link>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors shadow-sm"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200"
            >
              Practicar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------ HERO SECTION ------------------ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow de Fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Columna Izquierda: Copy de Posicionamiento Real */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>PACS VIRTUAL HARDWARE SIMULATOR</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Practica cableado de <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Control de Acceso real</span> sin riesgo de corto circuito.
              </h1>

              <p className="text-base sm:text-lg text-slate-350 max-w-2xl font-normal leading-relaxed">
                Entrena técnicos en la conexión lógica de fuentes Altronix, cerraderos HES, lectores Wiegand y paneles de control. Valida polaridad, diagnostica fallas y emite certificados con verificación pública.
              </p>

              {/* Botones CTAs Claramente Diferenciados */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Practicar Gratis Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#empresas"
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all"
                >
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Ver para Empresas</span>
                </a>
              </div>

              {/* Métricas de Dominio / Datos Reales */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl font-black font-mono text-white">0%</p>
                  <p className="text-xs text-slate-400 font-medium">Riesgo de daño en hardware</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-mono text-emerald-400">100%</p>
                  <p className="text-xs text-slate-400 font-medium">Validación lógica de esquemas</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-mono text-indigo-400">Nivel 1-5</p>
                  <p className="text-xs text-slate-400 font-medium">Certificación técnica oficial</p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: FIRMA DE MARCA (Demo Interactivo de Cableado Bezier) */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#141c2e] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                
                {/* Header del Simulador Integrado */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-slate-400 font-bold ml-2">SIMULADOR_ALTRONIX_HES5000.v1</span>
                  </div>
                  <button 
                    onClick={() => setHeroWireConnected(!heroWireConnected)}
                    className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:border-emerald-500 transition-colors"
                  >
                    {heroWireConnected ? 'Desconectar' : 'Probar Conexión'}
                  </button>
                </div>

                {/* Lienzo Interactivo SVG con Cable Bezier */}
                <div className="py-8 relative min-h-[260px] flex items-center justify-between px-2">
                  
                  {/* Nodo 1: Fuente de Poder (Altronix) */}
                  <div className="w-32 bg-[#0b0f19] border border-slate-700 rounded-xl p-3 shadow-lg z-10">
                    <div className="flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-1">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-200">AL175</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-red-400 font-bold">+12VDC</span>
                        <div className="w-3 h-3 rounded-full bg-red-950 border border-red-500" />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-slate-400 font-bold">GND (-)</span>
                        <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
                      </div>
                    </div>
                  </div>

                  {/* Renderizado de Cable Bézier en tiempo real */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {heroWireConnected ? (
                      <>
                        {/* Sombra del cable */}
                        <path 
                          d="M 120 115 C 170 180, 220 180, 270 115" 
                          fill="none" 
                          stroke="rgba(0,0,0,0.6)" 
                          strokeWidth="6" 
                          style={{ filter: 'blur(3px)' }}
                        />
                        {/* Cable Principal Rojo Positivo */}
                        <path 
                          d="M 120 115 C 170 180, 220 180, 270 115" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="4" 
                        />
                        {/* Animación de Flujo Verde de Voltaje */}
                        <path 
                          d="M 120 115 C 170 180, 220 180, 270 115" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeDasharray="8,8"
                          className="animate-pulse"
                        />
                      </>
                    ) : (
                      /* Cable desconectado con sag caído */
                      <path 
                        d="M 120 115 C 140 220, 160 220, 170 230" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="4" 
                        strokeDasharray="4,4"
                      />
                    )}
                  </svg>

                  {/* Nodo 2: Cerradero (HES 5000) */}
                  <div className="w-32 bg-[#0b0f19] border border-slate-700 rounded-xl p-3 shadow-lg z-10 text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-2 border-b border-slate-800 pb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-200">HES 5000</span>
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <div className="w-3 h-3 rounded-full bg-red-950 border border-red-500" />
                        <span className="text-red-400 font-bold">POS (+)</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
                        <span className="text-slate-400 font-bold">NEG (-)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer de Estado de Simulación */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">ESTADO CIRCUITO:</span>
                  {heroWireConnected ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      CIRCUITO CERRADO (+12V OK)
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      CIRCUITO ABIERTO
                    </span>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ DEMO VISUAL DEL PRODUCTO REAL ------------------ */}
      <section id="demo" className="py-16 bg-[#0f172a]/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Motor de Simulación Integrado</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Interfaz Realista de Aprendizaje Práctico</h3>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Canvas interactivo de nodos de hardware en tiempo real con validación instantánea de esquemas, detección de fallas y pruebas de continuidad.
            </p>
          </div>

          {/* Recreación visual directa de HardwareNodes / WireEdge */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto relative overflow-hidden">
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Escenario 04:</span>
                <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md font-bold">Diagnóstico Fail-Safe vs Fail-Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validación Activa</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Tarjeta de Nodo 1: Controlador */}
              <div className="bg-[#141c2e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Panel PACS</h4>
                  <span className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400">Door Module</span>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>RELAY COM</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>RELAY NC</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>RELAY NO</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Nodo 2: Fuente Altronix */}
              <div className="bg-[#141c2e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wide">Fuente Auxiliar</h4>
                  <span className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400">Altronix AL175</span>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>+12VDC OUT</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>GND OUT</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Nodo 3: Cerradero Electrónico */}
              <div className="bg-[#141c2e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Cerradura</h4>
                  <span className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400">HES 5000</span>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>COIL (+)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>COIL (-)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ SECCIÓN DIFERENCIADA: PARA TÉCNICOS VS EMPRESAS ------------------ */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Propuesta de Valor</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Capacitación Técnica Enfocada en Resultados</h3>
          
          {/* Selector de Pestañas */}
          <div className="inline-flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 mt-4">
            <button
              onClick={() => setActiveTab('technicians')}
              className={`px-6 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'technicians'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Para Técnicos Individuales
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              aria-label="Soluciones para empresas"
              className={`px-6 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'companies'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Para Empresas & Integradores
            </button>
          </div>
        </div>

        {/* Contenido Pestaña 1: Para Técnicos */}
        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Sandbox Libre & Guiado</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Diseña conexiones lógicas sin límites o sigue tutoriales paso a paso para dominar relés, fuentes de respaldo y botones de salida.
              </p>
            </div>

            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Modo Diagnóstico de Fallas</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enfréntate a escenarios reales con fallas inyectadas (polaridades cruzadas, voltajes caídos) y aprende a resolverlas en tiempo récord.
              </p>
            </div>

            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Certificación Verificable</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Rinde exámenes cronometrados y obtiene tu certificado con código único QR verificable públicamente por empleadores.
              </p>
            </div>
          </div>
        )}

        {/* Contenido Pestaña 2: Para Empresas */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn" id="empresas">
            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Reducción de Riesgo Operativo</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Evita que los técnicos quemen placas electrónicas costosas en instalaciones reales practicando previamente en el simulador.
              </p>
            </div>

            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Semáforo de Competencia</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dashboard gerencial con métricas en vivo para identificar qué técnicos están listos para salir a campo y cuáles requieren refuerzo.
              </p>
            </div>

            <div className="bg-[#141c2e] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Gestión Corporativa de Asientos</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Asigna y reasigna licencias fácilmente a tus instaladores con facturación consolidada y soporte preferente.
              </p>
            </div>
          </div>
        )}

      </section>

      {/* ------------------ MARKETPLACE DE CREADORES ------------------ */}
      <section id="marketplace" className="py-16 bg-[#0f172a]/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold">
                <Store className="w-3.5 h-3.5" />
                <span>ECOSISTEMA ABIERTO DE CONTENIDO</span>
              </div>
              
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                Marketplace de Fabricantes e Instructores
              </h3>
              
              <p className="text-base text-slate-350 leading-relaxed">
                Accede a un catálogo dinámico en constante expansión. Fabricantes de herrajes e instructores independientes publican simulaciones especializadas en nuevas tecnologías PACS.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <Link
                  href="/marketplace"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all"
                >
                  <span>Explorar Catalog Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-[#141c2e] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">$15.00 USD</span>
                <h5 className="font-bold text-white text-sm">Integración HID Signo & Wiegand</h5>
                <p className="text-xs text-slate-400">Publicado por Instructor Certificado</p>
              </div>

              <div className="bg-[#141c2e] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">$25.00 USD</span>
                <h5 className="font-bold text-white text-sm">Cableado Avanzado Altronix Trove</h5>
                <p className="text-xs text-slate-400">Publicado por Fabricante Oficial</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ SECCIÓN DE PRECIOS ------------------ */}
      <section id="precios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-14">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Planes Transparentes</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Elige el Plan para tu Equipo o Carrera</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Plan Free */}
          <div className="bg-[#141c2e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Individual</span>
              <h4 className="text-2xl font-extrabold text-white">Free</h4>
              <div className="text-3xl font-black font-mono text-white">$0 <span className="text-xs font-normal text-slate-400">/ mes</span></div>
              <ul className="space-y-2.5 text-xs text-slate-350 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Accesso a Sandbox Libre</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Prácticas de componentes básicos</li>
              </ul>
            </div>
            <Link href="/login" className="w-full text-center py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors">
              Comenzar Gratis
            </Link>
          </div>

          {/* Plan Pro Individual */}
          <div className="bg-[#141c2e] border-2 border-emerald-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-emerald-500/10">
            <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 font-bold px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
              Popular Técnicos
            </span>
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Técnico Pro</span>
              <h4 className="text-2xl font-extrabold text-white">Pro</h4>
              <div className="text-3xl font-black font-mono text-white">$24 <span className="text-xs font-normal text-slate-400">/ mes</span></div>
              <ul className="space-y-2.5 text-xs text-slate-350 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Escenarios guiados ilimitados</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Derecho a examen de Certificación</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Perfil técnico verificado</li>
              </ul>
            </div>
            <Link href="/login" className="w-full text-center py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors">
              Suscribirme Pro
            </Link>
          </div>

          {/* Plan Starter Empresa */}
          <div className="bg-[#141c2e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Empresa (5 Asientos)</span>
              <h4 className="text-2xl font-extrabold text-white">Starter</h4>
              <div className="text-3xl font-black font-mono text-white">$129 <span className="text-xs font-normal text-slate-400">/ mes</span></div>
              <ul className="space-y-2.5 text-xs text-slate-350 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Modo diagnóstico para 5 técnicos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Reporte de riesgo operativo básico</li>
              </ul>
            </div>
            <Link href="/login" className="w-full text-center py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors">
              Probar Plan Empresa
            </Link>
          </div>

          {/* Plan Business Empresa */}
          <div className="bg-[#141c2e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Empresa (20 Asientos)</span>
              <h4 className="text-2xl font-extrabold text-white">Business</h4>
              <div className="text-3xl font-black font-mono text-white">$399 <span className="text-xs font-normal text-slate-400">/ mes</span></div>
              <ul className="space-y-2.5 text-xs text-slate-350 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Hasta 20 técnicos incluidos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Reporte completo de semáforo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Soporte técnico prioritario</li>
              </ul>
            </div>
            <Link href="/login" className="w-full text-center py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors">
              Contactar Ventas
            </Link>
          </div>

        </div>
      </section>

      {/* ------------------ SECCIÓN TESTIMONIOS (Comentada según directiva: sin falsedades) ------------------ */}
      {/* 
        TODO: Incorporar testimonios reales de empresas e instaladores certificados cuando se completen las pruebas piloto activas.
      */}

      {/* ------------------ FOOTER AMPLIADO ------------------ */}
      <footer className="bg-[#080b12] border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 w-auto">
              <img src="/logo-banner.png" alt="AccessTech Logo" className="h-full object-contain" />
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Plataforma de simulación de cableado y entrenamiento en seguridad electrónica y sistemas de control de acceso (PACS).
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Producto</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="#demo" className="hover:text-white transition">Simulador Canvas</a></li>
              <li><Link href="/marketplace" className="hover:text-white transition">Marketplace</Link></li>
              <li><a href="#precios" className="hover:text-white transition">Precios & Planes</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Certificación</h5>
            <ul className="space-y-2 font-medium">
              <li><Link href="/verificar/demo" className="hover:text-white transition">Verificar Certificado</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Examen por Niveles</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Acceso</h5>
            <ul className="space-y-2 font-medium">
              <li><Link href="/login" className="hover:text-white transition">Iniciar Sesión</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Registro de Usuario</Link></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} AccessTech Academy. Todos los derechos reservados.</p>
          <p className="font-mono text-[11px]">Sistema PACS v2.4 — Simulación Lógica Verificada</p>
        </div>
      </footer>

    </div>
  );
}
