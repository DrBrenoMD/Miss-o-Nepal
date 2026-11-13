import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type BroadcastMode = 'standalone' | 'presenter' | 'screen';

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'arrow' | 'rect' | 'circle';
  color: string;
  width: number;
  points: DrawingPoint[];
}

interface PointerState {
  active: boolean;
  x: number;
  y: number;
  color: string;
  updatedAt: number;
}

interface SpotlightState {
  active: boolean;
  x: number;
  y: number;
}

interface SlideCustomState {
  economyMetric: 'perCapita' | 'gdp' | 'hdi';
  casteTier: number | null;
  timelineLens: 'auto' | 'panorama' | 'era';
}

interface TimerState {
  running: boolean;
  elapsedMs: number;
  startedAt: number | null;
}

interface ClientPresence {
  clientId: string;
  role: 'presenter' | 'screen';
  deviceLabel: string;
  connectedAt: number;
}

interface RemoteCastCommand {
  id: string;
  roomId: string;
  targetMode: 'screen' | 'presenter';
  slideIndex: number;
  subStep: number;
  fromDeviceLabel: string;
  createdAt: number;
}

interface NetworkDeviceRecord {
  clientId: string;
  deviceLabel: string;
  deviceType: 'desktop' | 'mobile' | 'tv';
  screenResolution: string;
  mode: BroadcastMode;
  roomId: string;
  slideIndex: number;
  networkSignature: string;
  connectedAt: number;
  lastSeenAt: number;
  pendingCastCommand: RemoteCastCommand | null;
}

interface RoomState {
  roomId: string;
  version: number;
  slideIndex: number;
  subStep: number;
  blackout: boolean;
  spotlight: SpotlightState | null;
  pointer: PointerState | null;
  drawingsBySlide: Record<number, DrawingStroke[]>;
  slideCustomState: SlideCustomState;
  customNotes: Record<string, string>;
  timer: TimerState;
  wsClients: Map<WebSocket, string>; // ws -> clientId
  lastActivityAt: number;
}

interface PollWaiter {
  clientId: string;
  roomId: string;
  sinceRoomVersion: number;
  sinceDevicesVersion: number;
  timer: NodeJS.Timeout;
  resolve: () => void;
}

const DEVICE_TTL_MS = 22_000;
const rooms = new Map<string, RoomState>();
const devices = new Map<string, NetworkDeviceRecord>();
const pollWaiters = new Set<PollWaiter>();
let devicesVersion = 1;

function bumpDevicesVersion() {
  devicesVersion += 1;
}

function extractNetworkSignature(req: Request | http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : '') ||
    req.socket?.remoteAddress ||
    'local';
  const cleaned = rawIp.replace(/^::ffff:/, '');
  if (
    cleaned === '127.0.0.1' ||
    cleaned === '::1' ||
    cleaned.startsWith('192.168.') ||
    cleaned.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(cleaned)
  ) {
    return 'LAN_LOCAL';
  }
  return cleaned;
}

function pruneStaleDevices(): boolean {
  const cutoff = Date.now() - DEVICE_TTL_MS;
  let removedAny = false;
  for (const [id, dev] of devices.entries()) {
    if (dev.lastSeenAt < cutoff) {
      devices.delete(id);
      removedAny = true;
    }
  }
  if (removedAny) {
    bumpDevicesVersion();
  }
  return removedAny;
}

function getOrCreateRoom(roomId: string): RoomState {
  const normalized = (roomId || '1000').trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      roomId: normalized,
      version: 1,
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
      customNotes: {},
      timer: {
        running: false,
        elapsedMs: 0,
        startedAt: null,
      },
      wsClients: new Map(),
      lastActivityAt: Date.now(),
    };
    rooms.set(normalized, room);
  }
  room.lastActivityAt = Date.now();
  return room;
}

function computeRoomPresence(roomId: string): ClientPresence[] {
  pruneStaleDevices();
  const normalized = roomId.trim().toUpperCase();
  const list: ClientPresence[] = [];
  for (const dev of devices.values()) {
    if (dev.roomId === normalized && (dev.mode === 'screen' || dev.mode === 'presenter')) {
      list.push({
        clientId: dev.clientId,
        role: dev.mode,
        deviceLabel: dev.deviceLabel,
        connectedAt: dev.connectedAt,
      });
    }
  }
  return list;
}

