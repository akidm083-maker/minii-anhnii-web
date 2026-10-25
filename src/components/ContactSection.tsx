import React, { useState } from 'react';
import { Mail, Copy, Check, Send, MapPin, ExternalLink } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';

export function ContactSection() {
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PERSONAL_INFO.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.email || !formState.message) return;

    // Open mailto link with prefilled details
    const mailtoUrl = `mailto:${PERSONAL_INFO.email}?subject=${encodeURIComponent(
      formState.subject || `Хамтран ажиллах санал - ${formState.name}`
    )}&body=${encodeURIComponent(
      `Нэр: ${formState.name}\nИ-мэйл: ${formState.email}\n\nЗурвас:\n${formState.message}`
    )}`;

    window.location.href = mailtoUrl;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <section id="contact-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
            <Mail className="w-3.5 h-3.5" />
            <span>Холбоо барих</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Төсөл, хамтын ажиллагааны санал илгээх
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Шинэ веб төсөл, зөвлөгөө эсвэл хамтран ажиллах хүсэлт байвал холбогдоорой.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Зүүн тал: Шууд мэдээлэл & И-мэйл хуулах */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Шууд холбогдох и-мэйл хаяг
                </span>
                <div className="text-lg sm:text-xl font-bold text-white font-mono select-all">
                  {PERSONAL_INFO.email}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCopyEmail}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-950" />
                      <span>И-мэйл хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>И-мэйл хуулах</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span>Шууд бичих</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{PERSONAL_INFO.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-300">{PERSONAL_INFO.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Баруун тал: Интерактив зурвас илгээх маягт */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4"
            >
              <h3 className="text-base font-bold text-white">
                Зурвас илгээх
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Таны нэр
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    placeholder="Жишээ: Бат"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Таны и-мэйл хаяг
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) =>
                      setFormState({ ...formState, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Сэдэв
                </label>
                <input
                  type="text"
                  value={formState.subject}
                  onChange={(e) =>
                    setFormState({ ...formState, subject: e.target.value })
                  }
                  placeholder="Төслийн саналын сэдэв..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Зурвас
                </label>
                <textarea
                  rows={4}
                  required
                  value={formState.message}
                  onChange={(e) =>
                    setFormState({ ...formState, message: e.target.value })
                  }
                  placeholder="Төслийн зорилго, шаардлага эсвэл хамтран ажиллах саналаа бичнэ үү..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {sentSuccess ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Зурвас бэлтгэгдэж таны и-мэйл програм дээр нээгдлээ.</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Илгээх товч нь таны и-мэйл хэрэгслээр дамжин шууд хүргэгдэнэ.
                  </span>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Зурвас илгээх</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
