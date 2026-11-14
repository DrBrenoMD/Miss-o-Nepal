import React, { useState, useEffect, useRef, memo } from 'react';
import { Slide, useSteps, SlideContext } from 'spectacle';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { GEO_PATHS } from './geoData';
import { OfficialNepalFlag } from './OfficialNepalFlag';
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

export type GeoStage = 0 | 1 | 2 | 3;

interface StageInfo {
  stepBadge: string;
  title: string;
  subtitle: string;
  primaryMetric: string;
  primaryLabel: string;
  card1Title: string;
  card1Body: string;
  card2Title: string;
  card2Body: string;
  coords: string;
}

const STAGE_CONTENT: Record<GeoStage, StageInfo> = {
  0: {
    stepBadge: 'ETAPA 01 · POSIÇÃO NO MAPA-MÚNDI',
    title: 'ESPREMIDO ENTRE GIGANTES',
    subtitle: 'Localização Geopolítica Real entre a Índia e a China',
    primaryMetric: '147.516 km²',
    primaryLabel: 'Território Oficial do Nepal no Himalaia',
    card1Title: 'Entre a China e a Índia',
    card1Body:
      'Sem saída para o mar, o Nepal está espremido entre as duas nações mais populosas da Terra: a China (Região Autônoma do Tibete) ao norte e a Índia ao sul, leste e oeste.',
    card2Title: 'Faixa Estreita na Ásia Meridional',
    card2Body:
      'Com formato trapezoidal alongado, estende-se por ~800 km de leste a oeste, mas possui apenas entre 150 km e 250 km de largura norte-sul.',
    coords: '28° 23′ N · 84° 07′ E — ÁSIA MERIDIONAL',
  },
  1: {
    stepBadge: 'ETAPA 02 · ESCALA COMPARATIVA REAL',
    title: '6 NEPAIS NO MATO GROSSO',
    subtitle: 'Navegando pelo Globo até o Mapa Oficial do Brasil (IBGE)',
    primaryMetric: '6,12×',
    primaryLabel: 'Mato Grosso (903.357 km²) ÷ Nepal (147.516 km²)',
    card1Title: 'Cabem 6 Nepais no Mato Grosso',
    card1Body:
      'Viajando pelo globo até o Brasil: dentro das fronteiras reais do estado do Mato Grosso (903.357 km²) cabem 6 Nepais inteiros (6 × 147.516 km² = 885.096 km²).',
    card2Title: 'Contraste Demográfico Impressionante',
    card2Body:
      'Embora seja 6 vezes menor em área que o Mato Grosso, o Nepal abriga mais de 30,8 milhões de habitantes — quase 8 vezes a população mato-grossense.',
    coords: '12° 38′ S · 55° 25′ O — MATO GROSSO, BRASIL',
  },
  2: {
    stepBadge: 'ETAPA 03 · IDENTIDADE SINGULAR',
    title: 'A BANDEIRA FINCADA NO MAPA',
    subtitle: 'Retorno ao Contorno Real do Nepal e Símbolo Constitucional',
    primaryMetric: 'ÚNICA',
    primaryLabel: 'Bandeira Nacional Não-Quadrilátera do Planeta',
    card1Title: 'Geometria Constitucional Exata',
    card1Body:
      'Retornando ao mapa do Nepal: sua bandeira (definida matematicamente no Anexo 1 da Constituição) é a única do mundo formada por dois galhardetes triangulares.',
    card2Title: 'Carmesim, Azul-Marinho, Sol e Lua',
    card2Body:
      'O vermelho carmesim representa a coragem nepalesa; a borda azul-marinho simboliza a paz; o Sol de 12 pontas e a Lua Crescente representam a eternidade da nação.',
    coords: '27° 42′ N · 85° 19′ E — KATMANDU, NEPAL',
  },
  3: {
    stepBadge: 'ETAPA 04 · RELEVO TRIDIMENSIONAL',
    title: 'AS MONTANHAS NO RELEVO 3D',
    subtitle: 'Mudança de Perspectiva da Câmera sobre a Cordilheira do Himalaia',
    primaryMetric: '8.848 m',
    primaryLabel: 'Monte Everest (Sagarmatha) — Topo do Mundo',
    card1Title: 'Desnível Topográfico Extremo',
    card1Body:
      'Inclinando a câmera sobre o mapa real do Nepal: em menos de 200 km, o relevo sobe das planícies de Terai (70 m) até os 8.848 m do Monte Everest na fronteira norte.',
    card2Title: 'A Fortaleza do Himalaia',
    card2Body:
      'O Nepal abriga 8 das 10 montanhas mais altas do planeta (acima de 8.000 m), incluindo Dhaulagiri, Annapurna, Manaslu, Everest, Lhotse, Makalu e Kanchenjunga.',
    coords: '27° 59′ N · 86° 55′ E — CORDILHEIRA DO HIMALAIA',
  },
};

/**
 * Parâmetros da Câmera Vetorial Pura (aplicada diretamente no `<g>` do SVG via DOM ref):
 * - Zero re-renderização do React durante a transição (60 FPS contínuos sem travar)
 * - Zero rasterização de textura CSS 3D (100% nitidez vetorial nativa em qualquer zoom!)
 */
interface VectorCameraPose {
  focusX: number;
  focusY: number;
  screenX: number;
  screenY: number;
  zoom: number;
  tiltY: number;   // Compressão vertical de perspectiva 3D (1 = topo, 0.58 = câmera inclinada)
  skewX: number;   // Inclinação isométrica 3D
  rotate: number;  // Rotação azimutal da câmera
}

