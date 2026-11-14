import React, { useState, useContext } from 'react';
import { DeckContext } from 'spectacle';
import { Camera, Film, Maximize2, X, Newspaper, Globe } from 'lucide-react';
import { useStageInstance } from './StageInstanceContext';
import { MediaAssetSlot } from './personalMediaManifest';

/**
 * Avanço por clique no fundo do slide (desativado em Telões Receptores e Miniaturas)
 */
export function useMinimalistSlideAdvance() {
  const deckContext = useContext(DeckContext) as any;
  const { disableSlideTapAdvance } = useStageInstance();

  return () => {
    if (disableSlideTapAdvance) return;
    if (deckContext?.stepForward) {
      deckContext.stepForward();
    } else if (deckContext?.advanceSlide) {
      deckContext.advanceSlide();
    }
  };
}

/**
 * Cabeçalho puramente visual: exibe APENAS o título do slide, sem subtítulos ou explicações.
 */
export interface PureSlideTitleHeaderProps {
  title: string;
  rightBadge?: string;
  hideBrandMorph?: boolean;
  MorphWrapper: React.ComponentType<{ layoutId: string; children: React.ReactNode }>;
  FlowWrapper: React.ComponentType<{
    speed?: 'slow' | 'medium' | 'fast';
    className?: string;
    children: React.ReactNode;
  }>;
}

export const PureSlideTitleHeader: React.FC<PureSlideTitleHeaderProps> = ({
  title,
  rightBadge,
  hideBrandMorph = false,
  MorphWrapper,
  FlowWrapper,
}) => {
  return (
    <FlowWrapper
      speed="slow"
      className="pointer-events-none absolute top-[38px] left-[68px] right-[68px] z-30 flex items-end justify-between"
    >
      <div>
        {!hideBrandMorph ? (
          <>
            <MorphWrapper layoutId="hero-main-title">
              <span className="block font-display text-[17px] font-black uppercase tracking-[0.26em] text-[#003893] mb-1">
                MISSÃO NEPAL
              </span>
            </MorphWrapper>
            <h2 className="font-display text-[50px] font-black uppercase tracking-[-0.025em] text-[#080d1a] leading-[1.0]">
              {title}
            </h2>
          </>
        ) : (
          <MorphWrapper layoutId="hero-main-title">
            <h2 className="font-display text-[56px] font-black uppercase tracking-[-0.025em] text-[#080d1a] leading-[1.0]">
              {title}
            </h2>
          </MorphWrapper>
        )}
      </div>

      {rightBadge && (
        <div className="font-display text-[26px] font-black uppercase tracking-[0.12em] text-[#dc143c] pb-0.5">
          {rightBadge}
        </div>
      )}
    </FlowWrapper>
  );
};

/**
 * Quadro puro de Foto ou Vídeo:
 * - Zero texto ou legenda sobreposta nas mídias reais.
 * - Suporta clique para ampliar fotos em Lightbox 16:9.
 * - Para vídeos, exibe controles nativos limpos.
 */
