import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Crosshair,
  PenTool,
  Highlighter,
  MoveUpRight,
  Square,
  Circle as CircleIcon,
  Undo2,
  Trash2,
  EyeOff,
  Eye,
  Play,
  Pause,
  RotateCcw,
  QrCode,
  LogOut,
  MousePointer,
  Focus,
  Edit3,
  Check,
  LayoutGrid,
  FileText,
} from 'lucide-react';
import {
  useBroadcast,
  useBroadcastOverlay,
  useBroadcastDiscovery,
} from './BroadcastContext';
import { AnnotationTool, DrawingStroke, TimerState } from './types';
import {
  PRESENTATION_SLIDES,
  getNextPosition,
  getPrevPosition,
  getLinearStepStats,
  getStepMeta,
} from './presentationMetadata';
import { SlideStagePreview } from './SlideStagePreview';
import { LiveAnnotationOverlay } from './LiveAnnotationOverlay';

const COLOR_SWATCHES = [
  { label: 'Vermelho Nepal', value: '#dc143c' },
  { label: 'Azul Marinho', value: '#003893' },
  { label: 'Ouro Solar', value: '#f59e0b' },
  { label: 'Verde Esmeralda', value: '#10b981' },
  { label: 'Branco Puro', value: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 5 },
  { label: 'Médio', value: 8 },
  { label: 'Forte', value: 13 },
];

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Isola o tick de 500ms do cronômetro e relógio em um subcomponente mínimo,
 * impedindo que os palcos 16:9 (Tela Atual e Próxima Etapa) re-renderizem a cada meio segundo!
 */
