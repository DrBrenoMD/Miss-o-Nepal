import { useSyncExternalStore } from 'react';

export interface StepMeta {
  subStep: number;
  shortLabel: string;
  title: string;
  defaultNotes: string;
}

export type CustomSlideTemplate =
  | 'hero-split'
  | 'cards-grid'
  | 'big-statement'
  | 'image-showcase'
  | 'comparison'
  | 'free-canvas';

export type CustomSlideAccent = 'navy' | 'crimson' | 'gold' | 'emerald';

export type CustomSlideBackground =
  | 'cream'
  | 'navy-dark'
  | 'warm-dawn'
  | 'cream-mountains'
  | 'cream-grid'
  | 'navy-deep'
  | 'cream-clean';

export type CustomIconName =
  | 'mountain'
  | 'globe'
  | 'heart'
  | 'book'
  | 'flame'
  | 'shield'
  | 'star'
  | 'users'
  | 'landmark'
  | 'alert'
  | 'check'
  | 'compass'
  | 'sparkles'
  | 'scale'
  | 'award'
  | 'layers';

export interface CustomSlideCardItem {
  id: string;
  icon: CustomIconName;
  title: string;
  body: string;
  value?: string;
  badge?: string;
}

export interface CustomCanvasBlock {
  id: string;
  type: 'card' | 'heading' | 'text' | 'image' | 'stat' | 'badge' | 'divider';
  x: number; // 0..1920
  y: number; // 0..1080
  width: number; // px in 1920 stage
  height?: number; // px in 1080 stage
  title: string;
  body: string;
  statValue?: string;
  badge?: string;
  imageUrl?: string;
  accent?: CustomSlideAccent | 'dark';
  align?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CustomSlideData {
  template: CustomSlideTemplate;
  badge: string;
  title: string;
  subtitle: string;
  leadText?: string;
  imageUrl?: string;
  heroImage?: string;
  imagePosition?: 'right' | 'left' | 'background' | 'none';
  imageFit?: 'cover' | 'contain';
  imageCaption?: string;
  heroMetricValue?: string;
  heroMetricLabel?: string;
  statValue?: string;
  statLabel?: string;
  calloutTitle?: string;
  calloutBody?: string;
  quoteText?: string;
  quoteAuthor?: string;
  footerNote?: string;
  leftColumnTitle?: string;
  rightColumnTitle?: string;
  accentColor: CustomSlideAccent;
  backgroundStyle: CustomSlideBackground;
  showNepalFlag?: boolean;
  stepByStepCards?: boolean;
  cards: CustomSlideCardItem[];
  canvasBlocks?: CustomCanvasBlock[];
}

export interface BuiltinSlideBanner {
  enabled: boolean;
  position: 'top-right' | 'bottom-left' | 'top' | 'bottom';
  badge: string;
  title: string;
  body: string;
  text?: string;
  accent: CustomSlideAccent;
}

export interface SlideMeta {
  id: string;
  kind: 'builtin' | 'custom';
  builtinIndex?: number; // 0..7 for the 8 original slides
  visible: boolean;
  slideIndex: number; // Active index among visible slides (0..N-1)
  numberLabel: string; // '01', '02', ...
  shortTitle: string;
  fullTitle: string;
  steps: StepMeta[];
  customData?: CustomSlideData;
  builtinBanner?: BuiltinSlideBanner;
}

export interface NepalMediaAsset {
  id: string;
  label: string;
  category: 'Cultura & Cotidiano' | 'História & Linha do Tempo' | 'Símbolos & Mapas';
  url: string;
}

export const NEPAL_MEDIA_GALLERY: NepalMediaAsset[] = [
  {
    id: 'buddha',
    label: 'Lumbini · Origem do Budismo',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step1-buddha.jpg',
  },
  {
    id: 'unification',
    label: 'Unificação do Reino (1768)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step2-prithvi-shah.jpg',
  },
  {
    id: 'gurkhas',
    label: 'Soldados Gurkhas & Isolamento',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step3-gurkhas.jpg',
  },
  {
    id: 'everest-1951',
    label: 'Himalaia & Abertura (1951)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step4-everest-1951.jpg',
  },
  {
    id: 'monarchy-fall',
    label: 'Guerra Civil & Transição (2001)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step5-monarchy-fall.jpg',
  },
  {
    id: 'republic-2008',
    label: 'República Laica & Crescimento (2008)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step6-everest-2008.jpg',
  },
  {
    id: 'handcuffs-2018',
    label: 'Lei Anti-Conversão (2018)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step7-handcuffs.jpg',
  },
  {
    id: 'flood-rescue',
    label: 'Enchentes & Socorro Humanitário (2026)',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step8-flood-rescue.jpg',
  },
  {
    id: 'protest-genz',
    label: 'Mobilização Juvenil no Nepal',
    category: 'História & Linha do Tempo',
    url: '/assets/timeline/step8-protest-flood.jpg',
  },
  {
    id: 'speaker-cutout',
    label: 'Palestrante (Recorte PNG)',
    category: 'Símbolos & Mapas',
    url: '/assets/aistudio/Design_sem_nome__5__631d9474.png',
  },
  {
    id: 'nepal-flag-svg',
    label: 'Bandeira Oficial do Nepal',
    category: 'Símbolos & Mapas',
    url: '/assets/bandeira-nepal.svg',
  },
  {
    id: 'map-unification',
    label: 'Mapa Histórico do Nepal',
    category: 'Símbolos & Mapas',
    url: '/assets/timeline/step2-unification-map.png',
  },
];

export const DEFAULT_BUILTIN_SLIDES: SlideMeta[] = [
  {
    id: 'builtin-0',
    kind: 'builtin',
    builtinIndex: 0,
    visible: true,
    slideIndex: 0,
    numberLabel: '01',
    shortTitle: 'Capa · Missão Nepal',
    fullTitle: 'Missão Nepal & Liberdade Religiosa',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Abertura',
        title: 'Capa · Bate-Papo da Comunidade Jovem',
        defaultNotes:
          '• Boas-vindas ao bate-papo sobre Missão Nepal & Liberdade Religiosa.\n' +
          '• Contextualize o objetivo: enxergar o Nepal além do cartão-postal do Monte Everest — compreendendo sua geografia, economia, cultura cotidiana, sistema de castas e a história impressionante da igreja cristã nepalesa.\n' +
          '• Destaque visual da capa: à esquerda o Buda (nascido em Lumbini, no sul do Nepal) e ao fundo os templos e o Himalaia, simbolizando o encontro entre tradição milenar e fé.',
      },
    ],
  },
  {
    id: 'builtin-scripture',
    kind: 'builtin',
    builtinIndex: 8,
    visible: true,
    slideIndex: 1,
    numberLabel: '02',
    shortTitle: 'Mateus 5:10-12',
    fullTitle: 'Mateus 5:10-12',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Mateus 5:10-12',
        title: 'Mateus 5:10-12',
        defaultNotes:
          '• Leitura de Mateus 5:10-12:\n' +
          '• "Bem-aventurados os perseguidos por causa da justiça, pois deles é o reino dos céus. Bem-aventurados serão vocês quando, por minha causa, os insultarem, os perseguirem e, mentindo, disserem todo tipo de mal contra vocês. Alegrem-se e regozijem-se, porque grande é a sua recompensa nos céus, pois da mesma forma perseguiram os profetas que viveram antes de vocês."',
      },
    ],
  },
  {
    id: 'builtin-1',
    kind: 'builtin',
    builtinIndex: 1,
    visible: true,
    slideIndex: 2,
    numberLabel: '03',
    shortTitle: 'Geografia & Relevo 3D',
    fullTitle: 'Cartografia Oficial, Escala no Brasil & Relevo 3D',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Mapa-Múndi',
        title: 'Etapa 1/4 · Espremido entre Gigantes (Índia e China)',
        defaultNotes:
          '• O Nepal não tem saída para o mar e está literalmente espremido entre as duas nações mais populosas do planeta: China (Tibete) ao norte e Índia ao sul, leste e oeste.\n' +
          '• Área total: 147.516 km² (~800 km de extensão leste-oeste por apenas 150 a 250 km de largura norte-sul).\n' +
          '• Ao avançar, faremos um voo pelo globo até o Brasil para comparar o tamanho real.',
      },
      {
        subStep: 1,
        shortLabel: '6× no MT',
        title: 'Etapa 2/4 · Cabem 6 Nepais dentro do Mato Grosso',
        defaultNotes:
          '• Comparação de impacto para o público brasileiro: dentro do estado do Mato Grosso (903.357 km²) cabem 6,12 Nepais inteiros!\n' +
          '• Contraste demográfico: apesar de ser 6 vezes menor em território que o MT, o Nepal tem mais de 30,8 milhões de habitantes — quase 8 vezes a população mato-grossense.',
      },
      {
        subStep: 2,
        shortLabel: 'Bandeira Única',
        title: 'Etapa 3/4 · A Única Bandeira Não-Quadrilátera do Mundo',
        defaultNotes:
          '• A bandeira do Nepal é a única bandeira nacional do planeta que não é retangular nem quadrada (dois galhardetes triangulares definidos matematicamente na Constituição).\n' +
          '• Significado das cores: Vermelho carmesim = coragem do povo (e cor da flor nacional rododendro); Borda azul-marinho = paz e harmonia; Sol e Lua = esperança de que o Nepal dure tanto quanto os astros.',
      },
      {
        subStep: 3,
        shortLabel: 'Relevo 3D',
        title: 'Etapa 4/4 · Fortaleza do Himalaia & Monte Everest (8.848 m)',
        defaultNotes:
          '• Maior desnível topográfico abrupto da Terra: em menos de 200 km sai das planícies tropicais do Terai (70 m de altitude) até os 8.848 m do Monte Everest (Sagarmatha).\n' +
          '• 8 das 10 montanhas acima de 8.000 m do planeta estão no Nepal. Isso molda o isolamento de milhares de vilarejos alpinos onde o acesso ainda leva dias de caminhada.',
      },
    ],
  },
  {
    id: 'builtin-2',
    kind: 'builtin',
    builtinIndex: 2,
    visible: true,
    slideIndex: 2,
    numberLabel: '03',
    shortTitle: 'Economia, PIB & IDH',
    fullTitle: 'Comparativo Econômico: PIB, Renda per Capita & IDH',
    steps: [
      {
        subStep: 0,
        shortLabel: 'PIB & IDH',
        title: 'Economia do Nepal vs. Brasil e Mundo',
        defaultNotes:
          '• Dica interativa: use os botões rápidos no Console para alternar ao vivo entre PIB per Capita, PIB Nominal e IDH!\n' +
          '• PIB per Capita do Nepal: ~US$ 1.380/ano (quase 8 vezes menor que o Brasil, que está em ~US$ 10.410).\n' +
          '• Dependência de remessas: cerca de 25% a 30% do PIB nepalês vem de jovens trabalhando no exterior (Golfo Pérsico, Malásia, Índia).\n' +
          '• IDH 0,601 (146º do mundo): grandes desafios em saúde, infraestrutura rural e emprego jovem.',
      },
    ],
  },
  {
    id: 'builtin-3',
    kind: 'builtin',
    builtinIndex: 3,
    visible: true,
    slideIndex: 3,
    numberLabel: '04',
    shortTitle: '124 Línguas & Castas',
    fullTitle: 'Mosaico de 124 Idiomas & Pirâmide do Sistema de Castas',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Línguas & Castas',
        title: 'Diversidade Linguística & Estratificação Social',
        defaultNotes:
          '• 124 línguas catalogadas no Censo! O Nepali (alfabeto Devanágari) é língua materna de ~45% e segunda língua de ~86%.\n' +
          '• Sistema de Castas: embora a discriminação seja ilegal no papel desde 1963, na prática social ela define casamentos, sobrenomes e acesso a poder.\n' +
          '• Destaque o grupo 4 — Dalits ("Pani Nachalne" = aqueles de quem as castas altas não aceitam água, ~13,5% da pop.): historicamente excluídos de templos, encontraram no Evangelho dignidade e igualdade como filhos de Deus.',
      },
    ],
  },
  {
    id: 'builtin-4',
    kind: 'builtin',
    builtinIndex: 4,
    visible: true,
    slideIndex: 4,
    numberLabel: '05',
    shortTitle: 'Costumes & Mesa',
    fullTitle: 'Gentileza Extrema, Mão Esquerda, Dal Bhat & Jutho',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Cotidiano',
        title: 'Códigos Sagrados do Lar Nepalês',
        defaultNotes:
          '• Pronúncia: "Atithi Devo Bhava" (A-tí-ti Dê-vô Bá-va) = "O hóspede é como Deus". Hospitalidade calorosa com chá (Chiya).\n' +
          '• Saudação "Namaste": palmas unidas sem toque físico (evitar abraços/beijos entre homens e mulheres em público).\n' +
          '• Regras práticas essenciais: tirar sapatos antes de entrar em casas/templos; usar SEMPRE a mão direita para comer, pagar ou entregar objetos.\n' +
          '• Conceito de "Jutho" (impureza ritual alimentar): se o lábio encostar numa garrafa ou talher, o alimento/água torna-se ritualmente impuro para os demais — por isso bebem água virando a garrafa do alto sem encostar na boca!',
      },
    ],
  },
  {
    id: 'builtin-5',
    kind: 'builtin',
    builtinIndex: 5,
    visible: true,
    slideIndex: 5,
    numberLabel: '06',
    shortTitle: 'Mão Inglesa & Ruas',
    fullTitle: 'Mão Inglesa, Trânsito Caótico & Vacas Sagradas',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Mobilidade',
        title: 'O "Caos Sincronizado" de Katmandu',
        defaultNotes:
          '• Mão Inglesa herdada da influência regional britânica: ao atravessar a rua, olhe PRIMEIRO para a DIREITA!\n' +
          '• Buzina não é briga: no Nepal buzinar significa "estou passando ao seu lado, cuidado" — é sinal de cortesia viária.\n' +
          '• Vacas sagradas (símbolo da maternidade e de Lakshmi no hinduísmo): têm proteção constitucional rigorosa; carros e ônibus desviam pacientemente quando elas deitam no meio da avenida.',
      },
    ],
  },
  {
    id: 'builtin-6',
    kind: 'builtin',
    builtinIndex: 6,
    visible: true,
    slideIndex: 6,
    numberLabel: '07',
    shortTitle: 'Cremações & Festivais',
    fullTitle: 'Cremações em Pashupatinath, Dashain & Tihar',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Ritos & Festas',
        title: 'Visão Pública da Morte & Grandes Festivais de Outono',
        defaultNotes:
          '• Calendário Bikram Sambat: o Nepal está 57 anos à frente do calendário ocidental (ano 2083!).\n' +
          '• Pashupatinath (Rio Bagmati): cremações ao ar livre 24h/dia. Luto branco (não preto!) e 13 dias de reclusão (Kriya). Desafio prático para cristãos nepaleses: conseguir terrenos para sepultamento.\n' +
          '• Dashain (15 dias) e Tihar (Festival das Luzes, 5 dias): época em que famílias se reúnem; cristãos nepaleses enfrentam pressão familiar intensa quando não recebem a "Tika" ritual na testa.',
      },
    ],
  },
  {
    id: 'builtin-7',
    kind: 'builtin',
    builtinIndex: 7,
    visible: true,
    slideIndex: 7,
    numberLabel: '08',
    shortTitle: 'Linha do Tempo & Igreja',
    fullTitle: 'História do Nepal & Avanço do Cristianismo (8 Marcos)',
    steps: [
      {
        subStep: 0,
        shortLabel: 'Séc. VI a.C.',
        title: 'Marco 1/8 · Séc. VI a.C. — Reinos Divididos & Origem do Budismo',
        defaultNotes:
          '• Início da linha do tempo: o gráfico começa com zoom aproximado na Antiguidade (~0 cristãos).\n' +
          '• Sidarta Gautama (Buda) nasce em Lumbini, no sul do atual Nepal. Durante milênios a região é um mosaico de principados hindus e budistas.',
      },
      {
        subStep: 1,
        shortLabel: '1768',
        title: 'Marco 2/8 · 1768 — Unificação Forçada & Expulsão dos Capuchinhos',
        defaultNotes:
          '• Prithvi Narayan Shah unifica o Nepal pela espada e estabelece o "Asal Hindustan" (verdadeiro reino hindu puro).\n' +
          '• A pequena missão de frades capuchinhos e os poucos cristãos nativos do vale de Katmandu são expulsos para a Índia. Conversão vira crime de Estado.',
      },
      {
        subStep: 2,
        shortLabel: '1846',
        title: 'Marco 3/8 · 1846 — Isolamento Rana & Lenda dos Gurkhas',
        defaultNotes:
          '• Massacre de Kot (1846): a dinastia de primeiros-ministros Rana fecha completamente o Nepal a estrangeiros por 105 anos.\n' +
          '• O Nepal nunca foi colonizado, mas firmou paz com os britânicos cedendo os lendários soldados Gurkhas (famosos pela adaga curva Kukri). Presença cristã interna permanece ~0.',
      },
      {
        subStep: 3,
        shortLabel: '1951',
        title: 'Marco 4/8 · 1951–1981 — Abertura das Fronteiras & Igreja Subterrânea',
        defaultNotes:
          '• Observe o zoom do gráfico avançando para os Censos Modernos (1951 a 1981)!\n' +
          '• 1951: fronteiras se abrem (0 cristãos no 1º Censo). Cristãos nepaleses da diáspora na Índia retornam e missões médicas/educacionais entram sob proibição estrita de evangelizar.\n' +
          '• Mesmo com prisões frequentes, a igreja subterrânea avança: 458 (1961) → 2.541 (1971) → 3.891 cristãos (1981).',
      },
      {
        subStep: 4,
        shortLabel: '2001',
        title: 'Marco 5/8 · 1991–2001 — Guerra Civil Maoísta & Queda Real',
        defaultNotes:
          '• Veja a câmera do gráfico recuando a escala de 4 mil para 115 mil!\n' +
          '• 1990/1991: abertura democrática multipartidária salta para 31.280 cristãos.\n' +
          '• 1996–2006: Guerra Civil Maoísta + massacre real no palácio em 2001. Em meio ao sofrimento nacional, a igreja triplica para 101.976 cristãos (0,45%), acolhendo milhares de Dalits e feridos.',
      },
      {
        subStep: 5,
        shortLabel: '2008',
        title: 'Marco 6/8 · 2008 — República Laica & Explosão da Igreja',
        defaultNotes:
          '• 2008: abolição oficial de 240 anos de monarquia hindu — o Nepal torna-se uma República Federal Democrática e LAICA!\n' +
          '• Maior janela de liberdade religiosa da história nepalesa. No Censo de 2011, os cristãos saltam para 375.699 (1,42%) — uma das igrejas de crescimento mais rápido do mundo.',
      },
      {
        subStep: 6,
        shortLabel: '2018',
        title: 'Marco 7/8 · 2018 — Novo Código Penal & Lei Anti-Conversão',
        defaultNotes:
          '• Agosto de 2018: reação nacionalista aprova o novo Código Penal criminalizando o proselitismo ("converter ou encorajar conversão" = até 5 anos de prisão e deportação de estrangeiros).\n' +
          '• Censo de 2021 registra 512.313 cristãos (1,76%), já sob forte subnotificação por receio legal.',
      },
      {
        subStep: 7,
        shortLabel: 'Atualmente',
        title: 'Marco 8/8 · 2025/2026 — Revolução Gen Z, Enchentes & Socorro Cristão',
        defaultNotes:
          '• O gráfico abre agora no Panorama Completo de 2.600 anos: de zero absoluto por milênios até a faixa estimada de 1,0 milhão a 1,5 milhão+ de cristãos (3% a 5% da população)!\n' +
          '• Diante dos protestos juvenis (2025) e das graves enchentes (2026), igrejas locais e missões humanitárias têm sido linha de frente em resgate, alimento e reconstrução.\n' +
          '• Encerramento: convide o grupo à reflexão, intercessão e engajamento prático com a igreja sofredora e resiliente no Nepal.',
      },
    ],
  },
];

