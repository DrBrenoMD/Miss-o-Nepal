import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
} from './AnimationWrappers';
import { GEO_PATHS } from './geoData';
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

export type TimelineStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CensusRow {
  year: string;
  count: string;
  percent: string;
  description: string;
}

interface ContextPillar {
  label: string;
  value: string;
}

interface TimelineMilestone {
  step: TimelineStep;
  period: string;
  shortLabel: string;
  title: string;
  historyText: string;
  christianMetricBadge: string;
  christianPercentBadge?: string;
  christianSummaryText: string;
  censusTable?: CensusRow[];
  contextPillars?: [ContextPillar, ContextPillar, ContextPillar];
  imagePrimary: string;
  imageSecondary?: string;
  isPortraitArtwork?: boolean;
  secondaryObjectTop?: boolean;
  imageCaption: string;
  imageSubcaption: string;
  chartValueLabel: string;
  zoomWindowLabel: string;
}

const TIMELINE_DATA: TimelineMilestone[] = [
  {
    step: 0,
    period: 'Séc. VI a.C.',
    shortLabel: 'Séc. VI a.C.',
    title: 'REINOS DIVIDIDOS & ORIGEM DO BUDISMO',
    historyText:
      'O Nepal não era um país unificado, mas sim vários reinos divididos. Nessa época nasce o Buda e surge o budismo e o sincretismo com o hinduísmo.',
    christianMetricBadge: '~0 cristãos',
    christianSummaryText:
      'Número de cristãos: ~0 — Não havia presença cristã registrada na região himalaia neste período.',
    contextPillars: [
      { label: 'Estrutura Política', value: 'Principados e reinos fragmentados no Himalaia' },
      { label: 'Matriz Religiosa', value: 'Berço de Sidarta Gautama & sincretismo hindu-budista' },
      { label: 'Presença Cristã', value: 'Sem registros históricos na região (~0)' },
    ],
    imagePrimary: '/assets/timeline/step1-buddha.jpg',
    isPortraitArtwork: true,
    imageCaption: 'Sidarta Gautama (O Buda)',
    imageSubcaption: 'Nascido em Lumbini, no sul do atual Nepal (Séc. VI a.C.).',
    chartValueLabel: '~0',
    zoomWindowLabel: 'Zoom: Antiguidade (Séc. VI a.C.)',
  },
  {
    step: 1,
    period: '1768',
    shortLabel: '1768',
    title: 'UNIFICAÇÃO FORÇADA & REINO HINDU RÍGIDO',
    historyText:
      'Unificação forçada do Nepal por Prithvi Narayan Shah. O Nepal se torna um Reino Hindu rígido. Os poucos missionários católicos (capuchinhos) que viviam no vale de Kathmandu foram expulsos. A conversão passa a ser crime contra o Estado.',
    christianMetricBadge: '~0 cristãos',
    christianSummaryText:
      'Número de cristãos: ~0 — Os pequenos grupos cristãos e os frades capuchinhos foram expulsos após a unificação.',
    contextPillars: [
      { label: 'Regime Político', value: 'Dinastia Shah · Reino Hindu unificado (Asal Hindustan)' },
      { label: 'Status Jurídico', value: 'Conversão religiosa tipificada como crime de Estado' },
      { label: 'Presença Cristã', value: 'Expulsão dos capuchinhos do vale de Kathmandu' },
    ],
    imagePrimary: '/assets/timeline/step2-unification-map.png',
    imageSecondary: '/assets/timeline/step2-prithvi-shah.jpg',
    secondaryObjectTop: true,
    imageCaption: 'Mapa do Nepal Unificado (1768)',
    imageSubcaption: 'Prithvi Narayan Shah unifica o reino e expulsa os missionários capuchinhos.',
    chartValueLabel: '~0',
    zoomWindowLabel: 'Zoom: Séc. VI a.C. → 1768',
  },
  {
    step: 2,
    period: '1846',
    shortLabel: '1846',
    title: 'ISOLAMENTO RANA & A LENDA DOS GURKHAS',
    historyText:
      'Através de um massacre palaciano, a família Rana tomou o controle absoluto do país, rebaixando os reis a figuras decorativas. Para evitar o domínio do Império Britânico (que havia colonizado a Índia), os Ranas isolaram o Nepal do resto do mundo por mais de um século. O país nunca foi colonizado, mas assinou tratados de paz com os britânicos, o que deu origem à lenda dos Gurkhas (soldados nepaleses que passaram a servir exércitos estrangeiros devido à sua bravura).',
    christianMetricBadge: '~0 cristãos',
    christianSummaryText:
      'Número de cristãos: ~0 — Fronteiras rigorosamente fechadas a estrangeiros e missionários por mais de um século.',
    contextPillars: [
      { label: 'Domínio Interno', value: 'Autocracia hereditária da família Rana (1846–1951)' },
      { label: 'Política Externa', value: 'Fronteiras seladas por 105 anos · Tratado dos Gurkhas' },
      { label: 'Presença Cristã', value: 'Entrada missionária estritamente proibida (~0)' },
    ],
    imagePrimary: '/assets/timeline/step3-gurkhas.jpg',
    isPortraitArtwork: true,
    imageCaption: 'Soldados Gurkhas do Nepal',
    imageSubcaption: 'Reconhecidos mundialmente por sua bravura e pela tradicional lâmina Kukri.',
    chartValueLabel: '~0',
    zoomWindowLabel: 'Zoom: Séc. VI a.C. → 1846',
  },
  {
    step: 3,
    period: '1951',
    shortLabel: '1951',
    title: 'ABERTURA DAS FRONTEIRAS & IGREJA SECRETA',
    historyText:
      'A monarquia retomou o poder real em 1951 e finalmente abriu as fronteiras do Nepal para o mundo, iniciando a era de ouro do turismo e do alpinismo no Monte Everest. No entanto, décadas de pobreza, desigualdade e falta de democracia geraram insatisfação.',
    christianMetricBadge: '0 → 3.891',
    christianPercentBadge: '0,00% → 0,03%',
    christianSummaryText:
      'O censo de 1951 não apresenta nenhum cristão, mas a igreja já operava secretamente:',
    censusTable: [
      {
        year: '1951',
        count: '0 cristãos',
        percent: '0,00%',
        description:
          'Primeiro Censo do Nepal após 100 anos de isolamento; oficialmente não havia cristãos.',
      },
      {
        year: '1961',
        count: '458 cristãos',
        percent: '~0,00%',
        description:
          'Missões médicas e educacionais atuam de forma restrita, sem permissão legal de pregar.',
      },
      {
        year: '1971',
        count: '2.541 cristãos',
        percent: '0,02%',
        description:
          'Conversões ocorrem na mais absoluta clandestinidade sob alto risco de prisão.',
      },
      {
        year: '1981',
        count: '3.891 cristãos',
        percent: '0,03%',
        description:
          'A igreja nepalesa avança em células domiciliares e congregações subterrâneas.',
      },
    ],
    imagePrimary: '/assets/timeline/step4-everest-1951.jpg',
    imageCaption: 'Portões Abertos, Everest & Monarquia',
    imageSubcaption: 'Abertura das fronteiras em 1951 e era de ouro do alpinismo no Everest.',
    chartValueLabel: '3.891',
    zoomWindowLabel: 'Zoom nos Censos: 1951 – 1981',
  },
  {
    step: 4,
    period: '2001',
    shortLabel: '2001',
    title: 'GUERRA CIVIL & GOLPE FINAL NA MONARQUIA',
    historyText:
      'De 1996 a 2006, o país foi devastado por uma sangrenta Guerra Civil liderada por guerrilheiros maoístas. O golpe final na monarquia ocorreu em 2001, quando o príncipe herdeiro assassinou grande parte da própria família real dentro do palácio.',
    christianMetricBadge: '101.976 cristãos',
    christianPercentBadge: '0,45%',
    christianSummaryText: 'A igreja triplica de tamanho durante a década de conflito:',
    censusTable: [
      {
        year: '1991',
        count: '31.280 cristãos',
        percent: '0,17%',
        description:
          'Censo Oficial. Fim da monarquia absoluta e início da democracia multipartidária marcam o primeiro salto visível da igreja.',
      },
      {
        year: '2001',
        count: '101.976 cristãos',
        percent: '0,45%',
        description:
          'Censo Oficial. Em meio à guerra civil, a igreja triplica de tamanho, acolhendo sobretudo grupos marginalizados e Dalits.',
      },
    ],
    imagePrimary: '/assets/timeline/step5-monarchy-fall.jpg',
    imageCaption: 'Queda da Monarquia Nepalesa',
    imageSubcaption: 'Palácio Real Narayanhiti, palco do massacre real de 2001.',
    chartValueLabel: '101.976',
    zoomWindowLabel: 'Zoom nos Censos: 1951 – 2001',
  },
  {
    step: 5,
    period: '2008',
    shortLabel: '2008',
    title: 'REPÚBLICA LAICA & EXPLOSÃO DA IGREJA',
    historyText:
      'Fim da monarquia de 240 anos. O Nepal vira uma República Laica. Maior grau de liberdade religiosa que foi atingido na história do Nepal. A igreja cristã sai da clandestinidade e se torna uma das que mais cresce no mundo.',
    christianMetricBadge: '375.699 cristãos',
    christianPercentBadge: '1,42%',
    christianSummaryText:
      '2011: 375.699 cristãos (1,42%). Censo Oficial. O grande "Boom": a proclamação da República Laica em 2008 resulta num crescimento explosivo à medida que a igreja sai da clandestinidade.',
    contextPillars: [
      { label: 'Virada Histórica', value: 'Abolição de 240 anos de monarquia hindu (2008)' },
      { label: 'Liberdade Religiosa', value: 'Estado declarado laico · Fim da clandestinidade' },
      { label: 'Censo Oficial 2011', value: '375.699 cristãos (+268% em apenas uma década)' },
    ],
    imagePrimary: '/assets/timeline/step6-everest-2008.jpg',
    imageCaption: 'Monte Everest · Novo Horizonte',
    imageSubcaption: 'A proclamação da República Laica em 2008 inaugura um período de liberdade histórica.',
    chartValueLabel: '375.699',
    zoomWindowLabel: 'Zoom nos Censos: 1961 – 2011',
  },
  {
    step: 6,
    period: '2018',
    shortLabel: '2018',
    title: 'NOVO CÓDIGO PENAL & LEI ANTI-CONVERSÃO',
    historyText:
      'Pressão de nacionalistas hindus resulta no novo Código Penal. O Estado continua "laico", mas criminaliza o proselitismo. Falar de Jesus para um hindu e tentar convertê-lo volta a ser crime (até 5 anos de prisão).',
    christianMetricBadge: '512.313 cristãos',
    christianPercentBadge: '1,76%',
    christianSummaryText:
      '2021: 512.313 cristãos (1,76%). Último Censo Oficial. Forte subnotificação por medo, coincidindo com as severas leis anti-conversão do Código Penal de 2018.',
    contextPillars: [
      { label: 'Restrição Legal', value: 'Código Penal de 2018 proíbe evangelização direta' },
      { label: 'Pena Prevista', value: 'Até 5 anos de prisão e deportação de estrangeiros' },
      { label: 'Censo Oficial 2021', value: '512.313 registrados sob forte subnotificação' },
    ],
    imagePrimary: '/assets/timeline/step7-handcuffs.jpg',
    imageCaption: 'Criminalização do Proselitismo (2018)',
    imageSubcaption: 'Pena de até 5 anos de prisão para quem converter ou evangelizar.',
    chartValueLabel: '512.313',
    zoomWindowLabel: 'Zoom nos Censos: 1971 – 2021',
  },
  {
    step: 7,
    period: 'Atualmente',
    shortLabel: 'Atualmente',
    title: 'REVOLUÇÃO GEN Z (2025) & ENCHENTES (2026)',
    historyText:
      "'Revolução Gen Z' (2025) e enchentes de 2026: em meio à instabilidade política juvenil e aos desastres climáticos severos, as missões cristãs de ajuda humanitária encontram oportunidade de serviço prático em meio ao caos.",
    christianMetricBadge: '1,0M a 1,5M+',
    christianPercentBadge: '3% a 5%',
    christianSummaryText:
      'Estimativas de líderes locais e organizações internacionais apontam que o número real supera amplamente o censo oficial (1.000.000 a 1.500.000+ cristãos / 3% a 5% da população) e segue avançando.',
    contextPillars: [
      { label: 'Cenário 2025–2026', value: 'Mobilizações da Geração Z & enchentes históricas' },
      { label: 'Resposta Cristã', value: 'Socorro humanitário, abrigo e reconstrução comunitária' },
      { label: 'Estimativa Real', value: '1,0M a 1,5M+ cristãos (3% a 5% da população)' },
    ],
    imagePrimary: '/assets/timeline/step8-flood-rescue.jpg',
    imageSecondary: '/assets/timeline/step8-protest-flood.jpg',
    imageCaption: 'Revolução Gen Z & Tragédia das Enchentes',
    imageSubcaption: 'Missões cristãs de ajuda humanitária atuando em meio à onda de destroços.',
    chartValueLabel: '1,0M – 1,5M+',
    zoomWindowLabel: 'Panorama Completo: Séc. VI a.C. – 2026',
  },
];

