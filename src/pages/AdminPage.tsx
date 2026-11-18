import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileArchive,
  Link as LinkIcon,
  Lock,
  LogOut,
  Moon,
  Power,
  RefreshCw,
  Shield,
  Sun,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import type { AdminAppState, ApkRelease, PublicAppState } from '../types.ts';

interface AdminPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onBackHome: () => void;
}

const TOKEN_STORAGE_KEY = 'kalfy_admin_token';
const ADMIN_BACKUP_KEY = 'kalfy_admin_releases_backup_v2';
const PUBLIC_CACHE_KEY = 'kalfy_public_state_cache_v2';

function syncLocalStorageBackup(state: AdminAppState) {
  try {
    localStorage.setItem(ADMIN_BACKUP_KEY, JSON.stringify(state));
    const activeRelease =
      state.releases.find((r) => r.id === state.activeReleaseId) || state.releases[0] || null;
    const publicSnapshot: PublicAppState = {
      maintenanceMode: state.maintenanceMode,
      activeRelease,
      changelogHistory: state.releases
    };
    localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(publicSnapshot));
  } catch {
    // Ignore storage quota issues
  }
}

export default function AdminPage({
  theme,
  onToggleTheme,
  onBackHome
}: AdminPageProps) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [adminState, setAdminState] = useState<AdminAppState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Upload manager state
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSha256, setPreviewSha256] = useState<string>('');
  const [computingHash, setComputingHash] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [manualSize, setManualSize] = useState('25.4 MB');
  const [version, setVersion] = useState('');
  const [notesText, setNotesText] = useState(
    'Corrección de errores en terminal Linux\nNuevos retos CTF sincronizados en la nube\nMejoras de rendimiento para Android 8.0+'
  );
  const [activateNow, setActivateNow] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editingRelease, setEditingRelease] = useState<ApkRelease | null>(null);
  const [editVersion, setEditVersion] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showFeedback = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchAdminState = useCallback(async (authToken: string) => {
    setLoadingState(true);
    try {
      const res = await fetch('/api/admin/state', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setAdminState(null);
        return;
      }
      if (!res.ok) throw new Error('Error al cargar el panel');
      const data = (await res.json()) as AdminAppState;
      setAdminState(data);
      // Save server state into localStorage unless server reset to starter while local backup has newer custom releases
      try {
        const existingRaw = localStorage.getItem(ADMIN_BACKUP_KEY);
        if (!existingRaw || data.releases.some((r) => r.sourceType !== 'starter')) {
          syncLocalStorageBackup(data);
        }
      } catch {
        syncLocalStorageBackup(data);
      }
      setStateError(null);
    } catch (err) {
      setStateError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchAdminState(token);
    const evtSource = new EventSource('/api/events');
    evtSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type?: string };
        if (parsed.type === 'state_updated') {
          fetchAdminState(token);
        }
      } catch {
        // Ignore SSE keepalive
      }
    };
    return () => {
      evtSource.close();
    };
  }, [token, fetchAdminState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Credenciales incorrectas.');
        return;
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setPassword('');
    } catch {
      setAuthError('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setAdminState(null);
  };

  const handleFilePicked = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      showFeedback('err', 'Solo se admiten archivos con extensión .apk');
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      showFeedback('err', 'El archivo supera el límite máximo permitido de 150 MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewSha256('');
    setComputingHash(true);

    // Auto-suggest version if found in filename like kalfy-v1.2.0.apk
    const verMatch = file.name.match(/v?(\d+\.\d+\.\d+)/i);
    if (verMatch && !version) {
      setVersion(verMatch[1]);
    }

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setPreviewSha256(hashHex);
    } catch {
      setPreviewSha256('Se calculará en el servidor al finalizar la subida');
    } finally {
      setComputingHash(false);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!version.trim()) {
      showFeedback('err', 'Introduce el número de versión (ej. 1.2.0).');
      return;
    }
    if (sourceMode === 'file' && !selectedFile) {
      showFeedback('err', 'Selecciona o arrastra un archivo .apk para subir.');
      return;
    }
    if (sourceMode === 'url' && !/^https?:\/\//i.test(externalUrl.trim())) {
      showFeedback('err', 'Introduce una URL válida que comience por http:// o https://');
      return;
    }

    const formData = new FormData();
    formData.append('version', version.trim());
    formData.append('notes', notesText);
    formData.append('activateNow', String(activateNow));

    if (sourceMode === 'file' && selectedFile) {
      formData.append('apkFile', selectedFile);
    } else {
      formData.append('externalUrl', externalUrl.trim());
      formData.append('sizeFormatted', manualSize.trim() || '25.0 MB');
    }

    setUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const resJson = JSON.parse(xhr.responseText) as {
          state?: AdminAppState;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && resJson.state) {
          setAdminState(resJson.state);
          syncLocalStorageBackup(resJson.state);
          setSelectedFile(null);
          setPreviewSha256('');
          setExternalUrl('');
          setVersion('');
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
          showFeedback('ok', 'Versión publicada y guardada en servidor y localStorage.');
        } else {
          showFeedback('err', resJson.error || 'Error al publicar la versión.');
        }
      } catch {
        showFeedback('err', 'Respuesta inválida del servidor al subir el APK.');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      showFeedback('err', 'Error de red durante la subida del APK.');
    };

    xhr.send(formData);
  };

  const handleToggleMaintenance = async () => {
    if (!token || !adminState || togglingMaintenance) return;
    setTogglingMaintenance(true);
    try {
      const nextMode = !adminState.maintenanceMode;
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ maintenanceMode: nextMode })
      });
      if (res.status === 401) {
        handleLogout();
        setAuthError('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'No se pudo cambiar el estado de mantenimiento.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      showFeedback(
        'ok',
        data.maintenanceMode
          ? 'Modo Mantenimiento ACTIVADO: la web pública y las descargas están pausadas.'
          : 'Modo Mantenimiento DESACTIVADO: la web pública y las descargas están en vivo.'
      );
    } catch {
      showFeedback('err', 'No se pudo cambiar el estado de mantenimiento.');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleResetDownloads = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/reset-downloads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'Error al reiniciar contadores.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      showFeedback('ok', 'Contadores de descargas reiniciados a 0.');
    } catch {
      showFeedback('err', 'Error al reiniciar contadores.');
    }
  };

  const handleActivateRelease = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/releases/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activate: true })
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'Error al activar la versión.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      showFeedback('ok', 'Versión activada inmediatamente en la página principal.');
    } catch {
      showFeedback('err', 'Error al activar la versión.');
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/releases/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'No se pudo eliminar la versión.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      showFeedback('ok', 'Versión eliminada del historial.');
    } catch {
      showFeedback('err', 'Error de red al eliminar la versión.');
    }
  };

  const handleRestoreFromLocalStorage = async () => {
    if (!token) return;
    try {
      const raw = localStorage.getItem(ADMIN_BACKUP_KEY);
      if (!raw) return;
      const backup = JSON.parse(raw) as AdminAppState;
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          maintenanceMode: backup.maintenanceMode,
          activeReleaseId: backup.activeReleaseId,
          releases: backup.releases
        })
      });
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'No se pudo restaurar el respaldo.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      showFeedback('ok', 'Respaldo de localStorage restaurado al servidor correctamente.');
    } catch {
      showFeedback('err', 'Error al restaurar desde localStorage.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingRelease) return;
    const notesArray = editNotes
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/admin/releases/${encodeURIComponent(editingRelease.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          version: editVersion.trim(),
          notes: notesArray
        })
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = (await res.json()) as AdminAppState & { error?: string };
      if (!res.ok) {
        showFeedback('err', data.error || 'No se pudieron guardar los cambios.');
        return;
      }
      setAdminState(data);
      syncLocalStorageBackup(data);
      setEditingRelease(null);
      showFeedback('ok', 'Metadatos de versión actualizados en vivo.');
    } catch {
      showFeedback('err', 'No se pudieron guardar los cambios.');
    }
  };

  const handleCopyHash = async (id: string, sha: string) => {
    try {
      await navigator.clipboard.writeText(sha);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore
    }
  };

  // Top Admin Header
  const renderHeader = () => (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0D131C]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </span>
          <span className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            KALFY Admin
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#05080D] text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Galaxia</span>
              </>
            )}
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackHome();
            }}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#05080D] hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Web Pública</span>
          </a>

          {token && (
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Login Screen
  if (!token) {
    return (
      <div translate="no" className="min-h-screen bg-[#F4F7FA] dark:bg-[#05080D] flex flex-col notranslate">
        {renderHeader()}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                  Acceso Privado de Administrador
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gestión de versiones APK, changelog y estado de descarga
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} translate="no" className="space-y-4 notranslate">
              <div>
                <label
                  htmlFor="admin-user"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Usuario Administrador
                </label>
                <input
                  id="admin-user"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="admin-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-display font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {authLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const activeRelease = adminState?.releases.find(
    (r) => r.id === adminState.activeReleaseId
  );

  return (
    <div
      translate="no"
      className="min-h-screen bg-[#F4F7FA] dark:bg-[#05080D] text-slate-900 dark:text-slate-100 notranslate"
    >
      {renderHeader()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {feedback && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2.5 ${
              feedback.type === 'ok'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {stateError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300 flex items-center justify-between gap-3">
            <span>{stateError}</span>
            <button
              type="button"
              onClick={() => token && fetchAdminState(token)}
              className="px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 font-semibold text-xs cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        {loadingState && !adminState && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-6 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Cargando estado del servidor y lanzamientos...</span>
          </div>
        )}

        {adminState?.maintenanceMode && (
          <div className="rounded-xl border border-amber-500/45 bg-amber-500/12 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong className="font-semibold">Modo Mantenimiento Activo:</strong> La página pública muestra el aviso de mantenimiento y las descargas del APK están bloqueadas.
              </div>
            </div>
            <button
              type="button"
              disabled={togglingMaintenance}
              onClick={handleToggleMaintenance}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{togglingMaintenance ? 'Actualizando...' : 'Desactivar Mantenimiento'}</span>
            </button>
          </div>
        )}

        {(() => {
          try {
            const rawBackup = localStorage.getItem(ADMIN_BACKUP_KEY);
            if (!rawBackup || !adminState) return null;
            const parsedBackup = JSON.parse(rawBackup) as AdminAppState;
            const backupActive = parsedBackup.releases.find(
              (r) => r.id === parsedBackup.activeReleaseId
            );
            const serverActive = adminState.releases.find(
              (r) => r.id === adminState.activeReleaseId
            );
            if (
              backupActive &&
              serverActive &&
              (backupActive.id !== serverActive.id ||
                parsedBackup.releases.length > adminState.releases.length)
            ) {
              return (
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <strong className="font-semibold">Respaldo detectado en localStorage:</strong>{' '}
                    Versión guardada <code className="font-mono">v{backupActive.version}</code> ({parsedBackup.releases.length} versiones).
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreFromLocalStorage}
                    className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sincronizar respaldo al servidor</span>
                  </button>
                </div>
              );
            }
          } catch {
            return null;
          }
          return null;
        })()}

        {/* Top KPI Strip & Maintenance Switch */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-5">
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Versión Activa en Web
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              v{activeRelease?.version || '—'}
            </div>
            <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
              {activeRelease?.fileName || 'Sin archivo'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-5 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Descargas APK Actual / Total
              </div>
              <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                {activeRelease ? activeRelease.downloads.toLocaleString('es-ES') : '0'}{' '}
                <span className="text-sm font-mono font-normal text-slate-500">
                  / {adminState ? adminState.totalDownloads.toLocaleString('es-ES') : '0'}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Registro real en vivo
              </span>
              {adminState && adminState.totalDownloads > 0 && (
                <button
                  type="button"
                  onClick={handleResetDownloads}
                  className="font-mono text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Reiniciar a 0
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-5">
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Versiones en Historial
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {adminState?.releases.length ?? 0}
            </div>
            <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
              Activación instantánea en 1 clic
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Estado de la Web
              </span>
              <span
                className={`font-mono text-xs font-semibold ${
                  adminState?.maintenanceMode
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {adminState?.maintenanceMode ? 'Mantenimiento' : 'Activa'}
              </span>
            </div>
            <button
              type="button"
              disabled={!adminState || togglingMaintenance}
              onClick={handleToggleMaintenance}
              className={`mt-3 w-full h-10 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer ${
                adminState?.maintenanceMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                {togglingMaintenance
                  ? 'Actualizando...'
                  : adminState?.maintenanceMode
                    ? 'Activar Descarga en Web'
                    : 'Poner Web en Mantenimiento'}
              </span>
            </button>
          </div>
        </section>

        {/* Upload & Release Manager */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                Gestor de Subida de APK en Vivo
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Sube un archivo .apk de hasta 150 MB o enlaza un almacenamiento externo. Al publicar, la web principal se actualiza al instante.
              </p>
            </div>

            {/* Source Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#05080D] border border-slate-200 dark:border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setSourceMode('file')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                  sourceMode === 'file'
                    ? 'bg-white dark:bg-[#0D131C] text-slate-900 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir .APK</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('url')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                  sourceMode === 'url'
                    ? 'bg-white dark:bg-[#0D131C] text-slate-900 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL Directa</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: File Dropzone or External URL */}
            <div className="lg:col-span-6 space-y-4">
              {sourceMode === 'file' ? (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0] || null;
                      handleFilePicked(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50 dark:bg-[#05080D]/70'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".apk,application/vnd.android.package-archive"
                      onChange={(e) => handleFilePicked(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <FileArchive className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                    <p className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {selectedFile
                        ? selectedFile.name
                        : 'Arrastra aquí tu archivo .apk o haz clic para seleccionarlo'}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      Soporte para archivos APK de hasta 150 MB · Cálculo automático de MB y SHA-256
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#05080D] p-3.5 font-mono text-xs space-y-1.5 tabular-nums">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Tamaño detectado:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500 dark:text-slate-400">SHA-256 calculado:</span>
                        <span className="text-cyan-700 dark:text-cyan-400 break-all">
                          {computingHash ? 'Calculando hash SHA-256...' : previewSha256}
                        </span>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between font-mono text-xs tabular-nums">
                        <span>Subiendo APK al servidor...</span>
                        <span className="font-bold text-emerald-500">{uploadProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="ext-url"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Enlace directo al archivo APK (almacenamiento externo)
                    </label>
                    <input
                      id="ext-url"
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://cdn.tudominio.com/releases/kalfy-v1.2.0.apk"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ext-size"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Tamaño estimado mostrado en web (ej. 26.4 MB)
                    </label>
                    <input
                      id="ext-size"
                      type="text"
                      value={manualSize}
                      onChange={(e) => setManualSize(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Version & Changelog Metadata */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label
                  htmlFor="apk-version"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Número de Versión (para sincronización obligatoria en app)
                </label>
                <input
                  id="apk-version"
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Ej. 1.2.0"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="apk-notes"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Notas de la Actualización / Changelog (una mejora por línea)
                </label>
                <textarea
                  id="apk-notes"
                  rows={5}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full p-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateNow}
                  onChange={(e) => setActivateNow(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span>Activar inmediatamente esta versión como descarga principal en la web</span>
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-display font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {uploading ? `Publicando (${uploadProgress}%)...` : 'Publicar Versión en Vivo'}
              </button>
            </div>
          </form>
        </section>

        {/* Release History Table */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              Historial de APKs Subidos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Activa cualquier compilación previa con un clic, edita sus notas o elimina versiones antiguas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#05080D] font-mono text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Versión</th>
                  <th className="py-3 px-4 font-semibold">Archivo / Origen</th>
                  <th className="py-3 px-4 font-semibold">Tamaño</th>
                  <th className="py-3 px-4 font-semibold">SHA-256</th>
                  <th className="py-3 px-4 font-semibold text-right">Descargas</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {adminState?.releases.map((rel) => {
                  const isActive = rel.id === adminState.activeReleaseId;
                  return (
                    <tr
                      key={rel.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#05080D]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        v{rel.version}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                          {rel.fileName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {rel.releaseDate} · {rel.sourceType === 'external' ? 'URL Externa' : 'Almacenamiento Local'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums whitespace-nowrap">
                        {rel.sizeFormatted}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyHash(rel.id, rel.sha256)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-500 cursor-pointer"
                          title={rel.sha256}
                        >
                          <span>{rel.sha256.slice(0, 12)}...</span>
                          {copiedId === rel.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-right tabular-nums">
                        {rel.downloads.toLocaleString('es-ES')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        {isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Activa en Web
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">Historial</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivateRelease(rel.id)}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-semibold cursor-pointer"
                            >
                              Activar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRelease(rel);
                              setEditVersion(rel.version);
                              setEditNotes(rel.notes.join('\n'));
                            }}
                            title="Editar versión y notas"
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500/60 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRelease(rel.id)}
                            title="Eliminar versión"
                            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-500/60 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Edit Release Modal */}
      {editingRelease && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setEditingRelease(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D131C] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold">
                Editar Versión v{editingRelease.version}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRelease(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Número de versión</label>
                <input
                  type="text"
                  required
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Notas de versión (1 mejora por línea)
                </label>
                <textarea
                  rows={6}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#05080D] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRelease(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
