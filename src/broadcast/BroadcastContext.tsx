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
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BroadcastMode,
  BroadcastNavState,
  BroadcastOverlayState,
  ClientPresence,
  DrawingPoint,
  DrawingStroke,
  DrawingTool,
  NetworkDeviceInfo,
  PointerState,
  RemoteCastCommand,
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

const APP_SCOPE = 'missao-nepal-v1';
const NOTES_STORAGE_KEY = 'missao_nepal_speaker_notes_v1';
const CLIENT_ID_KEY = 'missao_nepal_client_id_v1';
const NET_HASH_KEY = 'missao_nepal_net_hash_v3';
const BC_CHANNEL_NAME = 'missao-nepal-hybrid-bc-v1';
const DEVICE_TTL_MS = 110_000;

function sanitizeSafeId(raw: string, minLen = 4, maxLen = 64): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLen);
  if (cleaned.length >= minLen) return cleaned;
  return `dev-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeRoomCode(raw: string): string {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 16);
  return cleaned || '1000';
}

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val * 10) / 10));
}

function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'dev-server';
  try {
    const existing = window.sessionStorage.getItem(CLIENT_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{4,64}$/.test(existing)) return existing;
    const created = sanitizeSafeId(
      `dev-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
    );
    window.sessionStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return sanitizeSafeId(`dev-${Math.random().toString(36).slice(2, 10)}`);
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

async function resolvePublicNetworkHash(): Promise<string> {
  if (typeof window === 'undefined') return 'localdefault';
  try {
    const cached = window.sessionStorage.getItem(NET_HASH_KEY);
    if (cached && /^[a-zA-Z0-9_-]{4,32}$/.test(cached)) return cached;
  } catch {
    // Ignora
  }

  let resolvedIp = '';
  try {
    const res = await fetchWithTimeout('https://api.ipify.org?format=json', 2200);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) resolvedIp = String(data.ip);
    }
  } catch {
    // Fallback
  }

  if (!resolvedIp) {
    try {
      const res = await fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace', 2200);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/^ip=(.+)$/m);
        if (match?.[1]) resolvedIp = match[1].trim();
      }
    } catch {
      // Fallback
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
    return { label: 'Dispositivo', type: 'desktop', resolution: '1920x1080' };
  }
  const ua = navigator.userAgent || '';
  const sw = window.screen?.width || window.innerWidth || 1920;
  const sh = window.screen?.height || window.innerHeight || 1080;
  const resolution = `${sw}×${sh}`.slice(0, 24);

  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /Chrome\//i.test(ua) && !/Chromium/i.test(ua)
    ? 'Chrome'
    : /Safari\//i.test(ua) && !/Chrome/i.test(ua)
    ? 'Safari'
    : /Firefox\//i.test(ua)
    ? 'Firefox'
    : '';

  const withBrowser = (osName: string) =>
    (browser ? `${osName} · ${browser}` : osName).slice(0, 80);

  if (/SmartTV|Tizen|Web0S|BRAVIA|AFT|CrKey|TV/i.test(ua)) {
    return { label: withBrowser('Smart TV / Cast'), type: 'tv', resolution };
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
  return String(Math.floor(1000 + Math.random() * 9000));
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

interface SerializedCloudStroke {
  id: string;
  tool: string;
  color: string;
  width: number;
  pts: number[];
}

function serializeStrokesForFirestore(strokes: DrawingStroke[]): SerializedCloudStroke[] {
  return strokes.slice(0, 80).map((st) => {
    const rawPts = st.points || [];
    // Limita a 280 pontos (560 números <= limite de 600 nas Security Rules)
    const step = rawPts.length > 280 ? Math.ceil(rawPts.length / 280) : 1;
    const flat: number[] = [];
    for (let i = 0; i < rawPts.length && flat.length < 576; i += step) {
      flat.push(clampNum(rawPts[i].x, 0, 1920), clampNum(rawPts[i].y, 0, 1080));
    }
    if (rawPts.length > 1 && step > 1) {
      const last = rawPts[rawPts.length - 1];
      flat.push(clampNum(last.x, 0, 1920), clampNum(last.y, 0, 1080));
    }
    return {
      id: String(st.id || 'st').slice(0, 48),
      tool: String(st.tool || 'pen').slice(0, 16),
      color: String(st.color || '#dc143c').slice(0, 16),
      width: clampNum(st.width || 6, 1, 40),
      pts: flat,
    };
  });
}

function deserializeStrokesFromFirestore(rawList: unknown): DrawingStroke[] {
  if (!Array.isArray(rawList)) return [];
  const validTools: DrawingTool[] = ['pen', 'highlighter', 'arrow', 'rect', 'circle'];
  const result: DrawingStroke[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, any>;
    const ptsArr = Array.isArray(rec.pts) ? rec.pts : [];
    const points: DrawingPoint[] = [];
    for (let i = 0; i + 1 < ptsArr.length; i += 2) {
      points.push({
        x: Number(ptsArr[i]) || 0,
        y: Number(ptsArr[i + 1]) || 0,
      });
    }
    if (points.length === 0) continue;
    const toolCandidate = String(rec.tool || 'pen') as DrawingTool;
    result.push({
      id: String(rec.id || `st-${result.length}`),
      tool: validTools.includes(toolCandidate) ? toolCandidate : 'pen',
      color: String(rec.color || '#dc143c'),
      width: Number(rec.width) || 6,
      points,
    });
  }

  return result;
}

function isFirestorePermissionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /Missing or insufficient permissions|permission-denied/i.test(msg);
}

function resolvePublicReceiverBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const origin = window.location.origin.replace(/\/+$/, '');
  if (origin.startsWith('https://ais-dev-')) {
    return origin.replace(/^https:\/\/ais-dev-/, 'https://ais-pre-');
  }
  return origin;
}