const PresenterTimerBadge: React.FC<{
  timer: TimerState;
  serverTimeOffsetMs: number;
  onTimerAction: (action: 'start' | 'pause' | 'reset') => void;
}> = React.memo(({ timer, serverTimeOffsetMs, onTimerAction }) => {
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const liveElapsedMs = useMemo(() => {
    if (!timer.running || !timer.startedAt) {
      return timer.elapsedMs;
    }
    const approxServerNow = nowTick + serverTimeOffsetMs;
    return timer.elapsedMs + Math.max(0, approxServerNow - timer.startedAt);
  }, [timer, serverTimeOffsetMs, nowTick]);

  const localClockLabel = useMemo(() => {
    return new Date(nowTick).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [nowTick]);

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1">
      <span className="font-mono text-sm sm:text-base font-extrabold text-white tabular-nums px-1">
        {formatDurationMs(liveElapsedMs)}
      </span>
      <button
        type="button"
        onClick={() => onTimerAction(timer.running ? 'pause' : 'start')}
        aria-label={timer.running ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
      >
        {timer.running ? (
          <Pause className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Play className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onTimerAction('reset')}
        aria-label="Zerar cronômetro"
        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <span className="hidden md:inline text-slate-700 px-1">|</span>
      <span className="hidden md:inline font-mono text-xs font-semibold text-slate-400 tabular-nums pr-1">
        {localClockLabel}
      </span>
    </div>
  );
});

export const PresenterConsole: React.FC = () => {
  const {
    roomId,
    roomState,
    openBroadcastModal,
    castToDevices,
    leaveBroadcast,
    goToPosition,
    stepForwardBroadcast,
    stepBackwardBroadcast,
    nextSlideBroadcast,
    prevSlideBroadcast,
    setBlackout,
    setSpotlight,
    emitPointer,
    upsertStroke,
    undoStroke,
    clearStrokes,
    updateSlideCustomState,
    updateNoteForStep,
    timerAction,
  } = useBroadcast();

  const overlay = useBroadcastOverlay();
  const { networkDevices, presence, getNoteForStep } = useBroadcastDiscovery();

  const [activeTool, setActiveTool] = useState<AnnotationTool>('laser');
  const [brushColor, setBrushColor] = useState<string>('#dc143c');
  const [brushWidth, setBrushWidth] = useState<number>(8);
  const [notesFontSize, setNotesFontSize] = useState<number>(16);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [mobilePanel, setMobilePanel] = useState<'notes' | 'tools' | 'slides'>('notes');

  // Ao desligar a ferramenta Lupa (Spotlight) ou Laser, limpa a máscara nos telões
  useEffect(() => {
    if (activeTool !== 'spotlight' && overlay.spotlight?.active) {
      setSpotlight(null);
    }
    if (activeTool !== 'laser' && overlay.pointer?.active) {
      emitPointer(false, 0, 0, brushColor);
    }
  }, [activeTool, brushColor, emitPointer, overlay.pointer?.active, overlay.spotlight?.active, setSpotlight]);

  const { slideIndex, subStep } = roomState;
  const currentMeta = useMemo(() => getStepMeta(slideIndex, subStep), [slideIndex, subStep]);
  const nextPos = useMemo(() => getNextPosition(slideIndex, subStep), [slideIndex, subStep]);
  const prevPos = useMemo(() => getPrevPosition(slideIndex, subStep), [slideIndex, subStep]);
  const nextMeta = useMemo(
    () => (nextPos ? getStepMeta(nextPos.slideIndex, nextPos.subStep) : null),
    [nextPos]
  );
  const linearStats = useMemo(() => getLinearStepStats(slideIndex, subStep), [slideIndex, subStep]);

  const currentStrokes = overlay.drawingsBySlide[slideIndex] || [];
  const screensCount = presence.filter((p) => p.role === 'screen').length;
  const castableCount = networkDevices.filter((d) => d.mode !== 'presenter').length;

  const handleUpsertStrokeForSlide = useCallback(
    (st: DrawingStroke) => {
      upsertStroke(slideIndex, st);
    },
    [slideIndex, upsertStroke]
  );

  // Atalhos de teclado no Console do Apresentador em Desktop (setas, Espaço, B = Cortina, L = Laser)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        isEditingNotes
      ) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        stepForwardBroadcast();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        stepBackwardBroadcast();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setBlackout(!overlay.blackout);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setActiveTool((prev) => (prev === 'laser' ? 'none' : 'laser'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditingNotes, stepForwardBroadcast, stepBackwardBroadcast, setBlackout, overlay.blackout]);

  const currentNoteText = getNoteForStep(slideIndex, subStep);

  const toolButtons: Array<{ id: AnnotationTool; label: string; icon: React.ReactNode }> = [
    { id: 'none', label: 'Livre', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'laser', label: 'Laser', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'spotlight', label: 'Lupa', icon: <Focus className="w-4 h-4" /> },
    { id: 'pen', label: 'Caneta', icon: <PenTool className="w-4 h-4" /> },
    { id: 'highlighter', label: 'Marca', icon: <Highlighter className="w-4 h-4" /> },
    { id: 'arrow', label: 'Seta', icon: <MoveUpRight className="w-4 h-4" /> },
    { id: 'circle', label: 'Círculo', icon: <CircleIcon className="w-4 h-4" /> },
    { id: 'rect', label: 'Caixa', icon: <Square className="w-4 h-4" /> },
  ];

  return (
    <div className="w-screen h-screen w-[100dvw] h-[100dvh] bg-[#0b101b] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* =====================================================================
          1. BARRA SUPERIOR COMPACTA (SALA · TELÕES · CRONÔMETRO · CORTINA · SAIR)
         ===================================================================== */}
      <header className="h-14 px-3 sm:px-5 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        {/* Esquerda: Sala e Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={openBroadcastModal}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            title="Exibir QR Code e adicionar telas"
          >
            <QrCode className="w-4 h-4 text-[#dc143c]" />
            <span className="font-mono text-xs font-black tracking-wider text-white tabular-nums">
              SALA {roomId}
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span
              className={`font-sans text-xs font-semibold whitespace-nowrap tabular-nums ${
                screensCount > 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {screensCount} {screensCount === 1 ? 'telão' : 'telões'}
            </span>
          </button>

          {screensCount === 0 && castableCount > 0 && (
            <button
              type="button"
              onClick={() => castToDevices('ALL', { slideIndex, subStep })}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#dc143c] hover:bg-[#b81032] text-white font-sans text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0 animate-pulse"
              title="Transmitir imediatamente para as telas abertas detectadas na mesma rede Wi-Fi"
            >
              <span>Conectar {castableCount} Tela(s)</span>
            </button>
          )}

          <span className="hidden xl:inline font-display text-xs font-extrabold uppercase tracking-widest text-slate-400 truncate">
            Console do Apresentador · Missão Nepal
          </span>
        </div>

        {/* Centro: Cronômetro Sincronizado + Relógio Isolado */}
        <PresenterTimerBadge
          timer={overlay.timer}
          serverTimeOffsetMs={overlay.serverTimeOffsetMs}
          onTimerAction={timerAction}
        />

        {/* Direita: Cortina (Blackout) & Sair */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setBlackout(!overlay.blackout)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              overlay.blackout
                ? 'bg-[#dc143c] text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Escurecer/Exibir telões receptores (Atalho: B)"
          >
            {overlay.blackout ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {overlay.blackout ? 'Retomar Telão' : 'Cortina'}
            </span>
          </button>

          <button
            type="button"
            onClick={leaveBroadcast}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-700/60 text-slate-300 hover:text-rose-200 font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="Sair da tela do apresentador"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. ÁREA CENTRAL DE TRABALHO (RESPONSIVA: MOBILE TOUCH + DESKTOP 12 COLS)
         ===================================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 overflow-y-auto lg:overflow-hidden">
        {/* -------------------------------------------------------------------
            COLUNA ESQUERDA / TOPO (7 COLUNAS NO DESKTOP):
            TELA ATUAL AO VIVO + BARRA DE POINTER/DESENHO + CONTROLES INTERATIVOS
           ------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
          {/* Cabeçalho da Tela Atual */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Ao Vivo nos Telões · Slide {currentMeta.slide.numberLabel}/
                {String(PRESENTATION_SLIDES.length).padStart(2, '0')} · Passo{' '}
                {linearStats.currentLinearStep}/{linearStats.totalLinearSteps}
              </div>
              <h1 className="font-display text-sm sm:text-base font-extrabold text-white truncate">
                {currentMeta.step.title}
              </h1>
            </div>

            <span className="font-sans text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
              {activeTool === 'laser'
                ? 'Toque/arraste para apontar Laser'
                : activeTool === 'spotlight'
                ? 'Arraste para mover a Lupa'
                : activeTool !== 'none'
                ? 'Desenhe diretamente sobre o slide'
                : 'Modo visualização'}
            </span>
          </div>

          {/* Palco 16:9 da Tela Atual com Superfície de Toque/Mouse */}
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-700/90 shadow-2xl bg-[#f4f2eb]">
            <SlideStagePreview
              slideIndex={slideIndex}
              subStep={subStep}
              instanceId="presenter-live-stage"
              isPreview={true}
              overlay={
                <LiveAnnotationOverlay
                  strokes={currentStrokes}
                  pointer={overlay.pointer}
                  spotlight={overlay.spotlight}
                  blackout={overlay.blackout}
                  variant="presenter"
                  interactiveTool={activeTool}
                  activeColor={brushColor}
                  activeWidth={brushWidth}
                  onPointerSignal={emitPointer}
                  onSpotlightSignal={setSpotlight}
                  onUpsertStroke={handleUpsertStrokeForSlide}
                />
              }
            />
          </div>

          {/* Barra de Ferramentas de Pointer & Desenho */}
          <div
            className={`${
              mobilePanel === 'tools' ? 'flex' : 'hidden lg:flex'
            } flex-col gap-2.5 rounded-2xl bg-[#111827] border border-slate-800 p-3`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {toolButtons.map((btn) => {
                  const isSelected = activeTool === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setActiveTool(btn.id)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#dc143c] text-white shadow-sm'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentStrokes.length === 0}
                  onClick={() => undoStroke(slideIndex)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed text-slate-200 font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Desfazer último traço"
                >
                  <Undo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Desfazer</span>
                </button>
                <button
                  type="button"
                  disabled={currentStrokes.length === 0}
                  onClick={() => clearStrokes(slideIndex)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/70 disabled:opacity-35 disabled:cursor-not-allowed text-slate-200 font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Limpar todos os desenhos deste slide"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              </div>
            </div>

            {/* Cores, Espessura & Ações Contextuais do Slide */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="font-sans text-[11px] font-semibold text-slate-400">Cor:</span>
                {COLOR_SWATCHES.map((sw) => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => setBrushColor(sw.value)}
                    aria-label={sw.label}
                    style={{ backgroundColor: sw.value }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      brushColor === sw.value
                        ? 'border-white scale-115 ring-2 ring-[#dc143c]'
                        : 'border-slate-600 hover:scale-105'
                    }`}
                  />
                ))}

                <span className="text-slate-700 mx-1">|</span>
                {STROKE_WIDTHS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setBrushWidth(w.value)}
                    className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold transition-colors cursor-pointer ${
                      brushWidth === w.value
                        ? 'bg-slate-200 text-slate-900'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Controles Remotos Específicos dos Slides 3, 4 e 8 */}
              {slideIndex === 2 && (
                <div className="flex items-center gap-1">
                  <span className="font-sans text-[11px] text-slate-400 mr-1">Gráfico Slide 3:</span>
                  {(
                    [
                      { id: 'perCapita', label: 'Per Capita' },
                      { id: 'gdp', label: 'PIB Total' },
                      { id: 'hdi', label: 'IDH' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateSlideCustomState({ economyMetric: m.id })}
                      className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold cursor-pointer ${
                        roomState.slideCustomState.economyMetric === m.id
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {slideIndex === 3 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-sans text-[11px] text-slate-400 mr-1">Destacar Casta:</span>
                  {[1, 2, 3, 4].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        updateSlideCustomState({
                          casteTier: roomState.slideCustomState.casteTier === t ? null : t,
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold cursor-pointer ${
                        roomState.slideCustomState.casteTier === t
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Nível {t}
                    </button>
                  ))}
                </div>
              )}

              {slideIndex === 7 && subStep >= 3 && (
                <div className="flex items-center gap-1">
                  <span className="font-sans text-[11px] text-slate-400 mr-1">Lente Gráfico:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSlideCustomState({
                        timelineLens:
                          subStep === 7
                            ? roomState.slideCustomState.timelineLens === 'era'
                              ? 'auto'
                              : 'era'
                            : roomState.slideCustomState.timelineLens === 'panorama'
                            ? 'auto'
                            : 'panorama',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#003893] hover:bg-[#0046b5] text-white font-sans text-[11px] font-bold cursor-pointer"
                  >
                    {subStep === 7
                      ? roomState.slideCustomState.timelineLens === 'era'
                        ? 'Panorama Completo'
                        : 'Focar 1981–2026'
                      : roomState.slideCustomState.timelineLens === 'panorama'
                      ? 'Zoom da Época'
                      : 'Panorama Geral'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seletor de Abas Mobile */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#111827] border border-slate-800 lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePanel('notes')}
              className={`min-h-[42px] rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePanel === 'notes' ? 'bg-[#003893] text-white' : 'text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notas &amp; Próx.</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel('tools')}
              className={`min-h-[42px] rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePanel === 'tools' ? 'bg-[#dc143c] text-white' : 'text-slate-400'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Laser &amp; Caneta</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel('slides')}
              className={`min-h-[42px] rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePanel === 'slides' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Slides ({PRESENTATION_SLIDES.length})</span>
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            COLUNA DIREITA (5 COLUNAS NO DESKTOP):
            PRÓXIMA ETAPA + ANOTAÇÕES DO APRESENTADOR + NAVEGADOR DE SLIDES
           ------------------------------------------------------------------- */}
        <div
          className={`${
            mobilePanel === 'notes' || mobilePanel === 'slides' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-5 flex-col gap-3 min-h-0`}
        >
          {/* 1. PRÓXIMA ETAPA DA APRESENTAÇÃO */}
          <div
            className={`${
              mobilePanel === 'slides' ? 'hidden lg:block' : 'block'
            } rounded-2xl bg-[#111827] border border-slate-800 p-3 shrink-0`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <span className="font-sans text-[10.5px] font-bold uppercase tracking-wider text-sky-400 block">
                  Próxima Etapa
                </span>
                <div className="font-display text-xs sm:text-sm font-bold text-slate-100 truncate">
                  {nextMeta
                    ? `Slide ${nextMeta.slide.numberLabel} · ${nextMeta.step.title}`
                    : 'Fim da Apresentação (Último Marco)'}
                </div>
              </div>
              {nextPos && (
                <button
                  type="button"
                  onClick={stepForwardBroadcast}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-sans font-bold text-sky-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ir agora →
                </button>
              )}
            </div>

            {nextPos ? (
              <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-full mx-auto rounded-xl overflow-hidden border border-slate-700/80 opacity-95">
                <SlideStagePreview
                  slideIndex={nextPos.slideIndex}
                  subStep={nextPos.subStep}
                  instanceId="presenter-next-stage"
                  isPreview={true}
                />
              </div>
            ) : (
              <div className="w-full py-8 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center px-4">
                <span className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-300">
                  Última Etapa Alcançada ({linearStats.totalLinearSteps} /{' '}
                  {linearStats.totalLinearSteps})
                </span>
                <span className="font-sans text-xs text-slate-500 mt-1">
                  Você está no encerramento da apresentação Missão Nepal
                </span>
              </div>
            )}
          </div>

          {/* 2. ANOTAÇÕES DO APRESENTADOR */}
          <div
            className={`${
              mobilePanel === 'slides' ? 'hidden lg:flex' : 'flex'
            } flex-1 min-h-[200px] rounded-2xl bg-[#111827] border border-slate-800 p-3.5 flex-col min-h-0`}
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800 shrink-0">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-400">
                Anotações do Apresentador
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNotesFontSize((s) => Math.max(13, s - 2))}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-xs font-bold text-slate-300 cursor-pointer"
                  title="Diminuir fonte das anotações"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFontSize((s) => Math.min(26, s + 2))}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-xs font-bold text-slate-300 cursor-pointer"
                  title="Aumentar fonte das anotações"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNotes((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg font-sans text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    isEditingNotes
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isEditingNotes ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditingNotes ? (
              <textarea
                value={currentNoteText}
                onChange={(e) => updateNoteForStep(slideIndex, subStep, e.target.value)}
                style={{ fontSize: `${notesFontSize}px` }}
                placeholder="Escreva seus tópicos e lembretes para esta etapa..."
                className="flex-1 w-full rounded-xl bg-slate-900 border border-slate-700 p-3 font-sans text-slate-100 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#003893] select-text"
              />
            ) : (
              <div
                style={{ fontSize: `${notesFontSize}px` }}
                className="flex-1 overflow-y-auto pr-1 font-sans text-slate-200 leading-relaxed whitespace-pre-line select-text"
              >
                {currentNoteText}
              </div>
            )}
          </div>

          {/* 3. LISTA RÁPIDA DE SLIDES E MARCOS (Mobile) */}
          {mobilePanel === 'slides' && (
            <div className="lg:hidden rounded-2xl bg-[#111827] border border-slate-800 p-3 space-y-2">
              <div className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ir Diretamente para Slide ou Etapa:
              </div>
              {PRESENTATION_SLIDES.map((s) => {
                const isCurrentSlide = s.slideIndex === slideIndex;
                return (
                  <div
                    key={s.slideIndex}
                    className={`rounded-xl border p-2.5 ${
                      isCurrentSlide
                        ? 'bg-[#003893]/20 border-[#003893]'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => goToPosition(s.slideIndex, 0)}
                      className="w-full text-left flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="font-display text-xs font-extrabold text-white">
                        {s.numberLabel}. {s.shortTitle}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {s.steps.length} {s.steps.length === 1 ? 'etapa' : 'etapas'}
                      </span>
                    </button>

                    {s.steps.length > 1 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {s.steps.map((st) => {
                          const isStepActive = isCurrentSlide && st.subStep === subStep;
                          return (
                            <button
                              key={st.subStep}
                              type="button"
                              onClick={() => goToPosition(s.slideIndex, st.subStep)}
                              className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold cursor-pointer ${
                                isStepActive
                                  ? 'bg-[#dc143c] text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {st.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. BARRA INFERIOR DE NAVEGAÇÃO ERGONÔMICA + SELETOR DE SLIDES (DESKTOP)
         ===================================================================== */}
      <footer className="bg-[#111827] border-t border-slate-800 px-3 sm:px-5 py-2.5 shrink-0 space-y-2">
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1">
          {PRESENTATION_SLIDES.map((s) => {
            const isCurrentSlide = s.slideIndex === slideIndex;
            return (
              <div
                key={s.slideIndex}
                className={`flex items-center gap-1 rounded-xl border px-2 py-1 shrink-0 transition-colors ${
                  isCurrentSlide
                    ? 'bg-[#003893]/25 border-[#003893]'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => goToPosition(s.slideIndex, 0)}
                  className="px-1.5 py-0.5 font-sans text-xs font-bold text-slate-100 hover:text-white whitespace-nowrap cursor-pointer"
                >
                  <span className="font-mono text-sky-400 mr-1">{s.numberLabel}.</span>
                  {s.shortTitle}
                </button>

                {s.steps.length > 1 && isCurrentSlide && (
                  <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                    {s.steps.map((st) => (
                      <button
                        key={st.subStep}
                        type="button"
                        onClick={() => goToPosition(s.slideIndex, st.subStep)}
                        className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                          st.subStep === subStep
                            ? 'bg-[#dc143c] text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {st.shortLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controles Principais de Avanço e Retrocesso */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
          <button
            type="button"
            disabled={slideIndex === 0}
            onClick={prevSlideBroadcast}
            title="Voltar Slide Inteiro"
            className="col-span-2 sm:col-span-2 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed text-slate-200 font-sans text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
            <span className="hidden md:inline">Slide Ant.</span>
          </button>

          <button
            type="button"
            disabled={!prevPos}
            onClick={stepBackwardBroadcast}
            className="col-span-4 sm:col-span-4 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed text-white font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            disabled={!nextPos}
            onClick={stepForwardBroadcast}
            className="col-span-4 sm:col-span-4 min-h-[48px] rounded-xl bg-[#dc143c] hover:bg-[#b81032] disabled:opacity-35 disabled:cursor-not-allowed text-white font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            <span>Próxima</span>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            disabled={slideIndex >= PRESENTATION_SLIDES.length - 1}
            onClick={nextSlideBroadcast}
            title="Pular para o Próximo Slide"
            className="col-span-2 sm:col-span-2 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed text-slate-200 font-sans text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span className="hidden md:inline">Próx. Slide</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