const MANAGED_DECK_STORAGE_KEY = 'missao_nepal_managed_deck_v2';

export function buildStepsForCustomSlide(
  title: string,
  customData: CustomSlideData,
  existingNotes?: string
): StepMeta[] {
  const baseNotes =
    existingNotes ||
    `• Slide personalizado: ${title}\n• ${customData.subtitle || ''}\n` +
      customData.cards.map((c) => `• ${c.title}: ${c.body}`).join('\n');

  if (customData.stepByStepCards && customData.cards.length > 1) {
    return customData.cards.map((card, idx) => ({
      subStep: idx,
      shortLabel: `Ponto ${idx + 1}`,
      title: `${title} · ${card.title}`,
      defaultNotes:
        idx === 0
          ? baseNotes
          : `• Destaque do Ponto ${idx + 1} (${card.title}):\n• ${card.body}`,
    }));
  }

  return [
    {
      subStep: 0,
      shortLabel: 'Slide',
      title: title || 'Slide Personalizado',
      defaultNotes: baseNotes,
    },
  ];
}

export function createCustomSlideFromTemplate(
  template: CustomSlideTemplate = 'hero-split'
): SlideMeta {
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const presets: Record<CustomSlideTemplate, CustomSlideData> = {
    'hero-split': {
      template: 'hero-split',
      badge: 'MISSÃO NEPAL · TÓPICO EM DESTAQUE',
      title: 'IGREJA RESILIENTE NO HIMALAIA',
      subtitle: 'Educação, saúde e dignidade nos vales alpinos',
      leadText:
        'Como comunidades locais têm transformado vilarejos isolados com educação, saúde e esperança em meio aos desafios geográficos.',
      accentColor: 'crimson',
      backgroundStyle: 'cream',
      showNepalFlag: false,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step6-everest-2008.jpg',
      heroImage: '/assets/timeline/step6-everest-2008.jpg',
      imagePosition: 'right',
      imageFit: 'cover',
      imageCaption: 'Comunidades nos vales do Himalaia · Nepal',
      heroMetricValue: '77 Distritos',
      heroMetricLabel: 'Alcançados no País',
      statValue: '77',
      statLabel: 'Distritos Alcançados com Comunidades Locais',
      calloutTitle: 'COMPROMISSO PRÁTICO',
      calloutBody: 'Serviço integral que une socorro humanitário, educação e fé viva.',
      footerNote: 'MISSÃO NEPAL & LIBERDADE RELIGIOSA',
      cards: [
        {
          id: `${id}-c1`,
          icon: 'heart',
          title: 'Acolhimento & Dignidade',
          body: 'Milhares de famílias excluídas pelo sistema de castas encontram igualdade e apoio comunitário.',
          value: 'IMPACTO SOCIAL',
          badge: 'IMPACTO SOCIAL',
        },
        {
          id: `${id}-c2`,
          icon: 'mountain',
          title: 'Alcance nos Vales Alpinos',
          body: 'Líderes nativos caminham dias por trilhas íngremes para discipular e assistir aldeias remotas.',
          value: 'GEOGRAFIA',
          badge: 'GEOGRAFIA',
        },
        {
          id: `${id}-c3`,
          icon: 'shield',
          title: 'Coragem sob Pressão Legal',
          body: 'Mesmo diante de restrições legais, a juventude nepalesa mantém sua fé viva e atuante.',
          value: 'LIBERDADE',
          badge: 'LIBERDADE',
        },
      ],
      canvasBlocks: [],
    },
    'cards-grid': {
      template: 'cards-grid',
      badge: 'MISSÃO NEPAL · PILARES DE ATUAÇÃO',
      title: 'DESAFIOS & OPORTUNIDADES',
      subtitle: 'Quatro frentes essenciais no contexto nepalês',
      leadText: 'Quatro frentes essenciais para compreender e apoiar a missão no contexto nepalês.',
      accentColor: 'navy',
      backgroundStyle: 'cream',
      showNepalFlag: false,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step4-everest-1951.jpg',
      heroImage: '',
      imagePosition: 'none',
      imageFit: 'cover',
      imageCaption: 'Himalaia · Missão Nepal',
      heroMetricValue: '1,5M+',
      heroMetricLabel: 'Cristãos Estimados Hoje',
      statValue: '1,5M+',
      statLabel: 'Cristãos Estimados Hoje',
      calloutTitle: 'SÍNTESE MISSIONÁRIA',
      calloutBody: 'Crescimento liderado por jovens e famílias nepalesas em todas as províncias.',
      footerNote: 'BATE-PAPO DA COMUNIDADE JOVEM',
      cards: [
        {
          id: `${id}-c1`,
          icon: 'users',
          title: 'Nova Geração Jovem',
          body: 'Mais de 40% da população tem menos de 25 anos e busca propósito em meio à crise econômica.',
          value: 'JUVENTUDE',
          badge: 'JUVENTUDE',
        },
        {
          id: `${id}-c2`,
          icon: 'book',
          title: 'Tradução & Alfabetização',
          body: 'Com 124 línguas maternas, projetos de alfabetização abrem portas para leitura e cidadania.',
          value: '124 IDIOMAS',
          badge: '124 IDIOMAS',
        },
        {
          id: `${id}-c3`,
          icon: 'heart',
          title: 'Socorro em Desastres',
          body: 'Ação imediata em terremotos, monções e enchentes constrói pontes de confiança duradoura.',
          value: 'COMPAIXÃO',
          badge: 'COMPAIXÃO',
        },
        {
          id: `${id}-c4`,
          icon: 'globe',
          title: 'Intercessão & Conexão',
          body: 'A igreja global caminha junto fortalecendo líderes locais e projetos autossustentáveis.',
          value: 'PARCERIA',
          badge: 'PARCERIA',
        },
      ],
      canvasBlocks: [],
    },
    'big-statement': {
      template: 'big-statement',
      badge: 'REFLEXÃO & CHAMADO · MISSÃO NEPAL',
      title: 'A FÉ QUE MOVE MONTANHAS',
      subtitle: 'Testemunho da Igreja Local no Vale de Katmandu',
      leadText:
        'Onde o Evangelho chega no Nepal, ele quebra barreiras milenares de castas e devolve dignidade aos invisíveis.',
      accentColor: 'crimson',
      backgroundStyle: 'navy-dark',
      showNepalFlag: true,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step4-everest-1951.jpg',
      heroImage: '/assets/timeline/step4-everest-1951.jpg',
      imagePosition: 'background',
      imageFit: 'cover',
      imageCaption: 'Monte Everest · Nepal',
      heroMetricValue: '1951 → HOJE',
      heroMetricLabel: 'De 0 para mais de 1,5 Milhão de Cristãos',
      statValue: '1951 → HOJE',
      statLabel: 'De 0 para mais de 1,5 Milhão de Cristãos',
      calloutTitle: 'CHAMADO',
      calloutBody: 'Orar, conhecer e apoiar a igreja perseguida.',
      footerNote: 'MISSÃO NEPAL & LIBERDADE RELIGIOSA',
      cards: [
        {
          id: `${id}-c1`,
          icon: 'flame',
          title: 'Igreja Viva',
          body: 'Crescimento orgânico liderado por nepaleses.',
          value: '01',
          badge: '01',
        },
        {
          id: `${id}-c2`,
          icon: 'shield',
          title: 'Fidelidade',
          body: 'Perseverança pacífica diante da lei anti-conversão.',
          value: '02',
          badge: '02',
        },
        {
          id: `${id}-c3`,
          icon: 'heart',
          title: 'Amor Prático',
          body: 'Serviço cristão em hospitais, escolas e resgates.',
          value: '03',
          badge: '03',
        },
      ],
      canvasBlocks: [],
    },
    'image-showcase': {
      template: 'image-showcase',
      badge: 'OLHAR DOCUMENTAL · NEPAL',
      title: 'RETRATOS DA VIDA NO VALE',
      subtitle: 'Entre templos milenares, feiras vibrantes e os picos nevados do Himalaia',
      leadText:
        'Das planícies subtropicais do Terai até o topo do mundo no Everest em menos de 200 km de distância.',
      accentColor: 'gold',
      backgroundStyle: 'cream',
      showNepalFlag: false,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step8-flood-rescue.jpg',
      heroImage: '/assets/timeline/step8-flood-rescue.jpg',
      imagePosition: 'left',
      imageFit: 'cover',
      imageCaption: 'Ação humanitária e vida comunitária nas regiões atingidas por monções',
      heroMetricValue: '30,8M',
      heroMetricLabel: 'Habitantes no País',
      statValue: '30,8M',
      statLabel: 'Habitantes entre o Terai e o Everest',
      calloutTitle: 'DOCUMENTÁRIO VISUAL',
      calloutBody: 'A fé vivida no cotidiano das ruas e aldeias nepalesas.',
      footerNote: 'DOCUMENTÁRIO VISUAL · MISSÃO NEPAL',
      cards: [
        {
          id: `${id}-c1`,
          icon: 'compass',
          title: 'Contraste Geográfico Extremo',
          body: 'Das planícies subtropicais ao topo do mundo em menos de 200 km de distância.',
          value: 'TERRITÓRIO',
          badge: 'TERRITÓRIO',
        },
        {
          id: `${id}-c2`,
          icon: 'shield',
          title: 'Pressão Cultural & Familiar',
          body: 'Deixar os rituais tradicionais implica custos sociais profundos dentro da família.',
          value: 'CULTURA',
          badge: 'CULTURA',
        },
      ],
      canvasBlocks: [],
    },
    comparison: {
      template: 'comparison',
      badge: 'COMPARATIVO DIRETO · DOIS MUNDOS',
      title: 'CONTRASTES DE REALIDADE',
      subtitle: 'Tradição de Castas vs. Comunidade Cristã',
      leadText: 'Entendendo as diferenças culturais, sociais e espirituais na prática cotidiana.',
      accentColor: 'navy',
      backgroundStyle: 'cream',
      showNepalFlag: false,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step1-buddha.jpg',
      heroImage: '',
      imagePosition: 'none',
      imageCaption: 'Comparativo Cultural',
      heroMetricValue: '2 Visões',
      heroMetricLabel: 'Sociedade & Fé',
      calloutTitle: 'SÍNTESE',
      calloutBody: 'O Evangelho restaura a igualdade entre todas as etnias e castas.',
      leftColumnTitle: 'TRADIÇÃO & SISTEMA DE CASTAS',
      rightColumnTitle: 'COMUNIDADE CRISTÃ NO NEPAL',
      footerNote: 'ANÁLISE COMPARATIVA · MISSÃO NEPAL',
      cards: [
        {
          id: `${id}-c1`,
          icon: 'scale',
          title: 'Hierarquia de Pureza Ritual',
          body: 'Status social definido pelo nascimento; separação alimentar e exclusão histórica dos Dalits.',
          value: 'TRADIÇÃO',
          badge: 'COLUNA ESQUERDA',
        },
        {
          id: `${id}-c2`,
          icon: 'heart',
          title: 'Mesa Compartilhada em Igualdade',
          body: 'Brâmanes, Chhetris, Janajatis e Dalits sentam-se juntos como irmãos na mesma comunidade.',
          value: 'IGUALDADE',
          badge: 'COLUNA DIREITA',
        },
        {
          id: `${id}-c3`,
          icon: 'users',
          title: 'Identidade Coletiva Obrigatória',
          body: 'Forte pressão familiar nos grandes festivais nacionais como Dashain e Tihar.',
          value: 'PRESSÃO',
          badge: 'COLUNA ESQUERDA',
        },
        {
          id: `${id}-c4`,
          icon: 'sparkles',
          title: 'Esperança & Serviço Prático',
          body: 'Cuidado aos enfermos, educação comunitária e reconstrução de vilarejos após desastres.',
          value: 'MISSÃO',
          badge: 'COLUNA DIREITA',
        },
      ],
      canvasBlocks: [],
    },
    'free-canvas': {
      template: 'free-canvas',
      badge: 'QUADRO LIVRE · COMPOSIÇÃO VISUAL',
      title: 'SLIDE PERSONALIZADO LIVRE',
      subtitle: 'Arraste os blocos diretamente sobre o palco 16:9',
      leadText: 'Arraste os blocos diretamente sobre o palco 16:9 no editor para posicionar livremente.',
      accentColor: 'navy',
      backgroundStyle: 'cream',
      showNepalFlag: false,
      stepByStepCards: false,
      imageUrl: '/assets/timeline/step6-everest-2008.jpg',
      heroImage: '',
      imagePosition: 'none',
      imageCaption: 'Quadro Livre 16:9',
      heroMetricValue: '16:9',
      heroMetricLabel: 'Canvas Interativo',
      calloutTitle: '',
      calloutBody: '',
      footerNote: 'QUADRO VISUAL 16:9 · MISSÃO NEPAL',
      cards: [],
      canvasBlocks: [
        {
          id: `${id}-b0`,
          type: 'badge',
          x: 96,
          y: 56,
          width: 460,
          height: 58,
          title: 'MISSÃO NEPAL · QUADRO LIVRE',
          body: '',
          statValue: '',
          imageUrl: '',
          accent: 'crimson',
          align: 'left',
          fontSize: 'md',
        },
        {
          id: `${id}-b1`,
          type: 'heading',
          x: 96,
          y: 126,
          width: 1120,
          height: 150,
          title: 'TÍTULO DO QUADRO LIVRE',
          body: 'Subtítulo ou contexto principal posicionado livremente sobre o palco 16:9.',
          statValue: '',
          imageUrl: '',
          badge: 'MISSÃO NEPAL · QUADRO LIVRE',
          accent: 'navy',
          align: 'left',
          fontSize: 'lg',
        },
        {
          id: `${id}-b2`,
          type: 'card',
          x: 96,
          y: 310,
          width: 560,
          height: 280,
          title: 'Bloco Liquid Glass 01',
          body: 'Você pode arrastar este cartão para qualquer ponto da tela 16:9 ou redimensioná-lo pela alça no canto inferior direito.',
          statValue: 'DESTAQUE 01',
          imageUrl: '',
          badge: 'DESTAQUE 01',
          accent: 'navy',
          align: 'left',
          fontSize: 'md',
        },
        {
          id: `${id}-b3`,
          type: 'card',
          x: 96,
          y: 620,
          width: 560,
          height: 280,
          title: 'Bloco Liquid Glass 02',
          body: 'Adicione novos cartões, imagens, números de impacto ou títulos usando os botões na aba Quadro Livre.',
          statValue: 'DESTAQUE 02',
          imageUrl: '',
          badge: 'DESTAQUE 02',
          accent: 'crimson',
          align: 'left',
          fontSize: 'md',
        },
        {
          id: `${id}-b4`,
          type: 'image',
          x: 700,
          y: 310,
          width: 720,
          height: 590,
          title: 'Comunidade & Montanhas no Nepal',
          body: 'Legenda da fotografia em destaque',
          statValue: '',
          imageUrl: '/assets/timeline/step6-everest-2008.jpg',
          accent: 'navy',
          align: 'left',
          fontSize: 'md',
        },
        {
          id: `${id}-b5`,
          type: 'stat',
          x: 1450,
          y: 310,
          width: 380,
          height: 270,
          title: 'CRISTÃOS HOJE',
          body: 'Estimativa de cristãos nepaleses perseverando na fé',
          statValue: '1,5M+',
          imageUrl: '',
          badge: 'ESTATÍSTICA',
          accent: 'crimson',
          align: 'left',
          fontSize: 'xl',
        },
      ],
    },
  };

  const data = presets[template] || presets['hero-split'];
  const shortTitle = data.title.slice(0, 28);

  return {
    id,
    kind: 'custom',
    visible: true,
    slideIndex: 0,
    numberLabel: '01',
    shortTitle,
    fullTitle: data.title,
    customData: data,
    steps: buildStepsForCustomSlide(data.title, data),
  };
}

