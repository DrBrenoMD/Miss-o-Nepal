/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Deck, Slide, DeckContext } from 'spectacle';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { Cast, Sliders } from 'lucide-react';
import {
  BroadcastProvider,
  useBroadcast,
  useBroadcastOverlay,
  StageInstanceProvider,
} from './broadcast/BroadcastContext';
import { BroadcastModal } from './broadcast/BroadcastModal';
import { SlideManagerModal } from './broadcast/SlideManagerModal';
import { PresenterConsole } from './broadcast/PresenterConsole';
import { LiveAnnotationOverlay } from './broadcast/LiveAnnotationOverlay';
import { useManagedDeck } from './broadcast/presentationMetadata';
import { ManagedSlideStageContent } from './broadcast/CustomSlideRenderer';

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
  registerSkipToRef?: React.MutableRefObject<((slideIndex: number) => void) | null>;
}> = React.memo(
  ({ isFullscreen, onToggleFullscreen, onDeckPositionChange, registerSkipToRef }) => {
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
      openSlideManager,
      reportStandaloneDeckPosition,
    } = useBroadcast();
    const { activeSlides } = useManagedDeck();
    const [touchRevealed, setTouchRevealed] = useState(false);

    const activeSlideIndex = activeView?.slideIndex ?? 0;
    const pendingSlideIndex = pendingView?.slideIndex ?? activeSlideIndex;
    const activeStepIndex = activeView?.stepIndex ?? 0;
    const currentSlide = activeSlideIndex + 1;
    const totalSlides = slideCount || activeSlides.length || 1;

    useEffect(() => {
      if (!registerSkipToRef) return;
      registerSkipToRef.current = (targetSlideIdx: number) => {
        if (typeof skipTo === 'function') {
          skipTo({ slideIndex: targetSlideIdx, stepIndex: 0 });
        }
      };
      return () => {
        registerSkipToRef.current = null;
      };
    }, [registerSkipToRef, skipTo]);

    // Auto-oculta a barra após 4s caso tenha sido aberta por toque no canto em telas touch
    useEffect(() => {
      if (!touchRevealed) return;
      const timer = window.setTimeout(() => setTouchRevealed(false), 4000);
      return () => window.clearTimeout(timer);
    }, [touchRevealed]);

    // Reporta posição local do Deck via Ref (zero re-renders!) para iniciar transmissão no slide atual
    useEffect(() => {
      if (mode === 'standalone') {
        const currentMeta = activeSlides[activeSlideIndex];
        const hasInternalSteps = (currentMeta?.steps.length ?? 1) > 1;
        const normalizedSubStep = hasInternalSteps
          ? Math.max(0, (typeof activeStepIndex === 'number' ? activeStepIndex : -1) + 1)
          : 0;
        onDeckPositionChange(activeSlideIndex, normalizedSubStep);
        reportStandaloneDeckPosition(activeSlideIndex, normalizedSubStep);
      }
    }, [
      mode,
      activeSlideIndex,
      activeStepIndex,
      activeSlides,
      onDeckPositionChange,
      reportStandaloneDeckPosition,
    ]);

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
        {/* Região oculta no canto inferior direito (revela Gerenciar Slides + Transmitir + Tela Cheia ao passar o mouse ou tocar no canto) */}
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

              {mode !== 'screen' && (
                <>
                  <button
                    type="button"
                    onClick={openSlideManager}
                    className="px-2.5 py-1 text-[12.5px] font-bold uppercase tracking-wider text-[#003893] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Selecionar slides exibidos, reordenar, inserir/excluir e abrir Editor de Slides"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#003893]" />
                    <span>Gerenciar Slides</span>
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
  }
);

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
  const skipToRef = useRef<((slideIndex: number) => void) | null>(null);

  const { mode } = useBroadcast();
  const { activeSlides } = useManagedDeck();

  const deckStructuralKey = useMemo(
    () => activeSlides.map((s) => `${s.id}:${s.steps.length}`).join('|'),
    [activeSlides]
  );

  const handleDeckPositionChange = useCallback((slideIndex: number, subStep: number) => {
    deckPosRef.current = { slideIndex, subStep };
  }, []);

  const getDeckPosition = useCallback(() => deckPosRef.current, []);

  const handleNavigateStandaloneDeck = useCallback((targetSlideIndex: number) => {
    if (skipToRef.current) {
      skipToRef.current(targetSlideIndex);
    }
  }, []);

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
        <SlideManagerModal />
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
                  key={deckStructuralKey}
                  theme={nepalSpectacleTheme}
                  transition={canvaFlowSpectacleTransition}
                  template={
                    <DeckOverlayTemplate
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                      onDeckPositionChange={handleDeckPositionChange}
                      registerSkipToRef={skipToRef}
                    />
                  }
                >
                  {activeSlides.map((slide) => (
                    <Slide key={slide.id} backgroundColor="#f4f2eb" padding={0}>
                      <ManagedSlideStageContent slide={slide} />
                    </Slide>
                  ))}
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

      {/* Modal de Gerenciamento e Editor Visual 16:9 de Slides */}
      <SlideManagerModal onNavigateToActiveSlide={handleNavigateStandaloneDeck} />
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
