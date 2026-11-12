import React, { useState, useEffect } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { GEO_PATHS } from './geoData';
import { OfficialNepalFlag } from './OfficialNepalFlag';

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
 * Rig de Câmera 3D em 2 níveis:
 * - focusX / focusY: coordenada exata no mapa real (1920x1080) que fica no pivô central
 * - scale / rotateX / rotateY / rotateZ: órbita 3D e zoom em torno do ponto focal sem sair do eixo
 */
interface CameraState {
  focusX: number;
  focusY: number;
  screenOffsetX: number;
  screenOffsetY: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

const CAMERA_RIG: Record<GeoStage, CameraState> = {
  // Etapa 0: Índia, China e Nepal espremido no centro
  0: {
    focusX: 1348,
    focusY: 432,
    screenOffsetX: 250,
    screenOffsetY: 15,
    scale: 3.15,
    rotateX: 22,
    rotateY: -8,
    rotateZ: -4,
  },
  // Etapa 1: Voo pelo globo até o Brasil / Mato Grosso (696.3, 676.9)
  1: {
    focusX: GEO_PATHS.mtCenter.x,
    focusY: GEO_PATHS.mtCenter.y,
    screenOffsetX: 255,
    screenOffsetY: 10,
    scale: 5.6,
    rotateX: 24,
    rotateY: 10,
    rotateZ: 5,
  },
  // Etapa 2: Retorno ao contorno exato do Nepal (1353.5, 421.4) + Bandeira fincada tremulando
  2: {
    focusX: GEO_PATHS.nepalCenter.x,
    focusY: GEO_PATHS.nepalCenter.y,
    screenOffsetX: 255,
    screenOffsetY: 35,
    scale: 10.5,
    rotateX: 34,
    rotateY: -6,
    rotateZ: -8,
  },
  // Etapa 3: Mudança de perspectiva da câmera (inclinação 3D revelando o relevo do Himalaia)
  3: {
    focusX: GEO_PATHS.nepalCenter.x,
    focusY: GEO_PATHS.nepalCenter.y,
    screenOffsetX: 260,
    screenOffsetY: 55,
    scale: 11.8,
    rotateX: 60,
    rotateY: -12,
    rotateZ: -16,
  },
};

/**
 * Posições exatas dos 6 Nepais (usando o contorno geográfico real `GEO_PATHS.nepalCentered`)
 * encaixados dentro das fronteiras reais do Mato Grosso (bbox x: 672..725, y: 634..698)
 */
const SIX_REAL_NEPALS_IN_MT = [
  { id: 1, x: 688.5, y: 651.5, rotate: 24, scale: 0.48 },
  { id: 2, x: 709.5, y: 652.0, rotate: 24, scale: 0.48 },
  { id: 3, x: 685.5, y: 667.0, rotate: 24, scale: 0.48 },
  { id: 4, x: 707.5, y: 667.5, rotate: 24, scale: 0.48 },
  { id: 5, x: 686.5, y: 682.5, rotate: 24, scale: 0.48 },
  { id: 6, x: 707.5, y: 683.0, rotate: 24, scale: 0.48 },
];

export const Slide02GeographyContent: React.FC = () => {
  const { step, placeholder } = useSteps(3);
  const [manualStage, setManualStage] = useState<GeoStage | null>(null);

  useEffect(() => {
    setManualStage(null);
  }, [step]);

  const safeStepNumber =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(3, Math.round(step + 1)))
      : 0;
  const clampedSpectacleStage = safeStepNumber as GeoStage;
  const activeStage: GeoStage =
    manualStage !== null && CAMERA_RIG[manualStage]
      ? manualStage
      : clampedSpectacleStage;

  const currentInfo = STAGE_CONTENT[activeStage] ?? STAGE_CONTENT[0];
  const cam = CAMERA_RIG[activeStage] ?? CAMERA_RIG[0];

