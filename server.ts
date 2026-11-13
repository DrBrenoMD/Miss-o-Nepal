import express from 'express';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface RoomState {
  roomId: string;
  slideIndex: number;
  subStep: number;
  blackout: boolean;
  spotlight: SpotlightState | null;
  pointer: PointerState | null;
  drawingsBySlide: Record<number, DrawingStroke[]>;
  slideCustomState: SlideCustomState;
  customNotes: Record<string, string>;
  timer: TimerState;
  clients: Map<WebSocket, ClientPresence>;
  lastActivityAt: number;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  const normalized = roomId.trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      roomId: normalized,
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
      clients: new Map(),
      lastActivityAt: Date.now(),
    };
    rooms.set(normalized, room);
  }
  room.lastActivityAt = Date.now();
  return room;
}

function serializePresence(room: RoomState): ClientPresence[] {
  const seen = new Map<string, ClientPresence>();
  for (const info of room.clients.values()) {
    seen.set(info.clientId, info);
  }
  return Array.from(seen.values());
}

function serializeRoom(room: RoomState) {
  return {
    roomId: room.roomId,
    slideIndex: room.slideIndex,
    subStep: room.subStep,
    blackout: room.blackout,
    spotlight: room.spotlight,
    pointer: room.pointer,
    drawingsBySlide: room.drawingsBySlide,
    slideCustomState: room.slideCustomState,
    customNotes: room.customNotes,
    timer: room.timer,
    presence: serializePresence(room),
    serverTime: Date.now(),
  };
}

