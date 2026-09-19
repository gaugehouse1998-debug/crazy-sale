import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Zap, MessageSquare, Truck, ShieldCheck, 
  RotateCcw, ArrowLeft, Star, Sparkles, Check, Share2, Info 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { ProductCard } from '../components/common/ProductCard';
import { Product, ProductVariant } from '../types';
import { updateSEO } from '../utils/seo';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const { products, addToCart, settings, openWhatsApp, addToast } = useStore();
  const { navigate } = useRouter();

  const product = products.find((p) => p.slug === slug);

  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0] || '');
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setQuantity(1);

      // Dynamic SEO & Structured Data
      const price = typeof product.salePrice === 'number' && product.salePrice < product.regularPrice
        ? product.salePrice
        : product.regularPrice;

      updateSEO({
        title: `${product.title}`,
        description: product.description.slice(0, 160),
        image: product.images[0],
        type: 'product',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          image: product.images,
          description: product.description,
          sku: product.sku,
          brand: {
            '@type': 'Brand',
            name: product.brand,
          },
          offers: {
            '@type': 'Offer',
            url: window.location.href,
            priceCurrency: 'PKR',
            price: price,
            availability: product.stockQuantity > 0 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: settings.storeName,
            },
          },
        },
      });
    }
  }, [product, settings]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Product Not Found</h2>
        <p className="text-xs text-stone-500">The product you are looking for may have been moved or is no longer available.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>
      </div>
    );
  }

  // Price calculations
  const effectiveRegularPrice = selectedVariant?.regularPrice ?? product.regularPrice;
  const effectiveSalePrice = selectedVariant?.salePrice ?? product.salePrice;
  const isDiscounted = typeof effectiveSalePrice === 'number' && effectiveSalePrice < effectiveRegularPrice;
  const activePrice = isDiscounted ? effectiveSalePrice! : effectiveRegularPrice;
  const discountPercent = isDiscounted
    ? Math.round(((effectiveRegularPrice - effectiveSalePrice!) / effectiveRegularPrice) * 100)
    : 0;

  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const isOutOfStock = currentStock <= 0;

  // Handle Actions
  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    const success = addToCart(product, quantity, selectedVariant);
    if (success) {
      navigate('/checkout');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('info', 'Link Copied', 'Product link copied to clipboard.');
    }
  };

  // Related products
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id && p.isPublished)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <button onClick={() => navigate('/')} className="hover:text-stone-900">Home</button>
        <span>/</span>
        <button onClick={() => navigate('/catalog')} className="hover:text-stone-900">Catalog</button>
        <span>/</span>
        <button 
          onClick={() => navigate(`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`)} 
          className="hover:text-stone-900"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-stone-900 font-medium truncate max-w-[200px] sm:max-w-none">
          {product.title}
        </span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <img
              src={activeImage || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />

            {/* Discount / Featured Badge */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {isDiscounted && (
                <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                  Save {discountPercent}% Off
                </span>
              )}
              {product.isFeatured && (
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Featured Royal Piece
                </span>
              )}
            </div>

            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-stone-700 rounded-full shadow-sm backdrop-blur-xs transition-colors"
              title="Share Product Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === img
                      ? 'border-stone-950 scale-102 shadow-sm'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info, Price, Variants & Add to Cart */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1.5">
              <span className="uppercase tracking-wider">{product.category}</span>
              <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                SKU: {selectedVariant?.sku || product.sku}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950 leading-tight">
              {product.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
              Brand: <span className="font-semibold text-stone-800">{product.brand}</span>
            </p>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-stone-950">
                {settings.currencySymbol} {activePrice.toLocaleString()}
              </span>
              {isDiscounted && (
                <span className="text-base text-stone-400 line-through">
                  {settings.currencySymbol} {effectiveRegularPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock State */}
            <div className="text-xs">
              {isOutOfStock ? (
                <span className="text-rose-600 font-semibold px-2.5 py-1 rounded bg-rose-50 border border-rose-200">
                  Out of Stock
                </span>
              ) : (
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available: {currentStock} in Stock
                </span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Choose Configuration / Variant:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image) setActiveImage(v.image);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-stone-700">Quantity:</span>
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold min-w-10 text-center text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex items-center justify-center gap-2 bg-stone-900 text-white py-3.5 px-6 rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-98 transition-all shadow-sm disabled:bg-stone-200 disabled:text-stone-400"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 py-3.5 px-6 rounded-xl text-xs font-bold active:scale-98 transition-all shadow-sm disabled:opacity-40"
              >
                <Zap className="w-4 h-4 fill-stone-950" />
                <span>Instant Checkout</span>
              </button>
            </div>

            {/* Direct WhatsApp Ordering */}
            <button
              onClick={() =>
                openWhatsApp({
                  product,
                  variantName: selectedVariant?.name,
                })
              }
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 py-3 px-4 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Ask Questions or Confirm on WhatsApp</span>
            </button>
          </div>

          {/* Delivery & Breakage Guarantee Box */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2.5 text-xs text-stone-700">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900">Door-to-Door Courier & Cargo:</span>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  TCS / Trax courier (250 PKR/kg) or heavy goods cargo (120 PKR/kg) available at checkout.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900">Breakage Protection Guarantee:</span>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  Double corrugated carton packaging with industrial air bubbles. If any item arrives cracked, share parcel unboxing video within 24 hours for instant replacement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-8">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900 mb-3">
            Product Description & Craftsmanship
          </h3>
          <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Specifications Table */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="pt-6 border-t border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
              Technical Specifications & Dimensions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.specifications.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs"
                >
                  <span className="text-stone-500 font-medium">{spec.label}</span>
                  <span className="font-semibold text-stone-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Related Tableware & Decor
            </h3>
            <button
              onClick={() => navigate(`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950"
            >
              View More in {product.category}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
