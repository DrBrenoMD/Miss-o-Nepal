import React, { useState } from 'react';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
  SlideUp,
} from './AnimationWrappers';
import { MediaAssetSlot, PERSONAL_MEDIA_SLOTS } from './personalMediaManifest';
import {
  PureSlideTitleHeader,
  EditorialMediaFrame,
  MediaLightboxModal,
  PressClippingItem,
  PressClippingCard,
  PressClippingLightbox,
  useMinimalistSlideAdvance,
} from './EditorialMediaComponents';

/* ============================================================================
   SLIDE 15 (7): DENÚNCIA & POLÍCIA — APENAS TÍTULO + FOTO REAL DO POLICIAL/ESPIÃO & VIATURA
   ============================================================================ */
export const Slide15DenunciationPoliceContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-15-denunciation-police" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="DENÚNCIA & POLÍCIA"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 gap-7 items-stretch">
          {/* Esquerda (5 cols — vertical nativo): Foto real tirada pela janela do policial nepalês + agente à paisana */}
          <SlideUp delay={0.05} distance={22} className="col-span-5 h-full">
            <LiquidGlassContainer
              intensity="medium"
              tint="crimson"
              disablePulse={true}
              className="h-full p-3.5"
            >
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.policeCompoundReal}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          {/* Direita (7 cols): Fotografia da Polícia Nepalesa */}
          <SlideUp delay={0.12} distance={22} className="col-span-7 h-full">
            <LiquidGlassContainer
              intensity="strong"
              tint="light"
              disablePulse={true}
              className="h-full p-3.5"
            >
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.nepalPolicePatrol}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 16 (8): PRINTS DE NOTÍCIAS — 10 ESTRANGEIROS PRESOS NO NEPAL
   ============================================================================ */