export function convertBuiltinToCustomSlide(builtinSlide: SlideMeta): SlideMeta {
  const base = createCustomSlideFromTemplate('hero-split');
  const defaultImgByIndex: Record<number, string> = {
    0: '/assets/aistudio/Design_sem_nome__5__631d9474.png',
    1: '/assets/timeline/step4-everest-1951.jpg',
    2: '/assets/timeline/step6-everest-2008.jpg',
    3: '/assets/timeline/step1-buddha.jpg',
    4: '/assets/timeline/step3-gurkhas.jpg',
    5: '/assets/timeline/step5-monarchy-fall.jpg',
    6: '/assets/timeline/step8-protest-flood.jpg',
    7: '/assets/timeline/step8-flood-rescue.jpg',
  };

  const cardsFromSteps: CustomSlideCardItem[] = builtinSlide.steps.slice(0, 4).map((st, idx) => ({
    id: `${base.id}-c${idx}`,
    icon: idx === 0 ? 'mountain' : idx === 1 ? 'globe' : idx === 2 ? 'heart' : 'shield',
    title: st.title,
    body: st.defaultNotes
      .split('\n')
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' '),
    badge: st.shortLabel.toUpperCase(),
  }));

  const customData: CustomSlideData = {
    ...base.customData!,
    badge: `VERSÃO EDITÁVEL · ${builtinSlide.shortTitle.toUpperCase()}`,
    title: builtinSlide.fullTitle.toUpperCase(),
    subtitle: 'Slide personalizado criado a partir do slide original',
    leadText:
      'Slide personalizado criado a partir do slide original — edite todos os textos, cartões e imagens livremente.',
    imageUrl:
      defaultImgByIndex[builtinSlide.builtinIndex ?? 0] ||
      '/assets/timeline/step6-everest-2008.jpg',
    heroImage:
      defaultImgByIndex[builtinSlide.builtinIndex ?? 0] ||
      '/assets/timeline/step6-everest-2008.jpg',
    cards: cardsFromSteps.length > 0 ? cardsFromSteps : base.customData!.cards,
  };

  return {
    ...base,
    shortTitle: `${builtinSlide.shortTitle} (Editável)`.slice(0, 34),
    fullTitle: builtinSlide.fullTitle,
    customData,
    steps: buildStepsForCustomSlide(
      builtinSlide.fullTitle,
      customData,
      builtinSlide.steps.map((s) => s.defaultNotes).join('\n\n')
    ),
  };
}

