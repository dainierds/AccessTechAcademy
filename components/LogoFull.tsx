"use client";

import React from 'react';

interface LogoFullProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isDark?: boolean;
}

export default function LogoFull({
  size = 'md',
  className = '',
  isDark = false,
}: LogoFullProps) {
  const iconSizes = {
    sm: 'w-7 h-7',    // 28x28px
    md: 'w-9 h-9',    // 36x36px
    lg: 'w-11 h-11',  // 44x44px
  };

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
  };

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* Monograma Geométrico Entrelazado (Misma Versión 1 del Favicon) */}
      <svg
        className={`${iconSizes[size]} flex-shrink-0 transition-transform duration-200 hover:scale-105`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-full-brand-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <filter id="logo-full-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        <g filter="url(#logo-full-shadow)">
          <path
            d="M 38 18 L 54 18 L 68 82 L 52 82 L 47 54 L 27 54 L 21 82 L 8 82 Z M 31 38 L 41 38 L 36 22 Z"
            fill="url(#logo-full-brand-grad)"
          />
          <path
            d="M 44 24 L 84 24 L 84 36 L 72 36 L 72 82 L 58 82 L 58 36 L 44 36 Z"
            fill="url(#logo-full-brand-grad)"
            opacity="0.9"
          />
          <path
            d="M 12 68 C 28 54, 48 32, 90 12 C 68 34, 42 66, 18 78 Z"
            fill="url(#logo-full-brand-grad)"
          />
        </g>
      </svg>

      {/* Divisor Vertical Delgado con margen dinámico */}
      <div className={`h-7 w-px flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

      {/* Wordmark en 2 Líneas Espaciadas (ACCESSTECH / ACADEMY) */}
      <div className="flex flex-col justify-center gap-0.5 whitespace-nowrap">
        <span className={`font-display font-extrabold uppercase tracking-tight leading-none ${titleSizes[size]} ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          ACCESSTECH
        </span>
        <span className={`font-mono font-bold uppercase tracking-widest leading-none ${subtitleSizes[size]} text-emerald-500`}>
          ACADEMY
        </span>
      </div>
    </div>
  );
}
