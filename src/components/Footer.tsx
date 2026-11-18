import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-5 bg-[#EEF3F8] dark:bg-[#05080D] text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-display font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>KALFY</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>© {new Date().getFullYear()} Academia Táctica de Ciberseguridad</span>
        </div>

        <div className="font-mono text-xs text-slate-500 dark:text-slate-500">
          Compatible con Android 8.0+
        </div>
      </div>
    </footer>
  );
}
