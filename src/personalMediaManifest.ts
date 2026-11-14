/**
 * Manifesto centralizado de fotos e vídeos da Missão Nepal (Slides 09 a 20).
 * Contém todas as mídias reais enviadas pelo usuário e quadros reservados mínimos
 * para os próximos envios.
 */

import nycDaytimeImg from './assets/images/nyc_daytime_skyline_1794607706530.jpg';
import nepalPolicePatrolImg from './assets/images/nepal_police_patrol_1794605693389.jpg';
import cliffsideRoadImg from './assets/images/nepal_cliffside_bus_road_1794605694297.jpg';
import kathmanduDawnImg from './assets/images/kathmandu_dawn_gratitude_1794605693770.jpg';

export interface MediaAssetSlot {
  id: string;
  kind: 'image' | 'video';
  src?: string;
  poster?: string;
  placeholderHint?: string;
  objectPosition?: string;
}

export const PERSONAL_MEDIA_SLOTS: Record<string, MediaAssetSlot> = {
  // Slide 09 — O Chamado (NYC de dia)
  nycDaytime: {
    id: 'nycDaytime',
    kind: 'image',
    src: nycDaytimeImg,
    objectPosition: 'center',
  },

  // Slide 11 — A Chegada & A Galera (Dia 22)
  missionariesGroup: {
    id: 'missionariesGroup',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Missionários',
  },
  paulAndSonia: {
    id: 'paulAndSonia',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Paul & Sonia',
  },

  // Slide 12 — Turismo & Integração Cultural (6 mídias reais + 1 slot Rooftop)
  thamelNightVideo: {
    id: 'thamelNightVideo',
    kind: 'video',
    src: '/assets/aistudio/VID_20261022_202124139_d12c9984.mp4',
  },
  monkeyTempleVideo: {
    id: 'monkeyTempleVideo',
    kind: 'video',
    src: '/assets/aistudio/VID_20261023_120139191_26575784.mp4',
  },
  monkeyClosePhoto: {
    id: 'monkeyClosePhoto',
    kind: 'image',
    src: '/assets/aistudio/image_b4dbcf51.png',
    objectPosition: 'center top',
  },
  kathmanduDalBhatPhoto: {
    id: 'kathmanduDalBhatPhoto',
    kind: 'image',
    src: '/assets/aistudio/IMG_20261023_162727726_HDR_66db32df.jpg',
  },
  pashupatinathPyrePhoto: {
    id: 'pashupatinathPyrePhoto',
    kind: 'image',
    src: '/assets/aistudio/image_9d25ab09.png',
  },
  pashupatinathRiverPhoto: {
    id: 'pashupatinathRiverPhoto',
    kind: 'image',
    src: '/assets/aistudio/image_aa957950.png',
  },
  hotelRooftopWorship: {
    id: 'hotelRooftopWorship',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Culto Rooftop',
  },

  // Slide 13 — Ida para Bargachhi (5 mídias reais enviadas)
  buddhaAirSelfie: {
    id: 'buddhaAirSelfie',
    kind: 'image',
    src: '/assets/aistudio/image_27a2d8d2.png',
    objectPosition: 'center',
  },
  bargachhiCourtyard: {
    id: 'bargachhiCourtyard',
    kind: 'image',
    src: '/assets/aistudio/image_afae438a.png',
  },
  bargachhiReceptionVideo1: {
    id: 'bargachhiReceptionVideo1',
    kind: 'video',
    src: '/assets/aistudio/VID-20261031-WA0015_312933c9.mp4',
  },
  bargachhiReceptionVideo2: {
    id: 'bargachhiReceptionVideo2',
    kind: 'video',
    src: '/assets/aistudio/VID-20261025-WA0043_8098e9b5.mp4',
  },
  bargachhiMotorbike: {
    id: 'bargachhiMotorbike',
    kind: 'image',
    src: '/assets/aistudio/image_ce665c3f.png',
  },

  // Slide 14 — Atividades Desenvolvidas (3 fotos reais + 1 slot)
  activityDentalHealth: {
    id: 'activityDentalHealth',
    kind: 'image',
    src: '/assets/aistudio/image_47852335.png',
    objectPosition: 'center top',
  },
  activityVbsPuppets: {
    id: 'activityVbsPuppets',
    kind: 'image',
    src: '/assets/aistudio/image_4a55c158.png',
  },
  activityCommunityGroup: {
    id: 'activityCommunityGroup',
    kind: 'image',
    src: '/assets/aistudio/image_60fa291a.png',
  },
  activityExtraSlot: {
    id: 'activityExtraSlot',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Saneamento / Obreiros',
  },

  // Slide 15 — Denúncia & Polícia (Foto real do policial + agente à paisana + foto viatura)
  policeCompoundReal: {
    id: 'policeCompoundReal',
    kind: 'image',
    src: '/assets/aistudio/image_b7a99d12.png',
    objectPosition: 'center top',
  },
  nepalPolicePatrol: {
    id: 'nepalPolicePatrol',
    kind: 'image',
    src: nepalPolicePatrolImg,
  },

  // Slide 18 — O Ônibus (4 fotos reais + 1 vídeo real)
  busFrontWindshield: {
    id: 'busFrontWindshield',
    kind: 'image',
    src: '/assets/aistudio/image_bb7115ba.png',
  },
  busNeonAisle: {
    id: 'busNeonAisle',
    kind: 'image',
    src: '/assets/aistudio/image_de217300.png',
  },
  busBunkVideo: {
    id: 'busBunkVideo',
    kind: 'video',
    src: '/assets/aistudio/VID_20261029_202956679_d507e299.mp4',
  },
  busPeaceBunk: {
    id: 'busPeaceBunk',
    kind: 'image',
    src: '/assets/aistudio/image_5ad46275.png',
  },
  busSleepingBunk: {
    id: 'busSleepingBunk',
    kind: 'image',
    src: '/assets/aistudio/image_9556282b.png',
  },

  // Slide 19 — Estrada nos Despenhadeiros
  cliffRoadHero: {
    id: 'cliffRoadHero',
    kind: 'image',
    src: cliffsideRoadImg,
  },
  cliffRoadPhoto2: {
    id: 'cliffRoadPhoto2',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Estrada 01',
  },
  cliffRoadPhoto3: {
    id: 'cliffRoadPhoto3',
    kind: 'image',
    src: undefined,
    placeholderHint: 'Foto · Estrada 02',
  },

  // Slide 20 — Polícia, Espiões & Comissão de Liberdade Religiosa · Gratidão e Volta para Casa
  gratitudeDawn: {
    id: 'gratitudeDawn',
    kind: 'image',
    src: kathmanduDawnImg,
  },
};
