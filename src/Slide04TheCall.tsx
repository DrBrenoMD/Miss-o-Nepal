import React, { useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
  SlideUp,
  LiquidReveal,
} from './AnimationWrappers';
import { useStageInstance } from './StageInstanceContext';

const CHAMADO_PHOTO_PATH = '/assets/aistudio/FullSizeRender_72adf14d.jpg';

export const Slide04TheCallContent: React.FC = React.memo(() => {
  const deckContext = useContext(DeckContext);
  const { disableSlideTapAdvance } = useStageInstance();

  const handleSlideAdvance = () => {
    if (disableSlideTapAdvance) return;
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-09-o-chamado" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO AMBIENTE FLUIDO & LINE-ART SUTIL DO HIMALAIA
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 45, -25, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[110px] top-[180px] w-[460px] h-[460px] rounded-full bg-[#003893]/14 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -40, 30, 0], y: [0, 35, -25, 0] }}
            transition={{ duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[110px] bottom-[110px] w-[480px] h-[480px] rounded-full bg-[#dc143c]/14 blur-[85px]"
          />

          {/* Grafismo em Line-Art fino ao fundo (Silhueta do Himalaia & Rosa dos Ventos) */}
          <svg
            viewBox="0 0 1920 1080"
            className="absolute inset-0 w-full h-full opacity-[0.16]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M -20 960 L 180 790 L 265 835 L 430 680 L 540 760 M 1380 770 L 1510 645 L 1615 725 L 1760 585 L 1940 740"
              stroke="#08254c"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 0 985 L 1920 985"
              stroke="#08254c"
              strokeWidth="2.5"
              strokeDasharray="10 12"
            />
            {/* Rosa dos ventos minimalista no canto superior direito */}
            <g transform="translate(1765, 118)" stroke="#003893" strokeWidth="2.2">
              <circle cx="0" cy="0" r="44" strokeOpacity="0.55" />
              <circle cx="0" cy="0" r="6" fill="#dc143c" stroke="none" />
              <path d="M 0 -56 L 0 56 M -56 0 L 56 0" strokeLinecap="round" />
              <path d="M 0 -44 L 9 -11 L 0 -18 L -9 -11 Z" fill="#003893" stroke="none" />
            </g>
          </svg>
        </div>

        {/* =====================================================================
            2. CABEÇALHO CENTRALIZADO COM MORPH DO TÍTULO PRINCIPAL
           ===================================================================== */}
        <CanvaFlowLayer
          speed="slow"
          className="pointer-events-none absolute top-[40px] left-[68px] right-[68px] z-30 flex flex-col items-center text-center"
        >
          <SlideUp delay={0.05} distance={24}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="h-[2px] w-10 bg-[#dc143c]" />
              <MorphElement layoutId="hero-main-title">
                <span className="font-display text-[22px] font-black uppercase tracking-[0.28em] text-[#003893]">
                  MISSÃO NEPAL
                </span>
              </MorphElement>
              <span className="h-[2px] w-10 bg-[#dc143c]" />
            </div>
          </SlideUp>

          <SlideUp delay={0.14} distance={32}>
            <h1 className="font-display text-[76px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[0.98]">
              O CHAMADO
            </h1>
          </SlideUp>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. MOLDURA LIQUID GLASS DE DESTAQUE PARA A FOTOGRAFIA (16:9 PANORÂMICA)
           ===================================================================== */}
        <CanvaFlowLayer
          speed="medium"
          delay={0.08}
          className="absolute top-[186px] left-[128px] right-[128px] bottom-[56px] z-20 flex items-center justify-center"
        >
          <LiquidReveal duration={0.85} origin="50% 55%" className="w-full h-full">
            <LiquidGlassContainer
              intensity="strong"
              tint="light"
              disablePulse={true}
              className="w-full h-full p-5 flex flex-col"
            >
              <div className="relative w-full h-[796px] rounded-[30px] overflow-hidden shadow-2xl border border-white/80 bg-[#080d1a]">
                {/* Camada de preenchimento ambiental suave para evitar barras vazias */}
                <img
                  src={CHAMADO_PHOTO_PATH}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-105 opacity-35"
                />

                {/* Fotografia principal nítida em destaque */}
                <motion.img
                  src={CHAMADO_PHOTO_PATH}
                  alt="O Chamado — Missão Nepal"
                  initial={{ scale: 1.03 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 w-full h-full object-cover object-center"
                />

                {/* Vinheta sutil na borda inferior para acabamento editorial */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-[#080d1a]/45 via-transparent to-transparent"
                />
              </div>
            </LiquidGlassContainer>
          </LiquidReveal>
        </CanvaFlowLayer>
      </div>
    </SlideStage>
  );
});

export const Slide04TheCall: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide04TheCallContent />
  </Slide>
);

export default Slide04TheCall;