// ============================================================================
// GERENCIADOR REATIVO DO DECK DE SLIDES (LOCALSTORAGE + LISTENERS)
// ============================================================================

function normalizeDeckSlides(rawSlides: SlideMeta[]): {
  allSlides: SlideMeta[];
  activeSlides: SlideMeta[];
} {
  const safeList = Array.isArray(rawSlides) && rawSlides.length > 0
    ? rawSlides.map((s) => ({ ...s }))
    : DEFAULT_BUILTIN_SLIDES.map((s) => ({ ...s }));

  // Garante que pelo menos 1 slide esteja visível
  if (!safeList.some((s) => s.visible)) {
    safeList[0].visible = true;
  }

  let activeIdx = 0;
  const allSlides = safeList.map((slide) => {
    if (slide.kind === 'custom' && slide.customData) {
      const existingNote = slide.steps?.[0]?.defaultNotes;
      slide.steps = buildStepsForCustomSlide(
        slide.customData.title || slide.fullTitle,
        slide.customData,
        existingNote
      );
    }
    if (slide.visible) {
      const assigned = activeIdx;
      activeIdx += 1;
      return {
        ...slide,
        slideIndex: assigned,
        numberLabel: String(assigned + 1).padStart(2, '0'),
      };
    }
    return {
      ...slide,
      slideIndex: -1,
      numberLabel: '--',
    };
  });

  const activeSlides = allSlides.filter((s) => s.visible);
  return { allSlides, activeSlides };
}

