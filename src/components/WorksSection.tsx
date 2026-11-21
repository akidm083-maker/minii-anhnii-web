import { useState, useMemo } from 'react';
import { Search, FolderGit2 } from 'lucide-react';
import { MY_WORKS } from '../data/works';
import { WorkCard } from './WorkCard';

export function WorksSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Бүх бүтээл' },
    { id: 'web', label: 'Вэб төслүүд' },
    { id: 'photography', label: 'Гэрэл зураг' },
  ];

  // Filtering the single array of works
  const filteredWorks = useMemo(() => {
    return MY_WORKS.filter((work) => {
      const matchesCategory =
        selectedCategory === 'all' || work.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        work.title.toLowerCase().includes(query) ||
        work.description.toLowerCase().includes(query) ||
        work.technologies.some((t) => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="works-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Хэсгийн гарчиг & Тайлбар */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Миний бүтээлүүд</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Миний бүтээсэн хуудаснууд & сонирхлын төслүүд
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              Нэгдсэн жагсаалт — Карт бүр дээр дарж шинэ цонхонд шууд нээн танилцах боломжтой.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums shrink-0">
            Нийт <span className="text-white font-semibold">{filteredWorks.length}</span> бүтээл
          </div>
        </div>

        {/* Шүүлтүүр & Хайлтын мөр */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          {/* Ангиллын товчнууд (Interactive Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850 bg-slate-900 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Түлхүүр үгээр хайх оролт */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Хайх (JavaScript, HTML, Гэрэл зураг...)"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* Бүтээлүүдийн торлол (Works Grid) */}
        {filteredWorks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-400 text-sm">
              Таны хайсан &quot;{searchQuery}&quot; түлхүүр үгэнд тохирох бүтээл олдсонгүй.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
            >
              Бүх бүтээлийг харах
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
