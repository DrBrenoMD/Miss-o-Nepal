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
  NetworkDeviceInfo,
  RemoteCastCommand,
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
  try {
    const existing = window.sessionStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const created = `dev-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return `dev-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function detectDeviceProfile(): {
  label: string;
  type: 'desktop' | 'mobile' | 'tv';
  resolution: string;
} {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { label: 'Dispositivo', type: 'desktop', resolution: '1920×1080' };
  }
  const ua = navigator.userAgent || '';
  const sw = window.screen?.width || window.innerWidth || 1920;
  const sh = window.screen?.height || window.innerHeight || 1080;
  const resolution = `${sw}×${sh}`;

  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /Chrome\//i.test(ua) && !/Chromium/i.test(ua)
    ? 'Chrome'
    : /Safari\//i.test(ua) && !/Chrome/i.test(ua)
    ? 'Safari'
    : /Firefox\//i.test(ua)
    ? 'Firefox'
    : '';

  const withBrowser = (osName: string) => (browser ? `${osName} · ${browser}` : osName);

  if (/SmartTV|Tizen|Web0S|BRAVIA|AFT|TV/i.test(ua)) {
    return { label: withBrowser('Smart TV'), type: 'tv', resolution };
  }
  if (/iPad/i.test(ua)) {
    return { label: withBrowser('iPad'), type: 'mobile', resolution };
  }
  if (/iPhone|iPod/i.test(ua)) {
    return { label: withBrowser('iPhone'), type: 'mobile', resolution };
  }
  if (/Android/i.test(ua)) {
    return { label: withBrowser('Celular Android'), type: 'mobile', resolution };
  }
  if (/Macintosh/i.test(ua)) {
    return { label: withBrowser('Computador Mac'), type: 'desktop', resolution };
  }
  if (/Windows/i.test(ua)) {
    return { label: withBrowser('Computador Windows'), type: 'desktop', resolution };
  }
  if (/Linux/i.test(ua)) {
    return { label: withBrowser('Computador Linux'), type: 'desktop', resolution };
  }
  return { label: withBrowser('Tela Web'), type: 'desktop', resolution };
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
  myClientId: string;
  mode: BroadcastMode;
  roomId: string;
  connected: boolean;
  roomState: RoomSyncState;
  networkDevices: NetworkDeviceInfo[];
  isBroadcastModalOpen: boolean;
  networkInfo: NetworkInfoResponse | null;
  openBroadcastModal: () => void;
  closeBroadcastModal: () => void;
  startPresenting: (
    customRoomId?: string,
    initialPos?: { slideIndex: number; subStep: number }
  ) => void;
  castToDevices: (
    targetClientIds: string[] | 'ALL',
    initialPos?: { slideIndex: number; subStep: number }
  ) => Promise<void>;
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
  const [networkDevices, setNetworkDevices] = useState<NetworkDeviceInfo[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);

  const [roomState, setRoomState] = useState<RoomSyncState>(() => ({
    roomId: initialUrlParams.room,
    version: 0,
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
  const deviceProfileRef = useRef(detectDeviceProfile());
  const modeRef = useRef<BroadcastMode>(mode);
  const roomIdRef = useRef<string>(roomId);
  const roomVersionRef = useRef<number>(0);
  const devicesVersionRef = useRef<number>(0);
  const pendingDiscreteActionsRef = useRef<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Fila coalescida para eventos contínuos (Laser Pointer / Desenho) em HTTP
  const continuousInFlightRef = useRef<boolean>(false);
  const queuedContinuousActionRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const applyRemoteCastCommand = useCallback((cmd: RemoteCastCommand) => {
    if (!cmd || !cmd.roomId) return;
    const cleanRoom = cmd.roomId.trim().toUpperCase();
    const clamped = clampPosition(cmd.slideIndex ?? 0, cmd.subStep ?? 0);
    roomIdRef.current = cleanRoom;
    modeRef.current = cmd.targetMode;
    roomVersionRef.current = 0;
    setRoomId(cleanRoom);
    setMode(cmd.targetMode);
    setIsBroadcastModalOpen(false);
    setRoomState((prev) => ({
      ...prev,
      roomId: cleanRoom,
      slideIndex: clamped.slideIndex,
      subStep: clamped.subStep,
      pointer: null,
    }));
  }, []);

  const applyRoomSnapshot = useCallback((st: Record<string, any>, forceOverride = false) => {
    if (!st) return;
    const incomingVersion = typeof st.version === 'number' ? st.version : 0;
    const isPresenter = modeRef.current === 'presenter';

    // Se somos o apresentador com cliques discretos em trânsito, atualiza apenas presença
    if (isPresenter && pendingDiscreteActionsRef.current > 0 && !forceOverride) {
      if (Array.isArray(st.presence)) {
        setRoomState((prev) => ({ ...prev, presence: st.presence }));
      }
      return;
    }

    if (incomingVersion > 0) {
      roomVersionRef.current = Math.max(roomVersionRef.current, incomingVersion);
    }

    const offset = typeof st.serverTime === 'number' ? st.serverTime - Date.now() : 0;
    const clamped = clampPosition(
      typeof st.slideIndex === 'number' ? st.slideIndex : 0,
      typeof st.subStep === 'number' ? st.subStep : 0
    );

    setRoomState((prev) => ({
      roomId: st.roomId || prev.roomId,
      version: incomingVersion || prev.version,
      slideIndex: clamped.slideIndex,
      subStep: clamped.subStep,
      blackout: Boolean(st.blackout),
      spotlight: isPresenter && !forceOverride ? prev.spotlight : st.spotlight ?? null,
      pointer: isPresenter && !forceOverride ? prev.pointer : st.pointer ?? null,
      drawingsBySlide: st.drawingsBySlide || prev.drawingsBySlide,
      slideCustomState: st.slideCustomState || prev.slideCustomState,
      customNotes: { ...prev.customNotes, ...(st.customNotes || {}) },
      timer: st.timer || prev.timer,
      presence: Array.isArray(st.presence) ? st.presence : prev.presence,
      serverTimeOffsetMs: offset,
    }));
  }, []);

  const registerPresenceHttp = useCallback(
    async (extra?: {
      targetMode?: BroadcastMode;
      targetRoomId?: string;
      initialSlideIndex?: number;
      initialSubStep?: number;
    }) => {
      try {
        const effectiveMode = extra?.targetMode ?? modeRef.current;
        const effectiveRoom = extra?.targetRoomId ?? roomIdRef.current;
        const res = await fetch('/api/cast/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            deviceLabel: deviceProfileRef.current.label,
            deviceType: deviceProfileRef.current.type,
            screenResolution: deviceProfileRef.current.resolution,
            mode: effectiveMode,
            roomId: effectiveRoom,
            initialSlideIndex: extra?.initialSlideIndex,
            initialSubStep: extra?.initialSubStep,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setConnected(true);
        if (typeof data.devicesVersion === 'number') {
          devicesVersionRef.current = data.devicesVersion;
        }
        if (Array.isArray(data.devices)) {
          setNetworkDevices(
            data.devices.filter((d: NetworkDeviceInfo) => d.clientId !== clientIdRef.current)
          );
        }
        if (data.castCommand) {
          applyRemoteCastCommand(data.castCommand as RemoteCastCommand);
        } else if (data.roomState) {
          applyRoomSnapshot(data.roomState, effectiveMode !== 'presenter');
        }
      } catch {
        // Tentará novamente no ciclo de long-polling
      }
    },
    [applyRemoteCastCommand, applyRoomSnapshot]
  );

  const refreshNetworkInfo = useCallback(async () => {
    try {
      const [netRes] = await Promise.all([
        fetch('/api/network-info'),
        registerPresenceHttp(),
      ]);
      if (netRes.ok) {
        const data = (await netRes.json()) as NetworkInfoResponse;
        setNetworkInfo(data);
      }
    } catch {
      // Fallback silencioso
    }
  }, [registerPresenceHttp]);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  // Atualiza URL com sala/modo preservando demais parâmetros
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

  // Processador idempotente para mensagens instantâneas vindas de WebSocket ou BroadcastChannel
  const applyRealtimeEvent = useCallback(
    (msg: Record<string, any>) => {
      const type = String(msg.type || '');

      if (type === 'cast:command' && msg.command) {
        applyRemoteCastCommand(msg.command as RemoteCastCommand);
        return;
      }

      if (typeof msg.version === 'number' && msg.version > roomVersionRef.current) {
        roomVersionRef.current = msg.version;
      }

      if (type === 'room:init' && msg.state) {
        applyRoomSnapshot(msg.state, modeRef.current !== 'presenter');
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
    },
    [applyRemoteCastCommand, applyRoomSnapshot]
  );

  /**
   * MOTOR 1 (GARANTIDO EM 100% DAS REDES E PROXIES):
   * Loop contínuo de Long-Polling HTTP (/api/cast/poll) sempre ativo em qualquer tela aberta.
   * Garante detecção instantânea de telas na rede e sincronização imediata mesmo quando WebSockets são bloqueados.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let activeAbort: AbortController | null = null;

    const runPollLoop = async () => {
      await registerPresenceHttp();

      while (!cancelled) {
        activeAbort = new AbortController();
        try {
          const query = new URLSearchParams({
            clientId: clientIdRef.current,
            roomId: roomIdRef.current,
            mode: modeRef.current,
            sinceRoomVersion: String(roomVersionRef.current),
            sinceDevicesVersion: String(devicesVersionRef.current),
          });

          const res = await fetch(`/api/cast/poll?${query.toString()}`, {
            method: 'GET',
            cache: 'no-store',
            signal: activeAbort.signal,
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          if (cancelled) break;

          setConnected(true);

          if (typeof data.devicesVersion === 'number') {
            devicesVersionRef.current = data.devicesVersion;
          }
          if (Array.isArray(data.devices)) {
            setNetworkDevices(
              data.devices.filter((d: NetworkDeviceInfo) => d.clientId !== clientIdRef.current)
            );
          }

          if (data.castCommand) {
            applyRemoteCastCommand(data.castCommand as RemoteCastCommand);
            continue;
          }

          if (data.roomState) {
            applyRoomSnapshot(data.roomState, false);
          }
        } catch (err: any) {
          if (cancelled || err?.name === 'AbortError') {
            break;
          }
          setConnected(false);
          await new Promise((r) => window.setTimeout(r, 900));
        }
      }
    };

    runPollLoop();

    return () => {
      cancelled = true;
      activeAbort?.abort();
    };
  }, [mode, roomId, registerPresenceHttp, applyRemoteCastCommand, applyRoomSnapshot]);

  /**
   * MOTOR 2 (ACELERADOR LAN LOCAL + MULTI-ABAS):
   * BroadcastChannel para abas locais + WebSocket oportunista em LAN direta (falha silenciosa caso proxy bloqueie WS).
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('missao-nepal-lan-bc');
      bc.onmessage = (ev) => {
        const data = ev.data;
        if (
          data &&
          data.__roomId === roomId &&
          data.__senderId !== clientIdRef.current
        ) {
          applyRealtimeEvent(data);
        }
      };
      bcRef.current = bc;
    }

    // Tenta WebSocket apenas quando fora de domínios Cloud Run proxy que desativam WS, ou tenta 1x sem floodar erros
    const isAiStudioProxy = /\.run\.app$/i.test(window.location.hostname);
    if (!isAiStudioProxy) {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${proto}//${window.location.host}/ws-cast`);
        wsRef.current = socket;

        socket.onopen = () => {
          if (cancelled) {
            socket.close();
            return;
          }
          setConnected(true);
          socket.send(
            JSON.stringify({
              type: 'room:join',
              roomId,
              clientId: clientIdRef.current,
              role: mode,
              deviceLabel: deviceProfileRef.current.label,
              deviceType: deviceProfileRef.current.type,
              screenResolution: deviceProfileRef.current.resolution,
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(String(event.data));
            applyRealtimeEvent(parsed);
          } catch {
            // Ignora
          }
        };

        socket.onclose = () => {
          if (wsRef.current === socket) wsRef.current = null;
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch {
        // HTTP Long-Polling assume integralmente
      }
    }

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [roomId, mode, applyRealtimeEvent]);

  // Envio garantido de ações discretas (Navegação, Cortina, Desfazer, Limpar, Notas, Cronômetro)
  const sendDiscreteAction = useCallback((action: Record<string, unknown>) => {
    const activeRoom = roomIdRef.current;

    if (bcRef.current) {
      try {
        bcRef.current.postMessage({
          ...action,
          __senderId: clientIdRef.current,
          __roomId: activeRoom,
        });
      } catch {
        // Ignora
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }

    pendingDiscreteActionsRef.current += 1;
    fetch('/api/cast/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        roomId: activeRoom,
        clientId: clientIdRef.current,
        action,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.version === 'number') {
          roomVersionRef.current = Math.max(roomVersionRef.current, data.version);
          setConnected(true);
        }
      })
      .catch(() => {
        // Reconciliado no próximo poll
      })
      .finally(() => {
        pendingDiscreteActionsRef.current = Math.max(
          0,
          pendingDiscreteActionsRef.current - 1
        );
      });
  }, []);

  // Envio coalescido de eventos contínuos (Laser Pointer, Spotlight, Traço de Desenho) sem empilhar requisições HTTP
  const flushContinuousQueue = useCallback(async () => {
    if (continuousInFlightRef.current) return;
    continuousInFlightRef.current = true;

    while (queuedContinuousActionRef.current) {
      const nextAction = queuedContinuousActionRef.current;
      queuedContinuousActionRef.current = null;
      try {
        const res = await fetch('/api/cast/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: roomIdRef.current,
            clientId: clientIdRef.current,
            action: nextAction,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.version === 'number') {
            roomVersionRef.current = Math.max(roomVersionRef.current, data.version);
          }
        }
      } catch {
        // Ignora falha transitória de frame intermediário
      }
    }

    continuousInFlightRef.current = false;
  }, []);

  const sendContinuousAction = useCallback(
    (action: Record<string, unknown>) => {
      const activeRoom = roomIdRef.current;
      if (bcRef.current) {
        try {
          bcRef.current.postMessage({
            ...action,
            __senderId: clientIdRef.current,
            __roomId: activeRoom,
          });
        } catch {
          // Ignora
        }
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(action));
      }

      queuedContinuousActionRef.current = action;
      flushContinuousQueue();
    },
    [flushContinuousQueue]
  );

  const openBroadcastModal = useCallback(() => {
    refreshNetworkInfo();
    setIsBroadcastModalOpen(true);
  }, [refreshNetworkInfo]);

  const closeBroadcastModal = useCallback(() => {
    setIsBroadcastModalOpen(false);
  }, []);

  const startPresenting = useCallback(
    (customRoomId?: string, initialPos?: { slideIndex: number; subStep: number }) => {
      const targetRoom = (customRoomId || roomIdRef.current || generateRoomCode())
        .trim()
        .toUpperCase();
      const clamped = initialPos
        ? clampPosition(initialPos.slideIndex, initialPos.subStep)
        : undefined;

      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      setRoomId(targetRoom);
      setMode('presenter');
      setIsBroadcastModalOpen(false);

      if (clamped) {
        setRoomState((prev) => ({
          ...prev,
          roomId: targetRoom,
          slideIndex: clamped.slideIndex,
          subStep: clamped.subStep,
          pointer: null,
        }));
      }

      registerPresenceHttp({
        targetMode: 'presenter',
        targetRoomId: targetRoom,
        initialSlideIndex: clamped?.slideIndex,
        initialSubStep: clamped?.subStep,
      });
    },
    [registerPresenceHttp]
  );

  /**
   * Transmite diretamente para 1 ou todas as telas detectadas na rede com um único clique!
   */
  const castToDevices = useCallback(
    async (
      targetClientIds: string[] | 'ALL',
      initialPos?: { slideIndex: number; subStep: number }
    ) => {
      const targetRoom = (roomIdRef.current || generateRoomCode()).trim().toUpperCase();
      const clamped = clampPosition(
        initialPos?.slideIndex ?? roomState.slideIndex,
        initialPos?.subStep ?? roomState.subStep
      );

      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      setRoomId(targetRoom);
      setMode('presenter');
      setIsBroadcastModalOpen(false);
      setRoomState((prev) => ({
        ...prev,
        roomId: targetRoom,
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
        pointer: null,
      }));

      try {
        const res = await fetch('/api/cast/summon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presenterClientId: clientIdRef.current,
            presenterLabel: deviceProfileRef.current.label,
            roomId: targetRoom,
            targetClientIds,
            slideIndex: clamped.slideIndex,
            subStep: clamped.subStep,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setConnected(true);
          if (data.roomState) {
            applyRoomSnapshot(data.roomState, false);
          }
          if (Array.isArray(data.devices)) {
            setNetworkDevices(
              data.devices.filter((d: NetworkDeviceInfo) => d.clientId !== clientIdRef.current)
            );
          }
        }
      } catch {
        // Reconciliado no próximo poll
      }
    },
    [roomState.slideIndex, roomState.subStep, applyRoomSnapshot]
  );

  const joinAsScreen = useCallback(
    (targetRoomId: string) => {
      const clean = targetRoomId.trim().toUpperCase();
      if (!clean) return;
      roomIdRef.current = clean;
      modeRef.current = 'screen';
      roomVersionRef.current = 0;
      setRoomId(clean);
      setMode('screen');
      setIsBroadcastModalOpen(false);
      registerPresenceHttp({ targetMode: 'screen', targetRoomId: clean });
    },
    [registerPresenceHttp]
  );

  const joinAsPresenter = useCallback(
    (targetRoomId: string) => {
      const clean = targetRoomId.trim().toUpperCase();
      if (!clean) return;
      roomIdRef.current = clean;
      modeRef.current = 'presenter';
      roomVersionRef.current = 0;
      setRoomId(clean);
      setMode('presenter');
      setIsBroadcastModalOpen(false);
      registerPresenceHttp({ targetMode: 'presenter', targetRoomId: clean });
    },
    [registerPresenceHttp]
  );

  const leaveBroadcast = useCallback(() => {
    modeRef.current = 'standalone';
    setMode('standalone');
    setIsBroadcastModalOpen(false);
    registerPresenceHttp({ targetMode: 'standalone', targetRoomId: roomIdRef.current });
  }, [registerPresenceHttp]);

  const goToPosition = useCallback(
    (slideIndex: number, subStep: number) => {
      const pos = clampPosition(slideIndex, subStep);
      setRoomState((prev) => ({
        ...prev,
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        pointer: null,
      }));
      sendDiscreteAction({
        type: 'nav:goto',
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        clearPointer: true,
      });
    },
    [sendDiscreteAction]
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
      sendDiscreteAction({ type: 'stage:blackout', blackout });
    },
    [sendDiscreteAction]
  );

  const setSpotlight = useCallback(
    (spotlight: SpotlightState | null) => {
      setRoomState((prev) => ({ ...prev, spotlight }));
      if (!spotlight) {
        queuedContinuousActionRef.current = null;
        sendDiscreteAction({ type: 'stage:spotlight', spotlight: null });
      } else {
        sendContinuousAction({ type: 'stage:spotlight', spotlight });
      }
    },
    [sendDiscreteAction, sendContinuousAction]
  );

  const emitPointer = useCallback(
    (active: boolean, x: number, y: number, color = '#dc143c') => {
      const pointerObj = active
        ? { active: true, x, y, color, updatedAt: Date.now() }
        : null;
      setRoomState((prev) => ({ ...prev, pointer: pointerObj }));

      const payload = {
        type: 'pointer:move',
        active,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        color,
      };

      if (!active) {
        queuedContinuousActionRef.current = null;
        sendDiscreteAction(payload);
      } else {
        sendContinuousAction(payload);
      }
    },
    [sendDiscreteAction, sendContinuousAction]
  );

  const upsertStroke = useCallback(
    (slideIndex: number, stroke: DrawingStroke) => {
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

      sendContinuousAction({
        type: 'draw:upsert',
        slideIndex,
        stroke,
      });
    },
    [sendContinuousAction]
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
      sendDiscreteAction({ type: 'draw:undo', slideIndex });
    },
    [sendDiscreteAction]
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
      sendDiscreteAction({ type: 'draw:clear', slideIndex });
    },
    [sendDiscreteAction]
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
      sendDiscreteAction({ type: 'slide:custom', patch });
    },
    [sendDiscreteAction]
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
      sendDiscreteAction({ type: 'notes:update', key, text });
    },
    [sendDiscreteAction]
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
      sendDiscreteAction({ type: 'timer:action', action });
    },
    [sendDiscreteAction]
  );

  const value: BroadcastContextValue = {
    myClientId: clientIdRef.current,
    mode,
    roomId,
    connected,
    roomState,
    networkDevices,
    isBroadcastModalOpen,
    networkInfo,
    openBroadcastModal,
    closeBroadcastModal,
    startPresenting,
    castToDevices,
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
    upsertStroke,
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