function serializeRoom(room: RoomState) {
  return {
    roomId: room.roomId,
    version: room.version,
    slideIndex: room.slideIndex,
    subStep: room.subStep,
    blackout: room.blackout,
    spotlight: room.spotlight,
    pointer: room.pointer,
    drawingsBySlide: room.drawingsBySlide,
    slideCustomState: room.slideCustomState,
    customNotes: room.customNotes,
    timer: room.timer,
    presence: computeRoomPresence(room.roomId),
    serverTime: Date.now(),
  };
}

function serializeDevicesForRequester(requesterSignature: string) {
  pruneStaleDevices();
  const result = Array.from(devices.values()).map((d) => ({
    clientId: d.clientId,
    deviceLabel: d.deviceLabel,
    deviceType: d.deviceType,
    screenResolution: d.screenResolution,
    mode: d.mode,
    roomId: d.roomId,
    slideIndex: d.slideIndex,
    sameNetwork:
      d.networkSignature === requesterSignature ||
      d.networkSignature === 'LAN_LOCAL' ||
      requesterSignature === 'LAN_LOCAL',
    lastSeenAt: d.lastSeenAt,
  }));

  // Ordena: mesma rede primeiro, depois telas desktop/TV antes de celulares
  result.sort((a, b) => {
    if (a.sameNetwork !== b.sameNetwork) return a.sameNetwork ? -1 : 1;
    const rank = (t: string) => (t === 'tv' ? 0 : t === 'desktop' ? 1 : 2);
    return rank(a.deviceType) - rank(b.deviceType);
  });

  return result;
}

function broadcastWsToRoom(room: RoomState, payload: unknown, excludeSocket?: WebSocket) {
  const raw = JSON.stringify(payload);
  for (const ws of room.wsClients.keys()) {
    if (ws !== excludeSocket && ws.readyState === WebSocket.OPEN) {
      ws.send(raw);
    }
  }
}

