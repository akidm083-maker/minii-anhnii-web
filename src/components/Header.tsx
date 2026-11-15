import { LogIn, LogOut } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';
import { useFirebase } from '../context/FirebaseContext';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const { user, authReady, authLoading, signInWithGoogle, signOutUser } = useFirebase();

  const scrollTo = (id: string) => {
    onNavigate(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const shortUserName = user?.displayName?.split(' ')[0] || 'Хэрэглэгч';

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
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          {PERSONAL_INFO.name}
        </a>

        {/* Бүс 2: Навигацийн цэсүүд (Нэг мөр, товч) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollTo('profile-section')}
            className="text-amber-400 hover:text-amber-300 font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Миний
          </button>
          <button
            onClick={() => scrollTo('works-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Бүтээлүүд
          </button>
          <button
            onClick={() => scrollTo('idol-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Шүтээн
          </button>
          <button
            onClick={() => scrollTo('guestbook-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Зочны дэвтэр
          </button>
          <button
            onClick={() => scrollTo('contact-section')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Холбоо барих
          </button>
        </nav>

        {/* Бүс 3: Нэг үндсэн үйлдэл (Google Нэвтрэх / Гарах) */}
        <div className="flex items-center gap-3 shrink-0">
          {!authReady ? (
            <div className="w-24 h-8 rounded-lg bg-slate-900 animate-pulse" />
          ) : user ? (
            <button
              type="button"
              onClick={signOutUser}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 max-w-[180px]"
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
        </div>
      </div>
    </header>
  );
}
