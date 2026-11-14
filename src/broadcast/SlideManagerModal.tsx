import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  RotateCcw,
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  Layers,
  FileText,
  Sparkles,
  Check,
  GripVertical,
  Upload,
  Play,
  Move,
  Sliders,
} from 'lucide-react';
import {
  CustomCanvasBlock,
  CustomIconName,
  CustomSlideAccent,
  CustomSlideBackground,
  CustomSlideCardItem,
  CustomSlideData,
  CustomSlideTemplate,
  DEFAULT_BUILTIN_SLIDES,
  NEPAL_MEDIA_GALLERY,
  SlideMeta,
  buildStepsForCustomSlide,
  convertBuiltinToCustomSlide,
  createCustomSlideFromTemplate,
  resetManagedDeckToDefaults,
  useManagedDeck,
} from './presentationMetadata';
import { useBroadcast, useBroadcastDiscovery } from './BroadcastContext';
import { SlideStagePreview } from './SlideStagePreview';
import { renderCustomIcon } from './CustomSlideRenderer';

const TEMPLATE_OPTIONS: Array<{
  id: CustomSlideTemplate;
  name: string;
  desc: string;
  badge: string;
}> = [
  {
    id: 'hero-split',
    name: 'Editorial Dividido',
    desc: 'Texto + cartões à esquerda e fotografia com legenda à direita',
    badge: 'Foto + Cartões',
  },
  {
    id: 'cards-grid',
    name: 'Mosaico 4 Cartões',
    desc: 'Grade 2×2 em Liquid Glass com ícones, métricas e síntese',
    badge: '4 Pilares',
  },
  {
    id: 'big-statement',
    name: 'Grande Declaração',
    desc: 'Métrica gigante centralizada, citação de impacto e 3 apoios',
    badge: 'Impacto Central',
  },
  {
    id: 'image-showcase',
    name: 'Vitrine Fotográfica',
    desc: 'Fotografia em tela cheia com painéis translúcidos escuros',
    badge: 'Cinema 16:9',
  },
  {
    id: 'comparison',
    name: 'Comparativo Duplo',
    desc: 'Dois grandes painéis lado a lado (Perspectiva A vs B)',
    badge: 'Lado a Lado',
  },
  {
    id: 'free-canvas',
    name: 'Quadro Livre 16:9',
    desc: 'Arraste, posicione e redimensione blocos livremente no palco',
    badge: 'Canvas Livre',
  },
];

const ICON_OPTIONS: Array<{ id: CustomIconName; label: string }> = [
  { id: 'compass', label: 'Bússola' },
  { id: 'mountain', label: 'Montanha' },
  { id: 'flame', label: 'Chama' },
  { id: 'users', label: 'Pessoas' },
  { id: 'globe', label: 'Globo' },
  { id: 'book', label: 'Livro' },
  { id: 'heart', label: 'Coração' },
  { id: 'shield', label: 'Escudo' },
  { id: 'sparkles', label: 'Brilho' },
  { id: 'scale', label: 'Balança' },
  { id: 'award', label: 'Destaque' },
  { id: 'layers', label: 'Camadas' },
];

