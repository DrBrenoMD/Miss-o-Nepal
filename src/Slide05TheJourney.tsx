import React, { useState, useEffect, useRef, memo } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { GEO_PATHS } from './geoData';
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

export type JourneyStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Point2D {
  x: number;
  y: number;
}

interface WaypointCity {
  id: string;
  name: string;
  code: string;
  country: string;
  coordsLabel: string;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  anchor: 'start' | 'middle' | 'end';
}

/**
 * Coordenadas cartográficas 100% exatas na projeção do mapa-múndi do Slide 2 (GEO_PATHS):
 * x = 960 + lon * (14 / 3)
 * y = 590 - lat * 6
 */
const WAYPOINTS: Record<string, WaypointCity> = {
  cuiaba: {
    id: 'cuiaba',
    name: 'CUIABÁ',
    code: 'CGB · MT',
    country: 'Brasil',
    coordsLabel: '15° 36′ S · 56° 06′ O',
    x: 698.21,
    y: 683.61,
    labelOffsetX: -4.5,
    labelOffsetY: 5.5,
    anchor: 'end',
  },
  brasilia: {
    id: 'brasilia',
    name: 'BRASÍLIA',
    code: 'BSB · DF',
    country: 'Brasil',
    coordsLabel: '15° 47′ S · 47° 53′ O',
    x: 736.51,
    y: 684.78,
    labelOffsetX: 4.5,
    labelOffsetY: 5.5,
    anchor: 'start',
  },
  lisboa: {
    id: 'lisboa',
    name: 'LISBOA',
    code: 'LIS · PT',
    country: 'Portugal',
    coordsLabel: '38° 43′ N · 09° 08′ O',
    x: 917.35,
    y: 357.67,
    labelOffsetX: -6.0,
    labelOffsetY: 2.0,
    anchor: 'end',
  },
  amsterdam: {
    id: 'amsterdam',
    name: 'AMSTERDAM',
    code: 'AMS · NL',
    country: 'Holanda',
    coordsLabel: '52° 22′ N · 04° 54′ L',
    x: 982.89,
    y: 275.8,
    labelOffsetX: 0,
    labelOffsetY: -6.2,
    anchor: 'middle',
  },
  mumbai: {
    id: 'mumbai',
    name: 'MUMBAI',
    code: 'BOM · IN',
    country: 'Índia',
    coordsLabel: '19° 04′ N · 72° 52′ L',
    x: 1300.09,
    y: 475.54,
    labelOffsetX: -5.2,
    labelOffsetY: 5.5,
    anchor: 'end',
  },
  kathmandu: {
    id: 'kathmandu',
    name: 'KATHMANDU',
    code: 'KTM · NP',
    country: 'Nepal',
    coordsLabel: '27° 43′ N · 85° 19′ L',
    x: 1358.18,
    y: 423.7,
    labelOffsetX: -3.5,
    labelOffsetY: -4.2,
    anchor: 'end',
  },
  biratnagar: {
    id: 'biratnagar',
    name: 'BIRATNAGAR',
    code: 'BIR · NP',
    country: 'Nepal',
    coordsLabel: '26° 27′ N · 87° 16′ L',
    x: 1367.26,
    y: 431.29,
    labelOffsetX: 3.8,
    labelOffsetY: 3.6,
    anchor: 'start',
  },
};

const ORDERED_WAYPOINTS: WaypointCity[] = [
  WAYPOINTS.cuiaba,
  WAYPOINTS.brasilia,
  WAYPOINTS.lisboa,
  WAYPOINTS.amsterdam,
  WAYPOINTS.mumbai,
  WAYPOINTS.kathmandu,
  WAYPOINTS.biratnagar,
];

interface JourneyLeg {
  index: number;
  vehicle: 'bus' | 'plane';
  from: WaypointCity;
  to: WaypointCity;
  ctrlGround: Point2D;
  ctrlSky: Point2D;
  distanceKm: string;
  durationLabel: string;
  modeBadge: string;
  shortLabel: string;
  color: string;
}

const JOURNEY_LEGS: JourneyLeg[] = [
  {
    index: 0,
    vehicle: 'bus',
    from: WAYPOINTS.cuiaba,
    to: WAYPOINTS.brasilia,
    ctrlGround: { x: 718.5, y: 691.5 },
    ctrlSky: { x: 718.5, y: 689.8 },
    distanceKm: '1.133 km',
    durationLabel: '~18h de estrada',
    modeBadge: 'TRECHO 01 · ÔNIBUS RODOVIÁRIO',
    shortLabel: '01. Cuiabá ➔ Brasília',
    color: '#f59e0b',
  },
  {
    index: 1,
    vehicle: 'plane',
    from: WAYPOINTS.brasilia,
    to: WAYPOINTS.lisboa,
    ctrlGround: { x: 842.0, y: 530.0 },
    ctrlSky: { x: 775.0, y: 440.0 },
    distanceKm: '7.295 km',
    durationLabel: '~9h 40m de voo',
    modeBadge: 'TRECHO 02 · VOO TRANSATLÂNTICO',
    shortLabel: '02. Brasília ➔ Lisboa',
    color: '#003893',
  },
  {
    index: 2,
    vehicle: 'plane',
    from: WAYPOINTS.lisboa,
    to: WAYPOINTS.amsterdam,
    ctrlGround: { x: 955.0, y: 320.0 },
    ctrlSky: { x: 926.0, y: 274.0 },
    distanceKm: '1.848 km',
    durationLabel: '~3h 00m de voo',
    modeBadge: 'TRECHO 03 · CONEXÃO EUROPEIA',
    shortLabel: '03. Lisboa ➔ Amsterdam',
    color: '#003893',
  },
  {
    index: 3,
    vehicle: 'plane',
    from: WAYPOINTS.amsterdam,
    to: WAYPOINTS.mumbai,
    ctrlGround: { x: 1145.0, y: 392.0 },
    ctrlSky: { x: 1175.0, y: 280.0 },
    distanceKm: '6.854 km',
    durationLabel: '~8h 50m de voo',
    modeBadge: 'TRECHO 04 · VOO INTERCONTINENTAL',
    shortLabel: '04. Amsterdam ➔ Mumbai',
    color: '#dc143c',
  },
  {
    index: 4,
    vehicle: 'plane',
    from: WAYPOINTS.mumbai,
    to: WAYPOINTS.kathmandu,
    ctrlGround: { x: 1332.0, y: 452.0 },
    ctrlSky: { x: 1310.0, y: 408.0 },
    distanceKm: '1.590 km',
    durationLabel: '~2h 45m de voo',
    modeBadge: 'TRECHO 05 · RUMO AO HIMALAIA',
    shortLabel: '05. Mumbai ➔ Kathmandu',
    color: '#dc143c',
  },
  {
    index: 5,
    vehicle: 'plane',
    from: WAYPOINTS.kathmandu,
    to: WAYPOINTS.biratnagar,
    ctrlGround: { x: 1362.5, y: 428.8 },
    ctrlSky: { x: 1364.8, y: 419.2 },
    distanceKm: '240 km',
    durationLabel: '~45m de voo doméstico',
    modeBadge: 'TRECHO 06 · VOO DOMÉSTICO NEPAL',
    shortLabel: '06. Kathmandu ➔ Biratnagar',
    color: '#dc143c',
  },
];

