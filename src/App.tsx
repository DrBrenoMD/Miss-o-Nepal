/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Deck, Slide, DeckContext } from 'spectacle';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { Cast, Wifi } from 'lucide-react';
import { Slide01CoverContent } from './Slide01Cover';
import { Slide02GeographyContent } from './Slide02Geography';
import { Slide02AEconomyHDIContent } from './Slide02AEconomyHDI';
import { Slide02BLanguagesCastesContent } from './Slide02BLanguagesCastes';
import { Slide02CDailyCustomsContent } from './Slide02CDailyCustoms';
import { Slide02DStreetsMobilityContent } from './Slide02DStreetsMobility';
import { Slide02ERitualsFestivalsContent } from './Slide02ERitualsFestivals';
import { Slide03TimelineContent } from './Slide03Timeline';
import {
  BroadcastProvider,
  useBroadcast,
  StageInstanceProvider,
} from './broadcast/BroadcastContext';
import { BroadcastModal } from './broadcast/BroadcastModal';
import { PresenterConsole } from './broadcast/PresenterConsole';
import { LiveAnnotationOverlay } from './broadcast/LiveAnnotationOverlay';

/**
 * Tema base do Spectacle alinhado ao Design System "Missão Nepal" + Liquid Glass
 * - Proporção nativa 16:9 (1920x1080) escalonada dinamicamente para 4K/8K e Mobile
 * - IMPORTANTE: `backdropStyle` deve manter `position: 'absolute'`, `width: '100%'` e `height: '100%'`
 *   para que o `useAspectRatioFitting` do Spectacle meça a altura real do container em 4K e Celulares.
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

/**
 * Transição suave de fade no container do Spectacle enquanto o CanvaFlowLayer
 * e os MorphElements do Framer Motion deslizam em velocidades ligeiramente diferentes
 * (estilo Transição "Fluxo" do Canva).
 */
const canvaFlowSpectacleTransition = {
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0 },
};

/**
 * Calcula exatamente o maior retângulo 16:9 possível para o viewport atual
 * (desde celulares 320px até telões de 200+ polegadas em 4K 3840x2160 ou 8K 7680x4320),
 * preenchendo 100% da tela ponta a ponta em displays 16:9 sem bordas desperdiçadas.
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
 * Controles em Liquid Glass + Ponte de Sincronização do Spectacle com o Broadcast LAN:
 * - No modo 'screen' (Telão receptor), sincroniza automaticamente o slide ativo com a sala.
 * - Mantém um botão rápido "Transmitir" acessível para iniciar ou conectar dispositivos na rede LAN,
 *   ocultando-se automaticamente quando em Tela Cheia ou no modo Telão Receptor para manter o palco limpo.
 */
