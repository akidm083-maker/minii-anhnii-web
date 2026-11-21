/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProfileSection } from './components/ProfileSection';
import { WorksSection } from './components/WorksSection';
import { NikoSection } from './components/NikoSection';
import { GuestbookSection } from './components/GuestbookSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { AdminSection } from './components/AdminSection';
import { Footer } from './components/Footer';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-lg font-bold text-white">Алдаа гарлаа</h2>
            <p className="text-xs text-slate-400 break-words">
              Өгөгдлийн сантай холбогдох эсвэл ажиллах явцад саатал гарлаа. Хуудсаа дахин ачаална уу.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
            >
              Дахин ачаалах
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PortfolioContent() {
  const [, setActiveSection] = useState<string>('top');
  const [viewMode, setViewMode] = useState<'portfolio' | 'admin'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#admin' ? 'admin' : 'portfolio'
  );
  const { authError, clearAuthError } = useFirebase();

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setViewMode('admin');
      } else if (window.location.hash === '' || window.location.hash === '#top') {
        setViewMode('portfolio');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const openAdminWorkspace = () => {
    setViewMode('admin');
    if (window.location.hash !== '#admin') {
      window.history.replaceState(null, '', '#admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToPortfolio = () => {
    setViewMode('portfolio');
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToPortfolioSection = (sectionId: string) => {
    setViewMode('portfolio');
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', `#${sectionId}`);
    }
    window.setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
        {authError && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2.5 text-center text-xs text-rose-200 flex items-center justify-center gap-4">
            <span>{authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              className="underline hover:text-white font-semibold"
            >
              Хаах
            </button>
          </div>
        )}
        <AdminSection
          onBackToSite={backToPortfolio}
          onJumpToSection={jumpToPortfolioSection}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* 3-бүсийн дээд навигаци */}
      <Header onNavigate={handleNavigate} onOpenAdmin={openAdminWorkspace} />

      {authError && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2.5 text-center text-xs text-rose-200 flex items-center justify-center gap-4">
          <span>{authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="underline hover:text-white font-semibold"
          >
            Хаах
          </button>
        </div>
      )}

      {/* Үндсэн агуулга */}
      <main className="flex-1">
        {/* Баатар хэсэг: Танилцуулга ба байгалийн зураг */}
        <Hero />

        {/* "Миний": Хэрэглэгчийн албан ёсны профайл, сонирхол, зорилго, нууцлал */}
        <ProfileSection />

        {/* "Миний бүтээлүүд": Нэг жагсаалт (Array), карт бүр шинэ цонхонд нээгдэнэ */}
        <WorksSection />

        {/* "Шүтээн": NiKo — CS2 Personal Assistant */}
        <NikoSection />

        {/* "Зочны дэвтэр": Firebase Firestore сэтгэгдэл */}
        <GuestbookSection />

        {/* Миний тухай ба Ур чадварууд */}
        <AboutSection />

        {/* Холбоо барих хэсэг */}
        <ContactSection />
      </main>

      {/* Хөл хэсэг */}
      <Footer onOpenAdmin={openAdminWorkspace} />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <FirebaseProvider>
        <PortfolioContent />
      </FirebaseProvider>
    </AppErrorBoundary>
  );
}