interface StageContentInfo {
  stepBadge: string;
  title: string;
  subtitle: string;
  routeHeader: string;
  transportType: 'bus' | 'plane' | 'all';
  legMetric: string;
  legMetricLabel: string;
  cardTitle: string;
  cardBody: string;
  coords: string;
}

const STAGE_CONTENT: Record<JourneyStage, StageContentInfo> = {
  0: {
    stepBadge: 'ETAPA 01/07 · PARTIDA POR TERRA (ÔNIBUS)',
    title: 'A VIAGEM: CUIABÁ A BRASÍLIA',
    subtitle: 'O Início da Maratona de +60 Horas Rumo ao Outro Lado do Mundo',
    routeHeader: 'CUIABÁ (MT) ➔ BRASÍLIA (DF)',
    transportType: 'bus',
    legMetric: '1.133 km',
    legMetricLabel: '1º Trecho de Ônibus pelo Centro-Oeste',
    cardTitle: 'Partida Rodoviária pelo Coração do Brasil',
    cardBody:
      'A jornada começou na estrada: um ônibus saindo de Cuiabá (MT) cruzando o cerrado até Brasília (DF) para alcançar o embarque internacional.',
    coords: '15° 36′ S, 56° 06′ O ➔ 15° 47′ S, 47° 53′ O',
  },
  1: {
    stepBadge: 'ETAPA 02/07 · TRAVESSIA DO ATLÂNTICO (AVIÃO)',
    title: 'VOO: BRASÍLIA A LISBOA',
    subtitle: 'Deixando a América do Sul Rumo ao Continente Europeu',
    routeHeader: 'BRASÍLIA (BSB) ➔ LISBOA (LIS)',
    transportType: 'plane',
    legMetric: '7.295 km',
    legMetricLabel: 'Travessia Transatlântica Noturna',
    cardTitle: 'Do Planalto Central para Portugal',
    cardBody:
      'Em Brasília, o ônibus deu lugar ao avião. O primeiro grande voo internacional cruzou todo o Oceano Atlântico até pousar em Lisboa.',
    coords: '15° 47′ S, 47° 53′ O ➔ 38° 43′ N, 09° 08′ O',
  },
  2: {
    stepBadge: 'ETAPA 03/07 · CONEXÃO EUROPEIA (AVIÃO)',
    title: 'VOO: LISBOA A AMSTERDAM',
    subtitle: 'Subindo pela Europa Ocidental até a Holanda',
    routeHeader: 'LISBOA (LIS) ➔ AMSTERDAM (AMS)',
    transportType: 'plane',
    legMetric: '1.848 km',
    legMetricLabel: 'Conexão Estratégica na Europa',
    cardTitle: 'Escala em Amsterdam (Schiphol)',
    cardBody:
      'De Portugal, o segundo voo seguiu para o norte da Europa até Amsterdam, na Holanda, preparando a longa travessia rumo ao continente asiático.',
    coords: '38° 43′ N, 09° 08′ O ➔ 52° 22′ N, 04° 54′ L',
  },
  3: {
    stepBadge: 'ETAPA 04/07 · TRAVESSIA EURÁSIA (AVIÃO)',
    title: 'VOO: AMSTERDAM A MUMBAI',
    subtitle: 'Cruzando a Europa, Oriente Médio e Mar Arábico até a Índia',
    routeHeader: 'AMSTERDAM (AMS) ➔ MUMBAI (BOM)',
    transportType: 'plane',
    legMetric: '6.854 km',
    legMetricLabel: 'Voo Intercontinental Rumo à Ásia',
    cardTitle: 'Chegada ao Subcontinente Indiano',
    cardBody:
      'Mais um voo de longa distância cortando fusos horários da Holanda até Mumbai, na costa oeste da Índia — porta de entrada para a Ásia Meridional.',
    coords: '52° 22′ N, 04° 54′ L ➔ 19° 04′ N, 72° 52′ L',
  },
  4: {
    stepBadge: 'ETAPA 05/07 · RUMO AO HIMALAIA (AVIÃO)',
    title: 'VOO: MUMBAI A KATHMANDU',
    subtitle: 'Subindo da Costa da Índia até o Vale cercado pelo Himalaia',
    routeHeader: 'MUMBAI (BOM) ➔ KATHMANDU (KTM)',
    transportType: 'plane',
    legMetric: '1.590 km',
    legMetricLabel: 'Aproximação da Cordilheira do Himalaia',
    cardTitle: 'Pouso na Capital do Nepal',
    cardBody:
      'De Mumbai, o quarto voo atravessou toda a planície indiana em direção ao norte, pousando no vale de Kathmandu aos pés das maiores montanhas da Terra.',
    coords: '19° 04′ N, 72° 52′ L ➔ 27° 43′ N, 85° 19′ L',
  },
  5: {
    stepBadge: 'ETAPA 06/07 · TRECHO FINAL (AVIÃO)',
    title: 'VOO: KATHMANDU A BIRATNAGAR',
    subtitle: 'Voo Doméstico Paralelo ao Himalaia até o Sudeste do Nepal',
    routeHeader: 'KATHMANDU (KTM) ➔ BIRATNAGAR (BIR)',
    transportType: 'plane',
    legMetric: '240 km',
    legMetricLabel: 'Pouso Final nas Planícies do Terai',
    cardTitle: 'Mais de 60 Horas Só de Ida!',
    cardBody:
      'O último voo da ida levou de Kathmandu até Biratnagar, no extremo sudeste do Nepal — completando mais de 60 horas de viagem só para chegar ao destino.',
    coords: '27° 43′ N, 85° 19′ L ➔ 26° 27′ N, 87° 16′ L',
  },
  6: {
    stepBadge: 'ETAPA 07/07 · PANORAMA GLOBAL DA EXPEDIÇÃO',
    title: '+60 HORAS SÓ DE IDA · 7 PAÍSES',
    subtitle: '2 Ônibus e 11 Voos cruzando 3 Continentes na Missão Completa',
    routeHeader: 'CUIABÁ ➔ BRASÍLIA ➔ LISBOA ➔ AMSTERDAM ➔ MUMBAI ➔ KATHMANDU ➔ BIRATNAGAR',
    transportType: 'all',
    legMetric: '+60 HORAS',
    legMetricLabel: 'Duração Acumulada Somente na Ida',
    cardTitle: '2 Ônibus · 11 Voos · 7 Países Diferentes',
    cardBody:
      'Somando toda a expedição (ida, deslocamentos internos e retorno), foram 2 ônibus e 11 voos passando por 7 países diferentes até cumprir a missão no Nepal.',
    coords: 'ROTA GLOBAL COMPLETA · AMÉRICA DO SUL ➔ EUROPA ➔ ÁSIA',
  },
};