// ============================================================================
// 1. CONTEXTO DE NAVEGAÇÃO E AÇÕES ESTÁVEIS (CONSUMIDO PELO DECK E SLIDES)
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
  startW3cNativeCast: (initialPos?: { slideIndex: number; subStep: number }) => Promise<void>;
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
// 2. CONTEXTO DE CAMADA VETORIAL / OVERLAY AO VIVO (CONSUMIDO PELO SVG E CONSOLE)
// ============================================================================
export interface BroadcastOverlayContextValue extends BroadcastOverlayState {}

// ============================================================================
// 3. CONTEXTO DE DESCOBERTA HÍBRIDA (FIRESTORE CLOUD + W3C NATIVE CAST)
// ============================================================================
export interface BroadcastDiscoveryContextValue {
  connected: boolean;
  isBroadcastModalOpen: boolean;
  isScanningNetwork: boolean;
  networkDevices: NetworkDeviceInfo[];
  presence: ClientPresence[];
  customNotes: Record<string, string>;
  getNoteForStep: (slideIndex: number, subStep: number) => string;
  w3cCastSupported: boolean;
  w3cCastAvailable: boolean;
  w3cCastActive: boolean;
  w3cStatusMessage: string | null;
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
    const rawRoom = sanitizeRoomCode(params.get('sala') || params.get('room') || '');
    const hasExplicitRoom = Boolean((params.get('sala') || params.get('room') || '').trim());
    const rawMode = (params.get('modo') || params.get('role') || '').trim().toLowerCase();

    let initialMode: BroadcastMode = 'standalone';
    if (hasExplicitRoom) {
      if (rawMode === 'apresentador' || rawMode === 'presenter') {
        initialMode = 'presenter';
      } else {
        initialMode = 'screen';
      }
    }

