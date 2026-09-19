import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, SlidersHorizontal, ArrowUpDown, X, Search, 
  RotateCcw, Sparkles, Check, ChevronDown 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { ProductCard } from '../components/common/ProductCard';
import { updateSEO } from '../utils/seo';

interface CatalogPageProps {
  forcedCategorySlug?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ forcedCategorySlug }) => {
  const { products, categories, settings } = useStore();
  const { queryParams, navigate } = useRouter();

  const urlSearch = queryParams.get('search') || '';
  const urlFilter = queryParams.get('filter') || '';
  const urlCategory = queryParams.get('category') || forcedCategorySlug || '';

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [searchKeyword, setSearchKeyword] = useState<string>(urlSearch);
  const [onlySale, setOnlySale] = useState<boolean>(urlFilter === 'sale');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    if (forcedCategorySlug) {
      const found = categories.find((c) => c.slug === forcedCategorySlug);
      if (found) setSelectedCategory(found.name);
    } else if (urlCategory) {
      const found = categories.find((c) => c.slug === urlCategory);
      if (found) setSelectedCategory(found.name);
      else setSelectedCategory(urlCategory);
    }
    if (urlSearch) setSearchKeyword(urlSearch);
    if (urlFilter === 'sale') setOnlySale(true);
  }, [forcedCategorySlug, urlCategory, urlSearch, urlFilter, categories]);

  // SEO
  useEffect(() => {
    const pageTitle = selectedCategory ? `${selectedCategory} Collection` : 'All Crockery & Home Decor Catalog';
    updateSEO({
      title: pageTitle,
      description: `Explore our collection of ${selectedCategory || 'dinner sets, tea sets, kitchenware, and decor'} in Pakistan. Best prices, bank transfer, and fast nationwide delivery.`,
    });
  }, [selectedCategory]);

  // Unique Brands
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.isPublished) return false;

      // Category filter
      if (selectedCategory) {
        const matchesCategory = 
          product.category.toLowerCase() === selectedCategory.toLowerCase() ||
          product.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      // Brand filter
      if (selectedBrand && product.brand !== selectedBrand) {
        return false;
      }

      // Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchTitle = product.title.toLowerCase().includes(q);
        const matchSku = product.sku.toLowerCase().includes(q);
        const matchCategory = product.category.toLowerCase().includes(q);
        const matchTags = product.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSku && !matchCategory && !matchTags) return false;
      }

      // On Sale filter
      if (onlySale) {
        const isSale = typeof product.salePrice === 'number' && product.salePrice < product.regularPrice;
        if (!isSale) return false;
      }

      // In Stock filter
      if (onlyInStock && product.stockQuantity <= 0) {
        return false;
      }

      // Price range filter
      const activePrice = typeof product.salePrice === 'number' && product.salePrice < product.regularPrice
        ? product.salePrice
        : product.regularPrice;

      if (minPrice && activePrice < Number(minPrice)) return false;
      if (maxPrice && activePrice > Number(maxPrice)) return false;

      return true;
    }).sort((a, b) => {
      const getEffectivePrice = (p: typeof a) =>
        typeof p.salePrice === 'number' && p.salePrice < p.regularPrice ? p.salePrice : p.regularPrice;

      if (sortBy === 'price-asc') {
        return getEffectivePrice(a) - getEffectivePrice(b);
      }
      if (sortBy === 'price-desc') {
        return getEffectivePrice(b) - getEffectivePrice(a);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'name-asc') {
        return a.title.localeCompare(b.title);
      }
      // default: featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [products, selectedCategory, selectedBrand, searchKeyword, onlySale, onlyInStock, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchKeyword('');
    setOnlySale(false);
    setOnlyInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    navigate('/catalog');
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedBrand,
    searchKeyword,
    onlySale,
    onlyInStock,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              Store Catalog
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950 mt-1">
              {selectedCategory ? `${selectedCategory}` : 'All Crockery & Decor Products'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Showing {filteredProducts.length} items ready for dispatch across Pakistan
            </p>
          </div>

          {/* Sort & Mobile filter trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 shadow-xs"
            >
              <Filter className="w-4 h-4 text-stone-500" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline font-medium text-stone-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-stone-900 outline-none cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name-asc">Alphabetical (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-stone-200/70">
            <span className="text-xs text-stone-500 font-medium">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-200 rounded-lg text-xs font-medium">
                Brand: {selectedBrand}
                <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {onlySale && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-medium">
                Crazy Deals Only
                <button onClick={() => setOnlySale(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                In Stock Only
                <button onClick={() => setOnlyInStock(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchKeyword && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-200 rounded-lg text-xs font-medium">
                Keyword: &ldquo;{searchKeyword}&rdquo;
                <button onClick={() => setSearchKeyword('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-200 rounded-lg text-xs font-medium">
                Price: {minPrice || '0'} - {maxPrice || 'Any'} PKR
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP FILTER SIDEBAR */}
        <div className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              Filter Products
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search keyword inside catalog */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Search Catalog</label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Title, SKU, tags..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-400"
              />
            </div>
          </div>

          {/* Categories List */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Categories</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !selectedCategory ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={onlySale}
                onChange={(e) => setOnlySale(e.target.checked)}
                className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <span>Only Crazy Deals (On Sale)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Price Range */}
          <div className="pt-2 border-t border-stone-100">
            <label className="text-xs font-semibold text-stone-700 block mb-2">
              Price Range ({settings.currencySymbol})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-1/2 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
              />
              <span className="text-stone-400 text-xs">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-1/2 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Brands */}
          {availableBrands.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <label className="text-xs font-semibold text-stone-700 block mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* PRODUCTS GRID */}
        <div className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                No matching products found
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                We couldn&apos;t find any tableware or home decoration matching your active filters. Try adjusting your search keyword or clearing the filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h3 className="font-serif font-bold text-stone-900 text-base">Filter Catalog</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Quick toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>Crazy Deals Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">Price (PKR)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-200 flex flex-col gap-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full py-2 text-stone-500 text-xs font-semibold"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