interface VectorCameraPose {
  focusX: number;
  focusY: number;
  screenX: number;
  screenY: number;
  zoom: number;
  tiltY: number;
  skewX: number;
  rotate: number;
}

const VECTOR_CAMERA_POSES: Record<JourneyStage, VectorCameraPose> = {
  // Etapa 0: Zoom 3D no Brasil Central (Cuiabá ➔ Brasília de Ônibus)
  0: {
    focusX: 717.5,
    focusY: 681.0,
    screenX: 1265,
    screenY: 560,
    zoom: 7.4,
    tiltY: 0.72,
    skewX: 10,
    rotate: 4,
  },
  // Etapa 1: Travessia Transatlântica 3D (Brasília ➔ Lisboa)
  1: {
    focusX: 832.0,
    focusY: 520.0,
    screenX: 1265,
    screenY: 555,
    zoom: 2.35,
    tiltY: 0.78,
    skewX: -7,
    rotate: -3,
  },
  // Etapa 2: Europa Ocidental 3D (Lisboa ➔ Amsterdam)
  2: {
    focusX: 952.0,
    focusY: 316.0,
    screenX: 1265,
    screenY: 555,
    zoom: 5.2,
    tiltY: 0.7,
    skewX: -11,
    rotate: -5,
  },
  // Etapa 3: Voo Intercontinental Eurásia 3D (Amsterdam ➔ Mumbai)
  3: {
    focusX: 1145.0,
    focusY: 378.0,
    screenX: 1265,
    screenY: 555,
    zoom: 2.55,
    tiltY: 0.76,
    skewX: -10,
    rotate: -4,
  },
  // Etapa 4: Índia ao Himalaia 3D (Mumbai ➔ Kathmandu)
  4: {
    focusX: 1332.0,
    focusY: 446.0,
    screenX: 1265,
    screenY: 565,
    zoom: 6.4,
    tiltY: 0.66,
    skewX: -14,
    rotate: -7,
  },
  // Etapa 5: Voo Doméstico no Relevo 3D do Nepal (Kathmandu ➔ Biratnagar)
  5: {
    focusX: 1358.5,
    focusY: 423.0,
    screenX: 1265,
    screenY: 585,
    zoom: 11.8,
    tiltY: 0.62,
    skewX: -17,
    rotate: -10,
  },
  // Etapa 6: Panorama Global Completo 3D (Cuiabá ➔ Biratnagar)
  6: {
    focusX: 1038.0,
    focusY: 485.0,
    screenX: 1265,
    screenY: 550,
    zoom: 1.92,
    tiltY: 0.78,
    skewX: -7,
    rotate: -2.5,
  },
};

function buildSvgCameraTransform(p: VectorCameraPose): string {
  return `translate(${p.screenX.toFixed(2)}, ${p.screenY.toFixed(2)}) scale(1, ${p.tiltY.toFixed(
    3
  )}) skewX(${p.skewX.toFixed(2)}) rotate(${p.rotate.toFixed(2)}) scale(${p.zoom.toFixed(
    3
  )}) translate(${(-p.focusX).toFixed(2)}, ${(-p.focusY).toFixed(2)})`;
}

function makeQuadPath(p0: Point2D, ctrl: Point2D, p2: Point2D): string {
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} Q ${ctrl.x.toFixed(2)} ${ctrl.y.toFixed(
    2
  )} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

function evalQuadBezier(p0: Point2D, p1: Point2D, p2: Point2D, t: number): {
  x: number;
  y: number;
  angle: number;
} {
  const mt = 1 - t;
  const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
  const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
  const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return { x, y, angle };
}

/**
 * Camada Cartográfica Base Memoizada (Mesmo Mapa-Múndi Oficial do Slide 2 + Relevo 3D do Himalaia)
 */
