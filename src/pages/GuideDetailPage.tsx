import React, { useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, Share2, HelpCircle, ArrowRight } from 'lucide-react';
import { useRouter } from '../router/Router';
import { DEFAULT_GUIDES } from '../data/initialData';
import { updateSEO } from '../utils/seo';

interface GuideDetailPageProps {
  slug: string;
}

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const guide = DEFAULT_GUIDES.find((g) => g.slug === slug) || DEFAULT_GUIDES[0];

  useEffect(() => {
    if (guide) {
      updateSEO({
        title: guide.title,
        description: guide.seoDescription || guide.summary,
        image: guide.imageUrl,
        type: 'article',
      });
    }
  }, [guide]);

  if (!guide) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Article Not Found</h2>
        <button
          onClick={() => navigate('/guides')}
          className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
        >
          Return to Guides
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/guides')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Crockery & Decor Guides</span>
      </button>

      {/* Article Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
            {guide.category}
          </span>
          <span className="text-xs text-stone-400">•</span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {guide.readTime}
          </span>
          <span className="text-xs text-stone-400">•</span>
          <span className="text-xs text-stone-500">{guide.publishedDate}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-950 leading-tight">
          {guide.title}
        </h1>

        <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-light">
          {guide.summary}
        </p>
      </div>

      {/* Hero Image */}
      <div className="aspect-16/9 rounded-3xl overflow-hidden shadow-sm bg-stone-100">
        <img
          src={guide.imageUrl}
          alt={guide.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Body Sections */}
      <div className="space-y-8 text-stone-800 text-sm sm:text-base leading-relaxed max-w-3xl">
        {guide.sections.map((sec, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-950">
              {sec.heading}
            </h2>
            <p className="text-stone-700 leading-relaxed">
              {sec.body}
            </p>
          </section>
        ))}
      </div>

      {/* FAQs Section if available */}
      {guide.faqs && guide.faqs.length > 0 && (
        <div className="p-6 sm:p-8 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-4 max-w-3xl">
          <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-700" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            {guide.faqs.map((faq, i) => (
              <div key={i} className="space-y-1">
                <p className="font-bold text-stone-900">Q: {faq.question}</p>
                <p className="text-stone-600 leading-relaxed">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore Catalog Banner CTA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1C1917] text-white flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl shadow-sm">
        <div>
          <h4 className="font-serif text-xl font-bold">Discover Royal Dinner Sets</h4>
          <p className="text-xs text-stone-400 mt-1">
            Browse our imported bone china and porcelain dinnerware at wholesale crazy prices.
          </p>
        </div>
        <button
          onClick={() => navigate('/catalog?category=dinner-sets')}
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
        >
          <span>Shop Tableware</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
};
