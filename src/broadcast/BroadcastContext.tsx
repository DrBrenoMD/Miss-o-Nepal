import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  BroadcastMode,
  RoomSyncState,
  DrawingStroke,
  SlideCustomState,
  SpotlightState,
  NetworkInfoResponse,
} from './types';
import {
  clampPosition,
  getNextPosition,
  getPrevPosition,
  makeNoteKey,
  PRESENTATION_SLIDES,
} from './presentationMetadata';

const NOTES_STORAGE_KEY = 'missao_nepal_speaker_notes_v1';
const CLIENT_ID_KEY = 'missao_nepal_client_id_v1';

function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = `dev-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  window.sessionStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iPad';
  if (/Android/i.test(ua)) return 'Celular Android';
  if (/Macintosh/i.test(ua)) return 'Computador Mac';
  if (/Windows/i.test(ua)) return 'Computador Windows';
  return 'Navegador Web';
}

function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

function loadSavedNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Contexto leve por instância de palco (permite renderizar Tela Atual + Próxima Etapa
 * lado a lado no Console do Apresentador sem colisão de steps ou cliques).
 */
export interface StageInstanceConfig {
  isPreview: boolean;
  forcedSubStep: number | null;
  disableSlideTapAdvance: boolean;
}

const StageInstanceContext = createContext<StageInstanceConfig>({
  isPreview: false,
  forcedSubStep: null,
  disableSlideTapAdvance: false,
});

export const StageInstanceProvider = StageInstanceContext.Provider;
export const useStageInstance = () => useContext(StageInstanceContext);

export interface BroadcastContextValue {
  mode: BroadcastMode;
  roomId: string;
  connected: boolean;
  roomState: RoomSyncState;
  isBroadcastModalOpen: boolean;
  networkInfo: NetworkInfoResponse | null;
  openBroadcastModal: () => void;
  closeBroadcastModal: () => void;
  startPresenting: (customRoomId?: string, initialPos?: { slideIndex: number; subStep: number }) => void;
  joinAsScreen: (targetRoomId: string) => void;
  joinAsPresenter: (targetRoomId: string) => void;
  leaveBroadcast: () => void;
  goToPosition: (slideIndex: number, subStep: number) => void;
  stepForwardBroadcast: () => void;
  stepBackwardBroadcast: () => void;
  nextSlideBroadcast: () => void;
  prevSlideBroadcast: () => void;
  setBlackout: (blackout: boolean) => void;
  setSpotlight: (spotlight: SpotlightState | null) => void;
  emitPointer: (active: boolean, x: number, y: number, color?: string) => void;
  upsertStroke: (slideIndex: number, stroke: DrawingStroke) => void;
  undoStroke: (slideIndex: number) => void;
  clearStrokes: (slideIndex: number) => void;
  updateSlideCustomState: (patch: Partial<SlideCustomState>) => void;
  getNoteForStep: (slideIndex: number, subStep: number) => string;
  updateNoteForStep: (slideIndex: number, subStep: number, text: string) => void;
  timerAction: (action: 'start' | 'pause' | 'reset') => void;
  refreshNetworkInfo: () => Promise<void>;
}

const BroadcastContext = createContext<BroadcastContextValue | null>(null);

export const BroadcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lê parâmetros iniciais de URL (?sala=4829&modo=tela | apresentador) para conexão via QR Code ou Link LAN
  const initialUrlParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { room: generateRoomCode(), mode: 'standalone' as BroadcastMode };
    }
    const params = new URLSearchParams(window.location.search);
    const rawRoom = (params.get('sala') || params.get('room') || '').trim().toUpperCase();
    const rawMode = (params.get('modo') || params.get('role') || '').trim().toLowerCase();

    let initialMode: BroadcastMode = 'standalone';
    if (rawRoom) {
      if (rawMode === 'apresentador' || rawMode === 'presenter') {
        initialMode = 'presenter';
      } else {
        initialMode = 'screen';
      }
    }

    return {
      room: rawRoom || generateRoomCode(),
      mode: initialMode,
    };
  }, []);

  const [mode, setMode] = useState<BroadcastMode>(initialUrlParams.mode);
  const [roomId, setRoomId] = useState<string>(initialUrlParams.room);
  const [connected, setConnected] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);

  const [roomState, setRoomState] = useState<RoomSyncState>(() => ({
    roomId: initialUrlParams.room,
    slideIndex: 0,
    subStep: 0,
    blackout: false,
    spotlight: null,
    pointer: null,
    drawingsBySlide: {},
    slideCustomState: {
      economyMetric: 'perCapita',
      casteTier: null,
      timelineLens: 'auto',
    },
    customNotes: loadSavedNotes(),
    timer: {
      running: false,
      elapsedMs: 0,
      startedAt: null,
    },
    presence: [],
    serverTimeOffsetMs: 0,
  }));

  const clientIdRef = useRef<string>(getOrCreateClientId());
  const deviceLabelRef = useRef<string>(detectDeviceLabel());
  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const pendingInitialPosRef = useRef<{ slideIndex: number; subStep: number } | null>(null);
  const lastPointerSendRef = useRef<number>(0);
  const lastStrokeSendRef = useRef<number>(0);

  const refreshNetworkInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        const data = (await res.json()) as NetworkInfoResponse;
        setNetworkInfo(data);
      }
    } catch {
      // Fallback silencioso caso offline
    }
  }, []);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  // Sincroniza URL limpa ao entrar/sair da transmissão para facilitar recarregamento sem perder a sala
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (mode === 'standalone') {
      url.searchParams.delete('sala');
      url.searchParams.delete('room');
      url.searchParams.delete('modo');
      url.searchParams.delete('role');
    } else {
      url.searchParams.set('sala', roomId);
      url.searchParams.set('modo', mode === 'presenter' ? 'apresentador' : 'tela');
    }
    window.history.replaceState({}, '', url.toString());
  }, [mode, roomId]);

  const sendWsMessage = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
    if (bcRef.current) {
      try {
        bcRef.current.postMessage({
          ...payload,
          __senderId: clientIdRef.current,
          __roomId: roomId,
        });
      } catch {
        // Ignora caso canal fechado
      }
    }
  }, [roomId]);

  // Processador idempotente de eventos recebidos do servidor WebSocket (ou BroadcastChannel local)
  const applyIncomingEvent = useCallback((msg: Record<string, any>) => {
    const type = msg.type as string;

    if (type === 'room:init' && msg.state) {
      const st = msg.state;
      const offset = typeof st.serverTime === 'number' ? st.serverTime - Date.now() : 0;
      setRoomState((prev) => ({
        roomId: st.roomId || prev.roomId,
        slideIndex: typeof st.slideIndex === 'number' ? st.slideIndex : 0,
        subStep: typeof st.subStep === 'number' ? st.subStep : 0,
        blackout: Boolean(st.blackout),
        spotlight: st.spotlight ?? null,
        pointer: st.pointer ?? null,
        drawingsBySlide: st.drawingsBySlide || {},
        slideCustomState: st.slideCustomState || prev.slideCustomState,
        customNotes: { ...prev.customNotes, ...(st.customNotes || {}) },
        timer: st.timer || prev.timer,
        presence: Array.isArray(st.presence) ? st.presence : [],
        serverTimeOffsetMs: offset,
      }));
      return;
    }

    if (type === 'room:presence' && Array.isArray(msg.presence)) {
      setRoomState((prev) => ({ ...prev, presence: msg.presence }));
      return;
    }

    if (type === 'nav:updated' || type === 'nav:goto') {
      const pos = clampPosition(Number(msg.slideIndex) || 0, Number(msg.subStep) || 0);
      setRoomState((prev) => ({
        ...prev,
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        pointer: msg.pointer !== undefined ? msg.pointer : null,
      }));
      return;
    }

    if (type === 'stage:blackout') {
      setRoomState((prev) => ({ ...prev, blackout: Boolean(msg.blackout) }));
      return;
    }

    if (type === 'stage:spotlight') {
      setRoomState((prev) => ({ ...prev, spotlight: msg.spotlight ?? null }));
      return;
    }

    if (type === 'pointer:updated' || type === 'pointer:move') {
      const pointerPayload =
        type === 'pointer:updated'
          ? msg.pointer
          : msg.active
          ? {
              active: true,
              x: Number(msg.x) || 0,
              y: Number(msg.y) || 0,
              color: String(msg.color || '#dc143c'),
              updatedAt: Date.now(),
            }
          : null;
      setRoomState((prev) => ({ ...prev, pointer: pointerPayload }));
      return;
    }

    if (type === 'draw:upserted' || type === 'draw:upsert') {
      const sIdx = Number(msg.slideIndex) || 0;
      const stroke = msg.stroke as DrawingStroke | undefined;
      if (!stroke || !stroke.id) return;
      setRoomState((prev) => {
        const list = [...(prev.drawingsBySlide[sIdx] || [])];
        const idx = list.findIndex((s) => s.id === stroke.id);
        if (idx >= 0) {
          list[idx] = stroke;
        } else {
          list.push(stroke);
        }
        return {
          ...prev,
          drawingsBySlide: {
            ...prev.drawingsBySlide,
            [sIdx]: list,
          },
        };
      });
      return;
    }

    if (type === 'draw:synced') {
      const sIdx = Number(msg.slideIndex) || 0;
      setRoomState((prev) => ({
        ...prev,
        drawingsBySlide: {
          ...prev.drawingsBySlide,
          [sIdx]: Array.isArray(msg.strokes) ? msg.strokes : [],
        },
      }));
      return;
    }

    if (type === 'slide:custom') {
      const nextCustom = msg.slideCustomState || msg.patch;
      if (nextCustom) {
        setRoomState((prev) => ({
          ...prev,
          slideCustomState: {
            ...prev.slideCustomState,
            ...nextCustom,
          },
        }));
      }
      return;
    }

    if (type === 'notes:updated' || type === 'notes:update') {
      const key = String(msg.key || '');
      if (!key) return;
      const text = String(msg.text ?? '');
      setRoomState((prev) => {
        const merged = { ...prev.customNotes, [key]: text };
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignora quota
          }
        }
        return { ...prev, customNotes: merged };
      });
      return;
    }

    if (type === 'timer:updated') {
      if (msg.timer) {
        const offset =
          typeof msg.serverTime === 'number' ? msg.serverTime - Date.now() : undefined;
        setRoomState((prev) => ({
          ...prev,
          timer: msg.timer,
          serverTimeOffsetMs: offset ?? prev.serverTimeOffsetMs,
        }));
      }
    }
  }, []);

  // Conexão WebSocket ativa sempre que a sala está aberta (em transmissão/recepção ou com o modal aberto para ver telas conectadas)
  const shouldConnectSocket = mode !== 'standalone' || isBroadcastModalOpen;

  useEffect(() => {
    if (typeof window === 'undefined' || !shouldConnectSocket || !roomId) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    let attempt = 0;

    // Canal local paralelo para sincronia instantânea entre abas do mesmo dispositivo
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('missao-nepal-lan-bc');
      bc.onmessage = (ev) => {
        const data = ev.data;
        if (
          data &&
          data.__roomId === roomId &&
          data.__senderId !== clientIdRef.current
        ) {
          applyIncomingEvent(data);
        }
      };
      bcRef.current = bc;
    }

    const connect = () => {
      if (cancelled) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws-cast`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }
        attempt = 0;
        setConnected(true);
        const initPos = pendingInitialPosRef.current;
        socket.send(
          JSON.stringify({
            type: 'room:join',
            roomId,
            clientId: clientIdRef.current,
            role: mode === 'presenter' ? 'presenter' : 'screen',
            deviceLabel: deviceLabelRef.current,
            initialSlideIndex: initPos?.slideIndex,
            initialSubStep: initPos?.subStep,
          })
        );
        pendingInitialPosRef.current = null;
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data));
          applyIncomingEvent(parsed);
        } catch {
          // Ignora pacotes malformados
        }
      };

      socket.onclose = () => {
        if (wsRef.current === socket) {
          wsRef.current = null;
        }
        setConnected(false);
        if (!cancelled) {
          const delay = Math.min(4000, 700 * Math.pow(1.6, attempt++));
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [shouldConnectSocket, roomId, mode, applyIncomingEvent]);

  const openBroadcastModal = useCallback(() => {
    refreshNetworkInfo();
    setIsBroadcastModalOpen(true);
  }, [refreshNetworkInfo]);

  const closeBroadcastModal = useCallback(() => {
    setIsBroadcastModalOpen(false);
  }, []);

  const startPresenting = useCallback(
    (customRoomId?: string, initialPos?: { slideIndex: number; subStep: number }) => {
      const targetRoom = (customRoomId || roomId || generateRoomCode()).trim().toUpperCase();
      if (initialPos) {
        pendingInitialPosRef.current = clampPosition(initialPos.slideIndex, initialPos.subStep);
        setRoomState((prev) => ({
          ...prev,
          roomId: targetRoom,
          slideIndex: initialPos.slideIndex,
          subStep: initialPos.subStep,
        }));
      }
      setRoomId(targetRoom);
      setMode('presenter');
      setIsBroadcastModalOpen(false);
    },
    [roomId]
  );

  const joinAsScreen = useCallback((targetRoomId: string) => {
    const clean = targetRoomId.trim().toUpperCase();
    if (!clean) return;
    setRoomId(clean);
    setMode('screen');
    setIsBroadcastModalOpen(false);
  }, []);

  const joinAsPresenter = useCallback((targetRoomId: string) => {
    const clean = targetRoomId.trim().toUpperCase();
    if (!clean) return;
    setRoomId(clean);
    setMode('presenter');
    setIsBroadcastModalOpen(false);
  }, []);

  const leaveBroadcast = useCallback(() => {
    setMode('standalone');
    setIsBroadcastModalOpen(false);
  }, []);

  const goToPosition = useCallback(
    (slideIndex: number, subStep: number) => {
      const pos = clampPosition(slideIndex, subStep);
      setRoomState((prev) => ({
        ...prev,
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        pointer: null,
      }));
      sendWsMessage({
        type: 'nav:goto',
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        clearPointer: true,
      });
    },
    [sendWsMessage]
  );

  const stepForwardBroadcast = useCallback(() => {
    const next = getNextPosition(roomState.slideIndex, roomState.subStep);
    if (next) {
      goToPosition(next.slideIndex, next.subStep);
    }
  }, [roomState.slideIndex, roomState.subStep, goToPosition]);

  const stepBackwardBroadcast = useCallback(() => {
    const prev = getPrevPosition(roomState.slideIndex, roomState.subStep);
    if (prev) {
      goToPosition(prev.slideIndex, prev.subStep);
    }
  }, [roomState.slideIndex, roomState.subStep, goToPosition]);

  const nextSlideBroadcast = useCallback(() => {
    if (roomState.slideIndex + 1 < PRESENTATION_SLIDES.length) {
      goToPosition(roomState.slideIndex + 1, 0);
    }
  }, [roomState.slideIndex, goToPosition]);

  const prevSlideBroadcast = useCallback(() => {
    if (roomState.slideIndex > 0) {
      goToPosition(roomState.slideIndex - 1, 0);
    }
  }, [roomState.slideIndex, goToPosition]);

  const setBlackout = useCallback(
    (blackout: boolean) => {
      setRoomState((prev) => ({ ...prev, blackout }));
      sendWsMessage({ type: 'stage:blackout', blackout });
    },
    [sendWsMessage]
  );

  const setSpotlight = useCallback(
    (spotlight: SpotlightState | null) => {
      setRoomState((prev) => ({ ...prev, spotlight }));
      const now = performance.now();
      if (!spotlight || now - lastPointerSendRef.current >= 28) {
        lastPointerSendRef.current = now;
        sendWsMessage({ type: 'stage:spotlight', spotlight });
      }
    },
    [sendWsMessage]
  );

  const emitPointer = useCallback(
    (active: boolean, x: number, y: number, color = '#dc143c') => {
      const pointerObj = active
        ? { active: true, x, y, color, updatedAt: Date.now() }
        : null;
      setRoomState((prev) => ({ ...prev, pointer: pointerObj }));

      const now = performance.now();
      if (!active || now - lastPointerSendRef.current >= 26) {
        lastPointerSendRef.current = now;
        sendWsMessage({
          type: 'pointer:move',
          active,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          color,
        });
      }
    },
    [sendWsMessage]
  );

  const upsertStroke = useCallback(
    (slideIndex: number, stroke: DrawingStroke, forceImmediate = false) => {
      setRoomState((prev) => {
        const list = [...(prev.drawingsBySlide[slideIndex] || [])];
        const idx = list.findIndex((s) => s.id === stroke.id);
        if (idx >= 0) {
          list[idx] = stroke;
        } else {
          list.push(stroke);
        }
        return {
          ...prev,
          drawingsBySlide: {
            ...prev.drawingsBySlide,
            [slideIndex]: list,
          },
        };
      });

      const now = performance.now();
      if (forceImmediate || stroke.points.length <= 2 || now - lastStrokeSendRef.current >= 32) {
        lastStrokeSendRef.current = now;
        sendWsMessage({
          type: 'draw:upsert',
          slideIndex,
          stroke,
        });
      }
    },
    [sendWsMessage]
  );

  const undoStroke = useCallback(
    (slideIndex: number) => {
      setRoomState((prev) => {
        const list = [...(prev.drawingsBySlide[slideIndex] || [])];
        list.pop();
        return {
          ...prev,
          drawingsBySlide: {
            ...prev.drawingsBySlide,
            [slideIndex]: list,
          },
        };
      });
      sendWsMessage({ type: 'draw:undo', slideIndex });
    },
    [sendWsMessage]
  );

  const clearStrokes = useCallback(
    (slideIndex: number) => {
      setRoomState((prev) => ({
        ...prev,
        drawingsBySlide: {
          ...prev.drawingsBySlide,
          [slideIndex]: [],
        },
      }));
      sendWsMessage({ type: 'draw:clear', slideIndex });
    },
    [sendWsMessage]
  );

  const updateSlideCustomState = useCallback(
    (patch: Partial<SlideCustomState>) => {
      setRoomState((prev) => ({
        ...prev,
        slideCustomState: {
          ...prev.slideCustomState,
          ...patch,
        },
      }));
      sendWsMessage({ type: 'slide:custom', patch });
    },
    [sendWsMessage]
  );

  const getNoteForStep = useCallback(
    (slideIndex: number, subStep: number): string => {
      const key = makeNoteKey(slideIndex, subStep);
      const custom = roomState.customNotes[key];
      if (custom !== undefined) return custom;
      const slide = PRESENTATION_SLIDES[slideIndex];
      const step = slide?.steps[subStep] ?? slide?.steps[0];
      return step?.defaultNotes ?? '';
    },
    [roomState.customNotes]
  );

  const updateNoteForStep = useCallback(
    (slideIndex: number, subStep: number, text: string) => {
      const key = makeNoteKey(slideIndex, subStep);
      setRoomState((prev) => {
        const merged = { ...prev.customNotes, [key]: text };
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignora
          }
        }
        return { ...prev, customNotes: merged };
      });
      sendWsMessage({ type: 'notes:update', key, text });
    },
    [sendWsMessage]
  );

  const timerAction = useCallback(
    (action: 'start' | 'pause' | 'reset') => {
      const now = Date.now();
      setRoomState((prev) => {
        if (action === 'start' && !prev.timer.running) {
          return {
            ...prev,
            timer: { running: true, elapsedMs: prev.timer.elapsedMs, startedAt: now },
          };
        }
        if (action === 'pause' && prev.timer.running) {
          const delta = prev.timer.startedAt ? now - prev.timer.startedAt : 0;
          return {
            ...prev,
            timer: {
              running: false,
              elapsedMs: prev.timer.elapsedMs + Math.max(0, delta),
              startedAt: null,
            },
          };
        }
        if (action === 'reset') {
          return {
            ...prev,
            timer: { running: false, elapsedMs: 0, startedAt: null },
          };
        }
        return prev;
      });
      sendWsMessage({ type: 'timer:action', action });
    },
    [sendWsMessage]
  );

  const value: BroadcastContextValue = {
    mode,
    roomId,
    connected,
    roomState,
    isBroadcastModalOpen,
    networkInfo,
    openBroadcastModal,
    closeBroadcastModal,
    startPresenting,
    joinAsScreen,
    joinAsPresenter,
    leaveBroadcast,
    goToPosition,
    stepForwardBroadcast,
    stepBackwardBroadcast,
    nextSlideBroadcast,
    prevSlideBroadcast,
    setBlackout,
    setSpotlight,
    emitPointer,
    upsertStroke: (sIdx, st) => upsertStroke(sIdx, st, true),
    undoStroke,
    clearStrokes,
    updateSlideCustomState,
    getNoteForStep,
    updateNoteForStep,
    timerAction,
    refreshNetworkInfo,
  };

  return <BroadcastContext.Provider value={value}>{children}</BroadcastContext.Provider>;
};

export function useBroadcast(): BroadcastContextValue {
  const ctx = useContext(BroadcastContext);
  if (!ctx) {
    throw new Error('useBroadcast must be used within BroadcastProvider');
  }
  return ctx;
}

export function useOptionalBroadcast(): BroadcastContextValue | null {
  return useContext(BroadcastContext);
}