const StaticJourneyWorldMap = memo(() => {
  return (
    <>
      {/* Grade de Meridianos e Paralelos do Globo */}
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
        fillOpacity="0.045"
        stroke="#08254c"
        strokeOpacity="0.30"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />

      {/* CHINA e ÍNDIA */}
      <path
        d={GEO_PATHS.china}
        fill="#003893"
        fillOpacity="0.05"
        stroke="#08254c"
        strokeOpacity="0.45"
        strokeWidth="0.65"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.india}
        fill="#003893"
        fillOpacity="0.08"
        stroke="#08254c"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.bhutan}
        fill="#08254c"
        fillOpacity="0.04"
        stroke="#08254c"
        strokeWidth="0.4"
      />
      <path
        d={GEO_PATHS.bangladesh}
        fill="#08254c"
        fillOpacity="0.04"
        stroke="#08254c"
        strokeWidth="0.4"
      />

      {/* BRASIL e Estados Brasileiros (IBGE) */}
      <path
        d={GEO_PATHS.brazilStates}
        fill="#08254c"
        fillOpacity="0.025"
        stroke="#08254c"
        strokeOpacity="0.28"
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      <path
        d={GEO_PATHS.brazil}
        fill="#003893"
        fillOpacity="0.05"
        stroke="#08254c"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Estado do MATO GROSSO (Ponto de Partida: Cuiabá) */}
      <path
        d={GEO_PATHS.matoGrosso}
        transform="translate(-0.8, 1.3)"
        fill="#08254c"
        fillOpacity="0.16"
      />
      <path
        d={GEO_PATHS.matoGrosso}
        fill="#003893"
        fillOpacity="0.14"
        stroke="#003893"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Sombra de Extrusão 3D + Contorno Real do NEPAL */}
      <path
        d={GEO_PATHS.nepal}
        transform="translate(-0.8, 1.5)"
        fill="#08254c"
        fillOpacity="0.28"
      />
      <path
        d={GEO_PATHS.nepal}
        fill="#dc143c"
        fillOpacity="0.32"
        stroke="#08254c"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />

      {/* Cordilheira do Himalaia 3D Esculpida ao Norte do Nepal */}
      <g transform="translate(0, 0)">
        <path
          d="M 1333.8 412.2 L 1335.4 408.8 L 1336.9 406.9 L 1338.2 403.5 L 1339.4 400.8 L 1340.5 402.1 L 1341.7 404.9 L 1343.1 405.8 L 1344.6 401.9 L 1345.8 399.4 L 1347.2 395.8 L 1348.3 394.6 L 1349.6 396.9 L 1350.8 400.2 L 1352.1 403.4 L 1353.3 401.2 L 1354.7 397.5 L 1355.9 394.8 L 1357.1 393.6 L 1358.3 396.2 L 1359.5 399.8 L 1360.7 402.1 L 1361.9 397.8 L 1363.0 393.2 L 1364.1 389.6 L 1365.0 386.4 L 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.7 393.8 L 1369.8 397.9 L 1370.7 395.1 L 1371.7 392.2 L 1372.6 390.6 L 1373.5 393.9 L 1374.4 398.7 L 1375.3 405.2 L 1375.9 420.2 L 1366.5 424.2 L 1354.5 421.8 L 1343.2 417.5 Z"
          fill="#f4f2eb"
          fillOpacity="0.92"
          stroke="#08254c"
          strokeWidth="0.38"
          strokeLinejoin="round"
        />
        <path
          d="M 1339.4 400.8 L 1340.5 402.1 L 1341.7 404.9 L 1343.1 405.8 L 1341.8 411.4 L 1339.6 413.8 L 1338.7 408.2 L 1339.7 404.5 Z M 1348.3 394.6 L 1349.6 396.9 L 1350.8 400.2 L 1352.1 403.4 L 1351.2 410.5 L 1348.9 415.6 L 1347.6 409.2 L 1348.6 402.8 L 1347.8 398.5 Z M 1357.1 393.6 L 1358.3 396.2 L 1359.5 399.8 L 1360.7 402.1 L 1359.8 411.2 L 1357.6 417.8 L 1356.2 411.4 L 1357.3 404.1 L 1356.5 398.2 Z M 1365.7 385.2 L 1366.7 387.9 L 1367.8 390.1 L 1368.7 393.8 L 1369.8 397.9 L 1368.9 410.8 L 1366.4 420.5 L 1364.8 413.2 L 1365.9 404.6 L 1365.1 396.4 L 1366.1 390.8 Z"
          fill="#003893"
          fillOpacity="0.24"
        />
      </g>

      {/* Rótulos Continentais / Regionais Discretos */}
      <text
        x="676"
        y="625"
        className="font-display text-[6.5px] font-black tracking-[0.26em] fill-[#08254c]/55"
      >
        BRASIL
      </text>
      <text
        x="952"
        y="344"
        textAnchor="middle"
        className="font-display text-[6.2px] font-black tracking-[0.24em] fill-[#08254c]/55"
      >
        EUROPA
      </text>
      <text
        x="1325"
        y="495"
        textAnchor="middle"
        className="font-display text-[6.2px] font-black tracking-[0.24em] fill-[#08254c]/55"
      >
        ÍNDIA
      </text>
      <text
        x="1364"
        y="381"
        textAnchor="middle"
        className="font-display text-[4.5px] font-black tracking-[0.22em] fill-[#dc143c]"
      >
        HIMALAIA · NEPAL
      </text>
    </>
  );
});

