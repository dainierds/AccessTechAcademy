"use client";

import React from 'react';
import { EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';

/* ==========================================================================
   ACCESSCONTROL LAB - MOTOR DE RENDERIZADO DE CABLES Y CONDUCTORES
   (Integrado exactamente según el código especificado por el usuario)
   ========================================================================== */

// 1. PALETA DE COLORES DE CONDUCTORES
export const WIRE_COLORS: Record<string, string> = {
  'red': '#e74c3c',
  'black': '#1c2128',
  'white': '#ecf0f1',
  'green': '#2ecc71',
  'blue': '#3498db',
  'yellow': '#f1c40f',
  'orange': '#e67e22',
  'purple': '#9b59b6'
};

// 2. CONFIGURACIÓN DE TIPOS Y CALIBRES DE CABLE
export const CABLE_CONFIGS: Record<string, { name: string; conductors: string[]; gauge: string }> = {
  '18/2': {
    name: 'Cable 18/2 (2x 18 AWG)',
    conductors: ['red', 'black'],
    gauge: '18'
  },
  '18/4': {
    name: 'Cable 18/4 (4x 18 AWG)',
    conductors: ['red', 'black', 'white', 'green'],
    gauge: '18'
  },
  '22/6': {
    name: 'Cable Signal 22/6 (6x 22 AWG)',
    conductors: ['red', 'black', 'white', 'green', 'blue', 'yellow'],
    gauge: '22'
  },
  'Composite': {
    name: 'Cable Compuesto (8 Conductores)',
    conductors: ['red', 'black', 'white', 'green', 'blue', 'yellow', 'orange', 'purple'],
    gauge: 'mixed'
  }
};

/**
 * 3. ALGORITMO DE CÁLCULO DEL PUNTO DE SALIDA / BOCA DE LA CHAQUETA
 * Calcula la posición de la boca del forro fuera del rectángulo del dispositivo.
 */
export function getDeviceBreakoutPoint(
  dev: any,
  terminals: { x: number; y: number }[]
): { x: number; y: number } | null {
  if (!dev || !dev.position || terminals.length === 0) return null;

  const devX = dev.position.x;
  const devY = dev.position.y;
  const devW = dev.measured?.width || dev.data?.default_width || 240;
  const devH = dev.measured?.height || dev.data?.default_height || 200;

  // Promedio / Centroide de las coordenadas de los bornes en uso
  const avgX = terminals.reduce((sum, p) => sum + p.x, 0) / terminals.length;
  const avgY = terminals.reduce((sum, p) => sum + p.y, 0) / terminals.length;

  // Determinar la pared exterior más cercana del equipo
  const distLeft = avgX - devX;
  const distRight = (devX + devW) - avgX;
  const distTop = avgY - devY;
  const distBottom = (devY + devH) - avgY;

  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  const margin = 28; // Distancia de separación fuera de la caja del equipo

  let breakoutX = avgX;
  let breakoutY = avgY;

  if (minDist === distBottom) {
    breakoutY = devY + devH + margin;
  } else if (minDist === distTop) {
    breakoutY = devY - margin;
  } else if (minDist === distLeft) {
    breakoutX = devX - margin;
  } else if (minDist === distRight) {
    breakoutX = devX + devW + margin;
  }

  return { x: breakoutX, y: breakoutY };
}

export default function WireEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandleId,
  targetHandleId,
  style = {},
  data,
}: EdgeProps) {
  const { nodes, edges, removeEdge } = useSimulatorSandboxStore();

  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  // 1. AGRUPACIÓN POR BUNDLE ID DE MAZO
  const cableType = (data as any)?.cable_type_id || (data as any)?.cableType || '18/2';
  const bundleId = (data as any)?.bundleId || [source, target].sort().join('___') + `_${cableType}`;

  const wireGroup = edges.filter(e => {
    const bId = (e.data as any)?.bundleId || [e.source, e.target].sort().join('___') + `_${(e.data as any)?.cable_type_id || (e.data as any)?.cableType || '18/2'}`;
    return bId === bundleId;
  });

  const isFirstInBundle = wireGroup.length > 0 ? wireGroup[0].id === id : true;

  // 2. RECOPILAR TERMINALES CONECTADOS DEL GRUPO EN ORIGEN Y DESTINO
  const fromTerminals: { x: number; y: number }[] = [];
  const toTerminals: { x: number; y: number }[] = [];

  wireGroup.forEach(e => {
    if (e.id === id) {
      fromTerminals.push({ x: sourceX, y: sourceY });
      toTerminals.push({ x: targetX, y: targetY });
    } else {
      fromTerminals.push({ x: sourceX, y: sourceY });
      toTerminals.push({ x: targetX, y: targetY });
    }
  });

  // 3. CALCULAR BOMAS DE SALIDA ÚNICAS FUERA DE LOS EQUIPOS
  const breakoutFrom = getDeviceBreakoutPoint(sourceNode, fromTerminals) || { x: sourceX - 28, y: sourceY };
  const breakoutTo = getDeviceBreakoutPoint(targetNode, toTerminals) || { x: targetX + 28, y: targetY };

  // A. CÁLCULO DE LA CHAQUETA PVC DE LA CABLE RUN
  const x1 = breakoutFrom.x;
  const y1 = breakoutFrom.y;
  const x2 = breakoutTo.x;
  const y2 = breakoutTo.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);

  const midX = (x1 + x2) / 2;
  const sag = Math.min(50, dist * 0.12);
  const midY = (y1 + y2) / 2 + sag;

  const jacketThickness = (cableType === 'Composite' || cableType === '22/6' || wireGroup.length > 4) ? 16 : 12;

  const jacketPath = `M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`;

  // B. CÁLCULO DE LOS PIGTAILS EN ABANICO DESDE LA BOCA A CADA BORNE
  const colorName = ((data as any)?.color || (data as any)?.color_name || 'red').toLowerCase();
  const colorHex = WIRE_COLORS[colorName] || WIRE_COLORS['red'];
  const gauge = (data as any)?.gauge || '18';
  const wireWidth = (gauge === '22') ? 3.5 : 5.0;

  // Curvas S-Bezier desde las bocas breakout a los bornes terminales
  const midFromY = (sourceY + y1) / 2;
  const srcPigtailPath = `M ${x1},${y1} C ${x1},${midFromY} ${sourceX},${midFromY} ${sourceX},${sourceY}`;

  const midToY = (targetY + y2) / 2;
  const tgtPigtailPath = `M ${x2},${y2} C ${x2},${midToY} ${targetX},${midToY} ${targetX},${targetY}`;

  const labelText = colorName.toUpperCase();

  return (
    <>
      {/* 5. DIBUJO REALISTA DE LA CHAQUETA PVC (Solo el primer hilo del mazo la renderiza) */}
      {isFirstInBundle && (
        <>
          <path
            d={jacketPath}
            fill="none"
            stroke="transparent"
            strokeWidth={32}
            className="cursor-pointer pointer-events-stroke"
          />

          {/* Sombra proyectada en el fondo */}
          <path
            d={jacketPath}
            fill="none"
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth={jacketThickness + 6}
            style={{
              filter: 'blur(6px)',
              transform: 'translateY(5px)',
            }}
          />

          {/* Cuerpo principal de la chaqueta PVC (`#222831`) */}
          <path
            d={jacketPath}
            fill="none"
            stroke="#222831"
            strokeWidth={jacketThickness}
            strokeLinecap="round"
          />

          {/* Brillo de volumen en la parte superior del tubo */}
          <path
            d={jacketPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth={jacketThickness * 0.25}
            strokeLinecap="round"
            style={{
              transform: 'translateY(-2px)',
              pointerEvents: 'none',
            }}
          />

          {/* Anillos metálicos de las bocas de la chaqueta (Corte pelado) */}
          <circle cx={x1} cy={y1} r={jacketThickness * 0.55} fill="#0f1318" stroke="#465366" strokeWidth={2} />
          <circle cx={x2} cy={y2} r={jacketThickness * 0.55} fill="#0f1318" stroke="#465366" strokeWidth={2} />

          {/* Botón de Eliminación en el centro del mazo */}
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  wireGroup.forEach(be => removeEdge(be.id));
                }}
                className="w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-lg hover:scale-125 transition-transform cursor-pointer border border-white/40"
                title="Eliminar mazo de cable completo"
              >
                ✕
              </button>
            </div>
          </EdgeLabelRenderer>
        </>
      )}

      {/* 6. DIBUJO DE CONDUCTORES DELGADOS (PIGTAILS EN ABANICO) */}

      {/* 1. Sombra de borde oscuro */}
      <path d={srcPigtailPath} fill="none" stroke="#05070a" strokeWidth={wireWidth + 2.5} strokeLinecap="round" />
      <path d={tgtPigtailPath} fill="none" stroke="#05070a" strokeWidth={wireWidth + 2.5} strokeLinecap="round" />

      {/* 2. Cuerpo del conductor aislado (Color vivo) */}
      <path d={srcPigtailPath} fill="none" stroke={colorHex} strokeWidth={wireWidth} strokeLinecap="round" />
      <path d={tgtPigtailPath} fill="none" stroke={colorHex} strokeWidth={wireWidth} strokeLinecap="round" />

      {/* 3. Franja longitudinal de brillo */}
      {colorName !== 'white' && (
        <>
          <path d={srcPigtailPath} fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth={wireWidth * 0.3} strokeLinecap="round" />
          <path d={tgtPigtailPath} fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth={wireWidth * 0.3} strokeLinecap="round" />
        </>
      )}

      {/* 4. Pin de cobre dorado aterrizando sobre el tornillo del borne */}
      <g pointerEvents="none">
        <circle cx={sourceX} cy={sourceY} r={3.8} fill="#f39c12" stroke="#2c3e50" strokeWidth={1.2} />
        <circle cx={targetX} cy={targetY} r={3.8} fill="#f39c12" stroke="#2c3e50" strokeWidth={1.2} />
      </g>

      {/* 5. Cartel / Etiqueta de color sobre el borne (ej: RED, BLACK) */}
      <g pointerEvents="none">
        {/* Origen Tag */}
        <rect
          x={sourceX - 16}
          y={sourceY - 14}
          width={32}
          height={12}
          rx={3}
          fill="rgba(15, 18, 24, 0.85)"
          stroke={colorHex}
          strokeWidth={1}
        />
        <text
          x={sourceX}
          y={sourceY - 7}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {labelText}
        </text>

        {/* Destino Tag */}
        <rect
          x={targetX - 16}
          y={targetY - 14}
          width={32}
          height={12}
          rx={3}
          fill="rgba(15, 18, 24, 0.85)"
          stroke={colorHex}
          strokeWidth={1}
        />
        <text
          x={targetX}
          y={targetY - 7}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {labelText}
        </text>
      </g>
    </>
  );
}