/**
 * ============================================================================
 * GEOMETRIA E LENTE DE ZOOM CONTÍNUO DO GRÁFICO (CAMERA-LENS ENGINE)
 * ============================================================================
 * Coordenada canônica `u`:
 * - Marcos seculares pré-1951 separados por quebras de escala (`//`):
 *   VI a.C. (u=0)  //  1768 (u=90)  //  1846 (u=180)  //
 * - Era Moderna dos Censos (1951 a 2026 · 75 anos) 100% proporcional no tempo:
 *   8 unidades `u` por ano (80 unidades por década):
 *   1951 (270), 1961 (350), 1971 (430), 1981 (510), 1991 (590),
 *   2001 (670), 2011 (750), 2021 (830), 2026 (870).
 */
const CHART_PLOT = {
  viewWidth: 820,
  viewHeight: 306,
  xLeft: 70,
  xRight: 794,
  yTop: 32,
  yBase: 242,
  plotWidth: 724,  // 794 - 70
  plotHeight: 210, // 242 - 32
  fullMinU: -30,
  fullMaxU: 912,
  modernStartU: 270, // 1951
} as const;

interface HistoricalChartPoint {
  id: string;
  u: number;
  revealStep: TimelineStep;
  targetStep: TimelineStep;
  isMilestone: boolean;
  yearLabel: string;
  value: number;
  rangeMin?: number;
  rangeMax?: number;
  formattedValue: string;
}

const HISTORICAL_SERIES: HistoricalChartPoint[] = [
  {
    id: 'sec-vi-ac',
    u: 0,
    revealStep: 0,
    targetStep: 0,
    isMilestone: true,
    yearLabel: 'VI a.C.',
    value: 0,
    formattedValue: '~0',
  },
  {
    id: '1768',
    u: 90,
    revealStep: 1,
    targetStep: 1,
    isMilestone: true,
    yearLabel: '1768',
    value: 0,
    formattedValue: '~0',
  },
  {
    id: '1846',
    u: 180,
    revealStep: 2,
    targetStep: 2,
    isMilestone: true,
    yearLabel: '1846',
    value: 0,
    formattedValue: '~0',
  },
  {
    id: '1951',
    u: 270,
    revealStep: 3,
    targetStep: 3,
    isMilestone: false,
    yearLabel: '1951',
    value: 0,
    formattedValue: '0',
  },
  {
    id: '1961',
    u: 350,
    revealStep: 3,
    targetStep: 3,
    isMilestone: false,
    yearLabel: '1961',
    value: 458,
    formattedValue: '458',
  },
  {
    id: '1971',
    u: 430,
    revealStep: 3,
    targetStep: 3,
    isMilestone: false,
    yearLabel: '1971',
    value: 2541,
    formattedValue: '2.541',
  },
  {
    id: '1981',
    u: 510,
    revealStep: 3,
    targetStep: 3,
    isMilestone: true,
    yearLabel: '1981',
    value: 3891,
    formattedValue: '3.891',
  },
  {
    id: '1991',
    u: 590,
    revealStep: 4,
    targetStep: 4,
    isMilestone: false,
    yearLabel: '1991',
    value: 31280,
    formattedValue: '31.280',
  },
  {
    id: '2001',
    u: 670,
    revealStep: 4,
    targetStep: 4,
    isMilestone: true,
    yearLabel: '2001',
    value: 101976,
    formattedValue: '101.976',
  },
  {
    id: '2011',
    u: 750,
    revealStep: 5,
    targetStep: 5,
    isMilestone: true,
    yearLabel: '2011',
    value: 375699,
    formattedValue: '375.699',
  },
  {
    id: '2021',
    u: 830,
    revealStep: 6,
    targetStep: 6,
    isMilestone: true,
    yearLabel: '2021',
    value: 512313,
    formattedValue: '512.313',
  },
  {
    id: '2026',
    u: 874,
    revealStep: 7,
    targetStep: 7,
    isMilestone: true,
    yearLabel: '2026',
    value: 1250000,
    rangeMin: 1000000,
    rangeMax: 1500000,
    formattedValue: '1,0M–1,5M+',
  },
];

const AXIS_BREAK_U_POSITIONS = [45, 135, 225];

interface CameraTarget {
  uStart: number;
  uEnd: number;
  yMax: number;
  cursorU: number;
}

/**
 * Keyframes de câmera por etapa:
 * - Etapas 0 a 2: Lente aproximada nos séculos iniciais, abrindo gradualmente para a direita.
 * - Etapas 3 a 6: Lente desliza (pan) e ajusta a abertura vertical (zoom) acompanhando
 *   de perto cada década dos Censos Oficiais (1951–2021).
 * - Etapa 7: Zoom-out panorâmico revelando os 2.600 anos completos e o salto exponencial até 1,5M+
 *   (com opção interativa de focar apenas a era recente 1981–2026).
 */
const STEP_CAMERA_TARGETS: Record<TimelineStep, CameraTarget> = {
  0: { uStart: -32, uEnd: 118, yMax: 100, cursorU: 0 },
  1: { uStart: -28, uEnd: 205, yMax: 100, cursorU: 90 },
  2: { uStart: -24, uEnd: 295, yMax: 100, cursorU: 180 },
  3: { uStart: 155, uEnd: 558, yMax: 4400, cursorU: 510 },
  4: { uStart: 242, uEnd: 718, yMax: 115000, cursorU: 670 },
  5: { uStart: 322, uEnd: 798, yMax: 420000, cursorU: 750 },
  6: { uStart: 402, uEnd: 874, yMax: 600000, cursorU: 830 },
  7: { uStart: -30, uEnd: 912, yMax: 1580000, cursorU: 874 },
};

/**
 * Famílias canônicas de grade Y que deslizam verticalmente em tempo real durante o zoom
 * e fazem crossfade suave em espaço logarítmico (sem saltos nem sobreposições).
 */
interface YTickFamily {
  anchorMax: number;
  ticks: Array<{ val: number; label: string }>;
}

const Y_TICK_FAMILIES: YTickFamily[] = [
  {
    anchorMax: 4400,
    ticks: [
      { val: 2000, label: '2 mil' },
      { val: 4000, label: '4 mil' },
    ],
  },
  {
    anchorMax: 22000,
    ticks: [
      { val: 10000, label: '10 mil' },
      { val: 20000, label: '20 mil' },
    ],
  },
  {
    anchorMax: 115000,
    ticks: [
      { val: 50000, label: '50 mil' },
      { val: 100000, label: '100 mil' },
    ],
  },
  {
    anchorMax: 500000,
    ticks: [
      { val: 200000, label: '200 mil' },
      { val: 400000, label: '400 mil' },
      { val: 600000, label: '600 mil' },
    ],
  },
  {
    anchorMax: 1580000,
    ticks: [
      { val: 500000, label: '500 mil' },
      { val: 1000000, label: '1,0M' },
      { val: 1500000, label: '1,5M' },
    ],
  },
];

function uToScreenX(u: number, uStart: number, uEnd: number): number {
  const span = Math.max(1, uEnd - uStart);
  return CHART_PLOT.xLeft + ((u - uStart) / span) * CHART_PLOT.plotWidth;
}

