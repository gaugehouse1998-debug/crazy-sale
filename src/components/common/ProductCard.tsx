import React from 'react';
import { Eye, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/Router';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setQuickViewProduct, settings } = useStore();
  const { navigate } = useRouter();

  const isDiscounted = typeof product.salePrice === 'number' && product.salePrice < product.regularPrice;
  const activePrice = isDiscounted ? product.salePrice! : product.regularPrice;
  const discountPercent = isDiscounted
    ? Math.round(((product.regularPrice - product.salePrice!) / product.regularPrice) * 100)
    : 0;

  const isOutOfStock = product.stockQuantity <= 0;
  const hasVariants = Boolean(product.variants && product.variants.length > 0);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking an action button, do not navigate
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/product/${product.slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasVariants) {
      // If product has variants, prompt quick view so customer selects option
      setQuickViewProduct(product);
    } else {
      addToCart(product, 1);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Stage */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {isDiscounted && (
            <span className="px-2.5 py-1 bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-sm">
              Save {discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-semibold uppercase rounded-md tracking-wider">
              Out of Stock
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-emerald-800 text-[10px] font-medium rounded-md shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          )}
        </div>

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-0 bg-stone-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={handleQuickView}
            className="flex items-center gap-2 bg-white/95 text-stone-900 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg hover:bg-white hover:scale-105 transition-all transform translate-y-2 group-hover:translate-y-0"
            title="Quick Preview"
          >
            <Eye className="w-3.5 h-3.5 text-stone-700" />
            Quick View
          </button>
        </div>
      </div>

      {/* Content Block */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
            <span className="truncate pr-2">{product.category}</span>
            <span className="text-stone-400 font-mono shrink-0">{product.sku}</span>
          </div>

          <h3 className="font-serif text-sm sm:text-base font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
            {product.title}
          </h3>

          <p className="text-xs text-stone-500 mt-1 line-clamp-1">
            {product.brand} {hasVariants && `• ${product.variants?.length} Options`}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          {/* Price display */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-stone-950">
                {settings.currencySymbol} {activePrice.toLocaleString()}
              </span>
              {isDiscounted && (
                <span className="text-xs text-stone-400 line-through">
                  {settings.currencySymbol} {product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.weightKg > 0 && (
              <span className="text-[10px] text-stone-400">
                Weight: {product.weightKg} kg
              </span>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-amber-700 active:scale-95 shadow-sm'
            }`}
            title={hasVariants ? 'Select Variant' : 'Add to Cart'}
          >
            <ShoppingBag className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {hasVariants ? 'Options' : 'Add to Bag'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