function loadInitialManagedSlides(): SlideMeta[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BUILTIN_SLIDES.map((s) => ({ ...s }));
  }
  try {
    const raw = window.localStorage.getItem(MANAGED_DECK_STORAGE_KEY);
    if (!raw) return DEFAULT_BUILTIN_SLIDES.map((s) => ({ ...s }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_BUILTIN_SLIDES.map((s) => ({ ...s }));
    }
    return parsed as SlideMeta[];
  } catch {
    return DEFAULT_BUILTIN_SLIDES.map((s) => ({ ...s }));
  }
}

let deckVersionCounter = 1;

function createSnapshotWithVersion(rawSlides: SlideMeta[]) {
  const normalized = normalizeDeckSlides(rawSlides);
  return {
    ...normalized,
    version: deckVersionCounter++,
  };
}

let deckState = createSnapshotWithVersion(loadInitialManagedSlides());
const deckListeners = new Set<() => void>();

/**
 * Array exportado mutado in-place sempre que o deck muda para manter 100% de compatibilidade
 * com qualquer referência direta a `PRESENTATION_SLIDES`.
 */
export const PRESENTATION_SLIDES: SlideMeta[] = [...deckState.activeSlides];

function syncExportedPresentationSlides() {
  PRESENTATION_SLIDES.splice(0, PRESENTATION_SLIDES.length, ...deckState.activeSlides);
}