function broadcastToRoom(room: RoomState, payload: unknown, excludeSocket?: WebSocket) {
  const raw = JSON.stringify(payload);
  for (const clientSocket of room.clients.keys()) {
    if (clientSocket !== excludeSocket && clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(raw);
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

  // Prioriza faixas típicas de rede local Wi-Fi/LAN (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
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

  app.use(express.json());

  // Endpoint para descobrir endereços IPv4 da rede LAN local e status de salas
  app.get('/api/network-info', (req, res) => {
    const lanIps = discoverLanAddresses();
    const hostHeader = req.headers.host || `localhost:${port}`;
    const protocol =
      (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ||
      req.protocol ||
      'http';

    const lanUrls = lanIps.map((ip) => `http://${ip}:${port}`);
    res.json({
      port,
      lanIps,
      lanUrls,
      originUrl: `${protocol}://${hostHeader}`,
      activeRoomsCount: rooms.size,
    });
  });

  const server = http.createServer(app);

  // Servidor WebSocket dedicado no caminho /ws-cast (evita qualquer conflito com HMR do Vite)
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

  wss.on('connection', (ws) => {
    let joinedRoomId: string | null = null;

    ws.on('message', (rawBuffer) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(rawBuffer));
      } catch {
        return;
      }

      const type = msg.type as string;

      if (type === 'room:join') {
        const requestedRoom = String(msg.roomId || '').trim().toUpperCase();
        if (!requestedRoom) return;

        // Se já estava em outra sala, remove presença anterior
        if (joinedRoomId && joinedRoomId !== requestedRoom) {
          const prevRoom = rooms.get(joinedRoomId);
          if (prevRoom) {
            prevRoom.clients.delete(ws);
            broadcastToRoom(prevRoom, {
              type: 'room:presence',
              presence: serializePresence(prevRoom),
            });
          }
        }

        const isBrandNewRoom = !rooms.has(requestedRoom);
        const room = getOrCreateRoom(requestedRoom);
        joinedRoomId = room.roomId;

        if (
          isBrandNewRoom &&
          typeof msg.initialSlideIndex === 'number' &&
          msg.initialSlideIndex >= 0
        ) {
          room.slideIndex = Math.max(0, Math.min(7, Math.round(msg.initialSlideIndex)));
          room.subStep =
            typeof msg.initialSubStep === 'number' ? Math.max(0, Math.round(msg.initialSubStep)) : 0;
        }

        const presenceInfo: ClientPresence = {
          clientId: String(msg.clientId || `client-${Date.now()}`),
          role: msg.role === 'presenter' ? 'presenter' : 'screen',
          deviceLabel: String(msg.deviceLabel || 'Dispositivo'),
          connectedAt: Date.now(),
        };

        room.clients.set(ws, presenceInfo);

        // Envia estado autoritativo completo ao cliente recém-conectado
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'room:init',
              state: serializeRoom(room),
            })
          );
        }

        // Notifica demais dispositivos da sala sobre a nova presença
        broadcastToRoom(
          room,
          {
            type: 'room:presence',
            presence: serializePresence(room),
          },
          ws
        );
        return;
      }

      if (!joinedRoomId) return;
      const room = rooms.get(joinedRoomId);
      if (!room) return;
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
          broadcastToRoom(room, {
            type: 'nav:updated',
            slideIndex: room.slideIndex,
            subStep: room.subStep,
            pointer: room.pointer,
          });
          break;
        }

        case 'stage:blackout': {
          room.blackout = Boolean(msg.blackout);
          broadcastToRoom(room, {
            type: 'stage:blackout',
            blackout: room.blackout,
          });
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
          broadcastToRoom(
            room,
            {
              type: 'stage:spotlight',
              spotlight: room.spotlight,
            },
            ws
          );
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
          broadcastToRoom(
            room,
            {
              type: 'pointer:updated',
              pointer: room.pointer,
            },
            ws
          );
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

          broadcastToRoom(
            room,
            {
              type: 'draw:upserted',
              slideIndex: sIdx,
              stroke,
            },
            ws
          );
          break;
        }

        case 'draw:undo': {
          const sIdx = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
          const existing = room.drawingsBySlide[sIdx] || [];
          if (existing.length > 0) {
            existing.pop();
            room.drawingsBySlide[sIdx] = existing;
          }
          broadcastToRoom(room, {
            type: 'draw:synced',
            slideIndex: sIdx,
            strokes: room.drawingsBySlide[sIdx] || [],
          });
          break;
        }

        case 'draw:clear': {
          const sIdx = Math.max(0, Math.min(7, Number(msg.slideIndex) || 0));
          room.drawingsBySlide[sIdx] = [];
          broadcastToRoom(room, {
            type: 'draw:synced',
            slideIndex: sIdx,
            strokes: [],
          });
          break;
        }

        case 'slide:custom': {
          if (msg.patch && typeof msg.patch === 'object') {
            room.slideCustomState = {
              ...room.slideCustomState,
              ...msg.patch,
            };
            broadcastToRoom(room, {
              type: 'slide:custom',
              slideCustomState: room.slideCustomState,
            });
          }
          break;
        }

        case 'notes:update': {
          const noteKey = String(msg.key || '');
          if (noteKey) {
            room.customNotes[noteKey] = String(msg.text ?? '');
            broadcastToRoom(
              room,
              {
                type: 'notes:updated',
                key: noteKey,
                text: room.customNotes[noteKey],
              },
              ws
            );
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
          broadcastToRoom(room, {
            type: 'timer:updated',
            timer: room.timer,
            serverTime: now,
          });
          break;
        }
      }
    });

    ws.on('close', () => {
      if (!joinedRoomId) return;
      const room = rooms.get(joinedRoomId);
      if (!room) return;
      room.clients.delete(ws);
      broadcastToRoom(room, {
        type: 'room:presence',
        presence: serializePresence(room),
      });
    });
  });

  // Limpeza periódica de salas inativas há mais de 12 horas
  setInterval(() => {
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    for (const [id, room] of rooms.entries()) {
      if (room.clients.size === 0 && room.lastActivityAt < cutoff) {
        rooms.delete(id);
      }
    }
  }, 30 * 60 * 1000).unref();

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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    const lanIps = discoverLanAddresses();
    console.log(`Servidor Missão Nepal ativo em http://0.0.0.0:${port}`);
    if (lanIps.length > 0) {
      console.log(`Endereços LAN detectados: ${lanIps.map((ip) => `http://${ip}:${port}`).join(', ')}`);
    }
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
