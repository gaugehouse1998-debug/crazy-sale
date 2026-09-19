import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Sparkles, ChevronLeft, ChevronRight, MessageSquare, 
  Truck, ShieldCheck, Flame, Star, BookOpen, Layers, Gift 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { ProductCard } from '../components/common/ProductCard';
import { DEFAULT_GUIDES } from '../data/initialData';
import { updateSEO } from '../utils/seo';

export const HomePage: React.FC = () => {
  const { products, categories, banners, settings, openWhatsApp } = useStore();
  const { navigate } = useRouter();

  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  useEffect(() => {
    updateSEO({
      title: 'Beautiful Crockery & Home Decoration at Crazy Prices',
      description: 'Shop luxury dinner sets, tea sets, kitchenware, crystal glassware, and home decoration in Pakistan. Nationwide courier & cargo delivery.',
      type: 'website',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'OnlineStore',
        name: settings.storeName,
        description: settings.tagline,
        url: window.location.origin,
        priceRange: 'PKR',
        paymentAccepted: 'Advance Bank Transfer, RAAST, Online IBFT',
        areaServed: {
          '@type': 'Country',
          name: 'Pakistan',
        },
      },
    });
  }, [settings]);

  // Auto rotate banners
  const activeBanners = banners.filter((b) => b.isActive);
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const featuredProducts = products.filter((p) => p.isFeatured && p.isPublished).slice(0, 8);
  const saleProducts = products
    .filter((p) => typeof p.salePrice === 'number' && p.salePrice < p.regularPrice && p.isPublished)
    .slice(0, 4);
  const decorProducts = products
    .filter((p) => (p.category.includes('Decor') || p.category.includes('Vases') || p.category.includes('Candle')) && p.isPublished)
    .slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO BANNER CAROUSEL */}
      <section className="relative bg-stone-900 overflow-hidden">
        {activeBanners.length > 0 ? (
          <div className="relative min-h-[460px] sm:min-h-[580px] lg:min-h-[640px] flex items-center">
            {activeBanners.map((banner, index) => {
              const isActive = index === currentBannerIdx;
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Background Image with Dark Vignette Gradient */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-7000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-stone-950/30" />

                  {/* Banner Content Container */}
                  <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <div className="max-w-2xl text-white space-y-4 sm:space-y-6 py-12">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        Exclusive Pakistan Collection
                      </div>

                      <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                        {banner.title}
                      </h1>

                      <p className="text-stone-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
                        {banner.subtitle}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => navigate(banner.destination || '/catalog')}
                          className="flex items-center gap-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95"
                        >
                          <span>{banner.ctaText || 'Shop Collection'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openWhatsApp({ text: `Hello Crazy Sale! I am interested in your offer: "${banner.title}"` })}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3.5 rounded-xl text-sm border border-white/20 backdrop-blur-xs transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>Inquire on WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Carousel Arrow Controls */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentBannerIdx((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-stone-900/50 hover:bg-stone-900/80 text-white border border-white/10 backdrop-blur-xs transition-colors hidden sm:flex"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentBannerIdx((prev) => (prev + 1) % activeBanners.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-stone-900/50 hover:bg-stone-900/80 text-white border border-white/10 backdrop-blur-xs transition-colors hidden sm:flex"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIdx(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentBannerIdx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-white">No active hero banners found.</div>
        )}
      </section>

      {/* 2. TRUST & ASSURANCE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm">Nationwide Delivery</h3>
              <p className="text-xs text-stone-500 mt-1">
                Express courier & heavy cargo options across all cities in Pakistan.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm">Anti-Breakage Pack</h3>
              <p className="text-xs text-stone-500 mt-1">
                Multi-layer bubble & reinforced boxes for safe transit of fine ceramics.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm">Crazy Wholesale Rates</h3>
              <p className="text-xs text-stone-500 mt-1">
                Premium luxury aesthetics without the exorbitant boutique markups.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm">WhatsApp Concierge</h3>
              <p className="text-xs text-stone-500 mt-1">
                Personalized order confirmation, real-time product photos & support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE BY CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 mt-1">
              Shop by Category
            </h2>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.filter((c) => c.isActive).slice(0, 12).map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="group cursor-pointer bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-stone-950/10 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-3 text-center">
                <h3 className="font-serif text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
                  {cat.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Handpicked Elegance
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 mt-1">
              Featured Crockery & Sets
            </h2>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 5. HOT CRAZY DEALS (SALE SPOTLIGHT) */}
      {saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#291818] via-[#211515] to-[#1a1111] rounded-3xl p-6 sm:p-10 text-white border border-rose-900/50 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <span className="px-3 py-1 rounded-md bg-rose-600/90 text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Limited Time Crazy Deals
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-3">
                  Unbeatable Discounts on Royal Tableware
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm mt-1.5 max-w-xl">
                  Take advantage of warehouse clearance prices on genuine bone china, gilded serving platters, and luxury dining sets.
                </p>
              </div>
              <button
                onClick={() => navigate('/catalog?filter=sale')}
                className="self-start md:self-auto flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <span>View All Crazy Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {saleProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. HOME DECOR & TABLE ACCENTS */}
      {decorProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                Atmosphere & Styling
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 mt-1">
                Modern Home Decor & Vases
              </h2>
            </div>
            <button
              onClick={() => navigate('/category/home-decoration')}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
            >
              <span>Browse All Decor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {decorProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BUYING GUIDES & TABLEWARE CARE ARTICLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              Knowledge & Inspiration
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 mt-1">
              Tableware & Styling Guides
            </h2>
          </div>
          <button
            onClick={() => navigate('/guides')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
          >
            <span>View All Guides</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEFAULT_GUIDES.map((guide) => (
            <div
              key={guide.id}
              onClick={() => navigate(`/guides/${guide.slug}`)}
              className="group cursor-pointer bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
            >
              <div className="aspect-16/9 overflow-hidden bg-stone-100">
                <img
                  src={guide.imageUrl}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-2">
                    <span>{guide.category}</span>
                    <span>•</span>
                    <span>{guide.readTime}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1 text-xs font-semibold text-stone-800 group-hover:text-amber-700">
                  <span>Read Full Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. DIRECT WHATSAPP CONCIERGE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Fast WhatsApp Support
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-white">
              Need Live Video Proof or Custom Parcel Packing?
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              We understand fragile items require extra care. Chat directly with our Karachi distribution center to receive video walkthroughs of dinner sets, ask questions, or verify bank payment.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => openWhatsApp()}
                className="flex items-center gap-2 bg-white text-emerald-950 font-bold px-6 py-3 rounded-xl text-xs hover:bg-emerald-50 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Chat on WhatsApp: {settings.whatsapp}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