const VECTOR_CAMERA_POSES: Record<GeoStage, VectorCameraPose> = {
  // Etapa 0: Posição Global — Índia, China e Nepal espremido no centro
  0: {
    focusX: 1348,
    focusY: 430,
    screenX: 1230,
    screenY: 545,
    zoom: 3.15,
    tiltY: 0.92,
    skewX: -4,
    rotate: -2,
  },
  // Etapa 1: Voo pelo globo até o Brasil / Mato Grosso (697.8, 672.0)
  1: {
    focusX: GEO_PATHS.mtCenter.x,
    focusY: GEO_PATHS.mtCenter.y,
    screenX: 1230,
    screenY: 548,
    zoom: 5.5,
    tiltY: 0.92,
    skewX: 4,
    rotate: 2,
  },
  // Etapa 2: Retorno ao contorno exato do Nepal (1352.2, 420.1) + Bandeira fincada tremulando
  2: {
    focusX: GEO_PATHS.nepalCenter.x,
    focusY: GEO_PATHS.nepalCenter.y,
    screenX: 1240,
    screenY: 575,
    zoom: 10.5,
    tiltY: 0.86,
    skewX: -8,
    rotate: -5,
  },
  // Etapa 3: Mudança de perspectiva 3D da câmera revelando as montanhas do Himalaia no relevo
  3: {
    focusX: GEO_PATHS.nepalCenter.x,
    focusY: GEO_PATHS.nepalCenter.y,
    screenX: 1255,
    screenY: 610,
    zoom: 12.2,
    tiltY: 0.62,
    skewX: -18,
    rotate: -11,
  },
};

function buildSvgCameraTransform(p: VectorCameraPose): string {
  return `translate(${p.screenX.toFixed(2)}, ${p.screenY.toFixed(2)}) scale(1, ${p.tiltY.toFixed(3)}) skewX(${p.skewX.toFixed(2)}) rotate(${p.rotate.toFixed(2)}) scale(${p.zoom.toFixed(3)}) translate(${(-p.focusX).toFixed(2)}, ${(-p.focusY).toFixed(2)})`;
}

/**
 * Projeção de tamanho real (escala equivalente de área 1:1 corrigida para a latitude do MT)
 * de 1 único Nepal posicionado no centro do Mato Grosso (147.516 km² dentro de 903.357 km²)
 */
const REAL_SIZE_NEPAL_IN_MT = {
  x: GEO_PATHS.mtCenter.x + 1.2,
  y: GEO_PATHS.mtCenter.y + 1.5,
  scaleX: 0.91, // Correção exata de projeção cos(28.4°N)/cos(12.6°S) para área real 1:1
  scaleY: 1.0,
};

/**
 * Camada Cartográfica Base Memoizada:
 * Renderizada em coordenadas vetoriais puras sem rasterização intermediária de CSS 3D.
 */
const StaticWorldCartography = memo(() => {
  return (
    <>
      <defs>
        <clipPath id="mt-real-clip">
          <path d={GEO_PATHS.matoGrosso} />
        </clipPath>
      </defs>

      {/* Grade de Meridianos e Paralelos Curvos do Globo */}
      <g stroke="#003893" strokeOpacity="0.16" strokeWidth="0.45" strokeDasharray="3 4">
        {[240, 420, 600, 780, 960, 1140, 1320, 1500, 1680].map((lx) => (
          <line key={`lon-${lx}`} x1={lx} y1={80} x2={lx} y2={980} />
        ))}
        {[180, 300, 420, 540, 660, 780, 900].map((ly) => (
          <line key={`lat-${ly}`} x1={120} y1={ly} x2={1800} y2={ly} />
        ))}
      </g>

      {/* Continentes do Mapa-Múndi */}
      <path
        d={GEO_PATHS.worldContinents}
        fill="#08254c"
        fillOpacity="0.035"
        stroke="#08254c"
        strokeOpacity="0.28"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />

      {/* CHINA e ÍNDIA (Fronteiras Reais Natural Earth) */}
      <path
        d={GEO_PATHS.china}
        fill="#003893"
        fillOpacity="0.06"
        stroke="#08254c"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.india}
        fill="#08254c"
        fillOpacity="0.05"
        stroke="#08254c"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.bhutan}
        fill="#08254c"
        fillOpacity="0.04"
        stroke="#08254c"
        strokeWidth="0.45"
      />
      <path
        d={GEO_PATHS.bangladesh}
        fill="#08254c"
        fillOpacity="0.04"
        stroke="#08254c"
        strokeWidth="0.45"
      />

      {/* Rótulos Geográficos da Ásia */}
      <text
        x="1385"
        y="372"
        textAnchor="middle"
        className="font-display text-[8.5px] font-black tracking-[0.28em] fill-[#08254c]"
      >
        CHINA (TIBETE)
      </text>
      <text
        x="1338"
        y="470"
        textAnchor="middle"
        className="font-display text-[8.5px] font-black tracking-[0.28em] fill-[#08254c]"
      >
        ÍNDIA
      </text>

      {/* BRASIL e Estados Brasileiros (IBGE) */}
      <path
        d={GEO_PATHS.brazilStates}
        fill="#08254c"
        fillOpacity="0.02"
        stroke="#08254c"
        strokeOpacity="0.28"
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.brazil}
        fill="#003893"
        fillOpacity="0.035"
        stroke="#08254c"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Estado do MATO GROSSO (IBGE) */}
      <path
        d={GEO_PATHS.matoGrosso}
        transform="translate(-0.9, 1.5)"
        fill="#08254c"
        fillOpacity="0.18"
      />
      <path
        d={GEO_PATHS.matoGrosso}
        fill="#003893"
        fillOpacity="0.13"
        stroke="#003893"
        strokeWidth="0.65"
        strokeLinejoin="round"
      />

      <text
        x="746"
        y="632"
        className="font-display text-[7px] font-black tracking-[0.26em] fill-[#08254c]"
      >
        BRASIL
      </text>
      <text
        x={GEO_PATHS.mtCenter.x}
        y={GEO_PATHS.mtBbox.minY - 4.5}
        textAnchor="middle"
        className="font-display text-[4.8px] font-black tracking-[0.18em] fill-[#003893]"
      >
        MATO GROSSO · 903.357 KM²
      </text>

      {/* Sombra de Extrusão 3D + Contorno Real do NEPAL */}
      <path
        d={GEO_PATHS.nepal}
        transform="translate(-0.8, 1.6)"
        fill="#08254c"
        fillOpacity="0.26"
      />
      <path
        d={GEO_PATHS.nepal}
        fill="#dc143c"
        fillOpacity="0.30"
        stroke="#08254c"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.nepal}
        fill="none"
        stroke="#dc143c"
        strokeWidth="0.22"
      />
    </>
  );
});

