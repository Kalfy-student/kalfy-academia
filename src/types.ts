export interface ApkRelease {
  id: string;
  version: string;
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  releaseDate: string;
  createdAt: string;
  downloads: number;
  sourceType: 'upload' | 'external' | 'starter';
  storageFileName?: string;
  externalUrl?: string;
  binaryMissing?: boolean;
  notes: string[];
}

export interface PublicAppState {
  maintenanceMode: boolean;
  activeRelease: ApkRelease | null;
  changelogHistory: ApkRelease[];
}

export type StoragePersistenceMode = 'cloud-github' | 'custom-disk' | 'ephemeral-local';

export interface AdminAppState {
  maintenanceMode: boolean;
  activeReleaseId: string;
  totalDownloads: number;
  storageMode?: StoragePersistenceMode;
  releases: ApkRelease[];
}

export interface RouteInfo {
  id: number;
  title: string;
  shortDesc: string;
  classesCount: number;
  spriteUrl: string;
  accentColor: 'emerald' | 'cyan' | 'amber';
  topics: string[];
  sampleLessons: string[];
  cliCommands: string[];
  finalProjectTitle: string;
  finalProjectDesc: string;
}

export interface CtfMission {
  id: string;
  routeId: number;
  routeLabel: string;
  title: string;
  difficulty: 'Iniciación' | 'Intermedio' | 'Avanzado' | 'Élite';
  xpReward: number;
  vector: string;
  flagHint: string;
  objective: string;
}

export interface RankInfo {
  tier: number;
  name: string;
  xpRequired: string;
  xpNumeric: number;
  spriteUrl: string;
  specialty: string;
  clearance: string;
}
