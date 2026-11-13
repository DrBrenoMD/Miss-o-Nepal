export type AnnotationTool =
  | 'none'
  | 'laser'
  | 'spotlight'
  | 'pen'
  | 'highlighter'
  | 'arrow'
  | 'rect'
  | 'circle';

export type DrawingTool = 'pen' | 'highlighter' | 'arrow' | 'rect' | 'circle';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface PointerState {
  active: boolean;
  x: number;
  y: number;
  color: string;
  updatedAt: number;
}

export interface SpotlightState {
  active: boolean;
  x: number;
  y: number;
}

export interface SlideCustomState {
  economyMetric: 'perCapita' | 'gdp' | 'hdi';
  casteTier: number | null;
  timelineLens: 'auto' | 'panorama' | 'era';
}

export interface TimerState {
  running: boolean;
  elapsedMs: number;
  startedAt: number | null;
}

export type BroadcastMode = 'standalone' | 'presenter' | 'screen';

export interface ClientPresence {
  clientId: string;
  role: 'presenter' | 'screen';
  deviceLabel: string;
  connectedAt: number;
}

export interface NetworkDeviceInfo {
  clientId: string;
  beaconPeerId?: string;
  deviceLabel: string;
  deviceType: 'desktop' | 'mobile' | 'tv';
  screenResolution: string;
  mode: BroadcastMode;
  roomId: string;
  slideIndex: number;
  sameNetwork: boolean;
  lastSeenAt: number;
}

export interface RemoteCastCommand {
  id: string;
  roomId: string;
  targetMode: 'screen' | 'presenter';
  slideIndex: number;
  subStep: number;
  fromDeviceLabel: string;
  createdAt: number;
}

export interface BroadcastNavState {
  roomId: string;
  slideIndex: number;
  subStep: number;
  slideCustomState: SlideCustomState;
}

export interface BroadcastOverlayState {
  blackout: boolean;
  spotlight: SpotlightState | null;
  pointer: PointerState | null;
  drawingsBySlide: Record<number, DrawingStroke[]>;
  timer: TimerState;
  serverTimeOffsetMs: number;
}

export interface RoomSyncState extends BroadcastNavState, BroadcastOverlayState {
  version: number;
  customNotes: Record<string, string>;
  presence: ClientPresence[];
}
