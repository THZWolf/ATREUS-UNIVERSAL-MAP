export interface Star {
  id: string;
  name: string;
  ra: number;
  dec: number;
  dist: number;
  mag: number;
  type: string;
  isSimulated?: boolean;
  metadata?: {
    temp?: number;
    radius?: number;
    mass?: number;
    spectralType?: string;
  };
  keywords?: string[];
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne';
}

export interface EvolutionMetrics {
  learningRate: number;
  synapticDensity: number;
  phiComplexity: number;
  contextDepth: number;
  totalInteractions: number;
  sentienceIndex: number;
}

export interface SystemMetrics {
  neuroPossibilities: number;
  energyProcessed: number;
  qubitStability: number;
  pnpSubprocesses: number;
  evolution: EvolutionMetrics;
}

export type EventType = 'supernova' | 'transit' | 'anomaly';

export interface StellarEvent {
  id: string;
  type: EventType;
  name: string;
  ra: number;
  dec: number;
  intensity: number;
  timestamp: number;
  description: string;
}

export interface VoiceCommandLogEntry {
  id: string;
  command: string;
  timestamp: number;
  status: 'executed' | 'recognized' | 'failed';
  actionType: 'navigation' | 'research' | 'help' | 'psyche' | 'discovery' | 'query';
  responseFeedback?: string;
}

export interface ResearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  sentienceIndex: number;
  totalInteractions: number;
  learningRate?: number;
  synapticDensity?: number;
  psycheFace?: string;
  keyInsight?: string;
}

export interface StellarComparisonData {
  starA: Star;
  starB: Star;
  angularSeparationDeg: number;
  interstellarDistanceLY: number;
  deltaDistanceLY: number;
  deltaMagnitude: number;
}

export interface BookmarkedStar {
  starId: string;
  star: Star;
  bookmarkedAt: number;
  notes?: string;
  tags?: string[];
}

