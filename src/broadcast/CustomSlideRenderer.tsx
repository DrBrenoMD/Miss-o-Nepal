import React, { useContext, useRef } from 'react';
import { SlideContext, useSteps } from 'spectacle';
import { motion } from 'framer-motion';
import {
  Compass,
  Mountain,
  Flame,
  Users,
  Globe,
  BookOpen,
  Heart,
  ShieldAlert,
  Sparkles,
  Scale,
  Award,
  Layers,
  Move,
} from 'lucide-react';
import {
  LiquidGlassContainer,
  SlideStage,
  CanvaFlowLayer,
} from '../AnimationWrappers';
import { OfficialNepalFlag } from '../OfficialNepalFlag';
import { Slide01CoverContent } from '../Slide01Cover';
import { Slide01BScriptureContent } from '../Slide01BScripture';
import { Slide02GeographyContent } from '../Slide02Geography';
import { Slide02AEconomyHDIContent } from '../Slide02AEconomyHDI';
import { Slide02BLanguagesCastesContent } from '../Slide02BLanguagesCastes';
import { Slide02CDailyCustomsContent } from '../Slide02CDailyCustoms';
import { Slide02DStreetsMobilityContent } from '../Slide02DStreetsMobility';
import { Slide02ERitualsFestivalsContent } from '../Slide02ERitualsFestivals';
import { Slide03TimelineContent } from '../Slide03Timeline';
import {
  BuiltinSlideBanner,
  CustomCanvasBlock,
  CustomIconName,
  CustomSlideAccent,
  CustomSlideCardItem,
  CustomSlideData,
  SlideMeta,
} from './presentationMetadata';
import { useOptionalBroadcast, useStageInstance } from './BroadcastContext';

export interface InteractiveCanvasHandlers {
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateBlockRect: (
    blockId: string,
    patch: Partial<Pick<CustomCanvasBlock, 'x' | 'y' | 'width' | 'height'>>
  ) => void;
}

export function renderCustomIcon(iconName: CustomIconName, className = 'w-6 h-6') {
  switch (iconName) {
    case 'compass':
      return <Compass className={className} />;
    case 'mountain':
      return <Mountain className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'shield':
      return <ShieldAlert className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'layers':
    default:
      return <Layers className={className} />;
  }
}

function getAccentPalette(accent: CustomSlideAccent, isDarkBg: boolean) {
  if (accent === 'crimson') {
    return {
      primary: '#dc143c',
      secondary: '#003893',
      badgeBg: isDarkBg ? 'rgba(220,20,60,0.22)' : 'rgba(220,20,60,0.1)',
      badgeBorder: isDarkBg ? 'rgba(255,120,145,0.45)' : 'rgba(220,20,60,0.28)',
      badgeText: isDarkBg ? '#ff8fa3' : '#dc143c',
      cardAccentBorder: 'rgba(220,20,60,0.35)',
    };
  }
  if (accent === 'gold') {
    return {
      primary: '#d97706',
      secondary: '#003893',
      badgeBg: isDarkBg ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.12)',
      badgeBorder: isDarkBg ? 'rgba(251,191,36,0.45)' : 'rgba(217,119,6,0.32)',
      badgeText: isDarkBg ? '#fcd34d' : '#b45309',
      cardAccentBorder: 'rgba(217,119,6,0.35)',
    };
  }
  if (accent === 'emerald') {
    return {
      primary: '#059669',
      secondary: '#003893',
      badgeBg: isDarkBg ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.12)',
      badgeBorder: isDarkBg ? 'rgba(52,211,153,0.45)' : 'rgba(5,150,105,0.3)',
      badgeText: isDarkBg ? '#6ee7b7' : '#047857',
      cardAccentBorder: 'rgba(5,150,105,0.35)',
    };
  }
  return {
    primary: '#003893',
    secondary: '#dc143c',
    badgeBg: isDarkBg ? 'rgba(56,189,248,0.18)' : 'rgba(0,56,147,0.09)',
    badgeBorder: isDarkBg ? 'rgba(125,211,252,0.4)' : 'rgba(0,56,147,0.25)',
    badgeText: isDarkBg ? '#93c5fd' : '#003893',
    cardAccentBorder: 'rgba(0,56,147,0.3)',
  };
}

/**
 * Sobreposição opcional em Liquid Glass para slides originais (1 a 8),
 * permitindo adicionar um destaque ou aviso personalizado sem perder os mapas/gráficos interativos.
 */
