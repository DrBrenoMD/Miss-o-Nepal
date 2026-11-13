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

type MetricMode = 'perCapita' | 'gdp' | 'hdi';

interface CountrySocioMetric {
  id: string;
  country: string;
  regionTag: string;
  gdpBillions: number;
  gdpLabel: string;
  perCapitaUsd: number;
  perCapitaLabel: string;
  hdi: number;
  hdiLabel: string;
  hdiTier: string;
  hdiRank: string;
  isNepal?: boolean;
  isBrazil?: boolean;
}

const COUNTRY_COMPARISON: CountrySocioMetric[] = [
  {
    id: 'usa',
    country: 'Estados Unidos',
    regionTag: 'América do Norte',
    gdpBillions: 28780,
    gdpLabel: 'US$ 28,8 tri',
    perCapitaUsd: 85370,
    perCapitaLabel: 'US$ 85.370',
    hdi: 0.927,
    hdiLabel: '0,927',
    hdiTier: 'Muito Alto',
    hdiRank: '20º',
  },
  {
    id: 'portugal',
    country: 'Portugal',
    regionTag: 'Europa Ocidental',
    gdpBillions: 287,
    gdpLabel: 'US$ 287 bi',
    perCapitaUsd: 27270,
    perCapitaLabel: 'US$ 27.270',
    hdi: 0.874,
    hdiLabel: '0,874',
    hdiTier: 'Muito Alto',
    hdiRank: '42º',
  },
  {
    id: 'argentina',
    country: 'Argentina',
    regionTag: 'América do Sul',
    gdpBillions: 640,
    gdpLabel: 'US$ 640 bi',
    perCapitaUsd: 13710,
    perCapitaLabel: 'US$ 13.710',
    hdi: 0.849,
    hdiLabel: '0,849',
    hdiTier: 'Muito Alto',
    hdiRank: '48º',
  },
  {
    id: 'brazil',
    country: 'Brasil',
    regionTag: 'Referência Nacional',
    gdpBillions: 2170,
    gdpLabel: 'US$ 2,17 tri',
    perCapitaUsd: 10410,
    perCapitaLabel: 'US$ 10.410',
    hdi: 0.76,
    hdiLabel: '0,760',
    hdiTier: 'Alto',
    hdiRank: '89º',
    isBrazil: true,
  },
  {
    id: 'india',
    country: 'Índia',
    regionTag: 'Vizinho Sul/Leste',
    gdpBillions: 3940,
    gdpLabel: 'US$ 3,94 tri',
    perCapitaUsd: 2730,
    perCapitaLabel: 'US$ 2.730',
    hdi: 0.644,
    hdiLabel: '0,644',
    hdiTier: 'Médio',
    hdiRank: '134º',
  },
  {
    id: 'nepal',
    country: 'Nepal',
    regionTag: 'Foco da Missão',
    gdpBillions: 41.3,
    gdpLabel: 'US$ 41,3 bi',
    perCapitaUsd: 1380,
    perCapitaLabel: 'US$ 1.380',
    hdi: 0.601,
    hdiLabel: '0,601',
    hdiTier: 'Médio',
    hdiRank: '146º',
    isNepal: true,
  },
  {
    id: 'haiti',
    country: 'Haiti',
    regionTag: 'Caribe / América',
    gdpBillions: 20.2,
    gdpLabel: 'US$ 20,2 bi',
    perCapitaUsd: 1690,
    perCapitaLabel: 'US$ 1.690',
    hdi: 0.552,
    hdiLabel: '0,552',
    hdiTier: 'Médio',
    hdiRank: '158º',
  },
];

function computeBarPercent(item: CountrySocioMetric, mode: MetricMode): number {
  if (mode === 'perCapita') {
    // Escala raiz quadrada para manter legibilidade visual entre US$ 1.380 e US$ 85.370
    return Math.max(8, (Math.sqrt(item.perCapitaUsd) / Math.sqrt(85370)) * 100);
  }
  if (mode === 'gdp') {
    // Escala logarítmica suave para comparar US$ 20 bi até US$ 28.780 bi
    return Math.max(9, (Math.log10(item.gdpBillions) / Math.log10(28780)) * 100);
  }
  // IDH linear de 0.40 a 1.00
  return Math.max(12, ((item.hdi - 0.4) / 0.6) * 100);
}