export function getManagedDeckSnapshot() {
  return deckState;
}

export function getActiveSlides(): SlideMeta[] {
  return deckState.activeSlides;
}

export function getAllManagedSlides(): SlideMeta[] {
  return deckState.allSlides;
}

export function subscribeManagedDeck(listener: () => void): () => void {
  deckListeners.add(listener);
  return () => {
    deckListeners.delete(listener);
  };
}

export function useManagedDeck() {
  return useSyncExternalStore(
    subscribeManagedDeck,
    getManagedDeckSnapshot,
    getManagedDeckSnapshot
  );
}

export function setManagedDeckSlides(
  nextSlides: SlideMeta[],
  options?: { persistLocal?: boolean }
) {
  const persistLocal = options?.persistLocal ?? true;
  deckState = createSnapshotWithVersion(nextSlides);
  syncExportedPresentationSlides();

  if (persistLocal && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        MANAGED_DECK_STORAGE_KEY,
        JSON.stringify(deckState.allSlides)
      );
    } catch {
      // Ignora caso imagem grande exceda quota
    }
  }

  deckListeners.forEach((fn) => fn());
}

export function resetManagedDeckToDefaults() {
  setManagedDeckSlides(
    DEFAULT_BUILTIN_SLIDES.map((s) => ({
      ...s,
      steps: s.steps.map((st) => ({ ...st })),
    }))
  );
}

