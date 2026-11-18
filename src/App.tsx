import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import Navbar from './components/Navbar.tsx';
import HeroSection from './components/HeroSection.tsx';
import GalaxyBackground from './components/GalaxyBackground.tsx';
import Footer from './components/Footer.tsx';
import AdminPage from './pages/AdminPage.tsx';
import type { PublicAppState } from './types.ts';

const THEME_STORAGE_KEY = 'kalfy_theme';
const PUBLIC_CACHE_KEY = 'kalfy_public_state_cache_v2';
const SECRET_ADMIN_PATH = '/kalfy-studio-94x';

function readCachedPublicState(): PublicAppState {
  try {
    const raw = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PublicAppState;
      if (parsed && typeof parsed.maintenanceMode === 'boolean') {
        return parsed;
      }
    }
  } catch {
    // Ignore invalid localStorage cache
  }
  return {
    maintenanceMode: false,
    activeRelease: null,
    changelogHistory: []
  };
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [publicState, setPublicState] = useState<PublicAppState>(() => readCachedPublicState());
  const [loading, setLoading] = useState(() => !readCachedPublicState().activeRelease);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);

  const isAdminRoute =
    pathname === SECRET_ADMIN_PATH || pathname === `${SECRET_ADMIN_PATH}/`;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const fetchPublicState = useCallback(async () => {
    try {
      const res = await fetch('/api/public/state', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as PublicAppState;
        setPublicState(data);
        try {
          localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(data));
        } catch {
          // Ignore storage quota errors
        }
      }
    } catch {
      // Retain localStorage cached state on offline/transient error
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = useCallback(
    (targetPath: string) => {
      if (window.location.pathname !== targetPath || window.location.hash) {
        window.history.pushState({}, '', targetPath);
        setPathname(targetPath);
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      if (targetPath === '/') {
        setPublicState(readCachedPublicState());
        fetchPublicState();
      }
    },
    [fetchPublicState]
  );

  useEffect(() => {
    if (isAdminRoute) return;

    fetchPublicState();
    const evtSource = new EventSource('/api/events');
    evtSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type?: string };
        if (parsed.type === 'state_updated') {
          fetchPublicState();
        }
      } catch {
        // Ignore heartbeat messages
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchPublicState();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    const pollTimer = window.setInterval(() => {
      fetchPublicState();
    }, 10000);

    return () => {
      evtSource.close();
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.clearInterval(pollTimer);
    };
  }, [isAdminRoute, fetchPublicState]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Hidden private management route ONLY on /kalfy-studio-94x
  if (isAdminRoute) {
    return (
      <AdminPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackHome={() => navigateTo('/')}
      />
    );
  }

  const activeVersion = publicState.activeRelease?.version || '1.1.0';

  const handleManualCheck = async () => {
    setCheckingMaintenance(true);
    await fetchPublicState();
    window.setTimeout(() => setCheckingMaintenance(false), 350);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FA] dark:bg-[#05080D] text-slate-900 dark:text-[#F8FAFC]">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        activeVersion={activeVersion}
        maintenanceMode={publicState.maintenanceMode}
      />

      <main className="flex-1 flex flex-col">
        {publicState.maintenanceMode ? (
          <section className="relative flex-1 min-h-[calc(100vh-8.25rem)] py-12 px-4 sm:px-6 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
            <GalaxyBackground theme={theme} />

            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-amber-500/35 bg-white/94 dark:bg-[#0D131C]/94 backdrop-blur-md p-7 sm:p-9 shadow-xl text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Mantenimiento en Curso
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Estamos actualizando KALFY
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Las descargas del archivo APK y la vista previa web están pausadas temporalmente mientras desplegamos mejoras y verificamos la nueva compilación para Android.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#05080D]/80 px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 tabular-nums">
                <span>Versión actual: v{activeVersion}</span>
                <span aria-hidden="true">·</span>
                <span>Tu progreso en la nube está seguro</span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checkingMaintenance}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${checkingMaintenance ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {checkingMaintenance ? 'Comprobando estado...' : 'Comprobar disponibilidad'}
                  </span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <HeroSection
            theme={theme}
            release={publicState.activeRelease}
            maintenanceMode={publicState.maintenanceMode}
            loading={loading}
            onRefreshState={fetchPublicState}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
