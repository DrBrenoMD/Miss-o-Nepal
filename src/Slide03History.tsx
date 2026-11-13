import React, { useState, useEffect } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';

export type HistoryStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface TimelineStepData {
  step: HistoryStep;
  eraShort: string;
  periodTitle: string;
  headline: string;
  iconType: 'lotus' | 'shield-swords' | 'medical-bag' | 'dove' | 'handcuffs' | 'raised-fist';
  iconLabel: string;
  imageUrl: string;
  imageCaption: string;
  description: string;
  statTargetValue: number;
  statSecondTargetValue?: number;
  statPrefix?: string;
  statSuffix: string;
  statPercentTarget: number;
  statPercentText: string;
  statContextNote: string;
  accentColor: 'navy' | 'crimson';
  trailY: number;
  trailX: number;
}

const TIMELINE_STEPS: TimelineStepData[] = [
  {
    step: 0,
    eraShort: 'Séc. VI a.C.',
    periodTitle: 'Séc. VI a.C. - O Berço Sagrado',
    headline: 'O BERÇO SAGRADO',
    iconType: 'lotus',
    iconLabel: 'Flor de Lótus · Lumbini',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Lumbini_Maya_Devi_Temple.jpg',
    imageCaption: 'Templo Maya Devi em Lumbini — Local de nascimento de Sidarta Gautama (Buda)',
    description:
      'Nascimento de Buda em Lumbini. Início de milênios de sincretismo profundo entre hinduísmo e budismo.',
    statTargetValue: 0,
    statSuffix: 'cristãos',
    statPercentTarget: 0,
    statPercentText: '0% da população',
    statContextNote: 'Milênios de tradição hindu-budista sem presença cristã documentada',
    accentColor: 'navy',
    trailX: 205,
    trailY: 255,
  },
  {
    step: 1,
    eraShort: '1768 – 1846',
    periodTitle: '1768 a 1846 - Unificação e Expulsão',
    headline: 'UNIFICAÇÃO E EXPULSÃO',
    iconType: 'shield-swords',
    iconLabel: 'Escudo & Espadas Cruzadas',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Prithvi_Narayan_Shah.jpg',
    imageCaption: 'Rei Prithvi Narayan Shah — Unificador do Reino Hindu do Nepal (1768)',
    description:
      'O Nepal é unificado como um Reino Hindu estrito. O país se isola e os primeiros missionários católicos (capuchinhos) são expulsos. Conversão vira crime contra o Estado.',
    statTargetValue: 0,
    statPrefix: '~ ',
    statSuffix: 'cristãos',
    statPercentTarget: 0,
    statPercentText: '0%',
    statContextNote: 'Fronteiras fechadas · Conversão criminalizada pelo Estado Hindu',
    accentColor: 'navy',
    trailX: 248,
    trailY: 382,
  },
  {
    step: 2,
    eraShort: '1951',
    periodTitle: '1951 - Abertura Restrita',
    headline: 'ABERTURA RESTRITA',
    iconType: 'medical-bag',
    iconLabel: 'Missões Médicas & Educação',
    imageUrl:
      'https://images.unsplash.com/photo-1538100812368-24cc5c26dd0b?auto=format&fit=crop&w=600&q=80',
    imageCaption: 'Hospitais missionários e escolas: serviço social com igreja em células subterrâneas',
    description:
      'Fronteiras reabrem. Missionários entram para áreas de saúde e educação, mas a pregação segue proibida. A igreja atua de forma 100% clandestina (células).',
    statTargetValue: 0,
    statSuffix: 'cristãos',
    statPercentTarget: 0,
    statPercentText: '0%',
    statContextNote: 'Oficial - Primeiro Censo do Nepal (Igreja 100% clandestina em células)',
    accentColor: 'navy',
    trailX: 196,
    trailY: 508,
  },
  {
    step: 3,
    eraShort: '2008 – 2011',
    periodTitle: '2008 a 2011 - O Boom e a Primavera Laica',
    headline: 'O BOOM E A PRIMAVERA LAICA',
    iconType: 'dove',
    iconLabel: 'Pomba da Liberdade · República Laica',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/1/1d/Nepalese_Constituent_Assembly_2008.jpg',
    imageCaption: 'Assembleia Constituinte de 2008 — Fim da monarquia e declaração da República Laica',
    description:
      'Fim da monarquia. O Nepal vira República Laica. A igreja sai da clandestinidade. Uma adesão massiva ocorre, especialmente das castas mais baixas (Dalits) buscando dignidade e igualdade.',
    statTargetValue: 375699,
    statSuffix: 'cristãos',
    statPercentTarget: 1.42,
    statPercentText: '1,42%',
    statContextNote: 'Censo de 2011 - Explosão de crescimento',
    accentColor: 'crimson',
    trailX: 254,
    trailY: 634,
  },
  {
    step: 4,
    eraShort: '2018 – 2021',
    periodTitle: '2018 a 2021 - O Retrocesso Legal',
    headline: 'O RETROCESSO LEGAL',
    iconType: 'handcuffs',
    iconLabel: 'Algemas · Lei Anticonversão (2018)',
    imageUrl:
      'https://images.unsplash.com/photo-1534438097544-e513514c330c?auto=format&fit=crop&w=600&q=80',
    imageCaption: 'Código Penal de 2018 — Criminalização do proselitismo com pena de até 5 anos de prisão',
    description:
      'Nacionalistas aprovam um novo Código Penal criminalizando o proselitismo (até 5 anos de prisão). No Censo de 2021, o medo gera forte subnotificação oficial.',
    statTargetValue: 512313,
    statSuffix: 'cristãos',
    statPercentTarget: 1.76,
    statPercentText: '1,76%',
    statContextNote: 'Censo 2021 - Subnotificado por medo da lei',
    accentColor: 'navy',
    trailX: 198,
    trailY: 760,
  },
  {
    step: 5,
    eraShort: 'HOJE (2025–2026)',
    periodTitle: 'HOJE (2025-2026) - Caos e Esperança',
    headline: 'CAOS E ESPERANÇA',
    iconType: 'raised-fist',
    iconLabel: 'Punho Erguido & Resgate Humanitário',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Flood_in_Nepal.jpg',
    imageCaption: 'Enchentes e mobilização jovem no Nepal — Ajuda humanitária cristã na linha de frente',
    description:
      "Após a 'Revolução Gen Z' (2025) que derrubou o governo e as trágicas enchentes de 2026, as missões cristãs de ajuda humanitária encontram um terreno fértil de jovens sedentos por esperança, superando o medo das prisões.",
    statTargetValue: 1000000,
    statSecondTargetValue: 1500000,
    statSuffix: '+ cristãos',
    statPercentTarget: 5.0,
    statPercentText: '3% a 5%',
    statContextNote: 'Estimativas reais não-oficiais',
    accentColor: 'crimson',
    trailX: 246,
    trailY: 886,
  },
];

