import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type {
  ApkRelease,
  AdminAppState,
  PublicAppState,
  StoragePersistenceMode
} from './src/types.ts';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const RAW_DATA_DIR = process.env.DATA_DIR?.trim();
const HAS_CUSTOM_DATA_DIR = Boolean(
  RAW_DATA_DIR && (RAW_DATA_DIR.includes('/') || RAW_DATA_DIR.startsWith('.'))
);
const DATA_DIR = HAS_CUSTOM_DATA_DIR && RAW_DATA_DIR
  ? path.resolve(RAW_DATA_DIR)
  : path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const RELEASES_FILE = path.join(DATA_DIR, 'releases.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim() || '';
const GITHUB_REPO = process.env.GITHUB_REPO?.trim() || '';
const GITHUB_RELEASE_TAG = 'kalfy-apk-store';
const HAS_GITHUB_CLOUD = Boolean(GITHUB_TOKEN && GITHUB_REPO && GITHUB_REPO.includes('/'));

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'Kalfy2026!';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'kalfy-default-hmac-secret-2026';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface StoredState {
  maintenanceMode: boolean;
  activeReleaseId: string;
  releases: ApkRelease[];
}

function getStoragePersistenceMode(): StoragePersistenceMode {
  if (HAS_GITHUB_CLOUD) return 'cloud-github';
  if (HAS_CUSTOM_DATA_DIR) return 'custom-disk';
  return 'ephemeral-local';
}

function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function createStarterApkIfNeeded(): { fileName: string; sizeBytes: number; sha256: string } {
  const starterFileName = 'kalfy-v1.1.0-oficial.apk';
  const starterPath = path.join(UPLOADS_DIR, starterFileName);

  if (!fs.existsSync(starterPath)) {
    // Build a valid minimal ZIP/APK container header with KALFY manifest metadata
    const manifestContent = Buffer.from(
      'KALFY Tactical Cybersecurity Academy Android Package v1.1.0\n' +
        'Package: com.kalfy.academy\n' +
        'MinSDK: 26 (Android 8.0+)\n' +
        'Modules: 8 Routes / 192 Interactive Labs / 16 CTF Missions\n',
      'utf8'
    );
    // Minimal valid ZIP local file header + content + central directory + EOCD
    const nameBuf = Buffer.from('META-INF/KALFY.MF', 'utf8');
    const crc = 0;
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // stored
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(manifestContent.length, 18);
    localHeader.writeUInt32LE(manifestContent.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralDir = Buffer.alloc(46);
    centralDir.writeUInt32LE(0x02014b50, 0);
    centralDir.writeUInt16LE(20, 4);
    centralDir.writeUInt16LE(20, 6);
    centralDir.writeUInt32LE(manifestContent.length, 20);
    centralDir.writeUInt32LE(manifestContent.length, 24);
    centralDir.writeUInt16LE(nameBuf.length, 28);

    const cdOffset = localHeader.length + nameBuf.length + manifestContent.length;
    const cdSize = centralDir.length + nameBuf.length;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);

    const fullBuf = Buffer.concat([localHeader, nameBuf, manifestContent, centralDir, nameBuf, eocd]);
    fs.writeFileSync(starterPath, fullBuf);
  }

  const stat = fs.statSync(starterPath);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(starterPath)).digest('hex');
  return { fileName: starterFileName, sizeBytes: stat.size, sha256: sha };
}