async function compressUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido'));
      img.onload = () => {
        const maxW = 1280;
        const maxH = 720;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const SlideManagerModal: React.FC<{
  onNavigateToActiveSlide?: (activeSlideIndex: number) => void;
}> = ({ onNavigateToActiveSlide }) => {
  const {
    closeSlideManager,
    syncDeckStructure,
    goToPosition,
    mode,
    updateNoteForStep,
  } = useBroadcast();
  const { isSlideManagerOpen, getNoteForStep } = useBroadcastDiscovery();
  const { allSlides, activeSlides } = useManagedDeck();

  const [selectedSlideId, setSelectedSlideId] = useState<string>(() => allSlides[0]?.id || '');
  const [previewSubStep, setPreviewSubStep] = useState<number>(0);
  const [editorTab, setEditorTab] = useState<'content' | 'cards' | 'style' | 'notes'>('content');
  const [showNewSlideMenu, setShowNewSlideMenu] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedCanvasBlockId, setSelectedCanvasBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Garante que sempre exista um slide selecionado válido
  useEffect(() => {
    if (!allSlides.some((s) => s.id === selectedSlideId)) {
      setSelectedSlideId(allSlides[0]?.id || '');
      setPreviewSubStep(0);
    }
  }, [allSlides, selectedSlideId]);

  const selectedSlideIndexInAll = useMemo(
    () => allSlides.findIndex((s) => s.id === selectedSlideId),
    [allSlides, selectedSlideId]
  );

  const selectedSlide = useMemo(
    () => allSlides[selectedSlideIndexInAll] ?? allSlides[0],
    [allSlides, selectedSlideIndexInAll]
  );

  useEffect(() => {
    if (!selectedSlide) return;
    if (previewSubStep >= selectedSlide.steps.length) {
      setPreviewSubStep(0);
    }
  }, [selectedSlide, previewSubStep]);

  // Lista de slides originais (0..7) que foram excluídos pelo usuário e podem ser reinseridos
  const missingBuiltinSlides = useMemo(() => {
    const presentBuiltins = new Set(
      allSlides.filter((s) => s.kind === 'builtin').map((s) => s.builtinIndex)
    );
    return DEFAULT_BUILTIN_SLIDES.filter((b) => !presentBuiltins.has(b.builtinIndex));
  }, [allSlides]);

  const selectedCanvasBlock = useMemo(() => {
    if (!selectedSlide || selectedSlide.kind !== 'custom' || !selectedSlide.customData) {
      return null;
    }
    return (
      (selectedSlide.customData.canvasBlocks || []).find(
        (b) => b.id === selectedCanvasBlockId
      ) || null
    );
  }, [selectedSlide, selectedCanvasBlockId]);

  if (!isSlideManagerOpen || !selectedSlide) return null;

  const visibleCount = activeSlides.length;

  const commitSlidesUpdate = (nextAllSlides: SlideMeta[]) => {
    syncDeckStructure(nextAllSlides);
  };

  const updateSelectedSlide = (updater: (slide: SlideMeta) => SlideMeta) => {
    const nextList = allSlides.map((s) => (s.id === selectedSlide.id ? updater(s) : s));
    commitSlidesUpdate(nextList);
  };

  const updateSelectedCustomData = (updater: (data: CustomSlideData) => CustomSlideData) => {
    if (selectedSlide.kind !== 'custom' || !selectedSlide.customData) return;
    updateSelectedSlide((slide) => {
      const nextData = updater(slide.customData!);
      const nextFullTitle = nextData.title.trim() || slide.fullTitle;
      return {
        ...slide,
        fullTitle: nextFullTitle,
        customData: nextData,
        steps: buildStepsForCustomSlide(
          nextFullTitle,
          nextData,
          slide.steps[0]?.defaultNotes
        ),
      };
    });
  };

  // Alternar visibilidade (Exibir / Ocultar slide na apresentação)
  const handleToggleSlideVisible = (slideId: string) => {
    const target = allSlides.find((s) => s.id === slideId);
    if (!target) return;
    // Impede ocultar o único slide visível restante
    if (target.visible && visibleCount <= 1) return;

    const nextList = allSlides.map((s) =>
      s.id === slideId ? { ...s, visible: !s.visible } : s
    );
    commitSlidesUpdate(nextList);
  };

  // Reordenar via botões Subir / Descer ou Drag-and-Drop
  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= allSlides.length ||
      toIndex >= allSlides.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const copy = [...allSlides];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    commitSlidesUpdate(copy);
  };

  // Inserir novo slide a partir de um dos 6 templates logo após o slide selecionado
  const handleInsertNewSlide = (template: CustomSlideTemplate) => {
    const newSlide = createCustomSlideFromTemplate(template);
    const insertAt =
      selectedSlideIndexInAll >= 0 ? selectedSlideIndexInAll + 1 : allSlides.length;
    const copy = [...allSlides];
    copy.splice(insertAt, 0, newSlide);
    commitSlidesUpdate(copy);
    setSelectedSlideId(newSlide.id);
    setPreviewSubStep(0);
    setShowNewSlideMenu(false);
    setEditorTab(template === 'free-canvas' ? 'cards' : 'content');
  };

  // Duplicar slide atual (ou converter slide original em cópia 100% customizável)
  const handleDuplicateOrConvertSlide = (slide: SlideMeta) => {
    const idx = allSlides.findIndex((s) => s.id === slide.id);
    let created: SlideMeta;
    if (slide.kind === 'builtin') {
      created = convertBuiltinToCustomSlide(slide);
    } else {
      const clonedData: CustomSlideData = JSON.parse(JSON.stringify(slide.customData));
      const newId = `custom-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      created = {
        ...JSON.parse(JSON.stringify(slide)),
        id: newId,
        visible: true,
        shortTitle: `${slide.shortTitle} (Cópia)`.slice(0, 28),
        customData: clonedData,
      };
    }
    const copy = [...allSlides];
    copy.splice(idx + 1, 0, created);
    commitSlidesUpdate(copy);
    setSelectedSlideId(created.id);
    setPreviewSubStep(0);
  };

  // Excluir slide (mantendo ao menos 1 slide visível na apresentação)
  const handleDeleteSlide = (slideId: string) => {
    if (allSlides.length <= 1) return;
    const target = allSlides.find((s) => s.id === slideId);
    if (!target) return;
    const remainingVisible = allSlides.filter((s) => s.id !== slideId && s.visible);
    const nextList = allSlides
      .filter((s) => s.id !== slideId)
      .map((s, idx) =>
        remainingVisible.length === 0 && idx === 0 ? { ...s, visible: true } : s
      );
    commitSlidesUpdate(nextList);
  };

  // Reinserir slide original que havia sido excluído
  const handleRestoreSingleBuiltin = (builtinSlide: SlideMeta) => {
    const restored: SlideMeta = JSON.parse(JSON.stringify(builtinSlide));
    restored.visible = true;
    const copy = [...allSlides, restored];
    commitSlidesUpdate(copy);
    setSelectedSlideId(restored.id);
  };

  // Restaurar toda a apresentação para os 8 slides originais padrão
  const handleResetAllToDefaults = () => {
    resetManagedDeckToDefaults();
    const fresh = JSON.parse(JSON.stringify(DEFAULT_BUILTIN_SLIDES)) as SlideMeta[];
    commitSlidesUpdate(fresh);
    setSelectedSlideId(fresh[0].id);
    setPreviewSubStep(0);
    setConfirmReset(false);
  };

  // Upload de foto do dispositivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressUploadedImage(file);
      if (selectedSlide.kind === 'custom' && selectedSlide.customData) {
        if (
          selectedSlide.customData.template === 'free-canvas' &&
          selectedCanvasBlockId
        ) {
          updateSelectedCustomData((d) => ({
            ...d,
            canvasBlocks: (d.canvasBlocks || []).map((b) =>
              b.id === selectedCanvasBlockId
                ? { ...b, type: 'image', imageUrl: dataUrl }
                : b
            ),
          }));
        } else {
          updateSelectedCustomData((d) => ({
            ...d,
            imageUrl: dataUrl,
          }));
        }
      }
    } catch {
      // Ignora erro de leitura
    } finally {
      e.target.value = '';
    }
  };

  // Adicionar bloco no modo Quadro Livre 16:9 (Free Canvas)
  const handleAddCanvasBlock = (type: CustomCanvasBlock['type']) => {
    if (selectedSlide.kind !== 'custom' || !selectedSlide.customData) return;
    const id = `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const count = (selectedSlide.customData.canvasBlocks || []).length;
    const offset = (count % 5) * 30;

    let newBlock: CustomCanvasBlock;
    if (type === 'badge') {
      newBlock = {
        id,
        type: 'badge',
        x: 100 + offset,
        y: 80 + offset,
        width: 440,
        height: 60,
        title: 'DESTAQUE MISSÃO NEPAL',
        body: '',
        statValue: '',
        imageUrl: '',
        accent: 'crimson',
        align: 'left',
        fontSize: 'md',
      };
    } else if (type === 'heading') {
      newBlock = {
        id,
        type: 'heading',
        x: 100 + offset,
        y: 160 + offset,
        width: 1100,
        height: 160,
        title: 'NOVO TÍTULO DE IMPACTO',
        body: 'Subtítulo complementar da seção',
        statValue: '',
        imageUrl: '',
        accent: 'navy',
        align: 'left',
        fontSize: 'lg',
      };
    } else if (type === 'stat') {
      newBlock = {
        id,
        type: 'stat',
        x: 120 + offset,
        y: 360 + offset,
        width: 460,
        height: 250,
        title: 'INDICADOR CHAVE',
        body: 'Descrição sintética do indicador apresentado no palco',
        statValue: '1,5M+',
        imageUrl: '',
        accent: 'crimson',
        align: 'left',
        fontSize: 'xl',
      };
    } else if (type === 'image') {
      newBlock = {
        id,
        type: 'image',
        x: 1080,
        y: 220,
        width: 720,
        height: 540,
        title: 'Vale de Katmandu',
        body: 'Registro fotográfico Missão Nepal',
        statValue: '',
        imageUrl: '/assets/step1-kathmandu.jpg',
        accent: 'navy',
        align: 'left',
        fontSize: 'md',
      };
    } else if (type === 'divider') {
      newBlock = {
        id,
        type: 'divider',
        x: 100,
        y: 520,
        width: 800,
        height: 30,
        title: '',
        body: '',
        statValue: '',
        imageUrl: '',
        accent: 'crimson',
        align: 'left',
        fontSize: 'md',
      };
    } else if (type === 'text') {
      newBlock = {
        id,
        type: 'text',
        x: 100 + offset,
        y: 340 + offset,
        width: 820,
        height: 220,
        title: 'NOTA CONTEXTUAL',
        body: 'Digite aqui o parágrafo explicativo com efeito Liquid Glass.',
        statValue: '',
        imageUrl: '',
        accent: 'navy',
        align: 'left',
        fontSize: 'md',
      };
    } else {
      newBlock = {
        id,
        type: 'card',
        x: 120 + offset,
        y: 620,
        width: 560,
        height: 280,
        title: 'CARTÃO DE CONTEÚDO',
        body: 'Explique os pontos principais desta etapa com clareza visual.',
        statValue: 'Destaque',
        imageUrl: '',
        accent: 'navy',
        align: 'left',
        fontSize: 'md',
      };
    }

    updateSelectedCustomData((d) => ({
      ...d,
      template: 'free-canvas',
      canvasBlocks: [...(d.canvasBlocks || []), newBlock],
    }));
    setSelectedCanvasBlockId(id);
  };

  const handlePresentThisSlideNow = () => {
    if (!selectedSlide.visible) {
      handleToggleSlideVisible(selectedSlide.id);
    }
    const activeIdx = activeSlides.findIndex((s) => s.id === selectedSlide.id);
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    if (mode !== 'standalone') {
      goToPosition(targetIdx, previewSubStep);
    } else if (onNavigateToActiveSlide) {
      onNavigateToActiveSlide(targetIdx);
    }
    closeSlideManager();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none"
    >
      <div className="w-full max-w-[1540px] h-[94dvh] bg-[#0b101b] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* ===================================================================
            CABEÇALHO DO GERENCIADOR E EDITOR DE SLIDES
           =================================================================== */}
        <header className="px-4 sm:px-6 py-3.5 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003893] to-[#dc143c] flex items-center justify-center text-white shadow-lg shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Gerenciar Slides &amp; Editor Visual 16:9
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 font-mono text-[11px] font-bold text-emerald-300">
                  {visibleCount} de {allSlides.length} exibidos
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400">
                Selecione quais slides serão exibidos, reordene por arraste, insira novos slides ou edite textos, fotos e quadros livres
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Inserir Novo Slide */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNewSlideMenu((v) => !v)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#dc143c] hover:bg-[#b81032] text-white font-sans text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Inserir Novo Slide</span>
              </button>

              {showNewSlideMenu && (
                <div className="absolute right-0 mt-2 w-[340px] rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-2.5 z-50 space-y-1.5">
                  <div className="px-2 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Escolha o Modelo do Novo Slide:
                  </div>
                  {TEMPLATE_OPTIONS.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleInsertNewSlide(tpl.id)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/90 border border-transparent hover:border-slate-700 transition-colors flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="font-display text-xs font-extrabold text-white">
                          {tpl.name}
                        </div>
                        <div className="font-sans text-[11px] text-slate-400 leading-snug mt-0.5">
                          {tpl.desc}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#003893]/30 border border-[#003893]/60 font-mono text-[10px] font-bold text-sky-300 shrink-0">
                        {tpl.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Apresentar este Slide Agora */}
            <button
              type="button"
              onClick={handlePresentThisSlideNow}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#003893] hover:bg-[#0046b5] text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Exibir este slide imediatamente no palco principal"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ir para este Slide</span>
            </button>

            {/* Botão Restaurar Padrão com confirmação in-UI */}
            {confirmReset ? (
              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-700 rounded-xl px-2.5 py-1">
                <span className="font-sans text-[11px] font-bold text-rose-200 px-1">
                  Restaurar os 8 slides originais?
                </span>
                <button
                  type="button"
                  onClick={handleResetAllToDefaults}
                  className="px-2.5 py-1 rounded-lg bg-[#dc143c] text-white font-sans text-[11px] font-extrabold cursor-pointer"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-sans text-[11px] font-bold cursor-pointer"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-sans text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Restaurar todos os slides originais da apresentação"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Restaurar Padrão</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeSlideManager}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Concluir</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            CORPO PRINCIPAL (COLUNA ESQUERDA: LISTA E ORDEM | DIREITA: EDITOR 16:9)
           =================================================================== */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* -----------------------------------------------------------------
              COLUNA ESQUERDA (4 COLUNAS): LISTA DE SLIDES, VISIBILIDADE E ORDEM
             ----------------------------------------------------------------- */}
          <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0d1322] flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0">
              <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Ordem &amp; Exibição ({allSlides.length} slides)
              </span>
              <div className="flex items-center gap-1.5">
                {allSlides.some((s) => !s.visible) && (
                  <button
                    type="button"
                    onClick={() =>
                      commitSlidesUpdate(allSlides.map((s) => ({ ...s, visible: true })))
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-sans text-[11px] font-bold text-sky-300 cursor-pointer"
                  >
                    Exibir Todos
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Slides com Drag-and-Drop */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {allSlides.map((slide, idx) => {
                const isSelected = slide.id === selectedSlide.id;
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <div
                    key={slide.id}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== idx) setDragOverIndex(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === idx) setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        handleMoveSlide(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      setPreviewSubStep(0);
                    }}
                    className={`rounded-2xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#003893]/25 border-[#003893] shadow-lg'
                        : slide.visible
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 border-slate-900 opacity-60 hover:opacity-85'
                    } ${isDragging ? 'opacity-40 scale-98' : ''} ${
                      isDragOver ? 'ring-2 ring-[#dc143c]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="mt-0.5 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0"
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-black uppercase ${
                                slide.visible
                                  ? 'bg-[#003893] text-white'
                                  : 'bg-slate-800 text-slate-400 line-through'
                              }`}
                            >
                              {slide.visible ? `SLIDE ${slide.numberLabel}` : 'OCULTO'}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                                slide.kind === 'custom'
                                  ? 'bg-[#dc143c]/20 text-rose-300 border border-[#dc143c]/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {slide.kind === 'custom' ? 'Personalizado' : 'Original'}
                            </span>

                            {slide.steps.length > 1 && (
                              <span className="font-mono text-[10px] text-slate-400">
                                · {slide.steps.length} etapas
                              </span>
                            )}
                          </div>

                          <div className="font-display text-xs sm:text-sm font-extrabold text-white truncate mt-1">
                            {slide.shortTitle}
                          </div>
                          <div className="font-sans text-[11px] text-slate-400 truncate">
                            {slide.fullTitle}
                          </div>
                        </div>
                      </div>

                      {/* Botão Exibir / Ocultar Slide */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSlideVisible(slide.id);
                        }}
                        disabled={slide.visible && visibleCount <= 1}
                        className={`px-2.5 py-1.5 rounded-xl font-sans text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                          slide.visible
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={
                          slide.visible
                            ? 'Slide visível na apresentação (clique para ocultar)'
                            : 'Slide oculto (clique para incluir na apresentação)'
                        }
                      >
                        {slide.visible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Exibir</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Oculto</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Barra de Ações Rápidas do Item (Subir, Descer, Duplicar, Excluir) */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1"
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, idx - 1)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Mover slide para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === allSlides.length - 1}
                          onClick={() => handleMoveSlide(idx, idx + 1)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Mover slide para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDuplicateOrConvertSlide(slide)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title={
                            slide.kind === 'builtin'
                              ? 'Criar cópia 100% editável deste slide'
                              : 'Duplicar este slide'
                          }
                        >
                          <Copy className="w-3 h-3" />
                          <span>
                            {slide.kind === 'builtin' ? 'Duplicar Editável' : 'Duplicar'}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={allSlides.length <= 1}
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 disabled:opacity-30 text-slate-300 hover:text-rose-200 cursor-pointer"
                          title="Excluir este slide da lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bandeja para Reinserir Slides Originais que foram excluídos */}
              {missingBuiltinSlides.length > 0 && (
                <div className="mt-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-2">
                  <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-amber-400">
                    Slides Originais Removidos ({missingBuiltinSlides.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingBuiltinSlides.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleRestoreSingleBuiltin(b)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-sans font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reinserir: {b.shortTitle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* -----------------------------------------------------------------
              COLUNA DIREITA (8 COLUNAS): PRÉVIA 16:9 AO VIVO + EDITOR DE SLIDES
             ----------------------------------------------------------------- */}
          <section className="lg:col-span-8 flex flex-col min-h-0 overflow-y-auto bg-[#0b101b]">
            {/* 1. PALCO DE PRÉ-VISUALIZAÇÃO 16:9 EM TEMPO REAL */}
            <div className="p-4 bg-[#0f172a] border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#dc143c] font-mono text-[11px] font-black uppercase text-white">
                    Prévia 16:9 ao Vivo
                  </span>
                  <span className="font-display text-xs sm:text-sm font-extrabold text-white">
                    {selectedSlide.shortTitle}
                  </span>
                  {selectedSlide.kind === 'custom' &&
                    selectedSlide.customData?.template === 'free-canvas' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 font-sans text-[11px] font-bold text-sky-300 flex items-center gap-1">
                        <Move className="w-3 h-3" />
                        <span>Arraste blocos diretamente no palco abaixo!</span>
                      </span>
                    )}
                </div>

                {/* Seletor de Etapas da Prévia */}
                {selectedSlide.steps.length > 1 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-400 mr-1">
                      Etapa da Prévia:
                    </span>
                    {selectedSlide.steps.map((st) => (
                      <button
                        key={st.subStep}
                        type="button"
                        onClick={() => setPreviewSubStep(st.subStep)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer ${
                          previewSubStep === st.subStep
                            ? 'bg-[#003893] text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {st.shortLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full max-w-[780px] mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
                <SlideStagePreview
                  slideIndex={selectedSlide.slideIndex}
                  subStep={previewSubStep}
                  instanceId={`editor-preview-${selectedSlide.id}`}
                  isPreview={true}
                  slideOverride={selectedSlide}
                  interactiveCanvas={
                    selectedSlide.kind === 'custom' &&
                    selectedSlide.customData?.template === 'free-canvas'
                      ? {
                          selectedBlockId: selectedCanvasBlockId,
                          onSelectBlock: setSelectedCanvasBlockId,
                          onUpdateBlockRect: (blockId, patch) => {
                            updateSelectedCustomData((d) => ({
                              ...d,
                              canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                b.id === blockId ? { ...b, ...patch } : b
                              ),
                            }));
                          },
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            {/* 2. PAINEL DE EDIÇÃO DO SLIDE SELECIONADO */}
            <div className="p-4 sm:p-6 space-y-5 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {selectedSlide.kind === 'custom' && selectedSlide.customData ? (
                <>
                  {/* Abas do Editor para Slides Customizados */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditorTab('content')}
                      className={`px-3.5 py-2 rounded-xl font-sans text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        editorTab === 'content'
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      <span>1. Modelo &amp; Textos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab('cards')}
                      className={`px-3.5 py-2 rounded-xl font-sans text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        editorTab === 'cards'
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>
                        {selectedSlide.customData.template === 'free-canvas'
                          ? '2. Blocos do Quadro Livre (Arrastar)'
                          : `2. Cartões & Pilares (${selectedSlide.customData.cards.length})`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab('style')}
                      className={`px-3.5 py-2 rounded-xl font-sans text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        editorTab === 'style'
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>3. Fotografia &amp; Cores</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorTab('notes')}
                      className={`px-3.5 py-2 rounded-xl font-sans text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        editorTab === 'notes'
                          ? 'bg-[#003893] text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>4. Notas do Apresentador</span>
                    </button>
                  </div>

                  {/* ABA 1: MODELO & TEXTOS PRINCIPAIS */}
                  {editorTab === 'content' && (
                    <div className="space-y-4">
                      {/* Seletor de Template */}
                      <div>
                        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Layout do Slide (6 Modelos Disponíveis):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {TEMPLATE_OPTIONS.map((tpl) => {
                            const active = selectedSlide.customData?.template === tpl.id;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() =>
                                  updateSelectedCustomData((d) => ({
                                    ...d,
                                    template: tpl.id,
                                  }))
                                }
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#003893]/30 border-[#003893] text-white shadow-md'
                                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="font-display text-xs font-extrabold">
                                  {tpl.name}
                                </div>
                                <div className="font-sans text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  {tpl.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Nome Curto (Menu Lateral / Console)
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.shortTitle}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                shortTitle: e.target.value.slice(0, 40),
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>

                        <div>
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Selo Superior (Badge)
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.badge}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                badge: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                          Título Principal do Slide (Caixa Alta)
                        </label>
                        <input
                          type="text"
                          value={selectedSlide.customData.title}
                          onChange={(e) =>
                            updateSelectedCustomData((d) => ({
                              ...d,
                              title: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white select-text"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Subtítulo / Referência
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.subtitle}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>

                        <div>
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Número / Métrica de Destaque
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.heroMetricValue}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                heroMetricValue: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono font-bold text-white select-text"
                          />
                        </div>

                        <div>
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Legenda da Métrica
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.heroMetricLabel}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                heroMetricLabel: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                          Parágrafo de Abertura / Citação Principal
                        </label>
                        <textarea
                          rows={2}
                          value={selectedSlide.customData.leadText}
                          onChange={(e) =>
                            updateSelectedCustomData((d) => ({
                              ...d,
                              leadText: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white resize-none select-text"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Selo da Caixa de Síntese (Rodapé)
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.calloutTitle}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                calloutTitle: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                            Texto da Caixa de Síntese (Rodapé)
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.customData.calloutBody}
                            onChange={(e) =>
                              updateSelectedCustomData((d) => ({
                                ...d,
                                calloutBody: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: CARTÕES & BLOCOS (OU QUADRO LIVRE 16:9) */}
                  {editorTab === 'cards' && (
                    <div className="space-y-4">
                      {selectedSlide.customData.template === 'free-canvas' ? (
                        <div className="space-y-4">
                          {/* Barra para inserir novos elementos no Quadro Livre */}
                          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5">
                            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">
                              Adicionar Elemento ao Quadro Livre 16:9:
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(
                                [
                                  { type: 'heading', label: '+ Título' },
                                  { type: 'text', label: '+ Caixa de Texto' },
                                  { type: 'card', label: '+ Cartão Liquid Glass' },
                                  { type: 'stat', label: '+ Número / Estatística' },
                                  { type: 'image', label: '+ Fotografia' },
                                  { type: 'badge', label: '+ Selo / Tag' },
                                  { type: 'divider', label: '+ Linha Divisória' },
                                ] as const
                              ).map((item) => (
                                <button
                                  key={item.type}
                                  type="button"
                                  onClick={() => handleAddCanvasBlock(item.type)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#003893] text-white font-sans text-xs font-bold transition-colors cursor-pointer"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lista de blocos + Inspetor do Bloco Selecionado */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5 space-y-1.5">
                              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Elementos no Palco (
                                {(selectedSlide.customData.canvasBlocks || []).length}):
                              </div>
                              {(selectedSlide.customData.canvasBlocks || []).map(
                                (blk, bIdx) => (
                                  <div
                                    key={blk.id}
                                    onClick={() => setSelectedCanvasBlockId(blk.id)}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer ${
                                      selectedCanvasBlockId === blk.id
                                        ? 'bg-[#003893]/30 border-[#003893] text-white'
                                        : 'bg-slate-900 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className="truncate">
                                      <span className="font-mono text-[10px] uppercase text-sky-400 mr-1.5">
                                        [{blk.type}]
                                      </span>
                                      <span className="font-sans text-xs font-bold">
                                        {blk.title || blk.statValue || `Elemento ${bIdx + 1}`}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateSelectedCustomData((d) => ({
                                          ...d,
                                          canvasBlocks: (d.canvasBlocks || []).filter(
                                            (x) => x.id !== blk.id
                                          ),
                                        }));
                                      }}
                                      className="p-1 rounded-lg hover:bg-rose-900/70 text-slate-400 hover:text-rose-200 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="md:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-4">
                              {selectedCanvasBlock ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="font-display text-xs font-extrabold uppercase tracking-wider text-amber-400">
                                      Editando Elemento ({selectedCanvasBlock.type})
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-400">
                                      X:{selectedCanvasBlock.x} Y:{selectedCanvasBlock.y} ·{' '}
                                      {selectedCanvasBlock.width}×{selectedCanvasBlock.height}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                                        Título / Rótulo
                                      </label>
                                      <input
                                        type="text"
                                        value={selectedCanvasBlock.title}
                                        onChange={(e) =>
                                          updateSelectedCustomData((d) => ({
                                            ...d,
                                            canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                              b.id === selectedCanvasBlock.id
                                                ? { ...b, title: e.target.value }
                                                : b
                                            ),
                                          }))
                                        }
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white select-text"
                                      />
                                    </div>

                                    {(selectedCanvasBlock.type === 'stat' ||
                                      selectedCanvasBlock.type === 'card') && (
                                      <div>
                                        <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                                          Valor / Métrica
                                        </label>
                                        <input
                                          type="text"
                                          value={selectedCanvasBlock.statValue}
                                          onChange={(e) =>
                                            updateSelectedCustomData((d) => ({
                                              ...d,
                                              canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                                b.id === selectedCanvasBlock.id
                                                  ? { ...b, statValue: e.target.value }
                                                  : b
                                              ),
                                            }))
                                          }
                                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm font-mono text-white select-text"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {selectedCanvasBlock.type !== 'badge' &&
                                    selectedCanvasBlock.type !== 'divider' && (
                                      <div>
                                        <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                                          Texto / Descrição
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={selectedCanvasBlock.body}
                                          onChange={(e) =>
                                            updateSelectedCustomData((d) => ({
                                              ...d,
                                              canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                                b.id === selectedCanvasBlock.id
                                                  ? { ...b, body: e.target.value }
                                                  : b
                                              ),
                                            }))
                                          }
                                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white resize-none select-text"
                                        />
                                      </div>
                                    )}

                                  {selectedCanvasBlock.type === 'image' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <label className="font-sans text-xs font-bold text-slate-300">
                                          URL da Imagem ou Foto do Dispositivo:
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => fileInputRef.current?.click()}
                                          className="px-2.5 py-1 rounded-lg bg-[#003893] text-white font-sans text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                          <Upload className="w-3 h-3" />
                                          <span>Enviar Foto</span>
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={selectedCanvasBlock.imageUrl}
                                        onChange={(e) =>
                                          updateSelectedCustomData((d) => ({
                                            ...d,
                                            canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                              b.id === selectedCanvasBlock.id
                                                ? { ...b, imageUrl: e.target.value }
                                                : b
                                            ),
                                          }))
                                        }
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white select-text"
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-3 gap-2 pt-1">
                                    <div>
                                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1">
                                        Cor Destaque
                                      </label>
                                      <select
                                        value={selectedCanvasBlock.accent}
                                        onChange={(e) =>
                                          updateSelectedCustomData((d) => ({
                                            ...d,
                                            canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                              b.id === selectedCanvasBlock.id
                                                ? {
                                                    ...b,
                                                    accent: e.target.value as any,
                                                  }
                                                : b
                                            ),
                                          }))
                                        }
                                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white"
                                      >
                                        <option value="navy">Azul Marinho</option>
                                        <option value="crimson">Vermelho Nepal</option>
                                        <option value="gold">Ouro Solar</option>
                                        <option value="emerald">Esmeralda</option>
                                        <option value="dark">Preto Neutro</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1">
                                        Alinhamento
                                      </label>
                                      <select
                                        value={selectedCanvasBlock.align}
                                        onChange={(e) =>
                                          updateSelectedCustomData((d) => ({
                                            ...d,
                                            canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                              b.id === selectedCanvasBlock.id
                                                ? {
                                                    ...b,
                                                    align: e.target.value as any,
                                                  }
                                                : b
                                            ),
                                          }))
                                        }
                                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white"
                                      >
                                        <option value="left">Esquerda</option>
                                        <option value="center">Centro</option>
                                        <option value="right">Direita</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1">
                                        Tamanho Fonte
                                      </label>
                                      <select
                                        value={selectedCanvasBlock.fontSize}
                                        onChange={(e) =>
                                          updateSelectedCustomData((d) => ({
                                            ...d,
                                            canvasBlocks: (d.canvasBlocks || []).map((b) =>
                                              b.id === selectedCanvasBlock.id
                                                ? {
                                                    ...b,
                                                    fontSize: e.target.value as any,
                                                  }
                                                : b
                                            ),
                                          }))
                                        }
                                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white"
                                      >
                                        <option value="sm">Pequeno</option>
                                        <option value="md">Médio</option>
                                        <option value="lg">Grande</option>
                                        <option value="xl">Extra Grande</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-8 text-center text-slate-400 font-sans text-xs">
                                  Clique em qualquer elemento na prévia 16:9 acima (ou na lista ao lado) para editar seus textos, cores ou arrastá-lo livremente.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Editor de Cartões Estruturados */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900 border border-slate-800 rounded-2xl p-3">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSlide.customData.stepByStepCards}
                                onChange={(e) =>
                                  updateSelectedCustomData((d) => ({
                                    ...d,
                                    stepByStepCards: e.target.checked,
                                  }))
                                }
                                className="w-4 h-4 accent-[#dc143c] rounded"
                              />
                              <span className="font-sans text-xs font-bold text-slate-200">
                                Revelar cartões passo a passo durante a apresentação (cria etapas de avanço)
                              </span>
                            </label>

                            <button
                              type="button"
                              disabled={selectedSlide.customData.cards.length >= 4}
                              onClick={() => {
                                const newCard: CustomSlideCardItem = {
                                  id: `card-${Date.now().toString(36)}`,
                                  title: `Novo Tópico ${
                                    selectedSlide.customData!.cards.length + 1
                                  }`,
                                  value: 'Destaque',
                                  body: 'Descreva aqui o conteúdo deste cartão Liquid Glass.',
                                  icon: 'sparkles',
                                };
                                updateSelectedCustomData((d) => ({
                                  ...d,
                                  cards: [...d.cards, newCard],
                                }));
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#003893] hover:bg-[#0046b5] disabled:opacity-40 text-white font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar Cartão (máx. 4)</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedSlide.customData.cards.map((card, cIdx) => (
                              <div
                                key={card.id || cIdx}
                                className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-black uppercase text-sky-400">
                                    Cartão 0{cIdx + 1}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <select
                                      value={card.icon || 'layers'}
                                      onChange={(e) => {
                                        const nextIcon = e.target.value as CustomIconName;
                                        updateSelectedCustomData((d) => ({
                                          ...d,
                                          cards: d.cards.map((c, i) =>
                                            i === cIdx ? { ...c, icon: nextIcon } : c
                                          ),
                                        }));
                                      }}
                                      className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
                                    >
                                      {ICON_OPTIONS.map((ic) => (
                                        <option key={ic.id} value={ic.id}>
                                          Ícone: {ic.label}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      type="button"
                                      disabled={selectedSlide.customData!.cards.length <= 1}
                                      onClick={() =>
                                        updateSelectedCustomData((d) => ({
                                          ...d,
                                          cards: d.cards.filter((_, i) => i !== cIdx),
                                        }))
                                      }
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/70 disabled:opacity-30 text-slate-300 cursor-pointer"
                                      title="Remover cartão"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <label className="block font-sans text-[11px] font-bold text-slate-400 mb-0.5">
                                      Título do Cartão
                                    </label>
                                    <input
                                      type="text"
                                      value={card.title}
                                      onChange={(e) =>
                                        updateSelectedCustomData((d) => ({
                                          ...d,
                                          cards: d.cards.map((c, i) =>
                                            i === cIdx ? { ...c, title: e.target.value } : c
                                          ),
                                        }))
                                      }
                                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-white select-text"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-sans text-[11px] font-bold text-slate-400 mb-0.5">
                                      Selo / Valor
                                    </label>
                                    <input
                                      type="text"
                                      value={card.value}
                                      onChange={(e) =>
                                        updateSelectedCustomData((d) => ({
                                          ...d,
                                          cards: d.cards.map((c, i) =>
                                            i === cIdx ? { ...c, value: e.target.value } : c
                                          ),
                                        }))
                                      }
                                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs font-mono text-white select-text"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block font-sans text-[11px] font-bold text-slate-400 mb-0.5">
                                    Texto Explicativo
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={card.body}
                                    onChange={(e) =>
                                      updateSelectedCustomData((d) => ({
                                        ...d,
                                        cards: d.cards.map((c, i) =>
                                          i === cIdx ? { ...c, body: e.target.value } : c
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white resize-none select-text"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABA 3: FOTOGRAFIA, GALERIA NEPAL & TEMA VISUAL */}
                  {editorTab === 'style' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Cor de Destaque */}
                        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5">
                          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Cor de Destaque Principal:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                { id: 'navy', label: 'Azul Marinho (#003893)', color: '#003893' },
                                {
                                  id: 'crimson',
                                  label: 'Vermelho Nepal (#dc143c)',
                                  color: '#dc143c',
                                },
                                { id: 'gold', label: 'Ouro Solar (#d97706)', color: '#d97706' },
                                {
                                  id: 'emerald',
                                  label: 'Esmeralda (#059669)',
                                  color: '#059669',
                                },
                              ] as Array<{ id: CustomSlideAccent; label: string; color: string }>
                            ).map((acc) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() =>
                                  updateSelectedCustomData((d) => ({
                                    ...d,
                                    accentColor: acc.id,
                                  }))
                                }
                                className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                                  selectedSlide.customData?.accentColor === acc.id
                                    ? 'bg-slate-800 border-white text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full shrink-0"
                                  style={{ backgroundColor: acc.color }}
                                />
                                <span className="font-sans text-xs font-bold truncate">
                                  {acc.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Atmosfera de Fundo */}
                        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5">
                          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Atmosfera de Fundo 16:9:
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {(
                              [
                                {
                                  id: 'cream',
                                  label: 'Creme Clássico Missão Nepal (#f4f2eb)',
                                },
                                {
                                  id: 'navy-dark',
                                  label: 'Azul Noturno Profundo (Alto Contraste)',
                                },
                                {
                                  id: 'warm-dawn',
                                  label: 'Aurora Dourada do Himalaia',
                                },
                              ] as Array<{ id: CustomSlideBackground; label: string }>
                            ).map((bg) => (
                              <button
                                key={bg.id}
                                type="button"
                                onClick={() =>
                                  updateSelectedCustomData((d) => ({
                                    ...d,
                                    backgroundStyle: bg.id,
                                  }))
                                }
                                className={`px-3 py-2 rounded-xl border text-left font-sans text-xs font-bold cursor-pointer ${
                                  selectedSlide.customData?.backgroundStyle === bg.id
                                    ? 'bg-[#003893] border-sky-400 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                {bg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Upload ou URL de Imagem + Legenda */}
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Fotografia Principal do Slide:
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl bg-[#dc143c] hover:bg-[#b81032] text-white font-sans text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Enviar Foto do Computador / Celular</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-sans text-xs font-bold text-slate-400 mb-1">
                              URL ou Caminho da Imagem
                            </label>
                            <input
                              type="text"
                              value={selectedSlide.customData.imageUrl}
                              onChange={(e) =>
                                updateSelectedCustomData((d) => ({
                                  ...d,
                                  imageUrl: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white select-text"
                            />
                          </div>
                          <div>
                            <label className="block font-sans text-xs font-bold text-slate-400 mb-1">
                              Legenda Fotográfica
                            </label>
                            <input
                              type="text"
                              value={selectedSlide.customData.imageCaption}
                              onChange={(e) =>
                                updateSelectedCustomData((d) => ({
                                  ...d,
                                  imageCaption: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                            />
                          </div>
                        </div>

                        {/* Galeria de Fotos Nativas Missão Nepal */}
                        <div>
                          <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Ou escolha uma foto do acervo Missão Nepal:
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {NEPAL_MEDIA_GALLERY.map((asset) => {
                              const isCurrent =
                                selectedSlide.customData?.imageUrl === asset.url;
                              return (
                                <button
                                  key={asset.id}
                                  type="button"
                                  onClick={() =>
                                    updateSelectedCustomData((d) => ({
                                      ...d,
                                      imageUrl: asset.url,
                                      imageCaption: asset.label,
                                    }))
                                  }
                                  className={`group relative rounded-xl overflow-hidden border-2 aspect-video cursor-pointer ${
                                    isCurrent
                                      ? 'border-[#dc143c] ring-2 ring-[#dc143c]'
                                      : 'border-slate-700 hover:border-white'
                                  }`}
                                >
                                  <img
                                    src={asset.url}
                                    alt={asset.label}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-0.5 text-[9.5px] font-sans font-bold text-white truncate">
                                    {asset.label}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 4: ANOTAÇÕES DO APRESENTADOR */}
                  {editorTab === 'notes' && (
                    <div className="space-y-3">
                      <label className="block font-sans text-xs font-bold text-slate-300">
                        Roteiro / Notas do Apresentador para este Slide (visível no celular/console):
                      </label>
                      <textarea
                        rows={5}
                        value={
                          selectedSlide.steps[previewSubStep]?.defaultNotes ||
                          selectedSlide.steps[0]?.defaultNotes ||
                          ''
                        }
                        onChange={(e) => {
                          const text = e.target.value;
                          updateSelectedSlide((s) => ({
                            ...s,
                            steps: s.steps.map((st, idx) =>
                              idx === previewSubStep || idx === 0
                                ? { ...st, defaultNotes: text }
                                : st
                            ),
                          }));
                        }}
                        placeholder="Digite os tópicos de fala e lembretes para o apresentador..."
                        className="w-full rounded-2xl bg-slate-900 border border-slate-700 p-3.5 text-sm text-white leading-relaxed resize-none select-text"
                      />
                    </div>
                  )}
                </>
              ) : (
                /* =============================================================
                   EDITOR PARA SLIDES ORIGINAIS INTERATIVOS (SLIDES 1 A 8)
                   ============================================================= */
                <div className="space-y-5">
                  <div className="rounded-2xl bg-gradient-to-r from-[#003893]/30 via-slate-900 to-[#dc143c]/20 border border-slate-700 p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-display text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                          Slide Interativo Original · {selectedSlide.shortTitle}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-slate-300 mt-1">
                        Você pode personalizar títulos, adicionar um Banner Liquid Glass sobre o slide, editar as notas de cada etapa ou criar uma cópia 100% desbloqueada no Editor Visual.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDuplicateOrConvertSlide(selectedSlide)}
                      className="px-4 py-2.5 rounded-xl bg-[#dc143c] hover:bg-[#b81032] text-white font-sans text-xs font-extrabold flex items-center gap-1.5 shadow-lg cursor-pointer shrink-0"
                    >
                      <LayoutTemplate className="w-4 h-4" />
                      <span>Criar Cópia 100% Editável deste Slide</span>
                    </button>
                  </div>

                  {/* Título Curto e Título Completo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                        Título Curto (Barra do Apresentador)
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.shortTitle}
                        onChange={(e) =>
                          updateSelectedSlide((s) => ({
                            ...s,
                            shortTitle: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                      />
                    </div>
                    <div>
                      <label className="block font-sans text-xs font-bold text-slate-300 mb-1">
                        Título de Referência do Slide
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.fullTitle}
                        onChange={(e) =>
                          updateSelectedSlide((s) => ({
                            ...s,
                            fullTitle: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white select-text"
                      />
                    </div>
                  </div>

                  {/* Banner / Destaque Liquid Glass sobre o Slide Original */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedSlide.builtinBanner?.enabled)}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            updateSelectedSlide((s) => ({
                              ...s,
                              builtinBanner: {
                                enabled,
                                badge: s.builtinBanner?.badge || 'DESTAQUE ESPECIAL',
                                title:
                                  s.builtinBanner?.title ||
                                  'OBSERVAÇÃO PARA A APRESENTAÇÃO',
                                body:
                                  s.builtinBanner?.body ||
                                  'Adicione um aviso, versículo ou dado atualizado sobre este slide.',
                                position: s.builtinBanner?.position || 'bottom-left',
                                accent: s.builtinBanner?.accent || 'crimson',
                              },
                            }));
                          }}
                          className="w-4 h-4 accent-[#dc143c] rounded"
                        />
                        <span className="font-display text-xs font-extrabold uppercase tracking-wider text-white">
                          Exibir Cartão de Destaque Liquid Glass sobre este Slide
                        </span>
                      </label>

                      {selectedSlide.builtinBanner?.enabled && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedSlide.builtinBanner.position}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                builtinBanner: {
                                  ...s.builtinBanner!,
                                  position: e.target.value as any,
                                },
                              }))
                            }
                            className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-white"
                          >
                            <option value="bottom-left">Posição: Canto Inferior Esquerdo</option>
                            <option value="top-right">Posição: Canto Superior Direito</option>
                          </select>

                          <select
                            value={selectedSlide.builtinBanner.accent}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                builtinBanner: {
                                  ...s.builtinBanner!,
                                  accent: e.target.value as any,
                                },
                              }))
                            }
                            className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-white"
                          >
                            <option value="crimson">Borda: Vermelho Nepal</option>
                            <option value="navy">Borda: Azul Marinho</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {selectedSlide.builtinBanner?.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1">
                            Selo Superior
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.builtinBanner.badge}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                builtinBanner: {
                                  ...s.builtinBanner!,
                                  badge: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white select-text"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1">
                            Título do Destaque
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.builtinBanner.title}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                builtinBanner: {
                                  ...s.builtinBanner!,
                                  title: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white select-text"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1">
                            Texto Explicativo da Sobreposição
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.builtinBanner.body}
                            onChange={(e) =>
                              updateSelectedSlide((s) => ({
                                ...s,
                                builtinBanner: {
                                  ...s.builtinBanner!,
                                  body: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white select-text"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editor de Etapas e Notas do Apresentador */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-display text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        Roteiro &amp; Notas do Apresentador — Etapa{' '}
                        {selectedSlide.steps[previewSubStep]?.shortLabel || '1'}
                      </span>
                      {selectedSlide.steps.length > 1 && (
                        <span className="font-mono text-[11px] text-slate-400">
                          Selecione a etapa acima da prévia 16:9 para editar cada passo
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={4}
                      value={
                        selectedSlide.visible
                          ? getNoteForStep(selectedSlide.slideIndex, previewSubStep)
                          : selectedSlide.steps[previewSubStep]?.defaultNotes || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedSlide.visible) {
                          updateNoteForStep(selectedSlide.slideIndex, previewSubStep, val);
                        }
                        updateSelectedSlide((s) => ({
                          ...s,
                          steps: s.steps.map((st, idx) =>
                            idx === previewSubStep ? { ...st, defaultNotes: val } : st
                          ),
                        }));
                      }}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-white leading-relaxed resize-none select-text"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