// ============================================================================
// HELPERS DE NAVEGAÇÃO DINÂMICA ( SEMPRE BASEADOS NOS SLIDES VISÍVEIS ATUAIS )
// ============================================================================

export interface NavigationPosition {
  slideIndex: number;
  subStep: number;
}

export function getSlideStepCount(slideIndex: number): number {
  const active = deckState.activeSlides;
  return active[slideIndex]?.steps.length ?? 1;
}

export function clampPosition(slideIndex: number, subStep: number): NavigationPosition {
  const active = deckState.activeSlides;
  const maxSlide = Math.max(0, active.length - 1);
  const safeSlide = Math.max(0, Math.min(maxSlide, Math.round(slideIndex)));
  const maxStep = Math.max(0, getSlideStepCount(safeSlide) - 1);
  const safeStep = Math.max(0, Math.min(maxStep, Math.round(subStep)));
  return { slideIndex: safeSlide, subStep: safeStep };
}

export function getNextPosition(slideIndex: number, subStep: number): NavigationPosition | null {
  const active = deckState.activeSlides;
  const current = clampPosition(slideIndex, subStep);
  const stepCount = getSlideStepCount(current.slideIndex);
  if (current.subStep + 1 < stepCount) {
    return { slideIndex: current.slideIndex, subStep: current.subStep + 1 };
  }
  if (current.slideIndex + 1 < active.length) {
    return { slideIndex: current.slideIndex + 1, subStep: 0 };
  }
  return null;
}