export const Slide02AEconomyHDIContent: React.FC = () => {
  const [localMetricMode, setLocalMetricMode] = useState<MetricMode>('perCapita');
  const deckContext = useContext(DeckContext);
  const broadcast = useOptionalBroadcast();
  const stageInstance = useStageInstance();

  const metricMode: MetricMode =
    broadcast && broadcast.mode !== 'standalone'
      ? broadcast.roomState.slideCustomState.economyMetric
      : localMetricMode;

  const setMetricMode = (nextMode: MetricMode) => {
    setLocalMetricMode(nextMode);
    if (broadcast && broadcast.mode !== 'standalone') {
      broadcast.updateSlideCustomState({ economyMetric: nextMode });
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
    <SlideStage slideKey="slide-02a-economy-hdi" className="bg-[#f4f2eb]">
      <div
        onClick={handleSlideAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        {/* =====================================================================
            1. FUNDO ARTÍSTICO FLUIDO & LINHAS TOPOGRÁFICAS ECONÔMICAS
           ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={{ x: [0, 55, -25, 0], y: [0, -35, 30, 0] }}
            transition={{ duration: 13, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute left-[110px] top-[240px] w-[460px] h-[460px] rounded-full bg-[#003893]/14 blur-[85px]"
          />
          <motion.div
            animate={{ x: [0, -50, 40, 0], y: [0, 45, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute right-[140px] bottom-[120px] w-[440px] h-[440px] rounded-full bg-[#dc143c]/14 blur-[85px]"
          />

          <svg viewBox="0 0 1920 1080" className="w-full h-full opacity-20" fill="none">
            <path
              d="M -40 860 L 290 690 L 520 750 L 840 520 L 1120 610 L 1490 310 L 1720 420 L 1960 210"
              stroke="#08254c"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M -40 930 C 380 860, 740 960, 1180 850 C 1520 770, 1740 830, 1960 760"
              stroke="#dc143c"
              strokeWidth="1.8"
              strokeDasharray="8 10"
            />
          </svg>
        </div>

        {/* =====================================================================
            2. CABEÇALHO EDITORIAL PADRONIZADO (COM MORPH ELEMENT)
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
                Panorama Socioeconômico Comparado
              </span>
            </div>
            <h2 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
              PIB, RENDA PER CAPITA &amp; IDH
            </h2>
            <p className="font-sans text-[20px] font-medium text-[#2f3136]/85 mt-1">
              Onde o Nepal (30,8 milhões de hab.) se situa frente ao Brasil e referências globais
            </p>
          </div>

          <div className="text-right pb-1">
            <div className="font-sans text-[13px] font-semibold uppercase tracking-[0.18em] text-[#08254c]/65">
              Fontes Oficiais Consolidada · FMI / Banco Mundial &amp; PNUD
            </div>
            <div className="font-mono text-[15px] font-bold text-[#003893] tabular-nums mt-0.5">
              Moeda Local: Rúpia Nepalesa (NPR) · R$ 1,00 ≈ 24 NPR
            </div>
          </div>
        </CanvaFlowLayer>

        {/* =====================================================================
            3. CORPO PRINCIPAL (12 COLUNAS: TABELA + GRÁFICO INTERATIVO À ESQ, INSIGHTS À DIR)
           ===================================================================== */}
        <div className="absolute top-[188px] left-[68px] right-[68px] bottom-[54px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* -------------------------------------------------------------------
              COLUNA ESQUERDA (7 COLUNAS): PAINEL COMPARATIVO COMPLETO DE PAÍSES
             ------------------------------------------------------------------- */}
          <div className="col-span-7 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="light"
              disablePulse={true}
              className="px-9 py-7 h-full flex flex-col justify-between"
            >
              {/* Topo do Painel + Seletor Funcional de Escala das Barras */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#08254c]/12">
                <div>
                  <h3 className="font-display text-[22px] font-extrabold uppercase tracking-tight text-[#080d1a]">
                    Comparativo Direto entre Nações
                  </h3>
                  <p className="font-sans text-[14.5px] text-[#2f3136]/75 mt-0.5">
                    Todos os 3 indicadores visíveis · Alterne a barra visual conforme o foco
                  </p>
                </div>

                {/* Controle Interativo de Filtro de Métrica */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 p-1 rounded-xl bg-[#08254c]/8 border border-[#08254c]/12"
                >
                  <button
                    type="button"
                    onClick={() => setMetricMode('perCapita')}
                    className={`px-3.5 py-1.5 rounded-lg font-sans text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      metricMode === 'perCapita'
                        ? 'bg-[#003893] text-white shadow-sm'
                        : 'text-[#08254c]/75 hover:text-[#08254c]'
                    }`}
                  >
                    PIB per Capita
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('gdp')}
                    className={`px-3.5 py-1.5 rounded-lg font-sans text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      metricMode === 'gdp'
                        ? 'bg-[#003893] text-white shadow-sm'
                        : 'text-[#08254c]/75 hover:text-[#08254c]'
                    }`}
                  >
                    PIB Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('hdi')}
                    className={`px-3.5 py-1.5 rounded-lg font-sans text-[13px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      metricMode === 'hdi'
                        ? 'bg-[#dc143c] text-white shadow-sm'
                        : 'text-[#08254c]/75 hover:text-[#08254c]'
                    }`}
                  >
                    IDH (PNUD)
                  </button>
                </div>
              </div>

              {/* Cabeçalho das Colunas */}
              <div className="grid grid-cols-12 gap-3 pt-3 pb-1.5 text-[12px] font-sans font-bold uppercase tracking-[0.14em] text-[#08254c]/60">
                <div className="col-span-3">País</div>
                <div className="col-span-3">Escala Relativa</div>
                <div className="col-span-2 text-right">PIB Nominal</div>
                <div className="col-span-2 text-right">Per Capita / Ano</div>
                <div className="col-span-2 text-right">IDH &amp; Posição</div>
              </div>

              {/* Linhas dos 7 Países */}
              <div className="flex-1 flex flex-col justify-between divide-y divide-[#08254c]/10">
                {COUNTRY_COMPARISON.map((row, idx) => {
                  const pct = computeBarPercent(row, metricMode);
                  const rowHighlight = row.isNepal
                    ? 'bg-[#dc143c]/10 -mx-4 px-4 rounded-2xl border border-[#dc143c]/30'
                    : row.isBrazil
                    ? 'bg-[#003893]/8 -mx-4 px-4 rounded-2xl border border-[#003893]/20'
                    : '';

                  return (
                    <SlideUp key={row.id} delay={0.05 * idx} distance={18}>
                      <div
                        className={`grid grid-cols-12 gap-3 items-center py-2.5 ${rowHighlight}`}
                      >
                        {/* Nome do País */}
                        <div className="col-span-3 flex flex-col">
                          <span
                            className={`font-display text-[18px] leading-tight ${
                              row.isNepal
                                ? 'font-black text-[#dc143c]'
                                : row.isBrazil
                                ? 'font-extrabold text-[#003893]'
                                : 'font-bold text-[#0e1218]'
                            }`}
                          >
                            {row.country}
                          </span>
                          <span className="font-sans text-[12.5px] text-[#2f3136]/70">
                            {row.regionTag}
                          </span>
                        </div>

                        {/* Barra Animada */}
                        <div className="col-span-3 pr-2">
                          <div className="w-full h-[12px] rounded-full bg-[#08254c]/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                              className={`h-full rounded-full ${
                                row.isNepal
                                  ? 'bg-[#dc143c]'
                                  : row.isBrazil
                                  ? 'bg-[#003893]'
                                  : 'bg-[#08254c]/55'
                              }`}
                            />
                          </div>
                        </div>

                        {/* PIB Nominal */}
                        <div
                          className={`col-span-2 text-right font-mono text-[15.5px] tabular-nums ${
                            metricMode === 'gdp' ? 'font-extrabold text-[#080d1a]' : 'font-semibold text-[#2f3136]/85'
                          }`}
                        >
                          {row.gdpLabel}
                        </div>

                        {/* PIB Per Capita */}
                        <div
                          className={`col-span-2 text-right font-mono text-[16px] tabular-nums ${
                            row.isNepal
                              ? 'font-black text-[#dc143c]'
                              : row.isBrazil
                              ? 'font-extrabold text-[#003893]'
                              : metricMode === 'perCapita'
                              ? 'font-bold text-[#080d1a]'
                              : 'font-semibold text-[#2f3136]/85'
                          }`}
                        >
                          {row.perCapitaLabel}
                        </div>

                        {/* IDH */}
                        <div className="col-span-2 text-right flex flex-col items-end">
                          <span
                            className={`font-mono text-[16px] tabular-nums ${
                              row.isNepal
                                ? 'font-black text-[#dc143c]'
                                : row.isBrazil
                                ? 'font-extrabold text-[#003893]'
                                : 'font-bold text-[#080d1a]'
                            }`}
                          >
                            {row.hdiLabel}
                          </span>
                          <span className="font-sans text-[11.5px] text-[#2f3136]/70 tabular-nums">
                            {row.hdiTier} · {row.hdiRank}
                          </span>
                        </div>
                      </div>
                    </SlideUp>
                  );
                })}
              </div>

              {/* Nota de rodapé limpa */}
              <div className="pt-3 border-t border-[#08254c]/12 flex items-center justify-between text-[13px] font-sans text-[#2f3136]/75">
                <span>Expectativa de vida: Nepal 70,5 anos · Brasil 76,0 anos</span>
                <span>Escolaridade média adulta: Nepal 5,2 anos · Brasil 8,3 anos</span>
              </div>
            </LiquidGlassContainer>
          </div>

          {/* -------------------------------------------------------------------
              COLUNA DIREITA (5 COLUNAS): CHOQUES DE PROPORÇÃO PARA BRASILEIROS
             ------------------------------------------------------------------- */}
          <div className="col-span-5 h-full flex flex-col justify-between gap-5">
            {/* Bloco 1: PIB Total comparado a Cidades Brasileiras */}
            <LiquidGlassContainer
              intensity="subtle"
              tint="navy"
              disablePulse={true}
              className="px-8 py-6 flex-1 flex flex-col justify-center"
            >
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-[#003893] mb-1">
                01 · Proporção do PIB Nacional
              </div>
              <div className="flex items-baseline gap-3.5 mb-2">
                <span className="font-display text-[44px] font-black text-[#080d1a] tabular-nums leading-none">
                  52× Menor
                </span>
                <span className="font-sans text-[17px] font-bold text-[#003893]">
                  que a economia do Brasil
                </span>
              </div>
              <p className="font-sans text-[17px] leading-[1.5] text-[#1c1f26]">
                Somando tudo o que <strong>30,8 milhões de nepaleses</strong> produzem em um ano
                inteiro (<strong>US$ 41,3 bi</strong>), o valor equivale aproximadamente ao PIB de
                uma única capital brasileira como <strong>Curitiba (PR)</strong> ou metade de{' '}
                <strong>Brasília (DF)</strong>.
              </p>
            </LiquidGlassContainer>

            {/* Bloco 2: Renda Per Capita Mensal em Reais */}
            <LiquidGlassContainer
              intensity="subtle"
              tint="crimson"
              disablePulse={true}
              className="px-8 py-6 flex-1 flex flex-col justify-center"
            >
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-[#dc143c] mb-1">
                02 · Renda Média por Habitante
              </div>
              <div className="flex items-baseline gap-3.5 mb-2">
                <span className="font-display text-[44px] font-black text-[#dc143c] tabular-nums leading-none">
                  ~R$ 650/mês
                </span>
                <span className="font-sans text-[17px] font-bold text-[#080d1a]">
                  7,5× abaixo do brasileiro
                </span>
              </div>
              <p className="font-sans text-[17px] leading-[1.5] text-[#1c1f26]">
                Com PIB per capita de <strong>US$ 1.380/ano</strong> (contra{' '}
                <strong>US$ 10.410 no Brasil</strong> — e até abaixo do PIB per capita nominal do
                Haiti), mais de 60% da força de trabalho ainda depende da agricultura de
                subsistência em terraços nas montanhas.
              </p>
            </LiquidGlassContainer>

            {/* Bloco 3: O Fenômeno das Remessas Internacionais */}
            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              disablePulse={true}
              className="px-8 py-6 flex-1 flex flex-col justify-center"
            >
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-[#08254c] mb-1">
                03 · O Motor Invisível da Economia
              </div>
              <div className="flex items-baseline gap-3.5 mb-2">
                <span className="font-display text-[44px] font-black text-[#003893] tabular-nums leading-none">
                  ~27% do PIB
                </span>
                <span className="font-sans text-[17px] font-bold text-[#080d1a]">
                  vem do exterior (Remessas)
                </span>
              </div>
              <p className="font-sans text-[17px] leading-[1.5] text-[#1c1f26]">
                Um dos países mais dependentes de remessas do planeta: milhões de jovens migram para
                obras e serviços no <strong>Catar, Emirados Árabes, Arábia Saudita, Malásia e Índia</strong>{' '}
                para sustentar suas famílias nas aldeias, ao lado das divisas do{' '}
                <strong>turismo no Himalaia</strong>.
              </p>
            </LiquidGlassContainer>
          </div>
        </div>
      </div>
    </SlideStage>
  );
};

export const Slide02AEconomyHDI: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide02AEconomyHDIContent />
  </Slide>
);

export default Slide02AEconomyHDI;