export const EditorialMediaFrame: React.FC<{
  slot: MediaAssetSlot;
  className?: string;
  darkPlaceholder?: boolean;
  onExpandMedia?: (slot: MediaAssetSlot) => void;
}> = ({ slot, className = '', darkPlaceholder = false, onExpandMedia }) => {
  const [imgErr, setImgErr] = useState(false);
  const hasMedia = Boolean(slot.src) && !imgErr;

  if (slot.kind === 'video') {
    return (
      <div
        onClick={(e) => hasMedia && e.stopPropagation()}
        className={`group relative rounded-[22px] overflow-hidden border border-white/80 shadow-md ${
          hasMedia
            ? 'bg-[#081226]'
            : 'bg-gradient-to-br from-[#0b1933] via-[#0e2244] to-[#172f59]'
        } ${className}`}
      >
        {hasMedia ? (
          <video
            src={slot.src}
            poster={slot.poster}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-white/65 gap-2.5">
            <Film className="w-7 h-7 text-[#dc143c]/80" />
            {slot.placeholderHint && (
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-center">
                {slot.placeholderHint}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (hasMedia && onExpandMedia) {
          e.stopPropagation();
          onExpandMedia(slot);
        }
      }}
      className={`group relative rounded-[22px] overflow-hidden border border-white/85 shadow-md ${
        hasMedia
          ? 'bg-[#e6e2d6]'
          : darkPlaceholder
          ? 'bg-gradient-to-br from-[#0d2142] to-[#173463] text-white'
          : 'bg-gradient-to-br from-[#ece8dd] via-[#e5e0d2] to-[#dcd5c5] text-[#080d1a]'
      } ${hasMedia && onExpandMedia ? 'cursor-zoom-in' : ''} ${className}`}
    >
      {hasMedia ? (
        <>
          <img
            src={slot.src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            style={{ objectPosition: slot.objectPosition || 'center' }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {onExpandMedia && (
            <div className="pointer-events-none absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-5 gap-2.5">
          <Camera
            className={`w-7 h-7 ${
              darkPlaceholder ? 'text-white/45' : 'text-[#003893]/45'
            }`}
          />
          {slot.placeholderHint && (
            <span
              className={`font-display text-[13px] font-bold uppercase tracking-[0.18em] text-center ${
                darkPlaceholder ? 'text-white/60' : 'text-[#08254c]/55'
              }`}
            >
              {slot.placeholderHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Lightbox limpo sem texto para ampliar qualquer foto ao clicar
 */
export const MediaLightboxModal: React.FC<{
  slot: MediaAssetSlot | null;
  onClose: () => void;
}> = ({ slot, onClose }) => {
  if (!slot || !slot.src) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute inset-0 z-50 bg-[#050811]/88 backdrop-blur-md flex items-center justify-center p-10 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-7 right-8 w-11 h-11 rounded-full bg-white/15 hover:bg-[#dc143c] text-white flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Fechar imagem ampliada"
      >
        <X className="w-5 h-5" />
      </button>

      <img
        src={slot.src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[1720px] max-h-[940px] w-auto h-auto object-contain rounded-[20px] shadow-2xl border border-white/25"
      />
    </div>
  );
};

/**
 * Estrutura de recorte/print jornalístico autêntico para os Slides 16 e 17
 */
export interface PressClippingItem {
  id: string;
  outlet: string;
  domain: string;
  countryTag: string;
  languageTag: 'NE' | 'EN' | 'PT';
  dateLabel: string;
  sectionLabel: string;
  accentColor: string;
  headline: string;
  translationPt?: string;
  lead: string;
  dateline: string;
}

export const PressClippingCard: React.FC<{
  clip: PressClippingItem;
  compact?: boolean;
  onSelect: (clip: PressClippingItem) => void;
}> = ({ clip, compact = false, onSelect }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip);
      }}
      className="group text-left w-full h-full rounded-[18px] bg-[#fcfbf8] border border-[#08254c]/15 shadow-[0_12px_28px_-10px_rgba(8,37,76,0.16)] hover:shadow-[0_18px_36px_-8px_rgba(8,37,76,0.28)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      <div className="px-3.5 py-2 bg-[#f1efe8] border-b border-[#08254c]/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#dc143c]/70 shrink-0" />
          <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/70 shrink-0" />
          <span className="ml-1.5 font-mono text-[11px] text-[#2f3136]/65 truncate">
            {clip.domain}
          </span>
        </div>
        <span className="font-sans text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#08254c]/75 shrink-0">
          {clip.countryTag}
        </span>
      </div>

      <div className={`px-4 ${compact ? 'pt-2.5 pb-3' : 'pt-4 pb-4'} flex-1 flex flex-col justify-between`}>
        <div>
          <div
            className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b-2"
            style={{ borderColor: clip.accentColor }}
          >
            <span
              className={`font-display font-black tracking-tight ${
                compact ? 'text-[16px]' : 'text-[19px]'
              }`}
              style={{ color: clip.accentColor }}
            >
              {clip.outlet}
            </span>
            <span className="font-sans text-[11px] font-semibold text-[#2f3136]/65 whitespace-nowrap">
              {clip.dateLabel}
            </span>
          </div>

          <div className="font-sans text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#dc143c] mb-1">
            {clip.sectionLabel}
          </div>

          <h3
            className={`font-serif font-bold text-[#0b0e14] leading-[1.22] ${
              compact ? 'text-[15.5px]' : 'text-[19px]'
            }`}
          >
            {clip.headline}
          </h3>

          {clip.translationPt && (
            <p className="font-sans text-[12px] italic font-medium text-[#003893] mt-1 leading-snug">
              “{clip.translationPt}”
            </p>
          )}

          <p
            className={`font-sans text-[#2f3136]/85 mt-1.5 leading-[1.4] ${
              compact ? 'text-[12.5px] line-clamp-2' : 'text-[14px] line-clamp-4'
            }`}
          >
            <strong className="font-bold text-[#080d1a]">{clip.dateline} — </strong>
            {clip.lead}
          </p>
        </div>

        <div className="pt-2 mt-2 border-t border-[#08254c]/8 flex items-center justify-between text-[11px] font-sans font-bold text-[#003893]/80 group-hover:text-[#dc143c] transition-colors">
          <span className="flex items-center gap-1">
            <Newspaper className="w-3.5 h-3.5" />
            <span>{clip.outlet}</span>
          </span>
          <span>Ampliar →</span>
        </div>
      </div>
    </button>
  );
};

export const PressClippingLightbox: React.FC<{
  clip: PressClippingItem | null;
  onClose: () => void;
}> = ({ clip, onClose }) => {
  if (!clip) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute inset-0 z-50 bg-[#080d1a]/75 backdrop-blur-md flex items-center justify-center p-16"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1060px] rounded-[28px] bg-[#fcfbf8] border-2 border-white shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-3.5 bg-[#f1efe8] border-b border-[#08254c]/12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#003893]" />
            <span className="font-mono text-[14px] text-[#2f3136]/80">{clip.domain}</span>
            <span className="text-[#2f3136]/30">·</span>
            <span className="font-sans text-[13px] font-bold uppercase tracking-[0.15em] text-[#003893]">
              {clip.countryTag}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-[#080d1a] text-white font-sans text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#dc143c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>

        <div className="p-10">
          <div
            className="flex items-baseline justify-between pb-4 mb-5 border-b-4"
            style={{ borderColor: clip.accentColor }}
          >
            <div
              className="font-display text-[34px] font-black tracking-tight"
              style={{ color: clip.accentColor }}
            >
              {clip.outlet}
            </div>
            <div className="font-sans text-[15px] font-bold text-[#2f3136]/75">
              {clip.sectionLabel} · {clip.dateLabel}
            </div>
          </div>

          <h3 className="font-serif text-[34px] font-bold text-[#080d1a] leading-[1.2]">
            {clip.headline}
          </h3>

          {clip.translationPt && (
            <div className="mt-4 px-5 py-3.5 rounded-2xl bg-[#003893]/8 border-l-4 border-[#003893] font-sans text-[19px] font-semibold text-[#08254c]">
              “{clip.translationPt}”
            </div>
          )}

          <p className="mt-6 font-sans text-[21px] leading-[1.6] text-[#1c1f26]">
            <strong className="font-extrabold text-[#080d1a]">{clip.dateline} — </strong>
            {clip.lead}
          </p>
        </div>
      </div>
    </div>
  );
};
