import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import Peer, { DataConnection } from 'peerjs';
import {
  BroadcastMode,
  BroadcastNavState,
  BroadcastOverlayState,
  ClientPresence,
  DrawingStroke,
  NetworkDeviceInfo,
  PointerState,
  RemoteCastCommand,
  RoomSyncState,
  SlideCustomState,
  SpotlightState,
  TimerState,
} from './types';
import {
  clampPosition,
  getNextPosition,
  getPrevPosition,
  makeNoteKey,
  PRESENTATION_SLIDES,
} from './presentationMetadata';
import {
  StageInstanceConfig,
  StageInstanceProvider,
  useStageInstance,
} from '../StageInstanceContext';

export { StageInstanceProvider, useStageInstance };
export type { StageInstanceConfig };

const NOTES_STORAGE_KEY = 'missao_nepal_speaker_notes_v1';
const CLIENT_ID_KEY = 'missao_nepal_client_id_v1';
const NET_HASH_KEY = 'missao_nepal_net_hash_v3';

const LAN_SLOT_COUNT = 6;
const PEER_PREFIX = 'mn-nepal-v3';

const PEER_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  },
};

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

function hashStringHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function normalizePublicIpForLanMatch(rawIp: string): string {
  const trimmed = rawIp.trim().toLowerCase();
  if (!trimmed) return 'localdefault';
  // Se for IPv6, agrupa pelo prefixo /64 do roteador Wi-Fi (4 primeiros blocos)
  if (trimmed.includes(':')) {
    return trimmed.split(':').slice(0, 4).join(':');
  }
  return trimmed;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Descobre o IP público do roteador Wi-Fi atual (IPv4 prioritário) para agrupar automaticamente
 * celulares, computadores e Smart TVs conectados na mesma rede Wi-Fi — funcionando tanto na Vercel
 * quanto entre domínios diferentes do Google AI Studio (`ais-dev` ↔ `ais-pre`) sem backend!
 */
async function resolvePublicNetworkHash(): Promise<string> {
  if (typeof window === 'undefined') return 'localdefault';
  try {
    const cached = window.sessionStorage.getItem(NET_HASH_KEY);
    if (cached) return cached;
  } catch {
    // Ignora
  }

  let resolvedIp = '';

  // 1. ipify IPv4-only (garante mesmo IP NAT em redes dual-stack entre PC e Celular)
  try {
    const res = await fetchWithTimeout('https://api.ipify.org?format=json', 2400);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) resolvedIp = String(data.ip);
    }
  } catch {
    // Tenta fallback
  }

  // 2. api4.ipify.org fallback
  if (!resolvedIp) {
    try {
      const res = await fetchWithTimeout('https://api4.ipify.org?format=json', 2400);
      if (res.ok) {
        const data = await res.json();
        if (data?.ip) resolvedIp = String(data.ip);
      }
    } catch {
      // Tenta fallback
    }
  }

  // 3. Cloudflare trace fallback
  if (!resolvedIp) {
    try {
      const res = await fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace', 2400);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/^ip=(.+)$/m);
        if (match?.[1]) resolvedIp = match[1].trim();
      }
    } catch {
      // Tenta fallback padrão
    }
  }

  const hash = resolvedIp
    ? hashStringHex(normalizePublicIpForLanMatch(resolvedIp))
    : 'localdefault';

  try {
    window.sessionStorage.setItem(NET_HASH_KEY, hash);
  } catch {
    // Ignora
  }

  return hash;
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