function valueToScreenY(value: number, yMax: number): number {
  if (yMax <= 0 || value <= 0) return CHART_PLOT.yBase;
  const ratio = value / yMax;
  return CHART_PLOT.yBase - ratio * CHART_PLOT.plotHeight;
}

function easeOutQuinticSmooth(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  // Suave aceleração inicial + desaceleração cinematográfica longa (estilo lente de câmera)
  return clamped < 0.25
    ? 2.2 * clamped * clamped * (2.5 - 2 * clamped)
    : 1 - Math.pow(1 - clamped, 3.8);
}

function interpolateValueAtCursor(cursorU: number): { u: number; value: number } {
  if (cursorU <= HISTORICAL_SERIES[0].u) {
    return { u: HISTORICAL_SERIES[0].u, value: HISTORICAL_SERIES[0].value };
  }
  const last = HISTORICAL_SERIES[HISTORICAL_SERIES.length - 1];
  if (cursorU >= last.u) {
    return { u: last.u, value: last.value };
  }
  for (let i = 0; i < HISTORICAL_SERIES.length - 1; i++) {
    const a = HISTORICAL_SERIES[i];
    const b = HISTORICAL_SERIES[i + 1];
    if (cursorU >= a.u && cursorU <= b.u) {
      const span = Math.max(0.0001, b.u - a.u);
      const localT = (cursorU - a.u) / span;
      return {
        u: cursorU,
        value: a.value + (b.value - a.value) * localT,
      };
    }
  }
  return { u: last.u, value: last.value };
}

function formatLiveCount(val: number, cursorU: number): string {
  if (cursorU >= 862) {
    return '1,0M a 1,5M+';
  }
  const rounded = Math.round(val);
  if (rounded <= 0) return '~0 cristãos';
  return `${rounded.toLocaleString('pt-BR')} cristãos`;
}

interface AnimatedCameraState {
  uStart: number;
  uEnd: number;
  logYMax: number;
  cursorU: number;
}

/**
 * Hook de câmera contínua a 60fps:
 * Interpola simultaneamente a janela de datas [uStart, uEnd], a abertura logarítmica de escala Y
 * (evitando o achatamento abrupto em saltos exponenciais) e o cursor progressivo da linha.
 */
