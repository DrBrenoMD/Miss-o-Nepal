import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LayoutGroup } from 'framer-motion';
import { SlideContext } from 'spectacle';
import { StageInstanceProvider } from '../StageInstanceContext';
import { Slide01CoverContent } from '../Slide01Cover';
import { Slide02GeographyContent } from '../Slide02Geography';
import { Slide02AEconomyHDIContent } from '../Slide02AEconomyHDI';
import { Slide02BLanguagesCastesContent } from '../Slide02BLanguagesCastes';
import { Slide02CDailyCustomsContent } from '../Slide02CDailyCustoms';
import { Slide02DStreetsMobilityContent } from '../Slide02DStreetsMobility';
import { Slide02ERitualsFestivalsContent } from '../Slide02ERitualsFestivals';
import { Slide03TimelineContent } from '../Slide03Timeline';
import { Slide04TheCallContent } from '../Slide04TheCall';
import { Slide05TheJourneyContent } from '../Slide05TheJourney';
import { Slide06TheGroupContent } from '../Slide06TheGroup';
import { Slide07CulturalIntegrationContent } from '../Slide07CulturalIntegration';
import { Slide08BargachhiReceptionContent } from '../Slide08BargachhiReception';

export interface SlideStagePreviewProps {
  slideIndex: number;
  subStep: number;
  instanceId: string;
  isPreview?: boolean;
  overlay?: React.ReactNode;
  className?: string;
}

const MemoizedStageSlide: React.FC<{ slideIndex: number }> = React.memo(({ slideIndex }) => {
  switch (slideIndex) {
    case 0:
      return <Slide01CoverContent />;
    case 1:
      return <Slide02GeographyContent />;
    case 2:
      return <Slide02AEconomyHDIContent />;
    case 3:
      return <Slide02BLanguagesCastesContent />;
    case 4:
      return <Slide02CDailyCustomsContent />;
    case 5:
      return <Slide02DStreetsMobilityContent />;
    case 6:
      return <Slide02ERitualsFestivalsContent />;
    case 7:
      return <Slide03TimelineContent />;
    case 8:
      return <Slide04TheCallContent />;
    case 9:
      return <Slide05TheJourneyContent />;
    case 10:
      return <Slide06TheGroupContent />;
    case 11:
      return <Slide07CulturalIntegrationContent />;
    case 12:
      return <Slide08BargachhiReceptionContent />;
    default:
      return <Slide01CoverContent />;
  }
});

export const SlideStagePreview: React.FC<SlideStagePreviewProps> = React.memo(
  ({ slideIndex, subStep, instanceId, isPreview = true, overlay, className = '' }) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState<number>(0.35);

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
        slideId: `${instanceId}-slide-${slideIndex}`,
        isSlideActive: true,
        activationThresholds: {},
        activeStepIndex: subStep,
      }),
      [instanceId, slideIndex, subStep]
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
          className="pointer-events-none absolute top-0 left-0 overflow-hidden bg-[#f4f2eb]"
        >
          <LayoutGroup id={`stage-group-${instanceId}-${slideIndex}`}>
            <SlideContext.Provider value={mockSlideContext as any}>
              <StageInstanceProvider value={stageConfig}>
                <MemoizedStageSlide slideIndex={slideIndex} />
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
