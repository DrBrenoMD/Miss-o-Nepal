import React, { ReactNode, useContext } from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Transition } from 'framer-motion';
import { SlideContext } from 'spectacle';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 1. <LiquidGlassContainer>
 * Card com estética Liquid Glass (Vidro Fosco Translúcido + bordas orgânicas assimétricas em pulsação contínua).
 * Mantém transparência real (bg-white/15 a bg-white/25) com backdrop-blur para que o mapa e os elementos
 * ao fundo fiquem visivelmente desfocados através do vidro fosco, sem borrar os textos internos.
 */
export interface LiquidGlassContainerProps extends HTMLMotionProps<'div'> {
  children?: ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong' | 'organic';
  tint?: 'light' | 'navy' | 'crimson';
  disablePulse?: boolean;
  duration?: number;
}

export const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({
  children,
  className = '',
  intensity = 'medium',
  tint = 'light',
  disablePulse = false,
  duration = 6,
  style,
  ...rest
}) => {
  const staticRadius = {
    subtle: '26px 38px 30px 24px / 24px 34px 28px 38px',
    medium: '34px 52px 42px 30px / 32px 46px 36px 52px',
    strong: '40px 64px 50px 34px / 36px 58px 40px 62px',
    organic: '48px 34px 52px 36px / 36px 50px 34px 48px',
  };

  const tintStyles = {
    light: {
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0.14) 55%, rgba(244, 242, 235, 0.22) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.72)',
    },
    navy: {
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(0, 56, 147, 0.08) 60%, rgba(255, 255, 255, 0.18) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.65)',
    },
    crimson: {
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(220, 20, 60, 0.08) 60%, rgba(255, 255, 255, 0.18) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.65)',
    },
  };

  return (
    <motion.div
      animate={
        disablePulse
          ? undefined
          : {
              y: [0, -4, 0],
            }
      }
      transition={
        disablePulse
          ? undefined
          : {
              duration,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }
      }
      style={{
        borderRadius: staticRadius[intensity],
        background: tintStyles[tint].background,
        borderColor: tintStyles[tint].borderColor,
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        backdropFilter: 'blur(16px) saturate(160%)',
        boxShadow:
          '0 20px 45px -12px rgba(8, 37, 76, 0.14), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.92), inset 0 -1.5px 4px 0 rgba(0, 56, 147, 0.08)',
        ...style,
      }}
      className={`relative overflow-hidden border-[1.5px] text-[#0f0f0f] ${className}`}
      {...rest}
    >
      {/* Brilho especular diagonal de vidro fosco (sem obstruir a transparência) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent"
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/**
 * 2. <SlideTransition direction="left|right|up|down">
 * Elementos que entram deslizando de direções específicas com física de mola:
 * type: "spring", stiffness: 100, damping: 20
 */
export interface SlideTransitionProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  direction?: SlideDirection;
  distance?: number;
  delay?: number;
  className?: string;
}

const getDirectionOffset = (direction: SlideDirection, distance: number) => {
  switch (direction) {
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
    case 'up':
      return { x: 0, y: distance };
    case 'down':
      return { x: 0, y: -distance };
  }
};

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = 'up',
  distance = 80,
  delay = 0,
  className = '',
  ...rest
}) => {
  const offset = getDirectionOffset(direction, distance);

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -offset.x * 0.6, y: -offset.y * 0.4 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * 2b. <SlideUp>
 * Atalho semântico para entrada de textos e elementos de baixo para cima com stagger/delay.
 */
export interface SlideUpProps extends Omit<SlideTransitionProps, 'direction'> {}

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  distance = 45,
  delay = 0,
  className = '',
  ...rest
}) => {
  return (
    <SlideTransition
      direction="up"
      distance={distance}
      delay={delay}
      className={className}
      {...rest}
    >
      {children}
    </SlideTransition>
  );
};

/**
 * 2c. <CanvaFlowLayer>
 * Camada com transição estilo "Fluxo" do Canva: cada elemento desliza em
 * velocidades ligeiramente diferentes sem alterar `scale`, mantendo nitidez 100% nos textos e imagens.
 */
export interface CanvaFlowLayerProps extends HTMLMotionProps<'div'> {
  children?: ReactNode;
  speed?: 'slow' | 'medium' | 'fast';
  depth?: number;
  direction?: 'horizontal' | 'vertical';
  delay?: number;
  className?: string;
}

export const CanvaFlowLayer: React.FC<CanvaFlowLayerProps> = ({
  children,
  speed = 'medium',
  depth,
  direction = 'horizontal',
  delay = 0,
  className = '',
  ...rest
}) => {
  const distanceMap = {
    slow: 80,
    medium: 160,
    fast: 260,
  };
  const d = typeof depth === 'number' ? Math.round(140 * depth) : distanceMap[speed];

  const initialOffset =
    direction === 'horizontal' ? { x: d, y: 0 } : { x: 0, y: d * 0.7 };
  const exitOffset =
    direction === 'horizontal' ? { x: -d * 0.85, y: 0 } : { x: 0, y: -d * 0.6 };

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...exitOffset }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * 3. <MorphElement layoutId="string">
 * Wrapper que utiliza a prop layoutId do Framer Motion para que elementos
 * (títulos, fotos, recortes, grafismos ou ícones) se transformem e mudem de
 * posição/tamanho fluidamente entre um slide e outro.
 */
export interface MorphElementProps extends HTMLMotionProps<'div'> {
  layoutId: string;
  children: ReactNode;
  className?: string;
  transition?: Transition;
}

export const MorphElement: React.FC<MorphElementProps> = ({
  layoutId,
  children,
  className = '',
  transition = {
    type: 'spring',
    stiffness: 75,
    damping: 18,
    mass: 0.95,
  },
  ...rest
}) => {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={transition}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * 4. <LiquidReveal>
 * Transição de entrada onde o elemento aparece como se uma gota de água
 * estivesse se expandindo (animando clip-path: circle()).
 */
export interface LiquidRevealProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  origin?: string; // ex: "50% 50%"
  className?: string;
}

export const LiquidReveal: React.FC<LiquidRevealProps> = ({
  children,
  delay = 0,
  duration = 1.1,
  origin = '50% 50%',
  className = '',
  ...rest
}) => {
  return (
    <motion.div
      initial={{
        clipPath: `circle(0% at ${origin})`,
        opacity: 0,
      }}
      animate={{
        clipPath: `circle(150% at ${origin})`,
        opacity: 1,
      }}
      exit={{
        clipPath: `circle(0% at ${origin})`,
        opacity: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * Helper <SlideStage>
 * Sincroniza o estado ativo do <Slide> do Spectacle com o <AnimatePresence>
 * do Framer Motion aplicando o fade de background e fluxo parallax.
 */
export interface SlideStageProps {
  slideKey: string;
  children: ReactNode;
  className?: string;
}

export const SlideStage: React.FC<SlideStageProps> = ({
  slideKey,
  children,
  className = '',
}) => {
  const slideContext = useContext(SlideContext);
  const isSlideActive = slideContext ? slideContext.isSlideActive : true;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#f4f2eb] text-[#0f0f0f] select-none ${className}`}>
      <AnimatePresence mode="sync">
        {isSlideActive && (
          <motion.div
            key={slideKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
