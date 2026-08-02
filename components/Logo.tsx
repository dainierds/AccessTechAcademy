"use client";

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  isDark?: boolean;
}

export default function Logo({
  size = 'md',
  showWordmark = true,
  className = '',
  isDark = false,
}: LogoProps) {
  // Ajuste de proporciones perfectas (aspect-ratio 1:1 o ancho proporcional sin compresión vertical)
  const iconSizes = {
    sm: 'w-7 h-7',    // 28x28px
    md: 'w-10 h-10',  // 40x40px
    lg: 'w-12 h-12',  // 48x48px
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Réplica Vectorial Estilizada con Proporciones Esbeltas Sin Compresión */}
      <svg
        className={`${iconSizes[size]} flex-shrink-0 transition-transform duration-200 hover:scale-105`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Degradado oficial AccessTech para la letra 'A' y el Swoosh frontal */}
          <linearGradient id="accesstech-a-grad-v2" x1="10" y1="5" x2="80" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="45%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          {/* Sombra sutil de la curva swoosh que abraza la T */}
          <filter id="swoosh-shadow-v2" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Letra 'T' (POR DEBAJO DE LA 'A', EN COLOR NEGRO / SLATE OSCURO) */}
        <g fill={isDark ? '#f1f5f9' : '#1e293b'}>
          {/* Brazo horizontal y pilar vertical de la T con altura completa y esbelta */}
          <path d="M 44 14 L 88 14 L 88 28 L 74 28 L 74 88 L 56 88 L 56 28 L 44 28 Z" />
          {/* Detalle 3D de sombra sutil del brazo derecho de la T */}
          <path d="M 74 28 L 88 28 L 88 32 L 74 32 Z" fill="#0f172a" opacity="0.25" />
        </g>

        {/* 2. Letra 'A' (ESBELTA, ESTIRADA VERTICALMENTE EN PRIMER PLANO CON DEGRADADO ACCESSTECH) */}
        <path
          d="M 38 6 L 54 6 L 68 88 L 52 88 L 47 56 L 25 56 L 19 88 L 4 88 Z M 30 40 L 42 40 L 36 20 Z"
          fill="url(#accesstech-a-grad-v2)"
        />

        {/* 3. Curva 'Swoosh' Fluida (Corta de forma esbelta hacia la derecha superior) */}
        <path
          d="M 2 72 C 20 58, 42 34, 94 8 C 68 34, 40 70, 14 84 Z"
          fill="url(#accesstech-a-grad-v2)"
          filter="url(#swoosh-shadow-v2)"
        />
      </svg>

      {/* Wordmark Typográfico "AccessTech" */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-display font-extrabold tracking-tight ${textSizes[size]} ${
            isDark ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}>
            Access<span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 bg-clip-text text-transparent">Tech</span>
          </span>
        </div>
      )}
    </div>
  );
}