/**
 * Ícones SVG em Line-Art Azul-Marinho e Vermelho Carmesim para o Morphing (`layoutId="timeline-icon"`)
 */
const TimelineMorphIconSVG: React.FC<{
  type: TimelineStepData['iconType'];
  className?: string;
}> = ({ type, className = 'w-full h-full' }) => {
  const drawAnim = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.95, ease: 'easeInOut' as const },
  };

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Halo circular técnico de fundo */}
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke="#003893"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {type === 'lotus' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Pétala Central da Flor de Lótus */}
          <motion.path
            d="M 60 22 C 72 38, 74 58, 60 78 C 46 58, 48 38, 60 22 Z"
            fill="#003893"
            fillOpacity="0.10"
            {...drawAnim}
          />
          {/* Pétalas Intermediárias Esquerda e Direita */}
          <motion.path
            d="M 60 78 C 42 74, 30 56, 36 36 C 46 42, 52 54, 60 78 Z"
            fill="#dc143c"
            fillOpacity="0.12"
            {...drawAnim}
          />
          <motion.path
            d="M 60 78 C 78 74, 90 56, 84 36 C 74 42, 68 54, 60 78 Z"
            fill="#dc143c"
            fillOpacity="0.12"
            {...drawAnim}
          />
          {/* Pétalas Externas Abertas */}
          <motion.path
            d="M 60 78 C 34 78, 18 66, 18 50 C 30 52, 42 62, 60 78 Z"
            {...drawAnim}
          />
          <motion.path
            d="M 60 78 C 86 78, 102 66, 102 50 C 90 52, 78 62, 60 78 Z"
            {...drawAnim}
          />
          {/* Base de ondas sagradas de Lumbini */}
          <motion.path
            d="M 26 88 C 40 83, 52 91, 60 87 C 68 91, 80 83, 94 88 M 36 96 C 48 93, 72 93, 84 96"
            stroke="#dc143c"
            strokeWidth="2.8"
            {...drawAnim}
          />
          <circle cx="60" cy="48" r="3.5" fill="#dc143c" stroke="none" />
        </g>
      )}

      {type === 'shield-swords' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Duas Espadas Cruzadas em diagonal atrás do escudo */}
          <motion.path
            d="M 22 96 L 94 24 M 82 22 L 96 22 L 96 36 M 20 84 L 34 98"
            stroke="#dc143c"
            strokeWidth="3.2"
            {...drawAnim}
          />
          <motion.path
            d="M 98 96 L 26 24 M 38 22 L 24 22 L 24 36 M 100 84 L 86 98"
            stroke="#dc143c"
            strokeWidth="3.2"
            {...drawAnim}
          />
          {/* Escudo Real Hindu Central */}
          <motion.path
            d="M 60 24 L 88 35 V 58 C 88 77, 74 91, 60 98 C 46 91, 32 77, 32 58 V 35 L 60 24 Z"
            fill="#f4f2eb"
            fillOpacity="0.92"
            {...drawAnim}
          />
          <motion.path
            d="M 60 32 L 80 40 V 57 C 80 71, 69 82, 60 88 C 51 82, 40 71, 40 57 V 40 L 60 32 Z"
            fill="#003893"
            fillOpacity="0.14"
            stroke="#003893"
            strokeWidth="2.2"
            {...drawAnim}
          />
          <circle cx="60" cy="58" r="6" fill="#dc143c" stroke="#08254c" strokeWidth="2.2" />
        </g>
      )}

      {type === 'medical-bag' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Alça Superior da Maleta Médica */}
          <motion.path
            d="M 44 38 V 29 C 44 24.5, 47.5 21, 52 21 H 68 C 72.5 21, 76 24.5, 76 29 V 38"
            {...drawAnim}
          />
          {/* Corpo da Maleta Médica / Hospital */}
          <motion.rect
            x="22"
            y="38"
            width="76"
            height="56"
            rx="11"
            fill="#003893"
            fillOpacity="0.10"
            {...drawAnim}
          />
          {/* Tiras laterais de couro da maleta */}
          <motion.path d="M 36 38 V 94 M 84 38 V 94" stroke="#003893" strokeWidth="2.2" {...drawAnim} />
          {/* Cruz Vermelha de Saúde e Missão */}
          <motion.path
            d="M 55 51 H 65 V 61 H 75 V 71 H 65 V 81 H 55 V 71 H 45 V 61 H 55 V 51 Z"
            fill="#dc143c"
            fillOpacity="0.28"
            stroke="#dc143c"
            strokeWidth="2.8"
            {...drawAnim}
          />
        </g>
      )}

      {type === 'dove' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Raios de Liberdade Laica */}
          <motion.path
            d="M 60 16 V 24 M 34 24 L 40 30 M 86 24 L 80 30"
            stroke="#dc143c"
            strokeWidth="2.6"
            {...drawAnim}
          />
          {/* Corpo e Asas Abertas da Pomba Voando Alto */}
          <motion.path
            d="M 88 46 C 81 44, 75 47, 72 52 C 67 36, 51 26, 32 28 C 40 40, 44 50, 43 58 C 31 54, 21 57, 16 65 C 27 68, 37 69, 45 73 C 39 81, 30 87, 22 90 C 37 92, 53 88, 65 78 C 76 70, 84 58, 92 52 L 101 49 L 93 45 Z"
            fill="#003893"
            fillOpacity="0.14"
            {...drawAnim}
          />
          {/* Ramo de Oliveira no bico */}
          <motion.path
            d="M 96 50 C 102 54, 105 60, 103 67 M 101 56 C 106 54, 109 56, 107 60"
            stroke="#dc143c"
            strokeWidth="2.5"
            {...drawAnim}
          />
          <circle cx="84" cy="48" r="2" fill="#08254c" stroke="none" />
        </g>
      )}

      {type === 'handcuffs' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Elo Central de Corrente Tensa */}
          <motion.path
            d="M 48 42 L 56 34 M 64 34 L 72 42 M 53 37 H 67"
            stroke="#dc143c"
            strokeWidth="3.2"
            {...drawAnim}
          />
          {/* Algema Esquerda Fechada */}
          <motion.circle
            cx="37"
            cy="66"
            r="19"
            fill="#003893"
            fillOpacity="0.12"
            {...drawAnim}
          />
          <circle cx="37" cy="66" r="11" stroke="#08254c" strokeWidth="2.4" />
          <path d="M 41 47 L 48 40 L 54 46 L 47 53" fill="#f4f2eb" />

          {/* Algema Direita Fechada */}
          <motion.circle
            cx="83"
            cy="66"
            r="19"
            fill="#003893"
            fillOpacity="0.12"
            {...drawAnim}
          />
          <circle cx="83" cy="66" r="11" stroke="#08254c" strokeWidth="2.4" />
          <path d="M 79 47 L 72 40 L 66 46 L 73 53" fill="#f4f2eb" />

          {/* Fechaduras vermelhas nas algemas */}
          <circle cx="48" cy="48" r="2.2" fill="#dc143c" stroke="none" />
          <circle cx="72" cy="48" r="2.2" fill="#dc143c" stroke="none" />
        </g>
      )}

      {type === 'raised-fist' && (
        <g stroke="#08254c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Cruz / Farol de Resgate e Esperança no topo */}
          <motion.path
            d="M 60 14 V 30 M 52 22 H 68 M 34 26 L 41 32 M 86 26 L 79 32"
            stroke="#dc143c"
            strokeWidth="3.2"
            {...drawAnim}
          />
          {/* Punho Erguido / Mão de Resgate Solidário */}
          <motion.path
            d="M 42 54 V 43 C 42 39.5, 47 39.5, 47 43 V 52
               M 47 41 C 47 37.5, 53 37.5, 53 41 V 52
               M 53 39 C 53 35.5, 59 35.5, 59 39 V 52
               M 59 41 C 59 37.5, 65 37.5, 65 41 V 55
               M 42 52 C 37 52, 35 56, 37 62 L 43 74 V 88 H 73 V 72 L 78 58 C 80 52, 75 48, 70 52 L 65 56 H 46"
            fill="#003893"
            fillOpacity="0.15"
            {...drawAnim}
          />
          {/* Linha dos dedos dobrados */}
          <motion.path d="M 42 52 H 65 C 68 52, 68 58, 63 59 H 47" {...drawAnim} />
          {/* Ondas das Enchentes de 2026 superadas na base */}
          <motion.path
            d="M 20 92 C 32 86, 44 96, 58 90 C 72 84, 84 96, 100 90 M 28 100 C 42 95, 56 103, 70 98 C 80 94, 90 100, 96 98"
            stroke="#003893"
            strokeWidth="2.8"
            {...drawAnim}
          />
        </g>
      )}
    </svg>
  );
};

