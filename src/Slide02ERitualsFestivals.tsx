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
import pashupatinathPhoto from './assets/images/pashupatinath_bagmati_ritual_1794581815956.jpg';
import dashainTiharPhoto from './assets/images/nepal_dashain_tihar_festival_1794581816668.jpg';

export const Slide02ERitualsFestivalsContent: React.FC = () => {
  const [cremationImgErr, setCremationImgErr] = useState(false);
  const [festivalImgErr, setFestivalImgErr] = useState(false);
  const deckContext = useContext(DeckContext);

  const handleSlideAdvance = () => {
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-02e-rituals-festivals" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO ARTÍSTICO FLUIDO (CHAMAS SAGRADAS & LUZES DE OUTONO)
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 45, -25, 0], y: [0, -35, 30, 0] }}
            transition={{ duration: 13, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[130px] top-[230px] w-[440px] h-[440px] rounded-full bg-[#003893]/14 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -45, 35, 0], y: [0, 40, -25, 0] }}
            transition={{ duration: 11, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[140px] bottom-[120px] w-[460px] h-[460px] rounded-full bg-[#dc143c]/15 blur-[85px]"
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
                Ritos de Passagem &amp; Grandes Festivais de Outono
              </span>
            </div>
            <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
              CREMAÇÕES PÚBLICAS, DASHAIN &amp; TIHAR
            </h2>
            <p className="font-sans text-[20px] font-medium text-[#2f3136]/85 mt-1">
              A visão aberta da morte no rio Bagmati e as festas que param o país inteiro nesta época do ano
            </p>
          </div>

          <div className="text-right pb-1">
            <div className="font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-[#08254c]/70">
              Curiosidade do Calendário Oficial (Bikram Sambat)
            </div>
            <div className="font-mono text-[17px] font-extrabold text-[#dc143c] tabular-nums mt-0.5">
              No Nepal já estamos no ano 2083! (+57 anos à frente)
            </div>
          </div>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. CONTEÚDO PRINCIPAL (6 COLUNAS CREMAÇÃO · 6 COLUNAS DASHAIN/TIHAR/CHHATH)
           ===================================================================== */}
        <div className="absolute top-[188px] left-[68px] right-[68px] bottom-[54px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* -------------------------------------------------------------------
              ESQUERDA (6 COLUNAS): RITUAIS DE CREMAÇÃO EM PASHUPATINATH
             ------------------------------------------------------------------- */}
          <div className="col-span-6 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="navy"
              disablePulse={true}
              className="p-6 h-full flex flex-col justify-between"
            >
              {/* Imagem Documental de Pashupatinath */}
              <div className="relative w-full h-[310px] rounded-[24px] overflow-hidden bg-[#08254c]/15">
                {!cremationImgErr ? (
                  <img
                    src={pashupatinathPhoto}
                    alt="Escadarias sagradas de pedra (ghats) do Templo de Pashupatinath às margens do rio Bagmati ao entardecer em Katmandu"
                    referrerPolicy="no-referrer"
                    onError={() => setCremationImgErr(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#08254c] text-white p-6 text-center">
                    <span className="font-display text-[24px] font-black uppercase">
                      Templo de Pashupatinath · Rio Bagmati
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pt-10 pb-4 text-white">
                  <div className="font-display text-[19px] font-extrabold uppercase">
                    Templo de Pashupatinath · Margens do Rio Bagmati
                  </div>
                  <div className="font-sans text-[13.5px] text-white/85">
                    Patrimônio Mundial da UNESCO · Piras funerárias ao ar livre ativas 24h por dia
                  </div>
                </div>
              </div>

              {/* Explicação Antropológica e Comparação com o Brasil */}
              <div className="px-2 pt-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#003893]">
                    Rito Funerário Hindu · Desapego do Corpo &amp; Reencarnação (Samsara)
                  </span>
                  <h3 className="font-display text-[26px] font-black uppercase text-[#080d1a] mt-0.5 mb-3">
                    Cremação ao Ar Livre &amp; Luto Branco
                  </h3>

                  <div className="space-y-3 font-sans text-[16.2px] leading-[1.5] text-[#1c1f26]">
                    <p>
                      Ao contrário dos cemitérios fechados do Brasil, no Nepal a morte é{' '}
                      <strong>pública e cotidiana</strong>: famílias levam o corpo envolto em pano
                      laranja/açafrão até as plataformas de pedra (<em>Arya Ghat</em>), banham os
                      pés do falecido nas águas do <strong>rio Bagmati</strong> (que deságua no
                      Ganges, na Índia) e realizam a cremação em lenha diante de toda a cidade.
                    </p>
                    <p>
                      <strong>Filhos de Cabeça Raspada &amp; Roupa Branca:</strong> Enquanto no
                      Brasil vestimos preto, no Nepal <strong>o luto é branco puro</strong>. Os
                      filhos homens raspam a cabeça, o primogênito circunda a pira 3 vezes e acende
                      o fogo ritual (<em>Daagbatti</em>), cumprindo{' '}
                      <strong>13 dias de reclusão rigorosa (Kriya)</strong> sem sal, carne ou couro.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#08254c]/12 font-sans text-[13.5px] font-semibold text-[#08254c]/85">
                  Desafio cristão: sepultar mortos cristãos exige áreas próprias, pois a tradição
                  majoritária exige cremação fluvial.
                </div>
              </div>
            </LiquidGlassContainer>
          </div>

          {/* -------------------------------------------------------------------
              DIREITA (6 COLUNAS): FESTIVAIS DESTA ÉPOCA (DASHAIN, TIHAR & CHHATH)
             ------------------------------------------------------------------- */}
          <div className="col-span-6 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="crimson"
              disablePulse={true}
              className="p-6 h-full flex flex-col justify-between"
            >
              {/* Imagem Documental dos Festivais */}
              <div className="relative w-full h-[255px] rounded-[24px] overflow-hidden bg-[#dc143c]/15">
                {!festivalImgErr ? (
                  <img
                    src={dashainTiharPhoto}
                    alt="Mandala de flores amarelas e laranjas com lamparinas de barro acesas, pó vermelho de Tika e brotos verdes de Jamara para os festivais de Dashain e Tihar"
                    referrerPolicy="no-referrer"
                    onError={() => setFestivalImgErr(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#dc143c] text-white p-6 text-center">
                    <span className="font-display text-[24px] font-black uppercase">
                      Dashain, Tihar &amp; Chhath
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pt-10 pb-4 text-white">
                  <div className="font-display text-[19px] font-extrabold uppercase">
                    Temporada de Outono (Outubro &amp; Novembro)
                  </div>
                  <div className="font-sans text-[13.5px] text-white/85">
                    Lamparinas Diyo, guirlandas de cravo-de-defunto, Tika vermelha e brotos de Jamara
                  </div>
                </div>
              </div>

              {/* Os 3 Grandes Festivais desta época do ano */}
              <div className="px-2 pt-3.5 flex-1 flex flex-col justify-between gap-2.5">
                <SlideUp delay={0.06} distance={14}>
                  <div className="rounded-2xl bg-white/55 border border-[#dc143c]/25 px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-[18px] font-black uppercase text-[#dc143c]">
                        1. Dashain (Set/Out · 15 Dias)
                      </span>
                      <span className="font-sans text-[12.5px] font-bold text-[#08254c]">
                        Equivale a “Natal + Carnaval” juntos
                      </span>
                    </div>
                    <p className="font-sans text-[14.8px] leading-[1.42] text-[#1c1f26] mt-1">
                      O maior festival do país (vitória da deusa Durga sobre o mal). Escolas e órgãos
                      fecham; milhões voltam às aldeias, empinam pipas, andam em balanços gigantes de
                      bambu (<em>Ping</em>) e recebem na testa a <strong>Tika vermelha</strong>{' '}
                      (arroz, iogurte e vermelhão) + brotos amarelos de <strong>Jamara</strong> das
                      mãos dos mais velhos.
                    </p>
                  </div>
                </SlideUp>

                <SlideUp delay={0.12} distance={14}>
                  <div className="rounded-2xl bg-white/55 border border-[#003893]/25 px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-[18px] font-black uppercase text-[#003893]">
                        2. Tihar — Festival das Luzes (Out/Nov · 5 Dias)
                      </span>
                      <span className="font-sans text-[12.5px] font-bold text-[#dc143c]">
                        Inclui o famoso Dia dos Cães!
                      </span>
                    </div>
                    <p className="font-sans text-[14.8px] leading-[1.42] text-[#1c1f26] mt-1">
                      Celebrado nesta época do ano! Casas brilham com milhares de velas e mandalas{' '}
                      <em>Rangoli</em>. Cada dia honra uma vida: <strong>1º Corvos</strong>,{' '}
                      <strong>2º Cães (Kukur Tihar — até cães de rua ganham colar de flores e Tika!)</strong>,{' '}
                      <strong>3º Vacas</strong>, <strong>4º Bois</strong> e <strong>5º Bhai Tika</strong>{' '}
                      (bênção emocionante entre irmãos e irmãs).
                    </p>
                  </div>
                </SlideUp>

                <SlideUp delay={0.18} distance={14}>
                  <div className="rounded-2xl bg-white/55 border border-[#08254c]/18 px-4 py-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-[18px] font-black uppercase text-[#080d1a]">
                        3. Chhath Parva &amp; A “Deusa Viva” Kumari
                      </span>
                      <span className="font-sans text-[12.5px] font-bold text-[#003893]">
                        Novembro · Pós-Monções
                      </span>
                    </div>
                    <p className="font-sans text-[14.8px] leading-[1.42] text-[#1c1f26] mt-1">
                      Seis dias após o Tihar ocorre o <strong>Chhath</strong>: fiéis em jejum entram
                      nos rios ao pôr e ao nascer do sol agradecendo pela vida. Outra tradição única
                      é a <strong>Kumari</strong>: uma menina pré-púbere escolhida em Katmandu e
                      venerada em palácio como reencarnação viva da deusa Taleju!
                    </p>
                  </div>
                </SlideUp>
              </div>
            </LiquidGlassContainer>
          </div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide02ERitualsFestivals: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide02ERitualsFestivalsContent />
  </Slide>
);

export default Slide02ERitualsFestivals;
