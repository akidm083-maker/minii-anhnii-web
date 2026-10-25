import { Mail, ArrowUpRight } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const scrollTo = (id: string) => {
    onNavigate(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Бүс 1: Брэнд нэр (Нэг мөр, цэвэр текст) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>{PERSONAL_INFO.name}</span>
          <span className="text-slate-500 font-normal text-sm hidden sm:inline">· Бүтээлүүд</span>
        </a>

        {/* Бүс 2: Навигацийн цэсүүд (Нэг мөр, товч) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollTo('works-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Миний бүтээлүүд
          </button>
          <button
            onClick={() => scrollTo('skills-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Ур чадвар
          </button>
          <button
            onClick={() => scrollTo('about-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Миний тухай
          </button>
          <button
            onClick={() => scrollTo('contact-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Холбоо барих
          </button>
        </nav>

        {/* Бүс 3: Нэг үндсэн үйлдэл (CTA товч) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-amber-400/10"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Холбогдох</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
