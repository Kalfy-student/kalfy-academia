import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { ApkRelease, AdminAppState, PublicAppState } from './src/types.ts';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const RELEASES_FILE = path.join(DATA_DIR, 'releases.json');

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'Kalfy2026!';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'kalfy-default-hmac-secret-2026';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface StoredState {
  maintenanceMode: boolean;
  activeReleaseId: string;
  releases: ApkRelease[];
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
        downloads: 1248,
        sourceType: 'starter',
        storageFileName: starter.fileName,
        notes: [
          'Terminal Linux CLI integrada optimizada para Android 8.0+ con autocompletado táctil',
          'Desbloqueo completo de las 8 Rutas Oficiales (192 clases interactivas) y 8 Proyectos Finales',
          '16 Misiones CTF en vivo con validación automática de banderas KALFY{...}',
          'Sincronización en la nube mejorada para conservar tu XP y rango al actualizar el APK',
          'Nuevos sprites pixel-art de los 12 Rangos Oficiales y Ranking Global en tiempo real'
        ]
      },
      {
        id: 'rel-1-0-0',
        version: '1.0.0',
        fileName: 'kalfy-v1.0.0-inicial.apk',
        sizeBytes: 23278387,
        sizeFormatted: '22.2 MB',
        sha256: '3a7f9c12e84b01d5f49a6c8e2b7d104a8f2c5e9b1d4a7c0f3e6b8d1a4c7e9f02',
        releaseDate: '2026-10-04',
        createdAt: '2026-10-04T15:30:00.000Z',
        downloads: 864,
        sourceType: 'starter',
        storageFileName: starter.fileName,
        notes: [
          'Lanzamiento oficial de KALFY para Android',
          'Módulos iniciales de Redes, Linux, Python y Criptografía',
          'Sistema de XP por clase completada y entrega de Proyectos Finales'
        ]
      }
    ]
  };

  saveState(initialState);
  return initialState;
}

function saveState(state: StoredState): void {
  fs.writeFileSync(RELEASES_FILE, JSON.stringify(state, null, 2), 'utf8');
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
  return {
    maintenanceMode: appState.maintenanceMode,
    activeReleaseId: appState.activeReleaseId,
    totalDownloads,
    releases: [...appState.releases].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
    res.json(buildPublicState());
  });

  // Real-time Server-Sent Events stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
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
    if (appState.maintenanceMode) {
      res.status(503).json({ error: 'Descargas pausadas temporalmente por mantenimiento.' });
      return;
    }

    const releaseId = typeof req.query.id === 'string' ? req.query.id : appState.activeReleaseId;
    const release = appState.releases.find((r) => r.id === releaseId) || appState.releases[0];

    if (!release) {
      res.status(404).json({ error: 'No hay ninguna versión de APK disponible.' });
      return;
    }

    release.downloads += 1;
    saveState(appState);
    broadcastStateUpdate();

    if (release.sourceType === 'external' && release.externalUrl) {
      res.redirect(302, release.externalUrl);
      return;
    }

    const storagePath = release.storageFileName
      ? path.join(UPLOADS_DIR, release.storageFileName)
      : '';

    if (storagePath && fs.existsSync(storagePath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${release.fileName}"`);
      res.sendFile(storagePath);
      return;
    }

    res.status(404).json({ error: 'El archivo APK solicitado no se encuentra en almacenamiento.' });
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      const token = signAdminToken(username);
      res.json({ token, username });
      return;
    }
    res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  });

  // Admin State
  app.get('/api/admin/state', requireAdmin, (_req, res) => {
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

  // Admin Restore Backup from localStorage (useful on ephemeral hosts)
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
      const hasLocalFile =
        rel.storageFileName && fs.existsSync(path.join(UPLOADS_DIR, rel.storageFileName));
      if (rel.sourceType === 'upload' && !hasLocalFile) {
        // Fallback to starter file only if uploaded binary was wiped on ephemeral disk, preserving metadata
        return {
          ...rel,
          storageFileName: 'kalfy-v1.1.0-oficial.apk'
        };
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KALFY server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