const ARREST_NEWS_CLIPPINGS: PressClippingItem[] = [
  {
    id: 'ratopati-ne',
    outlet: 'रातोपाटी · Ratopati',
    domain: 'ratopati.com/story/morang-bargachhi',
    countryTag: 'NEPAL · नेपाली',
    languageTag: 'NE',
    dateLabel: '29 Out 2025',
    sectionLabel: 'प्रहरी / सुरक्षा',
    accentColor: '#dc143c',
    headline: 'मोरङको बरगाछीबाट धर्म प्रचारको आरोपमा १० विदेशी नागरिक पक्राउ',
    translationPt:
      '10 cidadãos estrangeiros detidos em Bargachhi, Morang, sob acusação de propagação religiosa',
    dateline: 'BIRATNAGAR',
    lead: 'स्वास्थ्य शिविर सञ्चालनको आडमा पर्यटक भिसाको दुरुपयोग गरी धर्म प्रचार गरेको आरोपमा प्रहरीले ३ ब्राजिलियन, ५ अमेरिकी र २ क्यानेडियन नागरिकलाई नियन्त्रणमा लिएको छ।',
  },
  {
    id: 'himalayan-times-en',
    outlet: 'The Himalayan Times',
    domain: 'thehimalayantimes.com/nepal',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 29, 2025',
    sectionLabel: 'National · Morang',
    accentColor: '#08254c',
    headline:
      '10 foreigners detained in Morang over alleged missionary activities at health camp',
    dateline: 'MORANG',
    lead: 'District Police Office Morang detained ten foreign nationals from Bargachhi in Kanepokhari for allegedly conducting evangelistic activities while running a free medical camp on tourist visas.',
  },
  {
    id: 'uca-news-en',
    outlet: 'UCA News',
    domain: 'ucanews.com/news/nepal',
    countryTag: 'ÁSIA · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 30, 2025',
    sectionLabel: 'Religious Freedom',
    accentColor: '#b91c1c',
    headline:
      'Nepal arrests 10 foreigners — 5 Americans, 3 Brazilians, 2 Canadians — in Morang raid',
    dateline: 'KATHMANDU',
    lead: 'Police seized passports of ten Christian healthcare volunteers partnered with a local church in eastern Nepal and transferred them to the Department of Immigration in Kathmandu.',
  },
  {
    id: 'cpad-br',
    outlet: 'CPAD News',
    domain: 'cpadnews.com.br/mundo-cristao',
    countryTag: 'BRASIL · PT',
    languageTag: 'PT',
    dateLabel: '31 Out 2025',
    sectionLabel: 'Missões & Perseguição',
    accentColor: '#003893',
    headline:
      'Três brasileiros estão entre os 10 voluntários cristãos detidos pela polícia no Nepal',
    dateline: 'CATMANDU',
    lead: 'Grupo realizava atendimentos médicos humanitários gratuitos em vilarejo próximo a Biratnagar quando autoridades locais interromperam a ação com base na rígida lei anticonversão nepalesa.',
  },
  {
    id: 'nepal-news-en',
    outlet: 'Nepal News',
    domain: 'nepalnews.com/s/nation',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 29, 2025',
    sectionLabel: 'Law & Immigration',
    accentColor: '#dc143c',
    headline:
      'Ten foreign nationals held in Kanepokhari, Bargachhi for operating camp on tourist visas',
    dateline: 'BIRATNAGAR',
    lead: 'Authorities stated the foreign medical team lacked prior approval from the Nepal Medical Council and violated visa terms, forwarding the case to Immigration officials.',
  },
  {
    id: 'setopati-ne',
    outlet: 'सेतोपाटी · Setopati',
    domain: 'setopati.com/social/immigration',
    countryTag: 'NEPAL · नेपाली',
    languageTag: 'NE',
    dateLabel: '30 Out 2025',
    sectionLabel: 'अध्यागमन',
    accentColor: '#0f4c81',
    headline:
      'मोरङबाट पक्राउ परेका १० विदेशी नागरिकलाई काठमाडौं अध्यागमन विभागमा पठाइयो',
    translationPt:
      'Os 10 estrangeiros detidos em Morang são encaminhados ao Departamento de Imigração em Katmandu',
    dateline: 'KATHMANDU',
    lead: 'जिल्ला प्रहरी कार्यालय मोरङले आवश्यक अनुसन्धान र भिसा सम्बन्धी कारबाहीका लागि उनीहरूलाई काठमाडौं पठाएको जनाएको छ।',
  },
  {
    id: 'annapurna-en',
    outlet: 'The Annapurna Express',
    domain: 'theannapurnaexpress.com',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 31, 2025',
    sectionLabel: 'Home Affairs',
    accentColor: '#1e293b',
    headline:
      'Home Ministry probes 10 foreign nationals linked to Mercy Development health camp',
    dateline: 'KATHMANDU',
    lead: 'Following the earlier detention of South Korean nationals in Morang, authorities intensified scrutiny over foreign-assisted community clinics and religious gatherings in Koshi Province.',
  },
  {
    id: 'folha-gospel-br',
    outlet: 'Folha Gospel',
    domain: 'folhagospel.com/internacional',
    countryTag: 'BRASIL · PT',
    languageTag: 'PT',
    dateLabel: '01 Nov 2025',
    sectionLabel: 'Liberdade Religiosa',
    accentColor: '#15803d',
    headline:
      'Autoridades do Nepal detêm 10 missionários e profissionais de saúde durante ação social',
    dateline: 'REDAÇÃO',
    lead: 'Episódio reacende alerta internacional sobre o Código Penal do Nepal de 2018, que criminaliza qualquer ato interpretado como incentivo à mudança de religião.',
  },
  {
    id: 'premier-uk-en',
    outlet: 'Premier Christian News',
    domain: 'premierchristian.news/world',
    countryTag: 'UK · EN',
    languageTag: 'EN',
    dateLabel: 'Nov 03, 2025',
    sectionLabel: 'World Church',
    accentColor: '#7c2d12',
    headline:
      'Concerns grow over religious freedom as Nepal detains 10 Christian medical volunteers',
    dateline: 'LONDON / KATHMANDU',
    lead: 'Human rights advocates call for due process after ten foreign volunteers providing free rural healthcare in eastern Nepal face fines and visa cancellation.',
  },
];

