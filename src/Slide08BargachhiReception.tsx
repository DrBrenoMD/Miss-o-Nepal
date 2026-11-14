import React, { useState, useEffect, useRef, memo } from 'react';
import { Slide, useSteps } from 'spectacle';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Film, Camera, MapPin } from 'lucide-react';
import {
  LiquidGlassContainer,
  MorphElement,
  SlideStage,
  CanvaFlowLayer,
} from './AnimationWrappers';
import { useOptionalBroadcast, useStageInstance } from './broadcast/BroadcastContext';

export type BargachhiStage = 0 | 1 | 2 | 3 | 4;

interface BargachhiMediaItem {
  id: string;
  stageIndex: BargachhiStage;
  kind: 'video' | 'image';
  src: string;
  kicker: string;
  shortLabel: string;
  title: string;
  location: string;
  description: string;
  culturalNote: string;
  objectPosition?: string;
}

const BARGACHHI_MEDIA: BargachhiMediaItem[] = [
  {
    id: 'reception-main-video',
    stageIndex: 1,
    kind: 'video',
    src: '/assets/aistudio/VID-20261025-WA0043_8098e9b5.mp4',
    kicker: 'VÍDEO 01 · ACOLHIDA EM BARGACHHI',
    shortLabel: 'Vídeo · Cânticos & Flores',
    title: 'Recepção Noturna com Cânticos & Colares de Flores (Mala)',
    location: 'BARGACHHI · BIRATNAGAR, NEPAL',
    description:
      'Ao chegarmos à noite na vila de Bargachhi, fomos recebidos com duas fileiras de moradores e membros da igreja local cantando hinos em nepalês e colocando tradicionais guirlandas de cravo-de-defunto (Sayapatri Mala) em cada visitante.',
    culturalNote:
      'Na cultura nepalesa, receber o visitante com flores alaranjadas (Marigold) e cânticos à porta simboliza honra profunda, bênção espiritual e alegria pela chegada.',
  },
  {
    id: 'reception-gate-video',
    stageIndex: 2,
    kind: 'video',
    src: '/assets/aistudio/VID-20261031-WA0015_312933c9.mp4',
    kicker: 'VÍDEO 02 · CHEGADA AO PORTÃO',
    shortLabel: 'Vídeo · Chegada no Portão',
    title: 'Entrada no Complexo Missionário em Bargachhi',
    location: 'PORTÃO DA BASE · BARGACHHI',
    description:
      'Instantes da entrada noturna pelo portão principal enquanto a comunidade aguardava com lanternas, sorrisos e buquês preparados à mão após nossa longa viagem desde Kathmandu.',
    culturalNote:
      'Contraste emocionante entre o cansaço da viagem terrestre e aérea e o calor humano da igreja local no extremo leste do Nepal.',
  },
  {
    id: 'buddha-air-flight',
    stageIndex: 3,
    kind: 'image',
    src: '/assets/aistudio/image_27a2d8d2.png',
    kicker: 'TRAJETO AÉREO · BUDDHA AIR 9N-AMU',
    shortLabel: 'Voo KTM ➔ BIR',
    title: 'Embarque Noturno no ATR-72 rumo a Biratnagar',
    location: 'KATHMANDU ➔ AEROPORTO DE BIRATNAGAR',
    description:
      'Após os dias iniciais na capital, embarcamos à noite no turboélice da Buddha Air cruzando o espaço aéreo ao sul do Himalaia até as planícies quentes do Terai em Biratnagar.',
    culturalNote:
      'De Biratnagar seguimos por estrada vicinal até Bargachhi (também grafada como Bhargachhi), área ao norte da cidade no distrito de Morang.',
    objectPosition: '50% 45%',
  },
  {
    id: 'bargachhi-compound-moto',
    stageIndex: 4,
    kind: 'image',
    src: '/assets/aistudio/image_afae438a.png',
    kicker: 'ALOJAMENTO & DESLOCAMENTO LOCAL',
    shortLabel: 'Base & Moto à Noite',
    title: 'Base Missionária em Bargachhi & Mobilidade Local',
    location: 'DISTRITO DE MORANG · KOSHI PROVINCE',
    description:
      'O complexo de alvenaria e pátio aberto onde montamos nossa base em Bargachhi — recebendo apoio de picape para as malas de suprimentos e deslocamento em motocicletas pela região.',
    culturalNote:
      'Bargachhi fica próximo à fronteira com a Índia, no corredor leste do Nepal (Biratnagar / Itahari), marcada por clima tropical, planícies agrícolas e aldeias muito receptivas.',
    objectPosition: '50% 52%',
  },
];

