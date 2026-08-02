"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Cpu, Plus, AlertCircle, Save, FileCode, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

export default function ComponentsCreatorPage() {
  const supabase = createClient();
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

  // Simple terminal editor helper state
  const [terminalLabel, setTerminalLabel] = useState('');
  const [terminalType, setTerminalType] = useState('signal');
  const [terminalX, setTerminalX] = useState(50);
  const [terminalY, setTerminalY] = useState(50);

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
    setGeneratedTerminals(generatedTerminals.filter(t => t.id !== id));
  };

  // Mock Gemini Nano + Banana IA call to produce consistent vector hardware models
  const handleGenerateWithIA = async () => {
    if (!name || !brand || !prompt) {
      setErrorMsg('Por favor completa Nombre, Marca y el Prompt de instrucciones.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Simulamos la latencia de generación de IA (Gemini Nano)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const isHorizontal = prompt.toLowerCase().includes('horizontal') || 
                           prompt.toLowerCase().includes('maglock') || 
                           prompt.toLowerCase().includes('magnetic') ||
                           category === 'electric_strike';
                           
      const hasManyPorts = prompt.toLowerCase().includes('controladora') || 
                           prompt.toLowerCase().includes('controller') || 
                           prompt.toLowerCase().includes('accentra') ||
                           category === 'controller';

      // Generación aleatoria para que cada llamado produzca un diseño visual único y creativo
      const randHue = Math.floor(Math.random() * 360);
      const randDarkColor = `hsl(${randHue}, 35%, 15%)`;
      const randAccentColor = `hsl(${randHue}, 75%, 50%)`;
      const randLightPlate = `hsl(${randHue}, 15%, 85%)`;
      const randMedPlate = `hsl(${randHue}, 10%, 65%)`;
      const chipOffset = Math.floor(Math.random() * 20) - 10;
      const cornerRadius = 6 + Math.floor(Math.random() * 8);

      const categoryColor = category === 'power_supply' ? '#ef4444' : category === 'controller' ? '#3b82f6' : '#10b981';
      const categoryNameUpper = category.replace('_', ' ').toUpperCase();
      
      let svgMarkup = '';

      if (hasManyPorts) {
        // Estilo de Panel de Control PACS Avanzado (Similar al Accentra Assa Abloy)
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">
  <defs>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/>
    </filter>
    <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${randLightPlate}" />
      <stop offset="50%" stop-color="${randMedPlate}" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
    <linearGradient id="circuitBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>
  
  <!-- Chapa metálica o Enclosure base -->
  <rect x="15" y="15" width="390" height="310" rx="${cornerRadius}" fill="url(#metalPlate)" stroke="#1e293b" stroke-width="2.5" filter="url(#shadowHeavy)" />
  
  <!-- Cuatro Tornillos en las esquinas -->
  <circle cx="35" cy="35" r="8" fill="#475569" stroke="#cbd5e1" stroke-width="1.5" />
  <line x1="30" y1="30" x2="40" y2="40" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="385" cy="35" r="8" fill="#475569" stroke="#cbd5e1" stroke-width="1.5" />
  <line x1="380" y1="30" x2="390" y2="40" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="35" cy="305" r="8" fill="#475569" stroke="#cbd5e1" stroke-width="1.5" />
  <line x1="30" y1="300" x2="40" y2="310" stroke="#0f172a" stroke-width="1.5" />
  <circle cx="385" cy="305" r="8" fill="#475569" stroke="#cbd5e1" stroke-width="1.5" />
  <line x1="380" y1="300" x2="390" y2="310" stroke="#0f172a" stroke-width="1.5" />

  <!-- Cuerpo de Placa de Control Interna -->
  <rect x="40" y="40" width="340" height="260" rx="8" fill="url(#circuitBg)" stroke="#94a3b8" stroke-width="1.5" />

  <!-- Logotipo de la marca/modelo -->
  <rect x="135" y="55" width="150" height="36" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
  <text x="210" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#0f172a" text-anchor="middle">${brand.toUpperCase()}</text>
  <text x="210" y="85" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#475569" text-anchor="middle">${name.toUpperCase()}</text>

  <!-- Bloques de Borneros de Conexión (Lados Izquierdo, Derecho, Superior y Inferior) -->
  <!-- Superior -->
  <rect x="120" y="18" width="180" height="22" rx="2" fill="#1e293b" />
  <!-- Izquierdo -->
  <rect x="18" y="70" width="22" height="200" rx="2" fill="#1e293b" />
  <!-- Derecho -->
  <rect x="380" y="70" width="22" height="200" rx="2" fill="#1e293b" />
  <!-- Inferior -->
  <rect x="160" y="300" width="100" height="22" rx="2" fill="#1e293b" />

  <!-- Detalle decorativo de chips y relés -->
  <rect x="${75 + chipOffset}" y="195" width="45" height="40" rx="2" fill="${randDarkColor}" stroke="${randAccentColor}" />
  <rect x="${300 - chipOffset}" y="195" width="45" height="40" rx="2" fill="${randDarkColor}" stroke="${randAccentColor}" />
  
  <text x="75" y="115" font-family="monospace" font-size="7" fill="#64748b">READER 1</text>
  <text x="345" y="115" font-family="monospace" font-size="7" fill="#64748b">READER 2</text>
  <text x="210" y="290" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle">TCP/IP ETHERNET</text>
</svg>`;
      } else if (isHorizontal) {
        // Estilo de Cerradura Electromagnética / Maglock Horizontal Realista
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" width="100%" height="100%">
  <defs>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.6"/>
    </filter>
    <linearGradient id="magBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="30%" stop-color="${randLightPlate}" />
      <stop offset="50%" stop-color="${randMedPlate}" />
      <stop offset="85%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="magPlate" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="50%" stop-color="${randLightPlate}" />
      <stop offset="100%" stop-color="${randMedPlate}" />
    </linearGradient>
  </defs>

  <!-- Soporte o base trasera -->
  <rect x="10" y="15" width="340" height="20" rx="3" fill="#334155" />

  <!-- Cuerpo de Imán Principal (Maglock) -->
  <rect x="25" y="30" width="310" height="100" rx="${cornerRadius}" fill="url(#magBody)" stroke="#1e293b" stroke-width="1.5" filter="url(#shadowHeavy)" />
  
  <!-- Placas de contacto magnético frontal (Armature) -->
  <rect x="40" y="45" width="220" height="70" rx="2" fill="url(#magPlate)" stroke="#64748b" stroke-width="1" />
  
  <!-- Núcleos electromagnéticos en la placa -->
  <rect x="${65 + chipOffset}" y="55" width="45" height="50" rx="4" fill="#0f172a" stroke="${randAccentColor}" stroke-width="2" />
  <rect x="${180 - chipOffset}" y="55" width="45" height="50" rx="4" fill="#0f172a" stroke="${randAccentColor}" stroke-width="2" />
  
  <!-- Compartimento de borneras (Lado derecho del cuerpo) -->
  <rect x="275" y="45" width="50" height="70" rx="2" fill="#1e293b" />
  <!-- Tornillos del bornero interior -->
  <circle cx="290" cy="65" r="4.5" fill="#f1f5f9" stroke="#475569" />
  <circle cx="310" cy="65" r="4.5" fill="#f1f5f9" stroke="#475569" />
  <circle cx="290" cy="95" r="4.5" fill="#f1f5f9" stroke="#475569" />
  <circle cx="310" cy="95" r="4.5" fill="#f1f5f9" stroke="#475569" />
  
  <!-- Luces LED de estado -->
  <circle cx="272" cy="115" r="3.5" fill="#ef4444" />
  <circle cx="272" cy="115" r="2.5" fill="${randAccentColor}" />
  
  <!-- Marca Grabada -->
  <text x="45" y="145" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#475569">${brand.toUpperCase()} - ${name.toUpperCase()}</text>
</svg>`;
      } else {
        // Estilo Vertical Estándar Creativo
        svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 360" width="100%" height="100%">
  <defs>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#020617" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${randLightPlate}" />
      <stop offset="25%" stop-color="#f1f5f9" />
      <stop offset="50%" stop-color="${randMedPlate}" />
      <stop offset="75%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>
    <linearGradient id="bodyBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="${randDarkColor}" />
    </linearGradient>
  </defs>
  
  <!-- Chapa metálica de montaje -->
  <rect x="15" y="10" width="250" height="340" rx="${cornerRadius}" fill="url(#metalPlate)" stroke="#64748b" stroke-width="1.5" filter="url(#shadowHeavy)" />
  <circle cx="140" cy="20" r="6" fill="#020617" stroke="#cbd5e1" stroke-width="0.5" />
  <circle cx="140" cy="340" r="6" fill="#020617" stroke="#cbd5e1" stroke-width="0.5" />
  
  <!-- Enclosure principal del hardware -->
  <rect x="25" y="40" width="180" height="280" rx="6" fill="url(#bodyBg)" stroke="#334155" stroke-width="2" />
  
  <!-- Etiqueta decorativa de la marca/modelo -->
  <rect x="35" y="55" width="160" height="40" rx="4" fill="#020617" stroke="#334155" stroke-width="1" />
  <text x="45" y="72" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="${randAccentColor}">${brand.toUpperCase()}</text>
  <text x="45" y="87" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#ffffff">${name.toUpperCase()}</text>
  
  <!-- Tipo de categoría descriptiva -->
  <text x="45" y="125" font-family="Courier New, monospace" font-size="7" fill="#64748b">TYPE: ${categoryNameUpper}</text>
  
  <!-- Dibujo de circuitería/microchips simulados -->
  <rect x="45" y="145" width="80" height="50" rx="3" fill="#020617" opacity="0.4" stroke="#334155" />
  <rect x="${55 + chipOffset}" y="155" width="20" height="20" rx="1" fill="#3b4f6b" stroke="#475569" />
  <circle cx="${65 + chipOffset}" cy="165" r="3" fill="${randAccentColor}" />
  <line x1="85" y1="160" x2="115" y2="160" stroke="#475569" stroke-width="1" />
  <line x1="85" y1="170" x2="115" y2="170" stroke="#475569" stroke-width="1" stroke-dasharray="2,2" />

  <!-- Bloque de terminales verde (Lado derecho del enclosure) -->
  <rect x="205" y="70" width="45" height="220" rx="2" fill="#15803d" stroke="#166534" stroke-width="1" />
  
  <!-- Tornillos del bornero -->
  <g fill="#020617" stroke="#cbd5e1" stroke-dasharray="0" opacity="0.8">
    <circle cx="227" cy="100" r="5" fill="url(#metalPlate)" />
    <circle cx="227" cy="135" r="5" fill="url(#metalPlate)" />
    <circle cx="227" cy="170" r="5" fill="url(#metalPlate)" />
    <circle cx="227" cy="205" r="5" fill="url(#metalPlate)" />
    <circle cx="227" cy="240" r="5" fill="url(#metalPlate)" />
    <circle cx="227" cy="275" r="5" fill="url(#metalPlate)" />
  </g>
</svg>`;
      }

      // Configuración inteligente y proporcional de puertos según categoría y forma
      let baseTerminals = [];
      if (hasManyPorts) {
        baseTerminals = [
          { id: 't1', label: '12-24 VDC (+)', type: 'positive', x: 42.8, y: 5.3 },
          { id: 't2', label: '12-24 VDC (-)', type: 'negative', x: 49.2, y: 5.3 },
          { id: 't3', label: 'READER 1 RX', type: 'signal', x: 4.8, y: 22.0 },
          { id: 't4', label: 'READER 1 TX', type: 'signal', x: 4.8, y: 32.5 },
          { id: 't5', label: 'READER 2 RX', type: 'signal', x: 95.2, y: 22.0 },
          { id: 't6', label: 'READER 2 TX', type: 'signal', x: 95.2, y: 32.5 },
          { id: 't7', label: 'RELAY 1 COM', type: 'signal', x: 48.0, y: 94.7 },
        ];
      } else if (isHorizontal) {
        baseTerminals = [
          { id: 't1', label: 'V+ (+)', type: 'positive', x: 80.5, y: 40.6 },
          { id: 't2', label: 'V- (-)', type: 'negative', x: 86.1, y: 40.6 },
          { id: 't3', label: 'NO/NC', type: 'signal', x: 80.5, y: 59.4 },
        ];
      } else {
        baseTerminals = category === 'power_supply' ? [
          { id: 't1', label: '+12VDC', type: 'positive', x: 81.0, y: 27.7 },
          { id: 't2', label: 'GND', type: 'negative', x: 81.0, y: 37.5 }
        ] : [
          { id: 't1', label: 'INPUT(+)', type: 'positive', x: 81.0, y: 27.7 },
          { id: 't2', label: 'INPUT(-)', type: 'negative', x: 81.0, y: 37.5 },
          { id: 't3', label: 'RELAY COM', type: 'signal', x: 81.0, y: 47.2 }
        ];
      }

      setGeneratedSvg(svgMarkup);
      setGeneratedTerminals(baseTerminals);
      setSuccessMsg('¡Componente vectorizado creado exitosamente por la IA! Revisa el renderizado y puertos abajo.');
    } catch (err: any) {
      setErrorMsg('Error al generar con IA: ' + err.message);
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

      setSuccessMsg(`¡Componente '${brand} ${name}' guardado correctamente! Ya está disponible en la lista del Sandbox.`);
      
      // Limpiar formulario
      setName('');
      setBrand('');
      setPrompt('');
      setGeneratedSvg(null);
      setGeneratedTerminals([]);
    } catch (err: any) {
      setErrorMsg('Error al guardar componente: ' + err.message);
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
            <span>Generador de Hardware (IA)</span>
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
                <span>1. Especificaciones de Componente</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="AL175, HES-5000"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">Marca</label>
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
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">Categoría</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                >
                  <option value="power_supply">Fuente de Poder (Power Supply)</option>
                  <option value="electric_strike">Cerradero Eléctrico (Electric Strike)</option>
                  <option value="controller">Controladora PACS (Controller)</option>
                  <option value="other">Otro Componente</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase">Instrucciones de generación de IA (Prompt)</label>
                <textarea 
                  rows={4}
                  placeholder="Por ejemplo: Crear un cerradero eléctrico HES 5000, con una placa de acero cepillado, 3 terminales de tornillo del lado derecho: positivo, negativo y común."
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase block">Foto de Referencia (Opcional)</label>
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

              <button
                onClick={handleGenerateWithIA}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-3 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vectorizando con IA...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Generar Componente (Gemini Nano)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: IA SVG Output Viewer */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span>2. Renderizado SVG de IA</span>
                {generatedSvg && (
                  <button
                    onClick={handleSaveComponent}
                    disabled={loading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar e Incorporar</span>
                  </button>
                )}
              </h3>

              {generatedSvg ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Vista previa del SVG interactivo */}
                  <div 
                    className="md:col-span-7 bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-center min-h-[380px] relative select-none"
                    onMouseMove={(e) => {
                      // Buscar si hay algún puerto arrastrándose activamente
                      const draggingId = (window as any).__draggingTerminalId;
                      if (!draggingId) return;
                      
                      const container = e.currentTarget;
                      const rect = container.getBoundingClientRect();
                      
                      // Calcular porcentaje proporcional relativo a la caja contenedora
                      const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
                      const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10));
                      
                      setGeneratedTerminals(prev => 
                        prev.map(t => t.id === draggingId ? { ...t, x, y } : t)
                      );
                    }}
                    onMouseUp={() => {
                      (window as any).__draggingTerminalId = null;
                    }}
                    onMouseLeave={() => {
                      (window as any).__draggingTerminalId = null;
                    }}
                  >
                    <div 
                      className="w-full h-full object-contain relative pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: generatedSvg }}
                    />
                    
                    {/* Rendered Handles interactivos de arrastre */}
                    {generatedTerminals.map(t => (
                      <div
                        key={t.id}
                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          (window as any).__draggingTerminalId = t.id;
                        }}
                        className="absolute w-4 h-4 bg-emerald-500 hover:bg-emerald-400 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl flex items-center justify-center text-[10px] text-white z-40 cursor-move active:scale-125 transition-transform active:bg-yellow-500"
                        title={`Arrastra para reubicar ${t.label}`}
                      >
                        •
                      </div>
                    ))}
                  </div>

                  {/* Panel de edición de puertos */}
                  <div className="md:col-span-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                      Puertos ({generatedTerminals.length})
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
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Añadir Puerto</span>
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
                        Agregar Terminal
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950/60 border-2 border-dashed border-slate-300 dark:border-slate-800/80 rounded-xl min-h-[380px] flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                  <FileCode className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-xs font-semibold">No se ha generado ningún componente todavía.</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-1">Completa las especificaciones del formulario de la izquierda y haz clic en "Generar Componente" para ver el vector generado.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
