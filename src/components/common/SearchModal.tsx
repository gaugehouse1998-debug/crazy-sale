import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/Router';
import { Product } from '../../types';

export const SearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen, products, settings } = useStore();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  // Suggested keywords
  const suggestions = [
    'Dinner Set',
    'Gold Rim',
    'Tea Cup',
    'Serving Bowl',
    'Ceramic Vase',
    'Crystal',
    'Candle Holder',
    'Wall Decor',
  ];

  const searchResults: Product[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return products.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchDescription = p.description.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      const matchVariants = p.variants?.some((v) => 
        v.name.toLowerCase().includes(q) || 
        Object.values(v.attributes).some((val) => val.toLowerCase().includes(q))
      );

      return matchTitle || matchSku || matchBrand || matchCategory || matchDescription || matchTags || matchVariants;
    }).slice(0, 8);
  }, [query, products]);

  if (!searchOpen) return null;

  const handleSelectProduct = (product: Product) => {
    setSearchOpen(false);
    navigate(`/product/${product.slug}`);
  };

  const handleViewAllResults = () => {
    setSearchOpen(false);
    navigate(`/catalog?search=${encodeURIComponent(query)}`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-stone-200 gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleViewAllResults();
              } else if (e.key === 'Escape') {
                setSearchOpen(false);
              }
            }}
            placeholder="Search crockery, dinner sets, tea pots, vases, decor..."
            className="w-full text-base sm:text-lg text-stone-900 placeholder-stone-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-medium bg-stone-100 text-stone-500 px-2 py-1 rounded-md border border-stone-200">
            ESC to close
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* If no query, show suggestions */}
          {!query && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setQuery(sug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Tag className="w-3 h-3 text-stone-400" />
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results list */}
          {query && searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-stone-500 mb-2">
                Found {searchResults.length} relevant items
              </div>
              {searchResults.map((product) => {
                const isSale = typeof product.salePrice === 'number' && product.salePrice < product.regularPrice;
                const price = isSale ? product.salePrice! : product.regularPrice;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span>{product.category}</span>
                        <span>•</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-stone-900 truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs text-stone-500 truncate">{product.brand}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-stone-900">
                        {settings.currencySymbol} {price.toLocaleString()}
                      </div>
                      {isSale && (
                        <div className="text-[11px] text-stone-400 line-through">
                          {settings.currencySymbol} {product.regularPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query && searchResults.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-stone-600 font-medium">
                No products found matching &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Try searching for dinner sets, tea cups, serving bowls, ceramic, or gold rims.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-2">
            <span>Shortcut:</span>
            <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-[10px] text-stone-600 shadow-2xs">Ctrl + K</kbd>
            <span className="hidden sm:inline text-stone-400">•</span>
            <span className="hidden sm:inline">Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-[10px] text-stone-600 shadow-2xs">ESC</kbd> to exit</span>
          </span>
          {query && searchResults.length > 0 && (
            <button
              onClick={handleViewAllResults}
              className="flex items-center gap-1.5 font-semibold text-amber-800 hover:text-amber-950 transition-colors"
            >
              <span>View All ({searchResults.length}+)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
