import React, { ReactNode, useContext } from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Transition } from 'framer-motion';
import { SlideContext } from 'spectacle';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 1. <LiquidGlassContainer>
 * Card com estética Liquid Glass (Glassmorphism + bordas orgânicas assimétricas em pulsação contínua).
 * Alterna assimetricamente o border-radius (ex: 60% 40% 30% 70% / 60% 30% 70% 40% <-> 30% 60% 70% 40% / 50% 60% 30% 60%)
 * para simular um fluido vivo.
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
  duration = 7,
  style,
  ...rest
}) => {
  const radiusKeyframes = {
    subtle: [
      '28px 42px 34px 26px / 26px 38px 30px 42px',
      '40px 26px 30px 42px / 36px 28px 42px 28px',
      '26px 38px 42px 30px / 42px 32px 26px 36px',
      '28px 42px 34px 26px / 26px 38px 30px 42px',
    ],
    medium: [
      '38px 58px 46px 32px / 34px 52px 38px 58px',
      '56px 34px 40px 58px / 50px 34px 56px 36px',
      '34px 52px 58px 38px / 56px 42px 32px 50px',
      '38px 58px 46px 32px / 34px 52px 38px 58px',
    ],
    strong: [
      '44px 72px 56px 36px / 38px 64px 44px 70px',
      '68px 38px 48px 70px / 62px 38px 68px 40px',
      '38px 62px 70px 44px / 68px 50px 36px 60px',
      '44px 72px 56px 36px / 38px 64px 44px 70px',
    ],
    organic: [
      '60% 40% 30% 70% / 60% 30% 70% 40%',
      '30% 60% 70% 40% / 50% 60% 30% 60%',
      '55% 45% 35% 65% / 40% 65% 35% 60%',
      '60% 40% 30% 70% / 60% 30% 70% 40%',
    ],
  };

  const tintClasses = {
    light: 'bg-white/25 border-white/75 text-[#0f0f0f]',
    navy: 'bg-[#003893]/12 border-white/70 text-[#0f0f0f]',
    crimson: 'bg-[#dc143c]/12 border-white/70 text-[#0f0f0f]',
  };

  return (
    <motion.div
      animate={
        disablePulse
          ? undefined
          : {
              borderRadius: radiusKeyframes[intensity],
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
        borderRadius: radiusKeyframes[intensity][0],
        backgroundImage:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.22) 48%, rgba(0, 56, 147, 0.08) 85%, rgba(220, 20, 60, 0.10) 100%)',
        boxShadow:
          '0 28px 60px -12px rgba(8, 37, 76, 0.22), 0 8px 24px -4px rgba(0, 56, 147, 0.10), inset 0 2px 4px 0 rgba(255, 255, 255, 0.95), inset 0 -3px 10px 0 rgba(0, 56, 147, 0.12), inset 2px 0 6px 0 rgba(255, 255, 255, 0.65)',
        ...style,
      }}
      className={`relative overflow-hidden backdrop-blur-2xl border-2 shadow-2xl ${tintClasses[tint]} ${className}`}
      {...rest}
    >
      {/* Reflexo especular curvo (Liquid Glass Specular Sheen) no topo do card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/2 -left-1/4 w-[150%] h-[85%] rounded-full bg-gradient-to-b from-white/65 via-white/15 to-transparent rotate-[-6deg]"
      />
      {/* Brilho cáustico líquido sutil nas bordas internas */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: ['-10%', '12%', '-10%'],
          y: ['-8%', '10%', '-8%'],
        }}
        transition={{
          duration: duration * 1.1,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-gradient-to-tr from-[#003893]/18 via-[#dc143c]/12 to-white/30 blur-2xl"
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
 * velocidades e curvas ligeiramente diferentes (parallax multi-camada) enquanto
 * o background faz um fade suave.
 */
export interface CanvaFlowLayerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  speed?: 'slow' | 'medium' | 'fast';
  direction?: 'horizontal' | 'vertical';
  delay?: number;
  className?: string;
}

export const CanvaFlowLayer: React.FC<CanvaFlowLayerProps> = ({
  children,
  speed = 'medium',
  direction = 'horizontal',
  delay = 0,
  className = '',
  ...rest
}) => {
  const distanceMap = {
    slow: 90,
    medium: 180,
    fast: 300,
  };
  const d = distanceMap[speed];

  const initialOffset =
    direction === 'horizontal' ? { x: d, y: 0 } : { x: 0, y: d * 0.7 };
  const exitOffset =
    direction === 'horizontal' ? { x: -d * 0.85, y: 0 } : { x: 0, y: -d * 0.6 };

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, ...exitOffset, scale: 0.97 }}
      transition={{
        duration: 0.85,
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
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
