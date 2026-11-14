import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
  SlideUp,
} from './AnimationWrappers';
import { useStageInstance } from './StageInstanceContext';
import { MediaAssetSlot, PERSONAL_MEDIA_SLOTS } from './personalMediaManifest';
import {
  PureSlideTitleHeader,
  EditorialMediaFrame,
  MediaLightboxModal,
  useMinimalistSlideAdvance,
} from './EditorialMediaComponents';

/* ============================================================================
   SLIDE 09 (1): O CHAMADO — APENAS O TÍTULO E A FOTO DE NYC DE DIA
   ============================================================================ */
export const Slide09TheCallContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-09-the-call" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="O CHAMADO"
          hideBrandMorph={true}
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <SlideUp
          delay={0.06}
          distance={22}
          className="absolute top-[122px] left-[68px] right-[68px] bottom-[52px] z-30"
        >
          <LiquidGlassContainer
            intensity="strong"
            tint="light"
            disablePulse={true}
            className="w-full h-full p-3.5"
          >
            <EditorialMediaFrame
              slot={PERSONAL_MEDIA_SLOTS.nycDaytime}
              onExpandMedia={(s) => setZoomSlot(s)}
              className="w-full h-full"
            />
          </LiquidGlassContainer>
        </SlideUp>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 10 (2): A VIAGEM — MAPA 3D ANIMADO (+60H · 2 ÔNIBUS · 11 VOOS · 7 PAÍSES)
   ============================================================================ */
interface RouteNode {
  id: string;
  code: string;
  city: string;
  x: number;
  y: number;
  labelOffset: { dx: number; dy: number };
}

interface RouteLeg {
  index: number;
  mode: 'bus' | 'flight';
  from: RouteNode;
  to: RouteNode;
  peakLift: number;
}

const ROUTE_NODES: Record<string, RouteNode> = {
  cuiaba: {
    id: 'cuiaba',
    code: 'CGB',
    city: 'Cuiabá',
    x: 245,
    y: 472,
    labelOffset: { dx: -16, dy: 28 },
  },
  brasilia: {
    id: 'brasilia',
    code: 'BSB',
    city: 'Brasília',
    x: 332,
    y: 454,
    labelOffset: { dx: 14, dy: 26 },
  },
  lisboa: {
    id: 'lisboa',
    code: 'LIS',
    city: 'Lisboa',
    x: 565,
    y: 238,
    labelOffset: { dx: -44, dy: -16 },
  },
  amsterdam: {
    id: 'amsterdam',
    code: 'AMS',
    city: 'Amsterdam',
    x: 626,
    y: 176,
    labelOffset: { dx: 0, dy: -22 },
  },
  mumbai: {
    id: 'mumbai',
    code: 'BOM',
    city: 'Mumbai',
    x: 985,
    y: 342,
    labelOffset: { dx: -18, dy: 28 },
  },
  kathmandu: {
    id: 'kathmandu',
    code: 'KTM',
    city: 'Kathmandu',
    x: 1068,
    y: 274,
    labelOffset: { dx: -12, dy: -20 },
  },
  biratnagar: {
    id: 'biratnagar',
    code: 'BIR',
    city: 'Biratnagar',
    x: 1126,
    y: 288,
    labelOffset: { dx: 24, dy: 24 },
  },
};

const JOURNEY_LEGS: RouteLeg[] = [
  { index: 0, mode: 'bus', from: ROUTE_NODES.cuiaba, to: ROUTE_NODES.brasilia, peakLift: 14 },
  { index: 1, mode: 'flight', from: ROUTE_NODES.brasilia, to: ROUTE_NODES.lisboa, peakLift: 118 },
  { index: 2, mode: 'flight', from: ROUTE_NODES.lisboa, to: ROUTE_NODES.amsterdam, peakLift: 46 },
  { index: 3, mode: 'flight', from: ROUTE_NODES.amsterdam, to: ROUTE_NODES.mumbai, peakLift: 122 },
  { index: 4, mode: 'flight', from: ROUTE_NODES.mumbai, to: ROUTE_NODES.kathmandu, peakLift: 54 },
  { index: 5, mode: 'flight', from: ROUTE_NODES.kathmandu, to: ROUTE_NODES.biratnagar, peakLift: 32 },
];