function useSmoothZoomCamera(target: CameraTarget): AnimatedCameraState & { isAnimating: boolean } {
  const initialState: AnimatedCameraState = {
    uStart: target.uStart,
    uEnd: target.uEnd,
    logYMax: Math.log(Math.max(10, target.yMax)),
    cursorU: target.cursorU,
  };

  const [cam, setCam] = useState<AnimatedCameraState>(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentRef = useRef<AnimatedCameraState>(initialState);

  useEffect(() => {
    const targetLogY = Math.log(Math.max(10, target.yMax));
    const from = { ...currentRef.current };

    const deltaU =
      Math.abs(target.uStart - from.uStart) +
      Math.abs(target.uEnd - from.uEnd) +
      Math.abs(target.cursorU - from.cursorU);
    const deltaLogY = Math.abs(targetLogY - from.logYMax);

    if (deltaU < 0.25 && deltaLogY < 0.005) {
      const snapped: AnimatedCameraState = {
        uStart: target.uStart,
        uEnd: target.uEnd,
        logYMax: targetLogY,
        cursorU: target.cursorU,
      };
      currentRef.current = snapped;
      setCam(snapped);
      setIsAnimating(false);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const snapped: AnimatedCameraState = {
        uStart: target.uStart,
        uEnd: target.uEnd,
        logYMax: targetLogY,
        cursorU: target.cursorU,
      };
      currentRef.current = snapped;
      setCam(snapped);
      setIsAnimating(false);
      return;
    }

    // Duração proporcional à amplitude do zoom (1.08s para avanço contíguo, até 1.38s para zoom-out panorâmico)
    const durationMs = Math.min(1420, Math.max(1050, 960 + deltaU * 0.42 + deltaLogY * 75));
    let rafId = 0;
    const startTime = performance.now();
    setIsAnimating(true);

    const tick = (now: number) => {
      const rawT = Math.min(1, (now - startTime) / durationMs);
      const e = easeOutQuinticSmooth(rawT);

      // A câmera começa a abrir levemente junto com o avanço do cursor para manter o topo da linha sempre visível
      const cursorEase = Math.min(1, Math.max(0, 1 - Math.pow(1 - rawT, 3.2)));

      const nextState: AnimatedCameraState = {
        uStart: from.uStart + (target.uStart - from.uStart) * e,
        uEnd: from.uEnd + (target.uEnd - from.uEnd) * e,
        logYMax: from.logYMax + (targetLogY - from.logYMax) * e,
        cursorU: from.cursorU + (target.cursorU - from.cursorU) * cursorEase,
      };

      currentRef.current = nextState;
      setCam(nextState);

      if (rawT < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [target.uStart, target.uEnd, target.yMax, target.cursorU]);

  return { ...cam, isAnimating };
}

/**
 * Posições dinâmicas das manchas de cor de fundo por etapa
 */
const BG_COLOR_SHIFTS: Array<{
  navyX: number;
  navyY: number;
  navyScale: number;
  crimsonX: number;
  crimsonY: number;
  crimsonScale: number;
  accentX: number;
  accentY: number;
}> = [
  { navyX: 140, navyY: 300, navyScale: 1.05, crimsonX: 1320, crimsonY: 540, crimsonScale: 1.0, accentX: 820, accentY: 360 },
  { navyX: 380, navyY: 460, navyScale: 1.15, crimsonX: 1420, crimsonY: 360, crimsonScale: 1.12, accentX: 980, accentY: 620 },
  { navyX: 220, navyY: 560, navyScale: 1.08, crimsonX: 1260, crimsonY: 480, crimsonScale: 1.18, accentX: 740, accentY: 320 },
  { navyX: 180, navyY: 340, navyScale: 1.18, crimsonX: 1360, crimsonY: 620, crimsonScale: 1.1, accentX: 1020, accentY: 420 },
  { navyX: 460, navyY: 520, navyScale: 1.05, crimsonX: 1280, crimsonY: 380, crimsonScale: 1.24, accentX: 780, accentY: 640 },
  { navyX: 260, navyY: 380, navyScale: 1.22, crimsonX: 1440, crimsonY: 520, crimsonScale: 1.08, accentX: 920, accentY: 340 },
  { navyX: 340, navyY: 580, navyScale: 1.1, crimsonX: 1300, crimsonY: 420, crimsonScale: 1.22, accentX: 680, accentY: 480 },
  { navyX: 200, navyY: 420, navyScale: 1.25, crimsonX: 1380, crimsonY: 580, crimsonScale: 1.16, accentX: 880, accentY: 520 },
];

const DynamicHistoricalBackgroundArt: React.FC<{ activeStep: TimelineStep }> = ({
  activeStep,
}) => {
  const colorShift = BG_COLOR_SHIFTS[activeStep] ?? BG_COLOR_SHIFTS[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        animate={{
          x: [colorShift.navyX, colorShift.navyX + 75, colorShift.navyX - 45, colorShift.navyX],
          y: [colorShift.navyY, colorShift.navyY - 55, colorShift.navyY + 40, colorShift.navyY],
          scale: [colorShift.navyScale, colorShift.navyScale * 1.14, colorShift.navyScale * 0.94, colorShift.navyScale],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-[480px] h-[480px] rounded-full bg-[#003893]/14 blur-[85px]"
      />

      <motion.div
        animate={{
          x: [colorShift.crimsonX, colorShift.crimsonX - 80, colorShift.crimsonX + 55, colorShift.crimsonX],
          y: [colorShift.crimsonY, colorShift.crimsonY + 60, colorShift.crimsonY - 45, colorShift.crimsonY],
          scale: [colorShift.crimsonScale, colorShift.crimsonScale * 1.16, colorShift.crimsonScale * 0.92, colorShift.crimsonScale],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-[440px] h-[440px] rounded-full bg-[#dc143c]/14 blur-[80px]"
      />

      <motion.div
        animate={{
          x: [colorShift.accentX, colorShift.accentX + 60, colorShift.accentX - 50, colorShift.accentX],
          y: [colorShift.accentY, colorShift.accentY - 45, colorShift.accentY + 50, colorShift.accentY],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#dc143c]/12 to-[#003893]/10 blur-2xl"
      />

      {/* Crossfade contínuo (mode="sync") sem piscar o fundo entre marcos */}
      <AnimatePresence mode="sync">
        <motion.svg
          key={`bg-art-step-${activeStep}`}
          viewBox="0 0 1920 1080"
          className="absolute inset-0 w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeStep === 0 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                style={{ transformOrigin: '1460px 540px' }}
                animate={{ rotate: [0, 360], y: [0, -18, 12, 0] }}
                transition={{
                  rotate: { duration: 48, repeat: Infinity, ease: 'linear' },
                  y: { duration: 7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                }}
              >
                <circle cx="1460" cy="540" r="240" stroke="#003893" strokeOpacity="0.18" strokeWidth="3" />
                <circle
                  cx="1460"
                  cy="540"
                  r="195"
                  stroke="#08254c"
                  strokeOpacity="0.13"
                  strokeWidth="1.8"
                  strokeDasharray="10 8"
                />
                <circle cx="1460" cy="540" r="42" stroke="#dc143c" strokeOpacity="0.22" strokeWidth="2.8" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                  <line
                    key={ang}
                    x1="1460"
                    y1="300"
                    x2="1460"
                    y2="780"
                    stroke="#003893"
                    strokeOpacity="0.16"
                    strokeWidth="2"
                    transform={`rotate(${ang} 1460 540)`}
                  />
                ))}
              </motion.g>
              <motion.g
                animate={{ x: [0, 22, -14, 0], y: [0, -16, 12, 0] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 210 830 C 130 830, 95 775, 135 725 C 165 690, 205 670, 240 595 C 205 580, 195 535, 225 500 C 245 480, 255 455, 280 455 C 305 455, 315 480, 335 500 C 365 535, 355 580, 320 595 C 355 670, 395 690, 425 725 C 465 775, 420 830, 340 830 Z"
                  stroke="#08254c"
                  strokeOpacity="0.18"
                  strokeWidth="3"
                />
                <path
                  d="M 560 790 L 760 470 L 890 610 L 1060 360 L 1240 790"
                  stroke="#003893"
                  strokeOpacity="0.14"
                  strokeWidth="2.8"
                />
              </motion.g>
            </g>
          )}

          {activeStep === 1 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                animate={{ x: [0, 28, -18, 0], y: [0, -16, 14, 0] }}
                transition={{ duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <g transform="translate(680, 560) scale(28)">
                  <path
                    d={GEO_PATHS.nepalCentered}
                    stroke="#003893"
                    strokeOpacity="0.20"
                    strokeWidth="0.14"
                    fill="#003893"
                    fillOpacity="0.04"
                  />
                </g>
              </motion.g>
              <motion.g
                style={{ transformOrigin: '1490px 510px' }}
                animate={{ rotate: [-3, 3.5, -3], y: [0, -18, 10, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M 1340 700 L 1640 330 M 1640 700 L 1340 330" stroke="#dc143c" strokeOpacity="0.22" strokeWidth="3.5" />
                <circle cx="1490" cy="515" r="145" stroke="#08254c" strokeOpacity="0.15" strokeWidth="2.4" strokeDasharray="12 8" />
              </motion.g>
            </g>
          )}

          {activeStep === 2 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                style={{ transformOrigin: '1480px 520px' }}
                animate={{ rotate: [-2.5, 2.5, -2.5], x: [0, -22, 16, 0], y: [0, -18, 14, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 1290 700 L 1365 610 C 1430 520, 1545 405, 1705 335 C 1650 460, 1550 560, 1405 645 L 1325 725 Z"
                  stroke="#003893"
                  strokeOpacity="0.20"
                  strokeWidth="3.4"
                />
                <path
                  d="M 1715 700 L 1640 610 C 1575 520, 1460 405, 1300 335 C 1355 460, 1455 560, 1600 645 L 1680 725 Z"
                  stroke="#dc143c"
                  strokeOpacity="0.20"
                  strokeWidth="3.4"
                />
              </motion.g>
              <motion.g
                animate={{ x: [0, 24, -16, 0], y: [0, 15, -15, 0] }}
                transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M 160 760 L 380 420 L 540 610 L 760 340 L 1010 760" stroke="#08254c" strokeOpacity="0.15" strokeWidth="3" />
              </motion.g>
            </g>
          )}

          {activeStep === 3 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                animate={{ x: [0, 20, -12, 0], y: [0, -16, 12, 0] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 140 780 L 140 350 L 310 290 L 310 720 Z M 510 780 L 510 350 L 340 290 L 340 720 Z"
                  stroke="#003893"
                  strokeOpacity="0.20"
                  strokeWidth="3.2"
                />
              </motion.g>
              <motion.g
                animate={{ x: [0, -26, 18, 0], y: [0, -20, 14, 0] }}
                transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 1020 760 L 1220 480 L 1315 555 L 1485 280 L 1620 485 L 1720 370 L 1860 760"
                  stroke="#08254c"
                  strokeOpacity="0.20"
                  strokeWidth="3.6"
                />
                <path d="M 1485 600 L 1485 735 M 1445 642 L 1525 642" stroke="#dc143c" strokeOpacity="0.25" strokeWidth="3.8" />
              </motion.g>
            </g>
          )}

          {activeStep === 4 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                transform="translate(1480, 500)"
                animate={{ rotate: [14, 22, 12, 14], y: [0, 22, -14, 0], x: [0, -18, 14, 0] }}
                transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M -185 85 L -160 -45 L -75 22 L 0 -108 L 75 22 L 160 -45 L 185 85 Z M -195 118 L 195 118"
                  stroke="#dc143c"
                  strokeOpacity="0.22"
                  strokeWidth="3.6"
                />
                <path d="M -16 -130 L 22 -22 L -26 38 L 16 145" stroke="#08254c" strokeOpacity="0.22" strokeWidth="4" />
              </motion.g>
              <motion.g
                animate={{ x: [0, 25, -15, 0], y: [0, -18, 12, 0] }}
                transition={{ duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M 220 770 L 420 470 L 585 615 L 820 330 L 1060 770" stroke="#003893" strokeOpacity="0.16" strokeWidth="3.2" />
              </motion.g>
            </g>
          )}

          {activeStep === 5 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                style={{ transformOrigin: '1480px 410px' }}
                animate={{ rotate: [0, 360], scale: [1, 1.06, 1] }}
                transition={{
                  rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                }}
              >
                <circle cx="1480" cy="410" r="145" stroke="#dc143c" strokeOpacity="0.22" strokeWidth="3.2" strokeDasharray="10 10" />
              </motion.g>
              <motion.g
                animate={{ x: [0, -24, 18, 0], y: [0, -18, 14, 0] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 1060 760 L 1280 450 L 1370 530 L 1505 280 L 1635 480 L 1730 390 L 1870 760"
                  stroke="#003893"
                  strokeOpacity="0.20"
                  strokeWidth="3.6"
                />
              </motion.g>
              <motion.g
                animate={{ y: [0, -22, 12, 0], x: [0, 16, -12, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M 290 330 L 290 660 M 205 425 L 375 425" stroke="#dc143c" strokeOpacity="0.22" strokeWidth="4" />
              </motion.g>
            </g>
          )}

          {activeStep === 6 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                style={{ transformOrigin: '1490px 240px' }}
                animate={{ rotate: [-4.5, 4.5, -4.5], y: [0, 14, -8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path
                  d="M 1490 240 L 1490 395 M 1490 395 L 1395 455 M 1490 395 L 1585 455"
                  stroke="#08254c"
                  strokeOpacity="0.22"
                  strokeWidth="3.8"
                />
                <circle cx="1370" cy="540" r="82" stroke="#dc143c" strokeOpacity="0.23" strokeWidth="4.2" />
                <circle cx="1370" cy="540" r="56" stroke="#08254c" strokeOpacity="0.18" strokeWidth="2.4" />
                <circle cx="1610" cy="540" r="82" stroke="#dc143c" strokeOpacity="0.23" strokeWidth="4.2" />
                <circle cx="1610" cy="540" r="56" stroke="#08254c" strokeOpacity="0.18" strokeWidth="2.4" />
              </motion.g>
              <motion.g
                animate={{ x: [0, 26, -18, 0], y: [0, -16, 14, 0] }}
                transition={{ duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path d="M 180 760 L 410 430 L 590 610 L 830 340 L 1080 760" stroke="#003893" strokeOpacity="0.16" strokeWidth="3.2" />
              </motion.g>
            </g>
          )}

          {activeStep === 7 && (
            <g strokeLinecap="round" strokeLinejoin="round">
              <motion.g
                animate={{ x: [-35, 35, -35], y: [0, -16, 12, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <path
                  d="M 60 660 C 260 555, 420 755, 620 635 C 820 515, 1020 735, 1240 615 C 1460 495, 1660 715, 1880 595"
                  stroke="#003893"
                  strokeOpacity="0.22"
                  strokeWidth="4"
                />
                <path
                  d="M 60 730 C 290 625, 460 795, 670 685 C 880 575, 1080 775, 1300 665 C 1520 555, 1700 755, 1880 655"
                  stroke="#08254c"
                  strokeOpacity="0.18"
                  strokeWidth="3.2"
                />
              </motion.g>
              <motion.g
                animate={{ scale: [1, 1.07, 0.96, 1], y: [0, -18, 12, 0] }}
                transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <circle cx="1490" cy="430" r="130" stroke="#dc143c" strokeOpacity="0.23" strokeWidth="3.5" />
                <path d="M 1490 345 L 1490 515 M 1420 415 L 1560 415" stroke="#dc143c" strokeOpacity="0.26" strokeWidth="4.5" />
              </motion.g>
            </g>
          )}
        </motion.svg>
      </AnimatePresence>
    </div>
  );
};

export const Slide03TimelineContent: React.FC = () => {
  const { step, placeholder } = useSteps(7);
  const [manualStep, setManualStep] = useState<TimelineStep | null>(null);
  const [localLensOverride, setLocalLensOverride] = useState<'auto' | 'panorama' | 'era'>('auto');
  const [hoveredYearId, setHoveredYearId] = useState<string | null>(null);
  const [primaryImgFailed, setPrimaryImgFailed] = useState<Record<number, boolean>>({});
  const [secondaryImgFailed, setSecondaryImgFailed] = useState<Record<number, boolean>>({});
  const prevStepRef = useRef<TimelineStep>(0);
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();

  useEffect(() => {
    setManualStep(null);
  }, [step]);

  const safeSpectacleStep =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(7, Math.round(step + 1)))
      : 0;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? (Math.max(0, Math.min(7, stageInstance.forcedSubStep)) as TimelineStep)
      : broadcast && broadcast.mode !== 'standalone' && broadcast.roomState.slideIndex === 7
      ? (Math.max(0, Math.min(7, broadcast.roomState.subStep)) as TimelineStep)
      : null;

  const activeStep: TimelineStep =
    syncedSubStep !== null
      ? syncedSubStep
      : manualStep !== null
      ? manualStep
      : (safeSpectacleStep as TimelineStep);

  const lensOverride: 'auto' | 'panorama' | 'era' =
    broadcast && broadcast.mode !== 'standalone' && !stageInstance.isPreview
      ? broadcast.roomState.slideCustomState.timelineLens
      : localLensOverride;

  const setLensOverride = (
    updater:
      | ('auto' | 'panorama' | 'era')
      | ((prev: 'auto' | 'panorama' | 'era') => 'auto' | 'panorama' | 'era')
  ) => {
    const resolved = typeof updater === 'function' ? updater(lensOverride) : updater;
    setLocalLensOverride(resolved);
    if (broadcast && broadcast.mode !== 'standalone' && !stageInstance.isPreview) {
      broadcast.updateSlideCustomState({ timelineLens: resolved });
    }
  };

  const stepDirection = activeStep >= prevStepRef.current ? 1 : -1;
  useEffect(() => {
    prevStepRef.current = activeStep;
    setLocalLensOverride('auto');
    if (broadcast && broadcast.mode === 'presenter' && !stageInstance.isPreview) {
      broadcast.updateSlideCustomState({ timelineLens: 'auto' });
    }
    setHoveredYearId(null);
  }, [activeStep]);

  const currentData = TIMELINE_DATA[activeStep] ?? TIMELINE_DATA[0];

  const handleAdvanceStep = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (activeStep < 7) {
      setManualStep((activeStep + 1) as TimelineStep);
    } else {
      setManualStep(0);
    }
  };

  // Alvo da lente de câmera combinando progressão automática + alternância opcional de zoom/panorama
  const cameraTarget = useMemo<CameraTarget>(() => {
    const base = STEP_CAMERA_TARGETS[activeStep];
    if (lensOverride === 'panorama') {
      return {
        uStart: CHART_PLOT.fullMinU,
        uEnd: Math.max(295, base.cursorU + 42),
        yMax: base.yMax,
        cursorU: base.cursorU,
      };
    }
    if (lensOverride === 'era' && activeStep === 7) {
      return {
        uStart: 480,
        uEnd: 912,
        yMax: 1580000,
        cursorU: 874,
      };
    }
    return base;
  }, [activeStep, lensOverride]);

  const { uStart, uEnd, logYMax, cursorU } = useSmoothZoomCamera(cameraTarget);
  const camYMax = Math.exp(logYMax);

  // =========================================================================
  // GEOMETRIA CONTÍNUA DA CURVA E DO TOPO EM PROGRESSÃO (60 FPS)
  // =========================================================================
  const leadingTip = interpolateValueAtCursor(cursorU);
  const tipX = uToScreenX(leadingTip.u, uStart, uEnd);
  const tipY = valueToScreenY(leadingTip.value, camYMax);

  const visibleTrailPoints = HISTORICAL_SERIES.filter((pt) => pt.u <= cursorU + 0.05);
  const pathVertices = [
    ...visibleTrailPoints.map((pt) => ({
      x: uToScreenX(pt.u, uStart, uEnd),
      y: valueToScreenY(pt.value, camYMax),
    })),
  ];

  // Adiciona o vértice vivo da ponta da linha enquanto ela avança entre duas datas
  if (
    pathVertices.length === 0 ||
    Math.abs(pathVertices[pathVertices.length - 1].x - tipX) > 0.3 ||
    Math.abs(pathVertices[pathVertices.length - 1].y - tipY) > 0.3
  ) {
    pathVertices.push({ x: tipX, y: tipY });
  }

  const chartLinePath =
    pathVertices.length > 0
      ? pathVertices
          .map((v, idx) => `${idx === 0 ? 'M' : 'L'} ${v.x.toFixed(2)},${v.y.toFixed(2)}`)
          .join(' ')
      : '';

  const chartAreaPath =
    pathVertices.length > 1
      ? `M ${pathVertices[0].x.toFixed(2)},${CHART_PLOT.yBase} ` +
        pathVertices.map((v) => `L ${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ') +
        ` L ${pathVertices[pathVertices.length - 1].x.toFixed(2)},${CHART_PLOT.yBase} Z`
      : '';

  // Cone de faixa estimada (1,0M a 1,5M+) que emerge suavemente ao chegar em 2026 (u: 830 -> 874)
  const pt2021 = HISTORICAL_SERIES.find((p) => p.id === '2021')!;
  const pt2026 = HISTORICAL_SERIES.find((p) => p.id === '2026')!;
  const coneProgress = Math.min(1, Math.max(0, (cursorU - pt2021.u) / (pt2026.u - pt2021.u)));

  const x2021 = uToScreenX(pt2021.u, uStart, uEnd);
  const y2021 = valueToScreenY(pt2021.value, camYMax);
  const coneTipU = pt2021.u + (pt2026.u - pt2021.u) * coneProgress;
  const coneTipX = uToScreenX(coneTipU, uStart, uEnd);
  const coneMinVal = pt2021.value + ((pt2026.rangeMin ?? 1000000) - pt2021.value) * coneProgress;
  const coneMaxVal = pt2021.value + ((pt2026.rangeMax ?? 1500000) - pt2021.value) * coneProgress;
  const coneTipYMin = valueToScreenY(coneMinVal, camYMax);
  const coneTipYMax = valueToScreenY(coneMaxVal, camYMax);

  const estimateConePath =
    coneProgress > 0.02
      ? `M ${x2021.toFixed(2)},${y2021.toFixed(2)} L ${coneTipX.toFixed(2)},${coneTipYMax.toFixed(2)} L ${coneTipX.toFixed(2)},${coneTipYMin.toFixed(2)} Z`
      : null;

  // Escala de densidade horizontal (px por unidade u) para zoom semântico de rótulos
  const pxPerU = CHART_PLOT.plotWidth / Math.max(1, uEnd - uStart);
  const isZoomedInOnEra = uEnd - uStart < 650;

  // Ponto ativo final do marco atual
  const reachedSeries = HISTORICAL_SERIES.filter((pt) => pt.revealStep <= activeStep);
  const restingActivePoint = reachedSeries[reachedSeries.length - 1] ?? HISTORICAL_SERIES[0];
  const highlightedPoint = hoveredYearId
    ? HISTORICAL_SERIES.find((p) => p.id === hoveredYearId) ?? restingActivePoint
    : restingActivePoint;

  // Geometria da barra minimapa da lente de câmera na base do gráfico
  const fullSpanU = CHART_PLOT.fullMaxU - CHART_PLOT.fullMinU;
  const lensBarLeft =
    CHART_PLOT.xLeft +
    Math.max(0, (uStart - CHART_PLOT.fullMinU) / fullSpanU) * CHART_PLOT.plotWidth;
  const lensBarRight =
    CHART_PLOT.xLeft +
    Math.min(1, (uEnd - CHART_PLOT.fullMinU) / fullSpanU) * CHART_PLOT.plotWidth;
  const lensBarWidth = Math.max(24, lensBarRight - lensBarLeft);

  const hasFourRowTable = (currentData.censusTable?.length ?? 0) > 2;

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-03-timeline" className="bg-[#f4f2eb]">
        <div
          onClick={handleAdvanceStep}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA DE CORES E GRAFISMOS EM MOVIMENTO NO BACKGROUND
             =================================================================== */}
          <DynamicHistoricalBackgroundArt activeStep={activeStep} />

          {/* ===================================================================
              2. CABEÇALHO EDITORIAL EQUILIBRADO (2 ZONAS COM TRANSIÇÃO SUAVE)
             =================================================================== */}
          <div className="pointer-events-none absolute top-[34px] left-[68px] right-[68px] z-30 flex items-end justify-between gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <MorphElement layoutId="hero-main-title">
                  <span className="font-display text-[21px] font-black uppercase tracking-[0.24em] text-[#003893]">
                    MISSÃO NEPAL
                  </span>
                </MorphElement>
                <span className="text-[#0f0f0f]/30" aria-hidden="true">
                  ·
                </span>
                <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.18em] text-[#08254c]/75">
                  História &amp; Avanço do Cristianismo
                </span>
              </div>

              <div className="relative h-[50px] flex items-baseline overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`timeline-header-${activeStep}`}
                    initial={{ opacity: 0, y: stepDirection * 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -stepDirection * 18 }}
                    transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-baseline gap-4 whitespace-nowrap"
                  >
                    <span className="font-display text-[42px] font-black uppercase tracking-tight text-[#dc143c] leading-none">
                      {currentData.period}
                    </span>
                    <span className="text-[#08254c]/25 font-light text-[34px] leading-none" aria-hidden="true">
                      /
                    </span>
                    <h2 className="font-display text-[35px] font-extrabold uppercase tracking-[-0.02em] text-[#080d1a] leading-none">
                      {currentData.title}
                    </h2>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Indicador Editorial de Marco & População no Topo Direito */}
            <div className="shrink-0 text-right pb-0.5">
              <div className="font-sans text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#08254c]/65 tabular-nums">
                Marco Histórico {String(activeStep + 1).padStart(2, '0')} / 08
              </div>
              <div className="font-mono text-[20px] font-extrabold text-[#dc143c] tabular-nums mt-0.5 leading-none">
                {formatLiveCount(leadingTip.value, cursorU)}
              </div>
            </div>
          </div>

          {/* ===================================================================
              3. RÉGUA HORIZONTAL INTERATIVA DOS 8 MARCOS
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-[132px] left-[68px] right-[68px] z-40 px-2 py-2.5"
          >
            {/* Trilha Horizontal Contínua */}
            <div className="relative mx-[56px] h-[3.5px] bg-[#08254c]/16 rounded-full">
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#003893] via-[#003893] to-[#dc143c]"
                initial={false}
                animate={{
                  width: `${(activeStep / 7) * 100}%`,
                }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Nós Clicáveis da Linha do Tempo */}
            <div className="relative -mt-[16px] flex items-start justify-between">
              {TIMELINE_DATA.map((item, idx) => {
                const isCurrent = idx === activeStep;
                const isReached = idx <= activeStep;

                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setManualStep(item.step)}
                    className="group flex flex-col items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003893] rounded-lg min-w-[112px]"
                  >
                    <div className="relative flex items-center justify-center w-[30px] h-[30px]">
                      {isCurrent && (
                        <motion.div
                          layoutId="timeline-active-ring"
                          className="absolute inset-0 rounded-full bg-[#dc143c]/18 border-2 border-[#dc143c]"
                          transition={{
                            type: 'spring',
                            stiffness: 120,
                            damping: 20,
                          }}
                        />
                      )}
                      <div
                        className={`relative z-10 w-[14px] h-[14px] rounded-full transition-all duration-300 border-2 ${
                          isCurrent
                            ? 'bg-[#dc143c] border-white scale-125'
                            : isReached
                            ? 'bg-[#003893] border-white'
                            : 'bg-[#f4f2eb] border-[#08254c]/35 group-hover:border-[#003893]'
                        }`}
                      />
                    </div>

                    <span
                      className={`mt-1 font-display text-[14.5px] uppercase tracking-wider transition-colors whitespace-nowrap ${
                        isCurrent
                          ? 'font-black text-[#dc143c]'
                          : isReached
                          ? 'font-bold text-[#08254c]'
                          : 'font-semibold text-[#08254c]/45 group-hover:text-[#08254c]/75'
                      }`}
                    >
                      {item.shortLabel}
                    </span>

                    <div className="h-[19px] mt-0.5 flex items-center justify-center">
                      {isReached && (
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className={`font-mono text-[12.5px] tabular-nums whitespace-nowrap ${
                            isCurrent
                              ? 'font-extrabold text-[#003893]'
                              : 'font-semibold text-[#08254c]/65'
                          }`}
                        >
                          {item.chartValueLabel}
                        </motion.span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              4. GRADE PRINCIPAL REBALANCEADA (6 COLUNAS ESQUERDA · 6 COLUNAS DIREITA)
                 - Alinhamento horizontal intencional:
                   Topo Esquerdo (Narrativa Secular) ↔ Topo Direito (Acervo Fotográfico)
                   Base Esquerda (Censos & Igreja)   ↔ Base Direita (Gráfico com Zoom Dinâmico)
             =================================================================== */}
          <div className="pointer-events-none absolute top-[224px] left-[68px] right-[68px] bottom-[48px] z-30 grid grid-cols-12 gap-7 items-stretch">
            {/* -----------------------------------------------------------------
                COLUNA ESQUERDA (6 colunas · 878px x 808px):
                Narrativa Histórica + Presença Cristã + Tabela de Censos / Síntese
               ----------------------------------------------------------------- */}
            <div className="col-span-6 h-full">
              <LiquidGlassContainer
                intensity="medium"
                tint="light"
                disablePulse={true}
                className="px-9 py-7 h-full [&>div.relative]:h-full"
              >
                <div className="relative h-full overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={`left-narrative-${activeStep}`}
                      initial={{ opacity: 0, x: stepDirection * 22 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -stepDirection * 22 }}
                      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full flex flex-col justify-between"
                    >
                      {/* Bloco Superior: Narrativa Histórica com Medida Editorial Ideal */}
                      <div>
                        <div className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#08254c]/60 mb-2">
                          Contexto Político &amp; Social · {currentData.period}
                        </div>
                        <p
                          className={`font-sans font-medium text-[#0e1218] ${
                            hasFourRowTable
                              ? 'text-[19.5px] leading-[1.46]'
                              : currentData.censusTable
                              ? 'text-[21.5px] leading-[1.52]'
                              : 'text-[23.5px] leading-[1.56]'
                          }`}
                        >
                          {currentData.historyText}
                        </p>

                        {/* Divisor Hairline */}
                        <div
                          className={`${
                            hasFourRowTable ? 'my-3.5' : 'my-5'
                          } h-[1px] bg-[#08254c]/14`}
                        />

                        {/* Bloco Intermediário: Presença Cristã no Período */}
                        <div className="flex items-baseline justify-between gap-4 mb-2">
                          <span className="font-display text-[14px] font-extrabold uppercase tracking-[0.18em] text-[#003893]">
                            Presença Cristã no Período
                          </span>
                          <div className="flex items-baseline gap-2.5">
                            <span
                              className={`font-display font-black text-[#dc143c] leading-none tabular-nums ${
                                hasFourRowTable ? 'text-[33px]' : 'text-[38px]'
                              }`}
                            >
                              {currentData.christianMetricBadge}
                            </span>
                            {currentData.christianPercentBadge && (
                              <span className="font-mono text-[16px] font-bold text-[#003893] tabular-nums">
                                ({currentData.christianPercentBadge})
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          className={`font-sans font-medium text-[#1e232b] ${
                            hasFourRowTable
                              ? 'text-[16.5px] leading-snug mb-3'
                              : currentData.censusTable
                              ? 'text-[18px] leading-relaxed mb-4'
                              : 'text-[19.5px] leading-[1.55]'
                          }`}
                        >
                          {currentData.christianSummaryText}
                        </p>

                        {/* Tabela Oficial dos Censos (Etapas 1951 e 2001) com sincronia de hover no gráfico */}
                        {currentData.censusTable && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pointer-events-auto rounded-2xl overflow-hidden border border-[#08254c]/14 bg-white/46"
                          >
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#08254c]/14 bg-[#08254c]/[0.035] font-display text-[12px] font-extrabold uppercase tracking-wider text-[#08254c]/75">
                                  <th className="py-2 px-3.5 w-[74px]">Censo</th>
                                  <th className="py-2 px-3.5 w-[162px]">Cristãos</th>
                                  <th className="py-2 px-3.5">Panorama da Igreja</th>
                                </tr>
                              </thead>
                              <tbody
                                className={`divide-y divide-[#08254c]/10 font-sans ${
                                  hasFourRowTable ? 'text-[14.5px]' : 'text-[16.5px]'
                                }`}
                              >
                                {currentData.censusTable.map((row) => {
                                  const isRowHovered = hoveredYearId === row.year;
                                  return (
                                    <tr
                                      key={row.year}
                                      onMouseEnter={() => setHoveredYearId(row.year)}
                                      onMouseLeave={() => setHoveredYearId(null)}
                                      className={`transition-colors duration-150 ${
                                        isRowHovered ? 'bg-[#003893]/[0.07]' : 'hover:bg-white/55'
                                      }`}
                                    >
                                      <td
                                        className={`${
                                          hasFourRowTable ? 'py-2' : 'py-3'
                                        } px-3.5 font-mono text-[16px] font-extrabold text-[#003893] align-top tabular-nums`}
                                      >
                                        {row.year}
                                      </td>
                                      <td
                                        className={`${
                                          hasFourRowTable ? 'py-2' : 'py-3'
                                        } px-3.5 align-top tabular-nums`}
                                      >
                                        <span className="font-display font-black text-[#dc143c] block leading-tight">
                                          {row.count}
                                        </span>
                                        <span className="font-mono text-[12.5px] font-semibold text-[#08254c]/70">
                                          {row.percent}
                                        </span>
                                      </td>
                                      <td
                                        className={`${
                                          hasFourRowTable ? 'py-2' : 'py-3'
                                        } px-3.5 text-[#141820] leading-[1.38] align-top`}
                                      >
                                        {row.description}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Bloco Inferior: Síntese Estruturada nos Marcos sem Tabela + Rodapé Alinhado */}
                      <div>
                        {currentData.contextPillars && (
                          <div className="pt-5 pb-4 border-t border-[#08254c]/14 grid grid-cols-3 gap-5">
                            {currentData.contextPillars.map((pillar) => (
                              <div key={pillar.label} className="min-w-0">
                                <div className="font-sans text-[11.5px] font-bold uppercase tracking-[0.15em] text-[#003893] mb-1">
                                  {pillar.label}
                                </div>
                                <div className="font-sans text-[15.5px] font-semibold text-[#141820] leading-[1.38]">
                                  {pillar.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 border-t border-[#08254c]/12 flex items-center justify-between text-[12.5px] font-sans font-medium text-[#08254c]/60">
                          <span>Fontes: Censos Nacionais do Nepal (CBS) &amp; Registros Históricos</span>
                          <span className="font-mono font-bold text-[#08254c]/75 tabular-nums">
                            Marco {activeStep + 1}/8 · {currentData.period}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </LiquidGlassContainer>
            </div>

            {/* -----------------------------------------------------------------
                COLUNA DIREITA (6 colunas · 878px x 808px):
                - Topo (326px): Fotografia Histórica Documental (sem cortes nas obras verticais)
                - Base (454px): Gráfico Amplo com Lente de Zoom Dinâmico pelas Datas
               ----------------------------------------------------------------- */}
            <div className="col-span-6 h-full flex flex-col gap-6">
              {/* TOPO DIREITO: ACERVO FOTOGRÁFICO COM CROSSFADE SUAVE */}
              <LiquidGlassContainer
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="p-3 h-[326px] shrink-0 [&>div.relative]:h-full"
              >
                <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#dfd9c8]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={`archival-image-${activeStep}`}
                      initial={{ opacity: 0, scale: 1.045 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {!primaryImgFailed[activeStep] ? (
                        currentData.isPortraitArtwork ? (
                          /* Obras verticais de museu/gravura (Buda & Gurkhas): exibição integral sem decapitar */
                          <div className="relative w-full h-full flex items-stretch bg-[#181c24]">
                            <img
                              src={currentData.imagePrimary}
                              alt=""
                              aria-hidden="true"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-45"
                            />
                            <div className="relative z-10 w-[46%] h-full flex items-center justify-center p-3 bg-black/20">
                              <img
                                src={currentData.imagePrimary}
                                alt={currentData.imageCaption}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setPrimaryImgFailed((prev) => ({ ...prev, [activeStep]: true }))
                                }
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                              />
                            </div>
                            <div className="relative z-10 flex-1 flex flex-col justify-end p-6 bg-gradient-to-t from-[#061121]/90 via-[#061121]/55 to-[#061121]/30 text-white">
                              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1.5">
                                Acervo Iconográfico · {currentData.period}
                              </span>
                              <h4 className="font-display text-[21px] font-extrabold uppercase tracking-wide leading-tight">
                                {currentData.imageCaption}
                              </h4>
                              <p className="font-sans text-[14.5px] font-medium text-white/88 leading-relaxed mt-1.5">
                                {currentData.imageSubcaption}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Fotografias horizontais documentais */
                          <div className="relative w-full h-full">
                            <img
                              src={currentData.imagePrimary}
                              alt={currentData.imageCaption}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setPrimaryImgFailed((prev) => ({ ...prev, [activeStep]: true }))
                              }
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061121]/88 via-[#061121]/24 to-transparent" />

                            {currentData.imageSecondary && !secondaryImgFailed[activeStep] && (
                              <div className="absolute top-3.5 right-3.5 w-[132px] h-[132px] rounded-xl overflow-hidden border-2 border-white/90 shadow-xl bg-[#08254c]">
                                <img
                                  src={currentData.imageSecondary}
                                  alt={`Detalhe histórico de ${currentData.period}`}
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setSecondaryImgFailed((prev) => ({ ...prev, [activeStep]: true }))
                                  }
                                  className={`w-full h-full object-cover ${
                                    currentData.secondaryObjectTop ? 'object-top' : 'object-center'
                                  }`}
                                />
                              </div>
                            )}

                            <div className="absolute bottom-4 left-5 right-5 text-white">
                              <h4 className="font-display text-[20px] font-extrabold uppercase tracking-wide leading-tight drop-shadow-sm">
                                {currentData.imageCaption}
                              </h4>
                              <p className="font-sans text-[14.5px] font-medium text-white/90 leading-snug mt-0.5">
                                {currentData.imageSubcaption}
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        /* Fallback visual resiliente */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#08254c] to-[#003893] text-white p-6 text-center">
                          <span className="font-mono text-[13px] uppercase tracking-widest text-white/70 mb-1">
                            {currentData.period}
                          </span>
                          <h4 className="font-display text-[22px] font-black uppercase">
                            {currentData.imageCaption}
                          </h4>
                          <p className="font-sans text-[14px] text-white/85 mt-1 max-w-md">
                            {currentData.imageSubcaption}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </LiquidGlassContainer>

              {/* BASE DIREITA: GRÁFICO AMPLO COM DINÂMICA DE ZOOM PELAS DATAS */}
              <LiquidGlassContainer
                intensity="medium"
                tint="light"
                disablePulse={true}
                className="px-6 py-4 flex-1 min-h-0 [&>div.relative]:h-full"
              >
                <div className="h-full flex flex-col justify-between">
                  {/* Cabeçalho do Gráfico + Alternador Opcional de Lente */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#003893]">
                        <span>
                          {lensOverride === 'panorama'
                            ? 'Panorama Completo: Séc. VI a.C. – 2026'
                            : lensOverride === 'era' && activeStep === 7
                            ? 'Zoom Recente: 1981 – 2026'
                            : currentData.zoomWindowLabel}
                        </span>
                      </div>
                      <h3 className="font-display text-[21px] font-black uppercase tracking-tight text-[#080d1a] leading-tight mt-0.5">
                        Avanço do Cristianismo no Nepal
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeStep >= 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeStep === 7) {
                              setLensOverride((prev) => (prev === 'era' ? 'auto' : 'era'));
                            } else {
                              setLensOverride((prev) => (prev === 'panorama' ? 'auto' : 'panorama'));
                            }
                          }}
                          className="pointer-events-auto px-3 py-1 rounded-lg bg-[#08254c]/[0.07] hover:bg-[#08254c]/[0.14] text-[#08254c] font-sans text-[11.5px] font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {activeStep === 7
                            ? lensOverride === 'era'
                              ? 'Ver Panorama Completo'
                              : 'Focar 1981–2026'
                            : lensOverride === 'panorama'
                            ? 'Voltar ao Zoom da Época'
                            : 'Ver Panorama Geral'}
                        </button>
                      )}

                      <div className="text-right">
                        <span className="font-sans text-[11.5px] font-semibold text-[#08254c]/65 block leading-none">
                          {hoveredYearId
                            ? `Censo (${highlightedPoint.yearLabel})`
                            : `Marco (${currentData.period})`}
                        </span>
                        <span className="font-display text-[20px] font-black text-[#dc143c] tabular-nums leading-tight">
                          {hoveredYearId
                            ? highlightedPoint.formattedValue
                            : currentData.christianMetricBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Viewport Vetorial com Câmera 2D Contínua (X-Datas + Y-Escala) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto relative flex-1 min-h-0 mt-1 flex items-center"
                  >
                    <svg
                      viewBox={`0 0 ${CHART_PLOT.viewWidth} ${CHART_PLOT.viewHeight}`}
                      className="w-full h-full overflow-visible"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="zoom-christian-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc143c" stopOpacity="0.34" />
                          <stop offset="68%" stopColor="#003893" stopOpacity="0.11" />
                          <stop offset="100%" stopColor="#003893" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Recorte da janela óptica para que datas antigas saiam suavemente pela esquerda durante o pan */}
                        <clipPath id="zoom-plot-window">
                          <rect
                            x={CHART_PLOT.xLeft}
                            y={0}
                            width={CHART_PLOT.plotWidth + 24}
                            height={CHART_PLOT.yBase + 10}
                          />
                        </clipPath>
                      </defs>

                      {/* 1. Grade Horizontal Contínua (desliza fisicamente em Y conforme o zoom muda) */}
                      {camYMax > 180 &&
                        Y_TICK_FAMILIES.map((family) => {
                          const logDist = Math.abs(Math.log(camYMax / family.anchorMax));
                          if (logDist >= 0.88) return null;
                          const familyWeight = Math.pow(
                            Math.cos((logDist / 0.88) * (Math.PI / 2)),
                            2
                          );

                          return family.ticks.map((tick) => {
                            const tickY = valueToScreenY(tick.val, camYMax);
                            if (tickY < CHART_PLOT.yTop - 16 || tickY > CHART_PLOT.yBase - 8) {
                              return null;
                            }
                            const topFade = Math.min(1, Math.max(0, (tickY - (CHART_PLOT.yTop - 14)) / 18));
                            const bottomFade = Math.min(1, Math.max(0, (CHART_PLOT.yBase - 8 - tickY) / 16));
                            const alpha = familyWeight * topFade * bottomFade;
                            if (alpha <= 0.02) return null;

                            return (
                              <g key={`ytick-${family.anchorMax}-${tick.val}`} opacity={alpha}>
                                <line
                                  x1={CHART_PLOT.xLeft}
                                  y1={tickY}
                                  x2={CHART_PLOT.xRight}
                                  y2={tickY}
                                  stroke="#08254c"
                                  strokeOpacity="0.12"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={CHART_PLOT.xLeft - 9}
                                  y={tickY + 3.5}
                                  textAnchor="end"
                                  className="font-mono text-[11px] font-bold fill-[#08254c]/72 tabular-nums"
                                >
                                  {tick.label}
                                </text>
                              </g>
                            );
                          });
                        })}

                      {/* Rótulo fixo da linha de base 0 */}
                      <text
                        x={CHART_PLOT.xLeft - 9}
                        y={CHART_PLOT.yBase + 3.5}
                        textAnchor="end"
                        className="font-mono text-[11px] font-bold fill-[#08254c]/70 tabular-nums"
                      >
                        0
                      </text>

                      {/* Eixos Estruturais Y e X */}
                      <line
                        x1={CHART_PLOT.xLeft}
                        y1={CHART_PLOT.yTop - 8}
                        x2={CHART_PLOT.xLeft}
                        y2={CHART_PLOT.yBase}
                        stroke="#08254c"
                        strokeOpacity="0.20"
                        strokeWidth="1.3"
                      />
                      <line
                        x1={CHART_PLOT.xLeft}
                        y1={CHART_PLOT.yBase}
                        x2={CHART_PLOT.xRight}
                        y2={CHART_PLOT.yBase}
                        stroke="#08254c"
                        strokeOpacity="0.28"
                        strokeWidth="1.5"
                      />

                      {/* 2. Conteúdo no interior da Lente de Câmera (com clip na borda esquerda do eixo Y) */}
                      <g clipPath="url(#zoom-plot-window)">
                        {/* Divisória sutil indicando início da escala temporal proporcional em 1951 */}
                        {(() => {
                          const x1951 = uToScreenX(CHART_PLOT.modernStartU, uStart, uEnd);
                          if (x1951 <= CHART_PLOT.xLeft + 6 || x1951 >= CHART_PLOT.xRight) return null;
                          return (
                            <line
                              x1={x1951}
                              y1={CHART_PLOT.yTop - 4}
                              x2={x1951}
                              y2={CHART_PLOT.yBase}
                              stroke="#003893"
                              strokeOpacity="0.16"
                              strokeWidth="1.1"
                              strokeDasharray="3 3"
                            />
                          );
                        })()}

                        {/* Marcas de quebra de escala secular (//) antes de 1951 acompanhando o pan horizontal */}
                        {AXIS_BREAK_U_POSITIONS.map((bu) => {
                          const bx = uToScreenX(bu, uStart, uEnd);
                          if (bx < CHART_PLOT.xLeft + 8 || bx > CHART_PLOT.xRight - 8) return null;
                          return (
                            <g key={`break-${bu}`}>
                              <rect
                                x={bx - 4.5}
                                y={CHART_PLOT.yBase - 4}
                                width="9"
                                height="8"
                                fill="#f4f2eb"
                                fillOpacity="0.9"
                              />
                              <line
                                x1={bx - 4.5}
                                y1={CHART_PLOT.yBase + 5}
                                x2={bx - 0.5}
                                y2={CHART_PLOT.yBase - 5}
                                stroke="#08254c"
                                strokeOpacity="0.45"
                                strokeWidth="1.4"
                              />
                              <line
                                x1={bx + 0.5}
                                y1={CHART_PLOT.yBase + 5}
                                x2={bx + 4.5}
                                y2={CHART_PLOT.yBase - 5}
                                stroke="#08254c"
                                strokeOpacity="0.45"
                                strokeWidth="1.4"
                              />
                            </g>
                          );
                        })}

                        {/* Guias pontilhadas até a ponta ativa da progressão */}
                        {leadingTip.value > 0 && tipX >= CHART_PLOT.xLeft && (
                          <>
                            <line
                              x1={CHART_PLOT.xLeft}
                              y1={tipY}
                              x2={tipX}
                              y2={tipY}
                              stroke="#dc143c"
                              strokeOpacity="0.24"
                              strokeWidth="1.1"
                              strokeDasharray="4 4"
                            />
                            <line
                              x1={tipX}
                              y1={tipY}
                              x2={tipX}
                              y2={CHART_PLOT.yBase}
                              stroke="#dc143c"
                              strokeOpacity="0.34"
                              strokeWidth="1.2"
                              strokeDasharray="3 3"
                            />
                          </>
                        )}

                        {/* Área sombreada progressiva */}
                        {chartAreaPath && (
                          <path d={chartAreaPath} fill="url(#zoom-christian-area)" />
                        )}

                        {/* Cone de estimativa 2021–2026 (1,0M a 1,5M+) */}
                        {estimateConePath && (
                          <g opacity={coneProgress}>
                            <path d={estimateConePath} fill="#dc143c" fillOpacity="0.16" />
                            <line
                              x1={coneTipX}
                              y1={coneTipYMax}
                              x2={coneTipX}
                              y2={coneTipYMin}
                              stroke="#dc143c"
                              strokeWidth="2.4"
                              strokeDasharray="3 2"
                            />
                            <line
                              x1={coneTipX - 4.5}
                              y1={coneTipYMax}
                              x2={coneTipX + 4.5}
                              y2={coneTipYMax}
                              stroke="#dc143c"
                              strokeWidth="2"
                            />
                            <line
                              x1={coneTipX - 4.5}
                              y1={coneTipYMin}
                              x2={coneTipX + 4.5}
                              y2={coneTipYMin}
                              stroke="#dc143c"
                              strokeWidth="2"
                            />
                          </g>
                        )}

                        {/* Curva principal contínua que avança pelas datas */}
                        {chartLinePath && (
                          <path
                            d={chartLinePath}
                            fill="none"
                            stroke="#dc143c"
                            strokeWidth="3.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Halo da ponta viva enquanto avança entre datas */}
                        {tipX >= CHART_PLOT.xLeft && (
                          <g>
                            <circle
                              cx={tipX}
                              cy={tipY}
                              r={10.5}
                              fill="#dc143c"
                              fillOpacity="0.16"
                            />
                            <circle
                              cx={tipX}
                              cy={tipY}
                              r={5.8}
                              fill="#dc143c"
                              stroke="#ffffff"
                              strokeWidth="2.2"
                            />
                          </g>
                        )}
                      </g>

                      {/* 3. Pontos Históricos, Ticks de Datas (X) e Rótulos com Zoom Semântico */}
                      {HISTORICAL_SERIES.map((pt) => {
                        const px = uToScreenX(pt.u, uStart, uEnd);
                        const py = valueToScreenY(pt.value, camYMax);

                        // Suaviza a entrada/saída nas bordas esquerda e direita da lente de zoom
                        const leftFade = Math.min(1, Math.max(0, (px - (CHART_PLOT.xLeft - 4)) / 22));
                        const rightFade = Math.min(1, Math.max(0, (CHART_PLOT.xRight + 16 - px) / 20));
                        const viewportAlpha = leftFade * rightFade;
                        if (viewportAlpha <= 0.02) return null;

                        // Grau de revelação contínua conforme o cursor passa pela data
                        const revealAlpha =
                          pt.u === 0
                            ? 1
                            : Math.min(1, Math.max(0, (cursorU - (pt.u - 16)) / 18));

                        const isCurrentTarget = pt.id === restingActivePoint.id;
                        const isHovered = pt.id === hoveredYearId;

                        // No zoom aproximado (pxPerU >= 1.05) todas as décadas de censo aparecem no eixo X;
                        // no panorama completo (pxPerU < 1.05) ocultamos apenas anos intermediários densos se necessário
                        const showXYear =
                          pt.isMilestone ||
                          pxPerU >= 0.95 ||
                          pt.id === '1951' ||
                          isHovered;

                        // Seleção limpa de rótulos numéricos sobre a curva conforme o nível de zoom
                        const showValueCallout =
                          revealAlpha > 0.35 &&
                          (isCurrentTarget ||
                            isHovered ||
                            (isZoomedInOnEra && pt.value > 0) ||
                            (!isZoomedInOnEra &&
                              pt.isMilestone &&
                              pt.value >= 100000));

                        let labelX = px;
                        let labelY = py - 11;
                        let labelAnchor: 'start' | 'middle' | 'end' = 'middle';

                        if (pt.id === '2026') {
                          const yTopCone = valueToScreenY(pt.rangeMax ?? pt.value, camYMax);
                          labelX = Math.min(CHART_PLOT.xRight + 6, px + 6);
                          labelY = Math.max(14, yTopCone - 8);
                          labelAnchor = 'end';
                        } else if (!isCurrentTarget && pt.value > 0) {
                          labelX = px - 6;
                          labelY = Math.max(15, py - 9);
                          labelAnchor = 'end';
                        } else if (isCurrentTarget && pt.value > 0) {
                          labelY = Math.max(15, py - 12);
                        }

                        const baseRadius = isCurrentTarget || isHovered
                          ? 6.6
                          : pt.isMilestone
                          ? 4.6
                          : 3.6;

                        return (
                          <g key={pt.id} opacity={viewportAlpha}>
                            {/* Tick e Ano no Eixo X */}
                            {showXYear && (
                              <g opacity={pt.isMilestone || revealAlpha > 0.1 ? 1 : 0.45}>
                                <line
                                  x1={px}
                                  y1={CHART_PLOT.yBase}
                                  x2={px}
                                  y2={CHART_PLOT.yBase + (pt.isMilestone ? 5.5 : 3.5)}
                                  stroke="#08254c"
                                  strokeOpacity={revealAlpha > 0.2 ? 0.5 : 0.22}
                                  strokeWidth={pt.isMilestone ? 1.4 : 1}
                                />
                                <text
                                  x={px}
                                  y={CHART_PLOT.yBase + 19}
                                  textAnchor="middle"
                                  className={`font-display uppercase select-none ${
                                    isCurrentTarget || isHovered
                                      ? 'text-[11px] font-black fill-[#dc143c]'
                                      : revealAlpha > 0.2
                                      ? pt.isMilestone
                                        ? 'text-[10.5px] font-bold fill-[#08254c]/88'
                                        : 'text-[9.5px] font-semibold fill-[#08254c]/62'
                                      : 'text-[9.5px] font-semibold fill-[#08254c]/32'
                                  }`}
                                >
                                  {pt.yearLabel}
                                </text>
                              </g>
                            )}

                            {/* Ponto interativo e Rótulo de Valor (revelados suavemente na passagem da linha) */}
                            {revealAlpha > 0.04 && px >= CHART_PLOT.xLeft - 2 && (
                              <g
                                opacity={revealAlpha}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredYearId(pt.id)}
                                onMouseLeave={() => setHoveredYearId(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualStep(pt.targetStep);
                                }}
                              >
                                {/* Área invisível ampliada para facilitar toque/hover */}
                                <circle cx={px} cy={py} r={14} fill="transparent" />

                                <circle
                                  cx={px}
                                  cy={py}
                                  r={baseRadius * (0.45 + 0.55 * revealAlpha)}
                                  fill={
                                    isCurrentTarget || isHovered
                                      ? '#dc143c'
                                      : pt.isMilestone
                                      ? '#003893'
                                      : '#08254c'
                                  }
                                  stroke="#ffffff"
                                  strokeWidth={isCurrentTarget || isHovered ? 2.2 : 1.5}
                                />

                                {showValueCallout && (
                                  <text
                                    x={labelX}
                                    y={labelY}
                                    textAnchor={labelAnchor}
                                    className={`font-display tabular-nums pointer-events-none ${
                                      isCurrentTarget || isHovered
                                        ? 'text-[13.5px] font-black fill-[#dc143c]'
                                        : pt.isMilestone
                                        ? 'text-[10.5px] font-bold fill-[#003893]'
                                        : 'text-[10px] font-semibold fill-[#08254c]/80'
                                    }`}
                                  >
                                    {pt.formattedValue}
                                  </text>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* 4. Barra Minimapa da Lente de Zoom Temporal (mostra a janela atual na história completa) */}
                      <g>
                        <text
                          x={CHART_PLOT.xLeft}
                          y={285}
                          textAnchor="start"
                          className="font-sans text-[9px] font-semibold uppercase tracking-wider fill-[#08254c]/50"
                        >
                          Lente Temporal:
                        </text>

                        {/* Trilha total Séc. VI a.C. -> 2026 */}
                        <rect
                          x={CHART_PLOT.xLeft + 88}
                          y={279}
                          width={CHART_PLOT.plotWidth - 88}
                          height={6}
                          rx={3}
                          fill="#08254c"
                          fillOpacity="0.10"
                        />

                        {/* Indicador da janela de zoom ativa deslizando pela trilha */}
                        {(() => {
                          const trackX = CHART_PLOT.xLeft + 88;
                          const trackW = CHART_PLOT.plotWidth - 88;
                          const normStart = Math.max(0, Math.min(1, (uStart - CHART_PLOT.fullMinU) / fullSpanU));
                          const normEnd = Math.max(0, Math.min(1, (uEnd - CHART_PLOT.fullMinU) / fullSpanU));
                          const winX = trackX + normStart * trackW;
                          const winW = Math.max(18, (normEnd - normStart) * trackW);
                          return (
                            <rect
                              x={winX}
                              y={278}
                              width={winW}
                              height={8}
                              rx={4}
                              fill="#003893"
                              fillOpacity="0.22"
                              stroke="#003893"
                              strokeOpacity="0.65"
                              strokeWidth="1"
                            />
                          );
                        })()}

                        {/* Legenda discreta de escala proporcional */}
                        <text
                          x={CHART_PLOT.xRight}
                          y={301}
                          textAnchor="end"
                          className="font-sans text-[9px] font-medium fill-[#08254c]/50"
                        >
                          Pré-1951: quebras seculares (//) · 1951–2026: escala linear proporcional (75 anos)
                        </text>
                        <rect
                          x={lensBarLeft}
                          y={CHART_PLOT.yBase - 0.5}
                          width={lensBarWidth}
                          height={1}
                          fill="transparent"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </LiquidGlassContainer>
            </div>
          </div>

          {/* ===================================================================
              5. CONTROLES DISCRETOS DE NAVEGAÇÃO DE STEPS (CANTO INFERIOR ESQUERDO)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto group absolute left-0 bottom-0 z-40 pt-8 pr-16 pl-[68px] pb-[12px]"
          >
            <div className="flex items-center gap-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
              <button
                type="button"
                onClick={() =>
                  setManualStep(
                    activeStep > 0 ? ((activeStep - 1) as TimelineStep) : 0
                  )
                }
                disabled={activeStep === 0}
                className={`px-4 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeStep === 0
                    ? 'bg-white/20 text-[#08254c]/30 border-white/40 cursor-not-allowed'
                    : 'bg-white/70 text-[#08254c] border-white/85 hover:bg-white/95 backdrop-blur-md shadow-sm'
                }`}
              >
                ← Anterior
              </button>

              <button
                type="button"
                onClick={handleAdvanceStep}
                className="px-4 py-1.5 rounded-full bg-[#dc143c] hover:bg-[#b81032] text-white font-display text-[12px] font-extrabold uppercase tracking-wider shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {activeStep < 7
                  ? `Avançar (${TIMELINE_DATA[activeStep + 1].shortLabel}) ➔`
                  : 'Reiniciar ↻'}
              </button>
            </div>
          </div>
        </div>
      </SlideStage>
    </>
  );
};

export const Slide03Timeline: React.FC = () => {
  return (
    <Slide backgroundColor="#f4f2eb" padding={0}>
      <Slide03TimelineContent />
    </Slide>
  );
};

export default Slide03Timeline;