const DeckOverlayTemplate: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDeckPositionChange: (slideIndex: number, subStep: number) => void;
}> = ({ isFullscreen, onToggleFullscreen, onDeckPositionChange }) => {
  const { activeView, slideCount, advanceSlide, regressSlide, skipTo } =
    React.useContext(DeckContext);
  const { mode, roomId, connected, roomState, openBroadcastModal } = useBroadcast();

  const activeSlideIndex = activeView?.slideIndex ?? 0;
  const activeStepIndex = activeView?.stepIndex ?? 0;
  const currentSlide = activeSlideIndex + 1;
  const totalSlides = slideCount || 1;

  // Reporta posição local do Deck para que ao abrir "Transmitir" a sala inicie no slide atual
  useEffect(() => {
    if (mode === 'standalone') {
      const hasInternalSteps = activeSlideIndex === 1 || activeSlideIndex === 7;
      const normalizedSubStep = hasInternalSteps
        ? Math.max(0, (typeof activeStepIndex === 'number' ? activeStepIndex : -1) + 1)
        : 0;
      onDeckPositionChange(activeSlideIndex, normalizedSubStep);
    }
  }, [mode, activeSlideIndex, activeStepIndex, onDeckPositionChange]);

  // Quando este dispositivo atua como Telão Receptor ('screen'), sincroniza o slide com o Apresentador
  useEffect(() => {
    if (mode !== 'screen' || typeof skipTo !== 'function') return;
    if (activeSlideIndex !== roomState.slideIndex) {
      skipTo({ slideIndex: roomState.slideIndex, stepIndex: 0 });
    }
  }, [mode, roomState.slideIndex, activeSlideIndex, skipTo]);

  const hideFloatingCastPill = isFullscreen || mode === 'screen';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between"
    >
      {/* Canto superior direito: Acesso rápido "Transmitir" visível em modo janela/celular, oculto em Tela Cheia/Telão */}
      <div className="w-full flex justify-end p-5">
        <div className="pointer-events-auto group">
          <button
            type="button"
            onClick={openBroadcastModal}
            title="Transmitir apresentação para outras telas na rede LAN ou abrir Console do Apresentador"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-lg transition-all duration-300 cursor-pointer ${
              mode === 'screen'
                ? 'bg-[#0b101d]/80 border-emerald-400/40 text-white opacity-0 group-hover:opacity-100 focus:opacity-100'
                : hideFloatingCastPill
                ? 'bg-white/75 border-white/80 text-[#003893] opacity-0 group-hover:opacity-100 focus:opacity-100'
                : 'bg-white/80 hover:bg-[#003893] border-[#003893]/20 text-[#003893] hover:text-white opacity-95 hover:opacity-100'
            }`}
          >
            {mode === 'screen' ? (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Telão · Sala {roomId}</span>
              </>
            ) : (
              <>
                <Cast className="w-3.5 h-3.5 text-[#dc143c] group-hover:text-current transition-colors" />
                <span>Transmitir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Região específica de hover no canto inferior direito */}
      <div className="w-full flex justify-end">
        <div className="pointer-events-auto group p-7 pl-16 pt-12 flex items-center justify-end">
          <div className="flex items-center gap-3.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
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
                className="px-2.5 py-1 text-[12.5px] font-bold uppercase tracking-wider text-[#dc143c] hover:text-[#003893] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                title="Transmitir na rede LAN ou conectar dispositivo"
              >
                <Cast className="w-3.5 h-3.5" />
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
    </div>
  );
};

function AppPresentationShell() {
  const { width, height, scale, isPortraitMobile } = useStage16x9Size();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deckPos, setDeckPos] = useState<{ slideIndex: number; subStep: number }>({
    slideIndex: 0,
    subStep: 0,
  });

  const { mode, roomState, openBroadcastModal } = useBroadcast();

  const handleDeckPositionChange = useCallback((slideIndex: number, subStep: number) => {
    setDeckPos((prev) =>
      prev.slideIndex === slideIndex && prev.subStep === subStep
        ? prev
        : { slideIndex, subStep }
    );
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

  // Se este dispositivo é o Transmissor / Controle Remoto, exibe o Console do Apresentador completo
  if (mode === 'presenter') {
    return (
      <>
        <PresenterConsole />
        <BroadcastModal
          currentDeckSlideIndex={roomState.slideIndex}
          currentDeckSubStep={roomState.subStep}
        />
      </>
    );
  }

  const activeReceiverStrokes = roomState.drawingsBySlide[roomState.slideIndex] || [];

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
        <StageInstanceProvider
          value={{
            isPreview: false,
            forcedSubStep: null,
            disableSlideTapAdvance: mode === 'screen',
          }}
        >
          <LayoutGroup id="missao-nepal-deck">
            <AnimatePresence mode="sync">
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
              </Deck>
            </AnimatePresence>
          </LayoutGroup>
        </StageInstanceProvider>

        {/* Camada vetorial em tempo real (Laser Pointer, Desenhos, Spotlight e Cortina Escura) no Telão Receptor */}
        {mode === 'screen' && (
          <LiveAnnotationOverlay
            strokes={activeReceiverStrokes}
            pointer={roomState.pointer}
            spotlight={roomState.spotlight}
            blackout={roomState.blackout}
            variant="receiver"
          />
        )}
      </div>

      {/* Barra rápida para celulares na vertical (Portrait) com atalho direto para Transmitir / Apresentador */}
      {isPortraitMobile && (
        <div className="mt-3 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-white/85 text-xs font-medium tracking-wide flex flex-wrap items-center justify-center gap-2.5 max-w-[94vw]">
          <span className="text-[11px] text-white/75">
            Gire para 16:9 ou use seu celular como controle:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openBroadcastModal}
              className="px-3 py-1.5 rounded-lg bg-[#dc143c] hover:bg-[#b81132] text-white font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Cast className="w-3 h-3" />
              <span>Transmitir</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-2.5 py-1.5 rounded-lg bg-[#003893] text-white font-bold uppercase text-[10px] tracking-wider cursor-pointer"
            >
              Tela Cheia
            </button>
          </div>
        </div>
      )}

      {/* Modal de Transmissão LAN, Pareamento QR Code e Código de 4 Dígitos */}
      <BroadcastModal
        currentDeckSlideIndex={deckPos.slideIndex}
        currentDeckSubStep={deckPos.subStep}
      />
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