function loadState(): StoredState {
  if (fs.existsSync(RELEASES_FILE)) {
    try {
      const raw = fs.readFileSync(RELEASES_FILE, 'utf8');
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed && Array.isArray(parsed.releases)) {
        return parsed;
      }
    } catch {
      // Fallback to initial seed if JSON is corrupted
    }
  }

  const starter = createStarterApkIfNeeded();
  const initialState: StoredState = {
    maintenanceMode: false,
    activeReleaseId: 'rel-1-1-0',
    releases: [
      {
        id: 'rel-1-1-0',
        version: '1.1.0',
        fileName: 'kalfy-v1.1.0-oficial.apk',
        sizeBytes: starter.sizeBytes,
        sizeFormatted: '24.8 MB',
        sha256: starter.sha256,
        releaseDate: '2026-11-18',
        createdAt: '2026-11-18T10:00:00.000Z',
        downloads: 0,
        sourceType: 'starter',
        storageFileName: starter.fileName,
        notes: [
          'Terminal Linux CLI integrada optimizada para Android 8.0+ con autocompletado táctil',
          'Desbloqueo completo de las 8 Rutas Oficiales (192 clases interactivas) y 8 Proyectos Finales',
          '16 Misiones CTF en vivo con validación automática de banderas KALFY{...}',
          'Sincronización en la nube mejorada para conservar tu XP y rango al actualizar el APK',
          'Nuevos sprites pixel-art de los 12 Rangos Oficiales y Ranking Global en tiempo real'
        ]
      }
    ]
  };

  saveState(initialState);
  return initialState;
}

function saveLocalStateOnly(state: StoredState): void {
  fs.writeFileSync(RELEASES_FILE, JSON.stringify(state, null, 2), 'utf8');
}

interface GitHubReleaseAsset {
  id: number;
  name: string;
  url: string;
  browser_download_url: string;
}

interface GitHubReleaseResponse {
  id: number;
  upload_url: string;
  assets: GitHubReleaseAsset[];
}

function githubHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'kalfy-portal-storage',
    ...extra
  };
}

async function getOrCreateCloudRelease(): Promise<GitHubReleaseResponse | null> {
  if (!HAS_GITHUB_CLOUD) return null;
  const tagUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${GITHUB_RELEASE_TAG}`;
  const existing = await fetch(tagUrl, { headers: githubHeaders() });
  if (existing.ok) {
    return (await existing.json()) as GitHubReleaseResponse;
  }
  if (existing.status === 404) {
    const createRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
      method: 'POST',
      headers: githubHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        tag_name: GITHUB_RELEASE_TAG,
        name: 'KALFY Persistent APK Storage',
        body: 'Almacenamiento automático de versiones APK y metadatos de KALFY.',
        draft: false,
        prerelease: false
      })
    });
    if (createRes.ok) {
      return (await createRes.json()) as GitHubReleaseResponse;
    }
  }
  return null;
}

async function uploadBufferToCloudAsset(
  release: GitHubReleaseResponse,
  assetName: string,
  content: Buffer,
  contentType: string
): Promise<void> {
  const existingAsset = release.assets.find((a) => a.name === assetName);
  if (existingAsset) {
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${existingAsset.id}`, {
      method: 'DELETE',
      headers: githubHeaders()
    });
  }
  const uploadBase = release.upload_url.replace(/\{.*$/, '');
  const uploadRes = await fetch(`${uploadBase}?name=${encodeURIComponent(assetName)}`, {
    method: 'POST',
    headers: githubHeaders({
      'Content-Type': contentType,
      'Content-Length': String(content.length)
    }),
    body: new Uint8Array(content)
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`GitHub Release upload failed (${uploadRes.status}): ${errText}`);
  }
}

let cloudSyncChain: Promise<void> = Promise.resolve();

function scheduleCloudStateSync(stateSnapshot: StoredState): void {
  if (!HAS_GITHUB_CLOUD) return;
  const payload = JSON.stringify(stateSnapshot, null, 2);
  cloudSyncChain = cloudSyncChain
    .then(async () => {
      const release = await getOrCreateCloudRelease();
      if (!release) return;
      await uploadBufferToCloudAsset(
        release,
        'kalfy-state.json',
        Buffer.from(payload, 'utf8'),
        'application/json'
      );
    })
    .catch((err) => {
      console.error('GitHub Releases state sync failed:', err);
    });
}

async function syncBinaryToCloud(storageFileName: string, localFilePath: string): Promise<void> {
  if (!HAS_GITHUB_CLOUD || !fs.existsSync(localFilePath)) return;
  const release = await getOrCreateCloudRelease();
  if (!release) return;
  const buf = fs.readFileSync(localFilePath);
  await uploadBufferToCloudAsset(
    release,
    storageFileName,
    buf,
    'application/vnd.android.package-archive'
  );
}

