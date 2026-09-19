import React, { useEffect } from 'react';
import { BookOpen, Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from '../router/Router';
import { DEFAULT_GUIDES } from '../data/initialData';
import { updateSEO } from '../utils/seo';

export const GuidesPage: React.FC = () => {
  const { navigate } = useRouter();

  useEffect(() => {
    updateSEO({
      title: 'Crockery & Tableware Guides',
      description: 'Expert advice on bone china care, choosing luxury dinner sets, dowry checklists, and table decor styling in Pakistan.',
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          Curated Knowledge & Care
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-950">
          Crockery & Decor Guides
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Master the art of elegant tableware selection, bone china preservation, and festive dining table decoration for Pakistani households.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DEFAULT_GUIDES.map((guide) => (
          <article
            key={guide.id}
            onClick={() => navigate(`/guides/${guide.slug}`)}
            className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:border-stone-400/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                <img
                  src={guide.imageUrl}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-stone-900/85 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {guide.category}
                </span>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-[11px] text-stone-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {guide.publishedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <h2 className="font-serif text-lg font-bold text-stone-950 group-hover:text-amber-700 transition-colors line-clamp-2">
                  {guide.title}
                </h2>

                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {guide.summary}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:text-amber-900">
              <span>Read Full Article</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