    return {
      room: hasExplicitRoom ? rawRoom : generateRoomCode(),
      mode: initialMode,
    };
  }, []);

  const [mode, setMode] = useState<BroadcastMode>(initialUrlParams.mode);
  const [roomId, setRoomId] = useState<string>(initialUrlParams.room);

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

  const [connected, setConnected] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [isScanningNetwork, setIsScanningNetwork] = useState<boolean>(false);
  const [networkDevices, setNetworkDevices] = useState<NetworkDeviceInfo[]>([]);
  const [customNotes, setCustomNotes] = useState<Record<string, string>>(() => loadSavedNotes());
  const [cloudReady, setCloudReady] = useState<boolean>(() => initialUrlParams.mode !== 'standalone');

  // Estado W3C Presentation API nativa (Chromecast / Google TV / Cabo HDMI)
  const [w3cCastSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'PresentationRequest' in window
  );
  const [w3cCastAvailable, setW3cCastAvailable] = useState<boolean>(false);
  const [w3cCastActive, setW3cCastActive] = useState<boolean>(false);
  const [w3cStatusMessage, setW3cStatusMessage] = useState<string | null>(null);

  // Refs estáveis
  const clientIdRef = useRef<string>(getOrCreateClientId());
  const deviceProfileRef = useRef(detectDeviceProfile());
  const netHashRef = useRef<string>('localdefault');
  const modeRef = useRef<BroadcastMode>(mode);
  const roomIdRef = useRef<string>(roomId);
  const isModalOpenRef = useRef<boolean>(isBroadcastModalOpen);
  const navStateRef = useRef<BroadcastNavState>(navState);
  const overlayStateRef = useRef<BroadcastOverlayState>(overlayState);
  const standaloneDeckPosRef = useRef<{ slideIndex: number; subStep: number }>({
    slideIndex: 0,
    subStep: 0,
  });
  const activePresenterIdRef = useRef<string>('');
  const latestNoteRef = useRef<{ key: string; text: string }>({ key: '', text: '' });
  const lastProcessedSummonNonceRef = useRef<string>('');

  // Canais diretos locais (0ms): BroadcastChannel + W3C PresentationConnection
  const bcRef = useRef<BroadcastChannel | null>(null);
  const w3cConnectionsRef = useRef<Set<any>>(new Set());

  // Controle de cadência para escritas contínuas no Firestore (~12Hz com trailing garantido)
  const lastCloudContinuousAtRef = useRef<number>(0);
  const cloudContinuousTimerRef = useRef<number | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    isModalOpenRef.current = isBroadcastModalOpen;
  }, [isBroadcastModalOpen]);

  useEffect(() => {
    navStateRef.current = navState;
  }, [navState]);

  useEffect(() => {
    overlayStateRef.current = overlayState;
  }, [overlayState]);

  // Inicialização diferida (650ms) em modo standalone para manter 60fps puros na entrada da capa
  useEffect(() => {
    if (cloudReady) return;
    const t = window.setTimeout(() => setCloudReady(true), 650);
    return () => window.clearTimeout(t);
  }, [cloudReady]);

  // Atualiza URL sem recarregar a página
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

  // ==========================================================================
  // FUNÇÃO DE ESCRITA DE PRESENÇA DO PRÓPRIO DISPOSITIVO (/castDevices/{myClientId})
  // ==========================================================================
  const publishMyDevicePresence = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const myId = clientIdRef.current;
    const path = `castDevices/${myId}`;
    const activeSlide =
      modeRef.current === 'standalone'
        ? standaloneDeckPosRef.current.slideIndex
        : navStateRef.current.slideIndex;

    const payload = {
      clientId: myId,
      appScope: APP_SCOPE,
      networkHash: sanitizeSafeId(netHashRef.current || 'localdefault', 4, 32),
      deviceLabel: deviceProfileRef.current.label.slice(0, 80),
      deviceType: deviceProfileRef.current.type,
      screenResolution: deviceProfileRef.current.resolution.slice(0, 24),
      mode: modeRef.current,
      roomId: sanitizeRoomCode(roomIdRef.current),
      slideIndex: Math.max(0, Math.min(20, Math.trunc(activeSlide))),
      summonRoomId: '',
      summonSlideIndex: 0,
      summonSubStep: 0,
      summonNonce: '',
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'castDevices', myId), payload);
      setConnected(true);
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }, []);

  // ==========================================================================
  // FUNÇÃO DE ESCRITA DO ESTADO COMPLETO DA SALA (/castRooms/{roomId})
  // ==========================================================================
  const pushRoomStateToFirestore = useCallback(
    async (explicitRoomId?: string) => {
      if (typeof window === 'undefined') return;
      const targetRoom = sanitizeRoomCode(explicitRoomId || roomIdRef.current);
      const path = `castRooms/${targetRoom}`;
      const nav = navStateRef.current;
      const ov = overlayStateRef.current;
      const currentStrokes = ov.drawingsBySlide[nav.slideIndex] || [];

      const presenterId =
        modeRef.current === 'presenter'
          ? clientIdRef.current
          : activePresenterIdRef.current.slice(0, 64);

      const payload = {
        roomId: targetRoom,
        appScope: APP_SCOPE,
        activePresenterId: presenterId,
        slideIndex: Math.max(0, Math.min(20, Math.trunc(nav.slideIndex))),
        subStep: Math.max(0, Math.min(30, Math.trunc(nav.subStep))),
        blackout: Boolean(ov.blackout),
        pointerActive: Boolean(ov.pointer?.active),
        pointerX: clampNum(ov.pointer?.x ?? 0, 0, 1920),
        pointerY: clampNum(ov.pointer?.y ?? 0, 0, 1080),
        pointerColor: String(ov.pointer?.color || '#dc143c').slice(0, 16),
        spotlightActive: Boolean(ov.spotlight?.active),
        spotlightX: clampNum(ov.spotlight?.x ?? 960, 0, 1920),
        spotlightY: clampNum(ov.spotlight?.y ?? 540, 0, 1080),
        economyMetric: nav.slideCustomState.economyMetric,
        casteTier: nav.slideCustomState.casteTier
          ? Math.max(0, Math.min(4, Math.trunc(nav.slideCustomState.casteTier)))
          : 0,
        timelineLens: nav.slideCustomState.timelineLens,
        timerRunning: Boolean(ov.timer.running),
        timerElapsedMs: Math.max(0, Math.min(86400000, Math.trunc(ov.timer.elapsedMs))),
        timerStartedAtMs: ov.timer.startedAt ? Math.max(0, Math.trunc(ov.timer.startedAt)) : 0,
        strokesSlideIndex: Math.max(0, Math.min(20, Math.trunc(nav.slideIndex))),
        strokesCurrentSlide: serializeStrokesForFirestore(currentStrokes),
        noteKey: latestNoteRef.current.key.slice(0, 16),
        noteText: latestNoteRef.current.text.slice(0, 4000),
        updatedBy: clientIdRef.current,
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'castRooms', targetRoom), payload);
        setConnected(true);
      } catch (error) {
        if (isFirestorePermissionError(error)) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    },
    []
  );

  const scheduleContinuousRoomPush = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastCloudContinuousAtRef.current;

    if (elapsed >= 85) {
      lastCloudContinuousAtRef.current = now;
      if (cloudContinuousTimerRef.current !== null) {
        window.clearTimeout(cloudContinuousTimerRef.current);
        cloudContinuousTimerRef.current = null;
      }
      pushRoomStateToFirestore();
    } else if (cloudContinuousTimerRef.current === null) {
      cloudContinuousTimerRef.current = window.setTimeout(() => {
        cloudContinuousTimerRef.current = null;
        lastCloudContinuousAtRef.current = performance.now();
        pushRoomStateToFirestore();
      }, 85 - elapsed);
    }
  }, [pushRoomStateToFirestore]);

  const applyRemoteCastCommand = useCallback(
    (cmd: RemoteCastCommand) => {
      if (!cmd || !cmd.roomId) return;
      const cleanRoom = sanitizeRoomCode(cmd.roomId);
      const clamped = clampPosition(cmd.slideIndex ?? 0, cmd.subStep ?? 0);

      roomIdRef.current = cleanRoom;
      modeRef.current = cmd.targetMode;
      setCloudReady(true);
      setRoomId(cleanRoom);
      setMode(cmd.targetMode);
      setIsBroadcastModalOpen(false);

      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        roomId: cleanRoom,
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);
      setOverlayState((prev) => ({ ...prev, pointer: null }));

      // Confirma imediatamente no Firestore que esta tela entrou como 'screen' na sala!
      publishMyDevicePresence();
    },
    [publishMyDevicePresence]
  );

  // Processa pacotes locais instantâneos (BroadcastChannel e W3C PresentationConnection)
  const applyDirectLocalPacket = useCallback(
    (msg: Record<string, any>) => {
      const type = String(msg.type || '');

      if (type === 'nav:goto') {
        const pos = clampPosition(Number(msg.slideIndex) || 0, Number(msg.subStep) || 0);
        setNavState((prev) =>
          prev.slideIndex === pos.slideIndex && prev.subStep === pos.subStep
            ? prev
            : { ...prev, slideIndex: pos.slideIndex, subStep: pos.subStep }
        );
        if (msg.clearPointer) {
          setOverlayState((prev) => (prev.pointer ? { ...prev, pointer: null } : prev));
        }
        return;
      }

      if (type === 'stage:blackout') {
        setOverlayState((prev) => ({ ...prev, blackout: Boolean(msg.blackout) }));
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

      if (type === 'draw:upsert' && msg.stroke) {
        const sIdx = Number(msg.slideIndex) || 0;
        const stroke = msg.stroke as DrawingStroke;
        setOverlayState((prev) => {
          const list = [...(prev.drawingsBySlide[sIdx] || [])];
          const idx = list.findIndex((s) => s.id === stroke.id);
          if (idx >= 0) list[idx] = stroke;
          else list.push(stroke);
          return {
            ...prev,
            drawingsBySlide: { ...prev.drawingsBySlide, [sIdx]: list },
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
            drawingsBySlide: { ...prev.drawingsBySlide, [sIdx]: list },
          };
        });
        return;
      }

      if (type === 'draw:clear') {
        const sIdx = Number(msg.slideIndex) || 0;
        setOverlayState((prev) => ({
          ...prev,
          drawingsBySlide: { ...prev.drawingsBySlide, [sIdx]: [] },
        }));
        return;
      }

      if (type === 'slide:custom' && msg.patch) {
        setNavState((prev) => ({
          ...prev,
          slideCustomState: { ...prev.slideCustomState, ...msg.patch },
        }));
        return;
      }

      if (type === 'timer:sync' && msg.timer) {
        setOverlayState((prev) => ({
          ...prev,
          timer: msg.timer as TimerState,
          serverTimeOffsetMs: 0,
        }));
      }
    },
    []
  );

  const sendDirectLocalFastPath = useCallback((packet: Record<string, unknown>) => {
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

    if (w3cConnectionsRef.current.size > 0) {
      const serialized = JSON.stringify({
        ...packet,
        __senderId: clientIdRef.current,
        __roomId: activeRoom,
      });
      w3cConnectionsRef.current.forEach((conn) => {
        try {
          if (conn.state === 'connected') {
            conn.send(serialized);
          }
        } catch {
          // Ignora
        }
      });
    }
  }, []);

  // ==========================================================================
  // CAMADA LOCAL 1: BroadcastChannel (0ms entre abas/janelas HDMI no mesmo PC)
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const bc = new BroadcastChannel(BC_CHANNEL_NAME);
    bcRef.current = bc;

    bc.onmessage = (ev) => {
      const data = ev.data;
      if (!data || data.__senderId === clientIdRef.current) return;

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
        applyDirectLocalPacket(data);
      }
    };

    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [applyDirectLocalPacket, applyRemoteCastCommand]);

  // ==========================================================================
  // CAMADA NATIVA 2: W3C Presentation API (Chromecast / Google TV / Cabo HDMI)
  // ==========================================================================
  const wireW3cConnection = useCallback(
    (conn: any) => {
      if (!conn) return;
      w3cConnectionsRef.current.add(conn);
      setW3cCastActive(true);

      conn.onmessage = (event: any) => {
        try {
          const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (parsed && parsed.__senderId !== clientIdRef.current) {
            applyDirectLocalPacket(parsed);
          }
        } catch {
          // Ignora
        }
      };

      const cleanup = () => {
        w3cConnectionsRef.current.delete(conn);
        setW3cCastActive(w3cConnectionsRef.current.size > 0);
      };

      conn.onclose = cleanup;
      conn.onterminate = cleanup;
    },
    [applyDirectLocalPacket]
  );

  // Monitora disponibilidade de telas nativas no navegador (W3C PresentationRequest)
  useEffect(() => {
    if (typeof window === 'undefined' || !w3cCastSupported || !isBroadcastModalOpen) return;

    let availabilityObj: any = null;
    let cancelled = false;

    try {
      const PR = (window as any).PresentationRequest;
      const receiverUrl = `${resolvePublicReceiverBaseUrl()}/?sala=${encodeURIComponent(
        roomId
      )}&modo=tela&w3c=1`;
      const req = new PR([receiverUrl]);
      req
        .getAvailability()
        .then((avail: any) => {
          if (cancelled) return;
          availabilityObj = avail;
          setW3cCastAvailable(Boolean(avail.value));
          avail.onchange = () => {
            setW3cCastAvailable(Boolean(avail.value));
          };
        })
        .catch(() => {
          // Alguns navegadores não suportam sondagem passiva mas permitem req.start() ao clicar
          if (!cancelled) setW3cCastAvailable(true);
        });
    } catch {
      // Ignora caso restrito por iframe
    }

    return () => {
      cancelled = true;
      if (availabilityObj) {
        availabilityObj.onchange = null;
      }
    };
  }, [w3cCastSupported, isBroadcastModalOpen, roomId]);

  // Se esta instância foi aberta como Receptor Nativo W3C em uma Smart TV / Monitor HDMI
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const navPres = (navigator as any).presentation;
    if (!navPres?.receiver?.connectionList) return;

    let cancelled = false;
    navPres.receiver.connectionList
      .then((list: any) => {
        if (cancelled) return;
        (list.connections || []).forEach((c: any) => wireW3cConnection(c));
        list.onconnectionavailable = (ev: any) => {
          if (ev?.connection) wireW3cConnection(ev.connection);
        };
      })
      .catch(() => {
        // Ignora
      });

    return () => {
      cancelled = true;
    };
  }, [wireW3cConnection]);

  // ==========================================================================
  // CAMADA CLOUD 3A: PRESENÇA E ESCUTA DE CONVOCAÇÃO REMOTA (/castDevices/{myClientId})
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !cloudReady) return;

    let cancelled = false;
    const myId = clientIdRef.current;
    const myDocRef = doc(db, 'castDevices', myId);
    const myPath = `castDevices/${myId}`;

    resolvePublicNetworkHash().then((hash) => {
      if (cancelled) return;
      netHashRef.current = hash;
      publishMyDevicePresence();
    });

    const unsubSelf = onSnapshot(
      myDocRef,
      (snap) => {
        setConnected(true);
        if (!snap.exists()) return;
        const data = snap.data();
        const nonce = String(data.summonNonce || '');
        const targetRoom = String(data.summonRoomId || '');

        if (nonce && targetRoom && nonce !== lastProcessedSummonNonceRef.current) {
          lastProcessedSummonNonceRef.current = nonce;
          applyRemoteCastCommand({
            id: nonce,
            roomId: targetRoom,
            targetMode: 'screen',
            slideIndex: Number(data.summonSlideIndex) || 0,
            subStep: Number(data.summonSubStep) || 0,
            fromDeviceLabel: 'Apresentador',
            createdAt: Date.now(),
          });
        }
      },
      (error) => {
        if (isFirestorePermissionError(error)) {
          handleFirestoreError(error, OperationType.GET, myPath);
        }
      }
    );

    const heartbeatTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        publishMyDevicePresence();
      }
    }, 45_000);

    const handlePageHide = () => {
      deleteDoc(myDocRef).catch(() => {});
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelled = true;
      unsubSelf();
      window.clearInterval(heartbeatTimer);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [cloudReady, applyRemoteCastCommand, publishMyDevicePresence]);

  // Atualiza presença quando modo ou sala mudam
  useEffect(() => {
    if (!cloudReady) return;
    publishMyDevicePresence();
  }, [cloudReady, mode, roomId, navState.slideIndex, publishMyDevicePresence]);

  // ==========================================================================
  // CAMADA CLOUD 3B: RADAR EM TEMPO REAL DE TELAS ABERTAS (/castDevices)
  // Ativo apenas enquanto o modal Transmitir está aberto ou no Console do Apresentador
  // ==========================================================================
  const parseDevicesSnapshot = useCallback((docsData: Array<Record<string, any>>) => {
    // Usa o maior updatedAt do servidor como referência imune a relógios desajustados!
    let referenceServerMs = 0;
    const withMillis = docsData.map((d) => {
      const ts = d.updatedAt as Timestamp | null | undefined;
      const ms = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
      if (ms > referenceServerMs) referenceServerMs = ms;
      return { raw: d, ms };
    });

    if (referenceServerMs === 0) referenceServerMs = Date.now();
    const myHash = netHashRef.current;

    const activeList: NetworkDeviceInfo[] = [];
    for (const { raw, ms } of withMillis) {
      const cId = String(raw.clientId || '');
      if (!cId || cId === clientIdRef.current) continue;
      if (referenceServerMs - ms > DEVICE_TTL_MS) continue;

      const devHash = String(raw.networkHash || '');
      const isSameWifi =
        Boolean(myHash) && myHash !== 'localdefault' && devHash === myHash;

      activeList.push({
        clientId: cId,
        deviceLabel: String(raw.deviceLabel || 'Tela Conectada'),
        deviceType:
          raw.deviceType === 'tv' || raw.deviceType === 'mobile'
            ? raw.deviceType
            : 'desktop',
        screenResolution: String(raw.screenResolution || '1920×1080'),
        mode:
          raw.mode === 'presenter' || raw.mode === 'screen'
            ? raw.mode
            : 'standalone',
        roomId: String(raw.roomId || ''),
        slideIndex: Number(raw.slideIndex) || 0,
        sameNetwork: isSameWifi,
        lastSeenAt: ms,
      });
    }

    // Ordena priorizando telas na mesma rede Wi-Fi e telas já conectadas à sala
    activeList.sort((a, b) => {
      if (a.sameNetwork !== b.sameNetwork) return a.sameNetwork ? -1 : 1;
      return a.deviceLabel.localeCompare(b.deviceLabel);
    });

    setNetworkDevices(activeList);
  }, []);

  useEffect(() => {
    const shouldListenDevices = isBroadcastModalOpen || mode === 'presenter';
    if (typeof window === 'undefined' || !shouldListenDevices) return;

    setCloudReady(true);
    const q = query(collection(db, 'castDevices'), where('appScope', '==', APP_SCOPE));

    const unsubList = onSnapshot(
      q,
      (snap) => {
        setConnected(true);
        const docsData = snap.docs.map((d) => d.data());
        parseDevicesSnapshot(docsData);
      },
      (error) => {
        if (isFirestorePermissionError(error)) {
          handleFirestoreError(error, OperationType.LIST, 'castDevices');
        }
      }
    );

    return () => {
      unsubList();
    };
  }, [isBroadcastModalOpen, mode, parseDevicesSnapshot]);

  const scanNetworkDevices = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsScanningNetwork(true);
    setCloudReady(true);
    try {
      await publishMyDevicePresence();
      const q = query(collection(db, 'castDevices'), where('appScope', '==', APP_SCOPE));
      const snap = await getDocs(q);
      parseDevicesSnapshot(snap.docs.map((d) => d.data()));
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'castDevices');
      }
    } finally {
      setIsScanningNetwork(false);
    }
  }, [parseDevicesSnapshot, publishMyDevicePresence]);

  // ==========================================================================
  // CAMADA CLOUD 3C: SINCRONIZAÇÃO EM TEMPO REAL DA SALA (/castRooms/{roomId})
  // ==========================================================================
  useEffect(() => {
    const shouldSubscribeRoom = mode !== 'standalone' || isBroadcastModalOpen;
    if (typeof window === 'undefined' || !shouldSubscribeRoom) return;

    const cleanRoom = sanitizeRoomCode(roomId);
    const roomDocRef = doc(db, 'castRooms', cleanRoom);
    const roomPath = `castRooms/${cleanRoom}`;

    const unsubRoom = onSnapshot(
      roomDocRef,
      (snap) => {
        setConnected(true);
        if (!snap.exists()) return;
        // Ignora eco otimista local das próprias escritas em trânsito
        if (snap.metadata.hasPendingWrites) return;

        const d = snap.data();
        const remotePresenterId = String(d.activePresenterId || '');
        activePresenterIdRef.current = remotePresenterId;

        // Se o usuário estava com o modal de QR Code aberto no PC/TV (modo standalone) e escaneou
        // "QR para Celular" no smartphone, promove automaticamente esta tela para Telão!
        if (
          modeRef.current === 'standalone' &&
          isModalOpenRef.current &&
          remotePresenterId &&
          remotePresenterId !== clientIdRef.current
        ) {
          modeRef.current = 'screen';
          setMode('screen');
          setIsBroadcastModalOpen(false);
          publishMyDevicePresence();
        }

        // Se somos o Apresentador que emitiu esta mesma atualização, evita sobrescrever cursor/traço local
        if (modeRef.current === 'presenter' && d.updatedBy === clientIdRef.current) {
          return;
        }

        const clamped = clampPosition(
          Number(d.slideIndex) || 0,
          Number(d.subStep) || 0
        );

        const nextEconomy =
          d.economyMetric === 'gdp' || d.economyMetric === 'hdi'
            ? d.economyMetric
            : 'perCapita';
        const rawTier = Number(d.casteTier) || 0;
        const nextTier = rawTier >= 1 && rawTier <= 4 ? rawTier : null;
        const nextLens =
          d.timelineLens === 'panorama' || d.timelineLens === 'era'
            ? d.timelineLens
            : 'auto';

        setNavState((prev) => ({
          roomId: cleanRoom,
          slideIndex: clamped.slideIndex,
          subStep: clamped.subStep,
          slideCustomState: {
            economyMetric: nextEconomy,
            casteTier: nextTier,
            timelineLens: nextLens,
          },
        }));

        const sIdx = Number(d.strokesSlideIndex) ?? clamped.slideIndex;
        const decodedStrokes = deserializeStrokesFromFirestore(d.strokesCurrentSlide);

        setOverlayState((prev) => ({
          blackout: Boolean(d.blackout),
          pointer: d.pointerActive
            ? {
                active: true,
                x: Number(d.pointerX) || 0,
                y: Number(d.pointerY) || 0,
                color: String(d.pointerColor || '#dc143c'),
                updatedAt: Date.now(),
              }
            : null,
          spotlight: d.spotlightActive
            ? {
                active: true,
                x: Number(d.spotlightX) || 960,
                y: Number(d.spotlightY) || 540,
              }
            : null,
          drawingsBySlide: {
            ...prev.drawingsBySlide,
            [sIdx]: decodedStrokes,
          },
          timer: {
            running: Boolean(d.timerRunning),
            elapsedMs: Number(d.timerElapsedMs) || 0,
            startedAt: d.timerStartedAtMs ? Number(d.timerStartedAtMs) : null,
          },
          serverTimeOffsetMs: 0,
        }));

        const incomingNoteKey = String(d.noteKey || '');
        if (incomingNoteKey) {
          const incomingNoteText = String(d.noteText ?? '');
          setCustomNotes((prev) => {
            if (prev[incomingNoteKey] === incomingNoteText) return prev;
            const merged = { ...prev, [incomingNoteKey]: incomingNoteText };
            try {
              window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // Ignora
            }
            return merged;
          });
        }
      },
      (error) => {
        if (isFirestorePermissionError(error)) {
          handleFirestoreError(error, OperationType.GET, roomPath);
        }
      }
    );

    return () => {
      unsubRoom();
    };
  }, [mode, roomId, isBroadcastModalOpen, publishMyDevicePresence]);

  // Deriva lista consolidada de presença (Telões e Controles conectados à sala atual)
  const presence = useMemo<ClientPresence[]>(() => {
    const list: ClientPresence[] = [];
    if (mode === 'presenter' || mode === 'screen') {
      list.push({
        clientId: clientIdRef.current,
        role: mode,
        deviceLabel: deviceProfileRef.current.label,
        connectedAt: 0,
      });
    }
    for (const dev of networkDevices) {
      if (dev.roomId === roomId && (dev.mode === 'screen' || dev.mode === 'presenter')) {
        list.push({
          clientId: dev.clientId,
          role: dev.mode,
          deviceLabel: dev.deviceLabel,
          connectedAt: dev.lastSeenAt,
        });
      }
    }
    if (w3cCastActive && !list.some((p) => p.role === 'screen')) {
      list.push({
        clientId: 'w3c-native-screen',
        role: 'screen',
        deviceLabel: 'Tela Cast / HDMI Nativa',
        connectedAt: 0,
      });
    }
    return list;
  }, [mode, roomId, networkDevices, w3cCastActive]);

  // ==========================================================================
  // AÇÕES PÚBLICAS ESTÁVEIS (IDENTIDADE IMUTÁVEL)
  // ==========================================================================
  const openBroadcastModal = useCallback(() => {
    setCloudReady(true);
    setW3cStatusMessage(null);
    setIsBroadcastModalOpen(true);
  }, []);

  const closeBroadcastModal = useCallback(() => {
    setIsBroadcastModalOpen(false);
  }, []);

  const reportStandaloneDeckPosition = useCallback((slideIndex: number, subStep: number) => {
    const prev = standaloneDeckPosRef.current;
    standaloneDeckPosRef.current = { slideIndex, subStep };
    if (prev.slideIndex !== slideIndex && modeRef.current === 'standalone') {
      publishMyDevicePresence();
    }
  }, [publishMyDevicePresence]);

  const startPresenting = useCallback(
    (customRoomId?: string, initialPos?: { slideIndex: number; subStep: number }) => {
      const targetRoom = sanitizeRoomCode(
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

      setCloudReady(true);
      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      activePresenterIdRef.current = clientIdRef.current;
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
      overlayStateRef.current = { ...overlayStateRef.current, pointer: null };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({
        type: 'nav:goto',
        slideIndex: clamped.slideIndex,
        subStep: clamped.subStep,
        clearPointer: true,
      });
      pushRoomStateToFirestore(targetRoom);
      publishMyDevicePresence();
    },
    [publishMyDevicePresence, pushRoomStateToFirestore, sendDirectLocalFastPath]
  );

  /**
   * Transmite em 1 clique para 1 ou todas as telas abertas detectadas no Firebase Cloud / LAN!
   */
  const castToDevices = useCallback(
    async (
      targetClientIds: string[] | 'ALL',
      initialPos?: { slideIndex: number; subStep: number }
    ) => {
      const targetRoom = sanitizeRoomCode(roomIdRef.current || generateRoomCode());
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

      setCloudReady(true);
      roomIdRef.current = targetRoom;
      modeRef.current = 'presenter';
      activePresenterIdRef.current = clientIdRef.current;
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
      overlayStateRef.current = { ...overlayStateRef.current, pointer: null };
      setOverlayState(overlayStateRef.current);

      const nonce = `cmd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      // 1. Aciona abas locais imediatamente
      if (bcRef.current) {
        try {
          bcRef.current.postMessage({
            type: 'bc:summon',
            __senderId: clientIdRef.current,
            targetClientIds,
            command: {
              id: nonce,
              roomId: targetRoom,
              targetMode: 'screen',
              slideIndex: clamped.slideIndex,
              subStep: clamped.subStep,
              fromDeviceLabel: deviceProfileRef.current.label,
              createdAt: Date.now(),
            } satisfies RemoteCastCommand,
          });
        } catch {
          // Ignora
        }
      }

      // 2. Grava estado inicial da sala no Firestore imediatamente
      await pushRoomStateToFirestore(targetRoom);
      publishMyDevicePresence();

      // 3. Envia comando de Summon instantâneo para cada tela alvo no Firestore (/castDevices/{id})
      let candidateIds: string[] = [];
      if (targetClientIds === 'ALL') {
        const q = query(collection(db, 'castDevices'), where('appScope', '==', APP_SCOPE));
        try {
          const snap = await getDocs(q);
          candidateIds = snap.docs
            .map((d) => d.data())
            .filter((d) => d.clientId && d.clientId !== clientIdRef.current && d.mode !== 'presenter')
            .map((d) => String(d.clientId));
        } catch (error) {
          if (isFirestorePermissionError(error)) {
            handleFirestoreError(error, OperationType.LIST, 'castDevices');
          }
        }
      } else {
        candidateIds = targetClientIds.filter((id) => id && id !== clientIdRef.current);
      }

      await Promise.all(
        candidateIds.map(async (targetId) => {
          const path = `castDevices/${targetId}`;
          try {
            await updateDoc(doc(db, 'castDevices', targetId), {
              summonRoomId: targetRoom,
              summonSlideIndex: Math.max(0, Math.min(20, Math.trunc(clamped.slideIndex))),
              summonSubStep: Math.max(0, Math.min(30, Math.trunc(clamped.subStep))),
              summonNonce: nonce,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            if (isFirestorePermissionError(error)) {
              handleFirestoreError(error, OperationType.UPDATE, path);
            }
          }
        })
      );
    },
    [publishMyDevicePresence, pushRoomStateToFirestore]
  );

  /**
   * Abre o seletor nativo de telas do Chrome / Edge / Android (W3C Presentation API)
   * para transmitir direto a um Chromecast, Google TV ou segundo monitor HDMI!
   */
  const startW3cNativeCast = useCallback(
    async (initialPos?: { slideIndex: number; subStep: number }) => {
      if (typeof window === 'undefined' || !('PresentationRequest' in window)) {
        setW3cStatusMessage(
          'Seu navegador atual não possui seletor Cast nativo (exclusivo Chrome/Edge/Android). Use a lista de Telas Detectadas ou o QR Code abaixo!'
        );
        return;
      }

      setW3cStatusMessage(null);
      const targetRoom = sanitizeRoomCode(roomIdRef.current || generateRoomCode());
      const receiverUrl = `${resolvePublicReceiverBaseUrl()}/?sala=${encodeURIComponent(
        targetRoom
      )}&modo=tela&w3c=1`;

      try {
        const PR = (window as any).PresentationRequest;
        const req = new PR([receiverUrl]);
        const conn = await req.start();
        wireW3cConnection(conn);
        startPresenting(targetRoom, initialPos);
      } catch (err: any) {
        const errName = String(err?.name || '');
        if (errName === 'NotAllowedError' || errName === 'AbortError') {
          // Usuário fechou o seletor nativo sem escolher uma tela
          return;
        }
        if (window.self !== window.top || errName === 'SecurityError') {
          setW3cStatusMessage(
            'O seletor Cast nativo do navegador exige abrir a apresentação fora do quadro de pré-visualização (na aba pública ou na Vercel). Já as Telas Detectadas abaixo funcionam em qualquer ambiente!'
          );
        } else {
          setW3cStatusMessage(
            'Nenhuma tela Chromecast ou HDMI compatível respondeu ao navegador. Abra o link na TV/PC para usar a conexão direta em nuvem abaixo.'
          );
        }
      }
    },
    [startPresenting, wireW3cConnection]
  );

  const joinAsScreen = useCallback(
    (targetRoomId: string) => {
      const clean = sanitizeRoomCode(targetRoomId);
      setCloudReady(true);
      roomIdRef.current = clean;
      modeRef.current = 'screen';
      setRoomId(clean);
      setMode('screen');
      setIsBroadcastModalOpen(false);
      setNavState((prev) => ({ ...prev, roomId: clean }));
      publishMyDevicePresence();
    },
    [publishMyDevicePresence]
  );

  const joinAsPresenter = useCallback(
    (targetRoomId: string) => {
      const clean = sanitizeRoomCode(targetRoomId);
      setCloudReady(true);
      roomIdRef.current = clean;
      modeRef.current = 'presenter';
      activePresenterIdRef.current = clientIdRef.current;
      setRoomId(clean);
      setMode('presenter');
      setIsBroadcastModalOpen(false);
      setNavState((prev) => ({ ...prev, roomId: clean }));
      publishMyDevicePresence();
      // Registra presença de apresentador na sala para promover telas aguardando QR
      pushRoomStateToFirestore(clean);
    },
    [publishMyDevicePresence, pushRoomStateToFirestore]
  );

  const leaveBroadcast = useCallback(() => {
    modeRef.current = 'standalone';
    setMode('standalone');
    setIsBroadcastModalOpen(false);
    w3cConnectionsRef.current.forEach((conn) => {
      try {
        conn.terminate?.();
      } catch {
        // Ignora
      }
    });
    w3cConnectionsRef.current.clear();
    setW3cCastActive(false);
    setOverlayState((prev) => ({
      ...prev,
      blackout: false,
      pointer: null,
      spotlight: null,
    }));
    publishMyDevicePresence();
  }, [publishMyDevicePresence]);

  const goToPosition = useCallback(
    (slideIndex: number, subStep: number) => {
      const pos = clampPosition(slideIndex, subStep);
      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);

      if (overlayStateRef.current.pointer) {
        overlayStateRef.current = { ...overlayStateRef.current, pointer: null };
        setOverlayState(overlayStateRef.current);
      }

      sendDirectLocalFastPath({
        type: 'nav:goto',
        slideIndex: pos.slideIndex,
        subStep: pos.subStep,
        clearPointer: true,
      });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
  );

  const stepForwardBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    const next = getNextPosition(curr.slideIndex, curr.subStep);
    if (next) goToPosition(next.slideIndex, next.subStep);
  }, [goToPosition]);

  const stepBackwardBroadcast = useCallback(() => {
    const curr = navStateRef.current;
    const prev = getPrevPosition(curr.slideIndex, curr.subStep);
    if (prev) goToPosition(prev.slideIndex, prev.subStep);
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
      overlayStateRef.current = { ...overlayStateRef.current, blackout };
      setOverlayState(overlayStateRef.current);
      sendDirectLocalFastPath({ type: 'stage:blackout', blackout });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
  );

  const setSpotlight = useCallback(
    (spotlight: SpotlightState | null) => {
      overlayStateRef.current = { ...overlayStateRef.current, spotlight };
      setOverlayState(overlayStateRef.current);
      sendDirectLocalFastPath({ type: 'stage:spotlight', spotlight });
      if (!spotlight) {
        pushRoomStateToFirestore();
      } else {
        scheduleContinuousRoomPush();
      }
    },
    [pushRoomStateToFirestore, scheduleContinuousRoomPush, sendDirectLocalFastPath]
  );

  const emitPointer = useCallback(
    (active: boolean, x: number, y: number, color = '#dc143c') => {
      const pointerObj: PointerState | null = active
        ? { active: true, x, y, color, updatedAt: Date.now() }
        : null;
      overlayStateRef.current = { ...overlayStateRef.current, pointer: pointerObj };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({
        type: 'pointer:move',
        active,
        x: clampNum(x, 0, 1920),
        y: clampNum(y, 0, 1080),
        color,
      });

      if (!active) {
        if (cloudContinuousTimerRef.current !== null) {
          window.clearTimeout(cloudContinuousTimerRef.current);
          cloudContinuousTimerRef.current = null;
        }
        pushRoomStateToFirestore();
      } else {
        scheduleContinuousRoomPush();
      }
    },
    [pushRoomStateToFirestore, scheduleContinuousRoomPush, sendDirectLocalFastPath]
  );

  const upsertStroke = useCallback(
    (slideIndex: number, stroke: DrawingStroke) => {
      const prevOv = overlayStateRef.current;
      const list = [...(prevOv.drawingsBySlide[slideIndex] || [])];
      const idx = list.findIndex((s) => s.id === stroke.id);
      if (idx >= 0) list[idx] = stroke;
      else list.push(stroke);

      overlayStateRef.current = {
        ...prevOv,
        drawingsBySlide: {
          ...prevOv.drawingsBySlide,
          [slideIndex]: list,
        },
      };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({ type: 'draw:upsert', slideIndex, stroke });
      scheduleContinuousRoomPush();
    },
    [scheduleContinuousRoomPush, sendDirectLocalFastPath]
  );

  const undoStroke = useCallback(
    (slideIndex: number) => {
      const prevOv = overlayStateRef.current;
      const list = [...(prevOv.drawingsBySlide[slideIndex] || [])];
      list.pop();
      overlayStateRef.current = {
        ...prevOv,
        drawingsBySlide: {
          ...prevOv.drawingsBySlide,
          [slideIndex]: list,
        },
      };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({ type: 'draw:undo', slideIndex });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
  );

  const clearStrokes = useCallback(
    (slideIndex: number) => {
      const prevOv = overlayStateRef.current;
      overlayStateRef.current = {
        ...prevOv,
        drawingsBySlide: {
          ...prevOv.drawingsBySlide,
          [slideIndex]: [],
        },
      };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({ type: 'draw:clear', slideIndex });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
  );

  const updateSlideCustomState = useCallback(
    (patch: Partial<SlideCustomState>) => {
      const nextNav: BroadcastNavState = {
        ...navStateRef.current,
        slideCustomState: {
          ...navStateRef.current.slideCustomState,
          ...patch,
        },
      };
      navStateRef.current = nextNav;
      setNavState(nextNav);

      sendDirectLocalFastPath({ type: 'slide:custom', patch });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
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
      const truncated = text.slice(0, 4000);
      latestNoteRef.current = { key, text: truncated };

      setCustomNotes((prev) => {
        const merged = { ...prev, [key]: truncated };
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignora
          }
        }
        return merged;
      });

      scheduleContinuousRoomPush();
    },
    [scheduleContinuousRoomPush]
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

      overlayStateRef.current = {
        ...overlayStateRef.current,
        timer: nextTimer,
        serverTimeOffsetMs: 0,
      };
      setOverlayState(overlayStateRef.current);

      sendDirectLocalFastPath({ type: 'timer:sync', timer: nextTimer });
      pushRoomStateToFirestore();
    },
    [pushRoomStateToFirestore, sendDirectLocalFastPath]
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
      startW3cNativeCast,
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
      startW3cNativeCast,
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
      w3cCastSupported,
      w3cCastAvailable,
      w3cCastActive,
      w3cStatusMessage,
    }),
    [
      connected,
      isBroadcastModalOpen,
      isScanningNetwork,
      networkDevices,
      presence,
      customNotes,
      getNoteForStep,
      w3cCastSupported,
      w3cCastAvailable,
      w3cCastActive,
      w3cStatusMessage,
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
