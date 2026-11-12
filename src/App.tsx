/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Deck, Slide, DeckContext } from 'spectacle';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { Slide01CoverContent } from './Slide01Cover';
import { Slide02GeographyContent } from './Slide02Geography';

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
 * Controles em Liquid Glass integrados ao palco 1920x1080 + Atalho de Tela Cheia (4K / Projetor)
 */
const DeckOverlayTemplate: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({ isFullscreen, onToggleFullscreen }) => {
  const { activeView, slideCount, advanceSlide, regressSlide } = React.useContext(DeckContext);
  const currentSlide = (activeView?.slideIndex ?? 0) + 1;
  const totalSlides = slideCount || 1;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-end p-7"
    >
      <div className="flex items-center justify-end gap-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 px-5 py-2 shadow-lg">
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={() => regressSlide()}
                className="px-2.5 py-1 text-[14px] font-bold uppercase tracking-wider text-[#0f0f0f] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Slide Anterior"
              >
                ← Slide Anterior
              </button>
              <span className="text-[#0f0f0f]/25" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => advanceSlide()}
                className="px-2.5 py-1 text-[14px] font-bold uppercase tracking-wider text-[#003893] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Próximo Slide"
              >
                Próximo Slide →
              </button>
              <span className="text-[#0f0f0f]/25" aria-hidden="true">|</span>
            </>
          )}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wider text-[#08254c] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Alternar Tela Cheia 4K (Atalho: Tecla F)"
          >
            {isFullscreen ? '⤫ Sair da Tela Cheia' : '⛶ Tela Cheia 4K'}
          </button>
        </div>

        <div className="text-2xl font-normal tracking-wider text-[#2f3136]/80 font-sans tabular-nums pr-2">
          {String(currentSlide).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { width, height, scale, isPortraitMobile } = useStage16x9Size();
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      if (
        (e.key === 'f' || e.key === 'F') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
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
        <LayoutGroup id="missao-nepal-deck">
          <AnimatePresence mode="sync">
            <Deck
              theme={nepalSpectacleTheme}
              transition={canvaFlowSpectacleTransition}
              template={
                <DeckOverlayTemplate
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
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
            </Deck>
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Dica discreta em celulares na vertical (Portrait) */}
      {isPortraitMobile && (
        <div className="mt-3 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/85 text-xs font-medium tracking-wide flex items-center gap-3">
          <span>Toque no slide para avançar ou gire o celular para horizontal (16:9)</span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-full bg-[#003893] text-white font-bold uppercase text-[10px] tracking-wider"
          >
            Tela Cheia
          </button>
        </div>
      )}
    </main>
  );
}

