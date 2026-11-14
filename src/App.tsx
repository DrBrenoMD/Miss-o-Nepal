/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Deck, Slide, DeckContext } from 'spectacle';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { Cast } from 'lucide-react';
import { Slide01CoverContent } from './Slide01Cover';
import { Slide02GeographyContent } from './Slide02Geography';
import { Slide02AEconomyHDIContent } from './Slide02AEconomyHDI';
import { Slide02BLanguagesCastesContent } from './Slide02BLanguagesCastes';
import { Slide02CDailyCustomsContent } from './Slide02CDailyCustoms';
import { Slide02DStreetsMobilityContent } from './Slide02DStreetsMobility';
import { Slide02ERitualsFestivalsContent } from './Slide02ERitualsFestivals';
import { Slide03TimelineContent } from './Slide03Timeline';
import { Slide04TheCallContent } from './Slide04TheCall';
import { Slide05TheJourneyContent } from './Slide05TheJourney';
import { Slide06TheGroupContent } from './Slide06TheGroup';
import { Slide07CulturalIntegrationContent } from './Slide07CulturalIntegration';
import { Slide08BargachhiReceptionContent } from './Slide08BargachhiReception';
import { getSlideStepCount } from './broadcast/presentationMetadata';
import {
  BroadcastProvider,
  useBroadcast,
  useBroadcastOverlay,
  StageInstanceProvider,
} from './broadcast/BroadcastContext';
import { BroadcastModal } from './broadcast/BroadcastModal';
import { PresenterConsole } from './broadcast/PresenterConsole';
import { LiveAnnotationOverlay } from './broadcast/LiveAnnotationOverlay';

/**
 * Tema base do Spectacle alinhado ao Design System "Missão Nepal" + Liquid Glass
 * - Proporção nativa 16:9 (1920x1080) escalonada dinamicamente para 4K/8K e Mobile
 */
const nepalSpectacleTheme = {
  size: {
    width: 1920,
    height: 1080,
    maxCodePaneHeight: 600,
  },
  colors: {
    primary: '#0f0f0f',     // Textos principais: Preto absoluto / cinza muito escuro
    secondary: '#003893',   // Destaque Azul Marinho (Bandeira do Nepal)
    tertiary: '#f4f2eb',    // Fundo Creme / Off-white sólido
    quaternary: '#dc143c',  // Destaque Vermelho Carmesim (Bandeira do Nepal)
    quinary: '#091e42',     // Azul Marinho profundo para contrastes
  },
  fonts: {
    header: '"Montserrat", sans-serif',
    text: '"Plus Jakarta Sans", "Montserrat", sans-serif',
    monospace: 'monospace',
  },
  space: [0, 0, 0],
  backdropStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f2eb',
  },
};

const canvaFlowSpectacleTransition = {
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0 },
};

/**
 * Calcula exatamente o maior retângulo 16:9 possível para o viewport atual
 */
