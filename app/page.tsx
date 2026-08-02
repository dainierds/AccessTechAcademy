/*
================================================================================
SISTEMA DE DISEÑO CON SOPORTE COMPLETO LIGHT / DARK MODE & MULTILENGUAJE (EN/ES)
================================================================================
1. IDIOMA POR DEFECTO EN INGLÉS ('en'):
   - Conmutación en tiempo real entre EN y ES con selector estilizado en la esquina.
   - Traduce automáticamente todas las secciones, títulos, metadatos y botones.
================================================================================
*/

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Building2, 
  Users, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Lock, 
  Wrench, 
  Check, 
  ShieldAlert,
  FileCheck,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import LogoFull from '@/components/LogoFull';
import HeroSimulatorDemo from '@/components/marketing/HeroSimulatorDemo';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'technicians' | 'companies'>('technicians');
  const [isDarkMode, setIsDarkMode] = useState(false); // Por defecto en Modo Claro
  const [lang, setLang] = useState<Language>('en'); // Por defecto en Inglés

  React.useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang);
    }
    
    // Leer tema guardado
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  }, []);

  const t = translations[lang];

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('app_theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'es' : 'en';
    setLang(nextLang);
    localStorage.setItem('app_lang', nextLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0b0f19] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300' 
        : 'bg-[#ecf0f1] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-800'
    }`}>
      
      {/* ------------------ NAVIGATION HEADER ------------------ */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#0b0f19]/90 border-slate-800/80' 
          : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <LogoFull size="md" isDark={isDarkMode} />
          </Link>

          {/* Links principales */}
          <nav className={`hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <a href="#demo" className="hover:text-emerald-500 transition-colors">{t.nav.simulator}</a>
            <a href="#soluciones" className="hover:text-emerald-500 transition-colors">{t.nav.solutions}</a>
            <a href="#marketplace" className="hover:text-emerald-500 transition-colors">{t.nav.marketplace}</a>
            <a href="#precios" className="hover:text-emerald-500 transition-colors">{t.nav.pricing}</a>
            <Link href="/verificar/demo" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.nav.verify}</span>
            </Link>
          </nav>

          {/* Acciones: Switch Lenguaje (EN/ES) & Switch Tema (Light/Dark) */}
          <div className="flex items-center gap-2.5">
            
            {/* TOGGLE IDIOMA (EN / ES) Estilizado */}
            <button
              onClick={toggleLanguage}
              aria-label="Toggle Language"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold font-mono transition-all shadow-sm ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-indigo-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-100'
              }`}
              title="Change Language / Cambiar Idioma"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* SWITCH TOGGLE LIGHT / DARK */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Mode"
              className={`p-2 rounded-xl border transition-all shadow-sm ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <Link 
              href="/login" 
              className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-colors shadow-sm hidden sm:inline-block ${
                isDarkMode 
                  ? 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200' 
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
              }`}
            >
              {t.nav.login}
            </Link>

            <Link 
              href="/login" 
              className="text-xs font-bold px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200"
            >
              {t.nav.practice}
            </Link>

          </div>
        </div>
      </header>

      {/* ------------------ HERO SECTION ------------------ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow de Fondo */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] blur-[140px] pointer-events-none rounded-full ${
          isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/20'
        }`} />
        <div className={`absolute top-1/3 right-10 w-[400px] h-[300px] blur-[130px] pointer-events-none rounded-full ${
          isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-500/20'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Columna Izquierda: Copy de Posicionamiento Real */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wide shadow-inner ${
                isDarkMode 
                  ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-400' 
                  : 'bg-white border-emerald-500/40 text-emerald-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{t.hero.badge}</span>
              </div>

              <h1 className={`font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${
                isDarkMode ? 'text-white' : 'text-slate-950'
              }`}>
                {t.hero.headline}<span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 bg-clip-text text-transparent">{t.hero.headlineGradient}</span>{t.hero.headlineEnd}
              </h1>

              <p className={`text-base sm:text-lg max-w-2xl font-normal leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t.hero.description}
              </p>

              {/* Botones CTAs Claramente Diferenciados */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all transform hover:-translate-y-0.5"
                >
                  <span>{t.hero.ctaPractice}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#empresas"
                  className={`flex items-center justify-center gap-2 px-7 py-4 rounded-xl border font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200' 
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>{t.hero.ctaCompanies}</span>
                </a>
              </div>

              {/* Métricas de Dominio / Datos Reales */}
              <div className={`pt-8 border-t grid grid-cols-3 gap-4 text-left ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-300'
              }`}>
                <div>
                  <p className={`font-display text-2xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>0%</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.hero.metric1Label}</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black font-mono text-emerald-500">100%</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.hero.metric2Label}</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black font-mono text-indigo-500">Level 1-5</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.hero.metric3Label}</p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: FIRMA DE MARCA (Demo Interactivo de Cableado Bezier Autoconectable) */}
            <div className="lg:col-span-5 relative">
              <HeroSimulatorDemo isDarkMode={isDarkMode} lang={lang} />
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ DEMO VISUAL DEL PRODUCTO REAL ------------------ */}
      <section id="demo" className={`py-20 border-y transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0f172a]/60 border-slate-800/80' : 'bg-slate-200/50 border-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Columna Izquierda: Título y Datos Técnicos */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                isDarkMode 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-emerald-700 bg-emerald-50 border-emerald-300'
              }`}>
                {t.simulatorDemo.scenarioBadge}
              </span>
              
              <h2 className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-950'
              }`}>
                {t.simulatorDemo.title}
              </h2>
              
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {t.simulatorDemo.description}
              </p>

              <div className={`pt-2 flex flex-col gap-2 font-mono text-xs border-t ${
                isDarkMode ? 'text-slate-400 border-slate-800/80' : 'text-slate-600 border-slate-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t.simulatorDemo.failSafeText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{t.simulatorDemo.voltageText}</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha Amplia */}
            <div className="lg:col-span-8">
              <div className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-colors ${
                isDarkMode ? 'bg-[#0b0f19] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                
                <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>HARDWARE CANVAS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isDarkMode 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.simulatorDemo.closedStatus}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
                  <div className={`border rounded-xl p-4 space-y-3 ${
                    isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Panel PACS</h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>Door Module</span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>RELAY COM</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      </div>
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>RELAY NC</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>RELAY NO</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 space-y-3 ${
                    isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wide">Fuente Auxiliar</h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>Altronix AL175</span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>+12VDC OUT</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      </div>
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>GND OUT</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 space-y-3 ${
                    isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Cerradura</h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>HES 5000</span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>COIL (+)</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      </div>
                      <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>COIL (-)</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------ SECCIÓN DIFERENCIADA ------------------ */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-12">
          <h2 className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-950'
          }`}>
            {t.solutions.title}
          </h2>
          
          <div className={`inline-flex p-1.5 rounded-xl border mt-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
          }`}>
            <button
              onClick={() => setActiveTab('technicians')}
              className={`px-6 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'technicians'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.solutions.tabTech}
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              aria-label="Soluciones para empresas"
              className={`px-6 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === 'companies'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.solutions.tabCompanies}
            </button>
          </div>
        </div>

        {activeTab === 'technicians' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.tech1Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.tech1Desc}</p>
            </div>

            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.tech2Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.tech2Desc}</p>
            </div>

            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Award className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.tech3Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.tech3Desc}</p>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn" id="empresas">
            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.comp1Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.comp1Desc}</p>
            </div>

            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Users className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.comp2Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.comp2Desc}</p>
            </div>

            <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
              isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-500/60 shadow-md'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.solutions.comp3Title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.solutions.comp3Desc}</p>
            </div>
          </div>
        )}

      </section>

      {/* ------------------ MARKETPLACE DE CREADORES ------------------ */}
      <section id="marketplace" className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0f172a]/60 border-slate-800/80' : 'bg-slate-200/50 border-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                isDarkMode ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-purple-700 bg-purple-50 border-purple-300'
              }`}>
                {t.marketplaceSection.badge}
              </span>

              <h2 className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-950'
              }`}>
                {t.marketplaceSection.title}
              </h2>
              
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {t.marketplaceSection.description}
              </p>

              <div className="pt-2">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                >
                  <span>{t.marketplaceSection.button}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`border p-6 rounded-xl space-y-3 transition-colors ${
                isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-purple-500/40' : 'bg-white border-slate-200 hover:border-purple-500/60 shadow-sm'
              }`}>
                <span className="text-xs font-mono text-emerald-500 font-extrabold">$15.00 USD</span>
                <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.marketplaceSection.item1Title}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.marketplaceSection.item1Author}</p>
              </div>

              <div className={`border p-6 rounded-xl space-y-3 transition-colors ${
                isDarkMode ? 'bg-[#141c2e] border-slate-800 hover:border-purple-500/40' : 'bg-white border-slate-200 hover:border-purple-500/60 shadow-sm'
              }`}>
                <span className="text-xs font-mono text-emerald-500 font-extrabold">$25.00 USD</span>
                <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.marketplaceSection.item2Title}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.marketplaceSection.item2Author}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ SECCIÓN DE PRECIOS ------------------ */}
      <section id="precios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-14">
          <h2 className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-950'
          }`}>
            {t.pricingSection.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Plan Free */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 ${
            isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="space-y-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingSection.individual}</span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.freeTitle}</h3>
              <div className={`text-3xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.freePrice} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingSection.freePerMonth}</span></div>
              <ul className={`space-y-2.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.freeItem1}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.freeItem2}</li>
              </ul>
            </div>
            <Link href="/login" className={`w-full text-center py-3 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white' 
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}>
              {t.pricingSection.freeCta}
            </Link>
          </div>

          {/* Plan Pro Individual */}
          <div className={`border border-t-4 border-t-emerald-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl ${
            isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{t.pricingSection.proBadge}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 border px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t.pricingSection.proValidated}</span>
                </span>
              </div>
              
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.proTitle}</h3>
              <div className={`text-3xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.proPrice} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingSection.proPerMonth}</span></div>
              
              <ul className={`space-y-2.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.proItem1}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.proItem2}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.proItem3}</li>
              </ul>
            </div>
            <Link href="/login" className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-colors shadow-md">
              {t.pricingSection.proCta}
            </Link>
          </div>

          {/* Plan Starter Empresa */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 ${
            isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="space-y-4">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{t.pricingSection.starterBadge}</span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.starterTitle}</h3>
              <div className={`text-3xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.starterPrice} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingSection.starterPerMonth}</span></div>
              <ul className={`space-y-2.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.starterItem1}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.starterItem2}</li>
              </ul>
            </div>
            <Link href="/login" className={`w-full text-center py-3 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white' 
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}>
              {t.pricingSection.starterCta}
            </Link>
          </div>

          {/* Plan Business Empresa */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 ${
            isDarkMode ? 'bg-[#141c2e] border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="space-y-4">
              <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">{t.pricingSection.businessBadge}</span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.businessTitle}</h3>
              <div className={`text-3xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.pricingSection.businessPrice} <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingSection.businessPerMonth}</span></div>
              <ul className={`space-y-2.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.businessItem1}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.businessItem2}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t.pricingSection.businessItem3}</li>
              </ul>
            </div>
            <Link href="/login" className={`w-full text-center py-3 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white' 
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}>
              {t.pricingSection.businessCta}
            </Link>
          </div>

        </div>
      </section>

      {/* ------------------ FOOTER AMPLIADO ------------------ */}
      <footer className={`border-t pt-16 pb-12 text-xs transition-colors duration-300 ${
        isDarkMode ? 'bg-[#080b12] border-slate-800/80 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          <div className="md:col-span-2 space-y-4">
            <LogoFull size="md" isDark={isDarkMode} />
            <p className={`max-w-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.footer.description}
            </p>
          </div>

          <div>
            <h4 className={`font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.footer.product}</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#demo" className="hover:text-emerald-500 transition">{t.nav.simulator}</a></li>
              <li><Link href="/marketplace" className="hover:text-emerald-500 transition">{t.nav.marketplace}</Link></li>
              <li><a href="#precios" className="hover:text-emerald-500 transition">{t.nav.pricing}</a></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.footer.certification}</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/verificar/demo" className="hover:text-emerald-500 transition">{t.nav.verify}</Link></li>
              <li><Link href="/login" className="hover:text-emerald-500 transition">Exam</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.footer.access}</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/login" className="hover:text-emerald-500 transition">{t.nav.login}</Link></li>
              <li><Link href="/login" className="hover:text-emerald-500 transition">{t.nav.practice}</Link></li>
            </ul>
          </div>

        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDarkMode ? 'border-slate-900 text-slate-400' : 'border-slate-300 text-slate-600'
        }`}>
          <p>© {new Date().getFullYear()} AccessTech Academy. {t.footer.rights}</p>
          <p className="font-mono text-[11px]">{t.footer.version}</p>
        </div>
      </footer>

    </div>
  );
}
