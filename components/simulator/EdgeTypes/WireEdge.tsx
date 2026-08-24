import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

export default function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // Calculamos la distancia horizontal
  const dx = Math.abs(targetX - sourceX);
  
  // Agregar "sag" (colgado) incrementando la curva hacia abajo proporcional a la distancia horizontal
  const sagOffset = Math.min(dx * 0.25, 120);
  
  // Modificamos el path para simular gravedad de cable física
  const controlY1 = sourceY + sagOffset;
  const controlY2 = targetY + sagOffset;
  const edgePath = `M ${sourceX},${sourceY} C ${sourceX},${controlY1} ${targetX},${controlY2} ${targetX},${targetY}`;

  // Colores dinámicos basados en polaridad, tipo de cable y validación
  let wireColor = (data as any)?.color_hex || (data as any)?.color || '#64748b'; // Color base por defecto o del cable_type
  
  const isPositive = id.includes('12v') || id.includes('pos') || (data as any)?.sourceHandle?.includes('12v') || (data as any)?.sourceHandle?.includes('pos');
  const isNegative = id.includes('gnd') || id.includes('neg') || (data as any)?.sourceHandle?.includes('gnd') || (data as any)?.sourceHandle?.includes('neg');

  if (!data?.color_hex) {
    if (isPositive) {
      wireColor = '#f97316'; // Naranja-rojizo para +12VDC/POS
    } else if (isNegative) {
      wireColor = '#475569'; // Slate gris azulado para GND/NEG
    }
  }

  // Sobrescribir con estados de validación final correct/incorrect
  if (data?.status === 'correct') {
    wireColor = '#10b981'; // Verde brillante
  } else if (data?.status === 'incorrect') {
    wireColor = '#ef4444'; // Rojo vibrante
  }

  const isIncorrect = data?.status === 'incorrect';
  const isCorrect = data?.status === 'correct';

  // Grosor de cable según gauge (AWG 18 = 6px, AWG 22 = 4px, default = 5px)
  const gauge = (data as any)?.gauge;
  let strokeWidth = 5;
  if (gauge === 18) strokeWidth = 6.5;
  else if (gauge === 22) strokeWidth = 4;
  else if (gauge) strokeWidth = Math.max(3.5, Math.min(7, 10 - gauge * 0.2));

  return (
    <>
      {/* Sombra de profundidad en el fondo */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={strokeWidth + 2}
        style={{
          filter: 'blur(3px)',
        }}
      />
      
      {/* Glow de error pulsante si aplica */}
      {isIncorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#f87171"
          strokeWidth={strokeWidth + 4}
          style={{
            opacity: 0.6,
            filter: 'blur(4px)',
            animation: 'wirePulse 1.2s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Cable principal */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style as React.CSSProperties),
          stroke: wireColor as string,
          strokeWidth: strokeWidth,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.5))',
        }}
      />

      {/* Flujo eléctrico si es correcto */}
      {isCorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#4ade80"
          strokeWidth={2.5}
          strokeDasharray="12,12"
          style={{
            animation: 'wireFlow 0.6s linear infinite',
            filter: 'drop-shadow(0px 0px 3px #22c55e)',
          }}
        />
      )}
    </>
  );
}