export const Slide16PressArrestsContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [selectedClip, setSelectedClip] = useState<PressClippingItem | null>(null);

  return (
    <SlideStage slideKey="slide-16-press-arrests" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="10 ESTRANGEIROS PRESOS NA MÍDIA"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[48px] z-30 grid grid-cols-3 grid-rows-3 gap-4">
          {ARREST_NEWS_CLIPPINGS.map((clip, idx) => (
            <SlideUp key={clip.id} delay={0.03 * idx} distance={16} className="h-full">
              <PressClippingCard
                clip={clip}
                compact={true}
                onSelect={(c) => setSelectedClip(c)}
              />
            </SlideUp>
          ))}
        </div>

        <PressClippingLightbox clip={selectedClip} onClose={() => setSelectedClip(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 17 (9): CICLONE MONTHA & AEROPORTOS FECHADOS — APENAS TÍTULO + PRINTS DE NOTÍCIAS
   ============================================================================ */
const CYCLONE_NEWS_CLIPPINGS: PressClippingItem[] = [
  {
    id: 'cyclone-tht',
    outlet: 'The Himalayan Times',
    domain: 'thehimalayantimes.com/aviation',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 30, 2025',
    sectionLabel: 'Aviation Alert',
    accentColor: '#08254c',
    headline:
      'Cyclone Montha disrupts Nepal skies: Biratnagar–Kathmandu flight forced to turn back',
    dateline: 'KATHMANDU',
    lead: 'Adverse en-route weather triggered by Severe Cyclonic Storm Montha forced domestic flights between Biratnagar and Tribhuvan International Airport to divert or cancel operations.',
  },
  {
    id: 'cyclone-onlinekhabar',
    outlet: 'अनलाइनखबर · OnlineKhabar',
    domain: 'onlinekhabar.com/weather-alert',
    countryTag: 'NEPAL · नेपाली',
    languageTag: 'NE',
    dateLabel: '30 Out 2025',
    sectionLabel: 'मौसम र उडान',
    accentColor: '#dc143c',
    headline:
      'मोन्था चक्रवातको प्रभाव: विराटनगर र काठमाडौंबीचको हवाई उडान ठप्प, भारी वर्षाको चेतावनी',
    translationPt:
      'Impacto do Ciclone Montha: voos entre Biratnagar e Katmandu paralisados sob alerta de chuvas intensas',
    dateline: 'KATHMANDU',
    lead: 'कोशी र बागमती प्रदेशमा बाक्लो बादल र अविरल वर्षाका कारण आन्तरिक विमानस्थलहरूमा भिजिबिलिटी न्यून भई दर्जनौं उडान रद्द भएका छन्।',
  },
  {
    id: 'cyclone-ann',
    outlet: 'Asia News Network · Kathmandu Post',
    domain: 'asianews.network/nepal-cyclone',
    countryTag: 'ÁSIA · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 30, 2025',
    sectionLabel: 'Severe Weather',
    accentColor: '#991b1b',
    headline:
      'Cyclone Montha brings heavy rain across Koshi & Bagmati; regional airports suspended',
    dateline: 'KATHMANDU',
    lead: 'Tracking north from the Bay of Bengal, remnants of Cyclone Montha blanketed eastern and central Nepal, halting arrivals at Pokhara, Bharatpur, Tumlingtar and Biratnagar.',
  },
  {
    id: 'cyclone-tourism-times',
    outlet: 'The Tourism Times Nepal',
    domain: 'thetourismtimes.com/caan-notice',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 31, 2025',
    sectionLabel: 'CAAN Advisory',
    accentColor: '#003893',
    headline:
      'CAAN grounds domestic carriers as low visibility paralyzes Tribhuvan Airport',
    dateline: 'TIA · KATHMANDU',
    lead: 'The Civil Aviation Authority of Nepal urged passengers to brace for multi-day disruptions as Buddha Air, Yeti and Shree Airlines suspended mountain and Terai sectors.',
  },
  {
    id: 'cyclone-everest',
    outlet: 'Everest Chronicle',
    domain: 'everestchronicle.com/weather',
    countryTag: 'NEPAL · EN',
    languageTag: 'EN',
    dateLabel: 'Oct 31, 2025',
    sectionLabel: 'Himalayan Storm',
    accentColor: '#1e3a8a',
    headline:
      'Unseasonal storm & high-altitude snowfall strand thousands as domestic flights halt',
    dateline: 'KOSHI / BAGMATI',
    lead: 'With regional airfields closed by rain and fog, travelers and official convoys between eastern Terai and Kathmandu were forced onto rain-soaked mountain highways.',
  },
  {
    id: 'cyclone-br',
    outlet: 'Plantão Meteorologia Global',
    domain: 'meteorologiaglobal.com.br/asia',
    countryTag: 'BRASIL · PT',
    languageTag: 'PT',
    dateLabel: '31 Out 2025',
    sectionLabel: 'Ciclone Tropical',
    accentColor: '#0f766e',
    headline:
      'Ciclone Montha avança do Golfo de Bengala ao Himalaia e fecha aeroportos no Nepal',
    dateline: 'SUL DA ÁSIA',
    lead: 'Tempestade severa derruba visibilidade em Katmandu e Biratnagar no fim de outubro, cancelando voos domésticos e deixando apenas estradas de montanha abertas sob chuva.',
  },
];

export const Slide17CycloneAirportsContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [selectedClip, setSelectedClip] = useState<PressClippingItem | null>(null);

  return (
    <SlideStage slideKey="slide-17-cyclone-airports" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="O CICLONE & AEROPORTOS FECHADOS"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-3 grid-rows-2 gap-6">
          {CYCLONE_NEWS_CLIPPINGS.map((clip, idx) => (
            <SlideUp key={clip.id} delay={0.04 * idx} distance={18} className="h-full">
              <PressClippingCard clip={clip} onSelect={(c) => setSelectedClip(c)} />
            </SlideUp>
          ))}
        </div>

        <PressClippingLightbox clip={selectedClip} onClose={() => setSelectedClip(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 18 (10): O ÔNIBUS — APENAS TÍTULO + 4 FOTOS REAIS & 1 VÍDEO REAL
   (3 colunas verticais nativas à esquerda + 2 quadros horizontais empilhados à direita)
   ============================================================================ */
export const Slide18BusJourneyContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-18-bus-journey" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="NO ÔNIBUS RUMO A KATHMANDU"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 gap-5 items-stretch">
          {/* Esquerda (7 cols): Para-brisa "Kathmandu" + Corredor Neon + Vídeo do Beliche */}
          <div className="col-span-7 h-full grid grid-cols-3 gap-5">
            <SlideUp delay={0.05} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="crimson" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.busFrontWindshield}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.09} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.busNeonAisle}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.13} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-2.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.busBunkVideo}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>
          </div>

          {/* Direita (5 cols): 2 Fotos Horizontais nos Beliches Superiores */}
          <div className="col-span-5 h-full grid grid-rows-2 gap-5">
            <SlideUp delay={0.17} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.busPeaceBunk}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.21} distance={18} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.busSleepingBunk}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>
          </div>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 19 (11): ESTRADA NOS DESPENHADEIROS (BARGACHHI → KATHMANDU) — APENAS TÍTULO + IMAGENS
   ============================================================================ */
