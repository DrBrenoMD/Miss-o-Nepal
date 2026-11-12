/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Deck, Slide, DeckContext } from 'spectacle';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { Slide01CoverContent } from './Slide01Cover';
import { Slide02GeographyContent } from './Slide02Geography';

/**
 * Tema base do Spectacle alinhado ao Design System "Missão Nepal" + Liquid Glass
 * - Proporção nativa 16:9 (1920x1080)
 * - Fundo Creme/Off-White (#f4f2eb)
 * - Textos Principais em Preto Absoluto (#0f0f0f)
 * - Destaques em Azul Marinho (#003893) e Vermelho Nepal (#dc143c)
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
    backgroundColor: '#0e0f12',
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
 * Controles discretos em Liquid Glass no canto inferior direito
 */
const DeckOverlayTemplate = () => {
  const { activeView, slideCount, advanceSlide, regressSlide } = React.useContext(DeckContext);
  const currentSlide = (activeView?.slideIndex ?? 0) + 1;
  const totalSlides = slideCount || 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-end p-6">
      <div className="flex items-center justify-end gap-4 opacity-70 hover:opacity-100 transition-opacity duration-300">
        {totalSlides > 1 && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/55 backdrop-blur-md border border-white/75 px-4 py-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => regressSlide()}
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#0f0f0f] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="Slide Anterior"
            >
              ← Slide Anterior
            </button>
            <span className="text-[#0f0f0f]/25" aria-hidden="true">|</span>
            <button
              type="button"
              onClick={() => advanceSlide()}
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#003893] hover:text-[#dc143c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="Próximo Slide"
            >
              Próximo Slide →
            </button>
          </div>
        )}
        <div className="text-2xl font-normal tracking-wider text-[#2f3136]/80 font-sans tabular-nums pr-2">
          {String(currentSlide).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <main className="w-screen h-screen bg-[#0e0f12] flex items-center justify-center overflow-hidden p-2 sm:p-4">
      {/* Container principal com proporção estrita 16:9 */}
      <div
        className="relative w-full max-w-[177.78vh] aspect-video max-h-full bg-[#f4f2eb] shadow-2xl overflow-hidden rounded-xl border border-white/15"
        style={{ aspectRatio: '16 / 9' }}
      >
        <LayoutGroup id="missao-nepal-deck">
          <AnimatePresence mode="sync">
            <Deck
              theme={nepalSpectacleTheme}
              transition={canvaFlowSpectacleTransition}
              template={<DeckOverlayTemplate />}
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
    </main>
  );
}