function evalQuadBezier(
  p0: { x: number; y: number },
  ctrl: { x: number; y: number },
  p1: { x: number; y: number },
  t: number
) {
  const u = 1 - t;
  const x = u * u * p0.x + 2 * u * t * ctrl.x + t * t * p1.x;
  const y = u * u * p0.y + 2 * u * t * ctrl.y + t * t * p1.y;
  const dx = 2 * u * (ctrl.x - p0.x) + 2 * t * (p1.x - ctrl.x);
  const dy = 2 * u * (ctrl.y - p0.y) + 2 * t * (p1.y - ctrl.y);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angleDeg };
}

function getLegControlPoint(leg: RouteLeg) {
  return {
    x: (leg.from.x + leg.to.x) / 2,
    y: (leg.from.y + leg.to.y) / 2 - leg.peakLift,
  };
}

function getGroundShadowControlPoint(leg: RouteLeg) {
  return {
    x: (leg.from.x + leg.to.x) / 2,
    y: (leg.from.y + leg.to.y) / 2 + (leg.mode === 'bus' ? -8 : 8),
  };
}

export const Slide10TheJourneyContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const { isPreview } = useStageInstance();

  const [progress, setProgress] = useState<number>(isPreview ? 6 : 0);
  const [playNonce, setPlayNonce] = useState(0);

  useEffect(() => {
    if (isPreview) {
      setProgress(6);
      return;
    }

    let rafId = 0;
    const totalDurationMs = 11200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const nextP = Math.min(6, (elapsed / totalDurationMs) * 6);
      setProgress(nextP);
      if (nextP < 6) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPreview, playNonce]);

  const activeLegIndex = Math.min(5, Math.floor(progress));
  const activeLegLocalT = progress >= 6 ? 1 : progress - activeLegIndex;
  const activeLeg = JOURNEY_LEGS[activeLegIndex];
  const activeCtrl = getLegControlPoint(activeLeg);
  const activeGroundCtrl = getGroundShadowControlPoint(activeLeg);
  const vehiclePos = evalQuadBezier(activeLeg.from, activeCtrl, activeLeg.to, activeLegLocalT);
  const shadowPos = evalQuadBezier(
    activeLeg.from,
    activeGroundCtrl,
    activeLeg.to,
    activeLegLocalT
  );

  const orderedNodes = [
    ROUTE_NODES.cuiaba,
    ROUTE_NODES.brasilia,
    ROUTE_NODES.lisboa,
    ROUTE_NODES.amsterdam,
    ROUTE_NODES.mumbai,
    ROUTE_NODES.kathmandu,
    ROUTE_NODES.biratnagar,
  ];

  const stats = [
    { value: '+60H', label: 'IDA', color: 'text-[#dc143c]' },
    { value: '02', label: 'ÔNIBUS', color: 'text-[#003893]' },
    { value: '11', label: 'VOOS', color: 'text-[#dc143c]' },
    { value: '07', label: 'PAÍSES', color: 'text-[#08254c]' },
  ];

  return (
    <SlideStage slideKey="slide-10-the-journey" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="A VIAGEM"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[48px] z-30 grid grid-cols-12 gap-6 items-stretch">
          {/* Coluna Esquerda: Apenas os 4 Números Puros */}
          <SlideUp
            delay={0.05}
            distance={20}
            className="col-span-2 h-full flex flex-col justify-between gap-4"
          >
            {stats.map((st) => (
              <LiquidGlassContainer
                key={st.label}
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="flex-1 flex flex-col items-center justify-center text-center px-4"
              >
                <div
                  className={`font-display text-[54px] font-black leading-none tabular-nums ${st.color}`}
                >
                  {st.value}
                </div>
                <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.2em] text-[#080d1a] mt-2">
                  {st.label}
                </div>
              </LiquidGlassContainer>
            ))}
          </SlideUp>

          {/* Coluna Direita: Mapa 3D em Tela Ampla */}
          <SlideUp delay={0.1} distance={20} className="col-span-10 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="h-full p-4 flex flex-col justify-between"
            >
              <div
                className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-b from-[#07152b] via-[#0b1f3f] to-[#08162e]"
                style={{ perspective: '1380px' }}
              >
                {/* Botão Discreto de Replay no Canto Superior Direito do Mapa */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProgress(0);
                    setPlayNonce((n) => n + 1);
                  }}
                  className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-white/12 hover:bg-[#dc143c] border border-white/25 text-white font-display text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 55% 28%, rgba(56, 189, 248, 0.16), transparent 62%)',
                  }}
                />

                <div
                  className="relative w-[1340px] h-[660px] rounded-[28px] border border-sky-300/25"
                  style={{
                    transform: 'rotateX(26deg) rotateZ(-1.5deg) translateY(-6px)',
                    transformStyle: 'preserve-3d',
                    background:
                      'linear-gradient(160deg, #0c2347 0%, #081a36 55%, #061329 100%)',
                    boxShadow:
                      '0 16px 0 #040d1d, 0 36px 65px rgba(0, 0, 0, 0.72), inset 0 1px 2px rgba(255,255,255,0.22)',
                  }}
                >
                  <svg
                    viewBox="0 0 1280 630"
                    className="w-full h-full overflow-visible"
                    aria-label="Mapa 3D Cuiabá a Biratnagar"
                  >
                    <defs>
                      <linearGradient id="flightArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="55%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#dc143c" />
                      </linearGradient>
                      <linearGradient id="landContinentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#173768" />
                        <stop offset="100%" stopColor="#10284e" />
                      </linearGradient>
                    </defs>

                    {[110, 210, 310, 410, 510].map((gy) => (
                      <line
                        key={`lat-${gy}`}
                        x1={40}
                        y1={gy}
                        x2={1240}
                        y2={gy}
                        stroke="rgba(148, 197, 255, 0.09)"
                        strokeDasharray="5 7"
                      />
                    ))}
                    {[180, 340, 500, 660, 820, 980, 1140].map((gx) => (
                      <line
                        key={`lon-${gx}`}
                        x1={gx}
                        y1={40}
                        x2={gx}
                        y2={590}
                        stroke="rgba(148, 197, 255, 0.09)"
                        strokeDasharray="5 7"
                      />
                    ))}

                    {/* América do Sul */}
                    <path
                      d="M175,345 L258,332 L352,388 L392,442 L350,528 L272,588 L226,575 L205,492 L166,418 Z"
                      fill="url(#landContinentGrad)"
                      stroke="rgba(125, 211, 252, 0.28)"
                      strokeWidth="2"
                    />
                    {/* América do Norte */}
                    <path
                      d="M65,125 L215,112 L255,198 L182,268 L112,258 L68,195 Z"
                      fill="url(#landContinentGrad)"
                      stroke="rgba(125, 211, 252, 0.18)"
                      strokeWidth="1.5"
                    />
                    {/* Europa */}
                    <path
                      d="M542,128 L665,105 L758,132 L768,218 L682,248 L595,256 L545,244 L538,195 Z"
                      fill="url(#landContinentGrad)"
                      stroke="rgba(125, 211, 252, 0.30)"
                      strokeWidth="2"
                    />
                    {/* África */}
                    <path
                      d="M548,274 L695,272 L778,348 L752,482 L668,556 L608,524 L585,418 L528,354 Z"
                      fill="url(#landContinentGrad)"
                      stroke="rgba(125, 211, 252, 0.2)"
                      strokeWidth="1.6"
                    />
                    {/* Ásia & Índia */}
                    <path
                      d="M768,142 L1065,122 L1218,176 L1205,342 L1132,368 L1052,324 L998,426 L945,356 L872,322 L788,268 Z"
                      fill="url(#landContinentGrad)"
                      stroke="rgba(125, 211, 252, 0.30)"
                      strokeWidth="2"
                    />
                    {/* Nepal */}
                    <polygon
                      points="1044,266 1142,276 1138,296 1040,286"
                      fill="rgba(220, 20, 60, 0.48)"
                      stroke="#fda4af"
                      strokeWidth="1.8"
                    />

                    {JOURNEY_LEGS.map((leg) => {
                      const ctrl = getLegControlPoint(leg);
                      const groundCtrl = getGroundShadowControlPoint(leg);
                      const arcPath = `M ${leg.from.x} ${leg.from.y} Q ${ctrl.x} ${ctrl.y} ${leg.to.x} ${leg.to.y}`;
                      const groundPath = `M ${leg.from.x} ${leg.from.y} Q ${groundCtrl.x} ${groundCtrl.y} ${leg.to.x} ${leg.to.y}`;
                      const legCompletion = Math.max(0, Math.min(1, progress - leg.index));
                      const isBus = leg.mode === 'bus';

                      return (
                        <g key={`leg-${leg.index}`}>
                          <path
                            d={groundPath}
                            fill="none"
                            stroke="rgba(2, 6, 23, 0.65)"
                            strokeWidth={isBus ? 3 : 4}
                            strokeDasharray={isBus ? '4 4' : 'none'}
                          />
                          <path
                            d={arcPath}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.16)"
                            strokeWidth={2}
                            strokeDasharray="6 6"
                          />
                          {legCompletion > 0 && (
                            <path
                              d={arcPath}
                              fill="none"
                              pathLength={1}
                              stroke={isBus ? '#f59e0b' : 'url(#flightArcGrad)'}
                              strokeWidth={isBus ? 5 : 4.5}
                              strokeLinecap="round"
                              strokeDasharray={`${legCompletion} 1`}
                            />
                          )}
                        </g>
                      );
                    })}

                    {progress < 6 && (
                      <ellipse
                        cx={shadowPos.x}
                        cy={shadowPos.y}
                        rx={10}
                        ry={5}
                        fill="rgba(0, 0, 0, 0.55)"
                      />
                    )}

                    {orderedNodes.map((node, idx) => {
                      const reached = progress >= idx - 0.05;
                      const isEndpoint = idx === 0 || idx === orderedNodes.length - 1;
                      return (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                          {reached && (
                            <circle
                              r={isEndpoint ? 15 : 11}
                              fill={
                                idx === orderedNodes.length - 1
                                  ? 'rgba(220,20,60,0.32)'
                                  : 'rgba(56,189,248,0.25)'
                              }
                            />
                          )}
                          <circle
                            r={isEndpoint ? 7.5 : 6}
                            fill={
                              !reached
                                ? '#334155'
                                : idx === 0
                                ? '#f59e0b'
                                : idx === orderedNodes.length - 1
                                ? '#dc143c'
                                : '#ffffff'
                            }
                            stroke="#08162e"
                            strokeWidth="2"
                          />
                          <g transform={`translate(${node.labelOffset.dx}, ${node.labelOffset.dy})`}>
                            <rect
                              x={-48}
                              y={-13}
                              width={96}
                              height={24}
                              rx={7}
                              fill={reached ? 'rgba(8, 19, 38, 0.90)' : 'rgba(15, 23, 42, 0.55)'}
                              stroke={reached ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.1)'}
                              strokeWidth="1"
                            />
                            <text
                              textAnchor="middle"
                              y={4}
                              fill={reached ? '#ffffff' : '#94a3b8'}
                              fontSize="12.5"
                              fontWeight="800"
                              fontFamily="Montserrat, sans-serif"
                            >
                              {node.city}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    <g transform={`translate(${vehiclePos.x}, ${vehiclePos.y})`}>
                      {activeLeg.mode === 'bus' ? (
                        <g>
                          <circle r="18" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                          <rect x="-9" y="-6" width="18" height="11" rx="2.5" fill="#08162e" />
                          <rect x="-7" y="-4" width="14" height="4.5" rx="1" fill="#fde68a" />
                          <circle cx="-5" cy="6.5" r="2.2" fill="#ffffff" />
                          <circle cx="5" cy="6.5" r="2.2" fill="#ffffff" />
                        </g>
                      ) : (
                        <g transform={`rotate(${vehiclePos.angleDeg})`}>
                          <circle r="19" fill="#dc143c" stroke="#ffffff" strokeWidth="2.5" />
                          <path
                            d="M10,0 L3,-2.2 L-2,-10 L-5,-10 L-2.2,-2.2 L-8,-2.2 L-10.5,-5.5 L-12.5,-5.5 L-10.8,0 L-12.5,5.5 L-10.5,5.5 L-8,2.2 L-2.2,2.2 L-5,10 L-2,10 L3,2.2 Z"
                            fill="#ffffff"
                          />
                        </g>
                      )}
                    </g>
                  </svg>
                </div>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="pt-3 px-1 grid grid-cols-6 gap-2.5"
              >
                {JOURNEY_LEGS.map((leg) => {
                  const isDone = progress >= leg.index + 0.98;
                  const isCurrent = Math.floor(progress) === leg.index && progress < 6;
                  return (
                    <button
                      key={`step-btn-${leg.index}`}
                      type="button"
                      onClick={() => setProgress(leg.index + 0.65)}
                      className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#003893] text-white border-[#003893] shadow-md'
                          : isDone
                          ? 'bg-white/80 text-[#080d1a] border-[#003893]/25'
                          : 'bg-white/40 text-[#2f3136]/65 border-white/60'
                      }`}
                    >
                      <div className="font-display text-[13px] font-bold truncate">
                        {leg.from.city} → {leg.to.city}
                      </div>
                    </button>
                  );
                })}
              </div>
            </LiquidGlassContainer>
          </SlideUp>
        </div>
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 11 (3): A CHEGADA & A GALERA — TÍTULO + FOTOS (DIA 22)
   ============================================================================ */
export const Slide11ArrivalTeamContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-11-arrival-team" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="A CHEGADA & A GALERA"
          rightBadge="DIA 22"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 gap-7 items-stretch">
          <SlideUp delay={0.06} distance={22} className="col-span-7 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="h-full p-4"
            >
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.missionariesGroup}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          <SlideUp delay={0.12} distance={22} className="col-span-5 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="navy"
              disablePulse={true}
              className="h-full p-4"
            >
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.paulAndSonia}
                darkPlaceholder={true}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 12 (4): TURISMO & INTEGRAÇÃO CULTURAL — APENAS TÍTULO + 6 MÍDIAS REAIS (+ SLOT ROOFTOP)
   (3 colunas verticais nativas 9:16 à esquerda + grade 2x2 horizontal à direita)
   ============================================================================ */
export const Slide12CultureKathmanduContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-12-culture-kathmandu" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="TURISMO & INTEGRAÇÃO CULTURAL"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 gap-5 items-stretch">
          {/* Esquerda (6 cols): 2 Vídeos Verticais (Thamel + Swayambhunath) + 1 Foto Vertical (Macaco) */}
          <div className="col-span-6 h-full grid grid-cols-3 gap-5">
            <SlideUp delay={0.04} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.thamelNightVideo}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.08} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.monkeyTempleVideo}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.12} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.monkeyClosePhoto}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>
          </div>

          {/* Direita (6 cols): Grade 2x2 Horizontal (Dal Bhat + Pashupatinath 1 + Pashupatinath 2 + Rooftop) */}
          <div className="col-span-6 h-full grid grid-cols-2 grid-rows-2 gap-5">
            <SlideUp delay={0.14} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.kathmanduDalBhatPhoto}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.17} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.pashupatinathPyrePhoto}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.2} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.pashupatinathRiverPhoto}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.23} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.hotelRooftopWorship}
                  darkPlaceholder={true}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>
          </div>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 13 (5): IDA PARA BARGACHHI — APENAS TÍTULO + 5 FOTOS E VÍDEOS REAIS
   ============================================================================ */
export const Slide13BargachhiContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-13-bargachhi" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="IDA PARA BARGACHHI"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 grid-rows-2 gap-5">
          {/* Linha Superior: Selfie no ATR-72 Buddha Air (6 cols) + Pátio do Centro/Alojamento em Bargachhi (6 cols) */}
          <SlideUp delay={0.05} distance={18} className="col-span-6 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.buddhaAirSelfie}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          <SlideUp delay={0.09} distance={18} className="col-span-6 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.bargachhiCourtyard}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          {/* Linha Inferior: 2 Vídeos Reais da Recepção com Colares de Flores + Foto dos 3 na Moto */}
          <SlideUp delay={0.13} distance={18} className="col-span-4 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-3">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.bargachhiReceptionVideo1}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          <SlideUp delay={0.17} distance={18} className="col-span-4 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-3">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.bargachhiReceptionVideo2}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          <SlideUp delay={0.21} distance={18} className="col-span-4 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="crimson" disablePulse={true} className="h-full p-3">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.bargachhiMotorbike}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 14 (6): ATIVIDADES DESENVOLVIDAS — APENAS TÍTULO + FOTOS REAIS
   ============================================================================ */
export const Slide14ActivitiesContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-14-activities" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="ATIVIDADES DESENVOLVIDAS"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 grid-rows-2 gap-6">
          {/* Esquerda (4 cols x 2 rows — formato vertical nativo para a foto do atendimento odontológico/médico) */}
          <SlideUp delay={0.05} distance={20} className="col-span-4 row-span-2 h-full">
            <LiquidGlassContainer intensity="medium" tint="crimson" disablePulse={true} className="h-full p-3.5">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.activityDentalHealth}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          {/* Direita Topo (8 cols — Escola Cristã de Férias com fantoches e bandeiras BR/CAN/EUA) */}
          <SlideUp delay={0.1} distance={20} className="col-span-8 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3.5">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.activityVbsPuppets}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          {/* Direita Base Esquerda (5 cols — Grupo sentado no tapete vermelho) */}
          <SlideUp delay={0.15} distance={20} className="col-span-5 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-3.5">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.activityCommunityGroup}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          {/* Direita Base Direita (3 cols — Quadro reservado para mais fotos de Saneamento / Obreiros) */}
          <SlideUp delay={0.2} distance={20} className="col-span-3 row-span-1 h-full">
            <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3.5">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.activityExtraSlot}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});
