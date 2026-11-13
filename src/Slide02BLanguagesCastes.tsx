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
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

interface LanguageEntry {
  name: string;
  scriptSample: string;
  share: string;
  barPct: number;
  note: string;
  accent?: 'crimson' | 'navy';
}

const LANGUAGES_LIST: LanguageEntry[] = [
  {
    name: 'Nepali (Língua Oficial)',
    scriptSample: 'नेपाली · Namaste',
    share: '44,9% materna · ~86% 2ª língua',
    barPct: 86,
    note: 'Ramo indo-ariano (alfabeto Devanágari, primo do Hindi e Sânscrito).',
    accent: 'crimson',
  },
  {
    name: 'Maithili',
    scriptSample: 'मैथिली',
    share: '11,1% da população',
    barPct: 38,
    note: '2ª maior língua do país, predominante nas planícies do Terai oriental.',
    accent: 'navy',
  },
  {
    name: 'Bhojpuri & Tharu',
    scriptSample: 'भोजपुरी · थारु',
    share: '6,2% e 5,9% (12,1% juntos)',
    barPct: 34,
    note: 'Faladas na faixa sulista de fronteira aberta com a Índia.',
  },
  {
    name: 'Tamang, Newari & Magar',
    scriptSample: 'तामाङ · नेपाल भाषा',
    share: '~11% somados',
    barPct: 31,
    note: 'Família tibeto-birmanesa; o Newari é o idioma ancestral de Katmandu.',
  },
  {
    name: 'Sherpa, Gurung + 115 Idiomas & Inglês',
    scriptSample: 'शेर्पा · English',
    share: 'Mais de 124 línguas no Censo',
    barPct: 26,
    note: 'Línguas alpinas himalaias; Inglês é amplamente usado no ensino e turismo.',
  },
];

interface CasteTier {
  id: number;
  title: string;
  nepaliTerm: string;
  share: string;
  surnames: string;
  description: string;
  widthClass: string;
  toneClass: string;
}

const CASTE_PYRAMID: CasteTier[] = [
  {
    id: 1,
    title: '1. Brahmins (Bahun) & Chhetris',
    nepaliTerm: 'Sacerdotes, Intelectuais & Antigos Guerreiros',
    share: '~29% da pop.',
    surnames: 'Sobrenomes: Sharma, Adhikari, Bhattarai, Thapa, Basnet',
    description:
      'Topo ritual e político: concentram a grande maioria dos cargos no Parlamento, Judiciário, universidades e comando militar.',
    widthClass: 'w-[74%]',
    toneClass: 'bg-[#003893]/14 border-[#003893]/35 text-[#080d1a]',
  },
  {
    id: 2,
    title: '2. Adivasi / Janajatis (Etnias das Colinas e Montanhas)',
    nepaliTerm: 'Povos Indígenas Himalaios & Vale de Katmandu',
    share: '~35% da pop.',
    surnames: 'Grupos: Newar, Tamang, Gurung, Magar, Rai, Limbu, Sherpa',
    description:
      'Comunidades de origem tibeto-birmanesa; muitos eram historicamente budistas ou animistas e foram encaixados no meio da hierarquia.',
    widthClass: 'w-[84%]',
    toneClass: 'bg-[#08254c]/9 border-[#08254c]/25 text-[#080d1a]',
  },
  {
    id: 3,
    title: '3. Castas Intermediárias do Terai (Madhesis)',
    nepaliTerm: 'Comerciantes & Agricultores da Planície Sul',
    share: '~22% da pop.',
    surnames: 'Sobrenomes: Yadav, Sah, Mahato, Kurmi, ठाकुर',
    description:
      'Populações culturalmente próximas ao norte da Índia; historicamente sub-representadas na elite política de Katmandu.',
    widthClass: 'w-[92%]',
    toneClass: 'bg-white/60 border-[#08254c]/20 text-[#080d1a]',
  },
  {
    id: 4,
    title: '4. Dalits — "Os Intocáveis" (Pani Nachalne)',
    nepaliTerm: 'Artesãos Tradicionais: Ferreiros, Alfaiates, Sapateiros',
    share: '~13,5% da pop.',
    surnames: 'Sobrenomes: Kami (Bishwakarma), Damai (Pariyar), Sarki',
    description:
      'Base segregada ("aqueles de quem não se aceita água"): sofrem barreiras em casamentos, moradia e templos — grupo mais receptivo à igualdade cristã.',
    widthClass: 'w-full',
    toneClass: 'bg-[#dc143c]/14 border-[#dc143c]/45 text-[#080d1a]',
  },
];

