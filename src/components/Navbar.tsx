import { useState } from 'react';
import { Download, Menu, Moon, Shield, Sun, X } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeVersion: string;
  maintenanceMode: boolean;
}

const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#android-rutas', label: '8 Rutas' },
  { href: '#android-rangos', label: '12 Rangos' },
  { href: '#descargar', label: 'Descargar' }
];

export default function Navbar({
  theme,
  onToggleTheme,
  activeVersion,
  maintenanceMode
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-[#F4F7FA]/92 dark:bg-[#05080D]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single Brand Lockup + inline current version */}
        <a
          href="#inicio"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-4 h-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            KALFY
          </span>
          <span className="hidden sm:inline font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            · v{activeVersion}
          </span>
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        {!maintenanceMode ? (
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap shrink-0 py-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border-b-2 border-transparent hover:border-emerald-500/60"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Mantenimiento en curso</span>
          </div>
        )}

        {/* Zone 3: Theme Toggle & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'
            }
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition-colors flex items-center gap-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="hidden lg:inline">Modo Galaxia</span>
              </>
            )}
          </button>

          {!maintenanceMode && (
            <>
              <a
                href="#descargar"
                className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar APK</span>
              </a>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                className="md:hidden h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131C] flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {!maintenanceMode && mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-[#F4F7FA] dark:bg-[#05080D] px-4 py-3 space-y-1.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