/**
 * Contador Animado de Estatística Cristã
 * Anima rapidamente de 0 até o número atual do Step sempre que o step muda.
 */
const AnimatedChristianStatCard: React.FC<{ data: TimelineStepData }> = ({ data }) => {
  const [displayCount1, setDisplayCount1] = useState(0);
  const [displayCount2, setDisplayCount2] = useState(0);

  useEffect(() => {
    setDisplayCount1(0);
    setDisplayCount2(0);

    if (data.statTargetValue === 0) {
      return;
    }

    const controls1 = animate(0, data.statTargetValue, {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayCount1(Math.round(v)),
    });

    let controls2: ReturnType<typeof animate> | undefined;
    if (data.statSecondTargetValue) {
      controls2 = animate(0, data.statSecondTargetValue, {
        duration: 1.25,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setDisplayCount2(Math.round(v)),
      });
    }

    return () => {
      controls1.stop();
      controls2?.stop();
    };
  }, [data]);

  const formattedNumber =
    data.statTargetValue === 0
      ? `${data.statPrefix ?? ''}0 ${data.statSuffix}`
      : data.statSecondTargetValue
        ? `${displayCount1.toLocaleString('pt-BR')} a ${displayCount2.toLocaleString('pt-BR')}${data.statSuffix}`
        : `${displayCount1.toLocaleString('pt-BR')} ${data.statSuffix}`;

  const isBoomOrToday = data.accentColor === 'crimson';
  const progressBarPercent = Math.max(3, Math.min(100, (data.statPercentTarget / 5.0) * 100));

  return (
    <motion.div
      key={`stat-badge-${data.step}`}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 130, damping: 18 }}
      className="relative overflow-hidden rounded-[28px] bg-white/65 backdrop-blur-xl border border-white/90 px-8 py-6 shadow-xl"
    >
      {/* Faixa lateral de destaque (Vermelho Nepal ou Azul Marinho) */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2.5 ${
          isBoomOrToday ? 'bg-[#dc143c]' : 'bg-[#003893]'
        }`}
      />

      <div className="flex items-center justify-between gap-6 pl-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-display text-[12px] font-black uppercase tracking-[0.22em] text-[#08254c]/75">
              EVOLUÇÃO DA POPULAÇÃO CRISTÃ NO NEPAL
            </span>
            <span className="text-[#08254c]/30">·</span>
            <span
              className={`font-display text-[12px] font-extrabold uppercase tracking-[0.16em] ${
                isBoomOrToday ? 'text-[#dc143c]' : 'text-[#003893]'
              }`}
            >
              PASSO 0{data.step + 1} / 06
            </span>
          </div>

          {/* Número Principal Animado */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span
              className={`font-display text-[44px] font-black tracking-tight leading-none tabular-nums ${
                isBoomOrToday ? 'text-[#dc143c]' : 'text-[#003893]'
              }`}
            >
              {formattedNumber}
            </span>

            <span
              className={`px-4 py-1.5 rounded-full font-display text-[22px] font-black tracking-tight tabular-nums ${
                isBoomOrToday
                  ? 'bg-[#dc143c]/12 text-[#dc143c] border border-[#dc143c]/30'
                  : 'bg-[#003893]/12 text-[#003893] border border-[#003893]/25'
              }`}
            >
              ({data.statPercentText})
            </span>
          </div>

          <p className="font-sans text-[15.5px] font-semibold text-[#1e2430]/85 mt-2">
            {data.statContextNote}
          </p>
        </div>

        {/* Mini Gráfico de Evolução Proporcional (0% a 5%) */}
        <div className="w-[230px] shrink-0 flex flex-col items-end">
          <div className="w-full flex justify-between text-[11px] font-display font-extrabold uppercase tracking-wider text-[#08254c]/70 mb-1.5">
            <span>0% (Séc. VI a.C.)</span>
            <span className={isBoomOrToday ? 'text-[#dc143c]' : 'text-[#003893]'}>
              {data.statPercentText}
            </span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-[#08254c]/10 overflow-hidden p-0.5 border border-[#08254c]/15">
            <motion.div
              initial={{ width: '3%' }}
              animate={{ width: `${progressBarPercent}%` }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${
                data.statTargetValue === 0
                  ? 'bg-[#08254c]/35'
                  : isBoomOrToday
                    ? 'bg-gradient-to-r from-[#003893] to-[#dc143c]'
                    : 'bg-[#003893]'
              }`}
            />
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#08254c]/60 mt-1.5">
            Escala demográfica (0% → 5% pop.)
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const Slide03HistoryContent: React.FC = () => {
  // 6 passos totais: estado inicial (0) + 5 steps do Spectacle (1..5)
  const { step, placeholder } = useSteps(5);
  const [manualStep, setManualStep] = useState<HistoryStep | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setManualStep(null);
  }, [step]);

  const safeSpectacleStep =
    typeof step === 'number' && Number.isFinite(step)
      ? (Math.max(0, Math.min(5, Math.round(step + 1))) as HistoryStep)
      : 0;

  const activeStep: HistoryStep =
    manualStep !== null && TIMELINE_STEPS[manualStep] ? manualStep : safeSpectacleStep;

  const currentData = TIMELINE_STEPS[activeStep] ?? TIMELINE_STEPS[0];

  // Fração vertical de desenho da trilha (de 0.16 no Passo 0 até 1.0 no Passo 5)
  const trailProgress = 0.15 + (activeStep / 5) * 0.85;

  const handleAdvanceStepOrReset = () => {
    if (activeStep < 5) {
      setManualStep(((activeStep + 1) as HistoryStep));
    } else {
      setManualStep(0);
    }
  };

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-03-history" className="bg-[#f4f2eb]">
        <div
          onClick={handleAdvanceStepOrReset}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA DE FORMAS E LINHAS AO FUNDO (VISÍVEIS ATRAVÉS DO LIQUID GLASS)
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <motion.div
              animate={{
                x: [0, 50, -30, 0],
                y: [0, -40, 30, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              className="absolute right-[420px] top-[190px] w-[420px] h-[420px] rounded-full bg-[#003893]/16 blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -45, 35, 0],
                y: [0, 45, -25, 0],
              }}
              transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1.2 }}
              className="absolute right-[140px] bottom-[140px] w-[380px] h-[380px] rounded-full bg-[#dc143c]/15 blur-3xl"
            />

            {/* Linhas topográficas sutis de fundo atravessando a área do card Liquid Glass */}
            <svg viewBox="0 0 1920 1080" className="w-full h-full opacity-20" fill="none">
              <path
                d="M 620 220 C 920 180, 1240 310, 1560 240 C 1720 205, 1840 250, 1950 220"
                stroke="#003893"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
              <path
                d="M 600 540 C 940 460, 1280 620, 1620 520 C 1760 480, 1860 530, 1950 500"
                stroke="#dc143c"
                strokeWidth="1.8"
                strokeDasharray="6 10"
              />
              <path
                d="M 620 820 C 960 750, 1320 890, 1680 790 C 1800 755, 1880 790, 1950 770"
                stroke="#08254c"
                strokeWidth="1.6"
              />
              <circle cx="1280" cy="540" r="340" stroke="#003893" strokeWidth="1.4" strokeDasharray="5 9" />
            </svg>
          </div>

          {/* ===================================================================
              2. CABEÇALHO DO SLIDE 3 (CONECTADO VIA MORPH E CANVA FLOW)
             =================================================================== */}
          <CanvaFlowLayer
            speed="slow"
            className="pointer-events-none absolute top-[42px] left-[64px] right-[64px] z-30 flex items-start justify-between"
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
                  LINHA DO TEMPO HISTÓRICA &amp; LIBERDADE RELIGIOSA
                </span>
              </div>

              <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.04]">
                DO ISOLAMENTO AO DESPERTAR ESPIRITUAL
              </h2>
            </div>

            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              className="px-6 py-3 flex flex-col items-end text-right"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#003893]">
                CRONOLOGIA · PASSO 0{activeStep + 1} DE 06
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#dc143c] mt-0.5">
                {currentData.eraShort}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              3. ESQUERDA: TRILHA / MONTANHA VERTICAL EM LINE-ART AZUL ESCURO
                 Desenha-se verticalmente (pathLength) conforme o step avança
             =================================================================== */}
          <CanvaFlowLayer
            speed="medium"
            delay={0.05}
            className="absolute left-0 top-0 bottom-0 w-[680px] z-20 pointer-events-none"
          >
            <svg
              viewBox="0 0 680 1080"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Silhueta da Cordilheira Vertical em Line-Art à Esquerda */}
              <g stroke="#08254c" strokeOpacity="0.22" strokeWidth="2.2" strokeLinejoin="round">
                <path d="M 55 190 L 145 140 L 210 185 L 295 130 L 365 195 L 330 310 L 385 415 L 325 535 L 390 655 L 335 785 L 380 915 L 290 965 L 65 965 Z" />
                <path
                  d="M 145 140 L 115 280 L 165 410 L 110 560 L 160 720 L 115 890 M 295 130 L 265 260 L 330 310 M 385 415 L 280 490 M 390 655 L 290 730"
                  strokeDasharray="4 6"
                />
              </g>

              {/* Trilha Guia Pontilhada Completa (Fundo) */}
              <path
                d="M 205 255 C 255 300, 265 340, 248 382 C 230 425, 180 465, 196 508 C 212 550, 270 590, 254 634 C 238 678, 182 715, 198 760 C 214 805, 260 845, 246 886"
                stroke="#08254c"
                strokeOpacity="0.22"
                strokeWidth="3.5"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />

              {/* Trilha Principal Ativa que vai se desenhando (pathLength) conforme o Step */}
              <motion.path
                d="M 205 255 C 255 300, 265 340, 248 382 C 230 425, 180 465, 196 508 C 212 550, 270 590, 254 634 C 238 678, 182 715, 198 760 C 214 805, 260 845, 246 886"
                stroke="#003893"
                strokeWidth="5.5"
                strokeLinecap="round"
                initial={{ pathLength: 0.15 }}
                animate={{ pathLength: trailProgress }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Filamento Vermelho Carmesim acompanhando o desenho da trilha */}
              <motion.path
                d="M 205 255 C 255 300, 265 340, 248 382 C 230 425, 180 465, 196 508 C 212 550, 270 590, 254 634 C 238 678, 182 715, 198 760 C 214 805, 260 845, 246 886"
                stroke="#dc143c"
                strokeWidth="2.2"
                strokeLinecap="round"
                initial={{ pathLength: 0.15 }}
                animate={{ pathLength: trailProgress }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Linha Conectora Horizontal do Nó Ativo até o Medalhão Central de Morph */}
              <motion.line
                x1={currentData.trailX}
                y1={currentData.trailY}
                x2={495}
                y2={currentData.trailY}
                stroke="#dc143c"
                strokeWidth="2.2"
                strokeDasharray="5 5"
                animate={{
                  x1: currentData.trailX,
                  y1: currentData.trailY,
                  y2: currentData.trailY,
                }}
                transition={{ type: 'spring', stiffness: 110, damping: 20 }}
              />

              {/* Estações da Linha do Tempo (Steps 0 a 5) */}
              {TIMELINE_STEPS.map((item) => {
                const isReached = item.step <= activeStep;
                const isCurrent = item.step === activeStep;

                return (
                  <g
                    key={item.step}
                    onClick={(e) => {
                      e.stopPropagation();
                      setManualStep(item.step);
                    }}
                    className="pointer-events-auto cursor-pointer group"
                  >
                    {/* Halo pulsante no step ativo */}
                    {isCurrent && (
                      <motion.circle
                        cx={item.trailX}
                        cy={item.trailY}
                        r="24"
                        stroke="#dc143c"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        animate={{ scale: [1, 1.22, 1], opacity: [0.85, 0.35, 0.85] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    <circle
                      cx={item.trailX}
                      cy={item.trailY}
                      r={isCurrent ? 13 : 9}
                      fill={isCurrent ? '#dc143c' : isReached ? '#003893' : '#f4f2eb'}
                      stroke="#08254c"
                      strokeWidth="3"
                    />

                    {/* Rótulo da Era ao lado de cada estação da trilha */}
                    <text
                      x={item.trailX - 26}
                      y={item.trailY + 5}
                      textAnchor="end"
                      className={`font-display text-[14px] uppercase tracking-[0.12em] transition-all ${
                        isCurrent
                          ? 'fill-[#dc143c] font-black text-[16px]'
                          : isReached
                            ? 'fill-[#08254c] font-extrabold'
                            : 'fill-[#08254c]/45 font-bold'
                      }`}
                    >
                      {item.eraShort}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* =================================================================
                4. CENTRO-ESQUERDA (SOBRE A TRILHA): ÍCONE SVG CENTRAL COM MORPHING
                   Usa `layoutId="timeline-icon"` para sofrer Morphing e deslizar
                   suavemente acompanhando a estação ativa da trilha!
               ================================================================= */}
            <div
              className="pointer-events-none absolute left-[415px] z-30"
              style={{
                top: `${Math.max(210, Math.min(790, currentData.trailY - 88))}px`,
              }}
            >
              <MorphElement
                layoutId="timeline-icon"
                transition={{
                  type: 'spring',
                  stiffness: 95,
                  damping: 18,
                }}
                className="flex flex-col items-center"
              >
                <LiquidGlassContainer
                  intensity="organic"
                  tint={currentData.accentColor === 'crimson' ? 'crimson' : 'navy'}
                  duration={5.5}
                  className="w-[176px] h-[176px] p-5 flex items-center justify-center shadow-2xl"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`morph-svg-${currentData.iconType}`}
                      initial={{ opacity: 0, scale: 0.72, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.72, rotate: 10 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[126px] h-[126px]"
                    >
                      <TimelineMorphIconSVG type={currentData.iconType} />
                    </motion.div>
                  </AnimatePresence>
                </LiquidGlassContainer>

                <motion.span
                  key={`icon-caption-${currentData.step}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 px-3.5 py-1 rounded-full bg-white/75 backdrop-blur-md border border-[#08254c]/15 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08254c] shadow-sm whitespace-nowrap"
                >
                  {currentData.iconLabel}
                </motion.span>
              </MorphElement>
            </div>
          </CanvaFlowLayer>

          {/* ===================================================================
              5. DIREITA (CONTEÚDO): <LiquidGlassContainer> EXPANDIDO
                 Layout Interno Exigido:
                 - Topo: Ano/Título
                 - Meio: Descrição à esquerda + Imagem à direita (borderRadius orgânico, object-fit: cover, FadeIn)
                 - Rodapé: Badge/Card de Estatística Cristã destacado com animação nos números
             =================================================================== */}
          <CanvaFlowLayer
            speed="fast"
            delay={0.1}
            className="pointer-events-none absolute right-[64px] top-[172px] bottom-[112px] w-[1190px] z-30 flex flex-col"
          >
            <LiquidGlassContainer
              intensity="strong"
              tint="light"
              duration={7}
              className="w-full h-full p-10 flex flex-col justify-between"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`timeline-card-step-${currentData.step}`}
                  initial={{ opacity: 0, x: 35, y: 8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -30, y: -8 }}
                  transition={{
                    duration: 0.48,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col justify-between h-[716px]"
                >
                  {/* ---------------------------------------------------------
                      TOPO DO CARD: ANO / TÍTULO
                     --------------------------------------------------------- */}
                  <div className="border-b border-[#08254c]/15 pb-5">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-display text-[13px] font-black uppercase tracking-[0.2em] ${
                          currentData.accentColor === 'crimson'
                            ? 'bg-[#dc143c] text-white'
                            : 'bg-[#003893] text-white'
                        }`}
                      >
                        PASSO 0{currentData.step + 1} · {currentData.eraShort}
                      </span>

                      <span className="font-mono text-[13px] font-bold uppercase tracking-widest text-[#08254c]/60">
                        HISTÓRIA POLÍTICA &amp; LIBERDADE RELIGIOSA
                      </span>
                    </div>

                    <h3 className="font-display text-[38px] font-black uppercase tracking-[-0.015em] text-[#080d1a] leading-[1.08]">
                      {currentData.periodTitle}
                    </h3>
                  </div>

                  {/* ---------------------------------------------------------
                      MEIO DO CARD: DESCRIÇÃO À ESQUERDA + IMAGEM À DIREITA
                     --------------------------------------------------------- */}
                  <div className="grid grid-cols-12 gap-8 items-center my-auto py-4">
                    {/* Coluna da Descrição (7 colunas) */}
                    <div className="col-span-7 flex flex-col justify-center pr-2">
                      <div className="inline-flex items-center gap-2 text-xs font-display font-extrabold uppercase tracking-[0.22em] text-[#003893] mb-3">
                        <span className="w-6 h-[2.5px] bg-[#dc143c] inline-block" />
                        <span>CONTEXTO HISTÓRICO E MISSÃO</span>
                      </div>

                      <p className="font-sans text-[25px] font-semibold text-[#11151c] leading-[1.48] tracking-[-0.005em]">
                        “{currentData.description}”
                      </p>

                      <div className="mt-6 flex items-center gap-3 text-[13px] font-sans font-semibold text-[#08254c]/75">
                        <span className="w-2 h-2 rounded-full bg-[#dc143c]" />
                        <span>{currentData.imageCaption}</span>
                      </div>
                    </div>

                    {/* Coluna da Imagem (5 colunas) com borderRadius orgânico e FadeIn */}
                    <div className="col-span-5 flex flex-col items-center">
                      <motion.div
                        key={`img-wrap-${currentData.step}`}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{
                          borderRadius: '38px 54px 42px 32px / 34px 48px 36px 52px',
                        }}
                        className="relative w-full h-[305px] overflow-hidden border-2 border-white/85 shadow-2xl bg-[#08254c]/10"
                      >
                        {!failedImages[currentData.step] ? (
                          <motion.img
                            key={currentData.imageUrl}
                            src={currentData.imageUrl}
                            alt={currentData.periodTitle}
                            referrerPolicy="no-referrer"
                            initial={{ opacity: 0, scale: 1.06 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [currentData.step]: true }))
                            }
                            style={{
                              borderRadius: '38px 54px 42px 32px / 34px 48px 36px 52px',
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#003893]/15 via-[#f4f2eb] to-[#dc143c]/15">
                            <div className="w-24 h-24 mb-2">
                              <TimelineMorphIconSVG type={currentData.iconType} />
                            </div>
                            <span className="font-display text-sm font-black uppercase tracking-wider text-[#08254c]">
                              {currentData.eraShort}
                            </span>
                          </div>
                        )}

                        {/* Overlay sutil de acabamento fotográfico */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08254c]/35 via-transparent to-white/10" />
                        <span className="pointer-events-none absolute bottom-3.5 left-5 right-5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white drop-shadow">
                          {currentData.eraShort} · REGISTRO HISTÓRICO
                        </span>
                      </motion.div>
                    </div>
                  </div>

                  {/* ---------------------------------------------------------
                      RODAPÉ DO CARD: BADGE / CARD DE ESTATÍSTICA CRISTÃ DESTACADO
                     --------------------------------------------------------- */}
                  <AnimatedChristianStatCard data={currentData} />
                </motion.div>
              </AnimatePresence>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              6. BARRA INTERATIVA DE NAVEGAÇÃO DOS 6 PASSOS NO RODAPÉ
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute left-[64px] bottom-[30px] z-40 flex items-center gap-2.5"
          >
            {TIMELINE_STEPS.map((item) => {
              const isCurrent = activeStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setManualStep(item.step)}
                  className={`px-3.5 py-2 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 border ${
                    isCurrent
                      ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                      : 'bg-white/40 text-[#08254c] border-white/75 hover:bg-white/65 backdrop-blur-md shadow-sm'
                  }`}
                >
                  0{item.step + 1}. {item.eraShort}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleAdvanceStepOrReset}
              className="ml-1.5 px-5 py-2 rounded-full bg-[#dc143c] hover:bg-[#b81032] text-white font-display text-[12px] font-extrabold uppercase tracking-wider shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              {activeStep < 5 ? 'Próximo Passo ➔' : 'Reiniciar Linha do Tempo ↻'}
            </button>
          </div>
        </div>
      </SlideStage>
    </>
  );
};

export const Slide03History: React.FC = () => {
  return (
    <Slide backgroundColor="#f4f2eb" padding={0}>
      <Slide03HistoryContent />
    </Slide>
  );
};

export default Slide03History;
