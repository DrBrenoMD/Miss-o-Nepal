export interface StepMeta {
  subStep: number;
  shortLabel: string;
  title: string;
  defaultNotes: string;
}

export interface SlideMeta {
  slideIndex: number;
  numberLabel: string;
  shortTitle: string;
  fullTitle: string;
  steps: StepMeta[];
}

export const PRESENTATION_SLIDES: SlideMeta[] = [
  {
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
    slideIndex: 1,
    numberLabel: '02',
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

export interface NavigationPosition {
  slideIndex: number;
  subStep: number;
}

export function getSlideStepCount(slideIndex: number): number {
  return PRESENTATION_SLIDES[slideIndex]?.steps.length ?? 1;
}

export function clampPosition(slideIndex: number, subStep: number): NavigationPosition {
  const safeSlide = Math.max(0, Math.min(PRESENTATION_SLIDES.length - 1, Math.round(slideIndex)));
  const maxStep = getSlideStepCount(safeSlide) - 1;
  const safeStep = Math.max(0, Math.min(maxStep, Math.round(subStep)));
  return { slideIndex: safeSlide, subStep: safeStep };
}

export function getNextPosition(slideIndex: number, subStep: number): NavigationPosition | null {
  const current = clampPosition(slideIndex, subStep);
  const stepCount = getSlideStepCount(current.slideIndex);
  if (current.subStep + 1 < stepCount) {
    return { slideIndex: current.slideIndex, subStep: current.subStep + 1 };
  }
  if (current.slideIndex + 1 < PRESENTATION_SLIDES.length) {
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
    return { slideIndex: prevSlide, subStep: getSlideStepCount(prevSlide) - 1 };
  }
  return null;
}

export function getLinearStepStats(slideIndex: number, subStep: number): {
  currentLinearStep: number;
  totalLinearSteps: number;
} {
  let totalLinearSteps = 0;
  let currentLinearStep = 1;

  for (const slide of PRESENTATION_SLIDES) {
    if (slide.slideIndex < slideIndex) {
      currentLinearStep += slide.steps.length;
    } else if (slide.slideIndex === slideIndex) {
      currentLinearStep += Math.min(subStep, slide.steps.length - 1);
    }
    totalLinearSteps += slide.steps.length;
  }

  return { currentLinearStep, totalLinearSteps };
}

export function makeNoteKey(slideIndex: number, subStep: number): string {
  return `${slideIndex}:${subStep}`;
}

export function getStepMeta(slideIndex: number, subStep: number): {
  slide: SlideMeta;
  step: StepMeta;
} {
  const pos = clampPosition(slideIndex, subStep);
  const slide = PRESENTATION_SLIDES[pos.slideIndex] ?? PRESENTATION_SLIDES[0];
  const step = slide.steps[pos.subStep] ?? slide.steps[0];
  return { slide, step };
}
