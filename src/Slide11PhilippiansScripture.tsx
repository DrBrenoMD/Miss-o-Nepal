import React, { useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import {
  LiquidGlassContainer,
  SlideUp,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { useStageInstance } from './broadcast/BroadcastContext';

export const Slide11PhilippiansScriptureContent: React.FC = () => {
  const deckContext = useContext(DeckContext) as any;
  const stageInstance = useStageInstance();

  const handleSlideTap = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-11-philippians-scripture" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideTap}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer flex items-center justify-center px-[140px]"
      >
        {/* Luzes ambientais sutis da paleta Missão Nepal */}
        <div className="pointer-events-none absolute -top-[180px] -left-[140px] w-[640px] h-[640px] rounded-full bg-[#003893]/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[180px] -right-[140px] w-[640px] h-[640px] rounded-full bg-[#dc143c]/8 blur-3xl" />

        {/* Grafismo sutil em line-art (silhueta de cordilheira ao fundo, sem textos) */}
        <svg
          viewBox="0 0 1920 360"
          fill="none"
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[360px] opacity-25"
        >
          <motion.path
            d="M0 320 L220 210 L390 275 L640 130 L860 250 L1120 95 L1380 235 L1620 145 L1920 280 L1920 360 L0 360 Z"
            stroke="#003893"
            strokeWidth="1.5"
            fill="rgba(0, 56, 147, 0.025)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          <motion.path
            d="M0 340 L310 245 L540 295 L820 165 L1050 265 L1310 150 L1580 255 L1920 190"
            stroke="#dc143c"
            strokeWidth="1.1"
            strokeDasharray="6 8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.65 }}
            transition={{ duration: 2.1, delay: 0.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Contêiner Liquid Glass centralizado contendo exclusivamente o versículo e a referência */}
        <CanvaFlowLayer speed="medium" className="relative z-20 w-full max-w-[1440px]">
          <LiquidGlassContainer
            intensity="strong"
            className="px-[104px] py-[96px] border-2 border-white/90 bg-white/65 shadow-[0_32px_80px_-20px_rgba(8,37,76,0.16)]"
          >
            {/* Detalhe linear superior nas cores do Nepal */}
            <div className="flex items-center justify-center gap-3 mb-[48px]">
              <span className="h-[3px] w-[72px] rounded-full bg-[#003893]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#dc143c]" />
              <span className="h-[3px] w-[72px] rounded-full bg-[#003893]" />
            </div>

            <SlideUp delay={0.12} distance={28}>
              <blockquote className="font-sans text-[46px] font-semibold text-[#111111] leading-[1.45] tracking-[-0.01em] text-center">
                “Porque a vocês foi dado o privilégio de não apenas crer em Cristo, mas também de sofrer por ele”
              </blockquote>
            </SlideUp>

            <SlideUp delay={0.28} distance={22}>
              <div className="mt-[52px] flex items-center justify-center">
                <cite className="not-italic font-display text-[34px] font-black uppercase tracking-[0.18em] text-[#dc143c]">
                  Filipenses 1:29
                </cite>
              </div>
            </SlideUp>
          </LiquidGlassContainer>
        </CanvaFlowLayer>
      </div>
    </SlideStage>
  );
};

export const Slide11PhilippiansScripture: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide11PhilippiansScriptureContent />
  </Slide>
);
