import React, { useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import { SlideStage } from './AnimationWrappers';
import { useStageInstance } from './broadcast/BroadcastContext';

const BIBLE_WORKERS_PHOTO_SRC = '/assets/aistudio/image_7bf7ccc0.png';
const SECONDARY_PHOTO_SRC = '/assets/aistudio/image_7a9ffb8d.png';

export const Slide01CPhotoShowcaseContent: React.FC = () => {
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
    <SlideStage slideKey="slide-01c-photo-showcase" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideTap}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer flex items-center justify-center px-[52px] py-[42px]"
      >
        {/* Fundo atmosférico suave derivado da fotografia principal para preencher 16:9 */}
        <img
          src={BIBLE_WORKERS_PHOTO_SRC}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-45"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#f4f2eb]/35 backdrop-blur-sm" />

        {/* Layout Assimétrico 16:9: Foto dos Obreiros Bíblicos MAIOR à esquerda + Imagem complementar MENOR à direita (sem textos) */}
        <div className="relative z-10 w-full h-full flex items-center justify-between gap-[32px]">
          {/* Moldura Principal Maior: Obreiros Bíblicos */}
          <motion.div
            initial={{ opacity: 0, x: -24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-1 h-[996px] rounded-[38px] overflow-hidden border-2 border-white/90 bg-white/55 backdrop-blur-xl shadow-[0_35px_90px_-20px_rgba(8,37,76,0.35)] flex items-center justify-center p-[14px]"
          >
            <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black/20 flex items-center justify-center">
              <img
                src={BIBLE_WORKERS_PHOTO_SRC}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-55"
              />
              <img
                src={BIBLE_WORKERS_PHOTO_SRC}
                alt=""
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-contain rounded-[24px]"
              />
            </div>
          </motion.div>

          {/* Moldura Secundária Menor */}
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[490px] h-[820px] shrink-0 rounded-[34px] overflow-hidden border-2 border-white/90 bg-white/60 backdrop-blur-xl shadow-[0_30px_75px_-18px_rgba(8,37,76,0.32)] flex items-center justify-center p-[12px]"
          >
            <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-black/20 flex items-center justify-center">
              <img
                src={SECONDARY_PHOTO_SRC}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-55"
              />
              <img
                src={SECONDARY_PHOTO_SRC}
                alt=""
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-contain rounded-[20px]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide01CPhotoShowcase: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide01CPhotoShowcaseContent />
  </Slide>
);