function sanitizePeerRoomToken(roomId: string): string {
  return roomId.replace(/[^A-Z0-9_-]/gi, '').toUpperCase() || '0000';
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

// ============================================================================
// 1. CONTEXTO DE NAVEGAÇÃO E AÇÕES ESTÁVEIS (CONSUMIDO PELO DECK E SLIDES)
// Nunca atualiza em movimentos de laser pointer, desenhos, cronômetro ou busca Wi-Fi!
// ============================================================================
export interface BroadcastContextValue {
  myClientId: string;
  mode: BroadcastMode;
  roomId: string;
  roomState: BroadcastNavState;
  openBroadcastModal: () => void;
  closeBroadcastModal: () => void;
  reportStandaloneDeckPosition: (slideIndex: number, subStep: number) => void;
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
  updateNoteForStep: (slideIndex: number, subStep: number, text: string) => void;
  timerAction: (action: 'start' | 'pause' | 'reset') => void;
  scanNetworkDevices: () => Promise<void>;
}

// ============================================================================
// 2. CONTEXTO DE CAMADA VETORIAL / OVERLAY AO VIVO (CONSUMIDO APENAS PELO SVG E CONSOLE)
// ============================================================================
export interface BroadcastOverlayContextValue extends BroadcastOverlayState {}

// ============================================================================
// 3. CONTEXTO DE DESCOBERTA NA REDE, PRESENÇA E NOTAS (MODAL E CONSOLE)
// ============================================================================
export interface BroadcastDiscoveryContextValue {
  connected: boolean;
  isBroadcastModalOpen: boolean;
  isScanningNetwork: boolean;
  networkDevices: NetworkDeviceInfo[];
  presence: ClientPresence[];
  customNotes: Record<string, string>;
  getNoteForStep: (slideIndex: number, subStep: number) => string;
}

const BroadcastContext = createContext<BroadcastContextValue | null>(null);
const BroadcastOverlayContext = createContext<BroadcastOverlayContextValue | null>(null);
const BroadcastDiscoveryContext = createContext<BroadcastDiscoveryContextValue | null>(null);

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

  // Estado 1: Navegação & Controles Contextuais de Slide (ultra-leve)
  const [navState, setNavState] = useState<BroadcastNavState>(() => ({
    roomId: initialUrlParams.room,
    slideIndex: 0,
    subStep: 0,
    slideCustomState: {
      economyMetric: 'perCapita',
      casteTier: null,
      timelineLens: 'auto',
    },
  }));

  // Estado 2: Laser Pointer, Desenho Vetorial, Lupa, Cortina e Cronômetro
  const [overlayState, setOverlayState] = useState<BroadcastOverlayState>(() => ({
    blackout: false,
    spotlight: null,
    pointer: null,
    drawingsBySlide: {},
    timer: {
      running: false,
      elapsedMs: 0,
      startedAt: null,
    },
    serverTimeOffsetMs: 0,
  }));

  // Estado 3: Descoberta P2P na Rede, Presença, Modal e Notas
  const [connected, setConnected] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [isScanningNetwork, setIsScanningNetwork] = useState<boolean>(false);
  const [networkDevices, setNetworkDevices] = useState<NetworkDeviceInfo[]>([]);
  const [presence, setPresence] = useState<ClientPresence[]>([]);
  const [customNotes, setCustomNotes] = useState<Record<string, string>>(() => loadSavedNotes());
  const [netHash, setNetHash] = useState<string>('');
  const [p2pActivated, setP2pActivated] = useState<boolean>(() => initialUrlParams.mode !== 'standalone');

  // Refs espelhados para que 100% dos callbacks tenham identidade estável (zero re-renders em cascata)
  const clientIdRef = useRef<string>(getOrCreateClientId());
  const deviceProfileRef = useRef(detectDeviceProfile());
  const modeRef = useRef<BroadcastMode>(mode);
  const roomIdRef = useRef<string>(roomId);
  const navStateRef = useRef<BroadcastNavState>(navState);
  const overlayStateRef = useRef<BroadcastOverlayState>(overlayState);
  const customNotesRef = useRef<Record<string, string>>(customNotes);
  const presenceRef = useRef<ClientPresence[]>(presence);
  const standaloneDeckPosRef = useRef<{ slideIndex: number; subStep: number }>({
    slideIndex: 0,
    subStep: 0,
  });
  const roomVersionRef = useRef<number>(1);

  // Refs de transporte WebRTC (PeerJS) e BroadcastChannel
  const bcRef = useRef<BroadcastChannel | null>(null);
  const roomPeerRef = useRef<Peer | null>(null);
  const isRoomHubRef = useRef<boolean>(false);
  const hubConnectionsRef = useRef<Map<string, { conn: DataConnection; meta: ClientPresence }>>(
    new Map()
  );
  const spokeConnRef = useRef<DataConnection | null>(null);

  const beaconPeerRef = useRef<Peer | null>(null);
  const myBeaconIdRef = useRef<string>('');
  const scannerPeerRef = useRef<Peer | null>(null);
  const discoveredMapRef = useRef<Map<string, NetworkDeviceInfo>>(new Map());
  const netHashRef = useRef<string>('');

  // Controle de cadência ~45fps para canais contínuos WebRTC (evita fila SCTP em celulares)
  const lastContinuousSentAtRef = useRef<number>(0);
  const trailingContinuousTimerRef = useRef<number | null>(null);
  const pendingContinuousMsgRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    navStateRef.current = navState;
  }, [navState]);

  useEffect(() => {
    overlayStateRef.current = overlayState;
  }, [overlayState]);

  useEffect(() => {
    customNotesRef.current = customNotes;
  }, [customNotes]);

  useEffect(() => {
    presenceRef.current = presence;
  }, [presence]);

  // Ativação diferida em 900ms quando em modo standalone para garantir 60fps puros na animação de abertura
  useEffect(() => {
    if (p2pActivated) return;
    const t = window.setTimeout(() => setP2pActivated(true), 900);
    return () => window.clearTimeout(t);
  }, [p2pActivated]);

  // Resolve hash da rede Wi-Fi pública (uma única vez por sessão)
  useEffect(() => {
    if (!p2pActivated) return;
    let cancelled = false;
    resolvePublicNetworkHash().then((hash) => {
      if (!cancelled) {
        netHashRef.current = hash;
        setNetHash(hash);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [p2pActivated]);

  // Sincroniza URL da barra de endereços sem recarregar
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

  const buildMyDeviceInfo = useCallback((): NetworkDeviceInfo => {
    const activeSlide =
      modeRef.current === 'standalone'
        ? standaloneDeckPosRef.current.slideIndex
        : navStateRef.current.slideIndex;
    return {
      clientId: clientIdRef.current,
      beaconPeerId: myBeaconIdRef.current || undefined,
      deviceLabel: deviceProfileRef.current.label,
      deviceType: deviceProfileRef.current.type,
      screenResolution: deviceProfileRef.current.resolution,
      mode: modeRef.current,
      roomId: roomIdRef.current,
      slideIndex: activeSlide,
      sameNetwork: true,
      lastSeenAt: Date.now(),
    };
  }, []);

  const buildFullRoomSnapshot = useCallback((): RoomSyncState & { serverTime: number } => {
    const nav = navStateRef.current;
    const ov = overlayStateRef.current;
    return {
      roomId: roomIdRef.current,
      version: roomVersionRef.current,
      slideIndex: nav.slideIndex,
      subStep: nav.subStep,
      slideCustomState: nav.slideCustomState,
      blackout: ov.blackout,
      spotlight: ov.spotlight,
      pointer: ov.pointer,
      drawingsBySlide: ov.drawingsBySlide,
      timer: ov.timer,
      serverTimeOffsetMs: 0,
      customNotes: customNotesRef.current,
      presence: presenceRef.current,
      serverTime: Date.now(),
    };
  }, []);

  const syncDiscoveredStateFromMap = useCallback(() => {
    const now = Date.now();
    const list: NetworkDeviceInfo[] = [];
    discoveredMapRef.current.forEach((dev, id) => {
      if (id === clientIdRef.current) return;
      if (now - dev.lastSeenAt > 30000) {
        discoveredMapRef.current.delete(id);
        return;
      }
      list.push(dev);
    });
    list.sort((a, b) => a.deviceLabel.localeCompare(b.deviceLabel));
    setNetworkDevices(list);
  }, []);

  const upsertDiscoveredDevice = useCallback(
    (dev: NetworkDeviceInfo | undefined | null) => {
      if (!dev || !dev.clientId || dev.clientId === clientIdRef.current) return;
      const existing = discoveredMapRef.current.get(dev.clientId);
      discoveredMapRef.current.set(dev.clientId, {
        ...existing,
        ...dev,
        beaconPeerId: dev.beaconPeerId || existing?.beaconPeerId,
        sameNetwork: true,
        lastSeenAt: Date.now(),
      });
      syncDiscoveredStateFromMap();
    },
    [syncDiscoveredStateFromMap]
  );

  const applyRemoteCastCommand = useCallback((cmd: RemoteCastCommand) => {
    if (!cmd || !cmd.roomId) return;
    const cleanRoom = sanitizePeerRoomToken(cmd.roomId);
    const clamped = clampPosition(cmd.slideIndex ?? 0, cmd.subStep ?? 0);

    roomIdRef.current = cleanRoom;
    modeRef.current = cmd.targetMode;
    setP2pActivated(true);
    setRoomId(cleanRoom);
    setMode(cmd.targetMode);
    setIsBroadcastModalOpen(false);

    setNavState((prev) => ({
      ...prev,
      roomId: cleanRoom,
      slideIndex: clamped.slideIndex,
      subStep: clamped.subStep,
    }));
    setOverlayState((prev) => ({
      ...prev,
      pointer: null,
    }));
  }, []);

  const applyRoomSnapshot = useCallback((st: Record<string, any>) => {
    if (!st) return;
    const clamped = clampPosition(
      typeof st.slideIndex === 'number' ? st.slideIndex : 0,
      typeof st.subStep === 'number' ? st.subStep : 0
    );
    const offset = typeof st.serverTime === 'number' ? st.serverTime - Date.now() : 0;

    setNavState((prev) => ({
      roomId: st.roomId || prev.roomId,
      slideIndex: clamped.slideIndex,
      subStep: clamped.subStep,
      slideCustomState: st.slideCustomState || prev.slideCustomState,
    }));

    setOverlayState((prev) => ({
      blackout: Boolean(st.blackout),
      spotlight: st.spotlight ?? null,
      pointer: st.pointer ?? null,
      drawingsBySlide: st.drawingsBySlide || prev.drawingsBySlide,
      timer: st.timer || prev.timer,
      serverTimeOffsetMs: offset,
    }));

    if (st.customNotes && typeof st.customNotes === 'object') {
      setCustomNotes((prev) => ({ ...prev, ...st.customNotes }));
    }

    if (Array.isArray(st.presence)) {
      setPresence(st.presence);
    }
  }, []);

  const applyRealtimeRoomMessage = useCallback(
    (msg: Record<string, any>) => {
      const type = String(msg.type || '');

      if (type === 'lan:summon' && msg.command) {
        applyRemoteCastCommand(msg.command as RemoteCastCommand);
        return;
      }

      if (type === 'room:init' && msg.state) {
        applyRoomSnapshot(msg.state);
        return;
      }

      if (type === 'room:presence' && Array.isArray(msg.presence)) {
        setPresence(msg.presence);
        return;
      }

      if (type === 'nav:goto') {
        const pos = clampPosition(Number(msg.slideIndex) || 0, Number(msg.subStep) || 0);
        setNavState((prev) =>
          prev.slideIndex === pos.slideIndex && prev.subStep === pos.subStep
            ? prev
            : {
                ...prev,
                slideIndex: pos.slideIndex,
                subStep: pos.subStep,
              }
        );
        if (msg.clearPointer) {
          setOverlayState((prev) => (prev.pointer ? { ...prev, pointer: null } : prev));
        }
        return;
      }

      if (type === 'stage:blackout') {
        const nextBlackout = Boolean(msg.blackout);
        setOverlayState((prev) =>
          prev.blackout === nextBlackout ? prev : { ...prev, blackout: nextBlackout }
        );
        return;
      }

      if (type === 'stage:spotlight') {
        setOverlayState((prev) => ({ ...prev, spotlight: msg.spotlight ?? null }));
        return;
      }

      if (type === 'pointer:move') {
        const nextPointer: PointerState | null = msg.active
          ? {
              active: true,
              x: Number(msg.x) || 0,
              y: Number(msg.y) || 0,
              color: String(msg.color || '#dc143c'),
              updatedAt: Date.now(),
            }
          : null;
        setOverlayState((prev) => ({ ...prev, pointer: nextPointer }));
        return;
      }

      if (type === 'draw:upsert') {
        const sIdx = Number(msg.slideIndex) || 0;
        const stroke = msg.stroke as DrawingStroke | undefined;
        if (!stroke || !stroke.id) return;
        setOverlayState((prev) => {
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

      if (type === 'draw:undo') {
        const sIdx = Number(msg.slideIndex) || 0;
        setOverlayState((prev) => {
          const list = [...(prev.drawingsBySlide[sIdx] || [])];
          list.pop();
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

      if (type === 'draw:clear') {
        const sIdx = Number(msg.slideIndex) || 0;
        setOverlayState((prev) => ({
          ...prev,
          drawingsBySlide: {
            ...prev.drawingsBySlide,
            [sIdx]: [],
          },
        }));
        return;
      }

      if (type === 'slide:custom' && msg.patch) {
        setNavState((prev) => ({
          ...prev,
          slideCustomState: {
            ...prev.slideCustomState,
            ...msg.patch,
          },
        }));
        return;
      }

      if (type === 'notes:update') {
        const key = String(msg.key || '');
        if (!key) return;
        const text = String(msg.text ?? '');
        setCustomNotes((prev) => {
          const merged = { ...prev, [key]: text };
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // Ignora quota
            }
          }
          return merged;
        });
        return;
      }

      if (type === 'timer:sync' && msg.timer) {
        const offset = typeof msg.serverTime === 'number' ? msg.serverTime - Date.now() : 0;
        setOverlayState((prev) => ({
          ...prev,
          timer: msg.timer as TimerState,
          serverTimeOffsetMs: offset,
        }));
      }
    },
    [applyRemoteCastCommand, applyRoomSnapshot]
  );

  // Recalcula e difunde lista de presença quando este nó atua como Hub WebRTC da sala
  const recomputeAndBroadcastHubPresence = useCallback(() => {
    if (!isRoomHubRef.current) return;
    const list: ClientPresence[] = [];

    if (modeRef.current === 'presenter' || modeRef.current === 'screen') {
      list.push({
        clientId: clientIdRef.current,
        role: modeRef.current,
        deviceLabel: deviceProfileRef.current.label,
        connectedAt: Date.now(),
      });
    }

    hubConnectionsRef.current.forEach(({ conn, meta }) => {
      if (conn.open && meta.clientId !== clientIdRef.current) {
        list.push(meta);
      }
    });

    setPresence(list);
    const packet = { type: 'room:presence', presence: list };
    hubConnectionsRef.current.forEach(({ conn }) => {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch {
          // Ignora
        }
      }
    });
  }, []);

  // ==========================================================================
  // CANAL LOCAL INSTANTÂNEO (BroadcastChannel para múltiplas abas / janelas HDMI no mesmo PC)
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const bc = new BroadcastChannel(`${PEER_PREFIX}-bc`);
    bcRef.current = bc;

    bc.onmessage = (ev) => {
      const data = ev.data;
      if (!data || data.__senderId === clientIdRef.current) return;

      if (data.type === 'bc:ping') {
        upsertDiscoveredDevice(data.fromDevice);
        bc.postMessage({
          type: 'bc:pong',
          __senderId: clientIdRef.current,
          device: buildMyDeviceInfo(),
        });
        return;
      }

      if (data.type === 'bc:pong' && data.device) {
        upsertDiscoveredDevice(data.device);
        return;
      }

      if (data.type === 'bc:summon' && data.command) {
        const targets: string[] | 'ALL' = data.targetClientIds;
        if (
          targets === 'ALL' ||
          (Array.isArray(targets) && targets.includes(clientIdRef.current))
        ) {
          applyRemoteCastCommand(data.command as RemoteCastCommand);
        }
        return;
      }

      if (data.__roomId && data.__roomId === roomIdRef.current) {
        applyRealtimeRoomMessage(data);
      }
    };

    // Anuncia esta aba imediatamente para outras abas abertas
    bc.postMessage({
      type: 'bc:ping',
      __senderId: clientIdRef.current,
      fromDevice: buildMyDeviceInfo(),
    });

    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [applyRealtimeRoomMessage, applyRemoteCastCommand, buildMyDeviceInfo, upsertDiscoveredDevice]);

  // ==========================================================================
  // MOTOR WEBRTC 1: SALA DE SINCRONIZAÇÃO EM TEMPO REAL (HUB / SPOKE AUTOMÁTICO)
  // Funciona em Vercel estático, Google AI Studio (ais-dev ↔ ais-pre), 4G/5G e Wi-Fi!
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !p2pActivated) return;

    let cancelled = false;
    let reconnectTimer: number | null = null;
    const cleanRoom = sanitizePeerRoomToken(roomId);
    const hubPeerId = `${PEER_PREFIX}-room-${cleanRoom}`;

    const cleanupRoomPeers = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      hubConnectionsRef.current.forEach(({ conn }) => {
        try {
          conn.close();
        } catch {
          // Ignora
        }
      });
      hubConnectionsRef.current.clear();

      if (spokeConnRef.current) {
        try {
          spokeConnRef.current.close();
        } catch {
          // Ignora
        }
        spokeConnRef.current = null;
      }

      if (roomPeerRef.current) {
        try {
          roomPeerRef.current.destroy();
        } catch {
          // Ignora
        }
        roomPeerRef.current = null;
      }
      isRoomHubRef.current = false;
    };

    const connectAsSpoke = () => {
      if (cancelled) return;
      cleanupRoomPeers();

      const spokePeer = new Peer(PEER_CONFIG);
      roomPeerRef.current = spokePeer;
      isRoomHubRef.current = false;

      spokePeer.on('open', () => {
        if (cancelled) return;
        const conn = spokePeer.connect(hubPeerId, { reliable: true });
        spokeConnRef.current = conn;

        conn.on('open', () => {
          if (cancelled) return;
          setConnected(true);
          const effectiveRole: 'presenter' | 'screen' =
            modeRef.current === 'presenter' ? 'presenter' : 'screen';
          conn.send({
            type: 'peer:hello',
            clientId: clientIdRef.current,
            role: effectiveRole,
            deviceLabel: deviceProfileRef.current.label,
            initialPos:
              modeRef.current === 'presenter'
                ? {
                    slideIndex: navStateRef.current.slideIndex,
                    subStep: navStateRef.current.subStep,
                  }
                : undefined,
          });
        });

        conn.on('data', (raw: any) => {
          if (cancelled || !raw || typeof raw !== 'object') return;
          applyRealtimeRoomMessage(raw as Record<string, any>);
        });

        conn.on('close', () => {
          if (cancelled) return;
          setConnected(false);
          // Caso o Hub anterior tenha fechado/recarregado, renegocia liderança após breve jitter
          reconnectTimer = window.setTimeout(() => {
            bootRoomTopology();
          }, 380 + Math.floor(Math.random() * 320));
        });

        conn.on('error', () => {
          if (cancelled) return;
          reconnectTimer = window.setTimeout(() => {
            bootRoomTopology();
          }, 700);
        });
      });

      spokePeer.on('error', () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimer = window.setTimeout(() => {
          bootRoomTopology();
        }, 900);
      });
    };

    const bootRoomTopology = () => {
      if (cancelled) return;
      cleanupRoomPeers();

      const candidateHub = new Peer(hubPeerId, PEER_CONFIG);
      roomPeerRef.current = candidateHub;

      candidateHub.on('open', () => {
        if (cancelled) return;
        isRoomHubRef.current = true;
        setConnected(true);
        recomputeAndBroadcastHubPresence();
      });

      candidateHub.on('connection', (conn) => {
        if (cancelled) return;

        conn.on('data', (raw: any) => {
          if (cancelled || !raw || typeof raw !== 'object') return;
          const msg = raw as Record<string, any>;

          if (msg.type === 'peer:hello') {
            const remoteRole: 'presenter' | 'screen' =
              msg.role === 'presenter' ? 'presenter' : 'screen';
            const remoteClientId = String(msg.clientId || conn.peer);

            hubConnectionsRef.current.set(conn.peer, {
              conn,
              meta: {
                clientId: remoteClientId,
                role: remoteRole,
                deviceLabel: String(msg.deviceLabel || 'Dispositivo Conectado'),
                connectedAt: Date.now(),
              },
            });

            // Se esta tela estava em modo standalone (ex: usuário escaneou o QR Code "QR para Celular" ou digitou o código),
            // promove automaticamente esta tela para Telão ('screen') preservando o slide em que ela estava!
            if (modeRef.current === 'standalone' && remoteRole === 'presenter') {
              const localPos = clampPosition(
                standaloneDeckPosRef.current.slideIndex,
                standaloneDeckPosRef.current.subStep
              );
              modeRef.current = 'screen';
              setMode('screen');
              setIsBroadcastModalOpen(false);
              navStateRef.current = {
                ...navStateRef.current,
                roomId: cleanRoom,
                slideIndex: localPos.slideIndex,
                subStep: localPos.subStep,
              };
              setNavState(navStateRef.current);
            }

            recomputeAndBroadcastHubPresence();

            // Envia snapshot completo da sala imediatamente ao novo participante
            try {
              conn.send({
                type: 'room:init',
                state: buildFullRoomSnapshot(),
              });
            } catch {
              // Ignora
            }
            return;
          }

          // Aplica no próprio Hub
          applyRealtimeRoomMessage(msg);

          // Retransmite imediatamente para todos os outros peers da sala (ex: múltiplos telões + controles)
          hubConnectionsRef.current.forEach(({ conn: peerConn }, peerKey) => {
            if (peerKey !== conn.peer && peerConn.open) {
              try {
                peerConn.send(msg);
              } catch {
                // Ignora
              }
            }
          });
        });

        conn.on('close', () => {
          hubConnectionsRef.current.delete(conn.peer);
          recomputeAndBroadcastHubPresence();
        });

        conn.on('error', () => {
          hubConnectionsRef.current.delete(conn.peer);
          recomputeAndBroadcastHubPresence();
        });
      });

      candidateHub.on('error', (err: any) => {
        if (cancelled) return;
        if (err?.type === 'unavailable-id') {
          // Já existe um Hub ativo para esta sala (ex: o Telão ou outro Apresentador): conecta como Spoke!
          connectAsSpoke();
          return;
        }
        setConnected(false);
        reconnectTimer = window.setTimeout(() => {
          bootRoomTopology();
        }, 1200);
      });
    };

    bootRoomTopology();

    return () => {
      cancelled = true;
      cleanupRoomPeers();
    };
  }, [
    p2pActivated,
    roomId,
    applyRealtimeRoomMessage,
    buildFullRoomSnapshot,
    recomputeAndBroadcastHubPresence,
  ]);

  // Atualiza presença quando o próprio modo do Hub muda (standalone <-> screen <-> presenter)
  useEffect(() => {
    if (isRoomHubRef.current) {
      recomputeAndBroadcastHubPresence();
    } else if (spokeConnRef.current?.open) {
      const effectiveRole: 'presenter' | 'screen' =
        mode === 'presenter' ? 'presenter' : 'screen';
      try {
        spokeConnRef.current.send({
          type: 'peer:hello',
          clientId: clientIdRef.current,
          role: effectiveRole,
          deviceLabel: deviceProfileRef.current.label,
        });
      } catch {
        // Ignora
      }
    }
  }, [mode, recomputeAndBroadcastHubPresence]);

  // ==========================================================================
  // MOTOR WEBRTC 2: BEACON DE DESCOBERTA AUTOMÁTICA NA REDE WI-FI (SLOTS 0..5)
  // Qualquer computador/TV/celular com a apresentação aberta anuncia presença no lobby
  // do IP público da rede Wi-Fi e aceita comando direto de "Transmitir"!
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !p2pActivated || !netHash) return;
    if (mode === 'presenter') {
      // Apresentadores escaneiam telas, não precisam ocupar slot de Telão receptor
      if (beaconPeerRef.current) {
        beaconPeerRef.current.destroy();
        beaconPeerRef.current = null;
        myBeaconIdRef.current = '';
      }
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;

    const tryClaimSlot = (slotIndex: number) => {
      if (cancelled) return;
      if (slotIndex >= LAN_SLOT_COUNT) {
        // Todos os 6 slots ocupados; tenta novamente em 8s
        retryTimer = window.setTimeout(() => tryClaimSlot(0), 8000);
        return;
      }

      const candidateId = `${PEER_PREFIX}-lan-${netHash}-s${slotIndex}`;
      const p = new Peer(candidateId, PEER_CONFIG);
      beaconPeerRef.current = p;

      p.on('open', (id) => {
        if (cancelled) {
          p.destroy();
          return;
        }
        myBeaconIdRef.current = id;
      });

      p.on('connection', (conn) => {
        if (cancelled) return;
        conn.on('data', (raw: any) => {
          if (cancelled || !raw || typeof raw !== 'object') return;
          const msg = raw as Record<string, any>;

          if (msg.type === 'lan:ping') {
            if (msg.fromDevice) {
              upsertDiscoveredDevice(msg.fromDevice as NetworkDeviceInfo);
            }
            try {
              conn.send({
                type: 'lan:pong',
                device: buildMyDeviceInfo(),
              });
            } catch {
              // Ignora
            }
            return;
          }

          if (msg.type === 'lan:summon' && msg.command) {
            try {
              conn.send({
                type: 'lan:ack',
                clientId: clientIdRef.current,
              });
            } catch {
              // Ignora
            }
            applyRemoteCastCommand(msg.command as RemoteCastCommand);
          }
        });
      });

      p.on('error', (err: any) => {
        if (cancelled) return;
        try {
          p.destroy();
        } catch {
          // Ignora
        }
        if (err?.type === 'unavailable-id') {
          tryClaimSlot(slotIndex + 1);
        } else {
          retryTimer = window.setTimeout(() => tryClaimSlot(0), 3000);
        }
      });
    };

    tryClaimSlot(0);

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (beaconPeerRef.current) {
        try {
          beaconPeerRef.current.destroy();
        } catch {
          // Ignora
        }
        beaconPeerRef.current = null;
        myBeaconIdRef.current = '';
      }
    };
  }, [
    p2pActivated,
    netHash,
    mode,
    applyRemoteCastCommand,
    buildMyDeviceInfo,
    upsertDiscoveredDevice,
  ]);

  // Garante um Peer de saída reutilizável para escaneamento rápido da rede Wi-Fi
  const ensureScannerPeer = useCallback((): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      const existing = scannerPeerRef.current;
      if (existing && !existing.destroyed && !existing.disconnected && existing.id) {
        resolve(existing);
        return;
      }
      if (existing) {
        try {
          existing.destroy();
        } catch {
          // Ignora
        }
      }
      const p = new Peer(PEER_CONFIG);
      scannerPeerRef.current = p;
      const timeout = window.setTimeout(() => {
        reject(new Error('Peer scan timeout'));
      }, 4500);
      p.once('open', () => {
        window.clearTimeout(timeout);
        resolve(p);
      });
      p.once('error', (err) => {
        window.clearTimeout(timeout);
        reject(err);
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scannerPeerRef.current) {
        try {
          scannerPeerRef.current.destroy();
        } catch {
          // Ignora
        }
        scannerPeerRef.current = null;
      }
    };
  }, []);

  /**
   * Varre instantaneamente todas as telas abertas na mesma rede Wi-Fi (via slots WebRTC + BroadcastChannel)
   */
  const scanNetworkDevices = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsScanningNetwork(true);

    // 1. Ping instantâneo em abas locais
    if (bcRef.current) {
      try {
        bcRef.current.postMessage({
          type: 'bc:ping',
          __senderId: clientIdRef.current,
          fromDevice: buildMyDeviceInfo(),
        });
      } catch {
        // Ignora
      }
    }

    try {
      const activeHash = netHashRef.current || (await resolvePublicNetworkHash());
      netHashRef.current = activeHash;
      if (!netHash) setNetHash(activeHash);

      const scanner = await ensureScannerPeer();
      const myDevice = buildMyDeviceInfo();

      const probes: Promise<void>[] = [];
      for (let s = 0; s < LAN_SLOT_COUNT; s++) {
        const targetBeaconId = `${PEER_PREFIX}-lan-${activeHash}-s${s}`;
        if (targetBeaconId === myBeaconIdRef.current) continue;

        probes.push(
          new Promise<void>((resolveProbe) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              resolveProbe();
            };

            const timer = window.setTimeout(() => {
              try {
                conn.close();
              } catch {
                // Ignora
              }
              finish();
            }, 1600);

            const conn = scanner.connect(targetBeaconId, { reliable: true });

            conn.on('open', () => {
              try {
                conn.send({ type: 'lan:ping', fromDevice: myDevice });
              } catch {
                // Ignora
              }
            });

            conn.on('data', (raw: any) => {
              if (raw && typeof raw === 'object' && raw.type === 'lan:pong' && raw.device) {
                upsertDiscoveredDevice({
                  ...(raw.device as NetworkDeviceInfo),
                  beaconPeerId: targetBeaconId,
                });
              }
              window.clearTimeout(timer);
              window.setTimeout(() => {
                try {
                  conn.close();
                } catch {
                  // Ignora
                }
              }, 80);
              finish();
            });

            conn.on('error', () => {
              window.clearTimeout(timer);
              finish();
            });

            conn.on('close', () => {
              window.clearTimeout(timer);
              finish();
            });
          })
        );
      }

      await Promise.all(probes);
      syncDiscoveredStateFromMap();
    } catch {
      // Silencioso caso offline
    } finally {
      setIsScanningNetwork(false);
    }
  }, [buildMyDeviceInfo, ensureScannerPeer, netHash, syncDiscoveredStateFromMap, upsertDiscoveredDevice]);

  // Varredura automática APENAS quando o modal de transmissão está aberto ou no Console sem telão conectado
  // (Zero tráfego de varredura durante a apresentação normal dos slides!)
  useEffect(() => {
    const screensConnected = presence.some((p) => p.role === 'screen');
    const shouldAutoScan =
      isBroadcastModalOpen || (mode === 'presenter' && !screensConnected);

    if (!shouldAutoScan) return;

    setP2pActivated(true);
    scanNetworkDevices();

    const intervalMs = isBroadcastModalOpen ? 4500 : 7500;
    const id = window.setInterval(() => {
      scanNetworkDevices();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [isBroadcastModalOpen, mode, presence, scanNetworkDevices]);

  // ==========================================================================
  // ENVIO DE EVENTOS DE SALA (DISCRETOS E CONTÍNUOS A ~45FPS)
  // ==========================================================================
  const transmitPacketNow = useCallback((packet: Record<string, unknown>) => {
    const activeRoom = roomIdRef.current;

    if (bcRef.current) {
      try {
        bcRef.current.postMessage({
          ...packet,
          __senderId: clientIdRef.current,
          __roomId: activeRoom,
        });
      } catch {
        // Ignora
      }
    }

    if (isRoomHubRef.current) {
      hubConnectionsRef.current.forEach(({ conn }) => {
        if (conn.open) {
          try {
            conn.send(packet);
          } catch {
            // Ignora
          }
        }
      });
    } else if (spokeConnRef.current?.open) {
      try {
        spokeConnRef.current.send(packet);
      } catch {
        // Ignora
      }
    }
  }, []);

  const sendContinuousPacket = useCallback(
    (packet: Record<string, unknown>) => {
      const now = performance.now();
      const elapsed = now - lastContinuousSentAtRef.current;

      if (elapsed >= 22) {
        lastContinuousSentAtRef.current = now;
        pendingContinuousMsgRef.current = null;
        if (trailingContinuousTimerRef.current !== null) {
          window.clearTimeout(trailingContinuousTimerRef.current);
          trailingContinuousTimerRef.current = null;
        }
        transmitPacketNow(packet);
      } else {
        pendingContinuousMsgRef.current = packet;
        if (trailingContinuousTimerRef.current === null) {
          trailingContinuousTimerRef.current = window.setTimeout(() => {
            trailingContinuousTimerRef.current = null;
            lastContinuousSentAtRef.current = performance.now();
            const latest = pendingContinuousMsgRef.current;
            pendingContinuousMsgRef.current = null;
            if (latest) transmitPacketNow(latest);
          }, 22 - elapsed);
        }
      }
    },
    [transmitPacketNow]
  );

  // ==========================================================================
  // AÇÕES PÚBLICAS ESTÁVEIS (IDENTIDADE IMUTÁVEL)
  // ==========================================================================
  const openBroadcastModal = useCallback(() => {
    setP2pActivated(true);
    setIsBroadcastModalOpen(true);
  }, []);

  const closeBroadcastModal = useCallback(() => {
    setIsBroadcastModalOpen(false);
  }, []);

  const reportStandaloneDeckPosition = useCallback((slideIndex: number, subStep: number) => {
    standaloneDeckPosRef.current = { slideIndex, subStep };
  }, []);

  const startPresenting = useCallback(
    (customRoomId?: string, initialPos?: { slideIndex: number; subStep: number }) => {
      const targetRoom = sanitizePeerRoomToken(
        customRoomId || roomIdRef.current || generateRoomCode()
      );
      const fallbackPos =
        modeRef.current === 'standalone'
          ? standaloneDeckPosRef.current
          : {
              slideIndex: navStateRef.current.slideIndex,
              subStep: navStateRef.current.subStep,
            };
      const clamped = clampPosition(
        initialPos?.slideIndex ?? fallbackPos.slideIndex,
        initialPos?.subStep ?? fallbackPos.subStep
      );

      setP2pActivated(true);
      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      setRoomId(targetRoom);
      setMode('presenter');
      setIsBroadcastModalOpen(false);

      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        roomId: targetRoom,
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);
      setOverlayState((prev) => ({ ...prev, pointer: null }));

      transmitPacketNow({
        type: 'nav:goto',
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
        clearPointer: true,
      });
    },
    [transmitPacketNow]
  );

  const castToDevices = useCallback(
    async (
      targetClientIds: string[] | 'ALL',
      initialPos?: { slideIndex: number; subStep: number }
    ) => {
      const targetRoom = sanitizePeerRoomToken(roomIdRef.current || generateRoomCode());
      const fallbackPos =
        modeRef.current === 'standalone'
          ? standaloneDeckPosRef.current
          : {
              slideIndex: navStateRef.current.slideIndex,
              subStep: navStateRef.current.subStep,
            };
      const clamped = clampPosition(
        initialPos?.slideIndex ?? fallbackPos.slideIndex,
        initialPos?.subStep ?? fallbackPos.subStep
      );

      setP2pActivated(true);
      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      setRoomId(targetRoom);
      setMode('presenter');
      setIsBroadcastModalOpen(false);

      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        roomId: targetRoom,
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);
      setOverlayState((prev) => ({ ...prev, pointer: null }));

      transmitPacketNow({
        type: 'nav:goto',
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
        clearPointer: true,
      });

      const command: RemoteCastCommand = {
        id: `cmd-${Date.now().toString(36)}`,
        roomId: targetRoom,
        targetMode: 'screen',
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
        fromDeviceLabel: deviceProfileRef.current.label,
        createdAt: Date.now(),
      };

      // 1. Aciona abas locais imediatamente via BroadcastChannel
      if (bcRef.current) {
        try {
          bcRef.current.postMessage({
            type: 'bc:summon',
            __senderId: clientIdRef.current,
            targetClientIds,
            command,
          });
        } catch {
          // Ignora
        }
      }

      // 2. Aciona telas na mesma rede Wi-Fi via WebRTC direto nos Beacons detectados
      const targets: NetworkDeviceInfo[] = [];
      discoveredMapRef.current.forEach((dev) => {
        if (dev.clientId === clientIdRef.current) return;
        if (targetClientIds === 'ALL' || targetClientIds.includes(dev.clientId)) {
          targets.push(dev);
        }
      });

      if (targets.length === 0) return;

      try {
        const scanner = await ensureScannerPeer();
        await Promise.all(
          targets.map(
            (dev) =>
              new Promise<void>((resolveSummon) => {
                if (!dev.beaconPeerId) {
                  resolveSummon();
                  return;
                }
                let done = false;
                const finish = () => {
                  if (done) return;
                  done = true;
                  resolveSummon();
                };

                const timer = window.setTimeout(() => {
                  try {
                    conn.close();
                  } catch {
                    // Ignora
                  }
                  finish();
                }, 2500);

                const conn = scanner.connect(dev.beaconPeerId, { reliable: true });

                conn.on('open', () => {
                  try {
                    conn.send({ type: 'lan:summon', command });
                  } catch {
                    // Ignora
                  }
                });

                conn.on('data', (raw: any) => {
                  if (raw && typeof raw === 'object' && raw.type === 'lan:ack') {
                    window.clearTimeout(timer);
                    window.setTimeout(() => {
                      try {
                        conn.close();
                      } catch {
                        // Ignora
                      }
                    }, 120);
                    finish();
                  }
                });

                conn.on('error', () => {
                  window.clearTimeout(timer);
                  finish();
                });
              })
          )
        );
      } catch {
        // Caso o beacon já tenha migrado para a sala, o roomPeer sincronizará automaticamente
      }
    },
    [ensureScannerPeer]
  );

  const joinAsScreen = useCallback((targetRoomId: string) => {
    const clean = sanitizePeerRoomToken(targetRoomId);
    if (!clean) return;
    setP2pActivated(true);
    roomIdRef.current = clean;
    modeRef.current = 'screen';
    setRoomId(clean);
    setMode('screen');
    setIsBroadcastModalOpen(false);
    setNavState((prev) => ({ ...prev, roomId: clean }));
  }, []);

  const joinAsPresenter = useCallback((targetRoomId: string) => {
    const clean = sanitizePeerRoomToken(targetRoomId);
    if (!clean) return;
    setP2pActivated(true);
    roomIdRef.current = clean;
    modeRef.current = 'presenter';
    setRoomId(clean);
    setMode('presenter');
    setIsBroadcastModalOpen(false);
    setNavState((prev) => ({ ...prev, roomId: clean }));
  }, []);

  const leaveBroadcast = useCallback(() => {
    modeRef.current = 'standalone';
    setMode('standalone');
    setIsBroadcastModalOpen(false);
    setOverlayState((prev) => ({
      ...prev,
      blackout: false,
      pointer: null,
      spotlight: null,
    }));
  }, []);

  const goToPosition = useCallback(
    (slideIndex: number, subStep: number) => {
      const pos = clampPosition(slideIndex, subStep);
      roomVersionRef.current += 1;
      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);
      setOverlayState((prev) => (prev.pointer ? { ...prev, pointer: null } : prev));

      transmitPacketNow({
        type: 'nav:goto',
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        clearPointer: true,
      });
    },
    [transmitPacketNow]
  );

  const stepForwardBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    const next = getNextPosition(curr.slideIndex, curr.subStep);
    if (next) {
      goToPosition(next.slideIndex, next.subStep);
    }
  }, [goToPosition]);

  const stepBackwardBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    const prev = getPrevPosition(curr.slideIndex, curr.subStep);
    if (prev) {
      goToPosition(prev.slideIndex, prev.subStep);
    }
  }, [goToPosition]);

  const nextSlideBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    if (curr.slideIndex + 1 < PRESENTATION_SLIDES.length) {
      goToPosition(curr.slideIndex + 1, 0);
    }
  }, [goToPosition]);

  const prevSlideBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    if (curr.slideIndex > 0) {
      goToPosition(curr.slideIndex - 1, 0);
    }
  }, [goToPosition]);

  const setBlackout = useCallback(
    (blackout: boolean) => {
      setOverlayState((prev) => ({ ...prev, blackout }));
      transmitPacketNow({ type: 'stage:blackout', blackout });
    },
    [transmitPacketNow]
  );

  const setSpotlight = useCallback(
    (spotlight: SpotlightState | null) => {
      setOverlayState((prev) => ({ ...prev, spotlight }));
      if (!spotlight) {
        pendingContinuousMsgRef.current = null;
        transmitPacketNow({ type: 'stage:spotlight', spotlight: null });
      } else {
        sendContinuousPacket({ type: 'stage:spotlight', spotlight });
      }
    },
    [transmitPacketNow, sendContinuousPacket]
  );

  const emitPointer = useCallback(
    (active: boolean, x: number, y: number, color = '#dc143c') => {
      const pointerObj: PointerState | null = active
        ? { active: true, x, y, color, updatedAt: Date.now() }
        : null;
      setOverlayState((prev) => ({ ...prev, pointer: pointerObj }));

      const payload = {
        type: 'pointer:move',
        active,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        color,
      };

      if (!active) {
        pendingContinuousMsgRef.current = null;
        transmitPacketNow(payload);
      } else {
        sendContinuousPacket(payload);
      }
    },
    [transmitPacketNow, sendContinuousPacket]
  );

  const upsertStroke = useCallback(
    (slideIndex: number, stroke: DrawingStroke) => {
      setOverlayState((prev) => {
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

      sendContinuousPacket({
        type: 'draw:upsert',
        slideIndex,
        stroke,
      });
    },
    [sendContinuousPacket]
  );

  const undoStroke = useCallback(
    (slideIndex: number) => {
      setOverlayState((prev) => {
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
      transmitPacketNow({ type: 'draw:undo', slideIndex });
    },
    [transmitPacketNow]
  );

  const clearStrokes = useCallback(
    (slideIndex: number) => {
      setOverlayState((prev) => ({
        ...prev,
        drawingsBySlide: {
          ...prev.drawingsBySlide,
          [slideIndex]: [],
        },
      }));
      transmitPacketNow({ type: 'draw:clear', slideIndex });
    },
    [transmitPacketNow]
  );

  const updateSlideCustomState = useCallback(
    (patch: Partial<SlideCustomState>) => {
      setNavState((prev) => ({
        ...prev,
        slideCustomState: {
          ...prev.slideCustomState,
          ...patch,
        },
      }));
      transmitPacketNow({ type: 'slide:custom', patch });
    },
    [transmitPacketNow]
  );

  const getNoteForStep = useCallback(
    (slideIndex: number, subStep: number): string => {
      const key = makeNoteKey(slideIndex, subStep);
      const custom = customNotes[key];
      if (custom !== undefined) return custom;
      const slide = PRESENTATION_SLIDES[slideIndex];
      const step = slide?.steps[subStep] ?? slide?.steps[0];
      return step?.defaultNotes ?? '';
    },
    [customNotes]
  );

  const updateNoteForStep = useCallback(
    (slideIndex: number, subStep: number, text: string) => {
      const key = makeNoteKey(slideIndex, subStep);
      setCustomNotes((prev) => {
        const merged = { ...prev, [key]: text };
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignora
          }
        }
        return merged;
      });
      transmitPacketNow({ type: 'notes:update', key, text });
    },
    [transmitPacketNow]
  );

  const timerAction = useCallback(
    (action: 'start' | 'pause' | 'reset') => {
      const now = Date.now();
      let nextTimer: TimerState = overlayStateRef.current.timer;

      if (action === 'start' && !nextTimer.running) {
        nextTimer = { running: true, elapsedMs: nextTimer.elapsedMs, startedAt: now };
      } else if (action === 'pause' && nextTimer.running) {
        const delta = nextTimer.startedAt ? now - nextTimer.startedAt : 0;
        nextTimer = {
          running: false,
          elapsedMs: nextTimer.elapsedMs + Math.max(0, delta),
          startedAt: null,
        };
      } else if (action === 'reset') {
        nextTimer = { running: false, elapsedMs: 0, startedAt: null };
      }

      setOverlayState((prev) => ({
        ...prev,
        timer: nextTimer,
        serverTimeOffsetMs: 0,
      }));

      transmitPacketNow({
        type: 'timer:sync',
        timer: nextTimer,
        serverTime: now,
      });
    },
    [transmitPacketNow]
  );

  const navContextValue = useMemo<BroadcastContextValue>(
    () => ({
      myClientId: clientIdRef.current,
      mode,
      roomId,
      roomState: navState,
      openBroadcastModal,
      closeBroadcastModal,
      reportStandaloneDeckPosition,
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
      updateNoteForStep,
      timerAction,
      scanNetworkDevices,
    }),
    [
      mode,
      roomId,
      navState,
      openBroadcastModal,
      closeBroadcastModal,
      reportStandaloneDeckPosition,
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
      updateNoteForStep,
      timerAction,
      scanNetworkDevices,
    ]
  );

  const discoveryContextValue = useMemo<BroadcastDiscoveryContextValue>(
    () => ({
      connected,
      isBroadcastModalOpen,
      isScanningNetwork,
      networkDevices,
      presence,
      customNotes,
      getNoteForStep,
    }),
    [
      connected,
      isBroadcastModalOpen,
      isScanningNetwork,
      networkDevices,
      presence,
      customNotes,
      getNoteForStep,
    ]
  );

  return (
    <BroadcastContext.Provider value={navContextValue}>
      <BroadcastOverlayContext.Provider value={overlayState}>
        <BroadcastDiscoveryContext.Provider value={discoveryContextValue}>
          {children}
        </BroadcastDiscoveryContext.Provider>
      </BroadcastOverlayContext.Provider>
    </BroadcastContext.Provider>
  );
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

export function useBroadcastOverlay(): BroadcastOverlayContextValue {
  const ctx = useContext(BroadcastOverlayContext);
  if (!ctx) {
    throw new Error('useBroadcastOverlay must be used within BroadcastProvider');
  }
  return ctx;
}

export function useBroadcastDiscovery(): BroadcastDiscoveryContextValue {
  const ctx = useContext(BroadcastDiscoveryContext);
  if (!ctx) {
    throw new Error('useBroadcastDiscovery must be used within BroadcastProvider');
  }
  return ctx;
}
