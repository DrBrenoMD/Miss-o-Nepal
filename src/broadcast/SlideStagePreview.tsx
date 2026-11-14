import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LayoutGroup } from 'framer-motion';
import { SlideContext } from 'spectacle';
import { StageInstanceProvider } from '../StageInstanceContext';
import { SlideMeta, useManagedDeck } from './presentationMetadata';
import {
  InteractiveCanvasHandlers,
  ManagedSlideStageContent,
} from './CustomSlideRenderer';

export interface SlideStagePreviewProps {
  slideIndex: number;
  subStep: number;
  instanceId: string;
  isPreview?: boolean;
  overlay?: React.ReactNode;
  className?: string;
  slideOverride?: SlideMeta;
  interactiveCanvas?: InteractiveCanvasHandlers;
}

export const SlideStagePreview: React.FC<SlideStagePreviewProps> = React.memo(
  ({
    slideIndex,
    subStep,
    instanceId,
    isPreview = true,
    overlay,
    className = '',
    slideOverride,
    interactiveCanvas,
  }) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState<number>(0.35);
    const { activeSlides } = useManagedDeck();

    const targetSlide = useMemo<SlideMeta | undefined>(() => {
      if (slideOverride) return slideOverride;
      return activeSlides[slideIndex] ?? activeSlides[0];
    }, [slideOverride, activeSlides, slideIndex]);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;

      const updateScale = () => {
        const w = el.clientWidth;
        if (w > 0) {
          setScale(w / 1920);
        }
      };

      updateScale();
      const ro = new ResizeObserver(updateScale);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const mockSlideContext = useMemo(
      () => ({
        immediate: true,
        slideId: `${instanceId}-slide-${targetSlide?.id || slideIndex}`,
        isSlideActive: true,
        activationThresholds: {},
        activeStepIndex: subStep,
      }),
      [instanceId, targetSlide?.id, slideIndex, subStep]
    );

    const stageConfig = useMemo(
      () => ({
        isPreview,
        forcedSubStep: subStep,
        disableSlideTapAdvance: true,
      }),
      [isPreview, subStep]
    );

    return (
      <div
        ref={wrapperRef}
        className={`relative w-full aspect-video bg-[#f4f2eb] overflow-hidden select-none ${className}`}
      >
        <div
          style={{
            width: '1920px',
            height: '1080px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className={`${
            interactiveCanvas ? 'pointer-events-auto' : 'pointer-events-none'
          } absolute top-0 left-0 overflow-hidden bg-[#f4f2eb]`}
        >
          <LayoutGroup id={`stage-group-${instanceId}-${targetSlide?.id || slideIndex}`}>
            <SlideContext.Provider value={mockSlideContext as any}>
              <StageInstanceProvider value={stageConfig}>
                {targetSlide ? (
                  <ManagedSlideStageContent
                    slide={targetSlide}
                    interactiveCanvas={interactiveCanvas}
                  />
                ) : null}
              </StageInstanceProvider>
            </SlideContext.Provider>
          </LayoutGroup>
        </div>

        {/* Camada interativa de Laser Pointer / Desenhos / Cortina alinhada sobre o palco 16:9 */}
        {overlay}
      </div>
    );
  }
);
