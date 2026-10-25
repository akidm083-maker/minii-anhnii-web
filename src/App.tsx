/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WorksSection } from './components/WorksSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

export default function App() {
  const [, setActiveSection] = useState<string>('top');

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* 3-бүсийн дээд навигаци */}
      <Header onNavigate={handleNavigate} />

      {/* Үндсэн агуулга */}
      <main className="flex-1">
        {/* Баатар хэсэг: Танилцуулга ба байгалийн зураг */}
        <Hero />

        {/* "Миний бүтээлүүд": Нэг жагсаалт (Array), карт бүр шинэ цонхонд нээгдэнэ */}
        <WorksSection />

        {/* Миний тухай ба Ур чадварууд */}
        <AboutSection />

        {/* Холбоо барих хэсэг */}
        <ContactSection />
      </main>

      {/* Хөл хэсэг */}
      <Footer />
    </div>
  );
}