export function getPrevPosition(slideIndex: number, subStep: number): NavigationPosition | null {
  const current = clampPosition(slideIndex, subStep);
  if (current.subStep > 0) {
    return { slideIndex: current.slideIndex, subStep: current.subStep - 1 };
  }
  if (current.slideIndex > 0) {
    const prevSlide = current.slideIndex - 1;
    return { slideIndex: prevSlide, subStep: Math.max(0, getSlideStepCount(prevSlide) - 1) };
  }
  return null;
}

export function getLinearStepStats(slideIndex: number, subStep: number): {
  currentLinearStep: number;
  totalLinearSteps: number;
} {
  const active = deckState.activeSlides;
  let totalLinearSteps = 0;
  let currentLinearStep = 1;

  for (let i = 0; i < active.length; i++) {
    const slide = active[i];
    if (i < slideIndex) {
      currentLinearStep += slide.steps.length;
    } else if (i === slideIndex) {
      currentLinearStep += Math.min(subStep, Math.max(0, slide.steps.length - 1));
    }
    totalLinearSteps += slide.steps.length;
  }

  return { currentLinearStep, totalLinearSteps: Math.max(1, totalLinearSteps) };
}

export function makeNoteKey(slideIndex: number, subStep: number): string {
  const active = deckState.activeSlides;
  const slide = active[slideIndex];
  if (slide?.id) {
    return `${slide.id}:${subStep}`;
  }
  return `${slideIndex}:${subStep}`;
}

export function getStepMeta(slideIndex: number, subStep: number): {
  slide: SlideMeta;
  step: StepMeta;
} {
  const active = deckState.activeSlides;
  const pos = clampPosition(slideIndex, subStep);
  const slide = active[pos.slideIndex] ?? active[0] ?? DEFAULT_BUILTIN_SLIDES[0];
  const step = slide.steps[pos.subStep] ?? slide.steps[0];
  return { slide, step };
}
