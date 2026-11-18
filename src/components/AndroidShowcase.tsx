import { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flag,
  Layers,
  Shield,
  Terminal,
  Wifi
} from 'lucide-react';
import { OFFICIAL_RANKS, OFFICIAL_ROUTES } from '../data/kalfyData.ts';
import type { RouteInfo } from '../types.ts';

interface AndroidFrameProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

function AndroidFrame({ id, label, children }: AndroidFrameProps) {
  return (
    <div id={id} className="flex flex-col items-center">
      {/* Sleek Android Device Bezel */}
      <div className="relative w-[286px] sm:w-[300px] h-[545px] lg:h-[565px] rounded-[2.25rem] p-[9px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border border-slate-600/60 dark:border-slate-700/90">
        {/* Inner Screen */}
        <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden bg-[#070B12] text-slate-100 flex flex-col border border-slate-800">
          {/* Android Status Bar + Punch-Hole Camera */}
          <div className="relative h-7 px-5 flex items-center justify-between bg-[#05080D] text-[10px] font-mono text-slate-300 shrink-0 select-none">
            <span className="tabular-nums">08:47</span>
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"
            />
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Wifi className="w-3 h-3" />
              <span>5G</span>
            </span>
          </div>

          {children}

          {/* Android Gesture Navigation Pill */}
          <div className="h-4 bg-[#05080D] flex items-center justify-center shrink-0">
            <span className="w-24 h-1 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      <span className="mt-2.5 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

export default function AndroidShowcase() {
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [selectedRankTier, setSelectedRankTier] = useState<number>(7);

  const activeRank =
    OFFICIAL_RANKS.find((r) => r.tier === selectedRankTier) || OFFICIAL_RANKS[0];
  const xpProgressPct = Math.min(
    100,
    Math.max(6, Math.round((activeRank.xpNumeric / 52000) * 100))
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-5 xl:gap-7">
      {/* ANDROID SCREEN 1: LAS 8 RUTAS DE APRENDIZAJE */}
      <AndroidFrame id="android-rutas" label="Pantalla 1 · Las 8 Rutas">
        {/* App Top Bar */}
        <div className="px-3.5 py-2.5 bg-[#0B111A] border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0">
          {selectedRoute ? (
            <button
              type="button"
              onClick={() => setSelectedRoute(null)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 min-h-[32px] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Todas las rutas</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="font-display text-xs font-bold leading-none text-white">
                  Rutas KALFY
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5 tabular-nums">
                  8 Rutas · 192 Clases
                </div>
              </div>
            </div>
          )}
          <span className="font-mono text-[10px] text-emerald-400 tabular-nums">
            {selectedRoute ? `Ruta 0${selectedRoute.id}` : '24 / ruta'}
          </span>
        </div>

        {/* Scrollable Screen Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#070B12]">
          {selectedRoute ? (
            /* In-Phone Route Detail View */
            <div className="space-y-3">
              <div className="relative rounded-xl border border-emerald-500/35 overflow-hidden p-3.5 bg-[#0D141E]">
                <img
                  src={selectedRoute.spriteUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover scale-150 blur-lg opacity-25 pointer-events-none"
                />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="h-12 w-20 rounded-lg bg-[#05080D] border border-slate-700 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={selectedRoute.spriteUrl}
                      alt={selectedRoute.title}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain pixelated"
                    />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-emerald-400 tabular-nums">
                      Ruta 0{selectedRoute.id} · {selectedRoute.classesCount} Clases
                    </div>
                    <h3 className="font-display text-sm font-bold text-white leading-tight mt-0.5">
                      {selectedRoute.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed px-0.5">
                {selectedRoute.shortDesc}
              </p>

              <div className="rounded-xl border border-slate-800 bg-[#0D131C] p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-cyan-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Clases destacadas</span>
                </div>
                <ul className="space-y-1.5">
                  {selectedRoute.sampleLessons.slice(0, 3).map((lesson, i) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-snug">
                      • {lesson}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0D131C] p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Comandos</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoute.cliCommands.map((cmd) => (
                    <code
                      key={cmd}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#05080D] border border-slate-800 text-cyan-300"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                <div className="font-mono text-[10px] font-semibold text-amber-400">
                  Proyecto Final (Revisión Admin)
                </div>
                <div className="text-xs font-semibold text-white">
                  {selectedRoute.finalProjectTitle}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {selectedRoute.finalProjectDesc}
                </p>
              </div>
            </div>
          ) : (
            /* 8 Routes List inside Phone 1 */
            OFFICIAL_ROUTES.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRoute(route)}
                className="group relative w-full text-left rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-[#0D131C] p-2.5 overflow-hidden transition-colors flex items-center gap-3 cursor-pointer"
              >
                {/* Blurred Route Sprite Banner in Background */}
                <img
                  src={route.spriteUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover scale-150 blur-md opacity-25 group-hover:opacity-35 transition-opacity pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[#0B111A]/85 via-[#0B111A]/75 to-[#0B111A]/90 pointer-events-none"
                />

                {/* Crisp Cropped Pixel-Art Route Icon */}
                <div className="relative z-10 h-11 w-16 rounded-lg bg-[#05080D]/90 border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={route.spriteUrl}
                    alt={`Ruta ${route.id}: ${route.title}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain pixelated"
                  />
                </div>

                {/* Title & Meta */}
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="font-mono text-[10px] text-emerald-400 tabular-nums">
                    Ruta 0{route.id} · {route.classesCount} Clases
                  </div>
                  <div className="font-display text-xs font-bold text-white truncate">
                    {route.title}
                  </div>
                </div>

                <ChevronRight className="relative z-10 w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="h-12 bg-[#0B111A] border-t border-slate-800 grid grid-cols-3 items-center px-2 shrink-0 select-none">
          <div className="flex flex-col items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">Rutas</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Flag className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">16 CTF</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Layers className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">Labs CLI</span>
          </div>
        </div>
      </AndroidFrame>

      {/* ANDROID SCREEN 2: LOS 12 RANGOS OFICIALES */}
      <AndroidFrame id="android-rangos" label="Pantalla 2 · 12 Rangos Oficiales">
        {/* App Top Bar */}
        <div className="px-3.5 py-2.5 bg-[#0B111A] border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-display text-xs font-bold leading-none text-white">
                Escalafón Oficial
              </div>
              <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                12 Rangos · Ranking Global
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-amber-400 tabular-nums">
            #{String(activeRank.tier).padStart(2, '0')} / 12
          </span>
        </div>

        {/* Selected Rank Featured Card + 12 Rank Badges Grid */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#070B12]">
          {/* Active Selected Rank Header inside Phone */}
          <div className="rounded-xl border border-emerald-500/35 bg-[#0D131C] p-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg bg-[#05080D] border border-slate-700 p-1 flex items-center justify-center shrink-0">
                <img
                  src={activeRank.spriteUrl}
                  alt={activeRank.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain pixelated"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-xs font-bold text-white truncate">
                    {activeRank.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 tabular-nums shrink-0">
                    {activeRank.xpRequired}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate mt-0.5">
                  {activeRank.specialty}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${xpProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* All 12 Cleanly Cropped Rank Badges */}
          <div className="grid grid-cols-2 gap-2">
            {OFFICIAL_RANKS.map((rank) => {
              const isSelected = rank.tier === selectedRankTier;
              return (
                <button
                  key={rank.tier}
                  type="button"
                  onClick={() => setSelectedRankTier(rank.tier)}
                  className={`rounded-xl border p-1.5 text-left transition-colors cursor-pointer flex flex-col ${
                    isSelected
                      ? 'border-emerald-400 bg-[#101B29]'
                      : 'border-slate-800 bg-[#0B111A] hover:border-slate-600'
                  }`}
                >
                  <div className="w-full aspect-[4/3] rounded-lg bg-[#061018] overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={rank.spriteUrl}
                      alt={`${rank.name} (${rank.xpRequired})`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>
                  <div className="mt-1 px-1 flex items-center justify-between font-mono text-[9px] tabular-nums">
                    <span className="text-slate-400">#{String(rank.tier).padStart(2, '0')}</span>
                    <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {rank.xpRequired}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="h-12 bg-[#0B111A] border-t border-slate-800 grid grid-cols-3 items-center px-2 shrink-0 select-none">
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Compass className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">Rutas</span>
          </div>
          <div className="flex flex-col items-center justify-center text-emerald-400">
            <Award className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">Rangos</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Shield className="w-4 h-4" />
            <span className="text-[9px] font-medium mt-0.5">Perfil</span>
          </div>
        </div>
      </AndroidFrame>
    </div>
  );
}