function broadcastWsToClient(targetClientId: string, payload: unknown) {
  const raw = JSON.stringify(payload);
  for (const room of rooms.values()) {
    for (const [ws, cId] of room.wsClients.entries()) {
      if (cId === targetClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }
}

function wakePollWaiters(options?: { roomId?: string; targetClientId?: string; allDevices?: boolean }) {
  for (const waiter of Array.from(pollWaiters)) {
    const room = rooms.get(waiter.roomId);
    const dev = devices.get(waiter.clientId);
    const hasPendingCmd = Boolean(dev?.pendingCastCommand);
    const roomChanged = Boolean(room && room.version > waiter.sinceRoomVersion);
    const devicesChanged = devicesVersion > waiter.sinceDevicesVersion;
    const matchesTarget =
      options?.allDevices ||
      (options?.targetClientId && waiter.clientId === options.targetClientId) ||
      (options?.roomId && waiter.roomId === options.roomId);

    if (hasPendingCmd || roomChanged || devicesChanged || matchesTarget) {
      pollWaiters.delete(waiter);
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
  }
}

/**
 * Registra ou atualiza presença de qualquer dispositivo aberto na rede.
 * Se um apresentador entrar numa sala onde existe uma tela em modo 'standalone' exibindo
 * o mesmo código de sala (ex.: após escanear o QR Code para Celular exibido no PC),
 * promove automaticamente o PC para modo 'screen' (Telão Receptor).
 */
function upsertDevicePresence(params: {
  clientId: string;
  deviceLabel?: string;
  deviceType?: 'desktop' | 'mobile' | 'tv';
  screenResolution?: string;
  mode?: BroadcastMode;
  roomId?: string;
  slideIndex?: number;
  initialSlideIndex?: number;
  initialSubStep?: number;
  networkSignature: string;
  skipWake?: boolean;
}) {
  const now = Date.now();
  const cleanId = String(params.clientId || '').trim();
  if (!cleanId) return null;

  const existing = devices.get(cleanId);
  const nextMode: BroadcastMode =
    params.mode === 'presenter' || params.mode === 'screen' || params.mode === 'standalone'
      ? params.mode
      : existing?.mode || 'standalone';
  const nextRoomId = String(params.roomId || existing?.roomId || '1000')
    .trim()
    .toUpperCase();

  const isBrandNewRoom = !rooms.has(nextRoomId);
  const room = getOrCreateRoom(nextRoomId);

  if (
    typeof params.initialSlideIndex === 'number' &&
    params.initialSlideIndex >= 0 &&
    (isBrandNewRoom || nextMode === 'presenter')
  ) {
    room.slideIndex = Math.max(0, Math.min(7, Math.round(params.initialSlideIndex)));
    room.subStep =
      typeof params.initialSubStep === 'number'
        ? Math.max(0, Math.round(params.initialSubStep))
        : 0;
    room.version += 1;
  }

  const changedMeaningfully =
    !existing ||
    existing.mode !== nextMode ||
    existing.roomId !== nextRoomId ||
    (params.deviceLabel && existing.deviceLabel !== params.deviceLabel) ||
    (typeof params.slideIndex === 'number' && existing.slideIndex !== params.slideIndex);

  const record: NetworkDeviceRecord = {
    clientId: cleanId,
    deviceLabel: String(params.deviceLabel || existing?.deviceLabel || 'Dispositivo'),
    deviceType: params.deviceType || existing?.deviceType || 'desktop',
    screenResolution: String(params.screenResolution || existing?.screenResolution || '16:9'),
    mode: nextMode,
    roomId: nextRoomId,
    slideIndex:
      typeof params.slideIndex === 'number' ? params.slideIndex : existing?.slideIndex ?? 0,
    networkSignature: params.networkSignature || existing?.networkSignature || 'LAN_LOCAL',
    connectedAt: existing?.connectedAt ?? now,
    lastSeenAt: now,
    pendingCastCommand: existing?.pendingCastCommand ?? null,
  };

  devices.set(cleanId, record);

  // Auto-pareamento inteligente: se um celular entrou como 'presenter' numa sala X,
  // qualquer computador/TV que estava aguardando na mesma sala X em 'standalone' vira 'screen' automaticamente!
  if (nextMode === 'presenter') {
    for (const other of devices.values()) {
      if (
        other.clientId !== cleanId &&
        other.roomId === nextRoomId &&
        other.mode === 'standalone'
      ) {
        const autoCmd: RemoteCastCommand = {
          id: `cmd-${now}-${Math.random().toString(36).slice(2, 6)}`,
          roomId: nextRoomId,
          targetMode: 'screen',
          slideIndex: room.slideIndex,
          subStep: room.subStep,
          fromDeviceLabel: record.deviceLabel,
          createdAt: now,
        };
        other.mode = 'screen';
        other.pendingCastCommand = autoCmd;
        broadcastWsToClient(other.clientId, {
          type: 'cast:command',
          command: autoCmd,
        });
      }
    }
  }

  if (changedMeaningfully) {
    if (existing && existing.roomId !== nextRoomId) {
      const oldRoom = rooms.get(existing.roomId);
      if (oldRoom) {
        oldRoom.version += 1;
        broadcastWsToRoom(oldRoom, {
          type: 'room:presence',
          presence: computeRoomPresence(oldRoom.roomId),
        });
      }
    }
    room.version += 1;
    bumpDevicesVersion();
    broadcastWsToRoom(room, {
      type: 'room:presence',
      presence: computeRoomPresence(room.roomId),
    });
    if (!params.skipWake) {
      wakePollWaiters({ roomId: nextRoomId, allDevices: true });
    }
  }

  return record;
}

/**
 * Aplica mutação autoritativa na sala e notifica instantaneamente TANTO WebSocket QUANTO HTTP Long-Poll.
 */
function applyRoomMutation(
  room: RoomState,
  msg: Record<string, any>,
  excludeWs?: WebSocket
) {
  const type = String(msg.type || '');
  room.lastActivityAt = Date.now();

  switch (type) {
    case 'nav:goto': {
      const nextSlide = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
      const nextStep = Math.max(0, Number(msg.subStep) || 0);
      room.slideIndex = nextSlide;
      room.subStep = nextStep;
      if (msg.clearPointer !== false) {
        room.pointer = null;
      }
      room.version += 1;
      broadcastWsToRoom(room, {
        type: 'nav:updated',
        version: room.version,
        slideIndex: room.slideIndex,
        subStep: room.subStep,
        pointer: room.pointer,
      });
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'stage:blackout': {
      room.blackout = Boolean(msg.blackout);
      room.version += 1;
      broadcastWsToRoom(room, {
        type: 'stage:blackout',
        version: room.version,
        blackout: room.blackout,
      });
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'stage:spotlight': {
      if (msg.spotlight && msg.spotlight.active) {
        room.spotlight = {
          active: true,
          x: Number(msg.spotlight.x) || 960,
          y: Number(msg.spotlight.y) || 540,
        };
      } else {
        room.spotlight = null;
      }
      room.version += 1;
      broadcastWsToRoom(
        room,
        {
          type: 'stage:spotlight',
          version: room.version,
          spotlight: room.spotlight,
        },
        excludeWs
      );
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'pointer:move': {
      if (msg.active) {
        room.pointer = {
          active: true,
          x: Number(msg.x) || 0,
          y: Number(msg.y) || 0,
          color: String(msg.color || '#dc143c'),
          updatedAt: Date.now(),
        };
      } else {
        room.pointer = null;
      }
      room.version += 1;
      broadcastWsToRoom(
        room,
        {
          type: 'pointer:updated',
          version: room.version,
          pointer: room.pointer,
        },
        excludeWs
      );
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'draw:upsert': {
      const sIdx = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
      const stroke = msg.stroke as DrawingStroke | undefined;
      if (!stroke || !stroke.id || !Array.isArray(stroke.points)) break;

      const existing = room.drawingsBySlide[sIdx] || [];
      const foundIdx = existing.findIndex((s) => s.id === stroke.id);
      if (foundIdx >= 0) {
        existing[foundIdx] = stroke;
      } else {
        existing.push(stroke);
      }
      room.drawingsBySlide[sIdx] = existing;
      room.version += 1;

      broadcastWsToRoom(
        room,
        {
          type: 'draw:upserted',
          version: room.version,
          slideIndex: sIdx,
          stroke,
        },
        excludeWs
      );
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'draw:undo': {
      const sIdx = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
      const existing = room.drawingsBySlide[sIdx] || [];
      if (existing.length > 0) {
        existing.pop();
        room.drawingsBySlide[sIdx] = existing;
      }
      room.version += 1;
      broadcastWsToRoom(room, {
        type: 'draw:synced',
        version: room.version,
        slideIndex: sIdx,
        strokes: room.drawingsBySlide[sIdx] || [],
      });
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'draw:clear': {
      const sIdx = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
      room.drawingsBySlide[sIdx] = [];
      room.version += 1;
      broadcastWsToRoom(room, {
        type: 'draw:synced',
        version: room.version,
        slideIndex: sIdx,
        strokes: [],
      });
      wakePollWaiters({ roomId: room.roomId });
      break;
    }

    case 'slide:custom': {
      if (msg.patch && typeof msg.patch === 'object') {
        room.slideCustomState = {
          ...room.slideCustomState,
          ...msg.patch,
        };
        room.version += 1;
        broadcastWsToRoom(room, {
          type: 'slide:custom',
          version: room.version,
          slideCustomState: room.slideCustomState,
        });
        wakePollWaiters({ roomId: room.roomId });
      }
      break;
    }

    case 'notes:update': {
      const noteKey = String(msg.key || '');
      if (noteKey) {
        room.customNotes[noteKey] = String(msg.text ?? '');
        room.version += 1;
        broadcastWsToRoom(
          room,
          {
            type: 'notes:updated',
            version: room.version,
            key: noteKey,
            text: room.customNotes[noteKey],
          },
          excludeWs
        );
        wakePollWaiters({ roomId: room.roomId });
      }
      break;
    }

    case 'timer:action': {
      const now = Date.now();
      const action = String(msg.action || '');
      if (action === 'start' && !room.timer.running) {
        room.timer = {
          running: true,
          elapsedMs: room.timer.elapsedMs,
          startedAt: now,
        };
      } else if (action === 'pause' && room.timer.running) {
        const delta = room.timer.startedAt ? now - room.timer.startedAt : 0;
        room.timer = {
          running: false,
          elapsedMs: room.timer.elapsedMs + Math.max(0, delta),
          startedAt: null,
        };
      } else if (action === 'reset') {
        room.timer = {
          running: false,
          elapsedMs: 0,
          startedAt: null,
        };
      }
      room.version += 1;
      broadcastWsToRoom(room, {
        type: 'timer:updated',
        version: room.version,
        timer: room.timer,
        serverTime: now,
      });
      wakePollWaiters({ roomId: room.roomId });
      break;
    }
  }
}

function discoverLanAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const entries = interfaces[name];
    if (!entries) continue;
    for (const entry of entries) {
      if (
        entry.family === 'IPv4' &&
        !entry.internal &&
        entry.address &&
        !entry.address.startsWith('169.254.')
      ) {
        addresses.push(entry.address);
      }
    }
  }

  addresses.sort((a, b) => {
    const score = (ip: string) =>
      ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2;
    return score(a) - score(b);
  });

  return Array.from(new Set(addresses));
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  // Desativa cache nas rotas de sincronização em tempo real
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // 1. Informações de Rede LAN + URL Compartilhável Pública
  app.get('/api/network-info', (req: Request, res: Response) => {
    const lanIps = discoverLanAddresses();
    const hostHeader = req.headers.host || `localhost:${port}`;
    const protocol =
      (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ||
      req.protocol ||
      'http';

    const originUrl = `${protocol}://${hostHeader}`;
    const sharedAppUrl = hostHeader.startsWith('ais-dev-')
      ? `${protocol}://${hostHeader.replace(/^ais-dev-/, 'ais-pre-')}`
      : process.env.APP_URL || null;

    const lanUrls = lanIps.map((ip) => `http://${ip}:${port}`);
    res.json({
      port,
      lanIps,
      lanUrls,
      originUrl,
      sharedAppUrl,
      activeRoomsCount: rooms.size,
    });
  });

  // 2. Registro / Heartbeat de presença e descoberta de telas na rede
  app.post('/api/cast/register', (req: Request, res: Response) => {
    const body = req.body || {};
    const sig = extractNetworkSignature(req);
    const record = upsertDevicePresence({
      clientId: body.clientId,
      deviceLabel: body.deviceLabel,
      deviceType: body.deviceType,
      screenResolution: body.screenResolution,
      mode: body.mode,
      roomId: body.roomId,
      slideIndex: body.slideIndex,
      initialSlideIndex: body.initialSlideIndex,
      initialSubStep: body.initialSubStep,
      networkSignature: sig,
    });

    if (!record) {
      res.status(400).json({ ok: false, error: 'clientId obrigatório' });
      return;
    }

    const room = getOrCreateRoom(record.roomId);
    const pendingCmd = record.pendingCastCommand;
    record.pendingCastCommand = null;

    res.json({
      ok: true,
      roomState: serializeRoom(room),
      devices: serializeDevicesForRequester(sig),
      devicesVersion,
      castCommand: pendingCmd,
    });
  });

  // 3. Long-Polling HTTP de Baixíssima Latência (funciona em 100% dos proxies, Wi-Fi e redes móveis)
  app.get('/api/cast/poll', (req: Request, res: Response) => {
    const clientId = String(req.query.clientId || '').trim();
    const roomId = String(req.query.roomId || '1000')
      .trim()
      .toUpperCase();
    const modeParam = String(req.query.mode || '') as BroadcastMode;
    const sinceRoomVersion = Number(req.query.sinceRoomVersion) || 0;
    const sinceDevicesVersion = Number(req.query.sinceDevicesVersion) || 0;
    const sig = extractNetworkSignature(req);

    if (clientId) {
      const existing = devices.get(clientId);
      if (existing) {
        existing.lastSeenAt = Date.now();
        existing.networkSignature = sig;
        if (
          (modeParam === 'standalone' || modeParam === 'screen' || modeParam === 'presenter') &&
          !existing.pendingCastCommand &&
          (existing.mode !== modeParam || existing.roomId !== roomId)
        ) {
          existing.mode = modeParam;
          existing.roomId = roomId;
          bumpDevicesVersion();
        }
      } else {
        upsertDevicePresence({
          clientId,
          mode:
            modeParam === 'presenter' || modeParam === 'screen' ? modeParam : 'standalone',
          roomId,
          networkSignature: sig,
        });
      }
    }

    const sendSnapshot = () => {
      if (res.writableEnded) return;
      const dev = clientId ? devices.get(clientId) : undefined;
      const effectiveRoomId = dev?.pendingCastCommand?.roomId || roomId;
      const room = getOrCreateRoom(effectiveRoomId);
      const pendingCmd = dev?.pendingCastCommand || null;
      if (dev && pendingCmd) {
        dev.pendingCastCommand = null;
      }
      res.json({
        ok: true,
        roomState: serializeRoom(room),
        devices: serializeDevicesForRequester(sig),
        devicesVersion,
        castCommand: pendingCmd,
      });
    };

    const roomNow = getOrCreateRoom(roomId);
    const devNow = clientId ? devices.get(clientId) : undefined;

    if (
      devNow?.pendingCastCommand ||
      roomNow.version > sinceRoomVersion ||
      devicesVersion > sinceDevicesVersion
    ) {
      sendSnapshot();
      return;
    }

    const waiter: PollWaiter = {
      clientId,
      roomId,
      sinceRoomVersion,
      sinceDevicesVersion,
      timer: setTimeout(() => {
        pollWaiters.delete(waiter);
        sendSnapshot();
      }, 8000),
      resolve: sendSnapshot,
    };

    pollWaiters.add(waiter);

    req.on('close', () => {
      if (pollWaiters.has(waiter)) {
        pollWaiters.delete(waiter);
        clearTimeout(waiter.timer);
      }
    });
  });

  // 4. Envio de Ações em Tempo Real (Avançar/Voltar Slide, Pointer, Desenhos, Notas, Cortina)
  app.post('/api/cast/action', (req: Request, res: Response) => {
    const body = req.body || {};
    const roomId = String(body.roomId || '').trim().toUpperCase();
    const clientId = String(body.clientId || '').trim();
    const action = body.action as Record<string, any> | undefined;

    if (!roomId || !action || !action.type) {
      res.status(400).json({ ok: false });
      return;
    }

    if (clientId) {
      const dev = devices.get(clientId);
      if (dev) {
        dev.lastSeenAt = Date.now();
        if (action.type === 'nav:goto' && typeof action.slideIndex === 'number') {
          dev.slideIndex = action.slideIndex;
        }
      }
    }

    const room = getOrCreateRoom(roomId);
    applyRoomMutation(room, action);

    res.json({
      ok: true,
      version: room.version,
      slideIndex: room.slideIndex,
      subStep: room.subStep,
    });
  });

  // 5. Transmitir com 1 Clique para Tela(s) Detectada(s) na Rede (estilo Chromecast)
  app.post('/api/cast/summon', (req: Request, res: Response) => {
    const body = req.body || {};
    const presenterClientId = String(body.presenterClientId || '').trim();
    const presenterLabel = String(body.presenterLabel || 'Apresentador').trim();
    const roomId = String(body.roomId || '1000')
      .trim()
      .toUpperCase();
    const targetClientIds: string[] | 'ALL' =
      body.targetClientIds === 'ALL'
        ? 'ALL'
        : Array.isArray(body.targetClientIds)
        ? body.targetClientIds.map(String)
        : [];
    const slideIndex = Math.max(0, Math.min(7, Number(body.slideIndex) || 0));
    const subStep = Math.max(0, Number(body.subStep) || 0);
    const sig = extractNetworkSignature(req);

    const room = getOrCreateRoom(roomId);
    room.slideIndex = slideIndex;
    room.subStep = subStep;
    room.pointer = null;
    room.version += 1;

    const now = Date.now();
    let summonedCount = 0;

    for (const dev of devices.values()) {
      if (dev.clientId === presenterClientId) continue;
      const shouldTarget =
        targetClientIds === 'ALL'
          ? dev.mode !== 'presenter'
          : targetClientIds.includes(dev.clientId);

      if (shouldTarget) {
        const cmd: RemoteCastCommand = {
          id: `cast-${now}-${Math.random().toString(36).slice(2, 6)}`,
          roomId,
          targetMode: 'screen',
          slideIndex,
          subStep,
          fromDeviceLabel: presenterLabel,
          createdAt: now,
        };
        dev.roomId = roomId;
        dev.mode = 'screen';
        dev.slideIndex = slideIndex;
        dev.pendingCastCommand = cmd;
        summonedCount += 1;

        broadcastWsToClient(dev.clientId, {
          type: 'cast:command',
          command: cmd,
        });
      }
    }

    if (presenterClientId) {
      upsertDevicePresence({
        clientId: presenterClientId,
        deviceLabel: presenterLabel,
        mode: 'presenter',
        roomId,
        slideIndex,
        networkSignature: sig,
        skipWake: true,
      });
    }

    room.version += 1;
    bumpDevicesVersion();
    broadcastWsToRoom(room, {
      type: 'room:init',
      state: serializeRoom(room),
    });
    wakePollWaiters({ roomId, allDevices: true });

    res.json({
      ok: true,
      summonedCount,
      roomState: serializeRoom(room),
      devices: serializeDevicesForRequester(sig),
      devicesVersion,
    });
  });

  const server = http.createServer(app);

  // Servidor WebSocket opcional em paralelo no caminho /ws-cast (baixa latência direta em LAN local)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (reqUrl.pathname === '/ws-cast') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    let joinedRoomId: string | null = null;
    let boundClientId: string | null = null;
    const wsSig = extractNetworkSignature(request);

    ws.on('message', (rawBuffer) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(rawBuffer));
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'room:join') {
        const requestedRoom = String(msg.roomId || '1000')
          .trim()
          .toUpperCase();
        const clientId = String(msg.clientId || `ws-${Date.now()}`);
        boundClientId = clientId;

        if (joinedRoomId && joinedRoomId !== requestedRoom) {
          const prevRoom = rooms.get(joinedRoomId);
          if (prevRoom) {
            prevRoom.wsClients.delete(ws);
          }
        }

        const room = getOrCreateRoom(requestedRoom);
        joinedRoomId = room.roomId;
        room.wsClients.set(ws, clientId);

        upsertDevicePresence({
          clientId,
          deviceLabel: msg.deviceLabel,
          deviceType: msg.deviceType,
          screenResolution: msg.screenResolution,
          mode:
            msg.role === 'presenter'
              ? 'presenter'
              : msg.role === 'screen'
              ? 'screen'
              : 'standalone',
          roomId: requestedRoom,
          initialSlideIndex: msg.initialSlideIndex,
          initialSubStep: msg.initialSubStep,
          networkSignature: wsSig,
        });

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'room:init',
              state: serializeRoom(room),
            })
          );
        }
        return;
      }

      if (!joinedRoomId) return;
      const room = rooms.get(joinedRoomId);
      if (!room) return;
      if (boundClientId) {
        const dev = devices.get(boundClientId);
        if (dev) dev.lastSeenAt = Date.now();
      }

      applyRoomMutation(room, msg, ws);
    });

    ws.on('close', () => {
      if (!joinedRoomId) return;
      const room = rooms.get(joinedRoomId);
      if (room) {
        room.wsClients.delete(ws);
      }
    });
  });

  // Limpeza periódica de salas e dispositivos inativos
  setInterval(() => {
    const hadStale = pruneStaleDevices();
    if (hadStale) {
      wakePollWaiters({ allDevices: true });
    }
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    for (const [id, room] of rooms.entries()) {
      if (room.wsClients.size === 0 && room.lastActivityAt < cutoff) {
        rooms.delete(id);
      }
    }
  }, 6000).unref();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    const lanIps = discoverLanAddresses();
    console.log(`Servidor Missão Nepal ativo em http://0.0.0.0:${port}`);
    if (lanIps.length > 0) {
      console.log(
        `Endereços LAN detectados: ${lanIps.map((ip) => `http://${ip}:${port}`).join(', ')}`
      );
    }
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
