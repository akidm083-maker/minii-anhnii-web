import { useState } from 'react';
import { ExternalLink, Github, ArrowUpRight } from 'lucide-react';
import { WorkItem } from '../types';

interface WorkCardProps {
  work: WorkItem;
}

export function WorkCard({ work }: WorkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <article className="group relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/40">
      {/* Бүтээлийн Зураг (Шинэ цонхонд нээх холбоостой) */}
      <a
        href={work.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[16/10] overflow-hidden bg-slate-950"
        title={`${work.title} - Шинэ цонхонд нээх`}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        )}

        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-4 text-center">
            <span className="text-sm font-medium">{work.title}</span>
            <span className="text-xs text-slate-600 mt-1">Визуал харагдац</span>
          </div>
        ) : (
          <img
            src={work.image}
            alt={work.title}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur-sm">
            <span>Шинэ цонхонд нээх</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </a>

      {/* Картын агуулга */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Unboxed Metadata (Zero-pill rule: unboxed text with · separators) */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-amber-400">{work.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{work.year} он</span>
            {work.metrics && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{work.metrics}</span>
              </>
            )}
          </div>

          {/* Картын Гарчиг (Шинэ цонхонд нээх холбоостой) */}
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
            <a
              href={work.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <span>{work.title}</span>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 inline-block transition-colors" />
            </a>
          </h3>

          {/* Товч тайлбар */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {work.description}
          </p>
        </div>

        {/* Технологиуд & Холбоос */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {/* Технологийн жагсаалт (Clean inline text separators) */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-slate-500 font-medium">Стек:</span>
            {work.technologies.map((tech, index) => (
              <span key={tech} className="inline-flex items-center gap-2">
                <span className="text-slate-300">{tech}</span>
                {index < work.technologies.length - 1 && (
                  <span className="text-slate-600" aria-hidden="true">/</span>
                )}
              </span>
            ))}
          </div>

          {/* Үйлдлийн товч: Шинэ цонхонд шууд нээх */}
          <div className="flex items-center justify-between pt-1">
            <a
              href={work.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Төсөл үзэх</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {work.githubUrl && (
              <a
                href={work.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                title="Эх код үзэх"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Эх код</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
