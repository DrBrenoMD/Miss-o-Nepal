import React, { useState, useEffect, memo } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

export type CulturalStage = 0 | 1 | 2 | 3 | 4 | 5;

interface CulturalPhotoItem {
  id: number;
  stageIndex: CulturalStage;
  src: string;
  orientation: 'horizontal' | 'vertical';
  badge: string;
  shortTitle: string;
  fullTitle: string;
  location: string;
  dayLabel: string;
  description: string;
  highlightDetail: string;
  objectPosition: string;
  accentColor: string;
}

const CULTURAL_PHOTOS: CulturalPhotoItem[] = [
  {
    id: 1,
    stageIndex: 1,
    src: '/assets/aistudio/image_dbcea859.png',
    orientation: 'horizontal',
    badge: 'MOMENTO 01 · ALINHAMENTO & ACOLHIDA',
    shortTitle: 'Reunião no Terraço',
    fullTitle: 'Integração da Equipe & Boas-Vindas em Kathmandu',
    location: 'KATHMANDU · TERRAÇO LOCAL',
    dayLabel: 'DIA 01 · IMERSÃO',
    description:
      'Logo após a maratona de mais de 60 horas de viagem, os dois primeiros dias foram dedicados à aclimatação, comunhão e orientação cultural da equipe sob as tradicionais bandeiras tibetanas.',
    highlightDetail:
      'Destaque para a hospitalidade nepalesa e o uso do tradicional chapéu "Dhaka Topi", símbolo de respeito e identidade nacional.',
    objectPosition: '50% 58%',
    accentColor: '#003893',
  },
  {
    id: 2,
    stageIndex: 2,
    src: '/assets/aistudio/image_9da1d653.png',
    orientation: 'horizontal',
    badge: 'MOMENTO 02 · GASTRONOMIA TRADICIONAL',
    shortTitle: 'Thakali Dal Bhat',
    fullTitle: 'Experiência Gastronômica: O Autêntico Dal Bhat Thakali',
    location: 'CULINÁRIA TÍPICA · THALI DE METAL',
    dayLabel: 'DIA 01 · SABORES DO NEPAL',
    description:
      'Integração também passa pela mesa: provando o prato nacional do Nepal ("Dal Bhat Power, 24 Hour!") servido na bandeja metálica tradicional (Thali).',
    highlightDetail:
      'Composto por arroz branco (Bhat), sopa de lentilhas (Dal), curry de carne, folhas verdes refogadas (Saag), coalhada (Dahi), picles picantes (Achar) e Papadum crocante.',
    objectPosition: '50% 55%',
    accentColor: '#dc143c',
  },
  {
    id: 3,
    stageIndex: 3,
    src: '/assets/aistudio/image_f4452ebd.png',
    orientation: 'vertical',
    badge: 'MOMENTO 03 · PATRIMÔNIO HISTÓRICO',
    shortTitle: 'Templos em Pagode',
    fullTitle: 'Arquitetura Secular & Templos em Estilo Pagode',
    location: 'VALE DE KATHMANDU · PRAÇA HISTÓRICA',
    dayLabel: 'DIA 02 · TURISMO CULTURAL',
    description:
      'Caminhada pelas praças históricas de Kathmandu, observando de perto os templos hindus construídos sobre altas escadarias de tijolos e madeira entalhada à mão.',
    highlightDetail:
      'As escadarias dos templos funcionam como ponto de encontro cotidiano onde jovens e famílias nepalesas conversam ao sol.',
    objectPosition: '50% 42%',
    accentColor: '#003893',
  },
  {
    id: 4,
    stageIndex: 4,
    src: '/assets/aistudio/image_0590a5d6.png',
    orientation: 'vertical',
    badge: 'MOMENTO 04 · ESPIRITUALIDADE & ARTE',
    shortTitle: 'Santuário & Bandeiras',
    fullTitle: 'Santuários Budistas & Bandeiras de Oração no Vale',
    location: 'SWAYAMBHUNATH · KATHMANDU',
    dayLabel: 'DIA 02 · TURISMO CULTURAL',
    description:
      'Visita aos monumentos históricos cercados por milhares de bandeiras de oração coloridas (Lungta) e cascatas de pedra, compreendendo a cosmovisão religiosa local.',
    highlightDetail:
      'Observar de perto a devoção do povo nepalês nos ajudou a preparar o coração e a sensibilidade cultural para os dias de missão.',
    objectPosition: '50% 50%',
    accentColor: '#dc143c',
  },
  {
    id: 5,
    stageIndex: 5,
    src: '/assets/aistudio/image_836c0f19.png',
    orientation: 'vertical',
    badge: 'MOMENTO 05 · CURIOSIDADES DAS RUAS',
    shortTitle: 'Cotidiano & Tika',
    fullTitle: 'Tradições Vivas nas Ruas: Até os Cães Recebem a Tika',
    location: 'RUAS DE KATHMANDU · CULTURA VIVA',
    dayLabel: 'DIAS 01–02 · OBSERVAÇÃO URBANA',
    description:
      'Andando pelas vielas entre dezenas de motonetas, cada detalhe revelava uma cultura singular — como este cão dócil exibindo a marca vermelha da Tika na testa.',
    highlightDetail:
      'Reflexo direto das tradições nepalesas (como o Kukur Tihar), onde animais e elementos da rotina urbana fazem parte dos rituais locais.',
    objectPosition: '50% 38%',
    accentColor: '#003893',
  },
];

