import { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar.tsx';
import HeroSection from './components/HeroSection.tsx';
import Footer from './components/Footer.tsx';
import AdminPage from './pages/AdminPage.tsx';
import type { PublicAppState } from './types.ts';

const THEME_STORAGE_KEY = 'kalfy_theme';

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [publicState, setPublicState] = useState<PublicAppState>({
    maintenanceMode: false,
    activeRelease: null,
    changelogHistory: []
  });
  const [loading, setLoading] = useState(true);

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

  const navigateTo = useCallback((targetPath: string) => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setPathname(targetPath);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const fetchPublicState = useCallback(async () => {
    try {
      const res = await fetch('/api/public/state');
      if (res.ok) {
        const data = (await res.json()) as PublicAppState;
        setPublicState(data);
      }
    } catch {
      // Keep last state on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
    return () => {
      evtSource.close();
    };
  }, [fetchPublicState]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (pathname.startsWith('/admin')) {
    return (
      <AdminPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackHome={() => navigateTo('/')}
      />
    );
  }

  const activeVersion = publicState.activeRelease?.version || '1.1.0';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FA] dark:bg-[#05080D] text-slate-900 dark:text-[#F8FAFC]">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        activeVersion={activeVersion}
        maintenanceMode={publicState.maintenanceMode}
      />

      <main className="flex-1">
        <HeroSection
          release={publicState.activeRelease}
          maintenanceMode={publicState.maintenanceMode}
          loading={loading}
        />
      </main>

      <Footer onOpenAdmin={() => navigateTo('/admin')} />
    </div>
  );
}
