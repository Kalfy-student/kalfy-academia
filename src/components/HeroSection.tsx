import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import AndroidShowcase from './AndroidShowcase.tsx';
import GalaxyBackground from './GalaxyBackground.tsx';
import type { ApkRelease } from '../types.ts';

interface HeroSectionProps {
  theme: 'dark' | 'light';
  release: ApkRelease | null;
  maintenanceMode: boolean;
  loading: boolean;
  onRefreshState?: () => void;
}

export default function HeroSection({
  theme,
  release,
  maintenanceMode,
  loading,
  onRefreshState
}: HeroSectionProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  const versionLabel = release ? `v${release.version}` : 'v1.1.0';
  const currentNotes = release?.notes?.slice(0, 3) || [];

  return (
    <section
      id="inicio"
      className="relative scroll-mt-20 min-h-[calc(100vh-8.25rem)] py-6 sm:py-8 lg:py-8 flex items-center overflow-hidden border-b border-slate-200 dark:border-slate-800/80"
    >
      {/* Interactive Mouse-Parallax Galaxy + Animated Starfield Canvas */}
      <GalaxyBackground theme={theme} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: Clean Title + Download APK Button + Current Version Only */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="font-mono text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2.5">
                Academia Táctica Android · 8 Rutas · 12 Rangos
              </p>

              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.08]"
                style={{ fontSize: 'clamp(1.95rem, 3.2vw, 2.85rem)', textWrap: 'balance' }}
              >
                Ciberseguridad y Hacking Ético desde tu Android
              </h1>

              <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                192 clases interactivas, laboratorios CLI en vivo, 16 misiones CTF y progreso sincronizado en la nube. Toca cualquier pantalla del móvil para explorar la app.
              </p>
            </div>

            {/* Clean Download Card — Current Version & Download Button Only */}
            <div
              id="descargar"
              className="scroll-mt-20 rounded-2xl border border-slate-200 dark:border-emerald-500/30 bg-white/92 dark:bg-[#0D131C]/92 backdrop-blur-md p-5 shadow-sm space-y-4"
            >
              {maintenanceMode ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                      Actualización en curso
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Estamos publicando una nueva versión del APK. Vuelve a intentarlo en unos minutos.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <a
                    href={
                      release
                        ? `/api/apk/download?id=${encodeURIComponent(release.id)}`
                        : '/api/apk/download'
                    }
                    download={release?.fileName || 'kalfy-oficial.apk'}
                    onClick={() => {
                      if (onRefreshState) {
                        window.setTimeout(() => onRefreshState(), 800);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-display font-bold text-base tracking-tight transition-colors shadow-sm"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>
                      {loading && !release
                        ? 'Cargando archivo...'
                        : `Descargar Archivo APK (${versionLabel})`}
                    </span>
                  </a>

                  {/* Current Version Metadata Only */}
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                    <span>
                      Versión {versionLabel} · {release?.sizeFormatted || '24.8 MB'} · Android 8.0+
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {release ? release.downloads.toLocaleString('es-ES') : '—'} descargas
                    </span>
                  </div>

                  {/* Brief Current Version Highlights */}
                  {currentNotes.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <div className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Novedades de {versionLabel} ({release?.releaseDate}):
                      </div>
                      <ul className="space-y-1">
                        {currentNotes.map((note, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Compact Cloud-Sync Install Tip */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setGuideOpen((prev) => !prev)}
                      aria-expanded={guideOpen}
                      className="w-full flex items-center justify-between text-left text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline py-0.5 cursor-pointer"
                    >
                      <span>¿Cómo actualizar sin perder tu progreso?</span>
                      {guideOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      )}
                    </button>

                    {guideOpen && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#05080D]/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 leading-relaxed">
                        Tu XP, rango y clases completadas se guardan en la nube con tu cuenta de KALFY. Solo descarga el nuevo APK e instálalo directamente encima de la versión anterior.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Two Interactive Android Screens (8 Routes & 12 Ranks) */}
          <div className="lg:col-span-7">
            <AndroidShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
