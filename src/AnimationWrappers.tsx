import React, { ReactNode, useContext } from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Transition } from 'framer-motion';
import { SlideContext } from 'spectacle';
import { useStageInstance } from './StageInstanceContext';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 1. <LiquidGlassContainer>
 * Card com estética Liquid Glass (Vidro Fosco Translúcido + bordas orgânicas assimétricas).
 * Otimizado para 60fps em monitores 4K (3840x2160 / 4096x2160) e dispositivos móveis:
 * - Evita animar transformações contínuas sobre camadas com `backdrop-filter` por padrão,
 *   eliminando repaints de GPU a cada quadro durante transições de slides.
 * - Desativa `backdrop-filter` em miniaturas reduzidas (`isPreview`) do Console do Apresentador.
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
  disablePulse = true,
  duration = 6,
  style,
  ...rest
}) => {
  const { isPreview } = useStageInstance();

  const staticRadius = {
    subtle: '26px 38px 30px 24px / 24px 34px 28px 38px',
    medium: '34px 52px 42px 30px / 32px 46px 36px 52px',
    strong: '40px 64px 50px 34px / 36px 58px 40px 62px',
    organic: '48px 34px 52px 36px / 36px 50px 34px 48px',
  };

  const tintStyles = {
    light: {
      background: isPreview
        ? 'rgba(255, 255, 255, 0.72)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.20) 55%, rgba(244, 242, 235, 0.28) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.75)',
    },
    navy: {
      background: isPreview
        ? 'rgba(240, 245, 255, 0.76)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(0, 56, 147, 0.09) 60%, rgba(255, 255, 255, 0.22) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.68)',
    },
    crimson: {
      background: isPreview
        ? 'rgba(255, 242, 245, 0.76)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(220, 20, 60, 0.09) 60%, rgba(255, 255, 255, 0.22) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.68)',
    },
  };

  const shouldPulse = !disablePulse && !isPreview;

  return (
    <motion.div
      animate={shouldPulse ? { y: [0, -3, 0] } : undefined}
      transition={
        shouldPulse
          ? {
              duration,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }
          : undefined
      }
      style={{
        borderRadius: staticRadius[intensity],
        background: tintStyles[tint].background,
        borderColor: tintStyles[tint].borderColor,
        WebkitBackdropFilter: isPreview ? 'none' : 'blur(10px)',
        backdropFilter: isPreview ? 'none' : 'blur(10px)',
        boxShadow:
          '0 18px 40px -12px rgba(8, 37, 76, 0.13), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.90), inset 0 -1.5px 4px 0 rgba(0, 56, 147, 0.07)',
        transform: 'translateZ(0)',
        ...style,
      }}
      className={`relative overflow-hidden border-[1.5px] text-[#0f0f0f] ${className}`}
      {...rest}
    >
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
  const { isPreview } = useStageInstance();

  if (isPreview) {
    return <div className={className}>{children}</div>;
  }

  const offset = getDirectionOffset(direction, distance);

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -offset.x * 0.6, y: -offset.y * 0.4 }}
      transition={{
        type: 'spring',
        stiffness: 110,
        damping: 22,
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
  const { isPreview } = useStageInstance();

  if (isPreview) {
    return <div className={className}>{children}</div>;
  }

  const distanceMap = {
    slow: 70,
    medium: 135,
    fast: 210,
  };
  const d = typeof depth === 'number' ? Math.round(120 * depth) : distanceMap[speed];

  const initialOffset =
    direction === 'horizontal' ? { x: d, y: 0 } : { x: 0, y: d * 0.7 };
  const exitOffset =
    direction === 'horizontal' ? { x: -d * 0.75, y: 0 } : { x: 0, y: -d * 0.55 };

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...exitOffset }}
      transition={{
        duration: 0.62,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * 3. <MorphElement layoutId="string">
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
    stiffness: 90,
    damping: 20,
    mass: 0.9,
  },
  ...rest
}) => {
  const { isPreview } = useStageInstance();

  if (isPreview) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout="position"
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
 */
export interface LiquidRevealProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  origin?: string;
  className?: string;
}

export const LiquidReveal: React.FC<LiquidRevealProps> = ({
  children,
  delay = 0,
  duration = 0.9,
  origin = '50% 50%',
  className = '',
  ...rest
}) => {
  const { isPreview } = useStageInstance();

  if (isPreview) {
    return <div className={className}>{children}</div>;
  }

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
  const { isPreview } = useStageInstance();
  const isSlideActive = slideContext ? slideContext.isSlideActive : true;

  if (isPreview) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#f4f2eb] text-[#0f0f0f] select-none ${className}`}>
        <div className="relative w-full h-full">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#f4f2eb] text-[#0f0f0f] select-none ${className}`}>
      <AnimatePresence mode="sync">
        {isSlideActive && (
          <motion.div
            key={slideKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