export const Slide05TheJourneyContent: React.FC = memo(() => {
  // 7 etapas (0..6) => useSteps(6)
  const { step, placeholder } = useSteps(6);
  const [manualStage, setManualStage] = useState<JourneyStage | null>(null);
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();

  useEffect(() => {
    setManualStage(null);
  }, [step]);

  const safeStepNumber =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(6, Math.round(step + 1)))
      : 0;
  const clampedSpectacleStage = safeStepNumber as JourneyStage;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? (Math.max(0, Math.min(6, stageInstance.forcedSubStep)) as JourneyStage)
      : broadcast && broadcast.mode !== 'standalone' && broadcast.roomState.slideIndex === 9
      ? (Math.max(0, Math.min(6, broadcast.roomState.subStep)) as JourneyStage)
      : null;

  const activeStage: JourneyStage =
    syncedSubStep !== null
      ? syncedSubStep
      : manualStage !== null && VECTOR_CAMERA_POSES[manualStage]
      ? manualStage
      : clampedSpectacleStage;

  const currentInfo = STAGE_CONTENT[activeStage] ?? STAGE_CONTENT[0];
  const targetPose = VECTOR_CAMERA_POSES[activeStage] ?? VECTOR_CAMERA_POSES[0];

  // Referências DOM diretas para animação vetorial 3D em 60 FPS (zero re-render React)
  const svgCameraGroupRef = useRef<SVGGElement | null>(null);
  const currentPoseRef = useRef<VectorCameraPose>({ ...targetPose });

  // Referências para o veículo 3D em movimento (Ônibus ou Avião), sombra no solo e linha de altitude
  const activeVehicleGroupRef = useRef<SVGGElement | null>(null);
  const activeShadowGroupRef = useRef<SVGGElement | null>(null);
  const altitudeDropLineRef = useRef<SVGLineElement | null>(null);
  const busModelGroupRef = useRef<SVGGElement | null>(null);
  const planeModelGroupRef = useRef<SVGGElement | null>(null);
  const vehicleBadgeTextRef = useRef<SVGTextElement | null>(null);

  //1. Animação de Câmera 3D com arco de altitude suave
  useEffect(() => {
    const startPose = { ...currentPoseRef.current };
    const endPose = { ...targetPose };

    const controls = animate(0, 1, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const dist = Math.hypot(endPose.focusX - startPose.focusX, endPose.focusY - startPose.focusY);
        const arcDip = dist > 180 ? Math.sin(t * Math.PI) * 1.15 : 0;

        const interpolated: VectorCameraPose = {
          focusX: startPose.focusX + (endPose.focusX - startPose.focusX) * t,
          focusY: startPose.focusY + (endPose.focusY - startPose.focusY) * t,
          screenX: startPose.screenX + (endPose.screenX - startPose.screenX) * t,
          screenY: startPose.screenY + (endPose.screenY - startPose.screenY) * t,
          zoom: Math.max(1.65, startPose.zoom + (endPose.zoom - startPose.zoom) * t - arcDip),
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

  // 2. Animação Contínua 60 FPS do Ônibus 3D (Trecho 1) e do Avião 3D (Trechos 2..6 ou Rota Completa na Etapa 7)
  useEffect(() => {
    const updateVehicleAtLeg = (leg: JourneyLeg, tProgress: number) => {
      const clampedT = Math.max(0, Math.min(1, tProgress));
      const skyPos = evalQuadBezier(leg.from, leg.ctrlSky, leg.to, clampedT);
      const groundPos = evalQuadBezier(leg.from, leg.ctrlGround, leg.to, clampedT);

      // Escala adaptativa inversa ao zoom atual para manter o ônibus e o avião nítidos e proporcionais em qualquer altitude
      const currentZoom = currentPoseRef.current.zoom || targetPose.zoom;
      const vehicleScale = Math.max(0.28, Math.min(2.2, 3.1 / Math.pow(currentZoom, 0.78)));

      if (activeVehicleGroupRef.current) {
        activeVehicleGroupRef.current.setAttribute(
          'transform',
          `translate(${skyPos.x.toFixed(2)}, ${skyPos.y.toFixed(2)}) scale(${vehicleScale.toFixed(
            3
          )})`
        );
      }

      if (activeShadowGroupRef.current) {
        activeShadowGroupRef.current.setAttribute(
          'transform',
          `translate(${groundPos.x.toFixed(2)}, ${groundPos.y.toFixed(
            2
          )}) scale(${vehicleScale.toFixed(3)}) rotate(${groundPos.angle.toFixed(1)})`
        );
        activeShadowGroupRef.current.setAttribute(
          'opacity',
          leg.vehicle === 'plane' ? '0.32' : '0.18'
        );
      }

      if (altitudeDropLineRef.current) {
        altitudeDropLineRef.current.setAttribute('x1', skyPos.x.toFixed(2));
        altitudeDropLineRef.current.setAttribute('y1', skyPos.y.toFixed(2));
        altitudeDropLineRef.current.setAttribute('x2', groundPos.x.toFixed(2));
        altitudeDropLineRef.current.setAttribute('y2', groundPos.y.toFixed(2));
        altitudeDropLineRef.current.setAttribute(
          'opacity',
          leg.vehicle === 'plane' ? '0.65' : '0'
        );
      }

      if (busModelGroupRef.current && planeModelGroupRef.current) {
        if (leg.vehicle === 'bus') {
          busModelGroupRef.current.setAttribute('opacity', '1');
          busModelGroupRef.current.setAttribute('transform', `rotate(${(skyPos.angle * 0.25).toFixed(1)})`);
          planeModelGroupRef.current.setAttribute('opacity', '0');
        } else {
          busModelGroupRef.current.setAttribute('opacity', '0');
          planeModelGroupRef.current.setAttribute('opacity', '1');
          planeModelGroupRef.current.setAttribute('transform', `rotate(${skyPos.angle.toFixed(1)})`);
        }
      }

      if (vehicleBadgeTextRef.current) {
        vehicleBadgeTextRef.current.textContent =
          leg.vehicle === 'bus'
            ? `ÔNIBUS · ${leg.from.name} ➔ ${leg.to.name}`
            : `VOO · ${leg.from.code.split(' ')[0]} ➔ ${leg.to.code.split(' ')[0]}`;
      }
    };

    if (activeStage < 6) {
      const leg = JOURNEY_LEGS[activeStage] ?? JOURNEY_LEGS[0];
      // Posiciona imediatamente no início do trecho e anima em loop suave
      updateVehicleAtLeg(leg, 0);

      const controls = animate(0, 1.18, {
        duration: 3.4,
        repeat: Infinity,
        ease: 'easeInOut',
        onUpdate: (v) => {
          const t = Math.min(1, v);
          updateVehicleAtLeg(leg, t);
        },
      });
      return () => controls.stop();
    } else {
      // Etapa 6 (Panorama Global): Anima continuamente por todos os 6 trechos (Ônibus em Cuiabá➔Brasília e Avião até Biratnagar!)
      const controls = animate(0, 6, {
        duration: 11.5,
        repeat: Infinity,
        ease: 'linear',
        onUpdate: (val) => {
          const legIdx = Math.min(5, Math.floor(val));
          const legT = val - legIdx;
          const leg = JOURNEY_LEGS[legIdx] ?? JOURNEY_LEGS[0];
          updateVehicleAtLeg(leg, legT);
        },
      });
      return () => controls.stop();
    }
  }, [activeStage, targetPose.zoom]);

  const handleNextStageOrClick = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (activeStage < 6) {
      setManualStage(((activeStage + 1) as JourneyStage));
    } else {
      setManualStage(0);
    }
  };

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-05-the-journey" className="bg-[#f4f2eb]">
        <div
          onClick={handleNextStageOrClick}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA DE ELEMENTOS FLUIDOS AO FUNDO (LIQUID GLASS AMBIENCE)
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div
              className="absolute left-[40px] top-[240px] w-[360px] h-[360px] rounded-full bg-[#003893]/18"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
            <div
              className="absolute left-[280px] bottom-[120px] w-[340px] h-[340px] rounded-full bg-[#dc143c]/16"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
            <svg viewBox="0 0 1920 1080" className="w-full h-full opacity-22" fill="none">
              <path
                d="M -40 340 C 260 290, 520 430, 820 370 C 1120 310, 1460 440, 1960 350"
                stroke="#003893"
                strokeWidth="1.8"
                strokeDasharray="8 8"
              />
              <path
                d="M -40 660 C 280 600, 540 730, 860 660 C 1180 590, 1500 710, 1960 610"
                stroke="#dc143c"
                strokeWidth="1.6"
                strokeDasharray="6 10"
              />
            </svg>
          </div>

          {/* ===================================================================
              2. PALCO CARTOGRÁFICO VETORIAL 3D (MESMO MAPA-MÚNDI DO SLIDE 2)
                 - Nitidez 100% vetorial em qualquer zoom
                 - Rotas 3D com sombra projetada no solo + arcos parabólicos elevados
                 - Ônibus 3D (Cuiabá ➔ Brasília) + Avião 3D (Brasília ➔ ... ➔ Biratnagar)
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-10 w-[1920px] h-[1080px]">
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
                {/* Mapa-Múndi Base + Índia, China, Brasil, Mato Grosso e Nepal com Himalaia 3D */}
                <StaticJourneyWorldMap />

                {/* ---------------------------------------------------------
                    CAMADA DE ROTAS: SOMBRAS PROJETADAS NO SOLO + ARCOS 3D ELEVADOS
                   --------------------------------------------------------- */}
                {JOURNEY_LEGS.map((leg) => {
                  const isCompleted = activeStage > leg.index || activeStage === 6;
                  const isCurrent = activeStage === leg.index;
                  const isVisible = isCompleted || isCurrent;
                  const groundPath = makeQuadPath(leg.from, leg.ctrlGround, leg.to);
                  const skyPath = makeQuadPath(leg.from, leg.ctrlSky, leg.to);
                  const midSky = evalQuadBezier(leg.from, leg.ctrlSky, leg.to, 0.5);
                  const midGround = evalQuadBezier(leg.from, leg.ctrlGround, leg.to, 0.5);

                  return (
                    <g
                      key={`leg-${leg.index}`}
                      opacity={isVisible ? 1 : 0.16}
                      className="transition-opacity duration-500"
                    >
                      {/* Sombra da Rota no Solo / Oceano */}
                      <path
                        d={groundPath}
                        stroke="#08254c"
                        strokeOpacity={isCurrent ? '0.38' : '0.22'}
                        strokeWidth={leg.vehicle === 'bus' ? '0.9' : '0.7'}
                        strokeDasharray="2 2.5"
                        fill="none"
                      />

                      {/* Pares de Pilares de Altitude 3D (conectando o arco aéreo ao solo) */}
                      {leg.vehicle === 'plane' && isVisible && (
                        <line
                          x1={midSky.x}
                          y1={midSky.y}
                          x2={midGround.x}
                          y2={midGround.y}
                          stroke={leg.color}
                          strokeOpacity="0.32"
                          strokeWidth="0.35"
                          strokeDasharray="1.2 1.2"
                        />
                      )}

                      {/* Trilha Principal 3D (Estrada para Ônibus / Arco Estratósferico para Avião) */}
                      <path
                        d={skyPath}
                        stroke={leg.color}
                        strokeOpacity={isCurrent ? '0.96' : isCompleted ? '0.82' : '0.28'}
                        strokeWidth={
                          leg.index === 5
                            ? '0.65'
                            : leg.vehicle === 'bus'
                            ? '1.25'
                            : isCurrent
                            ? '1.35'
                            : '1.05'
                        }
                        strokeLinecap="round"
                        fill="none"
                      />

                      {/* Linha pontilhada luminosa interna sobre a rota */}
                      <path
                        d={skyPath}
                        stroke="#ffffff"
                        strokeOpacity={isCurrent ? '0.85' : '0.45'}
                        strokeWidth={leg.index === 5 ? '0.25' : '0.42'}
                        strokeDasharray={leg.vehicle === 'bus' ? '1.2 1.8' : '2.2 2.6'}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </g>
                  );
                })}

                {/* ---------------------------------------------------------
                    PINOS 3D DAS 7 CIDADES DA ROTA (CUIABÁ A BIRATNAGAR)
                   --------------------------------------------------------- */}
                {ORDERED_WAYPOINTS.map((city, idx) => {
                  const isReached = activeStage + 1 >= idx || activeStage === 6;
                  const isOriginOrDestOfActive =
                    activeStage < 6 &&
                    (JOURNEY_LEGS[activeStage].from.id === city.id ||
                      JOURNEY_LEGS[activeStage].to.id === city.id);

                  // Escala de fonte adaptada à densidade regional (Kathmandu e Biratnagar ficam próximos no Nepal)
                  const isNepalCity = city.id === 'kathmandu' || city.id === 'biratnagar';
                  const pinRadius = isNepalCity ? 0.95 : 1.65;
                  const fontSize = isNepalCity ? 2.1 : 3.6;

                  return (
                    <g
                      key={city.id}
                      transform={`translate(${city.x}, ${city.y})`}
                      opacity={isReached ? 1 : 0.42}
                    >
                      {/* Anel de Radar 3D no Solo */}
                      <ellipse
                        cx="0"
                        cy="0"
                        rx={pinRadius * 2.3}
                        ry={pinRadius * 1.35}
                        fill={isOriginOrDestOfActive ? '#dc143c' : '#003893'}
                        fillOpacity={isOriginOrDestOfActive ? '0.25' : '0.14'}
                        stroke={isOriginOrDestOfActive ? '#dc143c' : '#003893'}
                        strokeWidth={isNepalCity ? '0.25' : '0.4'}
                      />

                      {/* Ponto Central */}
                      <circle
                        cx="0"
                        cy="0"
                        r={pinRadius}
                        fill={
                          city.id === 'cuiaba'
                            ? '#f59e0b'
                            : isOriginOrDestOfActive
                            ? '#dc143c'
                            : '#003893'
                        }
                        stroke="#ffffff"
                        strokeWidth={isNepalCity ? '0.28' : '0.45'}
                      />

                      {/* Rótulo Vetorial Nítido da Cidade */}
                      <text
                        x={city.labelOffsetX}
                        y={city.labelOffsetY}
                        textAnchor={city.anchor}
                        style={{ fontSize: `${fontSize}px` }}
                        className="font-display font-black tracking-[0.14em] fill-[#080d1a]"
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}

                {/* ---------------------------------------------------------
                    LINHA VERTICAL DE ALTITUDE 3D + SOMBRA DO VEÍCULO NO SOLO
                   --------------------------------------------------------- */}
                <line
                  ref={altitudeDropLineRef}
                  x1={WAYPOINTS.cuiaba.x}
                  y1={WAYPOINTS.cuiaba.y}
                  x2={WAYPOINTS.cuiaba.x}
                  y2={WAYPOINTS.cuiaba.y}
                  stroke="#dc143c"
                  strokeWidth="0.45"
                  strokeDasharray="1 1"
                  opacity="0"
                />

                <g ref={activeShadowGroupRef} opacity="0.25">
                  <ellipse cx="0" cy="0" rx="5.5" ry="2.2" fill="#08254c" />
                </g>

                {/* ---------------------------------------------------------
                    VEÍCULO 3D ATIVO EM MOVIMENTO (ÔNIBUS 3D OU AVIÃO 3D)
                   --------------------------------------------------------- */}
                <g ref={activeVehicleGroupRef}>
                  {/* Halo Luminoso sob o Veículo */}
                  <circle
                    cx="0"
                    cy="0"
                    r="8.5"
                    fill="#dc143c"
                    fillOpacity="0.16"
                  />

                  {/* MODELO 1: ÔNIBUS 3D ISOMÉTRICO (Cuiabá ➔ Brasília) */}
                  <g ref={busModelGroupRef} opacity="1">
                    {/* Sombra do chassi */}
                    <rect
                      x="-9.5"
                      y="-3.2"
                      width="19"
                      height="7.6"
                      rx="2.2"
                      fill="#08254c"
                      fillOpacity="0.35"
                    />
                    {/* Carroceria Superior 3D do Ônibus */}
                    <rect
                      x="-10"
                      y="-5.8"
                      width="20"
                      height="7.8"
                      rx="2.4"
                      fill="#f59e0b"
                      stroke="#08254c"
                      strokeWidth="0.65"
                    />
                    {/* Faixa Lateral Azul-Marinho */}
                    <rect x="-9.4" y="-1.2" width="18.8" height="1.8" fill="#003893" />
                    {/* Janelas Panorâmicas */}
                    <rect x="-8.2" y="-4.6" width="3.4" height="2.6" rx="0.5" fill="#e0f2fe" />
                    <rect x="-4.1" y="-4.6" width="3.4" height="2.6" rx="0.5" fill="#e0f2fe" />
                    <rect x="0.0" y="-4.6" width="3.4" height="2.6" rx="0.5" fill="#e0f2fe" />
                    <rect x="4.1" y="-4.6" width="4.4" height="2.8" rx="0.6" fill="#bae6fd" />
                    {/* Rodas 3D */}
                    <circle cx="-5.5" cy="2.2" r="1.9" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />
                    <circle cx="5.2" cy="2.2" r="1.9" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />
                    {/* Farol Dianteiro */}
                    <path
                      d="M 10 -3.5 L 16 -5.8 L 16 -1.0 Z"
                      fill="#fef08a"
                      fillOpacity="0.65"
                    />
                  </g>

                  {/* MODELO 2: AVIÃO COMERCIAL 3D (Brasília ➔ Lisboa ➔ Amsterdam ➔ Mumbai ➔ Kathmandu ➔ Biratnagar) */}
                  <g ref={planeModelGroupRef} opacity="0">
                    {/* Trilha de Condensação (Contrail) */}
                    <line
                      x1="-18"
                      y1="-2.2"
                      x2="-6"
                      y2="-2.2"
                      stroke="#dc143c"
                      strokeOpacity="0.55"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeDasharray="1.5 1.5"
                    />
                    <line
                      x1="-18"
                      y1="2.2"
                      x2="-6"
                      y2="2.2"
                      stroke="#dc143c"
                      strokeOpacity="0.55"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeDasharray="1.5 1.5"
                    />
                    {/* Fuselagem e Asas Swept-Wing 3D (orientadas para +X = 0 deg) */}
                    <path
                      d="M 11.5 0
                         C 11.5 -1.3, 8.2 -1.9, 4.5 -1.9
                         L -1.5 -10.8 L -4.2 -10.8 L -1.2 -1.9
                         L -7.2 -1.6 L -9.8 -5.2 L -11.4 -5.2 L -9.6 0
                         L -11.4 5.2 L -9.8 5.2 L -7.2 1.6
                         L -1.2 1.9 L -4.2 10.8 L -1.5 10.8
                         L 4.5 1.9 C 8.2 1.9, 11.5 1.3, 11.5 0 Z"
                      fill="#dc143c"
                      stroke="#ffffff"
                      strokeWidth="0.65"
                      strokeLinejoin="round"
                    />
                    {/* Detalhe Superior da Fuselagem e Cockpit */}
                    <path
                      d="M 9.8 0 C 9.8 -0.65, 6.5 -0.9, 1.5 -0.9 L -7.5 -0.6 L -7.5 0.6 L 1.5 0.9 C 6.5 0.9, 9.8 0.65, 9.8 0 Z"
                      fill="#ffffff"
                    />
                    <path
                      d="M 7.8 -0.55 L 9.2 0 L 7.8 0.55 Z"
                      fill="#003893"
                    />
                  </g>

                  {/* Etiqueta Flutuante 3D sobre o Veículo */}
                  <g transform="translate(0, -13.5)">
                    <rect
                      x="-22"
                      y="-4.8"
                      width="44"
                      height="6.8"
                      rx="3.4"
                      fill="#080d1a"
                      fillOpacity="0.88"
                      stroke="#ffffff"
                      strokeWidth="0.35"
                    />
                    <text
                      ref={vehicleBadgeTextRef}
                      x="0"
                      y="-0.3"
                      textAnchor="middle"
                      className="font-display text-[2.45px] font-black tracking-[0.14em] fill-white"
                    >
                      ÔNIBUS · CUIABÁ ➔ BRASÍLIA
                    </text>
                  </g>
                </g>
              </g>
            </svg>
          </div>

          {/* ===================================================================
              3. CABEÇALHO DO SLIDE ("MISSÃO NEPAL" + TÍTULO "A VIAGEM")
             =================================================================== */}
          <CanvaFlowLayer
            speed="slow"
            className="pointer-events-none absolute top-[40px] left-[64px] right-[64px] z-30 flex items-start justify-between"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1.5">
                <MorphElement layoutId="hero-main-title">
                  <span className="font-display text-[22px] font-black uppercase tracking-[0.22em] text-[#003893]">
                    MISSÃO NEPAL
                  </span>
                </MorphElement>
                <span className="text-[#0f0f0f]/35 font-bold">·</span>
                <span className="font-display text-[15px] font-bold uppercase tracking-[0.2em] text-[#dc143c]">
                  ROTA INTERCONTINENTAL 3D
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`journey-header-${activeStage}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                >
                  <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
                    {currentInfo.title}
                  </h2>
                  <p className="font-sans text-[19.5px] font-medium text-[#2f3136]/85 mt-1">
                    {currentInfo.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              disablePulse={true}
              className="px-6 py-3.5 flex flex-col items-end text-right"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#003893]">
                {currentInfo.stepBadge}
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#0f0f0f]/75 mt-1 tabular-nums">
                {currentInfo.coords}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              4. PAINEL ESQUERDO EM LIQUID GLASS:
                 - 4 Estatísticas Globais da Viagem (+60h só de ida, 2 Ônibus, 11 Voos, 7 Países)
                 - Card Detalhado do Trecho Ativo + Linha do Tempo das 7 Cidades
             =================================================================== */}
          <CanvaFlowLayer
            speed="fast"
            delay={0.08}
            className="pointer-events-none absolute left-[64px] top-[198px] bottom-[106px] z-30 w-[535px] flex flex-col justify-between gap-4"
          >
            {/* BLOCO A: Os 4 Números de Impacto da Viagem (Sempre Visíveis) */}
            <LiquidGlassContainer
              intensity="strong"
              tint="light"
              disablePulse={true}
              className="p-5"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#08254c]/12">
                <span className="font-display text-[11.5px] font-black uppercase tracking-[0.22em] text-[#003893]">
                  BALANÇO GERAL DA EXPEDIÇÃO
                </span>
                <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#dc143c]">
                  BRASIL ⇄ NEPAL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Stat 1: +60 Horas só de ida */}
                <div className="rounded-2xl bg-[#003893]/[0.07] border border-[#003893]/20 px-4 py-3 flex flex-col justify-between">
                  <span className="font-display text-[32px] font-black tracking-tight text-[#dc143c] leading-none tabular-nums">
                    +60 HORAS
                  </span>
                  <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#080d1a]/80 mt-1.5">
                    DE VIAGEM SÓ DE IDA
                  </span>
                </div>

                {/* Stat 2: 7 Países Diferentes */}
                <div className="rounded-2xl bg-[#003893]/[0.07] border border-[#003893]/20 px-4 py-3 flex flex-col justify-between">
                  <span className="font-display text-[32px] font-black tracking-tight text-[#003893] leading-none tabular-nums">
                    7 PAÍSES
                  </span>
                  <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#080d1a]/80 mt-1.5">
                    DIFERENTES NA JORNADA
                  </span>
                </div>

                {/* Stat 3: 2 Ônibus */}
                <div className="rounded-2xl bg-white/65 border border-[#08254c]/15 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-display text-[28px] font-black text-[#080d1a] leading-none tabular-nums">
                      2
                    </span>
                    <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#08254c] ml-2">
                      ÔNIBUS
                    </span>
                  </div>
                  <span className="font-sans text-[11.5px] font-bold text-[#f59e0b] uppercase tracking-wider">
                    Terrestre
                  </span>
                </div>

                {/* Stat 4: 11 Voos */}
                <div className="rounded-2xl bg-white/65 border border-[#08254c]/15 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-display text-[28px] font-black text-[#003893] leading-none tabular-nums">
                      11
                    </span>
                    <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#003893] ml-2">
                      VOOS
                    </span>
                  </div>
                  <span className="font-sans text-[11.5px] font-bold text-[#dc143c] uppercase tracking-wider">
                    Aéreo Total
                  </span>
                </div>
              </div>
            </LiquidGlassContainer>

            {/* BLOCO B: Card Dinâmico do Trecho Atual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`leg-card-${activeStage}`}
                initial={{ opacity: 0, x: -28, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -20, y: -8 }}
                transition={{ type: 'spring', stiffness: 115, damping: 20 }}
              >
                <LiquidGlassContainer
                  intensity="strong"
                  tint="light"
                  disablePulse={true}
                  className="p-6"
                >
                  <div className="flex items-center justify-between border-b border-[#08254c]/15 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-md font-display text-[10.5px] font-black uppercase tracking-[0.16em] text-white ${
                          currentInfo.transportType === 'bus'
                            ? 'bg-[#f59e0b]'
                            : currentInfo.transportType === 'plane'
                            ? 'bg-[#003893]'
                            : 'bg-[#dc143c]'
                        }`}
                      >
                        {currentInfo.transportType === 'bus'
                          ? 'ÔNIBUS'
                          : currentInfo.transportType === 'plane'
                          ? 'AVIÃO'
                          : 'IDA + VOLTA'}
                      </span>
                      <span className="font-display text-[13px] font-black uppercase tracking-[0.12em] text-[#080d1a]">
                        {currentInfo.routeHeader}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2.5">
                    <span className="font-display text-[38px] font-black tracking-tight text-[#003893] leading-none tabular-nums">
                      {currentInfo.legMetric}
                    </span>
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#dc143c] text-right max-w-[230px]">
                      {currentInfo.legMetricLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-[18.5px] font-extrabold uppercase tracking-tight text-[#080d1a] mb-1">
                    {currentInfo.cardTitle}
                  </h3>
                  <p className="font-sans text-[15px] font-medium text-[#11151c]/90 leading-relaxed">
                    {currentInfo.cardBody}
                  </p>
                </LiquidGlassContainer>
              </motion.div>
            </AnimatePresence>

            {/* BLOCO C: Roteiro Sequencial da Ida (Cuiabá ➔ Biratnagar) */}
            <LiquidGlassContainer
              intensity="medium"
              tint="navy"
              disablePulse={true}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-display text-[10.5px] font-black uppercase tracking-[0.2em] text-[#003893]">
                  ITINERÁRIO DE IDA · 6 CONEXÕES SEQUENCIAIS
                </span>
                <span className="font-display text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#dc143c]">
                  1 ÔNIBUS + 5 VOOS NA IDA
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                {ORDERED_WAYPOINTS.map((wp, idx) => {
                  const isActiveStop =
                    activeStage === 6 ||
                    (activeStage < 6 &&
                      (JOURNEY_LEGS[activeStage].from.id === wp.id ||
                        JOURNEY_LEGS[activeStage].to.id === wp.id));
                  const isPassed = activeStage + 1 >= idx || activeStage === 6;

                  return (
                    <React.Fragment key={wp.id}>
                      <div
                        className={`flex flex-col items-center px-2 py-1.5 rounded-xl transition-all ${
                          isActiveStop
                            ? 'bg-[#003893] text-white shadow-sm'
                            : isPassed
                            ? 'bg-white/70 text-[#080d1a]'
                            : 'bg-white/30 text-[#080d1a]/45'
                        }`}
                      >
                        <span className="font-display text-[10px] font-black tracking-wider leading-none">
                          {wp.code.split(' ')[0]}
                        </span>
                        <span
                          className={`font-sans text-[9px] font-bold mt-0.5 leading-none ${
                            isActiveStop ? 'text-white/90' : 'text-[#08254c]/75'
                          }`}
                        >
                          {wp.name.charAt(0) + wp.name.slice(1).toLowerCase()}
                        </span>
                      </div>

                      {idx < ORDERED_WAYPOINTS.length - 1 && (
                        <span
                          className={`font-display text-[11px] font-black ${
                            idx === 0 ? 'text-[#f59e0b]' : 'text-[#dc143c]'
                          }`}
                        >
                          ➔
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              5. BARRA INTERATIVA DE ETAPAS NO RODAPÉ (OCULTA POR PADRÃO, REVELA NO HOVER)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto group absolute left-0 bottom-0 z-40 pt-8 pr-12 pl-[64px] pb-[24px]"
          >
            <div className="flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
              {([0, 1, 2, 3, 4, 5, 6] as JourneyStage[]).map((stageIdx) => {
                const isCurrent = activeStage === stageIdx;
                const labels = [
                  '01. Ônibus CGB➔BSB',
                  '02. Voo BSB➔LIS',
                  '03. Voo LIS➔AMS',
                  '04. Voo AMS➔BOM',
                  '05. Voo BOM➔KTM',
                  '06. Voo KTM➔BIR',
                  '07. Rota Completa (+60h)',
                ];
                return (
                  <button
                    key={stageIdx}
                    type="button"
                    onClick={() => setManualStage(stageIdx)}
                    className={`px-3.5 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 border ${
                      isCurrent
                        ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                        : 'bg-white/55 text-[#08254c] border-white/80 hover:bg-white/80 backdrop-blur-md shadow-sm'
                    }`}
                  >
                    {labels[stageIdx]}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  if (activeStage < 6) {
                    setManualStage(((activeStage + 1) as JourneyStage));
                  } else {
                    setManualStage(0);
                  }
                }}
                className="ml-1 px-4 py-1.5 rounded-full bg-[#dc143c] hover:bg-[#b81032] text-white font-display text-[12px] font-extrabold uppercase tracking-wider shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {activeStage < 6 ? 'Próximo Trecho ➔' : 'Reiniciar Rota ↻'}
              </button>
            </div>
          </div>
        </div>
      </SlideStage>
    </>
  );
});

export const Slide05TheJourney: React.FC = () => {
  return (
    <Slide backgroundColor="#f4f2eb" padding={0}>
      <Slide05TheJourneyContent />
    </Slide>
  );
};

export default Slide05TheJourney;
