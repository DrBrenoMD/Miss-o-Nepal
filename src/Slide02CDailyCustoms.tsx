import React, { useState, useContext } from 'react';
import { Slide, DeckContext } from 'spectacle';
import { motion } from 'framer-motion';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
  SlideUp,
} from './AnimationWrappers';
import dalBhatPhoto from './assets/images/nepal_dal_bhat_hospitality_1794581813124.jpg';

export const Slide02CDailyCustomsContent: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);
  const deckContext = useContext(DeckContext);

  const handleSlideAdvance = () => {
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-02c-daily-customs" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO FLUIDO COM ONDAS ORGÂNICAS DE VAPOR & CHÁ
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 50, -20, 0], y: [0, -35, 25, 0] }}
            transition={{ duration: 13, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[90px] top-[250px] w-[430px] h-[430px] rounded-full bg-[#dc143c]/12 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -40, 35, 0], y: [0, 40, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[130px] bottom-[100px] w-[450px] h-[450px] rounded-full bg-[#003893]/14 blur-[85px]"
          />
        </div>

        {/* =====================================================================
            2. CABEÇALHO EDITORIAL PADRONIZADO
           ===================================================================== */}
        <CanvaFlowLayer
          speed="slow"
          className="pointer-events-none absolute top-[40px] left-[68px] right-[68px] z-30 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <MorphElement layoutId="hero-main-title">
                <span className="font-display text-[21px] font-black uppercase tracking-[0.24em] text-[#003893]">
                  MISSÃO NEPAL
                </span>
              </MorphElement>
              <span className="text-[#0f0f0f]/30" aria-hidden="true">·</span>
              <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.18em] text-[#dc143c]">
                Costumes Cotidianos, Pureza Ritual &amp; Gastronomia
              </span>
            </div>
            <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
              GENTILEZA EXTREMA, ETIQUETA &amp; MESA
            </h2>
            <p className="font-sans text-[20px] font-medium text-[#2f3136]/85 mt-1">
              O contraste fascinante entre os hábitos brasileiros e os códigos sagrados do lar nepalês
            </p>
          </div>

          <div className="text-right pb-1">
            <div className="font-display text-[20px] font-extrabold uppercase tracking-[0.12em] text-[#08254c]">
              “Atithi Devo Bhava”
            </div>
            <div className="font-sans text-[13.5px] font-medium text-[#2f3136]/75">
              Provérbio Ancestral: “O visitante é tratado como Deus”
            </div>
          </div>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. GRADE PRINCIPAL (7 COLUNAS DE 4 COSTUMES · 5 COLUNAS FOTO + JUTHO)
           ===================================================================== */}
        <div className="absolute top-[188px] left-[68px] right-[68px] bottom-[54px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* -------------------------------------------------------------------
              ESQUERDA (7 COLUNAS): 4 CARDS DE COSTUMES ESSENCIAIS (2x2)
             ------------------------------------------------------------------- */}
          <div className="col-span-7 h-full grid grid-cols-2 grid-rows-2 gap-6">
            {/* CARD 1: GENTILEZA EXTREMA & NAMASTE */}
            <SlideUp delay={0.05} distance={20} className="h-full">
              <LiquidGlassContainer
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="px-7 py-6 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#003893]">
                      01 · Acolhimento &amp; Saudação
                    </span>
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                      <path
                        d="M18 5 L13 18 L15 29 L18 27 M18 5 L23 18 L21 29 L18 27"
                        stroke="#003893"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-[23px] font-black uppercase text-[#080d1a] leading-tight mb-2.5">
                    Gentileza Extrema &amp; Namaste
                  </h3>
                  <p className="font-sans text-[16.2px] leading-[1.52] text-[#1c1f26]">
                    Diferente dos abraços e beijos do Brasil, une-se as palmas ao peito dizendo{' '}
                    <strong>“Namaste”</strong> (ou <em>“Namaskar”</em> aos mais velhos), sem toque
                    físico entre homens e mulheres. Mesmo na pobreza severa, oferecem sorriso doce,
                    voz mansa e um copo quente de <strong>Chiya</strong> (chá com leite e especiarias).
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#08254c]/10 font-sans text-[13px] font-semibold text-[#08254c]/75">
                  Balançar a cabeça de um lado para o outro (“head wobble”) significa “Sim / Tudo bem!”
                </div>
              </LiquidGlassContainer>
            </SlideUp>

            {/* CARD 2: NUNCA USAR A MÃO ESQUERDA */}
            <SlideUp delay={0.1} distance={20} className="h-full">
              <LiquidGlassContainer
                intensity="subtle"
                tint="crimson"
                disablePulse={true}
                className="px-7 py-6 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#dc143c]">
                      02 · Regra de Ouro da Etiqueta
                    </span>
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                      <circle cx="18" cy="18" r="13" stroke="#dc143c" strokeWidth="2.2" />
                      <path d="M10 26 L26 10" stroke="#dc143c" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="font-display text-[23px] font-black uppercase text-[#080d1a] leading-tight mb-2.5">
                    Proibido Usar a Mão Esquerda
                  </h3>
                  <p className="font-sans text-[16.2px] leading-[1.52] text-[#1c1f26]">
                    A <strong>mão esquerda é reservada à higiene íntima</strong> (feita com água nos
                    banheiros orientais) e considerada impura. Comer, entregar dinheiro, presentes ou
                    cumprimentar com a esquerda é grave gafe. Usa-se sempre a{' '}
                    <strong>mão direita</strong> — ou as duas mãos juntas em sinal de alta reverência!
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#08254c]/10 font-sans text-[13px] font-semibold text-[#dc143c]">
                  Dica: apoiar o pulso direito com a mão esquerda ao pagar demonstra profundo respeito.
                </div>
              </LiquidGlassContainer>
            </SlideUp>

            {/* CARD 3: TIRAR OS SAPATOS NA PORTA */}
            <SlideUp delay={0.15} distance={20} className="h-full">
              <LiquidGlassContainer
                intensity="subtle"
                tint="navy"
                disablePulse={true}
                className="px-7 py-6 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#003893]">
                      03 · Espaço Limpo &amp; Sagrado
                    </span>
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                      <path
                        d="M5 24 C8 24, 12 16, 16 16 L22 20 C27 20, 31 21, 31 25 L5 25 Z"
                        stroke="#003893"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-[23px] font-black uppercase text-[#080d1a] leading-tight mb-2.5">
                    Tirar os Sapatos Sempre
                  </h3>
                  <p className="font-sans text-[16.2px] leading-[1.52] text-[#1c1f26]">
                    Calçados trazem a poeira e a impureza da rua: ficam obrigatoriamente do lado de
                    fora em <strong>todas as casas, templos, estupas, igrejas nepalesas</strong> e
                    até em lojas de tapetes, clínicas e salas de aula. Os pés são a parte mais
                    impura do corpo (e a cabeça, a mais sagrada).
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#08254c]/10 font-sans text-[13px] font-semibold text-[#08254c]/75">
                  Jamais aponte a sola do pé para pessoas ou pise sobre livros, mochilas e alimentos.
                </div>
              </LiquidGlassContainer>
            </SlideUp>

            {/* CARD 4: ALIMENTAÇÃO (DAL BHAT & VACA SAGRADA) */}
            <SlideUp delay={0.2} distance={20} className="h-full">
              <LiquidGlassContainer
                intensity="subtle"
                tint="light"
                disablePulse={true}
                className="px-7 py-6 h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#dc143c]">
                      04 · O “Arroz e Feijão” do Himalaia
                    </span>
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                      <path
                        d="M6 19 C6 26, 30 26, 30 19 Z M14 13 C14 10, 16 9, 16 7 M21 13 C21 10, 23 9, 23 7"
                        stroke="#dc143c"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-[23px] font-black uppercase text-[#080d1a] leading-tight mb-2.5">
                    Dal Bhat &amp; Comer com a Mão
                  </h3>
                  <p className="font-sans text-[16.2px] leading-[1.52] text-[#1c1f26]">
                    Duas vezes ao dia (10h e 19h) come-se o <strong>Dal Bhat</strong> (sopa de
                    lentilha, arroz, vegetais com curry e pimenta), misturado e levado à boca{' '}
                    <strong>com os dedos da mão direita</strong>! Amam também <strong>Momos</strong>{' '}
                    (pastéis a vapor). <strong>Carne bovina é proibida</strong> (a vaca é sagrada):
                    come-se frango, cabra e búfalo.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#08254c]/10 font-sans text-[13px] font-semibold text-[#003893]">
                  Lema dos carregadores do Everest: “Dal Bhat Power, 24 Hour!” (reposição livre!)
                </div>
              </LiquidGlassContainer>
            </SlideUp>
          </div>

          {/* -------------------------------------------------------------------
              DIREITA (5 COLUNAS): FOTO DOCUMENTAL + CURIOSIDADE DO "JUTHO"
             ------------------------------------------------------------------- */}
          <div className="col-span-5 h-full flex flex-col justify-between gap-6">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="p-4 flex-1 flex flex-col justify-between"
            >
              <div className="relative w-full h-[460px] rounded-[26px] overflow-hidden bg-[#08254c]/10">
                {!imgFailed ? (
                  <img
                    src={dalBhatPhoto}
                    alt="Bandeja tradicional de bronze com Dal Bhat Tarkari e chá masala Chiya no Nepal"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#08254c] to-[#003893] text-white p-8 text-center">
                    <span className="font-display text-[28px] font-black uppercase">
                      Dal Bhat Tarkari &amp; Chiya
                    </span>
                    <span className="font-sans text-[16px] opacity-80 mt-2">
                      Bandeja tradicional de latão nepalesa servida no almoço e jantar
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pt-12 pb-5 text-white">
                  <div className="font-display text-[20px] font-extrabold uppercase tracking-wide">
                    Thali Tradicional de Dal Bhat &amp; Chiya
                  </div>
                  <div className="font-sans text-[14px] text-white/85 mt-0.5">
                    Lentilhas, arroz, legumes condimentados, achar picante e chá com especiarias
                  </div>
                </div>
              </div>

              {/* Curiosidade Extra de Alto Impacto: Conceito de "Jutho" */}
              <div className="px-4 pt-4 pb-2">
                <div className="font-sans text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#dc143c] mb-1">
                  Curiosidade Chave · O Conceito de “Jutho” (Impureza da Saliva)
                </div>
                <p className="font-sans text-[16.5px] leading-[1.5] text-[#0e1218]">
                  No Brasil dividimos garrafinha d’água ou provamos a comida do amigo; no Nepal,
                  qualquer alimento ou copo que encoste nos lábios vira <strong>“Jutho”</strong>{' '}
                  (contaminado ritualmente). Por isso, nepaleses são mestres em{' '}
                  <strong>beber água despejando o jato no ar sem encostar a garrafa na boca!</strong>
                </p>
              </div>
            </LiquidGlassContainer>
          </div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide02CDailyCustoms: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide02CDailyCustomsContent />
  </Slide>
);

export default Slide02CDailyCustoms;