  // Ajuste dinâmico da espessura de linha para manter traços elegantes mesmo em alto zoom
  const baseStroke = activeStage >= 2 ? 0.35 : activeStage === 1 ? 0.55 : 0.9;

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
              1. FUNDO AMBIENTE: ESFERAS FLUÍDAS DE REFRAÇÃO (PARA O LIQUID GLASS)
                 + ROSA DOS VENTOS TOPOGRÁFICA EM MOVIMENTO CONTÍNUO
             =================================================================== */}
          <CanvaFlowLayer speed="slow" className="pointer-events-none absolute inset-0 z-0">
            {/* Bolhas líquidas coloridas suaves atrás dos cards para ativar a refração real do Liquid Glass */}
            <motion.div
              animate={{
                x: [0, 35, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.12, 0.95, 1],
              }}
              transition={{ duration: 11, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              className="absolute left-[40px] top-[240px] w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#003893]/28 via-[#003893]/12 to-transparent blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -30, 25, 0],
                y: [0, 35, -25, 0],
                scale: [1, 0.94, 1.1, 1],
              }}
              transition={{ duration: 13, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1 }}
              className="absolute left-[260px] bottom-[120px] w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-[#dc143c]/25 via-[#003893]/15 to-transparent blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 20, -15, 0],
                y: [0, -20, 25, 0],
              }}
              transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.5 }}
              className="absolute left-[110px] top-[520px] w-[280px] h-[280px] rounded-full bg-white/80 blur-2xl"
            />

            {/* Anéis Cartográficos Sutis no Fundo */}
            <motion.svg
              viewBox="0 0 1920 1080"
              className="w-full h-full opacity-[0.14]"
              fill="none"
              animate={{ rotate: [0, 1.5, 0] }}
              transition={{ duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            >
              <circle cx="1220" cy="540" r="380" stroke="#003893" strokeWidth="1.2" strokeDasharray="6 10" />
              <circle cx="1220" cy="540" r="560" stroke="#08254c" strokeWidth="1" />
              <circle cx="1220" cy="540" r="740" stroke="#003893" strokeWidth="1" strokeDasharray="4 12" />
            </motion.svg>
          </CanvaFlowLayer>

          {/* ===================================================================
              2. PALCO 3D CONTÍNUO COM GEOMETRIA CARTÓGRAFICA REAL (Natural Earth + IBGE)
             =================================================================== */}
          <CanvaFlowLayer
            speed="medium"
            delay={0.05}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{ perspective: '1600px' }}
          >
            {/* Movimento orgânico contínuo entre transições */}
            <motion.div
              animate={{
                y: [0, -6, 0],
                rotateZ: [0, 0.35, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
              className="w-full h-full flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* NÍVEL 1 DO RIG DE CÂMERA: Zoom + Órbita 3D (rotateX, rotateY, rotateZ) no centro do foco */}
              <motion.div
                animate={{
                  x: cam.screenOffsetX,
                  y: cam.screenOffsetY,
                  scale: cam.scale,
                  rotateX: cam.rotateX,
                  rotateY: cam.rotateY,
                  rotateZ: cam.rotateZ,
                }}
                transition={{
                  duration: 1.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative w-[1920px] h-[1080px] origin-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* NÍVEL 2 DO RIG DE CÂMERA: Translação exata para colocar o país focal no pivô (960, 540) */}
                <motion.div
                  animate={{
                    x: 960 - cam.focusX,
                    y: 540 - cam.focusY,
                  }}
                  transition={{
                    duration: 1.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative w-[1920px] h-[1080px]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <svg
                    viewBox="0 0 1920 1080"
                    className="w-full h-full overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      {/* ClipPath real das fronteiras do Mato Grosso (IBGE) */}
                      <clipPath id="mt-real-clip">
                        <path d={GEO_PATHS.matoGrosso} />
                      </clipPath>
                    </defs>

                    {/* ---------------------------------------------------------
                        A. GRADE DE MERIDIANOS E PARALELOS DO GLOBO
                       --------------------------------------------------------- */}
                    <g stroke="#003893" strokeOpacity="0.16" strokeWidth={baseStroke * 0.65}>
                      {[240, 420, 600, 780, 960, 1140, 1320, 1500, 1680].map((lx) => (
                        <line key={`lon-${lx}`} x1={lx} y1={80} x2={lx} y2={980} strokeDasharray="3 5" />
                      ))}
                      {[180, 300, 420, 540, 660, 780, 900].map((ly) => (
                        <line key={`lat-${ly}`} x1={120} y1={ly} x2={1800} y2={ly} strokeDasharray="3 5" />
                      ))}
                    </g>

                    {/* ---------------------------------------------------------
                        B. DEMAIS CONTINENTES DO MAPA-MÚNDI (Contexto Global Real)
                       --------------------------------------------------------- */}
                    <path
                      d={GEO_PATHS.worldContinents}
                      fill="#08254c"
                      fillOpacity="0.03"
                      stroke="#08254c"
                      strokeOpacity="0.28"
                      strokeWidth={baseStroke * 0.75}
                      strokeLinejoin="round"
                    />

                    {/* ---------------------------------------------------------
                        C. ÁSIA: FRONTEIRAS REAIS DA CHINA, ÍNDIA, BUTÃO E BANGLADESH
                       --------------------------------------------------------- */}
                    <g>
                      {/* CHINA (Fronteira Real Natural Earth) */}
                      <motion.path
                        d={GEO_PATHS.china}
                        fill="#003893"
                        fillOpacity={activeStage === 0 ? 0.08 : 0.03}
                        stroke="#08254c"
                        strokeWidth={baseStroke * 1.3}
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                      />

                      {/* ÍNDIA (Fronteira Real Natural Earth) */}
                      <motion.path
                        d={GEO_PATHS.india}
                        fill="#08254c"
                        fillOpacity={activeStage === 0 ? 0.06 : 0.025}
                        stroke="#08254c"
                        strokeWidth={baseStroke * 1.3}
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.1 }}
                      />

                      {/* Butão e Bangladesh (Vizinhos imediatos no Himalaia Oriental) */}
                      <path
                        d={GEO_PATHS.bhutan}
                        fill="#08254c"
                        fillOpacity="0.04"
                        stroke="#08254c"
                        strokeWidth={baseStroke * 0.8}
                      />
                      <path
                        d={GEO_PATHS.bangladesh}
                        fill="#08254c"
                        fillOpacity="0.04"
                        stroke="#08254c"
                        strokeWidth={baseStroke * 0.8}
                      />

                      {/* Rótulos Geográficos Reais na Ásia */}
                      <motion.g
                        animate={{
                          opacity: activeStage === 0 ? 1 : activeStage >= 2 ? 0.45 : 0.2,
                        }}
                      >
                        <text
                          x="1385"
                          y="372"
                          textAnchor="middle"
                          className="font-display text-[10px] font-black tracking-[0.28em] fill-[#08254c]"
                        >
                          CHINA (TIBETE)
                        </text>
                        <text
                          x="1338"
                          y="472"
                          textAnchor="middle"
                          className="font-display text-[10px] font-black tracking-[0.28em] fill-[#08254c]"
                        >
                          ÍNDIA
                        </text>
                      </motion.g>

                      {/* Setas de Compressão Geopolítica na Etapa 0 ("Espremido entre Índia e China") */}
                      <AnimatePresence>
                        {activeStage === 0 && (
                          <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {/* Seta Norte (China -> Nepal) */}
                            <motion.g
                              animate={{ y: [0, 3.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            >
                              <path
                                d="M 1360 392 L 1356 408 M 1352 403 L 1356 408 L 1362 404"
                                stroke="#dc143c"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.g>
                            {/* Seta Sul (Índia -> Nepal) */}
                            <motion.g
                              animate={{ y: [0, -3.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            >
                              <path
                                d="M 1346 446 L 1350 431 M 1345 435 L 1350 431 L 1354 436"
                                stroke="#dc143c"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.g>
                            {/* Anel de Destaque sobre o Nepal */}
                            <motion.circle
                              cx={GEO_PATHS.nepalCenter.x}
                              cy={GEO_PATHS.nepalCenter.y}
                              r="28"
                              stroke="#dc143c"
                              strokeWidth="0.9"
                              strokeDasharray="3 3"
                              animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0.35, 0.9] }}
                              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </motion.g>
                        )}
                      </AnimatePresence>
                    </g>

                    {/* ---------------------------------------------------------
                        D. FRONTEIRA REAL DE ALTA PRECISÃO (1:10m) DO NEPAL
                       --------------------------------------------------------- */}
                    <g>
                      {/* Camadas de extrusão 3D do território do Nepal (cria volume de bloco 3D nas Etapas 2 e 3) */}
                      {activeStage >= 2 && (
                        <>
                          <path
                            d={GEO_PATHS.nepal}
                            transform="translate(-1.2, 2.8)"
                            fill="#08254c"
                            fillOpacity="0.28"
                          />
                          <path
                            d={GEO_PATHS.nepal}
                            transform="translate(-0.6, 1.4)"
                            fill="#003893"
                            fillOpacity="0.35"
                          />
                        </>
                      )}

                      {/* Contorno Geográfico Real 1:10m do Nepal (1.021 vértices reais) */}
                      <motion.path
                        d={GEO_PATHS.nepal}
                        fill={activeStage >= 2 ? '#003893' : '#dc143c'}
                        fillOpacity={activeStage === 3 ? 0.22 : activeStage === 2 ? 0.18 : 0.85}
                        stroke={activeStage >= 2 ? '#08254c' : '#dc143c'}
                        strokeWidth={activeStage >= 2 ? '0.55' : '1.1'}
                        strokeLinejoin="round"
                      />

                      {/* Segunda borda interna carmesim nas Etapas 2 e 3 */}
                      {activeStage >= 2 && (
                        <path
                          d={GEO_PATHS.nepal}
                          fill="none"
                          stroke="#dc143c"
                          strokeWidth="0.25"
                          strokeOpacity="0.75"
                        />
                      )}

                      {/* Rótulo NEPAL */}
                      {activeStage === 0 && (
                        <text
                          x={GEO_PATHS.nepalCenter.x + 28}
                          y={GEO_PATHS.nepalCenter.y - 4}
                          className="font-display text-[7px] font-black tracking-[0.22em] fill-[#dc143c]"
                        >
                          NEPAL
                        </text>
                      )}
                    </g>

                    {/* ---------------------------------------------------------
                        E. ROTA DE NAVEGAÇÃO TRANSCONTINENTAL PELO GLOBO
                           Katmandu (1353.5, 421.4) ⇄ Mato Grosso (696.3, 676.9)
                       --------------------------------------------------------- */}
                    <g>
                      <motion.path
                        d={`M ${GEO_PATHS.nepalCenter.x} ${GEO_PATHS.nepalCenter.y} C 1080 280, 840 420, ${GEO_PATHS.mtCenter.x} ${GEO_PATHS.mtCenter.y}`}
                        stroke="#003893"
                        strokeWidth={baseStroke * 1.4}
                        strokeDasharray="4 4"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: activeStage >= 1 ? 1 : 0,
                          opacity: activeStage === 1 || activeStage === 2 ? 0.85 : 0.15,
                        }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                      />
                      <motion.path
                        d={`M ${GEO_PATHS.mtCenter.x} ${GEO_PATHS.mtCenter.y} C 940 760, 1180 620, ${GEO_PATHS.nepalCenter.x} ${GEO_PATHS.nepalCenter.y}`}
                        stroke="#dc143c"
                        strokeWidth={baseStroke * 1.2}
                        strokeDasharray="3 4"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: activeStage >= 2 ? 1 : 0,
                          opacity: activeStage === 2 ? 0.85 : 0.12,
                        }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                      />
                    </g>

                    {/* ---------------------------------------------------------
                        F. BRASIL (NATURAL EARTH) E MATO GROSSO (IBGE) + 6 NEPAIS REAIS
                       --------------------------------------------------------- */}
                    <g>
                      {/* Demais Estados do Brasil (IBGE) */}
                      <path
                        d={GEO_PATHS.brazilStates}
                        fill="#08254c"
                        fillOpacity="0.02"
                        stroke="#08254c"
                        strokeOpacity={activeStage === 1 ? 0.35 : 0.15}
                        strokeWidth={baseStroke * 0.6}
                        strokeLinejoin="round"
                      />

                      {/* Contorno Externo do Brasil */}
                      <path
                        d={GEO_PATHS.brazil}
                        fill="#003893"
                        fillOpacity={activeStage === 1 ? 0.04 : 0.01}
                        stroke="#08254c"
                        strokeWidth={baseStroke * 1.3}
                        strokeLinejoin="round"
                      />

                      {/* Sombra de Extrusão 3D do Estado do Mato Grosso */}
                      {activeStage === 1 && (
                        <path
                          d={GEO_PATHS.matoGrosso}
                          transform="translate(-1.5, 2.5)"
                          fill="#08254c"
                          fillOpacity="0.22"
                        />
                      )}

                      {/* Estado do MATO GROSSO com Fronteira Exata do IBGE (4.060 pontos) */}
                      <motion.path
                        d={GEO_PATHS.matoGrosso}
                        fill="#003893"
                        fillOpacity={activeStage === 1 ? 0.14 : 0.04}
                        stroke="#003893"
                        strokeWidth={activeStage === 1 ? '0.95' : '0.5'}
                        strokeLinejoin="round"
                      />

                      {/* Rótulos Geográficos do Brasil e Mato Grosso */}
                      <motion.g
                        animate={{ opacity: activeStage === 1 ? 1 : 0.25 }}
                      >
                        <text
                          x="746"
                          y="632"
                          className="font-display text-[8px] font-black tracking-[0.26em] fill-[#08254c]"
                        >
                          BRASIL
                        </text>
                        <text
                          x={GEO_PATHS.mtCenter.x}
                          y={GEO_PATHS.mtBbox.minY - 5}
                          textAnchor="middle"
                          className="font-display text-[5.2px] font-black tracking-[0.18em] fill-[#003893]"
                        >
                          MATO GROSSO · 903.357 KM²
                        </text>
                      </motion.g>

                      {/* OS 6 NEPAIS (COM FORMATO GEOGRÁFICO REAL) SENDO DESENHADOS DENTRO DO MATO GROSSO */}
                      <AnimatePresence>
                        {activeStage === 1 && (
                          <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <g clipPath="url(#mt-real-clip)">
                              {SIX_REAL_NEPALS_IN_MT.map((item, index) => (
                                <g
                                  key={item.id}
                                  transform={`translate(${item.x}, ${item.y}) rotate(${item.rotate}) scale(${item.scale})`}
                                >
                                  <motion.path
                                    d={GEO_PATHS.nepalCentered}
                                    fill="#dc143c"
                                    fillOpacity="0.28"
                                    stroke="#dc143c"
                                    strokeWidth="1.35"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                      duration: 0.85,
                                      delay: 0.35 + index * 0.16,
                                      ease: 'easeInOut',
                                    }}
                                  />
                                  <motion.text
                                    x="0"
                                    y="2.2"
                                    textAnchor="middle"
                                    className="font-display text-[6.5px] font-black fill-[#08254c]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 + index * 0.16 }}
                                  >
                                    0{item.id}
                                  </motion.text>
                                </g>
                              ))}
                            </g>

                            {/* Selo inferior sob o Mato Grosso */}
                            <motion.g
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.25, duration: 0.5 }}
                            >
                              <rect
                                x={GEO_PATHS.mtCenter.x - 28}
                                y={GEO_PATHS.mtBbox.maxY + 4}
                                width="56"
                                height="8.5"
                                rx="4.25"
                                fill="#dc143c"
                              />
                              <text
                                x={GEO_PATHS.mtCenter.x}
                                y={GEO_PATHS.mtBbox.maxY + 9.8}
                                textAnchor="middle"
                                className="font-display text-[3.6px] font-black tracking-[0.16em] fill-white"
                              >
                                CABEM 6 NEPAIS INTEIROS
                              </text>
                            </motion.g>
                          </motion.g>
                        )}
                      </AnimatePresence>
                    </g>

                    {/* ---------------------------------------------------------
                        G. ETAPA 2: BANDEIRA OFICIAL DO NEPAL FINCADA E TREMULANDO NO MAPA
                       --------------------------------------------------------- */}
                    <AnimatePresence>
                      {activeStage === 2 && (
                        <motion.g
                          initial={{ opacity: 0, y: -8, scale: 0.7 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.7 }}
                          transition={{
                            type: 'spring',
                            stiffness: 110,
                            damping: 16,
                            delay: 0.3,
                          }}
                        >
                          {/* Sombra projetada no mapa em Katmandu (1355.2, 421.8) */}
                          <motion.ellipse
                            cx="1355.2"
                            cy="421.8"
                            rx="3.8"
                            ry="1.6"
                            fill="#08254c"
                            fillOpacity="0.35"
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <circle cx="1355.2" cy="421.8" r="0.9" fill="#dc143c" />

                          {/* Mastro 3D Fincado em Katmandu */}
                          <motion.line
                            x1="1355.2"
                            y1="421.8"
                            x2="1355.2"
                            y2="394.5"
                            stroke="#08254c"
                            strokeWidth="0.75"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.55 }}
                          />

                          {/* Bandeira Oficial do Nepal (Anexo 1 da Constituição) Tremulando no Mastro */}
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
                            <g transform="translate(1359.3, 395.5) scale(0.24)">
                              {/* Borda Azul Marinho Oficial */}
                              <path
                                d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
                                fill="none"
                                stroke="#003893"
                                strokeWidth="5.165"
                                strokeMiterlimit="10"
                              />
                              {/* Campo Vermelho Carmesim Oficial */}
                              <path
                                d="M -15,37.5735931288 h 60 L -15,0 v 80 h 60 L -15,20 z"
                                fill="#DC143C"
                              />
                              {/* Lua Crescente + Sol Nascente e Sol de 12 Pontas */}
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

                          {/* Rótulo KATMANDU */}
                          <text
                            x="1355.2"
                            y="425.8"
                            textAnchor="middle"
                            className="font-display text-[2.4px] font-black tracking-[0.18em] fill-[#08254c]"
                          >
                            KATMANDU
                          </text>
                        </motion.g>
                      )}
                    </AnimatePresence>

                    {/* ---------------------------------------------------------
                        H. ETAPA 3: MUDANÇA DE PERSPECTIVA 3D — RELEVO DO HIMALAIA
                           Camadas topográficas do contorno real + Picos 3D do Himalaia
                       --------------------------------------------------------- */}
                    <AnimatePresence>
                      {activeStage === 3 && (
                        <motion.g
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7 }}
                        >
                          {/* Fatias Topográficas 3D do Contorno Real do Nepal (Isohipsas Elevadas) */}
                          <motion.path
                            d={GEO_PATHS.nepal}
                            stroke="#003893"
                            strokeWidth="0.3"
                            strokeDasharray="0.8 0.8"
                            fill="#003893"
                            fillOpacity="0.08"
                            initial={{ y: 2, opacity: 0 }}
                            animate={{ y: -2.2, opacity: 0.85 }}
                            transition={{ duration: 0.9, delay: 0.1 }}
                          />
                          <motion.path
                            d={GEO_PATHS.nepal}
                            stroke="#003893"
                            strokeWidth="0.35"
                            fill="#003893"
                            fillOpacity="0.12"
                            initial={{ y: 3, opacity: 0 }}
                            animate={{ y: -4.4, opacity: 0.9 }}
                            transition={{ duration: 1.0, delay: 0.2 }}
                          />

                          {/* CORDILHEIRA DO HIMALAIA EM RELEVO 3D SOBRE A FRONTEIRA NORTE REAL DO NEPAL */}
                          <motion.g
                            initial={{ y: 8, scaleY: 0.15, opacity: 0 }}
                            animate={{ y: 0, scaleY: 1, opacity: 1 }}
                            transition={{
                              duration: 1.25,
                              delay: 0.2,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ transformOrigin: '1353.5px 421px' }}
                          >
                            {/* Faces Sombreadas 3D dos Picos */}
                            <path
                              d="M 1335 412 L 1340 398 L 1344 407 L 1348.5 394 L 1353 405 L 1357.5 392 L 1361 404 L 1365.5 385 L 1369 402 L 1372.5 391 L 1375 419 Z"
                              fill="#f4f2eb"
                              fillOpacity="0.92"
                            />
                            <path
                              d="M 1340 398 L 1344 407 L 1341.5 414 Z M 1348.5 394 L 1353 405 L 1350 416 Z M 1357.5 392 L 1361 404 L 1358.5 418 Z M 1365.5 385 L 1369 402 L 1366.5 420 Z M 1372.5 391 L 1375 419 L 1371.5 421 Z"
                              fill="#003893"
                              fillOpacity="0.22"
                            />

                            {/* Linha de Crista Principal 3D (Dhaulagiri -> Annapurna -> Manaslu -> Everest -> Kanchenjunga) */}
                            <motion.path
                              d="M 1335 412 L 1340 398 L 1344 407 L 1348.5 394 L 1353 405 L 1357.5 392 L 1361 404 L 1365.5 385 L 1369 402 L 1372.5 391 L 1375 419"
                              stroke="#08254c"
                              strokeWidth="0.65"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, ease: 'easeInOut' }}
                            />

                            {/* Arestas Wireframe Verticais do Relevo */}
                            <motion.path
                              d="M 1340 398 L 1341.5 414 M 1348.5 394 L 1350 416 M 1357.5 392 L 1358.5 418 M 1365.5 385 L 1366.5 420 M 1372.5 391 L 1371.5 421 M 1344 407 L 1340 417 M 1353 405 L 1348.5 419 M 1361 404 L 1357.5 421 M 1369 402 L 1364 423"
                              stroke="#003893"
                              strokeWidth="0.38"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.6, delay: 0.25 }}
                            />

                            {/* Pin de Altitude 3D: MONTE EVEREST (8.848m) */}
                            <motion.g
                              animate={{ y: [0, -0.8, 0] }}
                              transition={{ duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            >
                              <line
                                x1="1365.5"
                                y1="385"
                                x2="1365.5"
                                y2="376.5"
                                stroke="#dc143c"
                                strokeWidth="0.45"
                                strokeDasharray="0.6 0.6"
                              />
                              <circle cx="1365.5" cy="385" r="0.9" fill="#dc143c" />
                              <rect
                                x="1353"
                                y="370.8"
                                width="25"
                                height="5.2"
                                rx="2.6"
                                fill="#dc143c"
                              />
                              <text
                                x="1365.5"
                                y="374.3"
                                textAnchor="middle"
                                className="font-display text-[2.1px] font-black tracking-[0.12em] fill-white"
                              >
                                EVEREST · 8.848M
                              </text>
                            </motion.g>

                            {/* Pin de Altitude 3D: ANNAPURNA (8.091m) */}
                            <motion.g
                              animate={{ y: [0, -0.6, 0] }}
                              transition={{ duration: 3.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 0.3 }}
                            >
                              <circle cx="1348.5" cy="394" r="0.75" fill="#003893" />
                              <text
                                x="1345.5"
                                y="391.2"
                                textAnchor="middle"
                                className="font-display text-[1.9px] font-black tracking-[0.1em] fill-[#08254c]"
                              >
                                ANNAPURNA · 8.091M
                              </text>
                            </motion.g>

                            {/* Nuvens de Altitude Deslizando entre os Picos */}
                            <motion.path
                              d="M 1336 402 C 1341 400.5, 1346 400.5, 1351 402 M 1360 395 C 1365 393.5, 1370 393.5, 1375 395"
                              stroke="#003893"
                              strokeWidth="0.4"
                              strokeLinecap="round"
                              strokeOpacity="0.6"
                              animate={{ x: [-1.8, 2.2, -1.8] }}
                              transition={{ duration: 4.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                            />
                          </motion.g>
                        </motion.g>
                      )}
                    </AnimatePresence>
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          </CanvaFlowLayer>

          {/* ===================================================================
              3. CABEÇALHO DO SLIDE 2 (COM MORPH DO TÍTULO DO SLIDE 1 + FLUXO)
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
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <h2 className="font-display text-[52px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
                    {currentInfo.title}
                  </h2>
                  <p className="font-sans text-[21px] font-medium text-[#2f3136]/80 mt-1">
                    {currentInfo.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Coordenadas Cartográficas em Tempo Real */}
            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              className="px-6 py-3.5 flex flex-col items-end text-right"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#003893]">
                {currentInfo.stepBadge}
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#0f0f0f]/70 mt-1 tabular-nums">
                {currentInfo.coords}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              4. CAIXAS DE TEXTO EM AUTÊNTICO LIQUID GLASS (<LiquidGlassContainer>)
                 Com bordas orgânicas animadas, vidro fosco refrativo e brilho especular
             =================================================================== */}
          <CanvaFlowLayer
            speed="fast"
            delay={0.12}
            className="pointer-events-none absolute left-[64px] bottom-[112px] z-30 w-[570px] flex flex-col gap-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`glass-cards-${activeStage}`}
                initial={{ opacity: 0, x: -45, y: 15 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -35, y: -15 }}
                transition={{
                  type: 'spring',
                  stiffness: 95,
                  damping: 19,
                }}
                className="flex flex-col gap-6"
              >
                {/* Card Liquid Glass 01: Destaque Principal + Métrica */}
                <LiquidGlassContainer
                  intensity="strong"
                  tint="light"
                  duration={6.5}
                  className="p-9"
                >
                  <div className="flex items-baseline justify-between border-b border-[#08254c]/15 pb-4 mb-4">
                    <span className="font-display text-[54px] font-black tracking-tight text-[#003893] leading-none tabular-nums drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                      {currentInfo.primaryMetric}
                    </span>
                    <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#dc143c] text-right max-w-[230px]">
                      {currentInfo.primaryLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-[22px] font-extrabold uppercase tracking-tight text-[#080d1a] mb-2">
                    {currentInfo.card1Title}
                  </h3>
                  <p className="font-sans text-[18px] font-medium text-[#151922]/90 leading-relaxed">
                    {currentInfo.card1Body}
                  </p>
                </LiquidGlassContainer>

                {/* Card Liquid Glass 02: Detalhamento Geográfico + Mini Bandeira na Etapa 2 */}
                <LiquidGlassContainer
                  intensity="medium"
                  tint="navy"
                  duration={8}
                  className="p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[0.22em] text-[#003893] mb-2 font-display">
                        <span>DADOS GEOGRÁFICOS</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#dc143c]">ETAPA 0{activeStage + 1}/04</span>
                      </div>
                      <h4 className="font-display text-[20px] font-extrabold uppercase tracking-tight text-[#080d1a] mb-1.5">
                        {currentInfo.card2Title}
                      </h4>
                      <p className="font-sans text-[17px] font-medium text-[#151922]/85 leading-relaxed">
                        {currentInfo.card2Body}
                      </p>
                    </div>

                    {activeStage === 2 && (
                      <div className="w-[74px] h-[90px] shrink-0 drop-shadow-md">
                        <OfficialNepalFlag className="w-full h-full" animateEmblems />
                      </div>
                    )}
                  </div>
                </LiquidGlassContainer>
              </motion.div>
            </AnimatePresence>
          </CanvaFlowLayer>

          {/* ===================================================================
              5. BARRA INTERATIVA DE ETAPAS (EM LIQUID GLASS NO RODAPÉ)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute left-[64px] bottom-[32px] z-40 flex items-center gap-3"
          >
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
                      ? 'bg-[#003893] text-white border-[#003893] shadow-lg scale-105'
                      : 'bg-white/45 text-[#08254c]/85 border-white/80 hover:bg-white/75 backdrop-blur-xl shadow-sm'
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
