import { ArrowUp, Github, Mail, Shield } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';

interface FooterProps {
  onOpenAdmin: () => void;
}

export function Footer({ onOpenAdmin }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-base font-bold text-white tracking-tight">
              {PERSONAL_INFO.name}
            </span>
            <p className="text-xs text-slate-500">
              {PERSONAL_INFO.role} · {PERSONAL_INFO.location}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Админ цэс</span>
            </button>

            <a
              href={`mailto:${PERSONAL_INFO.email}`}
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{PERSONAL_INFO.email}</span>
            </a>

            <a
              href={PERSONAL_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
              title="Дээш очих"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <p>© {new Date().getFullYear()} {PERSONAL_INFO.name}. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p>Монгол хэл дээр бүтээв.</p>
        </div>
      </div>
    </footer>
  );
}
