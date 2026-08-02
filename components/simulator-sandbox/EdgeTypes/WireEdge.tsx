import { BaseEdge, EdgeProps, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { useSimulatorSandboxStore } from '@/hooks/useSimulatorSandboxStore';

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
  const { removeEdge } = useSimulatorSandboxStore();

  // Calcular la distancia y definir el colgado (sag)
  const dx = Math.abs(targetX - sourceX);
  const sagOffset = Math.min(dx * 0.25, 120);

  // Usar getBezierPath nativo para obtener una base confiable, pero sumando el offset en el eje Y
  // para dar el colgado flexible
  const controlY1 = sourceY + sagOffset;
  const controlY2 = targetY + sagOffset;
  const edgePath = `M ${sourceX},${sourceY} C ${sourceX},${controlY1} ${targetX},${controlY2} ${targetX},${targetY}`;

  const labelX = (sourceX + targetX) / 2;
  const labelY = ((sourceY + targetY) / 2) + (sagOffset * 0.5);

  let wireColor = (data as any)?.color_hex || (data as any)?.color || '#64748b';
  
  const isPositive = id.includes('12v') || id.includes('pos') || (data as any)?.sourceHandle?.includes('12v') || (data as any)?.sourceHandle?.includes('pos');
  const isNegative = id.includes('gnd') || id.includes('neg') || (data as any)?.sourceHandle?.includes('gnd') || (data as any)?.sourceHandle?.includes('neg');

  if (!data?.color_hex) {
    if (isPositive) {
      wireColor = '#f97316';
    } else if (isNegative) {
      wireColor = '#475569';
    }
  }

  if (data?.status === 'correct') {
    wireColor = '#10b981';
  } else if (data?.status === 'incorrect') {
    wireColor = '#ef4444';
  }

  const isIncorrect = data?.status === 'incorrect';
  const isCorrect = data?.status === 'correct';

  const gauge = (data as any)?.gauge;
  let strokeWidth = 10; // Aumentar grosor base a 10px para cumplir con el nivel de la imagen
  if (gauge === 18) strokeWidth = 12;
  else if (gauge === 22) strokeWidth = 8;
  else if (gauge) strokeWidth = Math.max(7, Math.min(14, 16 - gauge * 0.3));

  return (
    <>
      {/* Área interactiva invisible súper ancha para hacer click fácil */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        className="cursor-pointer pointer-events-stroke"
      />

      {/* Sombra de oclusión ambiental del cable para despegarlo del fondo */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={strokeWidth + 4}
        style={{
          filter: 'blur(5px)',
        }}
      />
      
      {/* Brillo interno/externo (Glow Neon effect) */}
      <path
        d={edgePath}
        fill="none"
        stroke={wireColor}
        strokeWidth={strokeWidth + 6}
        style={{
          opacity: 0.35,
          filter: 'blur(4px)',
        }}
      />
      
      {isIncorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#f87171"
          strokeWidth={strokeWidth + 8}
          style={{
            opacity: 0.6,
            filter: 'blur(6px)',
            animation: 'wirePulse 1.2s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Cable principal (Cuerpo sólido central con brillo interno) */}
      <path
        d={edgePath}
        fill="none"
        stroke={wireColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          ...(style as React.CSSProperties),
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))',
        }}
      />

      {/* Núcleo interno del cable (Línea central clara para dar efecto brillante 3D cilíndrico) */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ffffff"
        strokeWidth={strokeWidth / 3}
        strokeLinecap="round"
        style={{
          opacity: 0.4,
          filter: 'blur(0.5px)',
          pointerEvents: 'none',
        }}
      />

      {/* Flujo eléctrico si es correcto */}
      {isCorrect && (
        <path
          d={edgePath}
          fill="none"
          stroke="#4ade80"
          strokeWidth={3}
          strokeDasharray="14,14"
          style={{
            animation: 'wireFlow 0.5s linear infinite',
            filter: 'drop-shadow(0px 0px 4px #22c55e)',
          }}
        />
      )}

      {/* Delete Wire Button positioned right on the cable curve */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeEdge(id);
            }}
            className="w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-md hover:scale-125 transition-transform cursor-pointer"
            title="Eliminar este cable"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
