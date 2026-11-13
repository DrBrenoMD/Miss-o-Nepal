import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnnotationTool,
  DrawingStroke,
  DrawingPoint,
  PointerState,
  SpotlightState,
} from './types';

function buildSmoothPolylinePath(points: DrawingPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)},${p.y.toFixed(1)} L ${(p.x + 0.5).toFixed(1)},${(p.y + 0.5).toFixed(1)}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(1)},${curr.y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

function renderStrokeElement(stroke: DrawingStroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return null;

  if (stroke.tool === 'pen' || stroke.tool === 'highlighter') {
    const d = buildSmoothPolylinePath(pts);
    const isHighlighter = stroke.tool === 'highlighter';
    return (
      <path
        key={stroke.id}
        d={d}
        fill="none"
        stroke={stroke.color}
        strokeWidth={isHighlighter ? stroke.width * 3.4 : stroke.width}
        strokeOpacity={isHighlighter ? 0.36 : 0.96}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  const start = pts[0];
  const end = pts[pts.length - 1];

  if (stroke.tool === 'arrow') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 4) return null;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.max(22, stroke.width * 3.6);
    const wingAngle = Math.PI / 6.2;

    const x1 = end.x - headLen * Math.cos(angle - wingAngle);
    const y1 = end.y - headLen * Math.sin(angle - wingAngle);
    const x2 = end.x - headLen * Math.cos(angle + wingAngle);
    const y2 = end.y - headLen * Math.sin(angle + wingAngle);

    return (
      <g key={stroke.id}>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke.color}
          strokeWidth={stroke.width * 1.2}
          strokeLinecap="round"
        />
        <path
          d={`M ${x1.toFixed(1)},${y1.toFixed(1)} L ${end.x.toFixed(1)},${end.y.toFixed(1)} L ${x2.toFixed(1)},${y2.toFixed(1)}`}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width * 1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  if (stroke.tool === 'rect') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.max(4, Math.abs(end.x - start.x));
    const h = Math.max(4, Math.abs(end.y - start.y));
    return (
      <rect
        key={stroke.id}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill={stroke.color}
        fillOpacity={0.07}
        stroke={stroke.color}
        strokeWidth={stroke.width * 1.15}
      />
    );
  }

  if (stroke.tool === 'circle') {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.max(4, Math.abs(end.x - start.x) / 2);
    const ry = Math.max(4, Math.abs(end.y - start.y) / 2);
    return (
      <ellipse
        key={stroke.id}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={stroke.color}
        fillOpacity={0.07}
        stroke={stroke.color}
        strokeWidth={stroke.width * 1.15}
      />
    );
  }

  return null;
}

export interface LiveAnnotationOverlayProps {
  strokes: DrawingStroke[];
  pointer: PointerState | null;
  spotlight: SpotlightState | null;
  blackout: boolean;
  variant: 'receiver' | 'presenter';
  interactiveTool?: AnnotationTool;
  activeColor?: string;
  activeWidth?: number;
  onPointerSignal?: (active: boolean, x: number, y: number, color: string) => void;
  onSpotlightSignal?: (spotlight: SpotlightState | null) => void;
  onUpsertStroke?: (stroke: DrawingStroke) => void;
}

export const LiveAnnotationOverlay: React.FC<LiveAnnotationOverlayProps> = ({
  strokes,
  pointer,
  spotlight,
  blackout,
  variant,
  interactiveTool = 'none',
  activeColor = '#dc143c',
  activeWidth = 7,
  onPointerSignal,
  onSpotlightSignal,
  onUpsertStroke,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  const isInteractive = variant === 'presenter' && interactiveTool !== 'none';

  const toStageCoords = (clientX: number, clientY: number): DrawingPoint => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: 960, y: 540 };
    }
    const x = Math.max(0, Math.min(1920, ((clientX - rect.left) / rect.width) * 1920));
    const y = Math.max(0, Math.min(1080, ((clientY - rect.top) / rect.height) * 1080));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    isPointerDownRef.current = true;

    const pt = toStageCoords(e.clientX, e.clientY);

    if (interactiveTool === 'laser') {
      onPointerSignal?.(true, pt.x, pt.y, activeColor);
      return;
    }

    if (interactiveTool === 'spotlight') {
      onSpotlightSignal?.({ active: true, x: pt.x, y: pt.y });
      return;
    }

    // Inicia novo traço vetorial
    const newStroke: DrawingStroke = {
      id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      tool: interactiveTool,
      color: activeColor,
      width: activeWidth,
      points: [pt],
    };
    activeStrokeRef.current = newStroke;
    onUpsertStroke?.(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    const pt = toStageCoords(e.clientX, e.clientY);

    // Em computador (mouse), o Laser Pointer acompanha mesmo sem pressionar o botão; no toque (touch), acompanha ao tocar/arrastar
    if (interactiveTool === 'laser') {
      if (e.pointerType === 'mouse' || isPointerDownRef.current) {
        onPointerSignal?.(true, pt.x, pt.y, activeColor);
      }
      return;
    }

    if (interactiveTool === 'spotlight') {
      if (isPointerDownRef.current) {
        onSpotlightSignal?.({ active: true, x: pt.x, y: pt.y });
      }
      return;
    }

    if (!isPointerDownRef.current || !activeStrokeRef.current) return;
    e.preventDefault();

    const current = activeStrokeRef.current;
    let nextPoints: DrawingPoint[];

    if (current.tool === 'pen' || current.tool === 'highlighter') {
      const lastPt = current.points[current.points.length - 1];
      if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 3.5) {
        return;
      }
      nextPoints = [...current.points, pt];
    } else {
      // Formas geométricas (seta, círculo, retângulo) usam apenas [início, fim]
      nextPoints = [current.points[0], pt];
    }

    const updated: DrawingStroke = {
      ...current,
      points: nextPoints,
    };
    activeStrokeRef.current = updated;
    onUpsertStroke?.(updated);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    isPointerDownRef.current = false;

    if (interactiveTool === 'laser') {
      if (e.pointerType !== 'mouse') {
        onPointerSignal?.(false, 0, 0, activeColor);
      }
      return;
    }

    if (activeStrokeRef.current) {
      onUpsertStroke?.(activeStrokeRef.current);
      activeStrokeRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (!isInteractive) return;
    isPointerDownRef.current = false;
    if (interactiveTool === 'laser') {
      onPointerSignal?.(false, 0, 0, activeColor);
    }
    activeStrokeRef.current = null;
  };

  const spotlightMaskId = `spotlight-mask-${variant}`;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: isInteractive ? 'none' : 'auto' }}
      className={`absolute inset-0 z-40 select-none ${
        isInteractive
          ? interactiveTool === 'laser'
            ? 'pointer-events-auto cursor-crosshair'
            : 'pointer-events-auto cursor-crosshair'
          : 'pointer-events-none'
      }`}
    >
      <svg
        viewBox="0 0 1920 1080"
        className="w-full h-full overflow-hidden"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {spotlight?.active && (
            <mask id={spotlightMaskId}>
              <rect x="0" y="0" width="1920" height="1080" fill="white" />
              <circle cx={spotlight.x} cy={spotlight.y} r="235" fill="black" />
            </mask>
          )}
          <filter id={`laser-glow-${variant}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Máscara de Lupa / Foco (Spotlight) */}
        {spotlight?.active && (
          <g>
            <rect
              x="0"
              y="0"
              width="1920"
              height="1080"
              fill="#060c18"
              fillOpacity={variant === 'receiver' ? 0.72 : 0.52}
              mask={`url(#${spotlightMaskId})`}
            />
            <circle
              cx={spotlight.x}
              cy={spotlight.y}
              r="235"
              stroke="#ffffff"
              strokeOpacity="0.65"
              strokeWidth="3"
              strokeDasharray="10 8"
            />
          </g>
        )}

        {/* 2. Camada de Desenhos Vetoriais do Slide */}
        <g>{strokes.map((stroke) => renderStrokeElement(stroke))}</g>

        {/* 3. Laser Pointer em Tempo Real */}
        {pointer?.active && (
          <g filter={`url(#laser-glow-${variant})`}>
            <circle
              cx={pointer.x}
              cy={pointer.y}
              r="26"
              fill={pointer.color || '#dc143c'}
              fillOpacity="0.28"
            />
            <circle
              cx={pointer.x}
              cy={pointer.y}
              r="13"
              fill={pointer.color || '#dc143c'}
              stroke="#ffffff"
              strokeWidth="3.5"
            />
            <circle cx={pointer.x} cy={pointer.y} r="4.5" fill="#ffffff" />
          </g>
        )}
      </svg>

      {/* 4. Cortina de Pausa (Blackout) nas Telas Receptoras */}
      <AnimatePresence>
        {blackout && variant === 'receiver' && (
          <motion.div
            key="receiver-blackout-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="pointer-events-auto absolute inset-0 z-50 bg-[#080c14] flex flex-col items-center justify-center text-white"
          >
            <div className="font-display text-[22px] font-black uppercase tracking-[0.38em] text-white/30">
              MISSÃO NEPAL
            </div>
            <div className="mt-2 h-[1px] w-24 bg-[#dc143c]/45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso no Console do Apresentador quando a Cortina está ativa nos telões */}
      {blackout && variant === 'presenter' && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1 rounded-md bg-[#dc143c] text-white font-sans text-xs font-bold uppercase tracking-wider shadow-lg">
          Telões em Modo Cortina (Tela Escura Ativa)
        </div>
      )}
    </div>
  );
};
