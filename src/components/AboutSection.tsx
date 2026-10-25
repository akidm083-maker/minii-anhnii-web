import { User, CheckCircle2, Gamepad2, Tv, Utensils, GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import { PERSONAL_INFO, SKILL_CATEGORIES } from '../data/works';

export function AboutSection() {
  const myDetails = [
    {
      label: 'Нас',
      value: `${PERSONAL_INFO.age} настай`,
      desc: 'Сурч хөгжих идэвхтэй үе',
      icon: User,
    },
    {
      label: 'Хобби & Дуртай тоглоом',
      value: PERSONAL_INFO.favoriteGame,
      desc: 'Чөлөөт цагаараа найзуудтайгаа тоглох дуртай',
      icon: Gamepad2,
    },
    {
      label: 'Дуртай аниме',
      value: PERSONAL_INFO.favoriteAnime,
      desc: 'Луффигийн адал явдал ба эрх чөлөө',
      icon: Tv,
    },
    {
      label: 'Дуртай хоол',
      value: PERSONAL_INFO.favoriteFood,
      desc: 'Хамгийн их амтархан иддэг',
      icon: Utensils,
    },
    {
      label: 'Дуртай хамтлаг & Кино',
      value: 'Одоогоор байхгүй',
      desc: 'Тодорхой нэг хамтлаг, кино онцлоогүй',
      icon: BookOpen,
    },
    {
      label: 'Сургалтад сурах шалтгаан',
      value: 'AI ашиглаж сурах',
      desc: 'Орчин үеийн хиймэл оюун & технологийг эзэмших',
      icon: Sparkles,
    },
  ];

  return (
    <section id="about-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Миний тухай ерөнхий танилцуулга */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <User className="w-3.5 h-3.5" />
              <span>Миний тухай</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Чингисийн дэлгэрэнгүй танилцуулга & зорилго
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {PERSONAL_INFO.detailedBio}
            </p>

            {/* Том зорилгын тусгай блок */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Миний туйлын зорилго</span>
              </div>
              <p className="text-sm text-amber-100/90 font-medium leading-relaxed">
                &quot;{PERSONAL_INFO.goal}&quot;
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <div><strong className="text-slate-200">И-мэйл:</strong> {PERSONAL_INFO.email}</div>
              <div><strong className="text-slate-200">Төлөв:</strong> {PERSONAL_INFO.status}</div>
              <div className="flex items-center gap-1.5">
                <strong className="text-slate-200">Анхны вэб (Netlify):</strong>
                <a
                  href="https://resilient-boba-83d2de.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 hover:underline font-mono"
                >
                  resilient-boba-83d2de.netlify.app ↗
                </a>
              </div>
            </div>
          </div>

          {/* Баруун тал: Хувийн мэдээллийн картууд */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myDetails.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      {item.label}
                    </span>
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-base font-bold text-white">
                    {item.value}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ур чадвар & Сонирхлын багц */}
        <div id="skills-section" className="pt-6 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Суралцах төлөвлөгөө & Сонирхол</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Суралцаж буй чиглэлүүд & Ирээдүйн алсын хараа
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SKILL_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {cat.category}
                  </h4>
                  <p className="text-xs text-slate-400">{cat.description}</p>
                </div>

                <div className="space-y-3 pt-2">
                  {cat.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">
                        {skill.name}
                      </span>
                      <div className="text-right">
                        <span className="text-amber-400/90 font-medium">
                          {skill.level}
                        </span>
                        <span className="text-slate-500 ml-2 font-mono tabular-nums">
                          ({skill.experience})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