const MOTO_PHOTO = {
  src: '/assets/aistudio/image_ce665c3f.png',
  title: 'Deslocamento noturno de moto em Bargachhi',
  objectPosition: '50% 42%',
};

interface CustomVideoPlayerProps {
  src: string;
  isPreview: boolean;
  compact?: boolean;
  accentLabel?: string;
}

const BargachhiVideoPlayer: React.FC<CustomVideoPlayerProps> = memo(
  ({ src, isPreview, compact = false, accentLabel }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      setIsPlaying(false);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }, [src]);

    const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPreview || !videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!videoRef.current) return;
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
    };

    const restartVideo = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      setProgress(0);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isPreview || !videoRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      videoRef.current.currentTime = ratio * duration;
      setProgress(ratio * 100);
    };

    const formatTime = (sec: number) => {
      if (!Number.isFinite(sec) || sec <= 0) return '0:00';
      const mins = Math.floor(sec / 60);
      const secs = Math.floor(sec % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
      <div
        onClick={togglePlay}
        className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#060b16] border border-white/80 shadow-2xl group cursor-pointer"
      >
        <video
          ref={videoRef}
          src={src}
          muted={isPreview || isMuted}
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => {
            const vid = e.currentTarget;
            if (vid.duration > 0) {
              setProgress((vid.currentTime / vid.duration) * 100);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain bg-[#060b16]"
        />

        {/* Scrim de legibilidade superior/inferior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        {/* Cabeçalho interno discreto sem pílulas */}
        {accentLabel && (
          <div className="pointer-events-none absolute top-4 left-5 right-5 flex items-center justify-between text-white/95">
            <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-[#dc143c]" />
              <span>{accentLabel}</span>
            </span>
            <span className="font-mono text-[12px] font-semibold text-white/75 tabular-nums">
              {duration > 0 ? formatTime(duration) : 'MP4'}
            </span>
          </div>
        )}

        {/* Botão Play Central quando pausado */}
        {!isPlaying && !isPreview && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`rounded-full bg-[#dc143c]/95 text-white shadow-2xl border border-white/50 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                compact ? 'w-14 h-14' : 'w-20 h-20'
              }`}
            >
              <Play className={`${compact ? 'w-6 h-6 ml-0.5' : 'w-8 h-8 ml-1'} fill-white`} />
            </div>
          </div>
        )}

        {/* Barra de controles limpa no rodapé */}
        {!isPreview && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-3 flex flex-col gap-2.5 z-20"
          >
            {/* Barra de progresso clicável */}
            <div
              onClick={handleSeek}
              className="w-full h-2 rounded-full bg-white/25 overflow-hidden cursor-pointer hover:h-2.5 transition-all"
              title="Avançar ou voltar no vídeo"
            >
              <div
                className="h-full bg-[#dc143c] rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-[#dc143c] text-white font-display text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  aria-label={isMuted ? 'Ativar áudio' : 'Silenciar vídeo'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={restartVideo}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  aria-label="Reiniciar vídeo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <span className="font-mono text-[12px] text-white/80 tabular-nums">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export const Slide08BargachhiReceptionContent: React.FC = memo(() => {
  // 5 etapas sincronizadas (0 = Visão Geral; 1..4 = Destaques dos vídeos e fotos reais)
  const { step, placeholder } = useSteps(4);
  const [manualStage, setManualStage] = useState<BargachhiStage | null>(null);
  const [overviewVideoIdx, setOverviewVideoIdx] = useState<0 | 1>(0);
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();

  useEffect(() => {
    setManualStage(null);
  }, [step]);

  const safeStepNumber =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(4, Math.round(step + 1)))
      : 0;
  const clampedSpectacleStage = safeStepNumber as BargachhiStage;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? (Math.max(0, Math.min(4, stageInstance.forcedSubStep)) as BargachhiStage)
      : broadcast && broadcast.mode !== 'standalone' && broadcast.roomState.slideIndex === 12
      ? (Math.max(0, Math.min(4, broadcast.roomState.subStep)) as BargachhiStage)
      : null;

  const activeStage: BargachhiStage =
    syncedSubStep !== null
      ? syncedSubStep
      : manualStage !== null
      ? manualStage
      : clampedSpectacleStage;

  const selectedItem =
    activeStage > 0 ? BARGACHHI_MEDIA[activeStage - 1] ?? BARGACHHI_MEDIA[0] : null;

  const activeOverviewVideo =
    overviewVideoIdx === 0 ? BARGACHHI_MEDIA[0] : BARGACHHI_MEDIA[1];

  const handleBackgroundClick = () => {
    if (stageInstance.disableSlideTapAdvance) return;
    if (activeStage < 4) {
      setManualStage(((activeStage + 1) as BargachhiStage));
    } else {
      setManualStage(0);
    }
  };

  return (
    <>
      {placeholder}
      <SlideStage slideKey="slide-13-bargachhi-reception" className="bg-[#f4f2eb]">
        <div
          onClick={handleBackgroundClick}
          className="relative w-[1920px] h-[1080px] bg-[#f4f2eb] overflow-hidden select-none cursor-pointer"
        >
          {/* ===================================================================
              1. CAMADA AMBIENTAL SUAVE (SEM BLUR ANIMADO PARA 60FPS)
             =================================================================== */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div
              className="absolute left-[40px] top-[120px] w-[520px] h-[520px] rounded-full bg-[#003893]/14"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
            <div
              className="absolute right-[40px] bottom-[40px] w-[540px] h-[540px] rounded-full bg-[#dc143c]/12"
              style={{
                maskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 72%)',
              }}
            />
          </div>

          {/* ===================================================================
              2. CABEÇALHO DO SLIDE ("MISSÃO NEPAL" + "VIAGEM PARA BARGACHHI & RECEPÇÃO")
             =================================================================== */}
          <CanvaFlowLayer
            speed="slow"
            className="pointer-events-none absolute top-[38px] left-[64px] right-[64px] z-30 flex items-start justify-between gap-8"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1.5">
                <MorphElement layoutId="hero-main-title">
                  <span className="font-display text-[21px] font-black uppercase tracking-[0.22em] text-[#003893]">
                    MISSÃO NEPAL
                  </span>
                </MorphElement>
                <span className="text-[#0f0f0f]/35 font-bold">·</span>
                <span className="font-display text-[15px] font-bold uppercase tracking-[0.18em] text-[#dc143c]">
                  TERAI ORIENTAL · DISTRITO DE MORANG
                </span>
              </div>

              <h1 className="font-display text-[48px] font-black uppercase tracking-[-0.02em] text-[#080d1a] leading-[1.02]">
                VIAGEM PARA BARGACHHI &amp; RECEPÇÃO
              </h1>
              <p className="font-sans text-[19px] font-medium text-[#2f3136]/85 mt-1">
                Voo noturno de Kathmandu a Biratnagar e acolhida emocionante em{' '}
                <strong className="font-bold text-[#080d1a]">Bargachhi</strong> (grafia local:{' '}
                <em>Bhargachhi</em>), região ao norte de Biratnagar
              </p>
            </div>

            <LiquidGlassContainer
              intensity="subtle"
              tint="light"
              disablePulse={true}
              className="px-6 py-3.5 flex flex-col items-end text-right shrink-0"
            >
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#003893] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#dc143c]" />
                <span>
                  {activeStage === 0
                    ? 'ORTOGRAFIA VERIFICADA · BARGACHHI'
                    : `REGISTRO 0${activeStage} DE 04 · EM DESTAQUE`}
                </span>
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wider text-[#0f0f0f]/75 mt-1">
                {activeStage === 0
                  ? 'BARGACHHI (BHARGACHHI) · BIRATNAGAR, NEPAL'
                  : selectedItem?.location}
              </span>
            </LiquidGlassContainer>
          </CanvaFlowLayer>

          {/* ===================================================================
              3. CONTEÚDO PRINCIPAL
             =================================================================== */}
          <CanvaFlowLayer
            speed="medium"
            delay={0.05}
            className="absolute top-[192px] left-[64px] right-[64px] bottom-[80px] z-20"
          >
            <AnimatePresence mode="wait">
              {activeStage === 0 ? (
                /* ---------------------------------------------------------------
                   ETAPA 0: VÍDEO PRINCIPAL DA RECEPÇÃO (ESQ) + ROTA E 3 FOTOS (DIR)
                   --------------------------------------------------------------- */
                <motion.div
                  key="bargachhi-overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex gap-6"
                >
                  {/* COLUNA ESQUERDA (1020px): PLAYER DE VÍDEO DA RECEPÇÃO NOTURNA */}
                  <div className="w-[1020px] h-full flex flex-col gap-3.5 shrink-0">
                    <LiquidGlassContainer
                      intensity="strong"
                      tint="navy"
                      disablePulse={true}
                      className="flex-1 min-h-0 p-3.5 flex flex-col"
                    >
                      <div className="flex-1 min-h-0">
                        <BargachhiVideoPlayer
                          src={activeOverviewVideo.src}
                          isPreview={stageInstance.isPreview}
                          accentLabel={activeOverviewVideo.kicker}
                        />
                      </div>

                      {/* Seletor entre os 2 vídeos reais da recepção + resumo curto */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2.5 border-t border-[#08254c]/12 flex items-center justify-between gap-4 px-1"
                      >
                        <div className="min-w-0">
                          <div className="font-display text-[17px] font-black uppercase tracking-tight text-[#080d1a] truncate">
                            {activeOverviewVideo.title}
                          </div>
                          <div className="font-sans text-[13.5px] font-medium text-[#2f3136]/80 truncate">
                            Recebidos pela igreja com cânticos em nepalês e colares de flores amarelas (Marigold).
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#08254c]/8 p-1 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => setOverviewVideoIdx(0)}
                            className={`px-3 py-1.5 rounded-lg font-display text-[11px] font-extrabold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                              overviewVideoIdx === 0
                                ? 'bg-[#003893] text-white shadow-sm'
                                : 'text-[#08254c]/75 hover:text-[#080d1a]'
                            }`}
                          >
                            Vídeo 01 · Recepção
                          </button>
                          <button
                            type="button"
                            onClick={() => setOverviewVideoIdx(1)}
                            className={`px-3 py-1.5 rounded-lg font-display text-[11px] font-extrabold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                              overviewVideoIdx === 1
                                ? 'bg-[#003893] text-white shadow-sm'
                                : 'text-[#08254c]/75 hover:text-[#080d1a]'
                            }`}
                          >
                            Vídeo 02 · Portão
                          </button>
                        </div>
                      </div>
                    </LiquidGlassContainer>
                  </div>

                  {/* COLUNA DIREITA: CARD DE CONTEXTO + 3 FOTOS DO TRAJETO E CHEGADA */}
                  <div className="flex-1 h-full flex flex-col gap-4">
                    {/* Nota de Contexto & Ortografia */}
                    <LiquidGlassContainer
                      intensity="medium"
                      tint="light"
                      disablePulse={true}
                      className="px-6 py-4"
                    >
                      <div className="flex items-center justify-between text-[11.5px] font-display font-extrabold uppercase tracking-[0.18em] text-[#003893] mb-1.5">
                        <span>CHEGADA AO LESTE DO NEPAL</span>
                        <span className="text-[#dc143c]">KTM ➔ BIRATNAGAR ➔ BARGACHHI</span>
                      </div>
                      <p className="font-sans text-[15.5px] font-medium text-[#11151c] leading-relaxed">
                        A grafia padrão oficial é{' '}
                        <strong className="font-extrabold text-[#003893]">Bargachhi</strong> (também
                        encontrada em transliterações como <em>Bhargachhi</em>), situada no setor norte
                        de <strong className="font-bold">Biratnagar</strong>, no Distrito de Morang.
                        Após o pouso noturno pela Buddha Air, seguimos até o complexo da missão sob
                        cânticos e colares de boas-vindas.
                      </p>
                    </LiquidGlassContainer>

                    {/* Foto Grande Superior: Buddha Air ATR-72 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualStage(3);
                      }}
                      className="group flex-1 min-h-0"
                    >
                      <LiquidGlassContainer
                        intensity="strong"
                        tint="light"
                        disablePulse={true}
                        className="w-full h-full p-3 transition-transform duration-200 group-hover:scale-[1.01]"
                      >
                        <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-[#080d1a] border border-white/80">
                          <img
                            src="/assets/aistudio/image_27a2d8d2.png"
                            alt="Embarque noturno Buddha Air 9N-AMU para Biratnagar"
                            referrerPolicy="no-referrer"
                            style={{ objectPosition: '50% 45%' }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a]/85 via-[#080d1a]/15 to-transparent" />
                          <div className="absolute bottom-3.5 left-4 right-4 text-left">
                            <span className="font-display text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-amber-300 flex items-center gap-1.5">
                              <Camera className="w-3 h-3" />
                              <span>VOO NOTURNO · BUDDHA AIR 9N-AMU</span>
                            </span>
                            <h3 className="font-display text-[19px] font-black uppercase tracking-tight text-white leading-tight mt-0.5">
                              Embarque em Kathmandu rumo a Biratnagar
                            </h3>
                          </div>
                        </div>
                      </LiquidGlassContainer>
                    </div>

                    {/* Linha Inferior: 2 Fotos lado a lado (Pátio da Missão + Moto à Noite) */}
                    <div className="h-[248px] grid grid-cols-2 gap-4 shrink-0">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualStage(4);
                        }}
                        className="group h-full min-h-0"
                      >
                        <LiquidGlassContainer
                          intensity="strong"
                          tint="light"
                          disablePulse={true}
                          className="w-full h-full p-2.5 transition-transform duration-200 group-hover:scale-[1.01]"
                        >
                          <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-[#080d1a] border border-white/80">
                            <img
                              src="/assets/aistudio/image_afae438a.png"
                              alt="Pátio do complexo missionário em Bargachhi"
                              referrerPolicy="no-referrer"
                              style={{ objectPosition: '50% 52%' }}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a]/88 via-[#080d1a]/15 to-transparent" />
                            <div className="absolute bottom-3 left-3.5 right-3.5 text-left">
                              <span className="font-display text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-amber-300 block">
                                ALOJAMENTO · PICAPE DE APOIO
                              </span>
                              <h4 className="font-display text-[15px] font-black uppercase text-white leading-tight mt-0.5">
                                Base Missionária em Bargachhi
                              </h4>
                            </div>
                          </div>
                        </LiquidGlassContainer>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualStage(4);
                        }}
                        className="group h-full min-h-0"
                      >
                        <LiquidGlassContainer
                          intensity="strong"
                          tint="light"
                          disablePulse={true}
                          className="w-full h-full p-2.5 transition-transform duration-200 group-hover:scale-[1.01]"
                        >
                          <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-[#080d1a] border border-white/80">
                            <img
                              src={MOTO_PHOTO.src}
                              alt={MOTO_PHOTO.title}
                              referrerPolicy="no-referrer"
                              style={{ objectPosition: MOTO_PHOTO.objectPosition }}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a]/88 via-[#080d1a]/15 to-transparent" />
                            <div className="absolute bottom-3 left-3.5 right-3.5 text-left">
                              <span className="font-display text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-amber-300 block">
                                NOITE EM MORANG · TRAJETO
                              </span>
                              <h4 className="font-display text-[15px] font-black uppercase text-white leading-tight mt-0.5">
                                Deslocamento Noturno de Moto
                              </h4>
                            </div>
                          </div>
                        </LiquidGlassContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ---------------------------------------------------------------
                   ETAPAS 1..4: DESTAQUE INDIVIDUAL EM TELA CHEIA + NARRATIVA
                   --------------------------------------------------------------- */
                selectedItem && (
                  <motion.div
                    key={`spotlight-${selectedItem.id}`}
                    initial={{ opacity: 0, scale: 0.988 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.988 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex gap-6"
                  >
                    {/* Mídia Principal à Esquerda (1060px) */}
                    <div className="w-[1060px] h-full shrink-0">
                      <LiquidGlassContainer
                        intensity="strong"
                        tint="light"
                        disablePulse={true}
                        className="w-full h-full p-4"
                      >
                        {selectedItem.kind === 'video' ? (
                          <BargachhiVideoPlayer
                            src={selectedItem.src}
                            isPreview={stageInstance.isPreview}
                            accentLabel={selectedItem.kicker}
                          />
                        ) : activeStage === 4 ? (
                          /* Etapa 4 combina as duas fotos em Bargachhi (Base + Moto) */
                          <div className="w-full h-full grid grid-cols-2 gap-4">
                            <div className="relative h-full rounded-[22px] overflow-hidden bg-[#080d1a] border border-white/80">
                              <img
                                src="/assets/aistudio/image_afae438a.png"
                                alt="Base Missionária em Bargachhi"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4 text-white font-display text-[15px] font-bold uppercase tracking-wide">
                                Pátio da Base em Bargachhi · Bagagens
                              </div>
                            </div>
                            <div className="relative h-full rounded-[22px] overflow-hidden bg-[#080d1a] border border-white/80">
                              <img
                                src={MOTO_PHOTO.src}
                                alt={MOTO_PHOTO.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4 text-white font-display text-[15px] font-bold uppercase tracking-wide">
                                Trajeto Noturno de Moto pela Vila
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-[#080d1a] border border-white/85 shadow-2xl">
                            <img
                              src={selectedItem.src}
                              alt={selectedItem.title}
                              referrerPolicy="no-referrer"
                              style={{ objectPosition: selectedItem.objectPosition || 'center' }}
                              className="w-full h-full object-cover"
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080d1a]/80 to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white/95">
                              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.18em]">
                                {selectedItem.location}
                              </span>
                            </div>
                          </div>
                        )}
                      </LiquidGlassContainer>
                    </div>

                    {/* Coluna Direita: História & Navegação Rápida */}
                    <div className="flex-1 h-full flex flex-col justify-between gap-4">
                      <LiquidGlassContainer
                        intensity="strong"
                        tint="light"
                        disablePulse={true}
                        className="p-7 flex-1 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#08254c]/15 pb-3.5 mb-4">
                            <span className="font-display text-[12px] font-black uppercase tracking-[0.22em] text-[#003893]">
                              {selectedItem.kicker}
                            </span>
                            <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#dc143c]">
                              0{selectedItem.stageIndex} / 04
                            </span>
                          </div>

                          <h2 className="font-display text-[32px] font-black uppercase tracking-tight text-[#080d1a] leading-[1.08] mb-4">
                            {selectedItem.title}
                          </h2>

                          <p className="font-sans text-[18px] font-medium text-[#11151c] leading-relaxed">
                            {selectedItem.description}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#003893]/[0.07] border border-[#003893]/20 p-5">
                          <span className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-[#dc143c] block mb-1.5">
                            SIGNIFICADO CULTURAL &amp; LOCALIZAÇÃO
                          </span>
                          <p className="font-sans text-[16px] font-semibold text-[#080d1a]/90 leading-relaxed">
                            {selectedItem.culturalNote}
                          </p>
                        </div>
                      </LiquidGlassContainer>

                      {/* Miniaturas de Navegação */}
                      <LiquidGlassContainer
                        intensity="medium"
                        tint="navy"
                        disablePulse={true}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="font-display text-[10.5px] font-black uppercase tracking-[0.2em] text-[#003893]">
                            ALTERNAR MOMENTOS EM BARGACHHI
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualStage(0);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#003893] text-white font-display text-[10.5px] font-extrabold uppercase tracking-wider hover:bg-[#dc143c] transition-colors cursor-pointer"
                          >
                            ⊞ Voltar à Visão Geral
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5">
                          {BARGACHHI_MEDIA.map((item) => {
                            const isCurrent = item.stageIndex === activeStage;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualStage(item.stageIndex);
                                }}
                                className={`h-[72px] rounded-xl px-2.5 py-2 border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-[#003893] border-[#dc143c] text-white shadow-md'
                                    : 'bg-white/75 border-white/85 text-[#080d1a] hover:bg-white'
                                }`}
                              >
                                <span
                                  className={`font-display text-[10px] font-extrabold uppercase tracking-wider ${
                                    isCurrent ? 'text-amber-300' : 'text-[#dc143c]'
                                  }`}
                                >
                                  {item.kind === 'video' ? '▶ VÍDEO' : '📷 FOTO'} 0{item.stageIndex}
                                </span>
                                <span className="font-display text-[12px] font-bold leading-tight truncate">
                                  {item.shortLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </LiquidGlassContainer>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </CanvaFlowLayer>

          {/* ===================================================================
              4. BARRA DE NAVEGAÇÃO DISCRETA NO RODAPÉ (REVELA NO HOVER)
             =================================================================== */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto group absolute left-0 bottom-0 z-40 pt-6 pr-12 pl-[64px] pb-[20px]"
          >
            <div className="flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-all duration-300 ease-out">
              <button
                type="button"
                onClick={() => setManualStage(0)}
                className={`px-3.5 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
                  activeStage === 0
                    ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                    : 'bg-white/65 text-[#08254c] border-white/85 hover:bg-white/90'
                }`}
              >
                00. Visão Geral
              </button>

              {BARGACHHI_MEDIA.map((item) => {
                const isCurrent = activeStage === item.stageIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setManualStage(item.stageIndex)}
                    className={`px-3.5 py-1.5 rounded-full font-display text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#003893] text-white border-[#003893] shadow-lg'
                        : 'bg-white/65 text-[#08254c] border-white/85 hover:bg-white/90'
                    }`}
                  >
                    0{item.stageIndex}. {item.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SlideStage>
    </>
  );
});

export const Slide08BargachhiReception: React.FC = () => (
  <Slide backgroundColor="#f4f2eb" padding={0}>
    <Slide08BargachhiReceptionContent />
  </Slide>
);

export default Slide08BargachhiReception;