export const Slide07CulturalIntegrationContent: React.FC = memo(() => {
  // 6 etapas (0 = Mosaico Completo das 5 fotos; 1..5 = Destaque individual de cada foto)
  const { step, placeholder } = useSteps(5);
  const [manualStage, setManualStage] = useState<CulturalStage | null>(null);
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();

  useEffect(() => {
    setManualStage(null);
  }, [step]);

  const safeStepNumber =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(5, Math.round(step + 1)))
      : 0;
  const clampedSpectacleStage = safeStepNumber as CulturalStage;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? (Math.max(0, Math.min(5, stageInstance.forcedSubStep)) as CulturalStage)
      : broadcast && broadcast.mode !== 'standalone' && broadcast.roomState.slideIndex === 11
      ? (Math.max(0, Math.min(5, broadcast.roomState.subStep)) as CulturalStage)
      : null;

  const activeStage: CulturalStage =
    syncedSubStep !== null
      ? syncedSubStep
      : manualStage !== null
      ? manualStage
      : clampedSpectacleStage;

  const selectedPhoto =
    activeStage > 0 ? CULTURAL_PHOTOS[activeStage - 1] ?? CULTURAL_PHOTOS[0] : null;

  const handleBackgroundClick = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (activeStage < 5) {
      setManualStage(((activeStage + 1) as CulturalStage));
    } else {
      setManualStage(0);
    }
  };

  const horizontalPhotos = CULTURAL_PHOTOS.slice(0, 2);
  const verticalPhotos = CULTURAL_PHOTOS.slice(2, 5);

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-12-cultural-integration" className="bg-[#f4f2eb]">
        <div
          onClick={handleBackgroundClick}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA AMBIENTAL FLUIDA & GRAFISMOS EM LINE-ART (FUNDO)
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div
              className="absolute left-[60px] top-[140px] w-[460px] h-[460px] rounded-full bg-[#003893]/15"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
            <div
              className="absolute right-[80px] bottom-[80px] w-[480px] h-[480px] rounded-full bg-[#dc143c]/14"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
            <svg
              viewBox="0 0 1920 1080"
              className="absolute inset-0 w-full h-full opacity-[0.14]"
              fill="none"
            >
              <path
                d="M -20 960 L 180 790 L 265 835 L 430 680 L 540 760 M 1380 770 L 1510 645 L 1615 725 L 1760 585 L 1940 740"
                stroke="#08254c"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 0 990 L 1920 990"
                stroke="#08254c"
                strokeWidth="2"
                strokeDasharray="10 12"
              />
            </svg>
          </div>

          {/* ===================================================================
              2. CABEÇALHO DO SLIDE ("MISSÃO NEPAL" + "PRIMEIROS 2 DIAS")
             =================================================================== */}
          <CanvaFlowLayer
            speed="slow"
            className="pointer-events-none absolute top-[38px] left-[64px] right-[64px] z-30 flex items-start justify-between"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1.5">
                <MorphElement layoutId="hero-main-title">
                  <span className="font-display text-[21px] font-black uppercase tracking-[0.22em] text-[#003893]">
                    MISSÃO NEPAL
                  </span>
                </MorphElement>
                <span className="text-[#0f0f0f]/35 font-bold">·</span>
                <span className="font-display text-[15px] font-bold uppercase tracking-[0.2em] text-[#dc143c]">
                  ACLIMATAÇÃO &amp; IMERSÃO CULTURAL
                </span>
              </div>

              <h1 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
                OS 2 PRIMEIROS DIAS: INTEGRAÇÃO &amp; TURISMO
              </h1>
              <p className="font-sans text-[19px] font-medium text-[#2f3136]/85 mt-1">
                Comunhão da equipe, gastronomia típica (Dal Bhat), templos seculares e o cotidiano vibrante de Kathmandu
              </p>
            </div>

            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              disablePulse={true}
              className="px-6 py-3.5 flex flex-col items-end text-right shrink-0"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#003893]">
                {activeStage === 0
                  ? 'VISÃO GERAL · 5 REGISTROS REAIS'
                  : `REGISTRO 0${activeStage} DE 05 · EM DESTAQUE`}
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#0f0f0f]/75 mt-1">
                {activeStage === 0
                  ? 'DIAS 01 & 02 · VALE DE KATHMANDU, NEPAL'
                  : selectedPhoto?.location}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              3. CONTEÚDO PRINCIPAL:
                 - Etapa 0: Mosaico Bento 16:9 com as 5 fotos (2 horizontais + 3 verticais)
                 - Etapas 1..5: Foto em Destaque Expandida + Detalhes Culturais + Miniaturas
             =================================================================== */}
          <CanvaFlowLayer
            speed="medium"
            delay={0.06}
            className="absolute top-[194px] left-[64px] right-[64px] bottom-[84px] z-20"
          >
            <AnimatePresence mode="wait">
              {activeStage === 0 ? (
                /* ---------------------------------------------------------------
                   MODO 0: MOSAICO BENTO COMPLETO (2 HORIZONTAIS À ESQUERDA + 3 VERTICAIS À DIREITA)
                   --------------------------------------------------------------- */
                <motion.div
                  key="bento-overview"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full flex gap-5"
                >
                  {/* COLUNA ESQUERDA (680px): 2 FOTOS HORIZONTAIS EMPILHADAS */}
                  <div className="w-[685px] h-full flex flex-col gap-5 shrink-0">
                    {horizontalPhotos.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualStage(item.stageIndex);
                        }}
                        className="group flex-1 min-h-0"
                      >
                        <LiquidGlassContainer
                          intensity="strong"
                          tint="light"
                          disablePulse={true}
                          className="w-full h-full p-3.5 transition-transform duration-300 group-hover:scale-[1.01]"
                        >
                          <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#080d1a] border border-white/80 shadow-xl">
                            <img
                              src={item.src}
                              alt={item.fullTitle}
                              style={{ objectPosition: item.objectPosition }}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a]/85 via-[#080d1a]/15 to-transparent" />

                            {/* Badge Superior */}
                            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                              <span
                                className="px-3 py-1 rounded-full font-display text-[10.5px] font-black uppercase tracking-[0.16em] text-white shadow-md"
                                style={{ backgroundColor: item.accentColor }}
                              >
                                {item.dayLabel}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
                                0{item.id} / 05
                              </span>
                            </div>

                            {/* Rodapé Descritivo sobre a Imagem */}
                            <div className="absolute bottom-3.5 left-4 right-4 text-left">
                              <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300 block mb-0.5">
                                {item.badge}
                              </span>
                              <h3 className="font-display text-[21px] font-black uppercase tracking-tight text-white leading-tight">
                                {item.fullTitle}
                              </h3>
                            </div>
                          </div>
                        </LiquidGlassContainer>
                      </div>
                    ))}
                  </div>

                  {/* COLUNA DIREITA (1087px): 3 FOTOS VERTICAIS LADO A LADO */}
                  <div className="flex-1 h-full grid grid-cols-3 gap-5">
                    {verticalPhotos.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualStage(item.stageIndex);
                        }}
                        className="group h-full min-h-0"
                      >
                        <LiquidGlassContainer
                          intensity="strong"
                          tint="light"
                          disablePulse={true}
                          className="w-full h-full p-3.5 transition-transform duration-300 group-hover:scale-[1.01]"
                        >
                          <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#080d1a] border border-white/80 shadow-xl">
                            <img
                              src={item.src}
                              alt={item.fullTitle}
                              style={{ objectPosition: item.objectPosition }}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a]/90 via-[#080d1a]/15 to-transparent" />

                            {/* Badge Superior */}
                            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                              <span
                                className="px-3 py-1 rounded-full font-display text-[10.5px] font-black uppercase tracking-[0.16em] text-white shadow-md"
                                style={{ backgroundColor: item.accentColor }}
                              >
                                {item.dayLabel}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
                                0{item.id} / 05
                              </span>
                            </div>

                            {/* Rodapé Descritivo sobre a Imagem Vertical */}
                            <div className="absolute bottom-4 left-4 right-4 text-left">
                              <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-300 block mb-1">
                                {item.badge}
                              </span>
                              <h3 className="font-display text-[20px] font-black uppercase tracking-tight text-white leading-snug mb-1.5">
                                {item.shortTitle}
                              </h3>
                              <p className="font-sans text-[13.5px] font-medium text-white/85 leading-snug line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </LiquidGlassContainer>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ---------------------------------------------------------------
                   MODOS 1..5: VISUALIZAÇÃO EXPANDIDA EM DESTAQUE + HISTÓRIA CULTURAL
                   --------------------------------------------------------------- */
                selectedPhoto && (
                  <motion.div
                    key={`spotlight-${selectedPhoto.id}`}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full flex gap-6"
                  >
                    {/* Moldura Principal da Fotografia Selecionada (Preservação Integral sem Cortes) */}
                    <div className="w-[1060px] h-full shrink-0">
                      <LiquidGlassContainer
                        intensity="strong"
                        tint="light"
                        disablePulse={true}
                        className="w-full h-full p-4"
                      >
                        <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-[#080d1a] border border-white/85 shadow-2xl flex items-center justify-center">
                          {/* Fundo ambiental suave para fotos verticais */}
                          <img
                            src={selectedPhoto.src}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-110 opacity-30 blur-xl"
                          />

                          {/* Imagem Principal Completa */}
                          <img
                            src={selectedPhoto.src}
                            alt={selectedPhoto.fullTitle}
                            style={{ objectPosition: selectedPhoto.objectPosition }}
                            className={`relative z-10 w-full h-full ${
                              selectedPhoto.orientation === 'horizontal'
                                ? 'object-cover'
                                : 'object-contain py-2'
                            }`}
                          />

                          <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5">
                            <span
                              className="px-3.5 py-1.5 rounded-full font-display text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg"
                              style={{ backgroundColor: selectedPhoto.accentColor }}
                            >
                              {selectedPhoto.dayLabel}
                            </span>
                            <span className="px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                              {selectedPhoto.location}
                            </span>
                          </div>
                        </div>
                      </LiquidGlassContainer>
                    </div>

                    {/* Coluna Direita: Card de Contexto Cultural + Seletor Rápido das 5 Fotos */}
                    <div className="flex-1 h-full flex flex-col justify-between gap-4">
                      <LiquidGlassContainer
                        intensity="strong"
                        tint="light"
                        disablePulse={true}
                        className="p-7 flex-1 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#08254c]/15 pb-3.5 mb-4">
                            <span className="font-display text-[12px] font-black uppercase tracking-[0.22em] text-[#003893]">
                              {selectedPhoto.badge}
                            </span>
                            <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#dc143c]">
                              FOTO 0{selectedPhoto.id} / 05
                            </span>
                          </div>

                          <h2 className="font-display text-[32px] font-black uppercase tracking-tight text-[#080d1a] leading-[1.08] mb-4">
                            {selectedPhoto.fullTitle}
                          </h2>

                          <p className="font-sans text-[18px] font-medium text-[#11151c] leading-relaxed mb-5">
                            {selectedPhoto.description}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#003893]/[0.07] border border-[#003893]/20 p-5">
                          <span className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#dc143c] block mb-1.5">
                            OLHAR CULTURAL &amp; MISSÃO
                          </span>
                          <p className="font-sans text-[16px] font-semibold text-[#080d1a]/90 leading-relaxed">
                            {selectedPhoto.highlightDetail}
                          </p>
                        </div>
                      </LiquidGlassContainer>

                      {/* Faixa de Miniaturas para Alternar Rapidamente entre as 5 Fotos ou Voltar ao Mosaico */}
                      <LiquidGlassContainer
                        intensity="medium"
                        tint="navy"
                        disablePulse={true}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="font-display text-[10.5px] font-black uppercase tracking-[0.2em] text-[#003893]">
                            GALERIA DOS 2 PRIMEIROS DIAS (CLIQUE PARA ALTERNAR)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualStage(0);
                            }}
                            className="px-3 py-1 rounded-full bg-[#003893] text-white font-display text-[10px] font-extrabold uppercase tracking-wider hover:bg-[#dc143c] transition-colors cursor-pointer"
                          >
                            ⊞ Ver Mosaico Completo
                          </button>
                        </div>

                        <div className="grid grid-cols-5 gap-2.5">
                          {CULTURAL_PHOTOS.map((thumb) => {
                            const isSelected = thumb.id === selectedPhoto.id;
                            return (
                              <button
                                key={thumb.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualStage(thumb.stageIndex);
                                }}
                                className={`group relative h-[86px] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#dc143c] scale-[1.03] shadow-md'
                                    : 'border-white/70 opacity-75 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={thumb.src}
                                  alt={thumb.shortTitle}
                                  style={{ objectPosition: thumb.objectPosition }}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 px-1">
                                  <span className="font-display text-[9px] font-bold uppercase tracking-wider text-white block truncate">
                                    0{thumb.id}. {thumb.shortTitle}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </LiquidGlassContainer>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </CanvaFlowLayer>

          {/* ===================================================================
              4. BARRA DE NAVEGAÇÃO RÁPIDA NO RODAPÉ (OCULTA POR PADRÃO, REVELA NO HOVER)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto group absolute left-0 bottom-0 z-40 pt-6 pr-12 pl-[64px] pb-[20px]"
          >
            <div className="flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
              <button
                type="button"
                onClick={() => setManualStage(0)}
                className={`px-3.5 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  activeStage === 0
                    ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                    : 'bg-white/60 text-[#08254c] border-white/80 hover:bg-white/85 backdrop-blur-md'
                }`}
              >
                00. Mosaico (5 Fotos)
              </button>

              {CULTURAL_PHOTOS.map((item) => {
                const isCurrent = activeStage === item.stageIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setManualStage(item.stageIndex)}
                    className={`px-3.5 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                        : 'bg-white/60 text-[#08254c] border-white/80 hover:bg-white/85 backdrop-blur-md'
                    }`}
                  >
                    0{item.id}. {item.shortTitle}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SlideStage>
    </>
  );
});

export const Slide07CulturalIntegration: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide07CulturalIntegrationContent />
  </Slide>
);

export default Slide07CulturalIntegration;