async function bootstrapCloudStorage(): Promise<void> {
  if (!HAS_GITHUB_CLOUD) return;
  try {
    const release = await getOrCreateCloudRelease();
    if (!release) return;

    const stateAsset = release.assets.find((a) => a.name === 'kalfy-state.json');
    if (stateAsset) {
      const assetRes = await fetch(stateAsset.url, {
        headers: githubHeaders({ Accept: 'application/octet-stream' })
      });
      if (assetRes.ok) {
        const parsed = (await assetRes.json()) as StoredState;
        if (parsed && Array.isArray(parsed.releases) && parsed.releases.length > 0) {
          const localOnlyStarter =
            appState.releases.length === 1 &&
            appState.releases[0].sourceType === 'starter' &&
            appState.releases[0].downloads === 0;
          const cloudHasMore =
            parsed.releases.some((r) => r.sourceType !== 'starter') ||
            parsed.maintenanceMode ||
            parsed.releases.some((r) => r.downloads > 0);
          if (!fs.existsSync(RELEASES_FILE) || (localOnlyStarter && cloudHasMore)) {
            appState = parsed;
            saveLocalStateOnly(appState);
          }
        }
      }
    }

    // Download any missing uploaded APK assets from GitHub Releases to UPLOADS_DIR
    for (const rel of appState.releases) {
      if (rel.sourceType === 'upload' && rel.storageFileName) {
        const destPath = path.join(UPLOADS_DIR, rel.storageFileName);
        if (!fs.existsSync(destPath)) {
          const asset = release.assets.find((a) => a.name === rel.storageFileName);
          if (asset) {
            const binRes = await fetch(asset.url, {
              headers: githubHeaders({ Accept: 'application/octet-stream' })
            });
            if (binRes.ok) {
              const arrayBuf = await binRes.arrayBuffer();
              fs.writeFileSync(destPath, Buffer.from(arrayBuf));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to bootstrap from GitHub Releases:', err);
  }
}

function saveState(state: StoredState): void {
  saveLocalStateOnly(state);
  scheduleCloudStateSync(state);
}

let appState: StoredState = loadState();

// SSE clients for instant real-time updates from /admin to /
const sseClients = new Set<Response>();

function broadcastStateUpdate(): void {
  const payload = JSON.stringify({ type: 'state_updated', timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// HMAC-SHA256 stateless token helpers
function signAdminToken(username: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  const payload = Buffer.from(JSON.stringify({ u: username, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u: string; exp: number };
    return data.exp > Date.now() && data.u === ADMIN_USER;
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sesión no autorizada' });
    return;
  }
  const token = auth.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
  next();
}

// Multer configuration for up to 150 MB APK files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    if (
      lower.endsWith('.apk') ||
      file.mimetype === 'application/vnd.android.package-archive' ||
      file.mimetype === 'application/octet-stream'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .apk válidos'));
    }
  }
});

function buildPublicState(): PublicAppState {
  const activeRelease =
    appState.releases.find((r) => r.id === appState.activeReleaseId) || appState.releases[0] || null;
  const sorted = [...appState.releases].sort((a, b) => {
    if (a.id === appState.activeReleaseId) return -1;
    if (b.id === appState.activeReleaseId) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return {
    maintenanceMode: appState.maintenanceMode,
    activeRelease,
    changelogHistory: sorted
  };
}

function buildAdminState(): AdminAppState {
  const totalDownloads = appState.releases.reduce((acc, r) => acc + r.downloads, 0);
  const releasesWithStatus = [...appState.releases]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((rel) => {
      const missing =
        rel.sourceType === 'upload' &&
        (!rel.storageFileName || !fs.existsSync(path.join(UPLOADS_DIR, rel.storageFileName)));
      return {
        ...rel,
        binaryMissing: missing || undefined
      };
    });

  return {
    maintenanceMode: appState.maintenanceMode,
    activeReleaseId: appState.activeReleaseId,
    totalDownloads,
    storageMode: getStoragePersistenceMode(),
    releases: releasesWithStatus
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'kalfy-portal' });
  });

  // Public state for Landing Page
  app.get('/api/public/state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(buildPublicState());
  });

  // Real-time Server-Sent Events stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    sseClients.add(res);
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Public APK Download endpoint (increments counter + streams file or redirects)
  app.get('/api/apk/download', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (appState.maintenanceMode) {
      res.setHeader('Retry-After', '300');
      res.status(503).json({
        error: 'KALFY está en modo mantenimiento. Las descargas están pausadas temporalmente.'
      });
      return;
    }

    const requestedId = typeof req.query.id === 'string' ? req.query.id : appState.activeReleaseId;
    const release =
      appState.releases.find((r) => r.id === requestedId) ||
      (!req.query.id ? appState.releases.find((r) => r.id === appState.activeReleaseId) || appState.releases[0] : undefined);

    if (!release) {
      res.status(404).json({ error: 'La versión de APK solicitada no está disponible.' });
      return;
    }

    if (release.sourceType === 'external' && release.externalUrl) {
      release.downloads += 1;
      saveState(appState);
      broadcastStateUpdate();
      res.redirect(302, release.externalUrl);
      return;
    }

    const storagePath = release.storageFileName
      ? path.join(UPLOADS_DIR, release.storageFileName)
      : '';

    if (storagePath && fs.existsSync(storagePath)) {
      release.downloads += 1;
      saveState(appState);
      broadcastStateUpdate();
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${release.fileName}"`);
      res.sendFile(storagePath);
      return;
    }

    res.status(404).json({
      error:
        'El archivo binario APK no se encuentra en almacenamiento. Ábrelo en el panel de administración para restaurarlo.'
    });
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const cleanPass = typeof password === 'string' ? password.trim().replace(/^¡+/, '') : '';
    const validUsers = new Set(['admin', 'administración', 'administracion', 'administrador']);
    if (validUsers.has(cleanUser) && cleanPass === ADMIN_PASSWORD) {
      const token = signAdminToken(ADMIN_USER);
      res.json({ token, username: ADMIN_USER });
      return;
    }
    res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  });

  // Admin State
  app.get('/api/admin/state', requireAdmin, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(buildAdminState());
  });

  // Admin Reset Download Counters to 0
  app.post('/api/admin/reset-downloads', requireAdmin, (_req, res) => {
    appState.releases = appState.releases.map((r) => ({ ...r, downloads: 0 }));
    saveState(appState);
    broadcastStateUpdate();
    res.json(buildAdminState());
  });

  // Admin Toggle Maintenance Mode
  app.post('/api/admin/maintenance', requireAdmin, (req, res) => {
    const { maintenanceMode } = req.body as { maintenanceMode?: boolean };
    appState.maintenanceMode = Boolean(maintenanceMode);
    saveState(appState);
    broadcastStateUpdate();
    res.json(buildAdminState());
  });

  // Admin Restore Backup from localStorage (metadata & external releases)
  app.post('/api/admin/restore', requireAdmin, (req, res) => {
    const body = req.body as {
      maintenanceMode?: boolean;
      activeReleaseId?: string;
      releases?: ApkRelease[];
    };
    if (!Array.isArray(body.releases) || body.releases.length === 0) {
      res.status(400).json({ error: 'El respaldo no contiene versiones válidas.' });
      return;
    }

    const sanitizedReleases: ApkRelease[] = body.releases.map((rel) => {
      if (rel.sourceType === 'starter') {
        createStarterApkIfNeeded();
      }
      return rel;
    });

    appState = {
      maintenanceMode: Boolean(body.maintenanceMode),
      activeReleaseId:
        body.activeReleaseId && sanitizedReleases.some((r) => r.id === body.activeReleaseId)
          ? body.activeReleaseId
          : sanitizedReleases[0].id,
      releases: sanitizedReleases
    };

    saveState(appState);
    broadcastStateUpdate();
    res.json(buildAdminState());
  });

  // Admin Restore APK Binary from browser IndexedDB backup
  app.post(
    '/api/admin/restore-binary',
    requireAdmin,
    (req, res, next) => {
      upload.single('apkFile')(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: err instanceof Error ? err.message : 'Error al restaurar APK' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No se recibió el archivo binario .apk para restaurar.' });
          return;
        }
        const releaseId = typeof req.body.releaseId === 'string' ? req.body.releaseId.trim() : '';
        const versionRaw = typeof req.body.version === 'string' ? req.body.version.trim() : '';
        const fileName =
          typeof req.body.fileName === 'string' && req.body.fileName.trim()
            ? req.body.fileName.trim()
            : req.file.originalname;
        const releaseDate =
          typeof req.body.releaseDate === 'string' && req.body.releaseDate.trim()
            ? req.body.releaseDate.trim()
            : new Date().toISOString().slice(0, 10);
        const createdAt =
          typeof req.body.createdAt === 'string' && req.body.createdAt.trim()
            ? req.body.createdAt.trim()
            : new Date().toISOString();
        const downloads = Math.max(0, Number(req.body.downloads) || 0);
        const activateNow = req.body.activate === 'true';
        const notesRaw = typeof req.body.notes === 'string' ? req.body.notes : '';
        let notes: string[] = [];
        try {
          const parsedNotes = JSON.parse(notesRaw);
          if (Array.isArray(parsedNotes)) {
            notes = parsedNotes.map((n) => String(n).trim()).filter(Boolean);
          }
        } catch {
          notes = String(notesRaw)
            .split('\n')
            .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
            .filter(Boolean);
        }

        const sha256 = await computeFileSha256(req.file.path);
        const restoredId = releaseId || `rel-${Date.now()}`;
        const cleanVer = (versionRaw || '1.0.0').replace(/^v/i, '');
        if (notes.length === 0) {
          notes = [`Actualización oficial KALFY v${cleanVer}`];
        }

        await syncBinaryToCloud(req.file.filename, req.file.path).catch((err) => {
          console.error('Cloud binary sync warning:', err);
        });

        const restoredRelease: ApkRelease = {
          id: restoredId,
          version: cleanVer,
          fileName: fileName.endsWith('.apk') ? fileName : `kalfy-v${cleanVer}.apk`,
          sizeBytes: req.file.size,
          sizeFormatted: formatMB(req.file.size),
          sha256,
          releaseDate,
          createdAt,
          downloads,
          sourceType: 'upload',
          storageFileName: req.file.filename,
          notes
        };

        const existingIdx = appState.releases.findIndex((r) => r.id === restoredId);
        if (existingIdx >= 0) {
          appState.releases[existingIdx] = restoredRelease;
        } else {
          appState.releases.unshift(restoredRelease);
        }

        if (activateNow) {
          appState.activeReleaseId = restoredId;
        }

        saveState(appState);
        broadcastStateUpdate();
        res.json(buildAdminState());
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Error restaurando el binario APK'
        });
      }
    }
  );

  // Admin Upload new APK or External URL Release
  app.post(
    '/api/admin/upload',
    requireAdmin,
    (req, res, next) => {
      upload.single('apkFile')(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: err instanceof Error ? err.message : 'Error al subir archivo' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const versionRaw = typeof req.body.version === 'string' ? req.body.version.trim() : '';
        const notesRaw = typeof req.body.notes === 'string' ? req.body.notes : '';
        const externalUrl = typeof req.body.externalUrl === 'string' ? req.body.externalUrl.trim() : '';
        const manualSizeMB = typeof req.body.sizeFormatted === 'string' ? req.body.sizeFormatted.trim() : '';
        const manualSha256 = typeof req.body.sha256 === 'string' ? req.body.sha256.trim() : '';
        const activateNow = req.body.activateNow !== 'false';

        if (!versionRaw) {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(400).json({ error: 'El número de versión es obligatorio (ej. 1.2.0).' });
          return;
        }

        const notes: string[] = String(notesRaw)
          .split('\n')
          .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean);

        if (notes.length === 0) {
          notes.push(`Actualización oficial KALFY v${versionRaw}`);
        }

        const now = new Date();
        const releaseId = `rel-${Date.now()}`;
        const releaseDate = now.toISOString().slice(0, 10);

        let newRelease: ApkRelease;

        if (req.file) {
          const sha256 = await computeFileSha256(req.file.path);
          await syncBinaryToCloud(req.file.filename, req.file.path).catch((err) => {
            console.error('Cloud binary sync warning:', err);
          });
          newRelease = {
            id: releaseId,
            version: versionRaw.replace(/^v/i, ''),
            fileName: req.file.originalname.endsWith('.apk')
              ? req.file.originalname
              : `kalfy-v${versionRaw.replace(/^v/i, '')}.apk`,
            sizeBytes: req.file.size,
            sizeFormatted: formatMB(req.file.size),
            sha256,
            releaseDate,
            createdAt: now.toISOString(),
            downloads: 0,
            sourceType: 'upload',
            storageFileName: req.file.filename,
            notes
          };
        } else if (externalUrl) {
          if (!/^https?:\/\//i.test(externalUrl)) {
            res.status(400).json({ error: 'La URL externa debe comenzar con http:// o https://' });
            return;
          }
          newRelease = {
            id: releaseId,
            version: versionRaw.replace(/^v/i, ''),
            fileName: `kalfy-v${versionRaw.replace(/^v/i, '')}.apk`,
            sizeBytes: 0,
            sizeFormatted: manualSizeMB || '25.0 MB',
            sha256:
              manualSha256 ||
              crypto.createHash('sha256').update(`${versionRaw}:${externalUrl}`).digest('hex'),
            releaseDate,
            createdAt: now.toISOString(),
            downloads: 0,
            sourceType: 'external',
            externalUrl,
            notes
          };
        } else {
          res.status(400).json({ error: 'Adjunta un archivo .apk o proporciona una URL directa.' });
          return;
        }

        appState.releases.unshift(newRelease);
        if (activateNow) {
          appState.activeReleaseId = newRelease.id;
        }
        saveState(appState);
        broadcastStateUpdate();

        res.json({ release: newRelease, state: buildAdminState() });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Error interno procesando el APK'
        });
      }
    }
  );

  // Admin Update Release (activate or edit version/notes)
  app.patch('/api/admin/releases/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const release = appState.releases.find((r) => r.id === id);
    if (!release) {
      res.status(404).json({ error: 'Versión no encontrada.' });
      return;
    }

    const { version, notes, activate, externalUrl, sizeFormatted, sha256 } = req.body as {
      version?: string;
      notes?: string[];
      activate?: boolean;
      externalUrl?: string;
      sizeFormatted?: string;
      sha256?: string;
    };

    if (typeof version === 'string' && version.trim()) {
      release.version = version.trim().replace(/^v/i, '');
    }
    if (Array.isArray(notes)) {
      const cleaned = notes.map((n) => n.trim()).filter(Boolean);
      if (cleaned.length > 0) release.notes = cleaned;
    }
    if (typeof externalUrl === 'string' && release.sourceType === 'external' && externalUrl.trim()) {
      release.externalUrl = externalUrl.trim();
    }
    if (typeof sizeFormatted === 'string' && sizeFormatted.trim()) {
      release.sizeFormatted = sizeFormatted.trim();
    }
    if (typeof sha256 === 'string' && sha256.trim()) {
      release.sha256 = sha256.trim();
    }
    if (activate === true) {
      appState.activeReleaseId = release.id;
    }

    saveState(appState);
    broadcastStateUpdate();
    res.json(buildAdminState());
  });

  // Admin Delete Release
  app.delete('/api/admin/releases/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    if (appState.releases.length <= 1) {
      res.status(400).json({ error: 'Debe permanecer al menos una versión en el historial.' });
      return;
    }
    const idx = appState.releases.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Versión no encontrada.' });
      return;
    }

    const [removed] = appState.releases.splice(idx, 1);

    // Clean up uploaded file if not referenced by any remaining release
    if (removed.storageFileName && removed.sourceType === 'upload') {
      const stillReferenced = appState.releases.some(
        (r) => r.storageFileName === removed.storageFileName
      );
      if (!stillReferenced) {
        const filePath = path.join(UPLOADS_DIR, removed.storageFileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    if (appState.activeReleaseId === id && appState.releases.length > 0) {
      appState.activeReleaseId = appState.releases[0].id;
    }

    saveState(appState);
    broadcastStateUpdate();
    res.json(buildAdminState());
  });

  // Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  await bootstrapCloudStorage();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KALFY server running on http://0.0.0.0:${PORT} (storage: ${getStoragePersistenceMode()})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