export const Slide02BLanguagesCastesContent: React.FC = () => {
  const [localSelectedTier, setLocalSelectedTier] = useState<number | null>(null);
  const deckContext = useContext(DeckContext);
  const broadcast = useOptionalBroadcast();
  const stageInstance = useStageInstance();

  const selectedTier: number | null =
    broadcast && broadcast.mode !== 'standalone'
      ? broadcast.roomState.slideCustomState.casteTier
      : localSelectedTier;

  const setSelectedTier = (tier: number | null) => {
    setLocalSelectedTier(tier);
    if (broadcast && broadcast.mode !== 'standalone') {
      broadcast.updateSlideCustomState({ casteTier: tier });
    }
  };

  const handleSlideAdvance = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };

  return (
    <SlideStage slideKey="slide-02b-languages-castes" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO ARTÍSTICO FLUIDO & MANDALA GEOMÉTRICA SUTIL
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 40, -30, 0], y: [0, -40, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[220px] bottom-[110px] w-[420px] h-[420px] rounded-full bg-[#003893]/13 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -45, 35, 0], y: [0, 35, -35, 0] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[180px] top-[200px] w-[420px] h-[420px] rounded-full bg-[#dc143c]/13 blur-[85px]"
          />
          <svg viewBox="0 0 1920 1080" className="w-full h-full opacity-15" fill="none">
            <polygon
              points="1460,210 1830,890 1090,890"
              stroke="#08254c"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
            <circle cx="460" cy="560" r="280" stroke="#003893" strokeWidth="1.6" strokeDasharray="5 7" />
          </svg>
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
                Diversidade Linguística &amp; Estratificação Social
              </span>
            </div>
            <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
              124 LÍNGUAS &amp; SISTEMA DE CASTAS
            </h2>
            <p className="font-sans text-[20px] font-medium text-[#2f3136]/85 mt-1">
              Um mosaico de mais de 140 grupos étnicos e uma hierarquia milenar que define destinos
            </p>
          </div>

          <div className="text-right pb-1">
            <div className="font-display text-[28px] font-black text-[#003893] leading-none">
              नमस्ते · नेपाल
            </div>
            <div className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-[#08254c]/65 mt-1">
              Escrita Devanágari Oficial · Censo Nacional do Nepal
            </div>
          </div>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. CONTEÚDO DIVIDIDO (6 COLUNAS LÍNGUAS · 6 COLUNAS SISTEMA DE CASTAS)
           ===================================================================== */}
        <div className="absolute top-[188px] left-[68px] right-[68px] bottom-[54px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* -------------------------------------------------------------------
              ESQUERDA (6 COLUNAS): LÍNGUAS FALADAS (COMPARATIVO COM O BRASIL)
             ------------------------------------------------------------------- */}
          <div className="col-span-6 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="px-9 py-7 h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between border-b border-[#08254c]/12 pb-3.5">
                  <div>
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#003893]">
                      Torre de Babel no Himalaia
                    </span>
                    <h3 className="font-display text-[28px] font-black uppercase tracking-tight text-[#080d1a] mt-0.5">
                      124 Línguas Maternas Vivas
                    </h3>
                  </div>
                  <span className="font-mono text-[32px] font-black text-[#dc143c] tabular-nums">
                    124
                  </span>
                </div>

                {/* Comparação com o Brasil */}
                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26] mt-3.5 mb-4">
                  No <strong>Brasil</strong>, 99%+ da população tem o <strong>Português</strong>{' '}
                  como língua materna de norte a sul. Já no <strong>Nepal</strong> (6× menor que o
                  Mato Grosso), cada vale isolado pelas montanhas preservou seu próprio idioma entre{' '}
                  <strong>duas grandes famílias: Indo-Ariana e Tibeto-Birmanesa</strong>.
                </p>
              </div>

              {/* Lista Visual dos Idiomas */}
              <div className="flex-1 flex flex-col justify-between gap-2.5 my-1">
                {LANGUAGES_LIST.map((lang, idx) => (
                  <SlideUp key={lang.name} delay={0.05 * idx} distance={16}>
                    <div className="py-2 px-4 rounded-2xl bg-white/45 border border-[#08254c]/10">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-display text-[17px] font-extrabold text-[#080d1a]">
                            {lang.name}
                          </span>
                          <span className="font-sans text-[14px] font-bold text-[#003893]">
                            {lang.scriptSample}
                          </span>
                        </div>
                        <span className="font-mono text-[13.5px] font-bold text-[#dc143c] tabular-nums shrink-0">
                          {lang.share}
                        </span>
                      </div>

                      <div className="w-full h-[6px] rounded-full bg-[#08254c]/10 overflow-hidden my-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${lang.barPct}%` }}
                          transition={{ duration: 0.75, delay: 0.1 + idx * 0.06 }}
                          className={`h-full rounded-full ${
                            lang.accent === 'crimson'
                              ? 'bg-[#dc143c]'
                              : lang.accent === 'navy'
                              ? 'bg-[#003893]'
                              : 'bg-[#08254c]/65'
                          }`}
                        />
                      </div>

                      <p className="font-sans text-[14px] text-[#2f3136]/85 leading-snug">
                        {lang.note}
                      </p>
                    </div>
                  </SlideUp>
                ))}
              </div>

              <div className="pt-3 border-t border-[#08254c]/12 text-[13.5px] font-sans text-[#08254c]/85 font-medium">
                Curiosidade para brasileiros: jovens urbanos falam bom <strong>Inglês</strong> e
                quase todos entendem <strong>Hindi</strong> graças aos filmes e músicas da Índia.
              </div>
            </LiquidGlassContainer>
          </div>

          {/* -------------------------------------------------------------------
              DIREITA (6 COLUNAS): SISTEMA DE CASTAS (LEI X REALIDADE COTIDIANA)
             ------------------------------------------------------------------- */}
          <div className="col-span-6 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="navy"
              disablePulse={true}
              className="px-9 py-7 h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between border-b border-[#08254c]/12 pb-3.5">
                  <div>
                    <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#dc143c]">
                      Proibido na Lei desde 1963 · Vivo na Sociedade
                    </span>
                    <h3 className="font-display text-[28px] font-black uppercase tracking-tight text-[#080d1a] mt-0.5">
                      O Sistema de Castas (Jati)
                    </h3>
                  </div>
                  <span className="font-sans text-[14px] font-bold text-[#003893]">
                    O sobrenome revela a casta
                  </span>
                </div>

                <p className="font-sans text-[16.5px] leading-[1.48] text-[#1c1f26] mt-3.5 mb-3">
                  Diferente da desigualdade no Brasil (baseada em renda/classe), a casta no Nepal é{' '}
                  <strong>hereditária e espiritual (Karma)</strong>: ao ouvir o sobrenome de alguém,
                  todos sabem sua posição ritual, com quem pode casar e até na cozinha de quem pode
                  entrar.
                </p>
              </div>

              {/* Pirâmide Interativa em 4 Camadas */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex flex-col items-center justify-between gap-2.5 my-1"
              >
                {CASTE_PYRAMID.map((tier) => {
                  const isFocused = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(isFocused ? null : tier.id)}
                      className={`${tier.widthClass} text-left rounded-2xl border px-5 py-2.5 transition-all cursor-pointer ${
                        tier.toneClass
                      } ${isFocused ? 'ring-2 ring-[#dc143c] scale-[1.01]' : 'hover:opacity-95'}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-[16.5px] font-black">
                          {tier.title}
                        </span>
                        <span className="font-mono text-[13px] font-extrabold text-[#dc143c] tabular-nums shrink-0">
                          {tier.share}
                        </span>
                      </div>
                      <div className="font-sans text-[12.5px] font-bold text-[#003893] mt-0.5">
                        {tier.nepaliTerm} · <span className="font-normal text-[#2f3136]/80">{tier.surnames}</span>
                      </div>
                      <p className="font-sans text-[13.8px] leading-[1.38] text-[#1c1f26] mt-1">
                        {tier.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#08254c]/12 text-[13.5px] font-sans text-[#080d1a] font-medium">
                <strong>Impacto Missionário:</strong> Dentro da igreja cristã nepalesa, Brahmins e
                Dalits sentam lado a lado e partilham da mesma mesa — um testemunho contracultural
                poderoso.
              </div>
            </LiquidGlassContainer>
          </div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide02BLanguagesCastes: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide02BLanguagesCastesContent />
  </Slide>
);

export default Slide02BLanguagesCastes;
