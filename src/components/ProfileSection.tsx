import { User, Target, Sparkles, ShieldCheck, Gamepad2, Compass, CheckCircle2, HeartHandshake, ArrowUpRight } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';

export function ProfileSection() {
  return (
    <section id="profile-section" className="py-16 sm:py-24 border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Хэсгийн толгой */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <User className="w-4 h-4" />
              <span>Миний Профайл (User Profile)</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Portfolio Owner</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Chingis · Портфолио Эзэмшигчийн Профайл
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Технологи, CS2 болон хувийн хөгжилд тэмүүлэгч залуу хөгжүүлэгчийн албан ёсны дэлгэрэнгүй профайл, сонирхол, зорилго болон нууцлалын баталгаа.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Баталгаажсан Профайл</span>
          </div>
        </div>

        {/* Үндсэн Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Зүүн тал: Гол Профайл & Уриа Карт */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6">
            <div className="space-y-6">
              {/* Аватар болон Ерөнхий танилцуулга */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/40 shrink-0 shadow-lg shadow-amber-400/10">
                  <img
                    src={PERSONAL_INFO.avatar}
                    alt="Chingis - Portfolio Owner Avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-400 tracking-wider uppercase">
                    Portfolio Owner
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {PERSONAL_INFO.name} ({PERSONAL_INFO.mongolianName})
                  </h3>
                  <p className="text-xs text-slate-400">
                    {PERSONAL_INFO.role}
                  </p>
                </div>
              </div>

              {/* Хэл & Харилцаа */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Харилцах хэл:</span>
                <span className="font-semibold text-white">
                  Монгол хэл (Үндсэн) · English
                </span>
              </div>

              {/* ГОЛ УРИА */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-400/30 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ГОЛ УРИА</span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  &quot;{PERSONAL_INFO.motto}&quot;
                </p>
              </div>

              {/* Товч тайлбар */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {PERSONAL_INFO.detailedBio}
              </p>
            </div>

            {/* Доод хэсгийн шууд холбоосууд */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">{PERSONAL_INFO.location}</span>
              <a
                href={`mailto:${PERSONAL_INFO.email}`}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
              >
                <span>{PERSONAL_INFO.email}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Баруун тал: Сонирхол, Зорилго, Зан чанар ба Нууцлал */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {/* Дээд хэсэг: Сонирхол ба Зорилго 2 багана */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Сонирхол */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Сонирхол
                    </h4>
                    <span className="text-[11px] text-slate-400">Interests</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {PERSONAL_INFO.interests.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Зорилго */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Зорилго
                    </h4>
                    <span className="text-[11px] text-slate-400">Key Goals</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {PERSONAL_INFO.goals.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Дунд хэсэг: Зан чанар ба Харилцааны хэв маяг */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Зан чанар ба Харилцааны хэв маяг
                  </h4>
                  <span className="text-[11px] text-slate-400">Communication & Personality</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {PERSONAL_INFO.traits.map((trait, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{trait}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Доод хэсэг: Нууцлалын Баталгаа (Privacy Policy) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Хувийн Нууцлалын Баталгаа (Privacy Guarantee)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Secure</span>
                </h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {PERSONAL_INFO.privacyGuarantee}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