export const BuiltinSlideBannerOverlay: React.FC<{
  banner?: BuiltinSlideBanner;
}> = React.memo(({ banner }) => {
  if (!banner || !banner.enabled || (!banner.title.trim() && !banner.body.trim())) {
    return null;
  }

  const posClass =
    banner.position === 'top-right'
      ? 'top-[38px] right-[64px]'
      : 'bottom-[42px] left-[64px]';

  const accentColor = banner.accent === 'crimson' ? '#dc143c' : '#003893';

  return (
    <div
      className={`pointer-events-none absolute ${posClass} z-40 max-w-[560px]`}
    >
      <div
        className="rounded-[26px] bg-white/85 backdrop-blur-xl border-2 px-6 py-4 shadow-[0_24px_50px_-12px_rgba(8,37,76,0.22)]"
        style={{ borderColor: accentColor }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          {banner.badge && (
            <span
              className="font-mono text-[11px] font-black uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              {banner.badge}
            </span>
          )}
        </div>
        {banner.title && (
          <div className="font-display text-[19px] font-black uppercase tracking-tight text-[#0f0f0f] leading-snug">
            {banner.title}
          </div>
        )}
        {banner.body && (
          <div className="font-sans text-[14.5px] font-medium text-[#27272a] leading-snug mt-1">
            {banner.body}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Camada de Quadro Livre (Free Canvas 1920x1080) com suporte a arrastar e redimensionar no Editor
 */
const FreeCanvasStageTemplate: React.FC<{
  slide: SlideMeta;
  data: CustomSlideData;
  isDarkBg: boolean;
  palette: ReturnType<typeof getAccentPalette>;
  interactiveCanvas?: InteractiveCanvasHandlers;
}> = ({ slide, data, isDarkBg, palette, interactiveCanvas }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const blocks = data.canvasBlocks || [];

  const computeStageScale = (): number => {
    const el = stageRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 ? rect.width / 1920 : 1;
  };

  const handleBlockPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    block: CustomCanvasBlock,
    mode: 'move' | 'resize'
  ) => {
    if (!interactiveCanvas) return;
    e.stopPropagation();
    e.preventDefault();
    interactiveCanvas.onSelectBlock(block.id);

    const scale = computeStageScale();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = block.x;
    const startY = block.y;
    const startW = block.width || 400;
    const startH = block.height || 180;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / scale;
      const dy = (moveEv.clientY - startClientY) / scale;

      if (mode === 'move') {
        const nextX = Math.max(20, Math.min(1900 - startW, Math.round((startX + dx) / 10) * 10));
        const nextY = Math.max(20, Math.min(1060 - startH, Math.round((startY + dy) / 10) * 10));
        interactiveCanvas.onUpdateBlockRect(block.id, { x: nextX, y: nextY });
      } else {
        const nextW = Math.max(180, Math.min(1900 - startX, Math.round((startW + dx) / 10) * 10));
        const nextH = Math.max(60, Math.min(1060 - startY, Math.round((startH + dy) / 10) * 10));
        interactiveCanvas.onUpdateBlockRect(block.id, { width: nextW, height: nextH });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={() => {
        if (interactiveCanvas) interactiveCanvas.onSelectBlock(null);
      }}
      className="relative w-[1920px] h-[1080px] overflow-hidden select-none"
    >
      {/* Grade de alinhamento sutil quando no modo de edição */}
      {interactiveCanvas && (
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(0,56,147,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,56,147,0.18) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Marca d'água da numeração do slide */}
      <div className="pointer-events-none absolute top-[42px] right-[72px] flex items-center gap-3 opacity-75">
        <OfficialNepalFlag className="w-[34px] h-[42px]" />
        <span
          className={`font-mono text-[15px] font-black tracking-[0.22em] uppercase ${
            isDarkBg ? 'text-white/70' : 'text-[#08254c]/70'
          }`}
        >
          SLIDE {slide.numberLabel}
        </span>
      </div>

      {blocks.map((block) => {
        const isSelected = interactiveCanvas?.selectedBlockId === block.id;
        const blockAccent =
          block.accent === 'crimson'
            ? '#dc143c'
            : block.accent === 'gold'
            ? '#d97706'
            : block.accent === 'emerald'
            ? '#059669'
            : block.accent === 'dark'
            ? '#0f172a'
            : '#003893';

        const alignClass =
          block.align === 'center'
            ? 'text-center items-center'
            : block.align === 'right'
            ? 'text-right items-end'
            : 'text-left items-start';

        return (
          <div
            key={block.id}
            style={{
              position: 'absolute',
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${block.height}px`,
            }}
            onPointerDown={(e) => handleBlockPointerDown(e, block, 'move')}
            className={`group transition-shadow ${
              interactiveCanvas ? 'cursor-move' : ''
            } ${
              isSelected
                ? 'ring-4 ring-[#dc143c] shadow-[0_0_0_6px_rgba(220,20,60,0.2)] z-30'
                : 'z-10'
            }`}
          >
            {block.type === 'badge' && (
              <div
                className={`w-full h-full flex ${alignClass} justify-center flex-col`}
              >
                <div
                  className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border-2 font-mono text-[16px] font-black uppercase tracking-[0.22em] shadow-sm"
                  style={{
                    backgroundColor: palette.badgeBg,
                    borderColor: blockAccent,
                    color: isDarkBg ? '#ffffff' : blockAccent,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: blockAccent }}
                  />
                  <span>{block.title}</span>
                </div>
              </div>
            )}

            {block.type === 'heading' && (
              <div
                className={`w-full h-full flex flex-col justify-center ${alignClass}`}
              >
                <h2
                  className={`font-display font-black uppercase tracking-tight leading-[1.04] ${
                    block.fontSize === 'xl'
                      ? 'text-[68px]'
                      : block.fontSize === 'lg'
                      ? 'text-[52px]'
                      : block.fontSize === 'sm'
                      ? 'text-[30px]'
                      : 'text-[40px]'
                  } ${isDarkBg ? 'text-white' : 'text-[#0f0f0f]'}`}
                >
                  {block.title}
                </h2>
                {block.body && (
                  <p
                    className={`font-sans text-[22px] font-semibold mt-2 ${
                      isDarkBg ? 'text-slate-300' : 'text-[#003893]'
                    }`}
                  >
                    {block.body}
                  </p>
                )}
              </div>
            )}

            {block.type === 'text' && (
              <div
                className={`w-full h-full flex flex-col justify-center ${alignClass} rounded-[26px] ${
                  isDarkBg
                    ? 'bg-white/8 border border-white/15 text-slate-200'
                    : 'bg-white/65 border border-white/85 text-[#1f2937]'
                } backdrop-blur-md px-7 py-5 shadow-lg`}
              >
                {block.title && (
                  <div
                    className="font-display text-[20px] font-extrabold uppercase tracking-wider mb-1.5"
                    style={{ color: blockAccent }}
                  >
                    {block.title}
                  </div>
                )}
                <p
                  className={`font-sans leading-relaxed font-medium ${
                    block.fontSize === 'lg'
                      ? 'text-[26px]'
                      : block.fontSize === 'sm'
                      ? 'text-[17px]'
                      : 'text-[21px]'
                  }`}
                >
                  {block.body}
                </p>
              </div>
            )}

            {block.type === 'stat' && (
              <div
                className={`w-full h-full rounded-[32px] p-7 flex flex-col justify-between border-2 shadow-xl backdrop-blur-xl ${
                  isDarkBg
                    ? 'bg-slate-900/80 text-white'
                    : 'bg-white/85 text-[#0f0f0f]'
                }`}
                style={{ borderColor: blockAccent }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono text-[14px] font-black uppercase tracking-[0.2em]"
                    style={{ color: blockAccent }}
                  >
                    {block.title}
                  </span>
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: blockAccent }}
                  />
                </div>
                <div
                  className="font-display text-[64px] font-black tracking-tight leading-none my-1"
                  style={{ color: isDarkBg ? '#ffffff' : blockAccent }}
                >
                  {block.statValue}
                </div>
                <div
                  className={`font-sans text-[17px] font-semibold leading-snug ${
                    isDarkBg ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {block.body}
                </div>
              </div>
            )}

            {block.type === 'card' && (
              <div
                className={`w-full h-full rounded-[30px] p-7 flex flex-col justify-between border shadow-xl backdrop-blur-xl ${
                  isDarkBg
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/80 border-white/90 text-[#0f0f0f]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: blockAccent }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    {block.statValue && (
                      <span
                        className="font-mono text-[18px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full"
                        style={{
                          backgroundColor: palette.badgeBg,
                          color: isDarkBg ? '#ffffff' : blockAccent,
                        }}
                      >
                        {block.statValue}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-[24px] font-black uppercase tracking-tight leading-snug">
                    {block.title}
                  </h3>
                  <p
                    className={`font-sans text-[18px] font-medium leading-relaxed mt-2 ${
                      isDarkBg ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {block.body}
                  </p>
                </div>
                <div
                  className="h-1.5 w-20 rounded-full mt-3"
                  style={{ backgroundColor: blockAccent }}
                />
              </div>
            )}

            {block.type === 'image' && (
              <div className="w-full h-full rounded-[34px] overflow-hidden border-2 border-white/80 shadow-2xl relative bg-slate-900">
                <img
                  src={block.imageUrl || '/assets/step1-kathmandu.jpg'}
                  alt={block.title || 'Imagem do Slide'}
                  className="w-full h-full object-cover"
                />
                {(block.title || block.body) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
                    {block.title && (
                      <div className="font-display text-[20px] font-black uppercase tracking-wider">
                        {block.title}
                      </div>
                    )}
                    {block.body && (
                      <div className="font-sans text-[15px] text-white/85 mt-0.5">
                        {block.body}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {block.type === 'divider' && (
              <div className="w-full h-full flex items-center">
                <div
                  className="w-full h-[4px] rounded-full"
                  style={{ backgroundColor: blockAccent }}
                />
              </div>
            )}

            {/* Alça de Redimensionamento visível no Editor Interativo */}
            {interactiveCanvas && isSelected && (
              <>
                <div className="pointer-events-none absolute -top-9 left-0 px-3 py-1 rounded-lg bg-[#dc143c] text-white font-mono text-[12px] font-bold flex items-center gap-1.5 shadow-md whitespace-nowrap">
                  <Move className="w-3.5 h-3.5" />
                  <span>
                    {block.x}, {block.y} · {block.width}×{block.height}px
                  </span>
                </div>
                <div
                  onPointerDown={(e) => handleBlockPointerDown(e, block, 'resize')}
                  className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-[#003893] border-2 border-white text-white flex items-center justify-center shadow-lg cursor-nwse-resize z-40"
                  title="Arraste para redimensionar este elemento"
                >
                  <span className="w-2.5 h-2.5 border-r-2 border-b-2 border-white" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const CustomSlideContent: React.FC<{
  slide: SlideMeta;
  interactiveCanvas?: InteractiveCanvasHandlers;
}> = ({ slide, interactiveCanvas }) => {
  const stageInstance = useStageInstance();
  const broadcast = useOptionalBroadcast();
  const slideContext = useContext(SlideContext) as any;

  const data: CustomSlideData = slide.customData || {
    template: 'hero-split',
    badge: 'SLIDE PERSONALIZADO',
    title: slide.fullTitle || 'NOVO SLIDE',
    subtitle: 'Missão Nepal',
    leadText: '',
    imageUrl: '/assets/step1-kathmandu.jpg',
    imageCaption: 'Missão Nepal',
    heroMetricValue: '100%',
    heroMetricLabel: 'Destaque',
    calloutTitle: '',
    calloutBody: '',
    accentColor: 'navy',
    backgroundStyle: 'cream',
    stepByStepCards: false,
    cards: [],
    canvasBlocks: [],
  };

  const maxSteps =
    data.stepByStepCards && data.cards.length > 1 ? data.cards.length - 1 : 0;
  const { step, placeholder } = useSteps(maxSteps);

  const safeSpectacleStep =
    typeof step === 'number' && Number.isFinite(step)
      ? Math.max(0, Math.min(maxSteps, Math.round(step + 1)))
      : 0;

  const isSlideActive = slideContext ? Boolean(slideContext.isSlideActive) : true;

  const syncedSubStep =
    stageInstance.forcedSubStep !== null
      ? Math.max(0, Math.min(maxSteps, stageInstance.forcedSubStep))
      : broadcast && broadcast.mode !== 'standalone' && isSlideActive
      ? Math.max(0, Math.min(maxSteps, broadcast.roomState.subStep))
      : null;

  const activeSubStep = syncedSubStep !== null ? syncedSubStep : safeSpectacleStep;

  const isDarkBg = data.backgroundStyle === 'navy-dark';
  const palette = getAccentPalette(data.accentColor, isDarkBg);

  const bgGradientClass =
    data.backgroundStyle === 'navy-dark'
      ? 'bg-gradient-to-br from-[#07162c] via-[#0c2346] to-[#131b2e] text-white'
      : data.backgroundStyle === 'warm-dawn'
      ? 'bg-gradient-to-br from-[#f6efe2] via-[#f4f2eb] to-[#ede3d2] text-[#0f0f0f]'
      : 'bg-[#f4f2eb] text-[#0f0f0f]';

  const isCardVisible = (cardIdx: number) => {
    if (!data.stepByStepCards) return true;
    return cardIdx <= activeSubStep;
  };

  const isCardHighlighted = (cardIdx: number) => {
    if (!data.stepByStepCards) return false;
    return cardIdx === activeSubStep;
  };

  const renderCard = (card: CustomSlideCardItem, idx: number, compact = false) => {
    const visible = isCardVisible(idx);
    const highlighted = isCardHighlighted(idx);

    return (
      <motion.div
        key={card.id || idx}
        initial={ false }
        animate={{
          opacity: visible ? 1 : 0.18,
          scale: highlighted ? 1.015 : 1,
          y: visible ? 0 : 12,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`rounded-[28px] border backdrop-blur-xl transition-colors ${
          compact ? 'p-5' : 'p-6'
        } ${
          isDarkBg
            ? highlighted
              ? 'bg-white/16 border-white/45 shadow-2xl'
              : 'bg-white/9 border-white/15 shadow-lg'
            : highlighted
            ? 'bg-white/92 border-[#dc143c]/55 shadow-2xl'
            : 'bg-white/75 border-white/90 shadow-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                backgroundColor: idx % 2 === 0 ? palette.primary : palette.secondary,
              }}
            >
              {renderCustomIcon(card.icon || 'layers', 'w-5 h-5')}
            </div>
            <h3
              className={`font-display ${
                compact ? 'text-[19px]' : 'text-[21px]'
              } font-black uppercase tracking-tight leading-snug ${
                isDarkBg ? 'text-white' : 'text-[#0f0f0f]'
              }`}
            >
              {card.title}
            </h3>
          </div>

          {card.value && (
            <span
              className="font-mono text-[14px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shrink-0 border"
              style={{
                backgroundColor: palette.badgeBg,
                borderColor: palette.badgeBorder,
                color: palette.badgeText,
              }}
            >
              {card.value}
            </span>
          )}
        </div>

        <p
          className={`font-sans ${
            compact ? 'text-[15.5px]' : 'text-[16.5px]'
          } font-medium leading-relaxed ${
            isDarkBg ? 'text-slate-200' : 'text-[#27272a]'
          }`}
        >
          {card.body}
        </p>
      </motion.div>
    );
  };

  return (
    <SlideStage slideKey={slide.id} className={bgGradientClass}>
      {placeholder}

      {/* Elementos decorativos Liquid Glass sutis no fundo */}
      <div
        className="pointer-events-none absolute -top-[180px] -right-[140px] w-[620px] h-[620px] rounded-full blur-3xl opacity-25"
        style={{ background: palette.primary }}
      />
      <div
        className="pointer-events-none absolute -bottom-[200px] -left-[140px] w-[560px] h-[560px] rounded-full blur-3xl opacity-20"
        style={{ background: palette.secondary }}
      />

      {data.template === 'free-canvas' ? (
        <FreeCanvasStageTemplate
          slide={slide}
          data={data}
          isDarkBg={isDarkBg}
          palette={palette}
          interactiveCanvas={interactiveCanvas}
        />
      ) : data.template === 'hero-split' ? (
        <CanvaFlowLayer className="w-full h-full px-[76px] py-[56px] flex flex-col justify-between">
          {/* Topo Editorial */}
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-[1140px]">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-3"
                style={{
                  backgroundColor: palette.badgeBg,
                  borderColor: palette.badgeBorder,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: palette.primary }}
                />
                <span
                  className="font-mono text-[13px] font-black uppercase tracking-[0.22em]"
                  style={{ color: palette.badgeText }}
                >
                  {data.badge || `SLIDE ${slide.numberLabel}`}
                </span>
              </div>

              <h1
                className={`font-display text-[54px] font-black uppercase tracking-tight leading-[1.03] ${
                  isDarkBg ? 'text-white' : 'text-[#0f0f0f]'
                }`}
              >
                {data.title}
              </h1>
              {data.subtitle && (
                <p
                  className={`font-sans text-[21px] font-semibold mt-2 ${
                    isDarkBg ? 'text-slate-300' : 'text-[#003893]'
                  }`}
                >
                  {data.subtitle}
                </p>
              )}
            </div>

            {/* Selo / Métrica Principal no Topo Direito */}
            <LiquidGlassContainer
              intensity="medium"
              disablePulse
              className={`px-7 py-4 rounded-[28px] shrink-0 flex items-center gap-5 ${
                isDarkBg ? '!bg-white/10 !border-white/20' : ''
              }`}
            >
              <OfficialNepalFlag className="w-[42px] h-[52px] shrink-0" />
              <div>
                <div
                  className="font-display text-[36px] font-black leading-none tracking-tight"
                  style={{ color: isDarkBg ? '#ffffff' : palette.primary }}
                >
                  {data.heroMetricValue}
                </div>
                <div
                  className={`font-mono text-[12px] font-bold uppercase tracking-[0.18em] mt-1 ${
                    isDarkBg ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {data.heroMetricLabel}
                </div>
              </div>
            </LiquidGlassContainer>
          </div>

          {/* Corpo Principal: Coluna Esquerda (Lead + Cards) + Coluna Direita (Foto + Callout) */}
          <div className="grid grid-cols-12 gap-8 items-stretch flex-1 mt-6 min-h-0">
            <div className="col-span-7 flex flex-col justify-between gap-4 min-h-0">
              {data.leadText && (
                <div
                  className={`rounded-[26px] px-6 py-4 border backdrop-blur-md ${
                    isDarkBg
                      ? 'bg-white/8 border-white/15 text-slate-100'
                      : 'bg-white/65 border-white/85 text-[#1f2937]'
                  }`}
                >
                  <p className="font-sans text-[18.5px] font-medium leading-relaxed">
                    {data.leadText}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 flex-1 content-start">
                {data.cards.slice(0, 3).map((c, idx) => renderCard(c, idx, true))}
              </div>
            </div>

            <div className="col-span-5 flex flex-col gap-4 min-h-0">
              <div className="relative flex-1 rounded-[34px] overflow-hidden border-2 border-white/85 shadow-2xl bg-slate-900 min-h-[420px]">
                <img
                  src={data.imageUrl || '/assets/step1-kathmandu.jpg'}
                  alt={data.imageCaption || data.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
                    REGISTRO VISUAL · MISSÃO NEPAL
                  </div>
                  <div className="font-display text-[20px] font-extrabold tracking-tight mt-0.5">
                    {data.imageCaption}
                  </div>
                </div>
              </div>

              {(data.calloutTitle || data.calloutBody) && (
                <div
                  className="rounded-[26px] px-6 py-4 border-2 shadow-lg backdrop-blur-xl"
                  style={{
                    backgroundColor: isDarkBg
                      ? 'rgba(15,23,42,0.82)'
                      : 'rgba(255,255,255,0.88)',
                    borderColor: palette.secondary,
                  }}
                >
                  {data.calloutTitle && (
                    <div
                      className="font-mono text-[12px] font-black uppercase tracking-[0.2em]"
                      style={{ color: palette.secondary }}
                    >
                      {data.calloutTitle}
                    </div>
                  )}
                  {data.calloutBody && (
                    <div
                      className={`font-sans text-[15.5px] font-semibold leading-snug mt-1 ${
                        isDarkBg ? 'text-slate-100' : 'text-[#0f0f0f]'
                      }`}
                    >
                      {data.calloutBody}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CanvaFlowLayer>
      ) : data.template === 'cards-grid' ? (
        <CanvaFlowLayer className="w-full h-full px-[76px] py-[54px] flex flex-col justify-between">
          {/* Cabeçalho */}
          <div className="flex items-end justify-between gap-8">
            <div className="max-w-[1220px]">
              <div
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-3"
                style={{
                  backgroundColor: palette.badgeBg,
                  borderColor: palette.badgeBorder,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: palette.primary }}
                />
                <span
                  className="font-mono text-[13px] font-black uppercase tracking-[0.22em]"
                  style={{ color: palette.badgeText }}
                >
                  {data.badge}
                </span>
              </div>
              <h1
                className={`font-display text-[50px] font-black uppercase tracking-tight leading-[1.04] ${
                  isDarkBg ? 'text-white' : 'text-[#0f0f0f]'
                }`}
              >
                {data.title}
              </h1>
              {data.leadText && (
                <p
                  className={`font-sans text-[19px] font-medium mt-2 ${
                    isDarkBg ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {data.leadText}
                </p>
              )}
            </div>

            <div
              className="rounded-[26px] px-6 py-4 border-2 text-right shrink-0"
              style={{
                backgroundColor: palette.badgeBg,
                borderColor: palette.badgeBorder,
              }}
            >
              <div
                className="font-display text-[38px] font-black leading-none"
                style={{ color: isDarkBg ? '#ffffff' : palette.primary }}
              >
                {data.heroMetricValue}
              </div>
              <div
                className={`font-mono text-[12px] font-bold uppercase tracking-[0.18em] mt-1 ${
                  isDarkBg ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {data.heroMetricLabel}
              </div>
            </div>
          </div>

          {/* Mosaico 2x2 de Cartões Liquid Glass */}
          <div className="grid grid-cols-2 gap-6 my-auto py-4">
            {data.cards.slice(0, 4).map((c, idx) => renderCard(c, idx, false))}
          </div>

          {/* Rodapé de síntese */}
          {(data.calloutTitle || data.calloutBody) && (
            <div
              className={`rounded-[26px] px-7 py-4 border flex items-center justify-between gap-6 ${
                isDarkBg
                  ? 'bg-white/8 border-white/20 text-white'
                  : 'bg-white/80 border-white/90 text-[#0f0f0f]'
              } shadow-lg backdrop-blur-xl`}
            >
              <div className="flex items-center gap-4">
                <span
                  className="px-4 py-1.5 rounded-full font-mono text-[12px] font-black uppercase tracking-[0.2em] text-white shrink-0"
                  style={{ backgroundColor: palette.secondary }}
                >
                  {data.calloutTitle || 'SÍNTESE'}
                </span>
                <span className="font-sans text-[17px] font-semibold">
                  {data.calloutBody}
                </span>
              </div>
              <OfficialNepalFlag className="w-[32px] h-[40px] shrink-0" />
            </div>
          )}
        </CanvaFlowLayer>
      ) : data.template === 'big-statement' ? (
        <CanvaFlowLayer className="w-full h-full px-[96px] py-[64px] flex flex-col justify-between items-center text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full border"
            style={{
              backgroundColor: palette.badgeBg,
              borderColor: palette.badgeBorder,
            }}
          >
            <OfficialNepalFlag className="w-[26px] h-[32px]" />
            <span
              className="font-mono text-[14px] font-black uppercase tracking-[0.24em]"
              style={{ color: palette.badgeText }}
            >
              {data.badge}
            </span>
          </div>

          <div className="max-w-[1460px] my-auto space-y-6">
            <div
              className="font-display text-[84px] font-black leading-none tracking-tight"
              style={{ color: isDarkBg ? '#ffffff' : palette.primary }}
            >
              {data.heroMetricValue}
            </div>
            <h1
              className={`font-display text-[56px] font-black uppercase tracking-tight leading-[1.06] ${
                isDarkBg ? 'text-white' : 'text-[#0f0f0f]'
              }`}
            >
              {data.title}
            </h1>
            <p
              className={`font-sans text-[26px] font-medium leading-relaxed max-w-[1220px] mx-auto ${
                isDarkBg ? 'text-slate-200' : 'text-[#1f2937]'
              }`}
            >
              “{data.leadText}”
            </p>
            {data.subtitle && (
              <div
                className="font-mono text-[15px] font-bold uppercase tracking-[0.22em]"
                style={{ color: palette.secondary }}
              >
                — {data.subtitle}
              </div>
            )}
          </div>

          {data.cards.length > 0 && (
            <div className="w-full grid grid-cols-3 gap-6 text-left">
              {data.cards.slice(0, 3).map((c, idx) => renderCard(c, idx, true))}
            </div>
          )}
        </CanvaFlowLayer>
      ) : data.template === 'image-showcase' ? (
        <CanvaFlowLayer className="w-full h-full p-[52px] flex flex-col justify-between relative">
          <div className="relative w-full h-full rounded-[42px] overflow-hidden border-2 border-white/80 shadow-2xl bg-slate-950 flex flex-col justify-between p-[56px]">
            <img
              src={data.imageUrl || '/assets/step2-himalayas.jpg'}
              alt={data.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />

            {/* Topo sobre a imagem */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-black/55 backdrop-blur-md border border-white/25 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc143c]" />
                <span className="font-mono text-[13px] font-black uppercase tracking-[0.22em]">
                  {data.badge}
                </span>
              </div>

              <div className="px-6 py-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/25 text-right text-white">
                <div className="font-display text-[32px] font-black leading-none text-amber-300">
                  {data.heroMetricValue}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 mt-1">
                  {data.heroMetricLabel}
                </div>
              </div>
            </div>

            {/* Base sobre a imagem */}
            <div className="relative z-10 grid grid-cols-12 gap-8 items-end">
              <div className="col-span-7 text-white space-y-3">
                <h1 className="font-display text-[58px] font-black uppercase tracking-tight leading-[1.03]">
                  {data.title}
                </h1>
                {data.subtitle && (
                  <p className="font-sans text-[22px] font-semibold text-amber-300">
                    {data.subtitle}
                  </p>
                )}
                {data.leadText && (
                  <p className="font-sans text-[19px] text-white/90 leading-relaxed max-w-[920px]">
                    {data.leadText}
                  </p>
                )}
              </div>

              <div className="col-span-5 space-y-3">
                {data.cards.slice(0, 2).map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="rounded-[26px] bg-black/65 backdrop-blur-xl border border-white/25 p-5 text-white shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display text-[19px] font-black uppercase text-amber-300">
                        {c.title}
                      </span>
                      {c.value && (
                        <span className="font-mono text-[13px] font-bold px-3 py-0.5 rounded-full bg-white/15">
                          {c.value}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[15.5px] text-white/90 leading-snug">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CanvaFlowLayer>
      ) : (
        /* Template 'comparison' */
        <CanvaFlowLayer className="w-full h-full px-[76px] py-[54px] flex flex-col justify-between">
          <div className="flex items-end justify-between gap-8">
            <div>
              <div
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-3"
                style={{
                  backgroundColor: palette.badgeBg,
                  borderColor: palette.badgeBorder,
                }}
              >
                <Scale className="w-4 h-4" style={{ color: palette.primary }} />
                <span
                  className="font-mono text-[13px] font-black uppercase tracking-[0.22em]"
                  style={{ color: palette.badgeText }}
                >
                  {data.badge}
                </span>
              </div>
              <h1
                className={`font-display text-[50px] font-black uppercase tracking-tight leading-[1.04] ${
                  isDarkBg ? 'text-white' : 'text-[#0f0f0f]'
                }`}
              >
                {data.title}
              </h1>
              {data.leadText && (
                <p
                  className={`font-sans text-[19px] font-medium mt-1.5 ${
                    isDarkBg ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {data.leadText}
                </p>
              )}
            </div>

            <div className="px-6 py-3.5 rounded-[24px] bg-[#dc143c] text-white text-right shrink-0 shadow-lg">
              <div className="font-display text-[34px] font-black leading-none">
                {data.heroMetricValue}
              </div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mt-1 text-white/90">
                {data.heroMetricLabel}
              </div>
            </div>
          </div>

          {/* 2 Grandes Painéis Lado a Lado + Linha Inferior */}
          <div className="grid grid-cols-2 gap-7 my-auto py-4">
            {data.cards.slice(0, 2).map((c, idx) => (
              <div
                key={c.id || idx}
                className={`rounded-[34px] p-8 border-2 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[340px] ${
                  isDarkBg ? 'bg-white/10 text-white' : 'bg-white/85 text-[#0f0f0f]'
                }`}
                style={{
                  borderColor: idx === 0 ? '#003893' : '#dc143c',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span
                      className="px-4 py-1.5 rounded-full font-mono text-[13px] font-black uppercase tracking-[0.2em] text-white"
                      style={{
                        backgroundColor: idx === 0 ? '#003893' : '#dc143c',
                      }}
                    >
                      {idx === 0 ? 'PERSPECTIVA A' : 'PERSPECTIVA B'}
                    </span>
                    {c.value && (
                      <span
                        className="font-display text-[32px] font-black"
                        style={{ color: idx === 0 ? '#003893' : '#dc143c' }}
                      >
                        {c.value}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-[30px] font-black uppercase tracking-tight leading-snug mb-3">
                    {c.title}
                  </h2>
                  <p
                    className={`font-sans text-[19px] font-medium leading-relaxed ${
                      isDarkBg ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {c.body}
                  </p>
                </div>

                <div
                  className="h-2 w-28 rounded-full mt-6"
                  style={{ backgroundColor: idx === 0 ? '#003893' : '#dc143c' }}
                />
              </div>
            ))}
          </div>

          {data.cards.length > 2 && (
            <div className="grid grid-cols-2 gap-7">
              {data.cards.slice(2, 4).map((c, idx) => renderCard(c, idx + 2, true))}
            </div>
          )}
        </CanvaFlowLayer>
      )}
    </SlideStage>
  );
};

/**
 * Renderiza qualquer slide gerenciado do Deck (seja um dos 8 slides originais com sobreposição
 * opcional, seja um slide 100% customizado / quadro livre criado no Editor de Slides).
 */
export const ManagedSlideStageContent: React.FC<{
  slide: SlideMeta;
  interactiveCanvas?: InteractiveCanvasHandlers;
}> = React.memo(({ slide, interactiveCanvas }) => {
  if (slide.kind === 'custom') {
    return <CustomSlideContent slide={slide} interactiveCanvas={interactiveCanvas} />;
  }

  let builtinNode: React.ReactNode;
  switch (slide.builtinIndex) {
    case 0:
      builtinNode = <Slide01CoverContent />;
      break;
    case 1:
      builtinNode = <Slide02GeographyContent />;
      break;
    case 2:
      builtinNode = <Slide02AEconomyHDIContent />;
      break;
    case 3:
      builtinNode = <Slide02BLanguagesCastesContent />;
      break;
    case 4:
      builtinNode = <Slide02CDailyCustomsContent />;
      break;
    case 5:
      builtinNode = <Slide02DStreetsMobilityContent />;
      break;
    case 6:
      builtinNode = <Slide02ERitualsFestivalsContent />;
      break;
    case 7:
      builtinNode = <Slide03TimelineContent />;
      break;
    case 8:
      builtinNode = <Slide01BScriptureContent />;
      break;
    default:
      builtinNode = <Slide01CoverContent />;
      break;
  }

  return (
    <div className="relative w-[1920px] h-[1080px] overflow-hidden">
      {builtinNode}
      <BuiltinSlideBannerOverlay banner={slide.builtinBanner} />
    </div>
  );
});