export const Slide19CliffsideRoadContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-19-cliffside-road" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="ESTRADA NOS DESPENHADEIROS"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <div className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30 grid grid-cols-12 gap-6 items-stretch">
          <SlideUp delay={0.05} distance={20} className="col-span-8 h-full">
            <LiquidGlassContainer intensity="strong" tint="light" disablePulse={true} className="h-full p-3.5">
              <EditorialMediaFrame
                slot={PERSONAL_MEDIA_SLOTS.cliffRoadHero}
                onExpandMedia={(s) => setZoomSlot(s)}
                className="w-full h-full"
              />
            </LiquidGlassContainer>
          </SlideUp>

          <div className="col-span-4 h-full grid grid-rows-2 gap-6">
            <SlideUp delay={0.1} distance={20} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="navy" disablePulse={true} className="h-full p-3.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.cliffRoadPhoto2}
                  darkPlaceholder={true}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>

            <SlideUp delay={0.15} distance={20} className="h-full">
              <LiquidGlassContainer intensity="subtle" tint="light" disablePulse={true} className="h-full p-3.5">
                <EditorialMediaFrame
                  slot={PERSONAL_MEDIA_SLOTS.cliffRoadPhoto3}
                  onExpandMedia={(s) => setZoomSlot(s)}
                  className="w-full h-full"
                />
              </LiquidGlassContainer>
            </SlideUp>
          </div>
        </div>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});

/* ============================================================================
   SLIDE 20 (12): POLÍCIA, ESPIÕES & COMISSÃO DE LIBERDADE RELIGIOSA · GRATIDÃO E VOLTA PARA CASA
   ============================================================================ */
export const Slide20CommissionGratitudeContent: React.FC = React.memo(() => {
  const handleAdvance = useMinimalistSlideAdvance();
  const [zoomSlot, setZoomSlot] = useState<MediaAssetSlot | null>(null);

  return (
    <SlideStage slideKey="slide-20-commission-gratitude" className="bg-[#f4f2eb]">
      <div
        onClick={handleAdvance}
        className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
      >
        <PureSlideTitleHeader
          title="LIBERDADE RELIGIOSA · GRATIDÃO & VOLTA PARA CASA"
          MorphWrapper={MorphElement}
          FlowWrapper={CanvaFlowLayer}
        />

        <SlideUp
          delay={0.06}
          distance={22}
          className="absolute top-[132px] left-[68px] right-[68px] bottom-[52px] z-30"
        >
          <LiquidGlassContainer
            intensity="strong"
            tint="light"
            disablePulse={true}
            className="w-full h-full p-3.5"
          >
            <EditorialMediaFrame
              slot={PERSONAL_MEDIA_SLOTS.gratitudeDawn}
              onExpandMedia={(s) => setZoomSlot(s)}
              className="w-full h-full"
            />
          </LiquidGlassContainer>
        </SlideUp>

        <MediaLightboxModal slot={zoomSlot} onClose={() => setZoomSlot(null)} />
      </div>
    </SlideStage>
  );
});
