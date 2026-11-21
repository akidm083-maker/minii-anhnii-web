import { useState } from 'react';
import { LogIn, LogOut, Menu, Shield, X } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';
import { useFirebase } from '../context/FirebaseContext';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export function Header({ onNavigate, onOpenAdmin }: HeaderProps) {
  const { user, authReady, authLoading, isAdmin, signInWithGoogle, signOutUser } = useFirebase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAdminClick = () => {
    setMobileMenuOpen(false);
    onOpenAdmin();
  };

  const shortUserName = user?.displayName?.split(' ')[0] || 'Хэрэглэгч';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Бүс 1: Брэнд нэр (Нэг мөр, цэвэр текст) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          {PERSONAL_INFO.name}
        </a>

        {/* Бүс 2: Навигацийн цэсүүд (Нэг мөр, товч) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => scrollTo('profile-section')}
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Миний
          </button>
          <button
            type="button"
            onClick={() => scrollTo('works-section')}
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Бүтээлүүд
          </button>
          <button
            type="button"
            onClick={() => scrollTo('idol-section')}
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Шүтээн
          </button>
          <button
            type="button"
            onClick={() => scrollTo('guestbook-section')}
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Зочны дэвтэр
          </button>
          <button
            type="button"
            onClick={() => scrollTo('contact-section')}
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Холбоо барих
          </button>
          <button
            type="button"
            onClick={handleAdminClick}
            className={`inline-flex items-center gap-1.5 hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              isAdmin ? 'text-amber-400 font-semibold' : 'text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Админ</span>
          </button>
        </nav>

        {/* Бүс 3: Нэг үндсэн үйлдэл (Google Нэвтрэх / Гарах) + Гар утасны цэс */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!authReady ? (
            <div className="w-24 h-8 rounded-lg bg-slate-900 animate-pulse" />
          ) : user ? (
            <button
              type="button"
              onClick={signOutUser}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 max-w-[160px]"
              title="Системээс гарах"
            >
              <span className="truncate">{shortUserName}</span>
              <LogOut className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-amber-400/10"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{authLoading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            aria-label={mobileMenuOpen ? 'Цэс хаах' : 'Цэс нээх'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Гар утас болон таблет цэс */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => scrollTo('profile-section')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Миний
          </button>
          <button
            type="button"
            onClick={() => scrollTo('works-section')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Бүтээлүүд
          </button>
          <button
            type="button"
            onClick={() => scrollTo('idol-section')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Шүтээн
          </button>
          <button
            type="button"
            onClick={() => scrollTo('guestbook-section')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Зочны дэвтэр
          </button>
          <button
            type="button"
            onClick={() => scrollTo('contact-section')}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Холбоо барих
          </button>
          <button
            type="button"
            onClick={handleAdminClick}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-amber-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Админ цэс</span>
          </button>
        </div>
      )}
    </header>
  );
}