export const Slide02GeographyContent: React.FC = () => {
  const { step, placeholder } = useSteps(3);
  const [manualStage, setManualStage] = useState<GeoStage | null>(null);
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();
  const slideContext = React.useContext(SlideContext) as any;

  useEffect(() => {
    setManualStage(null);
  }, [step]);

  const safeStepNumber =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(3, Math.round(step + 1)))
      : 0;
  const clampedSpectacleStage = safeStepNumber as GeoStage;

  const isSlideActive = slideContext ? Boolean(slideContext.isSlideActive) : true;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? (Math.max(0, Math.min(3, stageInstance.forcedSubStep)) as GeoStage)
      : broadcast && broadcast.mode !== 'standalone' && isSlideActive
      ? (Math.max(0, Math.min(3, broadcast.roomState.subStep)) as GeoStage)
      : null;

  const activeStage: GeoStage =
    syncedSubStep !== null
      ? syncedSubStep
      : manualStage !== null && VECTOR_CAMERA_POSES[manualStage]
      ? manualStage
      : clampedSpectacleStage;

  const currentInfo = STAGE_CONTENT[activeStage] ?? STAGE_CONTENT[0];
  const targetPose = VECTOR_CAMERA_POSES[activeStage] ?? VECTOR_CAMERA_POSES[0];

  // Referência direta ao <g> do SVG para animar em 60 FPS via DOM sem re-renderizar o React
  // e mantendo 100% de nitidez vetorial nativa em todos os níveis de zoom!
  const svgCameraGroupRef = useRef<SVGGElement | null>(null);
  const currentPoseRef = useRef<VectorCameraPose>({ ...targetPose });

  useEffect(() => {
    const startPose = { ...currentPoseRef.current };
    const endPose = { ...targetPose };

    const controls = animate(0, 1, {
      duration: 1.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        // Adicionamos um leve arco de "altitude de voo" (zoom-out intermediário suave) quando viaja entre Ásia e Brasil
        const isIntercontinentalFlight =
          Math.hypot(endPose.focusX - startPose.focusX, endPose.focusY - startPose.focusY) > 200;
        const arcDip = isIntercontinentalFlight ? Math.sin(t * Math.PI) * 1.45 : 0;

        const interpolated: VectorCameraPose = {
          focusX: startPose.focusX + (endPose.focusX - startPose.focusX) * t,
          focusY: startPose.focusY + (endPose.focusY - startPose.focusY) * t,
          screenX: startPose.screenX + (endPose.screenX - startPose.screenX) * t,
          screenY: startPose.screenY + (endPose.screenY - startPose.screenY) * t,
          zoom: Math.max(1.8, startPose.zoom + (endPose.zoom - startPose.zoom) * t - arcDip),
          tiltY: startPose.tiltY + (endPose.tiltY - startPose.tiltY) * t,
          skewX: startPose.skewX + (endPose.skewX - startPose.skewX) * t,
          rotate: startPose.rotate + (endPose.rotate - startPose.rotate) * t,
        };

        currentPoseRef.current = interpolated;
        if (svgCameraGroupRef.current) {
          svgCameraGroupRef.current.setAttribute(
            'transform',
            buildSvgCameraTransform(interpolated)
          );
        }
      },
    });

    return () => controls.stop();
  }, [targetPose]);

  const handleNextStageOrClick = () => {
    if (activeStage < 3) {
      setManualStage(((activeStage + 1) as GeoStage));
    } else {
      setManualStage(0);
    }
  };

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-02-geography" className="bg-[#f4f2eb]">
        <div
          onClick={handleNextStageOrClick}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA DE ELEMENTOS FLUIDOS AO FUNDO DAS CAIXAS DE TEXTO
                 Visíveis através do vidro fosco (backdrop-blur) das caixas Liquid Glass
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <motion.div
              animate={{
                x: [0, 45, -20, 0],
                y: [0, -35, 25, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              className="absolute left-[45px] top-[270px] w-[320px] h-[320px] rounded-full bg-[#003893]/20 blur-2xl"
            />
            <motion.div
              animate={{
                x: [0, -35, 30, 0],
                y: [0, 40, -25, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1 }}
              className="absolute left-[310px] bottom-[150px] w-[290px] h-[290px] rounded-full bg-[#dc143c]/18 blur-2xl"
            />
            <svg viewBox="0 0 1920 1080" className="w-full h-full opacity-25" fill="none">
              <path
                d="M -40 360 C 220 310, 480 450, 780 390 C 1080 330, 1420 460, 1960 370"
                stroke="#003893"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
              <path
                d="M -40 620 C 260 560, 520 710, 820 640 C 1120 570, 1480 690, 1960 590"
                stroke="#dc143c"
                strokeWidth="1.8"
                strokeDasharray="6 10"
              />
              <path
                d="M -40 810 C 240 760, 540 880, 860 810 C 1180 740, 1520 850, 1960 770"
                stroke="#08254c"
                strokeWidth="1.5"
              />
              <circle cx="340" cy="560" r="240" stroke="#003893" strokeWidth="1.5" strokeDasharray="4 8" />
              <circle cx="340" cy="560" r="340" stroke="#08254c" strokeWidth="1.2" />
            </svg>
          </div>

          {/* ===================================================================
              2. PALCO VETORIAL PURO 1920x1080 (NITIDEZ 100% EM QUALQUER ZOOM + 60 FPS)
                 Sem CSS 3D rasterization blur — toda a projeção e inclinação 3D ocorre
                 diretamente na matriz vetorial do <g ref={svgCameraGroupRef}>!
             =================================================================== */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute inset-0 z-10 w-[1920px] h-[1080px]"
          >
            <svg
              viewBox="0 0 1920 1080"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="geometricPrecision"
              textRendering="geometricPrecision"
            >
              <g
                ref={svgCameraGroupRef}
                transform={buildSvgCameraTransform(targetPose)}
              >
                {/* Camada Base Memoizada */}
                <StaticWorldCartography />

                {/* ---------------------------------------------------------
                    ARCO DE NAVEGAÇÃO TRANSCONTINENTAL PELO GLOBO (ÁSIA ⇄ BRASIL)
                   --------------------------------------------------------- */}
                <motion.path
                  d={`M ${GEO_PATHS.nepalCenter.x} ${GEO_PATHS.nepalCenter.y} C 1080 280, 840 420, ${GEO_PATHS.mtCenter.x} ${GEO_PATHS.mtCenter.y}`}
                  stroke="#003893"
                  strokeWidth="1.1"
                  strokeDasharray="4 4"
                  fill="none"
                  initial={false}
                  animate={{
                    pathLength: activeStage >= 1 ? 1 : 0,
                    opacity: activeStage === 1 || activeStage === 2 ? 0.85 : 0,
                  }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
                <motion.path
                  d={`M ${GEO_PATHS.mtCenter.x} ${GEO_PATHS.mtCenter.y} C 940 760, 1180 620, ${GEO_PATHS.nepalCenter.x} ${GEO_PATHS.nepalCenter.y}`}
                  stroke="#dc143c"
                  strokeWidth="0.95"
                  strokeDasharray="3.5 4"
                  fill="none"
                  initial={false}
                  animate={{
                    pathLength: activeStage >= 2 ? 1 : 0,
                    opacity: activeStage === 2 ? 0.85 : 0,
                  }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />

                {/* ---------------------------------------------------------
                    ETAPA 0: DESTAQUE GEOPOLÍTICO (ESPREMIDO ENTRE CHINA E ÍNDIA)
                   --------------------------------------------------------- */}
                <motion.g
                  initial={false}
                  animate={{ opacity: activeStage === 0 ? 1 : 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <motion.g
                    animate={{ y: [0, 3.2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                  >
                    <path
                      d="M 1360 390 L 1356 406 M 1352 401 L 1356 406 L 1362 402"
                      stroke="#dc143c"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                  <motion.g
                    animate={{ y: [0, -3.2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                  >
                    <path
                      d="M 1346 446 L 1350 431 M 1345 435 L 1350 431 L 1354 436"
                      stroke="#dc143c"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                  <motion.circle
                    cx={GEO_PATHS.nepalCenter.x}
                    cy={GEO_PATHS.nepalCenter.y}
                    r="27"
                    stroke="#dc143c"
                    strokeWidth="0.85"
                    strokeDasharray="3 3"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <text
                    x={GEO_PATHS.nepalCenter.x + 30}
                    y={GEO_PATHS.nepalCenter.y - 3}
                    className="font-display text-[7.2px] font-black tracking-[0.22em] fill-[#dc143c]"
                  >
                    NEPAL
                  </text>
                </motion.g>

                {/* ---------------------------------------------------------
                    ETAPA 1: 1 ÚNICO NEPAL EM PROJEÇÃO DE TAMANHO REAL DENTRO DO MATO GROSSO
                   --------------------------------------------------------- */}
                <motion.g
                  initial={false}
                  animate={{ opacity: activeStage === 1 ? 1 : 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <g clipPath="url(#mt-real-clip)">
                    <g
                      transform={`translate(${REAL_SIZE_NEPAL_IN_MT.x}, ${REAL_SIZE_NEPAL_IN_MT.y}) scale(${REAL_SIZE_NEPAL_IN_MT.scaleX}, ${REAL_SIZE_NEPAL_IN_MT.scaleY})`}
                    >
                      {/* Sombra de destaque sob a projeção real do Nepal */}
                      <path
                        d={GEO_PATHS.nepalCentered}
                        transform="translate(-0.7, 1.3)"
                        fill="#08254c"
                        fillOpacity="0.22"
                      />
                      {/* Contorno real 1:1 do Nepal desenhado progressivamente dentro do MT */}
                      <motion.path
                        d={GEO_PATHS.nepalCentered}
                        fill="#dc143c"
                        fillOpacity="0.32"
                        stroke="#dc143c"
                        strokeWidth="0.75"
                        strokeLinejoin="round"
                        initial={false}
                        animate={{
                          pathLength: activeStage === 1 ? 1 : 0,
                          opacity: activeStage === 1 ? 1 : 0,
                        }}
                        transition={{
                          duration: 1.05,
                          delay: activeStage === 1 ? 0.55 : 0,
                          ease: 'easeInOut',
                        }}
                      />
                      <text
                        x="0.5"
                        y="1.2"
                        textAnchor="middle"
                        className="font-display text-[3.4px] font-black tracking-[0.14em] fill-[#08254c]"
                      >
                        NEPAL (1:1)
                      </text>
                      <text
                        x="0.5"
                        y="4.6"
                        textAnchor="middle"
                        className="font-display text-[2.3px] font-extrabold tracking-[0.1em] fill-[#dc143c]"
                      >
                        147.516 KM²
                      </text>
                    </g>
                  </g>

                  {/* Cápsula de proporção bem dimensionada sob o Mato Grosso */}
                  <rect
                    x={GEO_PATHS.mtCenter.x - 37}
                    y={GEO_PATHS.mtBbox.maxY + 3.8}
                    width="74"
                    height="9.6"
                    rx="4.8"
                    fill="#dc143c"
                  />
                  <text
                    x={GEO_PATHS.mtCenter.x}
                    y={GEO_PATHS.mtBbox.maxY + 9.9}
                    textAnchor="middle"
                    className="font-display text-[3.2px] font-black tracking-[0.14em] fill-white"
                  >
                    CABEM 6 NEPAIS INTEIROS
                  </text>
                </motion.g>

                {/* ---------------------------------------------------------
                    ETAPA 2: BANDEIRA OFICIAL DO NEPAL FINCADA E TREMULANDO NO MAPA
                   --------------------------------------------------------- */}
                <motion.g
                  initial={false}
                  animate={{
                    opacity: activeStage === 2 ? 1 : 0,
                    scale: activeStage === 2 ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.55, delay: activeStage === 2 ? 0.45 : 0 }}
                  style={{ transformOrigin: '1355.2px 421.8px' }}
                >
                  <motion.ellipse
                    cx="1355.2"
                    cy="421.8"
                    rx="3.6"
                    ry="1.5"
                    fill="#08254c"
                    fillOpacity="0.35"
                    animate={{ scale: [1, 1.24, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <circle cx="1355.2" cy="421.8" r="0.85" fill="#dc143c" />

                  <line
                    x1="1355.2"
                    y1="421.8"
                    x2="1355.2"
                    y2="394.5"
                    stroke="#08254c"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                  />

                  <motion.g
                    style={{ transformOrigin: '1355.2px 395px' }}
                    animate={{
                      skewY: [-3, 3.2, -2, 3, -3],
                      scaleX: [1, 0.95, 1.04, 0.97, 1],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <g transform="translate(1359.0, 395.5) scale(0.24)">
                      <path
                        d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
                        fill="none"
                        stroke="#003893"
                        strokeWidth="5.165"
                        strokeMiterlimit="10"
                      />
                      <path
                        d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
                        fill="#DC143C"
                      />
                      <g fill="#ffffff">
                        <path d="M -11.9502769431,23.4834957055 A 12.8400974233,12.8400974233 0 0,0 11.9502769431,23.4834957055 A 11.9502769431 11.9502769431 0 0,1 -11.9502769431,23.4834957055" />
                        <circle cx="0" cy="29.045" r="5.56" />
                        <circle cx="0" cy="58.787" r="8.14" />
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((ang) => (
                          <path
                            key={ang}
                            d="M 2.1,7.86 L 0,12.84 L -2.1,7.86"
                            transform={`translate(0 58.787) rotate(${ang})`}
                          />
                        ))}
                      </g>
                    </g>
                  </motion.g>

                  <text
                    x="1355.2"
                    y="425.6"
                    textAnchor="middle"
                    className="font-display text-[2.3px] font-black tracking-[0.18em] fill-[#08254c]"
                  >
                    KATMANDU
                  </text>
                </motion.g>

                {/* ---------------------------------------------------------
                    ETAPA 3: MUDANÇA DE PERSPECTIVA 3D — CORDILHEIRA DO HIMALAIA REALISTA
                   --------------------------------------------------------- */}
                <motion.g
                  initial={false}
                  animate={{ opacity: activeStage === 3 ? 1 : 0 }}
                  transition={{ duration: 0.55 }}
                >
                  {/* Fatias Topográficas 3D Elevadas do Contorno Real do Nepal */}
                  <motion.path
                    d={GEO_PATHS.nepal}
                    stroke="#003893"
                    strokeWidth="0.28"
                    strokeDasharray="0.8 0.8"
                    fill="#003893"
                    fillOpacity="0.08"
                    initial={false}
                    animate={{ y: activeStage === 3 ? -2.0 : 0 }}
                    transition={{ duration: 0.9 }}
                  />
                  <motion.path
                    d={GEO_PATHS.nepal}
                    stroke="#003893"
                    strokeWidth="0.32"
                    fill="#003893"
                    fillOpacity="0.12"
                    initial={false}
                    animate={{ y: activeStage === 3 ? -4.0 : 0 }}
                    transition={{ duration: 1.0 }}
                  />

                  {/* CORDILHEIRA DO HIMALAIA ESCULPIDA EM RELEVO ALPINO REALISTA (Maciços, Cristas, Glaciares e Faces Sombreadas) */}
                  <motion.g
                    initial={false}
                    animate={{
                      scaleY: activeStage === 3 ? 1.48 : 0.08,
                      skewX: activeStage === 3 ? 15 : 0,
                      y: activeStage === 3 ? 0 : 6,
                    }}
                    transition={{
                      duration: 1.2,
                      delay: activeStage === 3 ? 0.18 : 0,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transformOrigin: '1353.5px 421px' }}
                  >
                    {/* 1. CAMADA POSTERIOR (Picos distantes do Planalto Tibetano em azul suave) */}
                    <path
                      d="M 1334.5 411.5 L 1336.4 405.2 L 1338.1 403.4 L 1339.8 405.8 L 1342.3 400.6 L 1344.2 398.2 L 1346.4 402.5 L 1349.2 396.8 L 1351.4 394.9 L 1353.8 399.7 L 1356.5 393.8 L 1358.9 396.9 L 1361.7 390.4 L 1363.6 388.2 L 1366.2 393.5 L 1368.8 389.4 L 1370.9 392.1 L 1373.4 418.5 Z"
                      fill="#003893"
                      fillOpacity="0.14"
                      stroke="#003893"
                      strokeWidth="0.25"
                      strokeOpacity="0.45"
                      strokeLinejoin="round"
                    />

                    {/* 2. MACIÇO PRINCIPAL DOS 8.000M (Dhaulagiri, Annapurna, Manaslu, Everest, Lhotse, Makalu, Kanchenjunga)
                        Corpo base iluminado pela neve */}
                    <path
                      d="M 1333.8 412.2
                         L 1335.4 408.8 L 1336.9 406.9 L 1338.2 403.5 L 1339.4 400.8 L 1340.5 402.1 L 1341.7 404.9
                         L 1343.1 405.8 L 1344.6 401.9 L 1345.8 399.4 L 1347.2 395.8 L 1348.3 394.6 L 1349.6 396.9 L 1350.8 400.2 L 1352.1 403.4
                         L 1353.3 401.2 L 1354.7 397.5 L 1355.9 394.8 L 1357.1 393.6 L 1358.3 396.2 L 1359.5 399.8 L 1360.7 402.1
                         L 1361.9 397.8 L 1363.0 393.2 L 1364.1 389.6 L 1365.0 386.4 L 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.7 393.8 L 1369.8 397.9
                         L 1370.7 395.1 L 1371.7 392.2 L 1372.6 390.6 L 1373.5 393.9 L 1374.4 398.7 L 1375.3 405.2 L 1375.9 420.2
                         L 1366.5 424.2 L 1354.5 421.8 L 1343.2 417.5 Z"
                      fill="#f4f2eb"
                      fillOpacity="0.97"
                    />

                    {/* 3. FACES ROCHOSAS E GLACIARES SOMBREADAS (Vertentes Leste/Sul com geometria facetada realista) */}
                    <path
                      d="M 1339.4 400.8 L 1340.5 402.1 L 1341.7 404.9 L 1343.1 405.8 L 1341.8 411.4 L 1339.6 413.8 L 1338.7 408.2 L 1339.7 404.5 Z
                         M 1348.3 394.6 L 1349.6 396.9 L 1350.8 400.2 L 1352.1 403.4 L 1351.2 410.5 L 1348.9 415.6 L 1347.6 409.2 L 1348.6 402.8 L 1347.8 398.5 Z
                         M 1357.1 393.6 L 1358.3 396.2 L 1359.5 399.8 L 1360.7 402.1 L 1359.8 411.2 L 1357.6 417.8 L 1356.2 411.4 L 1357.3 404.1 L 1356.5 398.2 Z
                         M 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.7 393.8 L 1369.8 397.9 L 1368.9 410.8 L 1366.4 420.5 L 1364.8 413.2 L 1365.9 404.6 L 1365.1 396.4 L 1366.1 390.8 Z
                         M 1372.6 390.6 L 1373.5 393.9 L 1374.4 398.7 L 1375.3 405.2 L 1375.9 420.2 L 1372.8 421.8 L 1371.6 412.6 L 1372.7 403.4 L 1372.1 396.5 Z"
                      fill="#003893"
                      fillOpacity="0.26"
                    />

                    {/* Sombras profundas de escarpas e paredões (Lhotse Face / Annapurna Fang) */}
                    <path
                      d="M 1348.3 394.6 L 1349.6 396.9 L 1350.2 403.6 L 1348.6 402.8 L 1347.8 398.5 Z
                         M 1357.1 393.6 L 1358.3 396.2 L 1358.9 402.9 L 1357.3 404.1 L 1356.5 398.2 Z
                         M 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.2 398.4 L 1365.9 404.6 L 1365.1 396.4 L 1366.1 390.8 Z
                         M 1372.6 390.6 L 1373.5 393.9 L 1374.1 401.8 L 1372.7 403.4 L 1372.1 396.5 Z"
                      fill="#08254c"
                      fillOpacity="0.28"
                    />

                    {/* 4. CONTRAFORTE FRONTAL (Médio Himalaia / Cordilheira Mahabharat em primeiro plano) */}
                    <path
                      d="M 1335.2 414.5
                         L 1337.8 410.4 L 1339.9 408.8 L 1342.4 411.9 L 1345.1 407.6 L 1347.5 406.2 L 1350.3 410.8
                         L 1353.2 408.1 L 1355.8 405.9 L 1358.6 411.4 L 1361.5 407.8 L 1364.2 405.2 L 1367.4 411.8
                         L 1370.1 408.9 L 1372.4 411.5 L 1374.8 421.2
                         L 1365.0 424.8 L 1351.0 421.5 Z"
                      fill="#f4f2eb"
                      fillOpacity="0.88"
                    />
                    <path
                      d="M 1339.9 408.8 L 1342.4 411.9 L 1341.2 415.8 L 1339.2 413.2 Z
                         M 1347.5 406.2 L 1350.3 410.8 L 1348.9 417.4 L 1346.8 412.6 Z
                         M 1355.8 405.9 L 1358.6 411.4 L 1357.1 419.2 L 1354.9 413.8 Z
                         M 1364.2 405.2 L 1367.4 411.8 L 1365.8 421.6 L 1363.4 414.5 Z
                         M 1370.1 408.9 L 1372.4 411.5 L 1373.8 421.5 L 1370.8 422.4 L 1369.5 415.2 Z"
                      fill="#003893"
                      fillOpacity="0.19"
                    />

                    {/* 5. LINHA DE CRISTA PRINCIPAL DO HIMALAIA (Desenhada progressivamente com serrilhado alpino natural) */}
                    <motion.path
                      d="M 1333.8 412.2
                         L 1335.4 408.8 L 1336.9 406.9 L 1338.2 403.5 L 1339.4 400.8 L 1340.5 402.1 L 1341.7 404.9
                         L 1343.1 405.8 L 1344.6 401.9 L 1345.8 399.4 L 1347.2 395.8 L 1348.3 394.6 L 1349.6 396.9 L 1350.8 400.2 L 1352.1 403.4
                         L 1353.3 401.2 L 1354.7 397.5 L 1355.9 394.8 L 1357.1 393.6 L 1358.3 396.2 L 1359.5 399.8 L 1360.7 402.1
                         L 1361.9 397.8 L 1363.0 393.2 L 1364.1 389.6 L 1365.0 386.4 L 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.7 393.8 L 1369.8 397.9
                         L 1370.7 395.1 L 1371.7 392.2 L 1372.6 390.6 L 1373.5 393.9 L 1374.4 398.7 L 1375.3 405.2 L 1375.9 420.2"
                      stroke="#08254c"
                      strokeWidth="0.52"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: activeStage === 3 ? 1 : 0 }}
                      transition={{ duration: 1.35, ease: 'easeInOut' }}
                    />

                    {/* 6. ARESTAS SECUNDÁRIAS, ESPORÕES ROCHOSOS E ESTRATOS DE GELO (Line-art técnica) */}
                    <path
                      d="M 1339.4 400.8 L 1339.7 404.5 L 1338.7 408.2 L 1339.6 413.8
                         M 1338.2 403.5 L 1336.8 409.5 L 1335.6 413.2
                         M 1348.3 394.6 L 1347.8 398.5 L 1348.6 402.8 L 1347.6 409.2 L 1348.9 415.6
                         M 1347.2 395.8 L 1345.4 403.2 L 1343.8 409.6
                         M 1357.1 393.6 L 1356.5 398.2 L 1357.3 404.1 L 1356.2 411.4 L 1357.6 417.8
                         M 1355.9 394.8 L 1354.1 402.5 L 1352.6 408.8
                         M 1365.7 385.2 L 1366.1 390.8 L 1365.1 396.4 L 1365.9 404.6 L 1364.8 413.2 L 1366.4 420.5
                         M 1365.0 386.4 L 1363.2 395.8 L 1361.4 404.2
                         M 1367.8 390.1 L 1368.5 399.2 L 1367.9 409.4
                         M 1372.6 390.6 L 1372.1 396.5 L 1372.7 403.4 L 1371.6 412.6 L 1372.8 421.8
                         M 1335.2 414.5 L 1337.8 410.4 L 1339.9 408.8 L 1342.4 411.9 L 1345.1 407.6 L 1347.5 406.2 L 1350.3 410.8 L 1353.2 408.1 L 1355.8 405.9 L 1358.6 411.4 L 1361.5 407.8 L 1364.2 405.2 L 1367.4 411.8 L 1370.1 408.9 L 1372.4 411.5 L 1374.8 421.2"
                      stroke="#08254c"
                      strokeWidth="0.32"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeOpacity="0.85"
                    />

                    {/* Linhas de fissura glaciar e hachuras de escarpa */}
                    <path
                      d="M 1348.6 397.8 L 1350.1 399.4 M 1348.8 400.6 L 1350.9 402.4
                         M 1357.3 396.9 L 1358.8 398.7 M 1357.5 400.2 L 1359.6 402.0
                         M 1366.1 388.8 L 1367.9 391.2 M 1365.8 392.4 L 1368.3 395.1 M 1365.9 396.2 L 1368.8 399.0
                         M 1372.5 394.2 L 1374.0 396.4 M 1372.6 397.8 L 1374.5 400.2"
                      stroke="#003893"
                      strokeWidth="0.24"
                      strokeLinecap="round"
                      strokeOpacity="0.7"
                    />

                    {/* Pin de Altitude 3D: MONTE EVEREST / SAGARMATHA (8.848m) */}
                    <motion.g
                      animate={{ y: [0, -0.7, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    >
                      <line
                        x1="1365.7"
                        y1="385.2"
                        x2="1365.7"
                        y2="376.5"
                        stroke="#dc143c"
                        strokeWidth="0.4"
                        strokeDasharray="0.6 0.6"
                      />
                      <circle cx="1365.7" cy="385.2" r="0.85" fill="#dc143c" />
                      <rect
                        x="1353.2"
                        y="370.8"
                        width="25"
                        height="5.2"
                        rx="2.6"
                        fill="#dc143c"
                      />
                      <text
                        x="1365.7"
                        y="374.3"
                        textAnchor="middle"
                        className="font-display text-[2.1px] font-black tracking-[0.12em] fill-white"
                      >
                        EVEREST · 8.848M
                      </text>
                    </motion.g>

                    {/* Pin de Altitude 3D: ANNAPURNA I (8.091m) */}
                    <motion.g
                      animate={{ y: [0, -0.5, 0] }}
                      transition={{ duration: 3.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.3 }}
                    >
                      <circle cx="1348.3" cy="394.6" r="0.7" fill="#003893" />
                      <text
                        x="1345.5"
                        y="391.5"
                        textAnchor="middle"
                        className="font-display text-[1.9px] font-black tracking-[0.1em] fill-[#08254c]"
                      >
                        ANNAPURNA · 8.091M
                      </text>
                    </motion.g>

                    {/* Pin de Altitude 3D: KANCHENJUNGA (8.586m) */}
                    <motion.g
                      animate={{ y: [0, -0.55, 0] }}
                      transition={{ duration: 3.1, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.6 }}
                    >
                      <circle cx="1372.6" cy="390.6" r="0.68" fill="#003893" />
                      <text
                        x="1378.5"
                        y="388.4"
                        textAnchor="middle"
                        className="font-display text-[1.8px] font-black tracking-[0.1em] fill-[#08254c]"
                      >
                        KANCHENJUNGA · 8.586M
                      </text>
                    </motion.g>

                    {/* Nuvens e Bruma de Altitude entre os Vales Glaciares */}
                    <motion.path
                      d="M 1335.5 403.5 C 1339.5 402.2, 1343.5 402.2, 1347.5 403.5
                         M 1351.5 398.8 C 1355.5 397.4, 1359.5 397.4, 1363.5 398.8
                         M 1361.5 394.2 C 1365.5 392.8, 1369.5 392.8, 1374.0 394.2"
                      stroke="#003893"
                      strokeWidth="0.36"
                      strokeLinecap="round"
                      strokeOpacity="0.55"
                      animate={{ x: [-1.4, 1.8, -1.4] }}
                      transition={{ duration: 4.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    />
                  </motion.g>
                </motion.g>
              </g>
            </svg>
          </motion.div>

          {/* ===================================================================
              3. CABEÇALHO DO SLIDE 2 (COM LIQUID GLASS TRANSLÚCIDO)
             =================================================================== */}
          <CanvaFlowLayer
            speed="slow"
            className="pointer-events-none absolute top-[44px] left-[64px] right-[64px] z-30 flex items-start justify-between"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <MorphElement layoutId="hero-main-title">
                  <span className="font-display text-[22px] font-black uppercase tracking-[0.22em] text-[#003893]">
                    MISSÃO NEPAL
                  </span>
                </MorphElement>
                <span className="text-[#0f0f0f]/35 font-bold">·</span>
                <span className="font-display text-[15px] font-bold uppercase tracking-[0.2em] text-[#dc143c]">
                  CARTOGRAFIA OFICIAL &amp; RELEVO 3D
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`header-stage-${activeStage}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <h2 className="font-display text-[52px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
                    {currentInfo.title}
                  </h2>
                  <p className="font-sans text-[21px] font-medium text-[#2f3136]/85 mt-1">
                    {currentInfo.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              className="px-6 py-3.5 flex flex-col items-end text-right"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#003893]">
                {currentInfo.stepBadge}
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#0f0f0f]/75 mt-1 tabular-nums">
                {currentInfo.coords}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              4. CAIXAS DE TEXTO EM VIDRO FOSCO TRANSLÚCIDO (<LiquidGlassContainer>)
             =================================================================== */}
          <CanvaFlowLayer
            speed="fast"
            delay={0.1}
            className="pointer-events-none absolute left-[64px] bottom-[114px] z-30 w-[510px] flex flex-col gap-5"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`glass-cards-${activeStage}`}
                initial={{ opacity: 0, x: -35, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -25, y: -10 }}
                transition={{
                  type: 'spring',
                  stiffness: 105,
                  damping: 20,
                }}
                className="flex flex-col gap-5"
              >
                {/* Card Liquid Glass 01: Vidro Fosco Translúcido */}
                <LiquidGlassContainer
                  intensity="strong"
                  tint="light"
                  duration={6.5}
                  className="p-7"
                >
                  <div className="flex items-baseline justify-between border-b border-[#08254c]/15 pb-3.5 mb-3.5">
                    <span className="font-display text-[44px] font-black tracking-tight text-[#003893] leading-none tabular-nums">
                      {currentInfo.primaryMetric}
                    </span>
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#dc143c] text-right max-w-[215px]">
                      {currentInfo.primaryLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-[20px] font-extrabold uppercase tracking-tight text-[#080d1a] mb-1.5">
                    {currentInfo.card1Title}
                  </h3>
                  <p className="font-sans text-[16px] font-medium text-[#11151c] leading-relaxed">
                    {currentInfo.card1Body}
                  </p>
                </LiquidGlassContainer>

                {/* Card Liquid Glass 02: Vidro Fosco Translúcido com Tonalidade Azul-Marinho */}
                <LiquidGlassContainer
                  intensity="medium"
                  tint="navy"
                  duration={8}
                  className="p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#003893] mb-1.5 font-display">
                        <span>DADOS GEOGRÁFICOS</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#dc143c]">ETAPA 0{activeStage + 1}/04</span>
                      </div>
                      <h4 className="font-display text-[18px] font-extrabold uppercase tracking-tight text-[#080d1a] mb-1">
                        {currentInfo.card2Title}
                      </h4>
                      <p className="font-sans text-[15.5px] font-medium text-[#11151c]/90 leading-relaxed">
                        {currentInfo.card2Body}
                      </p>
                    </div>

                    {activeStage === 2 && (
                      <div className="w-[68px] h-[82px] shrink-0 drop-shadow-md">
                        <OfficialNepalFlag className="w-full h-full" animateEmblems />
                      </div>
                    )}
                  </div>
                </LiquidGlassContainer>
              </motion.div>
            </AnimatePresence>
          </CanvaFlowLayer>

          {/* ===================================================================
              5. BARRA INTERATIVA DE ETAPAS NO RODAPÉ (OCULTA POR PADRÃO, REVELA NO HOVER)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto group absolute left-0 bottom-0 z-40 pt-10 pr-14 pl-[64px] pb-[28px]"
          >
            <div className="flex items-center gap-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
              {([0, 1, 2, 3] as GeoStage[]).map((stageIdx) => {
                const isCurrent = activeStage === stageIdx;
                const labels = [
                  '01. Índia & China',
                  '02. 6× no Mato Grosso',
                  '03. Bandeira no Mapa',
                  '04. Relevo 3D Himalaia',
                ];
                return (
                  <button
                    key={stageIdx}
                    type="button"
                    onClick={() => setManualStage(stageIdx)}
                    className={`px-4 py-2 rounded-full font-display text-[13px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 border ${
                      isCurrent
                        ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                        : 'bg-white/40 text-[#08254c] border-white/75 hover:bg-white/65 backdrop-blur-md shadow-sm'
                    }`}
                  >
                    {labels[stageIdx]}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleNextStageOrClick}
                className="ml-2 px-5 py-2 rounded-full bg-[#dc143c] hover:bg-[#b81032] text-white font-display text-[13px] font-extrabold uppercase tracking-wider shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {activeStage < 3 ? 'Avançar Clique ➔' : 'Reiniciar Ciclo ↻'}
              </button>
            </div>
          </div>
        </div>
      </SlideStage>
    </>
  );
};

export const Slide02Geography: React.FC = () => {
  return (
    <Slide backgroundColor="#f4f2eb" padding={0}>
      <Slide02GeographyContent />
    </Slide>
  );
};

export default Slide02Geography;
