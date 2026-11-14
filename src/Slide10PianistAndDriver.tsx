import React, { useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import { SlideStage } from './AnimationWrappers';
import { useStageInstance } from './broadcast/BroadcastContext';

const PAINTING_IMAGE_SRC = '/assets/aistudio/image_d29afa4c.png';
const PIANIST_IMAGE_SRC = '/assets/aistudio/image_090d0f50.png';
const INDRIVE_DRIVER_IMAGE_SRC = '/assets/aistudio/indrive_car_backseat_nepal.jpg';

export const Slide10PianistAndDriverContent: React.FC = () => {
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

  const photos = [
    {
      id: 'psalm-painting',
      src: PAINTING_IMAGE_SRC,
      delay: 0,
      initialX: -28,
    },
    {
      id: 'pianist',
      src: PIANIST_IMAGE_SRC,
      delay: 0.08,
      initialX: 0,
    },
    {
      id: 'indrive-driver',
      src: INDRIVE_DRIVER_IMAGE_SRC,
      delay: 0.16,
      initialX: 28,
    },
  ];

  return (
    <SlideStage slideKey="slide-10-pianist-driver" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideTap}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer flex items-center justify-center px-[48px] py-[42px]"
      >
        {/* Luzes ambientais sutis da paleta Missão Nepal */}
        <div className="pointer-events-none absolute -top-[180px] -left-[140px] w-[640px] h-[640px] rounded-full bg-[#003893]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[180px] -right-[140px] w-[640px] h-[640px] rounded-full bg-[#dc143c]/10 blur-3xl" />

        {/* Composição em 3 Colunas Liquid Glass: Pintura Salmo 46:10 + Pianista + Motorista inDrive (banco de trás) */}
        <div className="relative z-10 w-full h-full grid grid-cols-3 gap-[28px] items-stretch">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: photo.initialX, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: photo.delay, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-full rounded-[36px] overflow-hidden border-2 border-white/90 bg-white/55 backdrop-blur-xl shadow-[0_32px_80px_-20px_rgba(8,37,76,0.28)] flex items-center justify-center p-[12px]"
            >
              <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-black/20 flex items-center justify-center">
                {/* Preenchimento atmosférico desfocado para manter proporção limpa sem cortar nada da foto */}
                <img
                  src={photo.src}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                />
                <img
                  src={photo.src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="relative z-10 w-full h-full object-contain rounded-[22px]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide10PianistAndDriver: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide10PianistAndDriverContent />
  </Slide>
);
