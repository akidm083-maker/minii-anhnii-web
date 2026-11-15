import { ArrowDown, Mail, ExternalLink, Trophy } from 'lucide-react';
import { PERSONAL_INFO } from '../data/works';

export function Hero() {
  const scrollToWorks = () => {
    const el = document.getElementById('works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToIdol = () => {
    const el = document.getElementById('idol-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-800/80">
      {/* Background ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Split-screen Hero (Left: Copy, Right: Visual artwork) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Зүүн багана: Танилцуулга & Үйлдэл */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Текст Кикер (Unboxed, цэвэр текст) */}
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <span>Хувийн танилцуулга & бүтээлүүд</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{PERSONAL_INFO.age} настай</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{PERSONAL_INFO.location}</span>
            </div>

            {/* Үндсэн Гарчиг */}
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Сайн байна уу, намайг <span className="text-amber-400">{PERSONAL_INFO.name}</span> гэдэг.
            </h1>

            {/* Танилцуулга бичвэр */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {PERSONAL_INFO.shortBio} {PERSONAL_INFO.goal}
            </p>

            {/* Сонирхол & Зорилгын товч танилцуулга */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold">Хобби:</span>
                <span>{PERSONAL_INFO.hobby}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-amber-400 font-semibold">Дуртай аниме:</span>
                <span>{PERSONAL_INFO.favoriteAnime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold">Суралцах шалтгаан:</span>
                <span className="text-slate-200">{PERSONAL_INFO.learningReason}</span>
              </div>
            </div>

            {/* Үйлдлийн товчнууд */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToWorks}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/10"
              >
                <span>Миний бүтээлүүдтэй танилцах</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <a
                href={`mailto:${PERSONAL_INFO.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>И-мэйл бичих</span>
              </a>

              <button
                onClick={scrollToIdol}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Шүтээн: NiKo</span>
              </button>

              <a
                href="https://resilient-boba-83d2de.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Анхны вэб үзэх (Netlify)</span>
              </a>
            </div>
          </div>

          {/* Баруун багана: Байгалийн зураг & Визуал */}
          <div className="lg:col-span-5">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-950">
                <img
                  src="/assets/aistudio/image_7fc94b16.png"
                  alt="Үдшийн байгалийн үзэсгэлэн ба нуурын толио"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Зургийн тайлбар & Мэдээлэл */}
              <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-300">Үдшийн байгаль & Толио</span>
                  <span aria-hidden="true">·</span>
                  <span>{PERSONAL_INFO.name}-ийн галерей</span>
                </div>
                <span className="text-amber-400/90 font-mono text-[11px]">Визуал бүтээл</span>
              </div>
            </div>
          </div>
        </div>

        {/* Сплитийн доод талын 4 баганат үзүүлэлтүүд (Tabular Figures) */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              15 нас
            </div>
            <div className="text-xs text-slate-400">
              Хөгжих, суралцах идэвхтэй үе
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              CS2 & One Piece
            </div>
            <div className="text-xs text-slate-400">
              Хамгийн дуртай хобби, аниме
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              AI ашиглах
            </div>
            <div className="text-xs text-slate-400">
              Сургалтад суралцаж буй гол зорилго
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              Хүссэн сургууль
            </div>
            <div className="text-xs text-slate-400">
              Ирээдүйн туйлын том зорилго
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
