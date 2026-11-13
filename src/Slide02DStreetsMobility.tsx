import React, { useState, useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
  SlideUp,
} from './AnimationWrappers';
import kathmanduStreetPhoto from './assets/images/kathmandu_traffic_cow_street_1794581814634.jpg';

export const Slide02DStreetsMobilityContent: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);
  const deckContext = useContext(DeckContext);

  const handleSlideAdvance = () => {
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-02d-streets-mobility" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO ARTÍSTICO COM LINHAS DE FLUXO VIÁRIO EM MOVIMENTO
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 60, -30, 0], y: [0, -30, 25, 0] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[140px] bottom-[120px] w-[440px] h-[440px] rounded-full bg-[#003893]/14 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -50, 40, 0], y: [0, 35, -30, 0] }}
            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[120px] top-[220px] w-[420px] h-[420px] rounded-full bg-[#dc143c]/13 blur-[85px]"
          />
        </div>

        {/* =====================================================================
            2. CABEÇALHO EDITORIAL PADRONIZADO
           ===================================================================== */}
        <CanvaFlowLayer
          speed="slow"
          className="pointer-events-none absolute top-[40px] left-[68px] right-[68px] z-30 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <MorphElement layoutId="hero-main-title">
                <span className="font-display text-[21px] font-black uppercase tracking-[0.24em] text-[#003893]">
                  MISSÃO NEPAL
                </span>
              </MorphElement>
              <span className="text-[#0f0f0f]/30" aria-hidden="true">·</span>
              <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.18em] text-[#dc143c]">
                Mobilidade Urbana &amp; Choque Sensorial nas Ruas
              </span>
            </div>
            <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
              MÃO INGLESA &amp; TRÂNSITO CAÓTICO
            </h2>
            <p className="font-sans text-[20px] font-medium text-[#2f3136]/85 mt-1">
              Como funciona o “caos sincronizado” de Katmandu — onde buzinas são gentileza e vacas têm preferência
            </p>
          </div>

          <div className="text-right pb-1">
            <div className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-[#003893]">
              Atenção Pedestre Brasileiro
            </div>
            <div className="font-display text-[19px] font-black uppercase text-[#dc143c]">
              Olhe primeiro para a DIREITA ao atravessar!
            </div>
          </div>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. CONTEÚDO PRINCIPAL (5 COLUNAS FOTO + DIAGRAMA · 7 COLUNAS CURIOSIDADES)
           ===================================================================== */}
        <div className="absolute top-[188px] left-[68px] right-[68px] bottom-[54px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* -------------------------------------------------------------------
              ESQUERDA (5 COLUNAS): FOTO DAS RUAS DE KATMANDU + DIAGRAMA DE MÃO INGLESA
             ------------------------------------------------------------------- */}
          <div className="col-span-5 h-full flex flex-col justify-between gap-6">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="p-4 h-full flex flex-col justify-between"
            >
              {/* Foto Documental */}
              <div className="relative w-full h-[465px] rounded-[26px] overflow-hidden bg-[#08254c]/10">
                {!imgFailed ? (
                  <img
                    src={kathmanduStreetPhoto}
                    alt="Cruzamento movimentado em Katmandu com trânsito em mão inglesa, ônibus coloridos, motos e vaca branca sagrada descansando na pista"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#08254c] to-[#003893] text-white p-8 text-center">
                    <span className="font-display text-[28px] font-black uppercase">
                      Ruas de Katmandu
                    </span>
                    <span className="font-sans text-[16px] opacity-80 mt-2">
                      Mão inglesa, motos, ônibus decorados e vacas sagradas compartilhando a via
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pt-12 pb-5 text-white">
                  <div className="font-display text-[20px] font-extrabold uppercase tracking-wide">
                    Cotidiano Real nas Ruas de Katmandu
                  </div>
                  <div className="font-sans text-[14px] text-white/85 mt-0.5">
                    Ônibus Tata decorados, enxame de motos, bandeiras de oração e vacas sagradas no asfalto
                  </div>
                </div>
              </div>

              {/* Esquema Visual Comparativo: Mão Inglesa vs. Mão Brasileira */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#08254c]">
                    Esquema de Circulação Viária
                  </span>
                  <span className="font-sans text-[12.5px] font-semibold text-[#003893]">
                    Igual a Reino Unido, Japão, Austrália e Índia
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Nepal */}
                  <div className="rounded-2xl bg-[#dc143c]/10 border border-[#dc143c]/30 px-4 py-3">
                    <div className="font-display text-[15px] font-black uppercase text-[#dc143c]">
                      Nepal · Mão Inglesa
                    </div>
                    <div className="font-sans text-[13.5px] font-semibold text-[#0e1218] mt-1">
                      Fluxo pela <strong>ESQUERDA</strong> · Volante na <strong>DIREITA</strong>
                    </div>
                    <svg viewBox="0 0 220 44" className="w-full h-[38px] mt-1.5" fill="none">
                      <rect x="2" y="4" width="216" height="36" rx="8" fill="#08254c" fillOpacity="0.08" />
                      <line x1="8" y1="22" x2="212" y2="22" stroke="#08254c" strokeOpacity="0.35" strokeDasharray="5 5" />
                      <path d="M 30 13 L 185 13 M 176 8 L 186 13 L 176 18" stroke="#dc143c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 190 31 L 35 31 M 44 26 L 34 31 L 44 36" stroke="#003893" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Brasil */}
                  <div className="rounded-2xl bg-[#003893]/8 border border-[#003893]/25 px-4 py-3">
                    <div className="font-display text-[15px] font-black uppercase text-[#003893]">
                      Brasil · Mão Direita
                    </div>
                    <div className="font-sans text-[13.5px] font-semibold text-[#0e1218] mt-1">
                      Fluxo pela <strong>DIREITA</strong> · Volante na <strong>ESQUERDA</strong>
                    </div>
                    <svg viewBox="0 0 220 44" className="w-full h-[38px] mt-1.5" fill="none">
                      <rect x="2" y="4" width="216" height="36" rx="8" fill="#08254c" fillOpacity="0.06" />
                      <line x1="8" y1="22" x2="212" y2="22" stroke="#08254c" strokeOpacity="0.35" strokeDasharray="5 5" />
                      <path d="M 190 13 L 35 13 M 44 8 L 34 13 L 44 18" stroke="#08254c" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 30 31 L 185 31 M 176 26 L 186 31 L 176 36" stroke="#003893" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </LiquidGlassContainer>
          </div>

          {/* -------------------------------------------------------------------
              DIREITA (7 COLUNAS): 4 CARDS DETALHADOS DE TRÂNSITO & CULTURA URBANA
             ------------------------------------------------------------------- */}
          <div className="col-span-7 h-full flex flex-col justify-between gap-4">
            <SlideUp delay={0.05} distance={18}>
              <LiquidGlassContainer
                intensity="subtle"
                tint="navy"
                disablePulse={true}
                className="px-8 py-5"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-[21px] font-black uppercase text-[#080d1a]">
                    01. Por que Mão Inglesa se nunca foi colônia britânica?
                  </span>
                  <span className="font-sans text-[13px] font-bold uppercase tracking-wider text-[#003893]">
                    Influência da Índia
                  </span>
                </div>
                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26]">
                  Embora o Nepal jamais tenha sido colonizado, todas as suas rotas terrestres de
                  comércio e importação de automóveis (Tata, Mahindra, Suzuki) vêm da{' '}
                  <strong>Índia</strong>, ex-colônia britânica. Curiosidade histórica: os primeiros
                  carros dos reis nepaleses chegavam a Katmandu <strong>carregados nos ombros por
                  dezenas de homens pelas trilhas da montanha</strong> antes de existirem estradas!
                </p>
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.1} distance={18}>
              <LiquidGlassContainer
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="px-8 py-5"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-[21px] font-black uppercase text-[#080d1a]">
                    02. Quase Zero Semáforos &amp; Guardas de Luvas Brancas
                  </span>
                  <span className="font-sans text-[13px] font-bold uppercase tracking-wider text-[#dc143c]">
                    Fluxo Orgânico
                  </span>
                </div>
                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26]">
                  Katmandu quase não possui semáforos ativos nem faixas de pedestres respeitadas. Nos
                  grandes cruzamentos, <strong>policiais em pedestais centrais</strong> coordenam rios
                  de motocicletas, micro-ônibus (<em>Tempos</em>), riquixás e pedestres apenas no
                  apito. Para atravessar a rua, o segredo local é{' '}
                  <strong>erguer a mão aberta e caminhar em ritmo constante</strong> sem correr!
                </p>
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.15} distance={18}>
              <LiquidGlassContainer
                intensity="subtle"
                tint="crimson"
                disablePulse={true}
                className="px-8 py-5"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-[21px] font-black uppercase text-[#080d1a]">
                    03. A Buzina é “Gentileza” &amp; Vacas Têm Preferência Absoluta
                  </span>
                  <span className="font-sans text-[13px] font-bold uppercase tracking-wider text-[#dc143c]">
                    Zero “Road Rage”
                  </span>
                </div>
                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26]">
                  No Brasil, buzinar soa como xingamento; no Nepal, a traseira dos caminhões traz
                  escrito <strong>“Horn Please” (Buzine, por favor)</strong>! A buzina é um radar
                  amigável (<em>“Estou passando à sua direita”</em>) e quase não há brigas de
                  trânsito. E se uma <strong>vaca sagrada resolver cochilar no meio da avenida</strong>,
                  todo o trânsito desvia em paz.
                </p>
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.2} distance={18}>
              <LiquidGlassContainer
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="px-8 py-5"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-[21px] font-black uppercase text-[#080d1a]">
                    04. Emaranhados de Fios, Poeira &amp; Estradas nas Nuvens
                  </span>
                  <span className="font-sans text-[13px] font-bold uppercase tracking-wider text-[#003893]">
                    Geografia Extrema
                  </span>
                </div>
                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26]">
                  Nas cidades, máscaras faciais já eram comuns muito antes da pandemia por causa da
                  poeira seca do vale cercado por montanhas, sob postes com ninhos gigantescos de
                  cabos. Fora da capital, uma viagem de apenas <strong>200 km (Katmandu a Pokhara)</strong>{' '}
                  pode levar de <strong>7 a 10 horas</strong> serpenteando desfiladeiros do Himalaia!
                </p>
              </LiquidGlassContainer>
            </SlideUp>
          </div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide02DStreetsMobility: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide02DStreetsMobilityContent />
  </Slide>
);

export default Slide02DStreetsMobility;
