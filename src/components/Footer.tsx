import { Lock, Shield } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  return (
    <footer className="py-6 bg-[#EEF3F8] dark:bg-[#05080D] text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-display font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>KALFY</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>© {new Date().getFullYear()} Academia Táctica de Ciberseguridad · Android 8.0+</span>
        </div>

        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            onOpenAdmin();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Panel Admin</span>
        </a>
      </div>
    </footer>
  );
}