function useStage16x9Size() {
  const compute = useCallback(() => {
    if (typeof window === 'undefined') {
      return { width: 1920, height: 1080, scale: 1, isPortraitMobile: false };
    }
    const vw = window.visualViewport?.width || window.innerWidth || 1920;
    const vh = window.visualViewport?.height || window.innerHeight || 1080;
    const targetRatio = 16 / 9;
    const currentRatio = vw / vh;

    let width: number;
    let height: number;

    if (currentRatio > targetRatio) {
      height = vh;
      width = vh * targetRatio;
    } else {
      width = vw;
      height = vw / targetRatio;
    }

    const scale = width / 1920;
    const isPortraitMobile = vh > vw && vw < 900;

    return { width, height, scale, isPortraitMobile };
  }, []);

  const [stage, setStage] = useState(compute);

  useEffect(() => {
    const handleResize = () => setStage(compute());
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [compute]);

  return stage;
}

/**
 * Controles em Liquid Glass ocultos por padrão no canto inferior direito:
 * - Mantém Anterior, Próximo, Transmitir e Tela Cheia ocultos juntos (revelados apenas por hover/foco/toque no canto).
 * - Sincroniza determinísticamente o slide ativo do Spectacle quando em modo 'screen' (Telão Receptor).
 */
const DeckOverlayTemplate: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDeckPositionChange: (slideIndex: number, subStep: number) => void;
}> = React.memo(({ isFullscreen, onToggleFullscreen, onDeckPositionChange }) => {
  const deckCtx = React.useContext(DeckContext) as any;
  const {
    initialized,
    activeView,
    pendingView,
    slideCount,
    advanceSlide,
    regressSlide,
    skipTo,
    commitTransition,
  } = deckCtx;
  const {
    mode,
    roomId,
    roomState,
    openBroadcastModal,
    reportStandaloneDeckPosition,
  } = useBroadcast();
  const [touchRevealed, setTouchRevealed] = useState(false);

  const activeSlideIndex = activeView?.slideIndex ?? 0;
  const pendingSlideIndex = pendingView?.slideIndex ?? activeSlideIndex;
  const activeStepIndex = activeView?.stepIndex ?? 0;
  const currentSlide = activeSlideIndex + 1;
  const totalSlides = slideCount || 1;

  // Auto-oculta a barra após 4s caso tenha sido aberta por toque no canto em telas touch
  useEffect(() => {
    if (!touchRevealed) return;
    const timer = window.setTimeout(() => setTouchRevealed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [touchRevealed]);

  // Reporta posição local do Deck via Ref (zero re-renders!) para iniciar transmissão no slide atual
  useEffect(() => {
    if (mode === 'standalone') {
      const hasInternalSteps = getSlideStepCount(activeSlideIndex) > 1;
      const normalizedSubStep = hasInternalSteps
        ? Math.max(0, (typeof activeStepIndex === 'number' ? activeStepIndex : -1) + 1)
        : 0;
      onDeckPositionChange(activeSlideIndex, normalizedSubStep);
      reportStandaloneDeckPosition(activeSlideIndex, normalizedSubStep);
    }
  }, [mode, activeSlideIndex, activeStepIndex, onDeckPositionChange, reportStandaloneDeckPosition]);

  // Sincronização determinística do Telão Receptor ('screen') com o Apresentador
  useEffect(() => {
    if (mode !== 'screen' || !initialized) return;
    const targetSlide = roomState.slideIndex;

    if (activeSlideIndex !== targetSlide || pendingSlideIndex !== targetSlide) {
      if (typeof skipTo === 'function') {
        skipTo({ slideIndex: targetSlide, stepIndex: 0 });
      }
    }

    const verifyTimer = window.setTimeout(() => {
      if (activeSlideIndex !== targetSlide && typeof commitTransition === 'function') {
        commitTransition({ slideIndex: targetSlide, stepIndex: 0 });
      }
    }, 240);

    return () => window.clearTimeout(verifyTimer);
  }, [
    mode,
    initialized,
    roomState.slideIndex,
    activeSlideIndex,
    pendingSlideIndex,
    skipTo,
    commitTransition,
  ]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-end items-end"
    >
      {/* Região oculta no canto inferior direito (revela Transmitir + Tela Cheia juntos ao passar o mouse ou tocar no canto) */}
      <div
        onTouchStart={() => setTouchRevealed(true)}
        className="pointer-events-auto group p-7 pl-16 pt-12 flex items-center justify-end"
      >
        <div
          className={`flex items-center gap-3.5 transition-all duration-300 ease-out ${
            touchRevealed
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0'
          }`}
        >
          <div className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-md border border-white/85 px-4 py-1.5 shadow-lg">
            {totalSlides > 1 && mode !== 'screen' && (
              <>
                <button
                  type="button"
                  onClick={() => regressSlide()}
                  className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wider text-[#0f0f0f] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  aria-label="Slide Anterior"
                >
                  ← Anterior
                </button>
                <span className="text-[#0f0f0f]/20" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={() => advanceSlide()}
                  className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wider text-[#003893] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  aria-label="Próximo Slide"
                >
                  Próximo →
                </button>
                <span className="text-[#0f0f0f]/20" aria-hidden="true">|</span>
              </>
            )}

            <button
              type="button"
              onClick={openBroadcastModal}
              className="px-2.5 py-1 text-[12.5px] font-bold uppercase tracking-wider text-[#08254c] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              title="Transmitir apresentação na rede ou abrir Console do Apresentador"
            >
              <Cast className="w-3.5 h-3.5 text-[#dc143c]" />
              <span>{mode === 'screen' ? `Sala ${roomId}` : 'Transmitir'}</span>
            </button>

            <span className="text-[#0f0f0f]/20" aria-hidden="true">|</span>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="px-2.5 py-1 text-[12.5px] font-bold uppercase tracking-wider text-[#08254c] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Alternar Tela Cheia 4K (Atalho: Tecla F)"
            >
              {isFullscreen ? '⤫ Sair' : '⛶ Tela Cheia'}
            </button>
          </div>

          <div className="text-xl font-medium tracking-wider text-[#2f3136]/75 font-sans tabular-nums pr-1">
            {String(currentSlide).padStart(2, '0')}{' '}
            <span className="text-sm text-[#2f3136]/45">/ {String(totalSlides).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Subcomponente isolado para o Laser Pointer, Desenhos Vetoriais, Lupa e Cortina no Telão Receptor.
 * Como consome `useBroadcastOverlay()` isoladamente, movimentos de 60fps do Laser Pointer
 * NUNCA re-renderizam o <Deck> nem os slides da apresentação!
 */
const ReceiverStageOverlay: React.FC = React.memo(() => {
  const { roomState } = useBroadcast();
  const overlay = useBroadcastOverlay();
  const strokes = overlay.drawingsBySlide[roomState.slideIndex] || [];

  return (
    <LiveAnnotationOverlay
      strokes={strokes}
      pointer={overlay.pointer}
      spotlight={overlay.spotlight}
      blackout={overlay.blackout}
      variant="receiver"
    />
  );
});

function AppPresentationShell() {
  const { width, height, scale } = useStage16x9Size();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckPosRef = useRef<{ slideIndex: number; subStep: number }>({
    slideIndex: 0,
    subStep: 0,
  });

  const { mode } = useBroadcast();

  const handleDeckPositionChange = useCallback((slideIndex: number, subStep: number) => {
    deckPosRef.current = { slideIndex, subStep };
  }, []);

  const getDeckPosition = useCallback(() => deckPosRef.current, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Ignora caso bloqueado por política de iframe sem permissão
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [toggleFullscreen]);

  const stageConfig = useMemo(
    () => ({
      isPreview: false,
      forcedSubStep: null,
      disableSlideTapAdvance: mode === 'screen',
    }),
    [mode]
  );

  // Se este dispositivo é o Transmissor / Controle Remoto, exibe o Console do Apresentador completo
  if (mode === 'presenter') {
    return (
      <>
        <PresenterConsole />
        <BroadcastModal />
      </>
    );
  }

  return (
    <main className="w-screen h-screen w-[100dvw] h-[100dvh] bg-[#0e0f12] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Container principal com proporção estrita 16:9 que escala de 320px até 4K (3840x2160) e 8K */}
      <div
        className="nepal-stage-16x9 relative bg-[#f4f2eb] shadow-2xl overflow-hidden shrink-0"
        style={
          {
            width: `${width}px`,
            height: `${height}px`,
            '--stage-scale': scale,
          } as React.CSSProperties
        }
      >
        <StageInstanceProvider value={stageConfig}>
          <LayoutGroup id="missao-nepal-deck">
            <AnimatePresence mode="sync">
              <div className="nepal-deck-host">
                <Deck
                  theme={nepalSpectacleTheme}
                  transition={canvaFlowSpectacleTransition}
                  template={
                    <DeckOverlayTemplate
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                      onDeckPositionChange={handleDeckPositionChange}
                    />
                  }
                >
                  {/* SLIDE 01: CAPA (MISSÃO NEPAL & LIBERDADE RELIGIOSA) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide01CoverContent />
                  </Slide>

                  {/* SLIDE 02: ASPECTOS GEOGRÁFICOS (ANIMAÇÃO CONTÍNUA 3D EM 4 ETAPAS) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02GeographyContent />
                  </Slide>

                  {/* SLIDE 03: ECONOMIA, PIB, PIB PER CAPITA & IDH (COMPARATIVO BRASIL E MUNDO) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02AEconomyHDIContent />
                  </Slide>

                  {/* SLIDE 04: 124 LÍNGUAS FALADAS & O SISTEMA DE CASTAS */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02BLanguagesCastesContent />
                  </Slide>

                  {/* SLIDE 05: COSTUMES COTIDIANOS (GENTILEZA, MÃO ESQUERDA, SAPATOS, DAL BHAT & JUTHO) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02CDailyCustomsContent />
                  </Slide>

                  {/* SLIDE 06: MÃO INGLESA, TRÂNSITO CAÓTICO & VACAS SAGRADAS */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02DStreetsMobilityContent />
                  </Slide>

                  {/* SLIDE 07: RITUAIS DE CREMAÇÃO PÚBLICA & GRANDES FESTIVAIS DE OUTONO (DASHAIN, TIHAR & CHHATH) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide02ERitualsFestivalsContent />
                  </Slide>

                  {/* SLIDE 08: LINHA DO TEMPO HISTÓRICA & AVANÇO DO CRISTIANISMO (8 ETAPAS + GRÁFICO) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide03TimelineContent />
                  </Slide>

                  {/* SLIDE 09: O CHAMADO */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide04TheCallContent />
                  </Slide>

                  {/* SLIDE 10: A VIAGEM (MAPA-MÚNDI 3D: ÔNIBUS + 5 VOOS DE IDA · +60H · 2 ÔNIBUS · 11 VOOS · 7 PAÍSES) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide05TheJourneyContent />
                  </Slide>

                  {/* SLIDE 11: O GRUPO */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide06TheGroupContent />
                  </Slide>

                  {/* SLIDE 12: OS 2 PRIMEIROS DIAS (INTEGRAÇÃO CULTURAL & TURISMO — 5 FOTOS REAIS) */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide07CulturalIntegrationContent />
                  </Slide>

                  {/* SLIDE 13: VIAGEM PARA BARGACHHI & RECEPÇÃO NOTURNA */}
                  <Slide backgroundColor="#f4f2eb" padding={0}>
                    <Slide08BargachhiReceptionContent />
                  </Slide>
                </Deck>
              </div>
            </AnimatePresence>
          </LayoutGroup>
        </StageInstanceProvider>

        {/* Camada vetorial em tempo real isolada (Laser Pointer, Desenhos, Spotlight e Cortina Escura) no Telão Receptor */}
        {mode === 'screen' && <ReceiverStageOverlay />}
      </div>

      {/* Modal de Transmissão P2P / Wi-Fi, Pareamento QR Code e Código de 4 Dígitos */}
      <BroadcastModal getDeckPosition={getDeckPosition} />
    </main>
  );
}

export default function App() {
  return (
    <BroadcastProvider>
      <AppPresentationShell />
    </BroadcastProvider>
  );
}
